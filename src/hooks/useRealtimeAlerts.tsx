import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Signal } from '@/hooks/useSignals';
import type { AutoDetection } from '@/components/alerts/AutoDetectionPopup';

interface UseRealtimeAlertsOptions {
  enabled?: boolean;
  playSound?: boolean;
  maxAlerts?: number;
  autoDismissMs?: number; // Auto-dismiss after X milliseconds
}

interface AlertWithMeta extends AutoDetection {
  fadingOut?: boolean;
}

export function useRealtimeAlerts(options: UseRealtimeAlertsOptions = {}) {
  const { enabled = true, playSound = true, maxAlerts = 5, autoDismissMs = 10000 } = options;
  const [alerts, setAlerts] = useState<AlertWithMeta[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const processedIds = useRef<Set<string>>(new Set());
  const dismissTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Initialize audio element
  useEffect(() => {
    if (typeof window !== 'undefined' && playSound) {
      // Create a simple beep sound using Web Audio API
      audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2JfHJlcG5wdH55c21mbmx0eHVuZ2hnaG9zcG5rbnFuc3RzcXBxc3R1dXd4eXt8fX5+f4GCg4SGh4iJiouMjY6PkJGSkpOUlJWWl5iYmZqbm5ydnZ6fn6ChoaKjpKSlpqanqKmpqqurq6ytra6vr6+wsLGxsrKzs7S0tba2t7e4uLm5uru7vLy9vb6+v7/AwMHBwsLDw8TExcXGxsfHyMjJycrKy8vMzM3Nzs7Pz9DQ0dHS0tPT1NTV1dbW19fY2NnZ2trb29zc3d3e3t/f4ODh4eLi4+Pk5OXl5ubn5+jo6enq6uvr7Ozs7e3u7u/v8PDx8fLy8/P09PX19vb39/j4+fn6+vv7/Pz9/f7+//8AAAAA');
    }
    return () => {
      audioRef.current = null;
    };
  }, [playSound]);

  const playAlertSound = useCallback(() => {
    if (audioRef.current && playSound) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        // Ignore autoplay errors - user hasn't interacted yet
      });
    }
  }, [playSound]);

  const mapSignalToDetection = useCallback((signal: Signal): AutoDetection => {
    const isP1 = signal.priority === 'P1';
    const isVHF = signal.disease_category === 'vhf';
    
    let type: AutoDetection['type'] = 'PATTERN_MATCH';
    if (isVHF || (signal.reported_deaths && signal.reported_deaths > 0)) {
      type = 'ANOMALY_DETECTED';
    } else if (signal.cross_border_risk) {
      type = 'CROSS_BORDER';
    } else if (signal.confidence_score > 80) {
      type = 'VIRAL_SURGE';
    }

    return {
      id: signal.id,
      type,
      severity: isP1 ? 'CRITICAL' : 'HIGH',
      title: signal.disease_name || 'Unknown Outbreak',
      description: signal.translated_text || signal.original_text,
      location: `${signal.location_admin1 || ''} ${signal.location_country}`.trim(),
      metric: signal.reported_cases ? `${signal.reported_cases} cases` : 
              signal.reported_deaths ? `${signal.reported_deaths} deaths` : undefined,
    };
  }, []);

  // Start fade-out animation, then remove after animation completes
  const dismissAlert = useCallback((id: string) => {
    // Clear any existing timer
    const existingTimer = dismissTimers.current.get(id);
    if (existingTimer) {
      clearTimeout(existingTimer);
      dismissTimers.current.delete(id);
    }
    
    // Start fade-out animation
    setAlerts(prev => prev.map(a => 
      a.id === id ? { ...a, fadingOut: true } : a
    ));
    
    // Remove after animation (300ms)
    setTimeout(() => {
      setAlerts(prev => prev.filter(a => a.id !== id));
    }, 300);
  }, []);

  const clearAllAlerts = useCallback(() => {
    // Clear all timers
    dismissTimers.current.forEach(timer => clearTimeout(timer));
    dismissTimers.current.clear();
    setAlerts([]);
  }, []);

  // Schedule auto-dismiss for an alert
  const scheduleAutoDismiss = useCallback((id: string) => {
    const timer = setTimeout(() => {
      dismissAlert(id);
    }, autoDismissMs);
    dismissTimers.current.set(id, timer);
  }, [autoDismissMs, dismissAlert]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      dismissTimers.current.forEach(timer => clearTimeout(timer));
    };
  }, []);

  // Subscribe to realtime inserts
  useEffect(() => {
    if (!enabled) return;

    const channel = supabase
      .channel('p1p2-alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'signals',
          filter: 'priority=in.(P1,P2)',
        },
        (payload) => {
          const newSignal = payload.new as Signal;
          
          // Skip if already processed
          if (processedIds.current.has(newSignal.id)) return;
          processedIds.current.add(newSignal.id);
          
          // Limit processed IDs to prevent memory leak
          if (processedIds.current.size > 100) {
            const arr = Array.from(processedIds.current);
            arr.splice(0, 50);
            processedIds.current = new Set(arr);
          }

          const detection = mapSignalToDetection(newSignal);
          
          setAlerts(prev => {
            const updated = [detection, ...prev].slice(0, maxAlerts);
            return updated;
          });

          // Schedule auto-dismiss
          scheduleAutoDismiss(newSignal.id);

          // Play sound for P1 alerts
          if (newSignal.priority === 'P1') {
            playAlertSound();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, maxAlerts, mapSignalToDetection, playAlertSound, scheduleAutoDismiss]);

  return {
    alerts,
    dismissAlert,
    clearAllAlerts,
  };
}
