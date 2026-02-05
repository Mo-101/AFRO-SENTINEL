 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
 import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
 };
 
 const VIRTUAL_ANALYST_PROMPT = `You are a WHO-certified disease surveillance analyst specializing in outbreak detection for the African region (AFRO).
 
 Evaluate this outbreak signal and decide:
 
 1. VALIDATE - Credible threat requiring attention
    Criteria:
    - Official source (WHO, Africa CDC, Ministry of Health, reputable news)
    - Confirmed or suspected cases/deaths mentioned
    - Named disease or clear disease symptoms described
    - Specific location mentioned (country, region, city)
    - Recent timeframe (within last 30 days)
    - P1 or P2 priority signals with outbreak indicators
 
 2. DISMISS - Noise, duplicate, or non-actionable
    Criteria:
    - Purely political content without health relevance
    - Old news (>30 days) without ongoing outbreak
    - No disease or health emergency mentioned
    - Funding/budget announcements without outbreak context
    - Opinion pieces, editorials, or social media noise
    - General health advice without outbreak context
    - Duplicate information (same event already reported)
 
 3. ESCALATE - Requires human analyst review
    Criteria:
    - Unknown disease with severe symptoms
    - Cross-border outbreak risk
    - Conflicting or ambiguous information
    - High-priority but low confidence assessment
    - Potential high-consequence pathogen (VHF, respiratory)
    - Mass gathering or displacement context
 
 Return ONLY valid JSON with NO markdown or extra text:
 {
   "decision": "validate" | "dismiss" | "escalate",
   "confidence": 0-100,
   "reasoning": "brief 1-2 sentence explanation",
   "priority_adjustment": null | "P1" | "P2" | "P3" | "P4"
 }`;
 
 interface TriageDecision {
   decision: "validate" | "dismiss" | "escalate";
   confidence: number;
   reasoning: string;
   priority_adjustment: string | null;
 }
 
 interface Signal {
   id: string;
   original_text: string;
   translated_text: string | null;
   source_name: string;
   source_tier: string;
   disease_name: string | null;
   disease_category: string | null;
   location_country: string;
   priority: string;
   confidence_score: number;
   cross_border_risk: boolean | null;
 }
 
 async function callAI(signal: Signal): Promise<TriageDecision> {
   const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
   const AZURE_OPENAI_ENDPOINT = Deno.env.get("AZURE_OPENAI_ENDPOINT");
   const AZURE_OPENAI_API_KEY = Deno.env.get("AZURE_OPENAI_API_KEY");
   const AZURE_OPENAI_DEPLOYMENT = Deno.env.get("AZURE_OPENAI_DEPLOYMENT");
   const AZURE_OPENAI_API_VERSION = Deno.env.get("AZURE_OPENAI_API_VERSION");
 
   const signalContext = `
 SIGNAL TO EVALUATE:
 Source: ${signal.source_name} (Tier: ${signal.source_tier})
 Country: ${signal.location_country}
 Disease: ${signal.disease_name || "Unknown"}
 Category: ${signal.disease_category || "Unknown"}
 Current Priority: ${signal.priority}
 Confidence Score: ${signal.confidence_score}%
 Cross-Border Risk: ${signal.cross_border_risk ? "Yes" : "No"}
 
 ORIGINAL TEXT:
 ${signal.original_text}
 
 ${signal.translated_text ? `TRANSLATED TEXT:\n${signal.translated_text}` : ""}
 `;
 
   // Try Azure OpenAI first (specialized for outbreak analysis)
   if (AZURE_OPENAI_ENDPOINT && AZURE_OPENAI_API_KEY && AZURE_OPENAI_DEPLOYMENT) {
     try {
       const azureUrl = `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${AZURE_OPENAI_DEPLOYMENT}/chat/completions?api-version=${AZURE_OPENAI_API_VERSION || "2024-02-15-preview"}`;
       
       const response = await fetch(azureUrl, {
         method: "POST",
         headers: {
           "Content-Type": "application/json",
           "api-key": AZURE_OPENAI_API_KEY,
         },
         body: JSON.stringify({
           messages: [
             { role: "system", content: VIRTUAL_ANALYST_PROMPT },
             { role: "user", content: signalContext },
           ],
           temperature: 0.2,
           max_tokens: 300,
         }),
       });
 
       if (response.ok) {
         const data = await response.json();
         const content = data.choices?.[0]?.message?.content;
         if (content) {
           const parsed = JSON.parse(content.trim());
           console.log(`[Azure AI] Signal ${signal.id}: ${parsed.decision} (${parsed.confidence}%)`);
           return parsed as TriageDecision;
         }
       } else {
         console.warn(`Azure OpenAI failed with status ${response.status}, falling back to Lovable AI`);
       }
     } catch (error) {
       console.warn("Azure OpenAI error, falling back to Lovable AI:", error);
     }
   }
 
   // Fallback to Lovable AI
   if (LOVABLE_API_KEY) {
     try {
       const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
         method: "POST",
         headers: {
           Authorization: `Bearer ${LOVABLE_API_KEY}`,
           "Content-Type": "application/json",
         },
         body: JSON.stringify({
           model: "google/gemini-3-flash-preview",
           messages: [
             { role: "system", content: VIRTUAL_ANALYST_PROMPT },
             { role: "user", content: signalContext },
           ],
           temperature: 0.2,
           max_tokens: 300,
         }),
       });
 
       if (response.ok) {
         const data = await response.json();
         const content = data.choices?.[0]?.message?.content;
         if (content) {
           // Clean markdown code blocks if present
           const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
           const parsed = JSON.parse(cleaned);
           console.log(`[Lovable AI] Signal ${signal.id}: ${parsed.decision} (${parsed.confidence}%)`);
           return parsed as TriageDecision;
         }
       } else {
         const errorText = await response.text();
         console.error("Lovable AI error:", response.status, errorText);
       }
     } catch (error) {
       console.error("Lovable AI error:", error);
     }
   }
 
   // Conservative fallback: escalate to human
   console.log(`[Fallback] Signal ${signal.id}: escalated (no AI available)`);
   return {
     decision: "escalate",
     confidence: 0,
     reasoning: "AI service unavailable - escalating for human review",
     priority_adjustment: null,
   };
 }
 
 async function triageSignalBatch(
   supabase: SupabaseClient,
   signals: Signal[]
 ): Promise<{ validated: number; dismissed: number; escalated: number; errors: number }> {
   const results = { validated: 0, dismissed: 0, escalated: 0, errors: 0 };
 
   for (const signal of signals) {
     try {
       // Add small delay between calls to respect rate limits
       await new Promise((resolve) => setTimeout(resolve, 200));
 
       const analysis = await callAI(signal);
 
       if (analysis.decision === "validate") {
         const { error } = await supabase
           .from("signals")
           .update({
             status: "validated",
             validated_at: new Date().toISOString(),
             analyst_notes: `[AI TRIAGE] ${analysis.reasoning} (Confidence: ${analysis.confidence}%)`,
             priority: analysis.priority_adjustment || signal.priority,
           })
           .eq("id", signal.id);
 
         if (error) {
           console.error(`Error updating signal ${signal.id}:`, error);
           results.errors++;
         } else {
           results.validated++;
         }
       } else if (analysis.decision === "dismiss") {
         const { error } = await supabase
           .from("signals")
           .update({
             status: "dismissed",
             validated_at: new Date().toISOString(),
             analyst_notes: `[AI DISMISSED] ${analysis.reasoning} (Confidence: ${analysis.confidence}%)`,
           })
           .eq("id", signal.id);
 
         if (error) {
           console.error(`Error updating signal ${signal.id}:`, error);
           results.errors++;
         } else {
           results.dismissed++;
         }
       } else {
         // Escalated signals stay as 'new' for human review, but add a note
         const { error } = await supabase
           .from("signals")
           .update({
             analyst_notes: `[AI ESCALATED] ${analysis.reasoning} - Requires human review`,
           })
           .eq("id", signal.id);
 
         if (error) {
           console.error(`Error updating signal ${signal.id}:`, error);
           results.errors++;
         } else {
           results.escalated++;
         }
       }
     } catch (error) {
       console.error(`Error processing signal ${signal.id}:`, error);
       results.errors++;
     }
   }
 
   return results;
 }
 
 serve(async (req) => {
   if (req.method === "OPTIONS") {
     return new Response(null, { headers: corsHeaders });
   }
 
   try {
     const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
     const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
     const supabase = createClient(supabaseUrl, supabaseServiceKey);
 
     // Parse request body for optional parameters
     let batchSize = 50;
     let priorityFilter: string[] | null = null;
 
     try {
       const body = await req.json();
       if (body.batchSize && typeof body.batchSize === "number") {
         batchSize = Math.min(body.batchSize, 100); // Cap at 100
       }
       if (body.priority && Array.isArray(body.priority)) {
         priorityFilter = body.priority;
       }
     } catch {
       // No body or invalid JSON, use defaults
     }
 
     console.log(`[auto-triage] Starting batch of ${batchSize} signals...`);
 
     // Fetch pending signals (status='new')
     let query = supabase
       .from("signals")
       .select("id, original_text, translated_text, source_name, source_tier, disease_name, disease_category, location_country, priority, confidence_score, cross_border_risk")
       .eq("status", "new")
       .order("priority", { ascending: true }) // P1 first, then P2, P3, P4
       .order("created_at", { ascending: false })
       .limit(batchSize);
 
     if (priorityFilter) {
       query = query.in("priority", priorityFilter);
     }
 
     const { data: signals, error: fetchError } = await query;
 
     if (fetchError) {
       console.error("Error fetching signals:", fetchError);
       return new Response(
         JSON.stringify({ error: "Failed to fetch signals", details: fetchError.message }),
         { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     if (!signals || signals.length === 0) {
       console.log("[auto-triage] No pending signals to process");
       return new Response(
         JSON.stringify({
           message: "No pending signals to process",
           results: { validated: 0, dismissed: 0, escalated: 0, errors: 0 },
         }),
         { headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     console.log(`[auto-triage] Processing ${signals.length} signals...`);
 
     const results = await triageSignalBatch(supabase, signals as Signal[]);
 
     console.log(`[auto-triage] Complete:`, results);
 
     return new Response(
       JSON.stringify({
         message: `Processed ${signals.length} signals`,
         results,
       }),
       { headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
   } catch (error) {
     console.error("[auto-triage] Unexpected error:", error);
     return new Response(
       JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
       { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
   }
 });