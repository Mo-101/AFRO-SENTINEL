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
  const { enabled = true, maxAlerts = 5, autoDismissMs = 10000 } = options;
  const [alerts, setAlerts] = useState<AlertWithMeta[]>([]);
  const processedIds = useRef<Set<string>>(new Set());
  const dismissTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());

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
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, maxAlerts, mapSignalToDetection, scheduleAutoDismiss]);

  // Test function to inject a fake alert for UI testing
  const injectTestAlert = useCallback(() => {
    const testDetection: AutoDetection = {
      id: `test-${Date.now()}`,
      type: Math.random() > 0.5 ? 'ANOMALY_DETECTED' : 'VIRAL_SURGE',
      severity: Math.random() > 0.5 ? 'CRITICAL' : 'HIGH',
      title: 'Ebola-like hemorrhagic fever cluster',
      description: 'Multiple patients presenting with bleeding symptoms at Kano General Hospital. 3 deaths reported in past 48 hours.',
      location: 'Kano State, Nigeria',
      metric: '12 suspected cases',
    };
    
    setAlerts(prev => [testDetection, ...prev].slice(0, maxAlerts));
    scheduleAutoDismiss(testDetection.id);
  }, [maxAlerts, scheduleAutoDismiss]);

  return {
    alerts,
    dismissAlert,
    clearAllAlerts,
    injectTestAlert,
  };
}
