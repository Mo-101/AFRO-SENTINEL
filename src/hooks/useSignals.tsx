import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Signal = Tables<'signals'>;
export type SignalInsert = TablesInsert<'signals'>;
export type SignalUpdate = TablesUpdate<'signals'>;

type SignalPriority = 'P1' | 'P2' | 'P3' | 'P4';
type SignalStatus = 'new' | 'triaged' | 'validated' | 'dismissed';

interface UseSignalsOptions {
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

export function useSignalStats() {
  return useQuery({
    queryKey: ['signal-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('signals')
        .select('priority, status, disease_category, location_country');

      if (error) {
        throw error;
      }

      const stats = {
        total: data.length,
        byPriority: {
          P1: data.filter(s => s.priority === 'P1').length,
          P2: data.filter(s => s.priority === 'P2').length,
          P3: data.filter(s => s.priority === 'P3').length,
          P4: data.filter(s => s.priority === 'P4').length,
        },
        byStatus: {
          new: data.filter(s => s.status === 'new').length,
          triaged: data.filter(s => s.status === 'triaged').length,
          validated: data.filter(s => s.status === 'validated').length,
          dismissed: data.filter(s => s.status === 'dismissed').length,
        },
        byCategory: data.reduce((acc, s) => {
          const cat = s.disease_category || 'unknown';
          acc[cat] = (acc[cat] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        byCountry: data.reduce((acc, s) => {
          acc[s.location_country] = (acc[s.location_country] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      };

      return stats;
    },
  });
}
