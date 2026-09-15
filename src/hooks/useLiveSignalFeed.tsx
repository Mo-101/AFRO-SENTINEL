import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Signal } from '@/hooks/useSignals';

const MAX_FEED_SIZE = 50;
const NEW_SIGNAL_ANIMATION_DURATION = 2500; // ms

export function useLiveSignalFeed() {
  const [liveSignals, setLiveSignals] = useState<Signal[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [newSignalIds, setNewSignalIds] = useState<Set<string>>(new Set());

  // Calculate stream rate (signals per minute over last 5 min)
  const streamRate = useMemo(() => {
    const fiveMinAgo = Date.now() - 5 * 60 * 1000;
    const recentCount = liveSignals.filter(
      s => new Date(s.created_at).getTime() > fiveMinAgo
    ).length;
    return Math.round(recentCount / 5);
  }, [liveSignals]);

  // Fetch initial signals
  const fetchRecentSignals = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('signals')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(MAX_FEED_SIZE);

      if (error) throw error;
      setLiveSignals(data || []);
    } catch (err) {
      console.error('Failed to fetch signals:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecentSignals();

    // Subscribe to real-time inserts
    const channel = supabase
      .channel('live-signal-feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'signals' },
        (payload) => {
          const newSignal = payload.new as Signal;

          // Mark as new for animation
          setNewSignalIds(prev => new Set([...prev, newSignal.id]));

          // Add to feed
          setLiveSignals(prev => [newSignal, ...prev].slice(0, MAX_FEED_SIZE));

          // Remove "new" flag after animation completes
          setTimeout(() => {
            setNewSignalIds(prev => {
              const next = new Set(prev);
              next.delete(newSignal.id);
              return next;
            });
          }, NEW_SIGNAL_ANIMATION_DURATION);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'signals' },
        (payload) => {
          const updatedSignal = payload.new as Signal;
          setLiveSignals(prev =>
            prev.map(s => s.id === updatedSignal.id ? updatedSignal : s)
          );
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'signals' },
        (payload) => {
          const deletedId = payload.old.id;
          setLiveSignals(prev => prev.filter(s => s.id !== deletedId));
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchRecentSignals]);

  return {
    liveSignals,
    isConnected,
    isLoading,
    newSignalIds,
    streamRate,
    refetch: fetchRecentSignals
  };
}
