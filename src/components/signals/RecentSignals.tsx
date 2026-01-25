import { Signal } from '@/hooks/useSignals';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface RecentSignalsProps {
  signals: Signal[];
  isLoading: boolean;
  onSignalClick: (signal: Signal) => void;
}

export function RecentSignals({ signals, isLoading, onSignalClick }: RecentSignalsProps) {
  const sortedSignals = [...signals].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="w-80 bg-card border-l hidden xl:flex flex-col h-full shrink-0">
      <div className="p-6 border-b">
        <h3 className="text-sm font-black text-foreground uppercase tracking-widest">Live Stream</h3>
        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1">
          Incoming Validation Packets
        </p>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {isLoading && signals.length === 0 ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {sortedSignals.slice(0, 20).map((signal) => (
              <div
                key={signal.id}
                onClick={() => onSignalClick(signal)}
                className="p-5 hover:bg-muted/50 cursor-pointer transition-colors group"
              >
                <div className="flex justify-between items-start mb-2">
                  <span
                    className={cn(
                      'w-2 h-2 rounded-full mt-1.5',
                      signal.priority === 'P1' && 'bg-destructive animate-pulse',
                      signal.priority === 'P2' && 'bg-sunset',
                      signal.priority === 'P3' && 'bg-sahara',
                      signal.priority === 'P4' && 'bg-savanna'
                    )}
                  />
                  <span className="text-[9px] font-black text-muted-foreground uppercase">
                    {formatDistanceToNow(new Date(signal.created_at), { addSuffix: true })}
                  </span>
                </div>
                <h5 className="text-sm font-bold text-foreground leading-snug group-hover:text-primary transition-colors mb-1">
                  {signal.disease_name || 'Health Signal'} - {signal.location_country}
                </h5>
                <p className="text-[10px] text-muted-foreground font-medium line-clamp-2">
                  {signal.original_text || signal.translated_text || 'Monitoring...'}
                </p>
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <Badge variant="secondary" className="text-[9px] font-black uppercase">
                    {signal.location_country}
                  </Badge>
                  {signal.reported_deaths !== null && signal.reported_deaths !== undefined && signal.reported_deaths > 0 && (
                    <Badge variant="destructive" className="text-[9px] font-black uppercase">
                      {signal.reported_deaths} Deaths
                    </Badge>
                  )}
                  {signal.original_language && signal.original_language !== 'en' && (
                    <Badge variant="outline" className="text-[8px]">
                      🏠 LOCAL
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
