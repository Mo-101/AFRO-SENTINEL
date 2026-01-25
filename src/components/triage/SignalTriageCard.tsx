import { useState } from 'react';
import { Signal, useUpdateSignal } from '@/hooks/useSignals';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import {
  CheckCircle2,
  XCircle,
  ClipboardCheck,
  AlertTriangle,
  MapPin,
  Calendar,
  Users,
  Skull,
  Globe,
  MessageSquare,
  Loader2,
  ExternalLink,
} from 'lucide-react';

interface SignalTriageCardProps {
  signal: Signal;
  onStatusChange?: () => void;
}

export function SignalTriageCard({ signal, onStatusChange }: SignalTriageCardProps) {
  const { user } = useAuth();
  const updateSignal = useUpdateSignal();
  const [notes, setNotes] = useState(signal.analyst_notes || '');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleStatusChange = async (
    newStatus: 'triaged' | 'validated' | 'dismissed'
  ) => {
    if (!user) {
      toast.error('You must be logged in to triage signals');
      return;
    }

    try {
      const updates: Record<string, any> = {
        status: newStatus,
        analyst_notes: notes,
      };

      if (newStatus === 'triaged') {
        updates.triaged_by = user.id;
        updates.triaged_at = new Date().toISOString();
      } else if (newStatus === 'validated' || newStatus === 'dismissed') {
        updates.validated_by = user.id;
        updates.validated_at = new Date().toISOString();
      }

      await updateSignal.mutateAsync({ id: signal.id, updates });
      toast.success(`Signal ${newStatus === 'validated' ? 'validated' : newStatus === 'dismissed' ? 'dismissed' : 'triaged'} successfully`);
      onStatusChange?.();
    } catch (error) {
      console.error('Failed to update signal:', error);
      toast.error('Failed to update signal. Check your permissions.');
    }
  };

  const handleSaveNotes = async () => {
    try {
      await updateSignal.mutateAsync({
        id: signal.id,
        updates: { analyst_notes: notes },
      });
      toast.success('Notes saved');
    } catch (error) {
      console.error('Failed to save notes:', error);
      toast.error('Failed to save notes');
    }
  };

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'P1':
        return { label: 'CRITICAL', color: 'bg-destructive text-destructive-foreground', icon: AlertTriangle };
      case 'P2':
        return { label: 'HIGH', color: 'bg-sunset text-white', icon: AlertTriangle };
      case 'P3':
        return { label: 'MEDIUM', color: 'bg-sahara text-white', icon: ClipboardCheck };
      default:
        return { label: 'LOW', color: 'bg-savanna text-white', icon: ClipboardCheck };
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'new':
        return { label: 'NEW', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
      case 'triaged':
        return { label: 'TRIAGED', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
      case 'validated':
        return { label: 'VALIDATED', color: 'bg-savanna/20 text-savanna border-savanna/30' };
      case 'dismissed':
        return { label: 'DISMISSED', color: 'bg-muted text-muted-foreground border-muted' };
      default:
        return { label: status, color: 'bg-muted text-muted-foreground' };
    }
  };

  const priorityConfig = getPriorityConfig(signal.priority);
  const statusConfig = getStatusConfig(signal.status);
  const PriorityIcon = priorityConfig.icon;

  return (
    <Card className={cn(
      'transition-all duration-200 hover:shadow-lg border-l-4',
      signal.priority === 'P1' && 'border-l-destructive',
      signal.priority === 'P2' && 'border-l-sunset',
      signal.priority === 'P3' && 'border-l-sahara',
      signal.priority === 'P4' && 'border-l-savanna'
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge className={cn('text-[10px] font-black uppercase', priorityConfig.color)}>
                <PriorityIcon className="w-3 h-3 mr-1" />
                {priorityConfig.label}
              </Badge>
              <Badge variant="outline" className={cn('text-[10px] font-bold uppercase', statusConfig.color)}>
                {statusConfig.label}
              </Badge>
              {signal.cross_border_risk && (
                <Badge variant="outline" className="text-[10px] font-bold text-destructive border-destructive/30">
                  <Globe className="w-3 h-3 mr-1" />
                  CROSS-BORDER
                </Badge>
              )}
            </div>
            <h3 className="font-bold text-foreground text-lg leading-tight">
              {signal.disease_name || 'Health Signal'} — {signal.location_country}
            </h3>
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {signal.location_admin1 || signal.location_country}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDistanceToNow(new Date(signal.created_at), { addSuffix: true })}
              </span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-2xl font-black text-foreground">
              {signal.confidence_score}%
            </div>
            <p className="text-[10px] text-muted-foreground font-bold uppercase">Confidence</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Metrics Row */}
        <div className="grid grid-cols-3 gap-3 p-3 bg-muted/50 rounded-lg">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-lg font-bold text-foreground">
              <Users className="w-4 h-4 text-muted-foreground" />
              {signal.reported_cases ?? '—'}
            </div>
            <p className="text-[9px] text-muted-foreground font-bold uppercase">Cases</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-lg font-bold text-destructive">
              <Skull className="w-4 h-4" />
              {signal.reported_deaths ?? '—'}
            </div>
            <p className="text-[9px] text-muted-foreground font-bold uppercase">Deaths</p>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-foreground">
              {signal.source_tier?.replace('tier_', 'T') || '—'}
            </div>
            <p className="text-[9px] text-muted-foreground font-bold uppercase">Source</p>
          </div>
        </div>

        {/* Original Text */}
        <div>
          <p className={cn(
            'text-sm text-muted-foreground',
            !isExpanded && 'line-clamp-3'
          )}>
            {signal.translated_text || signal.original_text}
          </p>
          {(signal.original_text?.length || 0) > 200 && (
            <Button
              variant="link"
              size="sm"
              className="px-0 h-auto text-xs"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Show less' : 'Read more'}
            </Button>
          )}
        </div>

        {/* Original Language Badge */}
        {signal.original_language && signal.original_language !== 'en' && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px]">
              🏠 LOCAL VOICE — {signal.original_language.toUpperCase()}
            </Badge>
            {signal.translation_confidence && (
              <span className="text-[10px] text-muted-foreground">
                Translation: {signal.translation_confidence}% confidence
              </span>
            )}
          </div>
        )}

        {/* Source Link */}
        {signal.source_url && (
          <a
            href={signal.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <ExternalLink className="w-3 h-3" />
            {signal.source_name}
          </a>
        )}

        {/* Analyst Notes */}
        <div className="space-y-2">
          <label className="flex items-center gap-1 text-xs font-bold text-muted-foreground uppercase">
            <MessageSquare className="w-3 h-3" />
            Analyst Notes
          </label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add investigation notes, corroborating evidence, or action items..."
            className="min-h-[80px] text-sm resize-none"
          />
          {notes !== (signal.analyst_notes || '') && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleSaveNotes}
              disabled={updateSignal.isPending}
            >
              {updateSignal.isPending ? (
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              ) : null}
              Save Notes
            </Button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2 border-t">
          {signal.status === 'new' && (
            <Button
              onClick={() => handleStatusChange('triaged')}
              disabled={updateSignal.isPending}
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
            >
              {updateSignal.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <ClipboardCheck className="w-4 h-4 mr-2" />
              )}
              Mark as Triaged
            </Button>
          )}

          {(signal.status === 'new' || signal.status === 'triaged') && (
            <>
              <Button
                onClick={() => handleStatusChange('validated')}
                disabled={updateSignal.isPending}
                variant="default"
                className="flex-1 bg-savanna hover:bg-savanna/90"
              >
                {updateSignal.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                )}
                Validate
              </Button>

              <Button
                onClick={() => handleStatusChange('dismissed')}
                disabled={updateSignal.isPending}
                variant="outline"
                className="flex-1"
              >
                {updateSignal.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4 mr-2" />
                )}
                Dismiss
              </Button>
            </>
          )}

          {signal.status === 'validated' && (
            <div className="flex-1 text-center py-2">
              <Badge className="bg-savanna/20 text-savanna border-savanna/30">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Signal Validated
              </Badge>
            </div>
          )}

          {signal.status === 'dismissed' && (
            <div className="flex-1 text-center py-2">
              <Badge variant="secondary" className="text-muted-foreground">
                <XCircle className="w-3 h-3 mr-1" />
                Signal Dismissed
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
