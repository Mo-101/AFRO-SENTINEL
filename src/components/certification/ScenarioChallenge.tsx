import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { TriageScenario } from '@/lib/analyst-certification';
import { 
  ArrowRight, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  MapPin,
  Clock,
  Globe,
  Radio,
  MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScenarioChallengeProps {
  scenarios: TriageScenario[];
  onComplete: (answers: Record<string, string>, score: number) => void;
  onBack: () => void;
}

const PRIORITY_OPTIONS = [
  { id: 'P1', label: 'P1 - CRITICAL', description: 'Immediate action required', color: 'bg-priority-p1 text-priority-p1-foreground' },
  { id: 'P2', label: 'P2 - HIGH', description: 'Urgent verification needed', color: 'bg-priority-p2 text-priority-p2-foreground' },
  { id: 'P3', label: 'P3 - MODERATE', description: 'Monitor closely', color: 'bg-priority-p3 text-priority-p3-foreground' },
  { id: 'P4', label: 'P4 - LOW', description: 'Routine monitoring', color: 'bg-priority-p4 text-priority-p4-foreground' },
  { id: 'DISMISS', label: 'DISMISS', description: 'Not relevant', color: 'bg-muted text-muted-foreground' },
];

const SOURCE_ICONS = {
  social_media: Radio,
  news: MessageSquare,
  official: CheckCircle,
  community: Globe,
};

export function ScenarioChallenge({ scenarios, onComplete, onBack }: ScenarioChallengeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResult, setShowResult] = useState(false);

  const currentScenario = scenarios[currentIndex];
  const hasAnswered = answers[currentScenario.id] !== undefined;
  const isCorrect = answers[currentScenario.id] === currentScenario.correctAction;

  const handleAnswer = (answer: string) => {
    setAnswers({ ...answers, [currentScenario.id]: answer });
    setShowResult(true);
  };

  const handleNext = () => {
    setShowResult(false);
    if (currentIndex < scenarios.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Calculate final score
      const correct = scenarios.filter(s => answers[s.id] === s.correctAction).length;
      const score = Math.round((correct / scenarios.length) * 100);
      onComplete(answers, score);
    }
  };

  const SourceIcon = SOURCE_ICONS[currentScenario.signal.sourceType];
  const progress = ((currentIndex + 1) / scenarios.length) * 100;

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Practical Scenarios</span>
          <span className="font-medium">{currentIndex + 1} / {scenarios.length}</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Scenario Card */}
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="gap-1">
              <SourceIcon className="w-3 h-3" />
              {currentScenario.signal.source}
            </Badge>
            <Badge 
              variant="outline" 
              className={cn(
                currentScenario.difficulty === 'basic' && 'bg-savanna/10 text-savanna border-savanna',
                currentScenario.difficulty === 'intermediate' && 'bg-sahara/10 text-sahara border-sahara',
                currentScenario.difficulty === 'advanced' && 'bg-destructive/10 text-destructive border-destructive',
              )}
            >
              {currentScenario.difficulty}
            </Badge>
          </div>
          <CardTitle className="text-lg mt-4">Incoming Signal</CardTitle>
          <CardDescription className="flex items-center gap-4 mt-2">
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {currentScenario.signal.location}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {currentScenario.signal.timestamp}
            </span>
            <span className="flex items-center gap-1">
              <Globe className="w-4 h-4" />
              {currentScenario.signal.language}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Signal Text */}
          <div className="p-4 bg-muted/50 rounded-lg border-l-4 border-primary">
            <p className="text-sm italic">"{currentScenario.signal.originalText}"</p>
          </div>

          {/* Priority Options */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">
              What priority should you assign to this signal?
            </p>
            <div className="grid gap-2">
              {PRIORITY_OPTIONS.map((option) => {
                const isSelected = answers[currentScenario.id] === option.id;
                const isCorrectOption = option.id === currentScenario.correctAction;
                
                return (
                  <button
                    key={option.id}
                    onClick={() => !hasAnswered && handleAnswer(option.id)}
                    disabled={hasAnswered}
                    className={cn(
                      'flex items-center justify-between p-3 rounded-lg border-2 transition-all text-left',
                      !hasAnswered && 'hover:border-primary/50 cursor-pointer',
                      hasAnswered && isCorrectOption && 'border-savanna bg-savanna/10',
                      hasAnswered && isSelected && !isCorrectOption && 'border-destructive bg-destructive/10',
                      !hasAnswered && 'border-border hover:bg-muted/50',
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Badge className={option.color}>{option.id}</Badge>
                      <div>
                        <p className="font-medium text-sm">{option.label}</p>
                        <p className="text-xs text-muted-foreground">{option.description}</p>
                      </div>
                    </div>
                    {hasAnswered && isCorrectOption && (
                      <CheckCircle className="w-5 h-5 text-savanna flex-shrink-0" />
                    )}
                    {hasAnswered && isSelected && !isCorrectOption && (
                      <XCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Result Explanation */}
          {showResult && (
            <Alert className={cn(
              'border-2',
              isCorrect ? 'border-savanna bg-savanna/10' : 'border-sahara bg-sahara/10'
            )}>
              {isCorrect ? (
                <CheckCircle className="h-4 w-4 text-savanna" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-sahara" />
              )}
              <AlertTitle>
                {isCorrect ? 'Excellent triage decision!' : `Correct answer: ${currentScenario.correctAction}`}
              </AlertTitle>
              <AlertDescription className="mt-2">
                {currentScenario.correctReasoning}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack}>
          Exit Assessment
        </Button>
        <Button onClick={handleNext} disabled={!hasAnswered}>
          {currentIndex === scenarios.length - 1 ? 'Complete Assessment' : 'Next Scenario'}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
