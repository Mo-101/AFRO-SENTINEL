import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrainingModule } from '@/lib/analyst-certification';
import { CheckCircle, Clock, PlayCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrainingModuleCardProps {
  module: TrainingModule;
  status: 'locked' | 'available' | 'in_progress' | 'completed';
  score?: number;
  onStart: () => void;
}

export function TrainingModuleCard({ 
  module, 
  status, 
  score, 
  onStart 
}: TrainingModuleCardProps) {
  const statusConfig = {
    locked: {
      badge: 'Locked',
      badgeClass: 'bg-muted text-muted-foreground',
      buttonText: 'Locked',
      buttonDisabled: true,
    },
    available: {
      badge: 'Available',
      badgeClass: 'bg-accent text-accent-foreground',
      buttonText: 'Start Module',
      buttonDisabled: false,
    },
    in_progress: {
      badge: 'In Progress',
      badgeClass: 'bg-sahara text-sahara-foreground',
      buttonText: 'Continue',
      buttonDisabled: false,
    },
    completed: {
      badge: `Passed (${score}%)`,
      badgeClass: 'bg-savanna text-savanna-foreground',
      buttonText: 'Review',
      buttonDisabled: false,
    },
  };

  const config = statusConfig[status];

  return (
    <Card className={cn(
      'transition-all duration-200 hover:shadow-md',
      status === 'locked' && 'opacity-60'
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{module.icon}</span>
            <div>
              <CardTitle className="text-lg">{module.title}</CardTitle>
              <CardDescription className="mt-1">{module.description}</CardDescription>
            </div>
          </div>
          <Badge className={config.badgeClass}>
            {status === 'completed' && <CheckCircle className="w-3 h-3 mr-1" />}
            {config.badge}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {module.duration}
            </span>
            <span>{module.quiz.length} quiz questions</span>
          </div>
          <Button 
            onClick={onStart}
            disabled={config.buttonDisabled}
            variant={status === 'completed' ? 'outline' : 'default'}
            size="sm"
          >
            {status !== 'completed' && <PlayCircle className="w-4 h-4 mr-1" />}
            {config.buttonText}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
