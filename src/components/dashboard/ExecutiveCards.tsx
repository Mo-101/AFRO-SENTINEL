import { useSignalStats, useSignalTrends } from '@/hooks/useSignals';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Radio, AlertTriangle, ShieldCheck, Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExecutiveCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  trend?: number;
  highlight?: 'default' | 'destructive' | 'success' | 'warning';
  pulse?: boolean;
  isLoading?: boolean;
  onClick?: () => void;
  isActive?: boolean;
}

function ExecutiveCard({
  label,
  value,
  icon,
  trend,
  highlight = 'default',
  pulse = false,
  isLoading,
  onClick,
  isActive = false
}: ExecutiveCardProps) {
  if (isLoading) {
    return (
      <Card className="border-border/40 bg-card/50 backdrop-blur-sm overflow-hidden relative">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-8 w-12" />
            </div>
            <Skeleton className="h-10 w-10 rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const highlightColors = {
    default: 'text-primary',
    destructive: 'text-destructive',
    success: 'text-savanna',
    warning: 'text-sunset',
  };

  const bgColors = {
    default: 'bg-primary/10',
    destructive: 'bg-destructive/10',
    success: 'bg-savanna/10',
    warning: 'bg-sunset/10',
  };

  const activeBorderColors = {
    default: 'border-primary',
    destructive: 'border-destructive',
    success: 'border-savanna',
    warning: 'border-sunset',
  };

  const activeGlowColors = {
    default: 'shadow-primary/30',
    destructive: 'shadow-destructive/30',
    success: 'shadow-savanna/30',
    warning: 'shadow-sunset/30',
  };

  return (
    <Card
      onClick={onClick}
      className={cn(
        "group border-border/40 bg-card/40 backdrop-blur-sm overflow-hidden relative transition-all duration-300",
        "hover:bg-card/60 hover:border-primary/30 hover:scale-[1.02] grid-bg-tactical",
        onClick && "cursor-pointer",
        isActive && [
          "border-2",
          activeBorderColors[highlight],
          "bg-gradient-to-br from-card/60 to-card/40",
          "shadow-lg",
          activeGlowColors[highlight],
          "scale-[1.02]",
          "ring-2 ring-offset-1 ring-offset-background",
          highlight === 'default' && "ring-primary/50",
          highlight === 'destructive' && "ring-destructive/50",
          highlight === 'success' && "ring-savanna/50",
          highlight === 'warning' && "ring-sunset/50",
        ],
        pulse && !isActive && "animate-pulse"
      )}>
      {/* Tactical Scanner Effect */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="border-scan opacity-40" />
      </div>

      <CardContent className="p-4 relative z-10">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <span className={cn(
                "text-[9px] font-mono leading-none transition-colors",
                isActive ? "text-primary/70" : "text-primary/40",
                pulse && !isActive && "text-destructive animate-pulse"
              )}>
                {isActive ? "FILTER://" : pulse ? "LIVE://" : "SYS://"}
              </span>
              <p className={cn(
                "text-[10px] font-black uppercase tracking-[0.15em] truncate transition-colors",
                isActive ? "text-foreground" : "text-muted-foreground"
              )}>
                {label}
              </p>
            </div>

            <div className="flex items-baseline gap-2 mt-2">
              <h3 className={cn("text-3xl font-black tracking-tighter", highlightColors[highlight])}>
                {value.toLocaleString()}
              </h3>
              {trend !== undefined && trend !== 0 && (
                <span className={cn(
                  'flex items-center text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-sm bg-background/50',
                  trend > 0 ? 'text-savanna' : 'text-destructive'
                )}>
                  {trend > 0 ? '+' : ''}{trend}%
                </span>
              )}
            </div>
          </div>

          <div className={cn(
            'p-3 rounded-xl transition-all duration-500 group-hover:rotate-12 group-hover:scale-110 shadow-lg',
            bgColors[highlight],
            highlightColors[highlight]
          )}>
            {icon}
          </div>
        </div>

        {/* Decorative corner elements */}
        <div className={cn(
          "absolute bottom-0 right-0 w-4 h-4 p-1 transition-opacity",
          isActive ? "opacity-60" : "opacity-20 group-hover:opacity-60"
        )}>
          <div className={cn(
            "w-full h-full border-b border-r",
            isActive ? highlightColors[highlight] : "border-primary"
          )} />
        </div>

        {/* Active filter indicator */}
        {isActive && (
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-current to-transparent opacity-60" />
        )}
      </CardContent>

      {/* Data glimmer effect */}
      <div className={cn(
        "absolute inset-0 data-glimmer transition-opacity",
        isActive ? "opacity-30" : "opacity-0 group-hover:opacity-100"
      )} />
    </Card>
  );
}

interface ExecutiveCardsProps {
  activeFilter?: string;
  onFilterChange?: (filter: string) => void;
}

export function ExecutiveCards({ activeFilter, onFilterChange }: ExecutiveCardsProps) {
  const { data: stats, isLoading } = useSignalStats();
  const { data: trends } = useSignalTrends();

  const validatedCount = stats?.byStatus?.validated || 0;
  const p1Count = stats?.byPriority?.P1 || 0;
  const pendingCount = stats?.byStatus?.new || 0;
  const dismissedCount = stats?.byStatus?.dismissed || 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <ExecutiveCard
        label="Confirmed Threats"
        value={validatedCount}
        icon={<ShieldCheck className="w-5 h-5" />}
        trend={trends?.trendPercent}
        highlight="success"
        isLoading={isLoading}
        onClick={() => onFilterChange?.('validated')}
        isActive={activeFilter === 'validated'}
      />
      <ExecutiveCard
        label="Critical (P1)"
        value={p1Count}
        icon={<AlertTriangle className="w-5 h-5" />}
        highlight="destructive"
        pulse={p1Count > 0}
        isLoading={isLoading}
        onClick={() => onFilterChange?.('P1')}
        isActive={activeFilter === 'P1'}
      />
      <ExecutiveCard
        label="Pending Triage"
        value={pendingCount}
        icon={<Clock className="w-5 h-5" />}
        highlight="warning"
        isLoading={isLoading}
        onClick={() => onFilterChange?.('new')}
        isActive={activeFilter === 'new'}
      />
      <ExecutiveCard
        label="Total Ingested"
        value={stats?.total || 0}
        icon={<Radio className="w-5 h-5" />}
        highlight="default"
        isLoading={isLoading}
        onClick={() => onFilterChange?.('all')}
        isActive={activeFilter === 'all'}
      />
    </div>
  );
}
