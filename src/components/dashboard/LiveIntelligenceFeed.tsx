import { useMemo, useState } from 'react';
import { useLiveSignalFeed } from '@/hooks/useLiveSignalFeed';
import { useSignalStats } from '@/hooks/useSignals';
import { Signal } from '@/hooks/useSignals';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface LiveIntelligenceFeedProps {
  onSignalClick?: (signal: Signal) => void;
}

const PRIORITY_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  P1: { bg: 'bg-destructive/10', text: 'text-destructive', dot: 'bg-destructive' },
  P2: { bg: 'bg-sunset/10', text: 'text-sunset', dot: 'bg-sunset' },
  P3: { bg: 'bg-sahara/10', text: 'text-sahara', dot: 'bg-sahara' },
  P4: { bg: 'bg-savanna/10', text: 'text-savanna', dot: 'bg-savanna' },
};

interface FeedItemProps {
  signal: Signal;
  onClick?: () => void;
  isNew?: boolean;
}

function FeedItem({ signal, onClick, isNew }: FeedItemProps) {
  const priorityStyle = PRIORITY_STYLES[signal.priority] || PRIORITY_STYLES.P4;
  const timeAgo = formatDistanceToNow(new Date(signal.created_at), { addSuffix: false });

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-3 border-b border-border/50 transition-all duration-200",
        "hover:bg-muted/50 focus:outline-none focus:bg-muted/50",
        isNew && "animate-pulse bg-primary/5"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Priority indicator */}
        <div className={cn(
          "w-2 h-2 rounded-full mt-1.5 shrink-0",
          priorityStyle.dot,
          signal.priority === 'P1' && "animate-pulse"
        )} />

        <div className="flex-1 min-w-0">
          {/* Disease + Country */}
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm text-foreground truncate">
              {signal.disease_name || 'Unknown'}
            </span>
            <Badge 
              variant="outline" 
              className={cn("text-[9px] px-1.5 py-0 h-4 shrink-0", priorityStyle.text)}
            >
              {signal.priority}
            </Badge>
          </div>

          {/* Location */}
          <p className="text-xs text-muted-foreground truncate">
            {signal.location_country}
            {signal.location_admin1 && `, ${signal.location_admin1}`}
          </p>

          {/* Source + Time */}
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-[10px] text-muted-foreground/70 truncate">
              {signal.source_name}
            </span>
            <span className="text-[10px] text-muted-foreground/70 shrink-0">
              {timeAgo} ago
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

function FeedItemSkeleton() {
  return (
    <div className="p-3 border-b border-border/50">
      <div className="flex items-start gap-3">
        <Skeleton className="w-2 h-2 rounded-full mt-1.5" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-2.5 w-1/3" />
        </div>
      </div>
    </div>
  );
}

export function LiveIntelligenceFeed({ onSignalClick }: LiveIntelligenceFeedProps) {
  const { liveSignals, isConnected, isLoading } = useLiveSignalFeed();
  const { data: stats } = useSignalStats();
  const [isPaused, setIsPaused] = useState(false);

  // Calculate compact stats
  const p1Count = stats?.byPriority?.P1 || 0;
  const newCount = stats?.byStatus?.new || 0;
  const triaged = (stats?.byStatus?.triaged || 0) + (stats?.byStatus?.validated || 0);
  const total = stats?.total || 0;
  const triageRate = total > 0 ? Math.round((triaged / total) * 100) : 0;

  // Ensure feed is never empty - show loading or data
  const displaySignals = useMemo(() => {
    if (liveSignals.length === 0 && !isLoading) {
      return []; // Will show "No signals" message
    }
    return liveSignals;
  }, [liveSignals, isLoading]);

  return (
    <div 
      className="w-72 xl:w-80 bg-card/50 backdrop-blur-sm border-l border-border/50 flex flex-col h-full shrink-0"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Header with connection status */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-widest text-foreground">
            Live Feed
          </h3>
          <div className="flex items-center gap-1.5">
            {isPaused && (
              <span className="text-[9px] text-muted-foreground uppercase">Paused</span>
            )}
            <div className={cn(
              "w-2 h-2 rounded-full transition-colors",
              isConnected ? "bg-savanna animate-pulse" : "bg-destructive"
            )} />
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">
          {isConnected ? 'Connected • Real-time updates' : 'Connecting...'}
        </p>
      </div>

      {/* Scrollable signal list */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <>
            {[...Array(8)].map((_, i) => (
              <FeedItemSkeleton key={i} />
            ))}
          </>
        ) : displaySignals.length > 0 ? (
          displaySignals.map((signal, index) => (
            <FeedItem
              key={signal.id}
              signal={signal}
              onClick={() => onSignalClick?.(signal)}
              isNew={index === 0}
            />
          ))
        ) : (
          <div className="p-6 text-center">
            <p className="text-sm text-muted-foreground">No signals detected</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Monitoring AFRO region...
            </p>
          </div>
        )}
      </ScrollArea>

      {/* Compact stats footer */}
      <div className="p-3 border-t border-border/50 bg-muted/20">
        <div className="flex items-center justify-between text-[10px] font-medium">
          <span className="text-destructive">P1: {p1Count}</span>
          <span className="text-muted-foreground">•</span>
          <span className="text-sunset">NEW: {newCount}</span>
          <span className="text-muted-foreground">•</span>
          <span className="text-savanna">TRIAGE: {triageRate}%</span>
        </div>
      </div>
    </div>
  );
}
