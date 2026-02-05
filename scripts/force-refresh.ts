/**
 * Force Refresh Signal Stats
 * This script clears the React Query cache and forces a fresh fetch from the database
 */

// Add this to your browser console to force refresh the stats
// Or add a refresh button to the UI

export function forceRefreshStats() {
    // Clear React Query cache for signal stats
    window.location.reload();
}

// Instructions:
// 1. Open browser DevTools (F12)
// 2. Go to Console tab
// 3. Paste this and press Enter:
//    location.reload()
//
// This will force the app to re-fetch all data from the database
