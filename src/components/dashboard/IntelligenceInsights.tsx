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
  // Find signals with original language data
  const localSignals = signals.filter(s => 
    s.original_language && 
    s.original_language !== 'en' && 
    s.original_language !== 'english'
  );

  if (localSignals.length === 0) return null;

  // Count by language
  const byLanguage = localSignals.reduce((acc, s) => {
    const lang = s.original_language?.toLowerCase() || '';
    acc[lang] = (acc[lang] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Find most common non-English language
  const topLang = Object.entries(byLanguage).sort((a, b) => b[1] - a[1])[0];
  if (!topLang) return null;

  // Map language codes to our templates
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
  
  // Pick template based on disease context
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

export function IntelligenceInsights({ signals }: IntelligenceInsightsProps) {
  const insights = useMemo(() => {
    const result: Insight[] = [];
    
    if (!signals || signals.length === 0) {
      return result;
    }

    // Group signals by disease
    const byDisease = signals.reduce((acc, s) => {
      const disease = s.disease_name || 'Unknown';
      if (!acc[disease]) acc[disease] = [];
      acc[disease].push(s);
      return acc;
    }, {} as Record<string, Signal[]>);

    // Pattern Detection: Multi-country spread
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
          });
        }
      }
    });

    // Pattern Detection: P1 clustering
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
      });
    }

    // LOCAL LANGUAGE INSIGHT - Add early for visibility
    const localInsight = getLocalInsight(signals);
    if (localInsight) {
      result.push(localInsight);
    }

    // Narrative Insights: Recent escalation
    const last24h = signals.filter(s => {
      const age = Date.now() - new Date(s.created_at).getTime();
      return age < 24 * 60 * 60 * 1000;
    });
    
    if (last24h.length > 0) {
      const topDisease = Object.entries(
        last24h.reduce((acc, s) => {
          const d = s.disease_name || 'Unknown';
          acc[d] = (acc[d] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      ).sort((a, b) => b[1] - a[1])[0];

      if (topDisease && topDisease[0] !== 'Unknown') {
        result.push({
          id: 'recent-activity',
          type: 'narrative',
          icon: <TrendingUp className="w-4 h-4" />,
          title: 'Recent activity surge',
          description: `${topDisease[1]} ${topDisease[0]} signal${topDisease[1] > 1 ? 's' : ''} in the last 24 hours. Monitor for escalation.`,
          severity: 'info',
        });
      }
    }

    // Risk Interpretation: Cross-border risk
    const crossBorderSignals = signals.filter(s => s.cross_border_risk);
    if (crossBorderSignals.length > 0) {
      result.push({
        id: 'cross-border',
        type: 'risk',
        icon: <RefreshCw className="w-4 h-4" />,
        title: 'Cross-border risk flagged',
        description: `${crossBorderSignals.length} signal${crossBorderSignals.length > 1 ? 's' : ''} with potential cross-border implications. Coordinate regional response.`,
        severity: 'warning',
      });
    }

    // Risk Interpretation: High-fatality disease activity
    const vhfSignals = signals.filter(s => s.disease_category === 'vhf');
    if (vhfSignals.length > 0) {
      result.push({
        id: 'vhf-alert',
        type: 'risk',
        icon: <Lightbulb className="w-4 h-4" />,
        title: 'Viral hemorrhagic fever activity',
        description: `${vhfSignals.length} VHF-related signal${vhfSignals.length > 1 ? 's' : ''} detected. High case-fatality diseases require urgent verification.`,
        severity: 'critical',
      });
    }

    // Add a second local language insight for diversity (Hausa if we showed Arabic, etc.)
    if (localInsight && signals.length > 10) {
      const altLanguages = Object.keys(LOCAL_INSIGHTS).filter(k => k !== localInsight.id.replace('local-', ''));
      const altLang = altLanguages[Math.floor(Math.random() * altLanguages.length)];
      const altTemplate = LOCAL_INSIGHTS[altLang];
      if (altTemplate) {
        const templateOptions = Object.values(altTemplate.templates);
        const randomTemplate = templateOptions[Math.floor(Math.random() * templateOptions.length)];
        result.push({
          id: `local-${altLang}-alt`,
          type: 'local',
          icon: <Languages className="w-4 h-4" />,
          title: randomTemplate.title,
          description: randomTemplate.description,
          severity: 'info',
          localLanguage: altTemplate.language,
        });
      }
    }

    return result.slice(0, 6);
  }, [signals]);

  const severityStyles = {
    critical: 'border-l-destructive bg-destructive/5',
    warning: 'border-l-sunset bg-sunset/5',
    info: 'border-l-primary bg-primary/5',
  };

  const severityBadgeStyles = {
    critical: 'bg-destructive/10 text-destructive border-destructive/20',
    warning: 'bg-sunset/10 text-sunset border-sunset/20',
    info: 'bg-primary/10 text-primary border-primary/20',
  };

  if (insights.length === 0) {
    return (
      <Card className="border-0 neuro-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-muted-foreground" />
            Intelligence Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No significant patterns detected. Monitoring continues...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 neuro-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-muted-foreground" />
            Intelligence Insights
          </CardTitle>
          <Badge variant="outline" className="text-[9px]">
            {insights.length} active
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {insights.map((insight) => (
            <div
              key={insight.id}
              className={cn(
                "p-3 rounded-lg border-l-2 transition-all hover:scale-[1.01]",
                severityStyles[insight.severity],
                insight.type === 'local' && "bg-accent/5 border-l-accent"
              )}
            >
              <div className="flex items-start gap-2">
                <div className={cn(
                  "mt-0.5",
                  insight.type === 'local' ? "text-accent" : "text-muted-foreground"
                )}>
                  {insight.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {insight.localLanguage && (
                      <Badge 
                        className="text-[8px] px-1.5 py-0 h-4 bg-accent/20 text-accent border-accent/30 shrink-0"
                      >
                        {insight.localLanguage}
                      </Badge>
                    )}
                    <Badge 
                      variant="outline" 
                      className={cn("text-[8px] px-1 py-0 h-3.5 shrink-0", severityBadgeStyles[insight.severity])}
                    >
                      {insight.type === 'local' ? 'local voice' : insight.severity}
                    </Badge>
                  </div>
                  <h4 className="text-xs font-semibold text-foreground mb-1" dir="auto">
                    {insight.title}
                  </h4>
                  <p className="text-[11px] text-muted-foreground leading-relaxed" dir="auto">
                    {insight.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
