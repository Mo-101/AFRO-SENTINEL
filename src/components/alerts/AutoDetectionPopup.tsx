import { useEffect } from 'react';
import { AlertTriangle, Zap, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AutoDetection {
  id: string;
  type: 'ANOMALY_DETECTED' | 'VIRAL_SURGE' | 'CROSS_BORDER' | 'PATTERN_MATCH';
  severity: 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  location: string;
  metric?: string;
}

interface AutoDetectionPopupProps {
  detections: AutoDetection[];
  onDismiss?: (id: string) => void;
}

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
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none max-w-sm">
      {detections.map((det) => (
        <div
          key={det.id}
          className={cn(
            'bg-foreground text-background p-4 rounded-xl shadow-2xl border w-80 pointer-events-auto animate-slide-in-right',
            det.severity === 'CRITICAL' && 'border-destructive',
            det.severity === 'HIGH' && 'border-sunset'
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <div className={cn(
              'flex items-center gap-2',
              det.severity === 'CRITICAL' ? 'text-destructive' : 'text-sahara'
            )}>
              {det.type === 'ANOMALY_DETECTED' ? (
                <Zap className="w-4 h-4 fill-current" />
              ) : (
                <AlertTriangle className="w-4 h-4" />
              )}
              <span className="text-[10px] font-black uppercase tracking-widest">
                {det.type.replace('_', ' ')}
              </span>
            </div>
            {onDismiss && (
              <button
                onClick={() => onDismiss(det.id)}
                className="p-1 hover:bg-background/20 rounded transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <h4 className="font-bold text-sm mb-1">{det.title}</h4>
          <p className="text-xs text-background/70 leading-relaxed mb-3">{det.description}</p>
          <div className="flex justify-between items-center pt-2 border-t border-background/20">
            <span className="text-[10px] font-bold text-background/60 uppercase">{det.location}</span>
            {det.metric && (
              <span className={cn(
                'text-[10px] font-black px-2 py-0.5 rounded',
                det.severity === 'CRITICAL' ? 'text-destructive bg-destructive/20' : 'text-sunset bg-sunset/20'
              )}>
                {det.metric}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
