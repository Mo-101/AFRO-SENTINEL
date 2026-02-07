import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

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
      let query = supabase
        .from('signals')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (priority && priority.length > 0) {
        query = query.in('priority', priority);
      }

      if (status && status.length > 0) {
        query = query.in('status', status);
      }

      if (country) {
        query = query.eq('location_country', country);
      }

      if (disease) {
        query = query.ilike('disease_name', `%${disease}%`);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data as Signal[];
    },
  });
}

export function useSignal(id: string) {
  return useQuery({
    queryKey: ['signal', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('signals')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data as Signal | null;
    },
    enabled: !!id,
  });
}

export function useCreateSignal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (signal: SignalInsert) => {
      const { data, error } = await supabase
        .from('signals')
        .insert(signal)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
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
      const { data, error } = await supabase
        .from('signals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['signals'] });
      queryClient.invalidateQueries({ queryKey: ['signal', data.id] });
    },
  });
}

 // Use RPC functions for accurate counts (bypass 1000-row limit)
export function useSignalStats() {
  return useQuery({
    queryKey: ['signal-stats'],
    queryFn: async () => {
       // Use RPC functions for server-side aggregation (bypasses 1000-row limit)
       const [priorityRes, statusRes, totalRes] = await Promise.all([
         supabase.rpc('get_signal_priority_counts'),
         supabase.rpc('get_signal_status_counts'),
         supabase.rpc('get_signal_total_count'),
       ]);
 
       if (priorityRes.error) throw priorityRes.error;
       if (statusRes.error) throw statusRes.error;
       if (totalRes.error) throw totalRes.error;
 
       // Convert arrays to objects
       const byPriority: Record<string, number> = { P1: 0, P2: 0, P3: 0, P4: 0 };
       (priorityRes.data || []).forEach((row: { priority: string; count: number }) => {
         byPriority[row.priority] = Number(row.count);
       });
 
       const byStatus: Record<string, number> = { new: 0, triaged: 0, validated: 0, dismissed: 0 };
       (statusRes.data || []).forEach((row: { status: string; count: number }) => {
         byStatus[row.status] = Number(row.count);
       });
 
       return {
         total: Number(totalRes.data) || 0,
         byPriority,
         byStatus,
       };
    },
  });
}
 
 // Get real 24h trend data
 export function useSignalTrends() {
   return useQuery({
     queryKey: ['signal-trends'],
     queryFn: async () => {
       const { data, error } = await supabase.rpc('get_signal_24h_trend');
 
       if (error) throw error;
 
       // RPC returns a single row
       const row = Array.isArray(data) ? data[0] : data;
       
       return {
         currentCount: Number(row?.current_count) || 0,
         previousCount: Number(row?.previous_count) || 0,
         trendPercent: Number(row?.trend_percent) || 0,
       };
     },
   });
 }
