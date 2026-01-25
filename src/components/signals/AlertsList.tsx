import { useState, useMemo } from 'react';
import { Signal } from '@/hooks/useSignals';
import { SOURCE_TIERS, DISEASE_CATEGORIES } from '@/lib/constants';
import { 
  Filter, Eye, AlertCircle, MapPin, Activity, X, ExternalLink, 
  Globe2, ShieldCheck, Languages 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface AlertsListProps {
  signals: Signal[];
  onSignalSelect?: (signal: Signal) => void;
}

function PriorityBadge({ priority }: { priority: string }) {
  return (
    <Badge className={cn(
      'text-xs font-bold',
      priority === 'P1' && 'priority-p1',
      priority === 'P2' && 'priority-p2',
      priority === 'P3' && 'priority-p3',
      priority === 'P4' && 'priority-p4'
    )}>
      {priority}
    </Badge>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    new: 'bg-primary/10 text-primary',
    triaged: 'bg-sunset/10 text-sunset',
    validated: 'bg-savanna/10 text-savanna',
    dismissed: 'bg-muted text-muted-foreground',
  };

  return (
    <Badge variant="outline" className={cn('uppercase text-[10px]', styles[status] || styles.new)}>
      {status}
    </Badge>
  );
}

export function AlertsList({ signals, onSignalSelect }: AlertsListProps) {
  const [filterText, setFilterText] = useState('');

  const normalize = (str: string | undefined | null): string => {
    if (!str) return '';
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  };

  const filteredSignals = useMemo(() => {
    const searchNormalized = normalize(filterText);
    if (!searchNormalized) return signals;

    const tokens = searchNormalized.split(/\s+/).filter((t) => t.length > 0);

    return signals.filter((signal) => {
      const metadataSurface = normalize(
        `${signal.disease_name || ''} ${signal.original_text || ''} ${signal.translated_text || ''} ` +
        `${signal.location_country || ''} ${signal.location_admin1 || ''} ${signal.source_name || ''} ` +
        `${signal.original_language || ''}`
      );

      return tokens.every((token) => metadataSurface.includes(token));
    });
  }, [signals, filterText]);

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-4 border-b">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-foreground rounded-lg">
              <Languages className="w-5 h-5 text-savanna" />
            </div>
            <h2 className="text-lg font-black text-foreground uppercase tracking-tight">
              Intelligence Stream
            </h2>
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search across English, Hausa, Swahili, French..."
              className="pl-9 pr-4 py-2 text-xs font-bold w-full sm:w-96"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 flex-1 overflow-auto">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-muted-foreground">
            <thead className="bg-muted text-[10px] uppercase font-black text-muted-foreground border-b sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 tracking-widest">Priority</th>
                <th className="px-6 py-4 tracking-widest">Status</th>
                <th className="px-6 py-4 tracking-widest">Hazard Event</th>
                <th className="px-6 py-4 tracking-widest">Location</th>
                <th className="px-6 py-4 tracking-widest">Source</th>
                <th className="px-6 py-4 tracking-widest">Evidence</th>
                <th className="px-6 py-4 tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filteredSignals.map((signal) => (
                <tr
                  key={signal.id}
                  className="hover:bg-muted/50 transition-colors cursor-pointer group"
                  onClick={() => onSignalSelect?.(signal)}
                >
                  <td className="px-6 py-4">
                    <PriorityBadge priority={signal.priority} />
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={signal.status} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col max-w-xs">
                      <span className="font-bold text-foreground leading-tight group-hover:text-primary transition-colors truncate">
                        {signal.disease_name || 'Health Signal'}
                      </span>
                      <span className="text-[10px] font-black text-muted-foreground flex items-center mt-1 uppercase tracking-tighter">
                        {signal.disease_category && DISEASE_CATEGORIES[signal.disease_category as keyof typeof DISEASE_CATEGORIES]?.icon}{' '}
                        {signal.disease_category || 'unknown'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center text-xs font-bold text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5 text-muted-foreground/50 mr-1.5" />
                      <span className="truncate max-w-[120px]">
                        {signal.location_country}
                        {signal.location_admin1 && ` / ${signal.location_admin1}`}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-foreground truncate max-w-[120px]">
                        {signal.source_name}
                      </span>
                      <Badge variant="secondary" className="text-[8px] w-fit mt-1">
                        {SOURCE_TIERS[signal.source_tier as keyof typeof SOURCE_TIERS]?.label || 'TIER 3'}
                      </Badge>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-foreground tracking-tight">
                        {signal.confidence_score}% conf.
                      </span>
                      <div className="w-16 h-1 bg-muted rounded-full mt-1.5 overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${signal.confidence_score}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSignalSelect?.(signal);
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              {filteredSignals.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center text-muted-foreground">
                    <div className="flex flex-col items-center">
                      <AlertCircle className="w-12 h-12 mb-4 opacity-20" />
                      <p className="text-lg font-black uppercase tracking-tighter">No intelligence matches</p>
                      <p className="text-xs font-bold text-muted-foreground mt-1">
                        Try searching by localized disease names or language (e.g. 'Kiswahili')
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
