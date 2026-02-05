 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
 import { Pool } from "https://deno.land/x/postgres@v0.17.0/mod.ts";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
 };
 
 interface SyncResult {
   synced: number;
   deleted: number;
   errors: number;
   skipped: number;
 }
 
 serve(async (req) => {
   if (req.method === "OPTIONS") {
     return new Response(null, { headers: corsHeaders });
   }
 
   let azurePool: Pool | null = null;
 
   try {
     const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
     const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
     const supabase = createClient(supabaseUrl, supabaseServiceKey);
 
     // Azure PostgreSQL connection
     const azureHost = Deno.env.get("AZURE_PG_HOST");
     const azureDatabase = Deno.env.get("AZURE_PG_DATABASE");
     const azureUser = Deno.env.get("AZURE_PG_USER");
     const azurePassword = Deno.env.get("AZURE_PG_PASSWORD");
 
     if (!azureHost || !azureDatabase || !azureUser || !azurePassword) {
       return new Response(
         JSON.stringify({ error: "Azure PostgreSQL credentials not configured" }),
         { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     // Parse request body for optional parameters
     let batchSize = 500;
     let deleteAfterSync = false;
     let archiveAgeDays = 7;
 
     try {
       const body = await req.json();
       if (body.batchSize && typeof body.batchSize === "number") {
         batchSize = Math.min(body.batchSize, 1000);
       }
       if (typeof body.deleteAfterSync === "boolean") {
         deleteAfterSync = body.deleteAfterSync;
       }
       if (body.archiveAgeDays && typeof body.archiveAgeDays === "number") {
         archiveAgeDays = body.archiveAgeDays;
       }
     } catch {
       // No body or invalid JSON, use defaults
     }
 
     console.log(`[sync-to-azure] Starting sync (batch: ${batchSize}, delete: ${deleteAfterSync}, age: ${archiveAgeDays}d)...`);
 
     // Connect to Azure PostgreSQL
     azurePool = new Pool({
       hostname: azureHost,
       database: azureDatabase,
       user: azureUser,
       password: azurePassword,
       port: 5432,
       tls: { enabled: true, enforce: true },
     }, 3);
 
     // Test connection and ensure table exists
     const azureClient = await azurePool.connect();
     try {
       await azureClient.queryObject(`
         CREATE TABLE IF NOT EXISTS signals_archive (
           id UUID PRIMARY KEY,
           original_text TEXT,
           translated_text TEXT,
           disease_name TEXT,
           disease_category TEXT,
           location_country TEXT,
           location_country_iso TEXT,
           location_admin1 TEXT,
           location_admin2 TEXT,
           location_locality TEXT,
           location_lat DOUBLE PRECISION,
           location_lng DOUBLE PRECISION,
           priority VARCHAR(4),
           status VARCHAR(20),
           source_name TEXT,
           source_tier VARCHAR(10),
           source_type TEXT,
           source_url TEXT,
           source_timestamp TIMESTAMPTZ,
           signal_type TEXT,
           confidence_score NUMERIC,
           reported_cases INTEGER,
           reported_deaths INTEGER,
           affected_population TEXT,
           cross_border_risk BOOLEAN,
           analyst_notes TEXT,
           original_language TEXT,
           created_at TIMESTAMPTZ,
           updated_at TIMESTAMPTZ,
           validated_at TIMESTAMPTZ,
           triaged_at TIMESTAMPTZ,
           synced_at TIMESTAMPTZ DEFAULT NOW()
         );
         
         CREATE INDEX IF NOT EXISTS idx_signals_archive_country ON signals_archive(location_country);
         CREATE INDEX IF NOT EXISTS idx_signals_archive_disease ON signals_archive(disease_name);
         CREATE INDEX IF NOT EXISTS idx_signals_archive_created ON signals_archive(created_at DESC);
         CREATE INDEX IF NOT EXISTS idx_signals_archive_status ON signals_archive(status);
       `);
       console.log("[sync-to-azure] Azure table ensured");
     } finally {
       azureClient.release();
     }
 
     // Fetch signals ready for archive (validated or dismissed, older than archiveAgeDays)
     const archiveCutoff = new Date(Date.now() - archiveAgeDays * 24 * 60 * 60 * 1000).toISOString();
     
     const { data: signals, error: fetchError } = await supabase
       .from("signals")
       .select("*")
       .in("status", ["validated", "dismissed"])
       .lt("validated_at", archiveCutoff)
       .limit(batchSize);
 
     if (fetchError) {
       console.error("Error fetching signals:", fetchError);
       return new Response(
         JSON.stringify({ error: "Failed to fetch signals", details: fetchError.message }),
         { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     if (!signals || signals.length === 0) {
       console.log("[sync-to-azure] No signals to archive");
       return new Response(
         JSON.stringify({
           message: "No signals to archive",
           results: { synced: 0, deleted: 0, errors: 0, skipped: 0 },
         }),
         { headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     console.log(`[sync-to-azure] Syncing ${signals.length} signals...`);
 
     const results: SyncResult = { synced: 0, deleted: 0, errors: 0, skipped: 0 };
     const syncedIds: string[] = [];
 
     for (const signal of signals) {
       const client = await azurePool.connect();
       try {
         await client.queryObject(`
           INSERT INTO signals_archive (
             id, original_text, translated_text, disease_name, disease_category,
             location_country, location_country_iso, location_admin1, location_admin2,
             location_locality, location_lat, location_lng, priority, status,
             source_name, source_tier, source_type, source_url, source_timestamp,
             signal_type, confidence_score, reported_cases, reported_deaths,
             affected_population, cross_border_risk, analyst_notes, original_language,
             created_at, updated_at, validated_at, triaged_at, synced_at
           ) VALUES (
             $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
             $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27,
             $28, $29, $30, $31, NOW()
           ) ON CONFLICT (id) DO UPDATE SET
             status = EXCLUDED.status,
             analyst_notes = EXCLUDED.analyst_notes,
             validated_at = EXCLUDED.validated_at,
             synced_at = NOW()
         `, [
           signal.id,
           signal.original_text,
           signal.translated_text,
           signal.disease_name,
           signal.disease_category,
           signal.location_country,
           signal.location_country_iso,
           signal.location_admin1,
           signal.location_admin2,
           signal.location_locality,
           signal.location_lat,
           signal.location_lng,
           signal.priority,
           signal.status,
           signal.source_name,
           signal.source_tier,
           signal.source_type,
           signal.source_url,
           signal.source_timestamp,
           signal.signal_type,
           signal.confidence_score,
           signal.reported_cases,
           signal.reported_deaths,
           signal.affected_population,
           signal.cross_border_risk,
           signal.analyst_notes,
           signal.original_language,
           signal.created_at,
           signal.updated_at,
           signal.validated_at,
           signal.triaged_at,
         ]);
 
         results.synced++;
         syncedIds.push(signal.id);
       } catch (error) {
         console.error(`Error syncing signal ${signal.id}:`, error);
         results.errors++;
       } finally {
         client.release();
       }
     }
 
     // Optionally delete synced signals from Supabase to free space
     if (deleteAfterSync && syncedIds.length > 0) {
       const { error: deleteError } = await supabase
         .from("signals")
         .delete()
         .in("id", syncedIds);
 
       if (deleteError) {
         console.error("Error deleting synced signals:", deleteError);
       } else {
         results.deleted = syncedIds.length;
         console.log(`[sync-to-azure] Deleted ${syncedIds.length} signals from Supabase`);
       }
     }
 
     console.log(`[sync-to-azure] Complete:`, results);
 
     return new Response(
       JSON.stringify({
         message: `Synced ${results.synced} signals to Azure PostgreSQL`,
         results,
       }),
       { headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
   } catch (error) {
     console.error("[sync-to-azure] Unexpected error:", error);
     return new Response(
       JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
       { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
   } finally {
     if (azurePool) {
       await azurePool.end();
     }
   }
 });