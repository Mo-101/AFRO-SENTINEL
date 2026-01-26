import { useAuth } from '@/hooks/useAuth';
import { useSignalStats } from '@/hooks/useSignals';
import { CircularProgress } from './CircularProgress';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { AlertTriangle, TrendingUp, Radio, ShieldCheck, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatItemProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  trend?: { value: number; positive: boolean };
  accentColor?: string;
  isLoading?: boolean;
}

function StatItem({ label, value, icon, trend, accentColor = 'text-primary', isLoading }: StatItemProps) {
  if (isLoading) {
    return (
      <Card className="border-0 neuro-card">
        <CardContent className="p-5">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-8 w-12" />
            </div>
            <Skeleton className="h-10 w-10 rounded-xl" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 neuro-card transition-all duration-300 hover:scale-[1.02]">
      <CardContent className="p-5">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
            <div className="flex items-baseline gap-2 mt-1">
              <h3 className="text-3xl font-bold text-foreground">{value}</h3>
              {trend && (
                <span className={cn(
                  'flex items-center text-xs font-semibold',
                  trend.positive ? 'text-savanna' : 'text-destructive'
                )}>
                  {trend.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {trend.value}%
                </span>
              )}
            </div>
          </div>
          <div className={cn('p-3 rounded-xl shadow-inset', accentColor, 'bg-muted/30')}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function StatsSidebar() {
  const { user, role } = useAuth();
  const { data: stats, isLoading } = useSignalStats();
  
  const userInitials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : 'AN';

  // Calculate triage rate
  const triaged = (stats?.byStatus?.triaged || 0) + (stats?.byStatus?.validated || 0) + (stats?.byStatus?.dismissed || 0);
  const total = stats?.total || 0;
  const triageRate = total > 0 ? Math.round((triaged / total) * 100) : 0;

  return (
    <div className="w-80 bg-background/50 backdrop-blur-sm border-l border-border/50 hidden xl:flex flex-col h-full shrink-0">
      {/* User Profile Card */}
      <div className="p-6 border-b border-border/50">
        <Card className="border-0 neuro-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12 shadow-soft">
                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {user?.email?.split('@')[0] || 'Analyst'}
                </p>
                <Badge 
                  className="mt-1 text-[10px] font-semibold uppercase tracking-wider bg-primary/10 text-primary border-0"
                >
                  {role || 'Viewer'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Grid */}
      <div className="p-6 space-y-4 flex-1 overflow-y-auto scrollbar-thin">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">
          Quick Stats
        </h3>
        
        <StatItem
          label="Active Signals"
          value={stats?.total || 0}
          icon={<Radio className="w-5 h-5" />}
          trend={{ value: 12, positive: true }}
          accentColor="text-primary"
          isLoading={isLoading}
        />

        <StatItem
          label="Critical (P1)"
          value={stats?.byPriority?.P1 || 0}
          icon={<AlertTriangle className="w-5 h-5" />}
          accentColor="text-destructive"
          isLoading={isLoading}
        />

        <StatItem
          label="Validated"
          value={stats?.byStatus?.validated || 0}
          icon={<ShieldCheck className="w-5 h-5" />}
          trend={{ value: 8, positive: true }}
          accentColor="text-savanna"
          isLoading={isLoading}
        />

        <StatItem
          label="Awaiting Triage"
          value={stats?.byStatus?.new || 0}
          icon={<TrendingUp className="w-5 h-5" />}
          accentColor="text-sunset"
          isLoading={isLoading}
        />

        {/* Triage Completion Ring */}
        <Card className="border-0 neuro-card mt-6">
          <CardContent className="p-6 flex flex-col items-center">
            <CircularProgress
              value={triageRate}
              label="Triage Rate"
              sublabel="Signals processed"
            />
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border/50">
        <p className="text-[10px] text-muted-foreground text-center">
          Stats refresh automatically
        </p>
      </div>
    </div>
  );
}
