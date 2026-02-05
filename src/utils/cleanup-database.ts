import { supabase } from '@/integrations/supabase/client';

/**
 * Database Cleanup Utility
 * Deletes all non-validated signals from previous days
 */

async function cleanupOldSignals() {
    console.log('🧹 Starting database cleanup...\n');

    try {
        // Step 1: Preview what will be deleted
        console.log('📊 Fetching signals to delete...');
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

        const { data: toDelete, error: previewError } = await supabase
            .from('signals')
            .select('id, created_at, status, disease_name, location_country')
            .lt('created_at', today + 'T00:00:00') // Before today
            .neq('status', 'validated');

        if (previewError) {
            console.error('❌ Error fetching preview:', previewError);
            return { success: false, error: previewError };
        }

        console.log(`\n📋 Found ${toDelete?.length || 0} signals to delete:`);

        // Group by date and status for reporting
        const grouped = (toDelete || []).reduce((acc, signal) => {
            const date = signal.created_at.split('T')[0];
            const key = `${date} (${signal.status})`;
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        Object.entries(grouped).forEach(([key, count]) => {
            console.log(`  • ${key}: ${count} signals`);
        });

        if ((toDelete?.length || 0) === 0) {
            console.log('\n✨ No old signals to delete. Database is clean!');
            return { success: true, deleted: 0, message: 'No old signals found' };
        }

        // Step 2: Execute deletion
        console.log('\n🗑️  Deleting old non-validated signals...');
        const { error: deleteError, count } = await supabase
            .from('signals')
            .delete({ count: 'exact' })
            .lt('created_at', today + 'T00:00:00')
            .neq('status', 'validated');

        if (deleteError) {
            console.error('❌ Error deleting signals:', deleteError);
            return { success: false, error: deleteError };
        }

        console.log(`✅ Successfully deleted ${count || toDelete?.length || 0} old signals\n`);

        // Step 3: Show remaining signals
        console.log('📊 Remaining signals in database:');
        const { data: remaining, error: remainingError } = await supabase
            .from('signals')
            .select('created_at, status');

        if (remainingError) {
            console.error('❌ Error fetching remaining signals:', remainingError);
        } else {
            const remainingGrouped = (remaining || []).reduce((acc, signal) => {
                const date = signal.created_at.split('T')[0];
                const key = `${date} (${signal.status})`;
                acc[key] = (acc[key] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            Object.entries(remainingGrouped).forEach(([key, count]) => {
                console.log(`  • ${key}: ${count} signals`);
            });

            console.log(`\n✨ Total remaining: ${remaining?.length || 0} signals`);
        }

        return {
            success: true,
            deleted: count || toDelete?.length || 0,
            remaining: remaining?.length || 0,
            message: 'Cleanup completed successfully'
        };

    } catch (error) {
        console.error('❌ Fatal error during cleanup:', error);
        return { success: false, error };
    }
}

// Export for use in other files
export { cleanupOldSignals };

// Auto-run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    cleanupOldSignals()
        .then(result => {
            console.log('\n🎯 Cleanup Result:', result);
            process.exit(result.success ? 0 : 1);
        })
        .catch(err => {
            console.error('Fatal error:', err);
            process.exit(1);
        });
}
