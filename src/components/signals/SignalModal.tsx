import { Signal } from '@/hooks/useSignals';
import { SOURCE_TIERS, DISEASE_CATEGORIES } from '@/lib/constants';
import { 
  X, ExternalLink, Activity, Skull, MapPin, Calendar, Database, 
  Globe, Tag, ShieldCheck, Radio, Newspaper, Building2 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface SignalModalProps {
  signal: Signal | null;
  onClose: () => void;
}

export function SignalModal({ signal, onClose }: SignalModalProps) {
  if (!signal) return null;

  const getSourceConfig = (tier: string) => {
    const configs: Record<string, { color: string; bg: string; border: string; tierLabel: string; Icon: typeof ShieldCheck }> = {
      tier_1: { color: 'text-savanna', bg: 'bg-savanna/10', border: 'border-savanna/30', tierLabel: 'High Fidelity / Official', Icon: ShieldCheck },
      tier_2: { color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/30', tierLabel: 'Verified Field / NGO', Icon: Newspaper },
      tier_3: { color: 'text-muted-foreground', bg: 'bg-muted', border: 'border-border', tierLabel: 'Grassroots Signal / Community', Icon: Radio },
    };
    return configs[tier] || configs.tier_3;
  };

  const getSourceIcon = (sourceType: string | null) => {
    switch (sourceType) {
      case 'official': return ShieldCheck;
      case 'media': return Newspaper;
      case 'social': return Globe;
      case 'community': return Radio;
      default: return Globe;
    }
  };

  const sourceConfig = getSourceConfig(signal.source_tier);
  const CategoryIcon = getSourceIcon(signal.source_type);
  const diseaseInfo = signal.disease_category
    ? DISEASE_CATEGORIES[signal.disease_category as keyof typeof DISEASE_CATEGORIES]
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in-up"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] border"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-8 border-b flex justify-between items-start bg-muted/30">
          <div>
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <Badge className={cn(
                signal.priority === 'P1' && 'priority-p1',
                signal.priority === 'P2' && 'priority-p2',
                signal.priority === 'P3' && 'priority-p3',
                signal.priority === 'P4' && 'priority-p4'
              )}>
                {signal.priority} Alert
              </Badge>
              {signal.disease_name && (
                <Badge variant="outline">
                  {diseaseInfo?.icon} {signal.disease_name}
                </Badge>
              )}
            </div>
            <h2 className="text-2xl font-black text-foreground leading-tight mb-1">
              {signal.disease_name || 'Health Signal'} - {signal.location_country}
            </h2>
            <div className="flex items-center text-muted-foreground text-xs font-bold uppercase tracking-wider gap-3 flex-wrap">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {signal.location_country} ({signal.location_country_iso || 'N/A'})
                {signal.location_admin1 && ` / ${signal.location_admin1}`}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDistanceToNow(new Date(signal.created_at), { addSuffix: true })}
              </span>
            </div>
          </div>
          <Button variant="outline" size="icon" onClick={onClose} className="rounded-full">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto scrollbar-thin space-y-8">
          {/* Epi Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-savanna/10 border border-savanna/30">
              <div className="flex items-center gap-2 text-savanna mb-2">
                <Activity className="w-5 h-5" />
                <span className="text-[10px] font-black uppercase tracking-widest">Suspected Cases</span>
              </div>
              <div className="text-3xl font-black text-foreground">
                {signal.reported_cases?.toLocaleString() || 'N/A'}
              </div>
            </div>
            <div className="p-5 rounded-2xl bg-muted border border-border">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Skull className="w-5 h-5" />
                <span className="text-[10px] font-black uppercase tracking-widest">Reported Deaths</span>
              </div>
              <div className="text-3xl font-black text-foreground">
                {signal.reported_deaths?.toLocaleString() || '0'}
              </div>
            </div>
          </div>

          {/* Lingua Audit Engine */}
          <div className="bg-muted/50 rounded-2xl p-6 border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-sm font-black text-foreground uppercase tracking-widest">
                  Lingua Audit Engine
                </h3>
              </div>
              {signal.original_language && signal.original_language !== 'en' && (
                <Badge variant="secondary" className="text-[10px] font-black">
                  🏠 LOCAL VOICE DETECTED
                </Badge>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-wider block mb-1">
                  Source Text ({signal.original_language?.toUpperCase() || 'EN'})
                </span>
                <p className="text-muted-foreground italic font-medium leading-relaxed">
                  "{signal.original_text}"
                </p>
              </div>

              {signal.lingua_fidelity_score && (
                <div className="flex items-center gap-2">
                  <Tag className="w-3 h-3 text-muted-foreground" />
                  <span className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">
                    Lingua Fidelity Score: 
                  </span>
                  <span className="text-sm font-bold text-savanna">
                    {signal.lingua_fidelity_score}%
                  </span>
                </div>
              )}

              <div className="h-px bg-border" />

              {signal.translated_text && (
                <div>
                  <span className="text-[9px] font-black text-muted-foreground uppercase tracking-wider block mb-1">
                    AI Analytical Translation
                  </span>
                  <p className="text-muted-foreground font-medium leading-relaxed">
                    {signal.translated_text}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Source Validation */}
          <div>
            <h3 className="text-sm font-black text-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
              <Database className="w-4 h-4 text-muted-foreground" />
              Validation & Source Category
            </h3>
            <div className={cn(
              'p-6 rounded-2xl border-2 flex flex-col gap-6 transition-all',
              sourceConfig.bg,
              sourceConfig.border
            )}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    'w-14 h-14 rounded-2xl bg-card border flex items-center justify-center shadow-sm',
                    sourceConfig.border
                  )}>
                    <CategoryIcon className={cn('w-7 h-7', sourceConfig.color)} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={cn('text-[10px] font-black uppercase tracking-[0.2em]', sourceConfig.color)}>
                        {signal.source_type || 'Source'} Category
                      </span>
                      <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                        {SOURCE_TIERS[signal.source_tier as keyof typeof SOURCE_TIERS]?.label || 'Tier 3'} Weight
                      </span>
                    </div>
                    <div className="text-lg font-black text-foreground leading-tight">
                      {signal.source_name}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">
                    Reliability
                  </div>
                  <div className={cn('text-2xl font-black', sourceConfig.color)}>
                    T{signal.source_tier === 'tier_1' ? '1' : signal.source_tier === 'tier_2' ? '2' : '3'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-card/70 border rounded-xl p-3 shadow-sm">
                  <span className="text-[8px] font-black text-muted-foreground uppercase block mb-1.5">
                    Weight Description
                  </span>
                  <div className="text-[10px] font-black text-foreground uppercase mb-2">
                    {sourceConfig.tierLabel}
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full', sourceConfig.color.replace('text-', 'bg-'))}
                      style={{
                        width: signal.source_tier === 'tier_1' ? '100%' : signal.source_tier === 'tier_2' ? '65%' : '35%'
                      }}
                    />
                  </div>
                </div>
                <div className="bg-card/70 border rounded-xl p-3 shadow-sm">
                  <span className="text-[8px] font-black text-muted-foreground uppercase block mb-1">
                    Signal Fidelity
                  </span>
                  <div className="text-sm font-black text-foreground mt-1">
                    {signal.confidence_score}% Probability
                  </div>
                  <p className="text-[9px] text-muted-foreground font-bold uppercase mt-1">
                    Cross-Verification Active
                  </p>
                </div>
              </div>

              {signal.source_url && (
                <a
                  href={signal.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(
                    'flex items-center justify-center gap-2 p-3.5 rounded-xl border font-black text-[10px] uppercase tracking-widest transition-all bg-card hover:shadow-xl active:scale-[0.98]',
                    sourceConfig.border,
                    sourceConfig.color
                  )}
                >
                  Open Raw Intelligence Source <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>

          {/* Analyst Notes */}
          {signal.analyst_notes && (
            <div className="bg-sunset/10 border border-sunset/30 rounded-xl p-4">
              <h4 className="text-xs font-black text-sunset uppercase mb-2">Analyst Notes</h4>
              <p className="text-sm text-muted-foreground">{signal.analyst_notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
