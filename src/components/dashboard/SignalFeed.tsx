import { useState } from 'react';
import { useSignals, Signal } from '@/hooks/useSignals';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PRIORITIES, SOURCE_TIERS, DISEASE_CATEGORIES } from '@/lib/constants';
import { formatDistanceToNow } from 'date-fns';
import { MapPin, Clock, Globe, Radio, Newspaper, Building2, Users } from 'lucide-react';

interface SignalFeedProps {
  onSignalSelect?: (signal: Signal) => void;
}

type SignalPriority = 'P1' | 'P2' | 'P3' | 'P4';
type SignalStatus = 'new' | 'triaged' | 'validated' | 'dismissed';

export function SignalFeed({ onSignalSelect }: SignalFeedProps) {
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: signals, isLoading, error } = useSignals({
    priority: priorityFilter !== 'all' ? [priorityFilter as SignalPriority] : undefined,
    status: statusFilter !== 'all' ? [statusFilter as SignalStatus] : undefined,
    limit: 50,
  });

  const getSourceIcon = (sourceType: string | null) => {
    switch (sourceType) {
      case 'official':
        return <Building2 className="h-3 w-3" />;
      case 'media':
        return <Newspaper className="h-3 w-3" />;
      case 'social':
        return <Users className="h-3 w-3" />;
      case 'community':
        return <Radio className="h-3 w-3" />;
      default:
        return <Globe className="h-3 w-3" />;
    }
  };

  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case 'P1':
        return 'priority-p1';
      case 'P2':
        return 'priority-p2';
      case 'P3':
        return 'priority-p3';
      case 'P4':
        return 'priority-p4';
      default:
        return '';
    }
  };

  const getTierClass = (tier: string) => {
    switch (tier) {
      case 'tier_1':
        return 'tier-1';
      case 'tier_2':
        return 'tier-2';
      case 'tier_3':
        return 'tier-3';
      default:
        return '';
    }
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-destructive">Error loading signals: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Signal Feed</CardTitle>
            <CardDescription>Real-time intelligence stream</CardDescription>
          </div>
          <div className="flex gap-2">
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="P1">P1</SelectItem>
                <SelectItem value="P2">P2</SelectItem>
                <SelectItem value="P3">P3</SelectItem>
                <SelectItem value="P4">P4</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[110px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="triaged">Triaged</SelectItem>
                <SelectItem value="validated">Validated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[600px] px-4">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="p-4 border rounded-lg">
                  <div className="flex gap-2 mb-2">
                    <Skeleton className="h-5 w-12" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ))}
            </div>
          ) : signals && signals.length > 0 ? (
            <div className="space-y-3 pb-4">
              {signals.map((signal) => (
                <div
                  key={signal.id}
                  className="signal-card p-4 border rounded-lg cursor-pointer hover:bg-muted/50"
                  onClick={() => onSignalSelect?.(signal)}
                >
                  {/* Header with badges */}
                  <div className="flex flex-wrap gap-2 mb-2">
                    <Badge className={getPriorityClass(signal.priority)}>
                      {signal.priority}
                    </Badge>
                    <Badge className={getTierClass(signal.source_tier)}>
                      {SOURCE_TIERS[signal.source_tier as keyof typeof SOURCE_TIERS]?.label || signal.source_tier}
                    </Badge>
                    {signal.disease_name && (
                      <Badge variant="outline">
                        {DISEASE_CATEGORIES[signal.disease_category as keyof typeof DISEASE_CATEGORIES]?.icon}{' '}
                        {signal.disease_name}
                      </Badge>
                    )}
                  </div>

                  {/* Original text (Lingua Fidelity) */}
                  <p className="text-sm mb-2 line-clamp-2">{signal.original_text}</p>

                  {/* Metadata */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {signal.location_country}
                      {signal.location_admin1 && `, ${signal.location_admin1}`}
                    </span>
                    <span className="flex items-center gap-1">
                      {getSourceIcon(signal.source_type)}
                      {signal.source_name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(signal.created_at), { addSuffix: true })}
                    </span>
                  </div>

                  {/* Language indicator */}
                  {signal.original_language && signal.original_language !== 'en' && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted rounded">
                        🌍 Original: {signal.original_language.toUpperCase()}
                        {signal.lingua_fidelity_score && (
                          <span className="text-savanna">
                            ({signal.lingua_fidelity_score}% fidelity)
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Globe className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No signals yet</p>
              <p className="text-sm text-muted-foreground">
                Intelligence will appear here as it's detected
              </p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
