import { useMemo } from 'react';
import { Signal } from '@/hooks/useSignals';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  AlertTriangle, 
  Globe, 
  Lightbulb,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface IntelligenceInsightsProps {
  signals: Signal[];
}

interface Insight {
  id: string;
  type: 'pattern' | 'narrative' | 'risk';
  icon: React.ReactNode;
  title: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
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

    // Group signals by country
    const byCountry = signals.reduce((acc, s) => {
      if (!acc[s.location_country]) acc[s.location_country] = [];
      acc[s.location_country].push(s);
      return acc;
    }, {} as Record<string, Signal[]>);

    // Pattern Detection: Multi-country spread
    Object.entries(byDisease).forEach(([disease, diseaseSignals]) => {
      const countries = [...new Set(diseaseSignals.map(s => s.location_country))];
      if (countries.length >= 2 && disease !== 'Unknown') {
        const recentSignals = diseaseSignals.filter(s => {
          const age = Date.now() - new Date(s.created_at).getTime();
          return age < 7 * 24 * 60 * 60 * 1000; // Last 7 days
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

    return result.slice(0, 6); // Limit to 6 insights
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
                severityStyles[insight.severity]
              )}
            >
              <div className="flex items-start gap-2">
                <div className="text-muted-foreground mt-0.5">
                  {insight.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-xs font-semibold text-foreground truncate">
                      {insight.title}
                    </h4>
                    <Badge 
                      variant="outline" 
                      className={cn("text-[8px] px-1 py-0 h-3.5 shrink-0", severityBadgeStyles[insight.severity])}
                    >
                      {insight.severity}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
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
