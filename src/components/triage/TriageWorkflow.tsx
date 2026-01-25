import { useState } from 'react';
import { useSignals, useSignalStats } from '@/hooks/useSignals';
import { SignalTriageCard } from './SignalTriageCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Inbox,
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type StatusFilter = 'new' | 'triaged' | 'validated' | 'dismissed' | 'all';
type PriorityFilter = 'P1' | 'P2' | 'P3' | 'P4' | 'all';

export function TriageWorkflow() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('new');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useSignalStats();
  
  const signalFilters = {
    status: statusFilter === 'all' ? undefined : [statusFilter],
    priority: priorityFilter === 'all' ? undefined : [priorityFilter],
    limit: 100,
  };
  
  const { data: signals, isLoading: signalsLoading, refetch: refetchSignals } = useSignals(signalFilters);

  const filteredSignals = signals?.filter((signal) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      signal.disease_name?.toLowerCase().includes(query) ||
      signal.location_country.toLowerCase().includes(query) ||
      signal.original_text.toLowerCase().includes(query) ||
      signal.translated_text?.toLowerCase().includes(query)
    );
  }) || [];

  const handleRefresh = () => {
    refetchSignals();
    refetchStats();
  };

  const statusTabs = [
    { value: 'new', label: 'Inbox', icon: Inbox, count: stats?.byStatus.new || 0 },
    { value: 'triaged', label: 'Triaged', icon: ClipboardCheck, count: stats?.byStatus.triaged || 0 },
    { value: 'validated', label: 'Validated', icon: CheckCircle2, count: stats?.byStatus.validated || 0 },
    { value: 'dismissed', label: 'Dismissed', icon: XCircle, count: stats?.byStatus.dismissed || 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Pending Triage</p>
                <p className="text-3xl font-black text-foreground mt-1">
                  {statsLoading ? <Skeleton className="h-9 w-16" /> : stats?.byStatus.new || 0}
                </p>
              </div>
              <Inbox className="w-8 h-8 text-blue-400/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-destructive uppercase tracking-wider">P1 Critical</p>
                <p className="text-3xl font-black text-foreground mt-1">
                  {statsLoading ? <Skeleton className="h-9 w-16" /> : stats?.byPriority.P1 || 0}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-destructive/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-savanna/10 to-savanna/5 border-savanna/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-savanna uppercase tracking-wider">Validated</p>
                <p className="text-3xl font-black text-foreground mt-1">
                  {statsLoading ? <Skeleton className="h-9 w-16" /> : stats?.byStatus.validated || 0}
                </p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-savanna/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-primary uppercase tracking-wider">Total Signals</p>
                <p className="text-3xl font-black text-foreground mt-1">
                  {statsLoading ? <Skeleton className="h-9 w-16" /> : stats?.total || 0}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-primary/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by disease, country, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select
                value={priorityFilter}
                onValueChange={(value) => setPriorityFilter(value as PriorityFilter)}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="P1">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-destructive" />
                      P1 Critical
                    </span>
                  </SelectItem>
                  <SelectItem value="P2">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-sunset" />
                      P2 High
                    </span>
                  </SelectItem>
                  <SelectItem value="P3">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-sahara" />
                      P3 Medium
                    </span>
                  </SelectItem>
                  <SelectItem value="P4">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-savanna" />
                      P4 Low
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Triage Interface */}
      <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
        <TabsList className="bg-muted/50 p-1">
          {statusTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="gap-2 data-[state=active]:bg-background"
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                <Badge
                  variant="secondary"
                  className={cn(
                    'ml-1 text-[10px] font-bold',
                    tab.value === 'new' && tab.count > 0 && 'bg-blue-500 text-white',
                    tab.value === 'triaged' && tab.count > 0 && 'bg-amber-500 text-white'
                  )}
                >
                  {tab.count}
                </Badge>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {statusTabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="mt-6">
            {signalsLoading ? (
              <div className="grid gap-6 md:grid-cols-2">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-[400px] rounded-xl" />
                ))}
              </div>
            ) : filteredSignals.length === 0 ? (
              <Card className="py-12">
                <CardContent className="text-center">
                  <tab.icon className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-bold text-foreground mb-2">
                    No {tab.label.toLowerCase()} signals
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {tab.value === 'new'
                      ? 'All signals have been processed. Great work!'
                      : `No signals with "${tab.label}" status found.`}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {filteredSignals.map((signal) => (
                  <SignalTriageCard
                    key={signal.id}
                    signal={signal}
                    onStatusChange={handleRefresh}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
