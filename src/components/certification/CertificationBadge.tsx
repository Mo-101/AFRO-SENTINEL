import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { CERTIFICATION_BADGES, CertificationLevel } from '@/lib/analyst-certification';
import { cn } from '@/lib/utils';

interface CertificationBadgeProps {
  level: CertificationLevel;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function CertificationBadge({ 
  level, 
  showLabel = true, 
  size = 'md',
  className 
}: CertificationBadgeProps) {
  const badge = CERTIFICATION_BADGES[level];
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  const content = (
    <Badge 
      className={cn(
        badge.color, 
        sizeClasses[size],
        'font-medium',
        className
      )}
    >
      <span className="mr-1">{badge.icon}</span>
      {showLabel && <span>{badge.label}</span>}
    </Badge>
  );

  if (!showLabel) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {content}
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">{badge.label}</p>
          <p className="text-xs text-muted-foreground">
            {badge.permissions.length} permissions
          </p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}
