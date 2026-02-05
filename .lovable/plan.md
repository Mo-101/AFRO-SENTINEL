

## Implementation Plan: AI Virtual Analyst for Auto-Triage + Azure DB Migration

### Overview
Create an automated AI-powered triage system that continuously processes pending signals using intelligent decision-making, plus migrate validated/dismissed signals to Azure PostgreSQL for archival and scale.

---

### Architecture

```text
┌────────────────────────────────────────────────────────────────────────────────┐
│                         AFRO SENTINEL AUTO-TRIAGE ENGINE                       │
├────────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│  ┌──────────────┐     ┌─────────────────┐     ┌────────────────────────────┐  │
│  │   Supabase   │     │   auto-triage   │     │     Azure PostgreSQL       │  │
│  │   signals    ├────>│   Edge Function ├────>│     (archive storage)      │  │
│  │  status=new  │     │   (AI Analyst)  │     │     10,000+ signals        │  │
│  └──────────────┘     └────────┬────────┘     └────────────────────────────┘  │
│                                │                                               │
│                                v                                               │
│                    ┌───────────────────────┐                                  │
│                    │   Triage Decision     │                                  │
│                    │   VALIDATE | DISMISS  │                                  │
│                    │   | ESCALATE to Human │                                  │
│                    └───────────────────────┘                                  │
│                                                                                │
└────────────────────────────────────────────────────────────────────────────────┘
```

---

### Phase 1: Create AI Virtual Analyst Edge Function

**File: `supabase/functions/auto-triage/index.ts`** (NEW)

This function acts as a virtual WHO/CDC analyst that:
1. Fetches batch of pending signals (status='new')
2. Uses AI to evaluate each signal using epidemiological criteria
3. Makes triage decisions: validate, dismiss, or flag for human review
4. Updates signal status with AI-generated analyst notes

**Core Logic:**
```typescript
// AI prompt for virtual analyst
const VIRTUAL_ANALYST_PROMPT = `You are a WHO-certified disease surveillance analyst.
Evaluate this outbreak signal and decide:

1. VALIDATE - Credible threat requiring attention
   Criteria: Official source, confirmed cases/deaths, named disease, 
   specific location, recent timeframe

2. DISMISS - Noise, duplicate, or non-actionable
   Criteria: Political content, old news, no disease mentioned,
   funding announcements, opinion pieces

3. ESCALATE - Requires human analyst review
   Criteria: Ambiguous, high-stakes but uncertain,
   potential false negative risk

Return JSON: {
  decision: "validate" | "dismiss" | "escalate",
  confidence: 0-100,
  reasoning: "brief explanation",
  priority_adjustment: null | "P1" | "P2" | "P3" | "P4"
}`;

// Process signals in batches
async function triageSignalBatch(supabase, signals) {
  const results = { validated: 0, dismissed: 0, escalated: 0 };
  
  for (const signal of signals) {
    const analysis = await callAI(signal.original_text, signal.translated_text);
    
    if (analysis.decision === 'validate') {
      await supabase.from('signals').update({
        status: 'validated',
        validated_at: new Date().toISOString(),
        analyst_notes: `[AI TRIAGE] ${analysis.reasoning}`,
        priority: analysis.priority_adjustment || signal.priority
      }).eq('id', signal.id);
      results.validated++;
    } else if (analysis.decision === 'dismiss') {
      await supabase.from('signals').update({
        status: 'dismissed',
        validated_at: new Date().toISOString(),
        analyst_notes: `[AI DISMISSED] ${analysis.reasoning}`
      }).eq('id', signal.id);
      results.dismissed++;
    }
    // escalated signals stay as 'new' for human review
  }
  return results;
}
```

**Features:**
- Batch processing (50 signals per run)
- Rate limiting aware (uses both Azure OpenAI and Lovable AI fallback)
- Conservative decision-making (high-stakes signals escalate to humans)
- Full audit trail via analyst_notes
- Scheduled via cron or called from dashboard

---

### Phase 2: Azure PostgreSQL Archive Migration

**File: `supabase/functions/sync-to-azure/index.ts`** (NEW)

Migrate processed signals to Azure PostgreSQL for long-term storage:

```typescript
// Connect to Azure PostgreSQL
const azurePool = new Pool({
  host: Deno.env.get('AZURE_PG_HOST'),
  database: Deno.env.get('AZURE_PG_DATABASE'),
  user: Deno.env.get('AZURE_PG_USER'),
  password: Deno.env.get('AZURE_PG_PASSWORD'),
  port: 5432,
  ssl: true
});

// Sync validated/dismissed signals to Azure
async function syncToAzure(supabase) {
  // Get signals ready for archive (validated or dismissed, older than 7 days)
  const { data: signals } = await supabase
    .from('signals')
    .select('*')
    .in('status', ['validated', 'dismissed'])
    .lt('validated_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .limit(500);
  
  // Insert into Azure PostgreSQL
  for (const signal of signals) {
    await azurePool.query(
      `INSERT INTO signals_archive (...) VALUES (...) ON CONFLICT DO NOTHING`,
      [signal values...]
    );
  }
  
  // Optionally delete from Supabase to free space
  // await supabase.from('signals').delete().in('id', archivedIds);
}
```

**Azure Table Schema:**
```sql
CREATE TABLE signals_archive (
  id UUID PRIMARY KEY,
  original_text TEXT,
  disease_name TEXT,
  location_country TEXT,
  priority VARCHAR(4),
  status VARCHAR(20),
  created_at TIMESTAMPTZ,
  validated_at TIMESTAMPTZ,
  analyst_notes TEXT,
  -- ... all other columns
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_signals_archive_country ON signals_archive(location_country);
CREATE INDEX idx_signals_archive_disease ON signals_archive(disease_name);
CREATE INDEX idx_signals_archive_created ON signals_archive(created_at DESC);
```

---

### Phase 3: Create Dashboard Triage Control Panel

**File: `src/components/dashboard/AutoTriagePanel.tsx`** (NEW)

Add control panel to manually trigger auto-triage and monitor progress:

```tsx
export function AutoTriagePanel() {
  const [isRunning, setIsRunning] = useState(false);
  const [stats, setStats] = useState<TriageStats | null>(null);

  const runAutoTriage = async () => {
    setIsRunning(true);
    const response = await supabase.functions.invoke('auto-triage', {
      body: { batchSize: 50 }
    });
    setStats(response.data);
    setIsRunning(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          AI Virtual Analyst
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={runAutoTriage} disabled={isRunning}>
          {isRunning ? <Loader2 className="animate-spin" /> : 'Run Auto-Triage'}
        </Button>
        
        {stats && (
          <div className="mt-4 grid grid-cols-3 gap-2">
            <Stat label="Validated" value={stats.validated} color="green" />
            <Stat label="Dismissed" value={stats.dismissed} color="red" />
            <Stat label="Escalated" value={stats.escalated} color="amber" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

---

### Phase 4: Fix Stats & Real-Time Display Issues

From the previous approved plan, these fixes are still needed:

**Database Migration - Add aggregation functions:**
```sql
-- Bypass 1000-row limit with server-side aggregation
CREATE OR REPLACE FUNCTION get_signal_priority_counts()
RETURNS TABLE(priority text, count bigint) 
LANGUAGE sql STABLE
AS $$
  SELECT priority::text, COUNT(*) FROM signals GROUP BY priority
$$;

CREATE OR REPLACE FUNCTION get_signal_status_counts()
RETURNS TABLE(status text, count bigint)
LANGUAGE sql STABLE  
AS $$
  SELECT status::text, COUNT(*) FROM signals GROUP BY status
$$;

-- Fix RLS for real-time feed visibility
DROP POLICY IF EXISTS "Viewers can see validated signals" ON signals;
CREATE POLICY "Authenticated users can view all signals"
  ON signals FOR SELECT USING (auth.uid() IS NOT NULL);
```

**File: `src/hooks/useSignals.tsx`** (EDIT)
- Add `useSignalTrends()` hook for real percentage calculations
- Rewrite `useSignalStats()` to use RPC aggregation

**File: `src/components/dashboard/ExecutiveCards.tsx`** (EDIT)
- Replace hardcoded `trend={12}` with real trend values

---

### Phase 5: Scheduled Auto-Triage (Background Processing)

Configure the auto-triage function to run automatically:

**Option A: Supabase pg_cron (if available)**
```sql
SELECT cron.schedule(
  'auto-triage-hourly',
  '0 * * * *',  -- Every hour
  $$SELECT net.http_post(
    'https://jndkoglwwubglslojdic.supabase.co/functions/v1/auto-triage',
    '{"batchSize": 100}',
    '{"Content-Type":"application/json"}'
  )$$
);
```

**Option B: External Trigger**
Use the dashboard's Auto-Triage button or set up external scheduler to call the function.

---

### Files Summary

| Action | File | Description |
|--------|------|-------------|
| CREATE | `supabase/functions/auto-triage/index.ts` | AI Virtual Analyst for automated signal triage |
| CREATE | `supabase/functions/sync-to-azure/index.ts` | Archive processed signals to Azure PostgreSQL |
| CREATE | `src/components/dashboard/AutoTriagePanel.tsx` | Dashboard control panel for auto-triage |
| EDIT | `src/hooks/useSignals.tsx` | Fix stats aggregation and add trends |
| EDIT | `src/components/dashboard/ExecutiveCards.tsx` | Use real trend values |
| EDIT | `src/pages/Index.tsx` | Add AutoTriagePanel to dashboard |
| EDIT | `supabase/config.toml` | Add new edge functions |
| DB | Migration | Add aggregation functions and fix RLS policies |

---

### Expected Results

| Before | After |
|--------|-------|
| 7,384 signals stuck as "new" | Automated triage processes 100+/hour |
| Hardcoded "12%" trends | Real 24h percentage changes |
| Stats capped at 1000 | Accurate counts (7,389+) |
| RLS blocks live feed | Real-time signals visible to all authenticated users |
| No archive strategy | Azure PostgreSQL stores 10,000+ historical signals |
| Manual-only triage | AI + Human hybrid workflow |

---

### AI Triage Decision Criteria

The virtual analyst will use WHO/CDC-aligned criteria:

**Auto-VALIDATE when:**
- Source tier 1-2 (WHO, Africa CDC, MoH)
- Confirmed case/death numbers mentioned
- Named disease + specific location
- Priority P1 or P2 with confidence > 70%

**Auto-DISMISS when:**
- Purely political content
- Funding/budget news without outbreak context
- Opinion pieces or editorials
- Duplicate of recent validated signal
- Confidence < 40%

**ESCALATE to human when:**
- Unknown disease with severe symptoms
- Cross-border risk flagged
- Conflicting information
- High-priority but low confidence

