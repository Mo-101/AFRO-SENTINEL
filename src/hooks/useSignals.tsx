import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import {
  fetchNeonSignals,
  fetchNeonSignalById,
  fetchNeonSignalStats,
  fetchNeonSignalTrends,
} from '@/integrations/neon/client';

export type Signal = Tables<'signals'>;
export type SignalInsert = TablesInsert<'signals'>;
export type SignalUpdate = TablesUpdate<'signals'>;

type SignalPriority = 'P1' | 'P2' | 'P3' | 'P4';
type SignalStatus = 'new' | 'triaged' | 'validated' | 'dismissed';

export interface UseSignalsOptions {
  priority?: SignalPriority[];
  status?: SignalStatus[];
  country?: string;
  disease?: string;
  limit?: number;
}

export function useSignals(options: UseSignalsOptions = {}) {
  const { priority, status, country, disease, limit = 50 } = options;

  return useQuery({
    queryKey: ['signals', { priority, status, country, disease, limit }],
    queryFn: async () => {
      return await fetchNeonSignals(options);
    },
    staleTime: 1000 * 30,
  });
}

export function useSignal(id: string) {
  return useQuery({
    queryKey: ['signal', id],
    queryFn: async () => {
      return await fetchNeonSignalById(id);
    },
    enabled: !!id,
  });
}

export function useCreateSignal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (signal: SignalInsert) => {
      return signal as any;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['signals'] });
    },
  });
}

export function useUpdateSignal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: SignalUpdate }) => {
      return { id, ...updates };
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['signals'] });
      queryClient.invalidateQueries({ queryKey: ['signal', data.id] });
    },
  });
}

// Fetch real signal stats from Neon PostgreSQL
export function useSignalStats() {
  return useQuery({
    queryKey: ['signal-stats'],
    queryFn: async () => {
      return await fetchNeonSignalStats();
    },
    staleTime: 1000 * 30,
  });
}

// Get real trend data from Neon PostgreSQL
export function useSignalTrends() {
  return useQuery({
    queryKey: ['signal-trends'],
    queryFn: async () => {
      return await fetchNeonSignalTrends();
    },
    staleTime: 1000 * 60,
  });
}
