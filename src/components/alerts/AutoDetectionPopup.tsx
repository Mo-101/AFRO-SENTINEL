import { useEffect } from 'react';
import { AlertTriangle, Zap, X, MapPin, TrendingUp, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AutoDetection {
  id: string;
  type: 'ANOMALY_DETECTED' | 'VIRAL_SURGE' | 'CROSS_BORDER' | 'PATTERN_MATCH';
  severity: 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  location: string;
  metric?: string;
  fadingOut?: boolean;
}

interface AutoDetectionPopupProps {
  detections: AutoDetection[];
  onDismiss?: (id: string) => void;
}

const TYPE_CONFIG = {
  ANOMALY_DETECTED: { icon: Zap, label: 'Anomaly Detected', color: 'text-amber-600' },
  VIRAL_SURGE: { icon: TrendingUp, label: 'Viral Surge', color: 'text-red-500' },
  CROSS_BORDER: { icon: MapPin, label: 'Cross Border', color: 'text-orange-500' },
  PATTERN_MATCH: { icon: Activity, label: 'Pattern Match', color: 'text-blue-500' },
};

export function AutoDetectionPopup({ detections, onDismiss }: AutoDetectionPopupProps) {
  // Play alert sound for critical detections
  useEffect(() => {
    if (detections.some((d) => d.severity === 'CRITICAL')) {
      // Could add audio notification here
      // new Audio('/alert.mp3').play();
    }
  }, [detections]);

  if (detections.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-4 pointer-events-none max-w-sm">
      {detections.map((det) => {
        const typeConfig = TYPE_CONFIG[det.type];
        const IconComponent = typeConfig.icon;
        
        return (
          <div
            key={det.id}
            className={cn(
              // Neuromorphic card styling
              'neuro-card bg-card p-0 rounded-2xl w-80 pointer-events-auto transition-all duration-300 overflow-hidden',
              det.fadingOut ? 'opacity-0 translate-x-8 scale-95' : 'animate-slide-in-right opacity-100',
            )}
          >
            {/* Severity indicator strip */}
            <div className={cn(
              'h-1.5 w-full',
              det.severity === 'CRITICAL' ? 'bg-gradient-to-r from-red-500 via-red-400 to-red-500' : 'bg-gradient-to-r from-amber-500 via-orange-400 to-amber-500'
            )} />
            
            <div className="p-4">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {/* Icon with neuromorphic inset */}
                  <div className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center shadow-inset',
                    det.severity === 'CRITICAL' ? 'bg-red-50' : 'bg-amber-50'
                  )}>
                    <IconComponent className={cn(
                      'w-5 h-5',
                      det.severity === 'CRITICAL' ? 'text-red-500' : 'text-amber-500'
                    )} />
                  </div>
                  <div>
                    <span className={cn(
                      'text-[10px] font-semibold uppercase tracking-wider',
                      det.severity === 'CRITICAL' ? 'text-red-500' : 'text-amber-600'
                    )}>
                      {typeConfig.label}
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={cn(
                        'w-1.5 h-1.5 rounded-full animate-pulse',
                        det.severity === 'CRITICAL' ? 'bg-red-500' : 'bg-amber-500'
                      )} />
                      <span className="text-[9px] font-medium text-muted-foreground uppercase">
                        {det.severity}
                      </span>
                    </div>
                  </div>
                </div>
                
                {onDismiss && (
                  <button
                    onClick={() => onDismiss(det.id)}
                    className="w-7 h-7 rounded-lg bg-muted/50 hover:bg-muted flex items-center justify-center transition-colors"
                  >
                    <X className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                )}
              </div>
              
              {/* Content */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-foreground leading-snug">
                  {det.title}
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {det.description}
                </p>
              </div>
              
              {/* Footer with location and metric */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 text-muted-foreground" />
                  <span className="text-[11px] font-medium text-muted-foreground">
                    {det.location}
                  </span>
                </div>
                {det.metric && (
                  <span className={cn(
                    'text-[10px] font-bold px-2.5 py-1 rounded-lg',
                    det.severity === 'CRITICAL' 
                      ? 'text-red-600 bg-red-50 shadow-inset' 
                      : 'text-amber-600 bg-amber-50 shadow-inset'
                  )}>
                    {det.metric}
                  </span>
                )}
              </div>
            </div>
            
            {/* Progress bar for auto-dismiss */}
            <div className="h-1 bg-muted/30">
              <div 
                className={cn(
                  'h-full transition-all ease-linear',
                  det.severity === 'CRITICAL' ? 'bg-red-400' : 'bg-amber-400',
                  det.fadingOut ? 'w-0' : 'w-full animate-shrink-width'
                )}
                style={{ animationDuration: '10s' }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
