import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TRAINING_MODULES, 
  TRIAGE_SCENARIOS,
  CertificationLevel,
  calculateCertificationLevel,
  calculateOverallScore,
  CERTIFICATION_BADGES,
  ALWAYS_P1_PATHOGENS,
} from '@/lib/analyst-certification';
import { TrainingModuleCard } from './TrainingModuleCard';
import { ModuleContent } from './ModuleContent';
import { ScenarioChallenge } from './ScenarioChallenge';
import { CertificationResults } from './CertificationResults';
import { CertificationBadge } from './CertificationBadge';
import { 
  GraduationCap, 
  Shield, 
  Target, 
  BookOpen, 
  ArrowRight,
  AlertTriangle,
  CheckCircle,
  Flame
} from 'lucide-react';

interface AnalystOnboardingProps {
  analystId: string;
  analystName: string;
  existingLevel?: CertificationLevel;
  onCertificationComplete: (level: CertificationLevel) => void;
  onSkip?: () => void;
}

type OnboardingPhase = 'welcome' | 'modules' | 'module-content' | 'scenarios' | 'results';

export function AnalystOnboarding({
  analystId,
  analystName,
  existingLevel,
  onCertificationComplete,
  onSkip,
}: AnalystOnboardingProps) {
  const [phase, setPhase] = useState<OnboardingPhase>('welcome');
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [moduleScores, setModuleScores] = useState<Record<string, number>>({});
  const [scenarioAnswers, setScenarioAnswers] = useState<Record<string, string>>({});
  const [scenarioScore, setScenarioScore] = useState(0);
  const [scenarioDetails, setScenarioDetails] = useState<Record<string, boolean>>({});
  const [finalLevel, setFinalLevel] = useState<CertificationLevel>('trainee');

  // Calculate progress
  const completedModules = Object.keys(moduleScores).length;
  const totalModules = TRAINING_MODULES.length;
  const allModulesComplete = completedModules === totalModules;

  const handleModuleComplete = (score: number, answers: Record<string, string>) => {
    const moduleId = TRAINING_MODULES[currentModuleIndex].id;
    setModuleScores({ ...moduleScores, [moduleId]: score });
    setPhase('modules');
  };

  const handleScenariosComplete = (answers: Record<string, string>, score: number) => {
    setScenarioAnswers(answers);
    setScenarioScore(score);
    
    // Calculate scenario details
    const details: Record<string, boolean> = {};
    TRIAGE_SCENARIOS.forEach(s => {
      details[s.id] = answers[s.id] === s.correctAction;
    });
    setScenarioDetails(details);

    // Calculate overall score and level
    const moduleScoreValues = Object.values(moduleScores);
    const overall = calculateOverallScore(moduleScoreValues, score);
    const level = calculateCertificationLevel(overall);
    setFinalLevel(level);
    
    setPhase('results');
  };

  const handleRetry = () => {
    setModuleScores({});
    setScenarioAnswers({});
    setScenarioScore(0);
    setScenarioDetails({});
    setCurrentModuleIndex(0);
    setPhase('modules');
  };

  const handleContinue = () => {
    onCertificationComplete(finalLevel);
  };

  // Welcome Phase
  if (phase === 'welcome') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="border-2 border-primary/20">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                <GraduationCap className="w-10 h-10 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl">
              Welcome to AFRO Sentinel Analyst Certification
            </CardTitle>
            <CardDescription className="text-base mt-2">
              {analystName}, before you can triage real signals affecting African lives, 
              you must demonstrate proficiency in WHO PHEOC and CDC EBS frameworks.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* What You'll Learn */}
            <div className="grid gap-3">
              {[
                { icon: BookOpen, title: 'Event-Based Surveillance', desc: 'Master the EBS framework and early warning principles' },
                { icon: Shield, title: 'Signal Verification', desc: 'Learn to assess source credibility and validate reports' },
                { icon: Target, title: 'Risk Assessment', desc: 'Classify signals using WHO P1-P4 priority system' },
                { icon: AlertTriangle, title: 'High-Consequence Pathogens', desc: 'Recognize VHF, respiratory threats, and critical diseases' },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <Icon className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">{title}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Certification Levels */}
            <div className="p-4 bg-muted/30 rounded-lg space-y-3">
              <p className="text-sm font-medium">Certification Levels</p>
              <div className="grid grid-cols-2 gap-2">
                {Object.values(CERTIFICATION_BADGES).map((badge) => (
                  <div key={badge.level} className="flex items-center gap-2 text-sm">
                    <span>{badge.icon}</span>
                    <span>{badge.label}</span>
                    <span className="text-muted-foreground text-xs">({badge.minScore}%+)</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Critical Warning */}
            <Card className="border-destructive/50 bg-destructive/5">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <Flame className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm text-destructive">Core Principle</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Early warning over certainty. A false positive costs time. A missed outbreak costs lives.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4">
              {onSkip && existingLevel && existingLevel !== 'trainee' && (
                <Button variant="ghost" onClick={onSkip}>
                  Skip (Already Certified)
                </Button>
              )}
              <Button onClick={() => setPhase('modules')} className="ml-auto">
                Begin Training
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Modules Phase
  if (phase === 'modules') {
    return (
      <div className="space-y-6">
        {/* Progress Header */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold">Training Progress</h2>
                <p className="text-sm text-muted-foreground">
                  Complete all modules to unlock the practical assessment
                </p>
              </div>
              <Badge variant="outline" className="text-lg px-4 py-1">
                {completedModules} / {totalModules}
              </Badge>
            </div>
            <Progress value={(completedModules / totalModules) * 100} className="h-2" />
          </CardContent>
        </Card>

        {/* Module Cards */}
        <div className="grid gap-4">
          {TRAINING_MODULES.map((module, index) => {
            const isCompleted = moduleScores[module.id] !== undefined;
            const isAvailable = index === 0 || moduleScores[TRAINING_MODULES[index - 1].id] !== undefined;
            
            return (
              <TrainingModuleCard
                key={module.id}
                module={module}
                status={
                  isCompleted ? 'completed' 
                    : isAvailable ? 'available' 
                    : 'locked'
                }
                score={moduleScores[module.id]}
                onStart={() => {
                  setCurrentModuleIndex(index);
                  setPhase('module-content');
                }}
              />
            );
          })}
        </div>

        {/* Practical Assessment Card */}
        <Card className={!allModulesComplete ? 'opacity-60' : 'border-2 border-primary'}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle>Practical Assessment</CardTitle>
                <CardDescription>
                  {TRIAGE_SCENARIOS.length} real-world signal triage scenarios
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => setPhase('scenarios')}
              disabled={!allModulesComplete}
              className="w-full"
            >
              {allModulesComplete ? 'Start Assessment' : 'Complete All Modules First'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Module Content Phase
  if (phase === 'module-content') {
    return (
      <ModuleContent
        module={TRAINING_MODULES[currentModuleIndex]}
        onComplete={handleModuleComplete}
        onBack={() => setPhase('modules')}
      />
    );
  }

  // Scenarios Phase
  if (phase === 'scenarios') {
    return (
      <ScenarioChallenge
        scenarios={TRIAGE_SCENARIOS}
        onComplete={handleScenariosComplete}
        onBack={() => setPhase('modules')}
      />
    );
  }

  // Results Phase
  if (phase === 'results') {
    const moduleScoreValues = Object.values(moduleScores);
    const overallScore = calculateOverallScore(moduleScoreValues, scenarioScore);
    
    return (
      <CertificationResults
        level={finalLevel}
        overallScore={overallScore}
        moduleScores={moduleScores}
        scenarioScore={scenarioScore}
        scenarioDetails={scenarioDetails}
        onRetry={handleRetry}
        onContinue={handleContinue}
      />
    );
  }

  return null;
}
