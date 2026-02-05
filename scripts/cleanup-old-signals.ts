/**
 * Quick Database Cleanup Script
 * Run this to clear all old non-validated signals from the database
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupOldSignals() {
    console.log('🧹 Starting cleanup of old signals...\n');

    // Step 1: Preview what will be deleted
    console.log('📊 PREVIEW: Checking signals to be deleted...');
    const { data: preview, error: previewError } = await supabase
        .from('signals')
        .select('id, created_at, status, disease_name, location_country')
        .lt('created_at', new Date().toISOString().split('T')[0]) // Before today
        .neq('status', 'validated');

    if (previewError) {
        console.error('❌ Error fetching preview:', previewError);
        return;
    }

    console.log(`Found ${preview?.length || 0} signals to delete:\n`);

    // Group by date and status
    const grouped = (preview || []).reduce((acc, signal) => {
        const date = signal.created_at.split('T')[0];
        const key = `${date}-${signal.status}`;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    Object.entries(grouped).forEach(([key, count]) => {
        console.log(`  ${key}: ${count} signals`);
    });

    // Step 2: Execute deletion
    console.log('\n🗑️  Deleting old non-validated signals...');
    const { error: deleteError } = await supabase
        .from('signals')
        .delete()
        .lt('created_at', new Date().toISOString().split('T')[0])
        .neq('status', 'validated');

    if (deleteError) {
        console.error('❌ Error deleting signals:', deleteError);
        return;
    }

    console.log(`✅ Successfully deleted ${preview?.length || 0} old signals\n`);

    // Step 3: Show remaining signals
    console.log('📊 AFTER CLEANUP: Remaining signals...');
    const { data: remaining, error: remainingError } = await supabase
        .from('signals')
        .select('created_at, status')
        .order('created_at', { ascending: false });

    if (remainingError) {
        console.error('❌ Error fetching remaining signals:', remainingError);
        return;
    }

    const remainingGrouped = (remaining || []).reduce((acc, signal) => {
        const date = signal.created_at.split('T')[0];
        const key = `${date}-${signal.status}`;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    Object.entries(remainingGrouped).forEach(([key, count]) => {
        console.log(`  ${key}: ${count} signals`);
    });

    console.log(`\n✨ Total remaining signals: ${remaining?.length || 0}`);
    console.log('🎯 Cleanup complete!\n');
}

cleanupOldSignals().catch(console.error);
