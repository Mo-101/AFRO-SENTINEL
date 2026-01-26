import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CERTIFICATION_BADGES, 
  CertificationLevel,
  ALWAYS_P1_PATHOGENS 
} from '@/lib/analyst-certification';
import { CertificationBadge } from './CertificationBadge';
import { Award, CheckCircle, XCircle, ArrowRight, RefreshCw, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CertificationResultsProps {
  level: CertificationLevel;
  overallScore: number;
  moduleScores: Record<string, number>;
  scenarioScore: number;
  scenarioDetails: Record<string, boolean>;
  onRetry: () => void;
  onContinue: () => void;
}

export function CertificationResults({
  level,
  overallScore,
  moduleScores,
  scenarioScore,
  scenarioDetails,
  onRetry,
  onContinue,
}: CertificationResultsProps) {
  const badge = CERTIFICATION_BADGES[level];
  const passed = level !== 'trainee';
  const correctScenarios = Object.values(scenarioDetails).filter(Boolean).length;
  const totalScenarios = Object.keys(scenarioDetails).length;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Main Result Card */}
      <Card className={cn(
        'border-2 text-center',
        passed ? 'border-savanna' : 'border-sahara'
      )}>
        <CardHeader className="pb-4">
          <div className="flex justify-center mb-4">
            <div className={cn(
              'w-24 h-24 rounded-full flex items-center justify-center text-5xl',
              passed ? 'bg-savanna/20' : 'bg-sahara/20'
            )}>
              {badge.icon}
            </div>
          </div>
          <CardTitle className="text-2xl">
            {passed ? 'Certification Complete!' : 'More Training Needed'}
          </CardTitle>
          <CardDescription>
            {passed 
              ? `Congratulations! You've earned the ${badge.label} certification.`
              : 'You need 80% or higher to earn certification. Keep practicing!'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Overall Score */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Overall Score</span>
              <span className="font-bold text-2xl">{overallScore}%</span>
            </div>
            <Progress 
              value={overallScore} 
              className={cn(
                'h-3',
                overallScore >= 80 && '[&>div]:bg-savanna'
              )}
            />
          </div>

          {/* Badge Display */}
          <div className="flex justify-center">
            <CertificationBadge level={level} size="lg" />
          </div>

          {/* Permissions */}
          {passed && (
            <div className="text-left p-4 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium mb-2">Your Permissions:</p>
              <div className="flex flex-wrap gap-2">
                {badge.permissions.map((perm) => (
                  <Badge key={perm} variant="outline" className="text-xs">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {perm.replace(/_/g, ' ')}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Score Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Award className="w-5 h-5" />
            Score Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Module Scores */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Training Modules (40%)</p>
            {Object.entries(moduleScores).map(([moduleId, score]) => (
              <div key={moduleId} className="flex items-center justify-between text-sm">
                <span className="capitalize">{moduleId.replace(/-/g, ' ')}</span>
                <div className="flex items-center gap-2">
                  <Progress value={score} className="w-24 h-2" />
                  <span className={cn(
                    'font-medium w-12 text-right',
                    score >= 80 ? 'text-savanna' : 'text-sahara'
                  )}>
                    {score}%
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Scenario Score */}
          <div className="space-y-2 pt-4 border-t">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Practical Scenarios (60%)</p>
              <span className={cn(
                'font-bold',
                scenarioScore >= 80 ? 'text-savanna' : 'text-sahara'
              )}>
                {correctScenarios}/{totalScenarios} correct ({scenarioScore}%)
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {Object.entries(scenarioDetails).map(([id, correct], i) => (
                <div 
                  key={id}
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium',
                    correct ? 'bg-savanna/20 text-savanna' : 'bg-destructive/20 text-destructive'
                  )}
                >
                  {correct ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Always P1 Reference */}
      <Card className="border-destructive/50 bg-destructive/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2 text-destructive">
            <BookOpen className="w-4 h-4" />
            MEMORIZE: Always P1 Pathogens
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1">
            {ALWAYS_P1_PATHOGENS.map((pathogen) => (
              <Badge 
                key={pathogen} 
                variant="outline" 
                className="text-xs border-destructive/50 text-destructive"
              >
                {pathogen}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onRetry}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Retake Training
        </Button>
        <Button onClick={onContinue} disabled={!passed}>
          {passed ? 'Continue to Workbench' : 'Complete Training First'}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
