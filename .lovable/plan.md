

## Fix Plan: Replace Hardcoded Data with Real-Time Intelligence

### Overview
Address three critical issues:
1. Live feed not updating (RLS blocking real-time for `new` signals)
2. Hardcoded trend percentages in Executive Cards
3. Stats capped at 1000 due to Supabase default limit

---

### Phase 1: Fix Real-Time Feed Visibility

**Root Cause**: The RLS policy only allows viewers to see `validated` signals, but 99.9% of signals are `status = 'new'`. The real-time subscription respects RLS, so viewers see nothing.

**Solution**: Create a more permissive SELECT policy for authenticated users to see recent signals (for live feed awareness) while keeping full access for analysts/admins.

**Database Migration:**
```sql
-- Drop restrictive policy
DROP POLICY IF EXISTS "Viewers can see validated signals" ON signals;

-- Create new policy: authenticated users can see ALL signals (for live awareness)
-- Analysts/admins retain full access
CREATE POLICY "Authenticated users can view all signals"
  ON signals FOR SELECT
  USING (
    auth.uid() IS NOT NULL
  );
```

**Note**: This change enables the live feed for all authenticated users. The current workflow relies on analysts/admins to validate signals, so raw signals being visible doesn't expose sensitive triage decisions.

---

### Phase 2: Fix Stats 1000-Row Limit

**File: `src/hooks/useSignals.tsx`** (EDIT)

Replace client-side aggregation with database-level aggregation to bypass the 1000-row limit:

```typescript
export function useSignalStats() {
  return useQuery({
    queryKey: ['signal-stats'],
    queryFn: async () => {
      // Use COUNT aggregates to bypass row limit
      const [priorityResult, statusResult, totalResult] = await Promise.all([
        supabase.rpc('get_signal_priority_counts'),  // Create this function
        supabase.rpc('get_signal_status_counts'),    // Create this function
        supabase.from('signals').select('id', { count: 'exact', head: true })
      ]);
      
      // ... aggregate results
    },
  });
}
```

**Database Migration - Add aggregation functions:**
```sql
CREATE OR REPLACE FUNCTION get_signal_priority_counts()
RETURNS TABLE(priority text, count bigint) 
LANGUAGE sql STABLE
AS $$
  SELECT priority::text, COUNT(*) 
  FROM signals 
  GROUP BY priority
$$;

CREATE OR REPLACE FUNCTION get_signal_status_counts()
RETURNS TABLE(status text, count bigint)
LANGUAGE sql STABLE  
AS $$
  SELECT status::text, COUNT(*)
  FROM signals
  GROUP BY status
$$;
```

---

### Phase 3: Replace Hardcoded Trends with Real Calculations

**File: `src/hooks/useSignals.tsx`** (EDIT)

Add a new hook to compute real trends by comparing current period to previous period:

```typescript
export function useSignalTrends() {
  return useQuery({
    queryKey: ['signal-trends'],
    queryFn: async () => {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
      
      // Count signals in last 24h vs previous 24h
      const [current, previous] = await Promise.all([
        supabase
          .from('signals')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', oneDayAgo.toISOString()),
        supabase
          .from('signals')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', twoDaysAgo.toISOString())
          .lt('created_at', oneDayAgo.toISOString()),
      ]);
      
      const currentCount = current.count || 0;
      const previousCount = previous.count || 0;
      
      // Calculate percentage change
      const change = previousCount > 0 
        ? Math.round(((currentCount - previousCount) / previousCount) * 100)
        : 0;
      
      return { currentCount, previousCount, trendPercent: change };
    },
  });
}
```

**File: `src/components/dashboard/ExecutiveCards.tsx`** (EDIT)

Replace hardcoded `trend={12}` and `trend={8}` with real calculated values:

```typescript
export function ExecutiveCards() {
  const { data: stats, isLoading } = useSignalStats();
  const { data: trends } = useSignalTrends();  // NEW

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <ExecutiveCard
        label="Active Signals"
        value={stats?.total || 0}
        icon={<Radio className="w-5 h-5" />}
        trend={trends?.trendPercent}  // REAL VALUE
        highlight="default"
        isLoading={isLoading}
      />
      {/* ... similar for other cards */}
    </div>
  );
}
```

---

### Phase 4: Fix Random Local Language Selection

**File: `src/components/dashboard/IntelligenceInsights.tsx`** (EDIT)

Replace `Math.random()` selection with data-driven selection based on actual signal language distribution:

```typescript
// Instead of random selection:
// const altLang = altLanguages[Math.floor(Math.random() * altLanguages.length)];

// Use actual language distribution from signals:
const languageCounts = signals.reduce((acc, s) => {
  const lang = s.original_language?.toLowerCase() || '';
  if (lang && lang !== 'en' && lang !== 'english') {
    acc[lang] = (acc[lang] || 0) + 1;
  }
  return acc;
}, {} as Record<string, number>);

// Pick top 2 languages by count
const topLanguages = Object.entries(languageCounts)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 2)
  .map(([lang]) => langMap[lang])
  .filter(Boolean);
```

---

### Summary of Changes

| File | Change |
|------|--------|
| **Database Migration** | Add `get_signal_priority_counts()` and `get_signal_status_counts()` functions |
| **Database Migration** | Update RLS policy to allow authenticated users to see all signals |
| `src/hooks/useSignals.tsx` | Add `useSignalTrends()` hook for real trend calculation |
| `src/hooks/useSignals.tsx` | Rewrite `useSignalStats()` to use RPC aggregation (bypass 1000 limit) |
| `src/components/dashboard/ExecutiveCards.tsx` | Replace `trend={12}` and `trend={8}` with real trend values |
| `src/components/dashboard/IntelligenceInsights.tsx` | Replace `Math.random()` with data-driven language selection |

---

### Expected Results After Fix

1. **Live Feed**: Will show real-time signals streaming in (currently blocked by RLS)
2. **Stats**: Will show actual count (6943+) instead of capped 1000
3. **Trends**: Will show real 24h change percentage instead of hardcoded 12%/8%
4. **Local Insights**: Will prioritize languages actually present in signal data

