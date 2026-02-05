import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        console.log('[daily-cleanup] Starting daily signal retention cleanup...');

        // Execute the cleanup function
        const { data, error } = await supabaseClient.rpc('cleanup_daily_signals');

        if (error) {
            console.error('[daily-cleanup] Error:', error);
            throw error;
        }

        const result = data?.[0] || { deleted_count: 0, validated_preserved: 0 };

        console.log(`[daily-cleanup] ✅ Cleanup complete:`, {
            deleted: result.deleted_count,
            preserved: result.validated_preserved,
            timestamp: new Date().toISOString(),
        });

        // Get retention stats for reporting
        const { data: stats, error: statsError } = await supabaseClient.rpc('get_signal_retention_stats');

        if (statsError) {
            console.error('[daily-cleanup] Stats error:', statsError);
        } else {
            const retention = stats?.[0] || {};
            console.log(`[daily-cleanup] 📊 Retention stats:`, retention);
        }

        return new Response(
            JSON.stringify({
                success: true,
                deleted: result.deleted_count,
                validated_preserved: result.validated_preserved,
                retention_stats: stats?.[0] || {},
                timestamp: new Date().toISOString(),
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        );
    } catch (error) {
        console.error('[daily-cleanup] Fatal error:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500,
            }
        );
    }
});
