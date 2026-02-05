import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupDuplicates() {
    console.log('🧹 Starting deduplication...');

    // 1. Identify duplicates
    const { data: signals } = await supabase
        .from('signals')
        .select('id, original_text, created_at')
        .order('created_at', { ascending: true }); // Oldest first

    if (!signals) return;

    const seen = new Set();
    const toDelete = [];

    for (const signal of signals) {
        // fast hash or just string comparison
        const key = signal.original_text;
        if (seen.has(key)) {
            toDelete.push(signal.id);
        } else {
            seen.add(key);
        }
    }

    console.log(`Found ${toDelete.length} duplicates to remove.`);

    if (toDelete.length > 0) {
        // Delete in batches of 100
        for (let i = 0; i < toDelete.length; i += 100) {
            const batch = toDelete.slice(i, i + 100);
            const { error } = await supabase
                .from('signals')
                .delete()
                .in('id', batch);

            if (error) console.error('Error deleting batch:', error);
            else console.log(`Deleted batch ${i}-${i + batch.length}`);
        }
    }
}

// Just log for now if run directly, but the main work is the SQL migration
console.log("Use the SQL query in Supabase Editor for best results.");
