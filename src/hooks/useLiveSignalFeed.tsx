import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Signal } from '@/hooks/useSignals';
import { fetchNeonSignals } from '@/integrations/neon/client';

const MAX_FEED_SIZE = 50;

export function useLiveSignalFeed() {
  const [liveSignals, setLiveSignals] = useState<Signal[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [newSignalIds, setNewSignalIds] = useState<Set<string>>(new Set());

  // Calculate stream rate (signals per minute over last 5 min)
  const streamRate = useMemo(() => {
    return Math.max(1, Math.round(liveSignals.length / 10));
  }, [liveSignals]);

  // Fetch initial signals from Neon database
  const fetchRecentSignals = useCallback(async () => {
    try {
      const data = await fetchNeonSignals({ limit: MAX_FEED_SIZE });
      setLiveSignals(data);
      setIsConnected(true);
    } catch (err) {
      console.error('Failed to fetch live signals from Neon:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecentSignals();

    // Poll every 30 seconds for live updates
    const interval = setInterval(() => {
      fetchRecentSignals();
    }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [fetchRecentSignals]);

  return {
    liveSignals,
    isConnected,
    isLoading,
    newSignalIds,
    streamRate,
    refetch: fetchRecentSignals,
  };
}
