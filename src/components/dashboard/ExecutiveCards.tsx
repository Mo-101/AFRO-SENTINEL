import { useSignalStats } from '@/hooks/useSignals';
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
}

function ExecutiveCard({ 
  label, 
  value, 
  icon, 
  trend, 
  highlight = 'default',
  pulse = false,
  isLoading 
}: ExecutiveCardProps) {
  if (isLoading) {
    return (
      <Card className="border-0 neuro-card">
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

  return (
    <Card className={cn(
      "border-0 neuro-card transition-all duration-300 hover:scale-[1.02]",
      pulse && "animate-pulse"
    )}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              {label}
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <h3 className={cn("text-2xl font-bold", highlightColors[highlight])}>
                {value.toLocaleString()}
              </h3>
              {trend !== undefined && trend !== 0 && (
                <span className={cn(
                  'flex items-center text-[10px] font-semibold',
                  trend > 0 ? 'text-savanna' : 'text-destructive'
                )}>
                  {trend > 0 ? (
                    <TrendingUp className="w-3 h-3 mr-0.5" />
                  ) : (
                    <TrendingDown className="w-3 h-3 mr-0.5" />
                  )}
                  {Math.abs(trend)}%
                </span>
              )}
            </div>
          </div>
          <div className={cn(
            'p-2.5 rounded-lg',
            bgColors[highlight],
            highlightColors[highlight]
          )}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ExecutiveCards() {
  const { data: stats, isLoading } = useSignalStats();

  const p1Count = stats?.byPriority?.P1 || 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <ExecutiveCard
        label="Active Signals"
        value={stats?.total || 0}
        icon={<Radio className="w-5 h-5" />}
        trend={12}
        highlight="default"
        isLoading={isLoading}
      />
      <ExecutiveCard
        label="Critical (P1)"
        value={p1Count}
        icon={<AlertTriangle className="w-5 h-5" />}
        highlight="destructive"
        pulse={p1Count > 0}
        isLoading={isLoading}
      />
      <ExecutiveCard
        label="Validated"
        value={stats?.byStatus?.validated || 0}
        icon={<ShieldCheck className="w-5 h-5" />}
        trend={8}
        highlight="success"
        isLoading={isLoading}
      />
      <ExecutiveCard
        label="Awaiting Triage"
        value={stats?.byStatus?.new || 0}
        icon={<Clock className="w-5 h-5" />}
        highlight="warning"
        isLoading={isLoading}
      />
    </div>
  );
}
