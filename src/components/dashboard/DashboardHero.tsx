import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Zap } from 'lucide-react';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function getUserDisplayName(email: string | undefined): string {
  if (!email) return 'Analyst';
  const name = email.split('@')[0];
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export function DashboardHero() {
  const { user, role } = useAuth();
  const greeting = getGreeting();
  const displayName = getUserDisplayName(user?.email);

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-card via-card to-primary/5 border-0 shadow-premium">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-sunset/5" />
      
      {/* Content */}
      <div className="relative p-8 flex items-center justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Badge 
              variant="secondary" 
              className="bg-savanna/10 text-savanna border-savanna/20 font-semibold text-xs uppercase tracking-wider"
            >
              <Zap className="w-3 h-3 mr-1" />
              Live Monitoring
            </Badge>
            {role && (
              <Badge 
                variant="outline" 
                className="font-medium text-xs capitalize"
              >
                {role}
              </Badge>
            )}
          </div>
          
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            {greeting}, <span className="text-gradient-african">{displayName}</span>
          </h1>
          
          <p className="text-muted-foreground max-w-md">
            Your intelligence dashboard is active. Every signal surfaced could be a life saved across Africa.
          </p>
        </div>

        {/* Illustration/Icon */}
        <div className="hidden md:flex items-center justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-sunset/20 to-savanna/20 rounded-full blur-2xl" />
            <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-primary/10 to-savanna/10 flex items-center justify-center border border-border/50">
              <Shield className="w-12 h-12 text-primary" />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom accent line */}
      <div className="h-1 bg-gradient-to-r from-sunset via-sahara to-savanna" />
    </Card>
  );
}
