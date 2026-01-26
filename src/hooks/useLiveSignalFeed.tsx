import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Signal } from '@/hooks/useSignals';

const MAX_FEED_SIZE = 50;

export function useLiveSignalFeed() {
  const [liveSignals, setLiveSignals] = useState<Signal[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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
          setLiveSignals(prev => [newSignal, ...prev].slice(0, MAX_FEED_SIZE));
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
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchRecentSignals]);

  return { liveSignals, isConnected, isLoading, refetch: fetchRecentSignals };
}
