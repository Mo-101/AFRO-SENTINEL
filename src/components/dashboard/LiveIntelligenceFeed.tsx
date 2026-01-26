import { useMemo, useState, useRef, useEffect } from 'react';
import { useLiveSignalFeed } from '@/hooks/useLiveSignalFeed';
import { useSignalStats } from '@/hooks/useSignals';
import { Signal } from '@/hooks/useSignals';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Radio } from 'lucide-react';

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
  ageIndex: number;
}

function FeedItem({ signal, onClick, isNew, ageIndex }: FeedItemProps) {
  const priorityStyle = PRIORITY_STYLES[signal.priority] || PRIORITY_STYLES.P4;
  const timeAgo = formatDistanceToNow(new Date(signal.created_at), { addSuffix: false });
  
  // Calculate fade opacity based on age (older = more faded)
  const fadeOpacity = Math.max(0.45, 1 - (ageIndex * 0.012));

  return (
    <button
      onClick={onClick}
      style={{ opacity: fadeOpacity }}
      className={cn(
        "w-full text-left p-3 border-b border-border/50 transition-all duration-300",
        "hover:bg-muted/50 hover:opacity-100 focus:outline-none focus:bg-muted/50",
        isNew && "feed-item-enter bg-primary/5",
        signal.priority === 'P1' && isNew && "feed-item-glow-p1"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Priority indicator */}
        <div className={cn(
          "w-2 h-2 rounded-full mt-1.5 shrink-0 transition-all",
          priorityStyle.dot,
          signal.priority === 'P1' && "animate-pulse shadow-[0_0_8px_hsl(var(--destructive)/0.6)]"
        )} />

        <div className="flex-1 min-w-0">
          {/* Disease + Priority Badge */}
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
  const { liveSignals, isConnected, isLoading, newSignalIds, streamRate } = useLiveSignalFeed();
  const { data: stats } = useSignalStats();
  const [isPaused, setIsPaused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Calculate compact stats
  const p1Count = stats?.byPriority?.P1 || 0;
  const newCount = stats?.byStatus?.new || 0;
  const triaged = (stats?.byStatus?.triaged || 0) + (stats?.byStatus?.validated || 0);
  const total = stats?.total || 0;
  const triageRate = total > 0 ? Math.round((triaged / total) * 100) : 0;

  // Ensure feed is never empty
  const displaySignals = useMemo(() => {
    if (liveSignals.length === 0 && !isLoading) {
      return [];
    }
    return liveSignals;
  }, [liveSignals, isLoading]);

  // Auto-scroll to top when new signals arrive (if not paused)
  useEffect(() => {
    if (!isPaused && newSignalIds.size > 0 && scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [newSignalIds.size, isPaused]);

  return (
    <div 
      className="w-72 xl:w-80 bg-card/50 backdrop-blur-sm border-l border-border/50 flex flex-col h-full shrink-0"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Header with connection status and stream rate */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-savanna" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-foreground">
              Live Feed
            </h3>
          </div>
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
          {isConnected 
            ? `Streaming • ${streamRate > 0 ? `${streamRate}/min` : 'Waiting for signals'}` 
            : 'Connecting...'
          }
        </p>
      </div>

      {/* Scrollable signal list */}
      <ScrollArea className="flex-1" ref={scrollRef}>
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
              isNew={newSignalIds.has(signal.id)}
              ageIndex={index}
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

      {/* Compact stats footer with stream indicator */}
      <div className="p-3 border-t border-border/50 bg-muted/20">
        <div className="flex items-center justify-between text-[10px] font-medium">
          <span className="text-destructive">P1: {p1Count}</span>
          <span className="text-muted-foreground">•</span>
          <span className="text-sunset">NEW: {newCount}</span>
          <span className="text-muted-foreground">•</span>
          <span className="text-savanna flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-savanna animate-pulse" />
            {streamRate}/min
          </span>
        </div>
      </div>
    </div>
  );
}
