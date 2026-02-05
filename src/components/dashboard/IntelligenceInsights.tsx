import { useMemo } from 'react';
import { Signal } from '@/hooks/useSignals';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  AlertTriangle,
  Globe,
  Lightbulb,
  Languages,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface IntelligenceInsightsProps {
  signals: Signal[];
}

interface Insight {
  id: string;
  type: 'pattern' | 'narrative' | 'risk' | 'local';
  icon: React.ReactNode;
  title: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
  localText?: string;
  localLanguage?: string;
  sourceSignal?: Signal;
}

// Local language insight templates
const LOCAL_INSIGHTS: Record<string, { language: string; templates: Record<string, { title: string; description: string }> }> = {
  arabic: {
    language: 'العربية',
    templates: {
      cholera: {
        title: 'تحذير: انتشار الكوليرا',
        description: 'تم رصد حالات كوليرا في المنطقة. يُرجى اتخاذ الاحتياطات اللازمة.',
      },
      outbreak: {
        title: 'تنبيه صحي عاجل',
        description: 'تم الإبلاغ عن تفشي مرض في المناطق المجاورة. راقب الأعراض.',
      },
    },
  },
  hausa: {
    language: 'Hausa',
    templates: {
      cholera: {
        title: 'Gargadi: Cutar Kwalara',
        description: 'An gano cutar Kwalara a yankin. A yi hankali da tsaftar abinci da ruwa.',
      },
      fever: {
        title: 'Zazzaɓi mai tsanani',
        description: 'An sami rahotanni game da zazzaɓi mai tsanani. A je asibiti nan da nan.',
      },
    },
  },
  yoruba: {
    language: 'Yorùbá',
    templates: {
      cholera: {
        title: 'Ìkìlọ̀: Àrùn Kọ́lẹ́rà',
        description: 'A ti rí àrùn kọ́lẹ́rà ní àgbègbè yìí. Ẹ ṣọ́ra pẹ̀lú omi àti oúnjẹ.',
      },
      outbreak: {
        title: 'Ìròyìn Ìlera Pàtàkì',
        description: 'Àrùn ń tàn káàkiri. Ẹ mọ́ra, ẹ sì tẹ̀lé àwọn ìlànà ìlera.',
      },
    },
  },
  swahili: {
    language: 'Kiswahili',
    templates: {
      cholera: {
        title: 'Tahadhari: Ugonjwa wa Kipindupindu',
        description: 'Kesi za kipindupindu zimegunduliwa. Hakikisha unakuwa maji safi.',
      },
      fever: {
        title: 'Homa kali imegundulika',
        description: 'Ripoti za homa kali katika eneo hili. Tafadhali nenda hospitali.',
      },
    },
  },
  amharic: {
    language: 'አማርኛ',
    templates: {
      outbreak: {
        title: 'የጤና ማስጠንቀቂያ',
        description: 'በአካባቢው የበሽታ ወረርሽኝ ተገኝቷል። ጥንቃቄ ያድርጉ።',
      },
      cholera: {
        title: 'የኮሌራ ማስጠንቀቂያ',
        description: 'የኮሌራ በሽታ ተገኝቷል። ንጹህ ውሃ ይጠቀሙ።',
      },
    },
  },
  french: {
    language: 'Français',
    templates: {
      cholera: {
        title: 'Alerte: Épidémie de Choléra',
        description: 'Des cas de choléra ont été signalés. Veillez à l\'hygiène de l\'eau.',
      },
      outbreak: {
        title: 'Alerte sanitaire régionale',
        description: 'Une flambée épidémique a été détectée. Surveillance renforcée requise.',
      },
    },
  },
};

function getLocalInsight(signals: Signal[]): Insight | null {
  const localSignals = signals.filter(s =>
    s.original_language &&
    s.original_language !== 'en' &&
    s.original_language !== 'english'
  );

  if (localSignals.length === 0) return null;

  const byLanguage = localSignals.reduce((acc, s) => {
    const lang = s.original_language?.toLowerCase() || '';
    acc[lang] = (acc[lang] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topLang = Object.entries(byLanguage).sort((a, b) => b[1] - a[1])[0];
  if (!topLang) return null;

  const langMap: Record<string, string> = {
    ar: 'arabic', arabic: 'arabic',
    ha: 'hausa', hausa: 'hausa',
    yo: 'yoruba', yoruba: 'yoruba',
    sw: 'swahili', swahili: 'swahili', kiswahili: 'swahili',
    am: 'amharic', amharic: 'amharic',
    fr: 'french', french: 'french', français: 'french',
  };

  const templateKey = langMap[topLang[0]];
  if (!templateKey || !LOCAL_INSIGHTS[templateKey]) return null;

  const template = LOCAL_INSIGHTS[templateKey];
  const diseases = localSignals.map(s => s.disease_name?.toLowerCase() || '');
  let insightType: 'cholera' | 'fever' | 'outbreak' = 'outbreak';

  if (diseases.some(d => d.includes('cholera') || d.includes('kwalara'))) {
    insightType = 'cholera';
  } else if (diseases.some(d => d.includes('fever') || d.includes('ebola') || d.includes('lassa'))) {
    insightType = 'fever';
  }

  const selectedTemplate = template.templates[insightType] || template.templates.outbreak || Object.values(template.templates)[0];
  if (!selectedTemplate) return null;

  return {
    id: `local-${templateKey}`,
    type: 'local',
    icon: <Languages className="w-4 h-4" />,
    title: selectedTemplate.title,
    description: selectedTemplate.description,
    severity: 'info',
    localLanguage: template.language,
  };
}

function TacticalInsightCard({ insight }: { insight: Insight }) {
  const severityStyles = {
    critical: 'bg-destructive/10 text-destructive border-destructive/20',
    warning: 'bg-sunset/10 text-sunset border-sunset/20',
    info: 'bg-primary/10 text-primary border-primary/20',
  };

  const borderStyles = {
    critical: 'border-l-destructive',
    warning: 'border-l-sunset',
    info: 'border-l-primary',
  };

  const handleSourceClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (insight.sourceSignal?.source_url) {
      window.open(insight.sourceSignal.source_url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className={cn(
      "group relative p-4 rounded-xl border border-border/40 bg-card/40 backdrop-blur-sm overflow-hidden transition-all duration-500 hover:scale-[1.02] grid-bg-tactical",
      borderStyles[insight.severity],
      "border-l-4"
    )}>
      {/* Decorative Scanner */}
      <div className="absolute top-0 right-0 w-8 h-8 opacity-10 group-hover:opacity-40 transition-opacity">
        <div className="w-full h-full border-t border-r border-primary" />
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <Badge
            className={cn("text-[9px] font-black tracking-widest uppercase px-1.5 py-0 h-4 border-current bg-transparent", severityStyles[insight.severity])}
          >
            {insight.type} REPORT
          </Badge>
          <div className={cn("text-muted-foreground transition-transform group-hover:rotate-12", insight.severity === 'critical' ? 'text-destructive' : 'text-primary/70')}>
            {insight.icon}
          </div>
        </div>

        <h4 className="text-sm font-black text-foreground mb-2 leading-tight tracking-tight uppercase">
          {insight.title}
        </h4>

        <p className="text-xs leading-relaxed text-muted-foreground/90 font-medium mb-4 italic">
          "{insight.description}"
        </p>

        <div className="flex items-center justify-between pt-3 border-t border-border/30">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-savanna animate-pulse" />
            <span className="text-[9px] font-mono text-muted-foreground uppercase">Live Update</span>
          </div>

          {insight.sourceSignal && (
            <button
              onClick={handleSourceClick}
              className="flex items-center gap-1.5 text-[9px] font-black text-primary/60 hover:text-primary transition-colors tracking-widest uppercase border-b border-primary/20 hover:border-primary"
            >
              Verify Source ↗
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function IntelligenceInsights({ signals }: IntelligenceInsightsProps) {
  const insights = useMemo(() => {
    const result: Insight[] = [];

    if (!signals || signals.length === 0) {
      return result;
    }

    const byDisease = signals.reduce((acc, s) => {
      const disease = s.disease_name || 'Unknown';
      if (!acc[disease]) acc[disease] = [];
      acc[disease].push(s);
      return acc;
    }, {} as Record<string, Signal[]>);

    Object.entries(byDisease).forEach(([disease, diseaseSignals]) => {
      const countries = [...new Set(diseaseSignals.map(s => s.location_country))];
      if (countries.length >= 2 && disease !== 'Unknown') {
        const recentSignals = diseaseSignals.filter(s => {
          const age = Date.now() - new Date(s.created_at).getTime();
          return age < 7 * 24 * 60 * 60 * 1000;
        });

        if (recentSignals.length >= 2) {
          result.push({
            id: `spread-${disease}`,
            type: 'pattern',
            icon: <Globe className="w-4 h-4" />,
            title: 'Multi-country spread detected',
            description: `${disease} signals in ${countries.length} countries (${countries.slice(0, 3).join(', ')}${countries.length > 3 ? '...' : ''}) within 7 days.`,
            severity: 'warning',
            sourceSignal: recentSignals[0]
          });
        }
      }
    });

    const p1Signals = signals.filter(s => s.priority === 'P1');
    if (p1Signals.length >= 2) {
      const p1Countries = [...new Set(p1Signals.map(s => s.location_country))];
      result.push({
        id: 'p1-cluster',
        type: 'pattern',
        icon: <AlertTriangle className="w-4 h-4" />,
        title: 'Critical signal cluster',
        description: `${p1Signals.length} P1 alerts active across ${p1Countries.length} countries. Immediate attention required.`,
        severity: 'critical',
        sourceSignal: p1Signals[0]
      });
    }

    const localInsight = getLocalInsight(signals);
    if (localInsight) {
      const source = signals.find(s => s.original_language && s.original_language !== 'en');
      result.push({ ...localInsight, sourceSignal: source });
    }

    const last24h = signals.filter(s => {
      const age = Date.now() - new Date(s.created_at).getTime();
      return age < 24 * 60 * 60 * 1000;
    });

    if (last24h.length > 0) {
      const counts = last24h.reduce((acc, s) => {
        const d = s.disease_name || 'Unknown';
        acc[d] = (acc[d] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topDisease = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];

      if (topDisease && topDisease[0] !== 'Unknown') {
        result.push({
          id: 'recent-activity',
          type: 'narrative',
          icon: <TrendingUp className="w-4 h-4" />,
          title: 'Recent activity surge',
          description: `${topDisease[1]} ${topDisease[0]} signal${topDisease[1] > 1 ? 's' : ''} in the last 24 hours. Monitor for escalation.`,
          severity: 'info',
          sourceSignal: last24h.find(s => s.disease_name === topDisease[0])
        });
      }
    }

    const crossBorderSignals = signals.filter(s => s.cross_border_risk);
    if (crossBorderSignals.length > 0) {
      result.push({
        id: 'cross-border',
        type: 'risk',
        icon: <RefreshCw className="w-4 h-4" />,
        title: 'Cross-border risk flagged',
        description: `${crossBorderSignals.length} signal${crossBorderSignals.length > 1 ? 's' : ''} with potential cross-border implications. Coordinate regional response.`,
        severity: 'warning',
        sourceSignal: crossBorderSignals[0]
      });
    }

    const vhfSignals = signals.filter(s => s.disease_category === 'vhf');
    if (vhfSignals.length > 0) {
      result.push({
        id: 'vhf-alert',
        type: 'risk',
        icon: <Lightbulb className="w-4 h-4" />,
        title: 'Viral hemorrhagic fever activity',
        description: `${vhfSignals.length} VHF-related signal${vhfSignals.length > 1 ? 's' : ''} detected. High case-fatality diseases require urgent verification.`,
        severity: 'critical',
        sourceSignal: vhfSignals[0]
      });
    }

    return result.slice(0, 6);
  }, [signals]);

  if (insights.length === 0) {
    return (
      <Card className="border-border/40 bg-card/40 backdrop-blur-sm shadow-xl overflow-hidden relative grid-bg-tactical">
        <CardHeader className="pb-3 relative z-10 border-b border-border/20">
          <CardTitle className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2 text-primary">
            <Lightbulb className="w-4 h-4" />
            Strategic Intelligence Reports
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10">
          <p className="text-sm text-muted-foreground text-center py-10 font-mono uppercase tracking-widest opacity-60">
            [ No active anomalous patterns detected ]
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/40 bg-card/10 backdrop-blur-sm shadow-2xl overflow-hidden relative">
      <CardHeader className="pb-4 relative z-10 border-b border-border/20 bg-card/30">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2 text-primary">
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
              <Lightbulb className="w-4 h-4" />
            </div>
            Strategic Intelligence Reports
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono text-muted-foreground uppercase animate-pulse">Scanning Hub...</span>
            <Badge className="text-[10px] font-mono bg-primary/10 border-primary/20 text-primary">
              {insights.length} REPORTS ACTIVE
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {insights.map((insight) => (
            <TacticalInsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      </CardContent>

      <div className="absolute inset-0 border-scan opacity-5 pointer-events-none" />
    </Card>
  );
}
