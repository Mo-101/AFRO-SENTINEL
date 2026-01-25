import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, Activity, CheckCircle, Clock } from 'lucide-react';
import { useSignalStats } from '@/hooks/useSignals';

export function StatsCards() {
  const { data: stats, isLoading } = useSignalStats();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-32 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Critical Signals',
      value: stats?.byPriority.P1 || 0,
      description: 'P1 priority requiring immediate attention',
      icon: AlertTriangle,
      className: 'border-priority-p1/50 bg-priority-p1/5',
      iconClassName: 'text-priority-p1',
    },
    {
      title: 'High Priority',
      value: stats?.byPriority.P2 || 0,
      description: 'P2 signals needing response',
      icon: Activity,
      className: 'border-priority-p2/50 bg-priority-p2/5',
      iconClassName: 'text-priority-p2',
    },
    {
      title: 'New Signals',
      value: stats?.byStatus.new || 0,
      description: 'Awaiting triage',
      icon: Clock,
      className: 'border-sahara/50 bg-sahara/5',
      iconClassName: 'text-sahara',
    },
    {
      title: 'Validated',
      value: stats?.byStatus.validated || 0,
      description: 'Confirmed and verified signals',
      icon: CheckCircle,
      className: 'border-savanna/50 bg-savanna/5',
      iconClassName: 'text-savanna',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title} className={card.className}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon className={`h-4 w-4 ${card.iconClassName}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
