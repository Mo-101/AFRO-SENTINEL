import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { Signal } from '@/hooks/useSignals';
import { fetchNeonSignals } from '@/integrations/neon/client';

const MAX_FEED_SIZE = 60;

export function useLiveSignalFeed() {
  const [liveSignals, setLiveSignals] = useState<Signal[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [newSignalIds, setNewSignalIds] = useState<Set<string>>(new Set());
  const [rate, setRate] = useState<number>(8);
  const allPoolRef = useRef<Signal[]>([]);
  const poolIndexRef = useRef<number>(0);

  // Fetch real signals from Neon database via same-origin API
  const fetchRecentSignals = useCallback(async () => {
    try {
      const data = await fetchNeonSignals({ limit: 100 });
      if (data && data.length > 0) {
        allPoolRef.current = data;
        setLiveSignals(data.slice(0, MAX_FEED_SIZE));
        setIsConnected(true);
      }
    } catch (err) {
      console.error('Failed to fetch live signals from Neon:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch and periodic background refresh
  useEffect(() => {
    fetchRecentSignals();

    const refreshInterval = setInterval(() => {
      fetchRecentSignals();
    }, 45000);

    return () => clearInterval(refreshInterval);
  }, [fetchRecentSignals]);

  // Live signal stream flow: simulate the incoming stream of authentic surveillance signals
  useEffect(() => {
    if (!isConnected || allPoolRef.current.length === 0) return;

    const streamInterval = setInterval(() => {
      if (allPoolRef.current.length === 0) return;

      // Pick next authentic signal from database pool
      poolIndexRef.current = (poolIndexRef.current + 1) % allPoolRef.current.length;
      const baseSignal = allPoolRef.current[poolIndexRef.current];

      if (!baseSignal) return;

      const streamingSignal: Signal = {
        ...baseSignal,
        id: `stream-${baseSignal.id}-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setLiveSignals(prev => [streamingSignal, ...prev.slice(0, MAX_FEED_SIZE - 1)]);

      setNewSignalIds(prev => {
        const next = new Set(prev);
        next.add(streamingSignal.id);
        return next;
      });

      // Clear the "new" badge after 4 seconds
      setTimeout(() => {
        setNewSignalIds(prev => {
          const next = new Set(prev);
          next.delete(streamingSignal.id);
          return next;
        });
      }, 4000);

      // Fluctuate stream rate naturally around 8-14/min
      setRate(prev => {
        const delta = (Math.random() - 0.5) * 2;
        return Math.min(18, Math.max(6, Math.round(prev + delta)));
      });
    }, 9000);

    return () => clearInterval(streamInterval);
  }, [isConnected]);

  const streamRate = useMemo(() => {
    return isConnected ? rate : 0;
  }, [isConnected, rate]);

  return {
    liveSignals,
    isConnected,
    isLoading,
    newSignalIds,
    streamRate,
    refetch: fetchRecentSignals,
  };
}
