import { Signal } from '@/hooks/useSignals';
import { SOURCE_TIERS, DISEASE_CATEGORIES } from '@/lib/constants';
import { ShieldCheck, FileText, AlertTriangle, Newspaper, Radio, Globe, Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface SignalCardProps {
  signal: Signal;
  onClick: (signal: Signal) => void;
}

export function SignalCard({ signal, onClick }: SignalCardProps) {
  const getConfidenceColor = (score: number) => {
    if (score >= 80) return 'bg-savanna';
    if (score >= 50) return 'bg-sahara';
    return 'bg-destructive';
  };

  const getTierMeta = (tier: string) => {
    if (tier === 'tier_1') return { label: 'High Fidelity', Icon: ShieldCheck, color: 'text-savanna' };
    if (tier === 'tier_2') return { label: 'Verified Field', Icon: Newspaper, color: 'text-primary' };
    return { label: 'Grassroots', Icon: Radio, color: 'text-muted-foreground' };
  };

  const getSourceIcon = (sourceType: string | null) => {
    switch (sourceType) {
      case 'official': return Building2;
      case 'media': return Newspaper;
      case 'social': return Globe;
      case 'community': return Radio;
      default: return Globe;
    }
  };

  // Priority indicator color (small accent, not overwhelming)
  const getPriorityAccent = (priority: string) => {
    switch (priority) {
      case 'P1': return 'bg-destructive';
      case 'P2': return 'bg-sunset';
      case 'P3': return 'bg-sahara';
      default: return 'bg-savanna';
    }
  };

  const tierMeta = getTierMeta(signal.source_tier);
  const SourceIcon = getSourceIcon(signal.source_type);
  const diseaseInfo = signal.disease_category 
    ? DISEASE_CATEGORIES[signal.disease_category as keyof typeof DISEASE_CATEGORIES]
    : null;

  return (
    <div
      onClick={() => onClick(signal)}
      className="relative neuro-card p-6 rounded-2xl transition-all cursor-pointer hover:scale-[1.02] flex flex-col h-full group"
    >
      {/* Priority indicator line */}
      <div className={cn('absolute top-0 left-6 right-6 h-1 rounded-b-full', getPriorityAccent(signal.priority))} />
      {/* Header */}
      <div className="flex justify-between items-start mb-4 mt-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className="bg-primary/10 text-primary border-0 font-semibold">
            {signal.priority}
          </Badge>
          {signal.disease_name && (
            <Badge variant="outline" className="text-xs border-border/50">
              {diseaseInfo?.icon} {signal.disease_name}
            </Badge>
          )}
          {signal.original_language && signal.original_language !== 'en' && (
            <Badge className="text-[9px] font-semibold uppercase bg-accent/10 text-accent border-0">
              🏠 LOCAL VOICE
            </Badge>
          )}
        </div>
        <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
          {signal.priority === 'P1' && <AlertTriangle className="w-3 h-3 text-destructive" />}
          {formatDistanceToNow(new Date(signal.created_at), { addSuffix: true })}
        </span>
      </div>

      {/* Headline */}
      <h4 className="text-lg font-bold text-foreground leading-tight mb-2 group-hover:text-primary transition-colors line-clamp-2">
        {signal.disease_name || 'Health Signal'} - {signal.location_country}
      </h4>
      {/* Original Text (Lingua Fidelity) */}
      {signal.original_text && (
        <div className="shadow-inset p-3 rounded-xl mb-4">
          <div className="text-[8px] font-semibold text-muted-foreground uppercase mb-1 tracking-wider">
            {signal.original_language?.toUpperCase() || 'EN'} Transcription
          </div>
          <p className="text-[11px] text-muted-foreground font-medium italic line-clamp-2 leading-relaxed">
            "{signal.original_text}"
          </p>
        </div>
      )}

      {/* Summary */}
      <p className="text-xs text-muted-foreground font-medium leading-relaxed mb-6 line-clamp-3 flex-1">
        {signal.translated_text || signal.original_text}
      </p>

      {/* Source Attribution */}
      <div className="mb-4 space-y-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <div className={cn(
            'flex items-center gap-1.5 px-2 py-1 rounded-lg text-[8px] font-semibold uppercase tracking-wider shadow-inset',
            tierMeta.color
          )}>
            <SourceIcon className="w-3 h-3" />
            {signal.source_type || 'Source'}
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-primary text-primary-foreground text-[8px] font-semibold uppercase tracking-wider">
            {SOURCE_TIERS[signal.source_tier as keyof typeof SOURCE_TIERS]?.label || 'TIER 3'} RELIABILITY
          </div>
        </div>
        <div className="flex items-center gap-2 px-1">
          <div className="w-1.5 h-1.5 rounded-full bg-primary/30" />
          <span className="text-[10px] font-medium text-muted-foreground truncate">{signal.source_name}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto flex items-center justify-between pt-4 border-t border-border/30">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full shadow-inset flex items-center justify-center">
            <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider">Confidence</span>
            <div className="flex items-center gap-1.5">
              <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden shadow-inset">
                <div
                  className={cn('h-full rounded-full', getConfidenceColor(signal.confidence_score))}
                  style={{ width: `${signal.confidence_score}%` }}
                />
              </div>
              <span className="text-[9px] font-semibold text-foreground">{signal.confidence_score}%</span>
            </div>
          </div>
        </div>
        <button className="text-muted-foreground hover:text-primary transition-all hover:scale-110 active:scale-95">
          <FileText className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
