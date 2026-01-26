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

// Updated to sky blue and sea green glass-like styling
const TYPE_CONFIG = {
  ANOMALY_DETECTED: { icon: Zap, label: 'Anomaly Detected', color: 'text-sky-500' },
  VIRAL_SURGE: { icon: TrendingUp, label: 'Viral Surge', color: 'text-teal-500' },
  CROSS_BORDER: { icon: MapPin, label: 'Cross Border', color: 'text-cyan-500' },
  PATTERN_MATCH: { icon: Activity, label: 'Pattern Match', color: 'text-emerald-500' },
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

  // Only show the first (most recent) detection for sequential display
  const currentDetection = detections[0];
  const remainingCount = detections.length - 1;

  const typeConfig = TYPE_CONFIG[currentDetection.type];
  const IconComponent = typeConfig.icon;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-4 pointer-events-none max-w-sm">
      <div
        key={currentDetection.id}
        className={cn(
          // Glass-like neuromorphic card styling with sea green/sky blue tint
          'relative bg-white/90 backdrop-blur-xl p-0 rounded-3xl w-80 pointer-events-auto transition-all duration-300 overflow-hidden',
          'border border-sky-200/50 shadow-[0_8px_32px_rgba(14,165,233,0.15),0_4px_16px_rgba(20,184,166,0.1)]',
          currentDetection.fadingOut ? 'opacity-0 translate-x-8 scale-95' : 'animate-slide-in-right opacity-100',
        )}
      >
        {/* Glass-like gradient corner accents */}
        <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-sky-400/20 via-cyan-300/10 to-transparent rounded-tl-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-20 h-20 bg-gradient-to-tl from-teal-400/15 via-emerald-300/10 to-transparent rounded-br-3xl pointer-events-none" />
        
        {/* Severity indicator strip - now with sky/teal gradient */}
        <div className={cn(
          'h-1.5 w-full',
          currentDetection.severity === 'CRITICAL' 
            ? 'bg-gradient-to-r from-sky-500 via-cyan-400 to-teal-500' 
            : 'bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-400'
        )} />
        
        <div className="p-4 relative z-10">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              {/* Icon with glass-like inset */}
              <div className={cn(
                'w-10 h-10 rounded-2xl flex items-center justify-center',
                'bg-gradient-to-br from-sky-50 to-teal-50 border border-sky-200/50',
                'shadow-[inset_0_2px_4px_rgba(14,165,233,0.1)]'
              )}>
                <IconComponent className={cn(
                  'w-5 h-5',
                  currentDetection.severity === 'CRITICAL' ? 'text-sky-500' : 'text-teal-500'
                )} />
              </div>
              <div>
                <span className={cn(
                  'text-[10px] font-semibold uppercase tracking-wider',
                  currentDetection.severity === 'CRITICAL' ? 'text-sky-600' : 'text-teal-600'
                )}>
                  {typeConfig.label}
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={cn(
                    'w-1.5 h-1.5 rounded-full animate-pulse',
                    currentDetection.severity === 'CRITICAL' ? 'bg-sky-500' : 'bg-teal-500'
                  )} />
                  <span className="text-[9px] font-medium text-muted-foreground uppercase">
                    {currentDetection.severity}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Remaining alerts indicator */}
              {remainingCount > 0 && (
                <span className="text-[10px] font-bold text-sky-600 bg-sky-50 px-2 py-1 rounded-lg border border-sky-200/50">
                  +{remainingCount} more
                </span>
              )}
              {onDismiss && (
                <button
                  onClick={() => onDismiss(currentDetection.id)}
                  className="w-7 h-7 rounded-xl bg-slate-100/80 hover:bg-slate-200/80 flex items-center justify-center transition-colors border border-slate-200/50"
                >
                  <X className="w-3.5 h-3.5 text-slate-500" />
                </button>
              )}
            </div>
          </div>
          
          {/* Content */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-foreground leading-snug">
              {currentDetection.title}
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
              {currentDetection.description}
            </p>
          </div>
          
          {/* Footer with location and metric */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-sky-100/50">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3 h-3 text-teal-400" />
              <span className="text-[11px] font-medium text-muted-foreground">
                {currentDetection.location}
              </span>
            </div>
            {currentDetection.metric && (
              <span className={cn(
                'text-[10px] font-bold px-2.5 py-1 rounded-xl border',
                currentDetection.severity === 'CRITICAL' 
                  ? 'text-sky-600 bg-gradient-to-r from-sky-50 to-cyan-50 border-sky-200/50' 
                  : 'text-teal-600 bg-gradient-to-r from-teal-50 to-emerald-50 border-teal-200/50'
              )}>
                {currentDetection.metric}
              </span>
            )}
          </div>
        </div>
        
        {/* Progress bar for auto-dismiss - glass-like */}
        <div className="h-1 bg-slate-100/50">
          <div 
            className={cn(
              'h-full transition-all ease-linear',
              currentDetection.severity === 'CRITICAL' 
                ? 'bg-gradient-to-r from-sky-400 to-cyan-400' 
                : 'bg-gradient-to-r from-teal-400 to-emerald-400',
              currentDetection.fadingOut ? 'w-0' : 'w-full animate-shrink-width'
            )}
            style={{ animationDuration: '10s' }}
          />
        </div>
      </div>
    </div>
  );
}
