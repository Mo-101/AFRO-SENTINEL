import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { TrainingModule, ModuleContent as ModuleContentType } from '@/lib/analyst-certification';
import { ArrowLeft, ArrowRight, CheckCircle, XCircle, AlertTriangle, Info, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModuleContentProps {
  module: TrainingModule;
  onComplete: (score: number, answers: Record<string, string>) => void;
  onBack: () => void;
}

export function ModuleContent({ module, onComplete, onBack }: ModuleContentProps) {
  const [phase, setPhase] = useState<'content' | 'quiz' | 'results'>('content');
  const [contentIndex, setContentIndex] = useState(0);
  const [quizIndex, setQuizIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showExplanation, setShowExplanation] = useState(false);

  const currentContent = module.content[contentIndex];
  const currentQuestion = module.quiz[quizIndex];
  const totalSteps = module.content.length + module.quiz.length;
  const currentStep = phase === 'content' 
    ? contentIndex + 1 
    : module.content.length + quizIndex + 1;

  const handleNextContent = () => {
    if (contentIndex < module.content.length - 1) {
      setContentIndex(contentIndex + 1);
    } else {
      setPhase('quiz');
    }
  };

  const handlePrevContent = () => {
    if (contentIndex > 0) {
      setContentIndex(contentIndex - 1);
    }
  };

  const handleAnswer = (questionId: string, answerId: string) => {
    setAnswers({ ...answers, [questionId]: answerId });
    setShowExplanation(true);
  };

  const handleNextQuestion = () => {
    setShowExplanation(false);
    if (quizIndex < module.quiz.length - 1) {
      setQuizIndex(quizIndex + 1);
    } else {
      // Calculate score and complete
      const correct = module.quiz.filter(q => answers[q.id] === q.correctAnswer).length;
      const score = Math.round((correct / module.quiz.length) * 100);
      onComplete(score, answers);
    }
  };

  const renderContent = (content: ModuleContentType) => {
    switch (content.type) {
      case 'text':
        return (
          <div className="prose prose-sm max-w-none">
            {content.title && <h3 className="text-lg font-semibold mb-2">{content.title}</h3>}
            <p className="text-muted-foreground">{content.content as string}</p>
          </div>
        );
      
      case 'list':
        return (
          <div>
            {content.title && <h3 className="text-lg font-semibold mb-3">{content.title}</h3>}
            <ul className="space-y-2">
              {(content.content as string[]).map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        );
      
      case 'callout':
        const variantConfig = {
          info: { icon: Info, class: 'border-accent bg-accent/10' },
          warning: { icon: AlertTriangle, class: 'border-sahara bg-sahara/10' },
          critical: { icon: AlertTriangle, class: 'border-destructive bg-destructive/10' },
        };
        const variant = variantConfig[content.variant || 'info'];
        const Icon = variant.icon;
        
        return (
          <Alert className={cn('border-2', variant.class)}>
            <Icon className="h-4 w-4" />
            {content.title && <AlertTitle>{content.title}</AlertTitle>}
            <AlertDescription>{content.content as string}</AlertDescription>
          </Alert>
        );
      
      case 'example':
        return (
          <Card className="bg-muted/50 border-dashed">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-sahara" />
                <CardTitle className="text-sm">{content.title || 'Example'}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{content.content as string}</p>
            </CardContent>
          </Card>
        );
      
      default:
        return null;
    }
  };

  if (phase === 'content') {
    return (
      <div className="space-y-6">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Learning Content</span>
            <span className="font-medium">{currentStep} / {totalSteps}</span>
          </div>
          <Progress value={(currentStep / totalSteps) * 100} className="h-2" />
        </div>

        {/* Content Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{module.icon}</span>
              <div>
                <CardTitle>{module.title}</CardTitle>
                <Badge variant="outline" className="mt-1">
                  Part {contentIndex + 1} of {module.content.length}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {renderContent(currentContent)}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button 
            variant="outline" 
            onClick={contentIndex === 0 ? onBack : handlePrevContent}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {contentIndex === 0 ? 'Exit Module' : 'Previous'}
          </Button>
          <Button onClick={handleNextContent}>
            {contentIndex === module.content.length - 1 ? 'Start Quiz' : 'Next'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  if (phase === 'quiz') {
    const hasAnswered = answers[currentQuestion.id] !== undefined;
    const isCorrect = answers[currentQuestion.id] === currentQuestion.correctAnswer;

    return (
      <div className="space-y-6">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Quiz</span>
            <span className="font-medium">{currentStep} / {totalSteps}</span>
          </div>
          <Progress value={(currentStep / totalSteps) * 100} className="h-2" />
        </div>

        {/* Question Card */}
        <Card>
          <CardHeader>
            <Badge variant="outline" className="w-fit mb-2">
              Question {quizIndex + 1} of {module.quiz.length}
            </Badge>
            <CardTitle className="text-lg">{currentQuestion.question}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup 
              value={answers[currentQuestion.id]} 
              onValueChange={(value) => handleAnswer(currentQuestion.id, value)}
              disabled={hasAnswered}
            >
              {currentQuestion.options.map((option) => {
                const isSelected = answers[currentQuestion.id] === option.id;
                const isCorrectOption = option.id === currentQuestion.correctAnswer;
                
                return (
                  <div 
                    key={option.id}
                    className={cn(
                      'flex items-center space-x-3 p-3 rounded-lg border-2 transition-all',
                      !hasAnswered && 'hover:bg-muted/50 cursor-pointer',
                      hasAnswered && isCorrectOption && 'border-savanna bg-savanna/10',
                      hasAnswered && isSelected && !isCorrectOption && 'border-destructive bg-destructive/10',
                      !hasAnswered && isSelected && 'border-primary bg-primary/5',
                      !hasAnswered && !isSelected && 'border-border'
                    )}
                  >
                    <RadioGroupItem value={option.id} id={option.id} />
                    <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                      {option.text}
                    </Label>
                    {hasAnswered && isCorrectOption && (
                      <CheckCircle className="w-5 h-5 text-savanna" />
                    )}
                    {hasAnswered && isSelected && !isCorrectOption && (
                      <XCircle className="w-5 h-5 text-destructive" />
                    )}
                  </div>
                );
              })}
            </RadioGroup>

            {/* Explanation */}
            {showExplanation && (
              <Alert className={cn(
                'mt-4 border-2',
                isCorrect ? 'border-savanna bg-savanna/10' : 'border-sahara bg-sahara/10'
              )}>
                {isCorrect ? (
                  <CheckCircle className="h-4 w-4 text-savanna" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-sahara" />
                )}
                <AlertTitle>{isCorrect ? 'Correct!' : 'Not quite right'}</AlertTitle>
                <AlertDescription>{currentQuestion.explanation}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-end">
          <Button onClick={handleNextQuestion} disabled={!hasAnswered}>
            {quizIndex === module.quiz.length - 1 ? 'Complete Module' : 'Next Question'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
