import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Shield, ArrowRight, Activity, Globe, Zap } from 'lucide-react';

export function WelcomeHero() {
  const { user } = useAuth();

  if (user) {
    return null;
  }

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground p-8 md:p-12 mb-8">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sunset via-sahara to-savanna" />
        <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-sunset/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-savanna/20 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-3xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary-foreground/10">
            <Shield className="h-8 w-8" />
          </div>
          <span className="text-sm font-medium px-3 py-1 rounded-full bg-primary-foreground/10">
            Real-time Intelligence
          </span>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold mb-4">
          AFRO Sentinel Watchtower
        </h1>
        <p className="text-lg md:text-xl opacity-90 mb-6 max-w-2xl">
          Early warning epidemic intelligence system for Africa. Detect, classify, 
          validate, and alert on disease outbreaks across the continent.
        </p>

        <div className="flex flex-wrap gap-4 mb-8">
          <div className="flex items-center gap-2 text-sm">
            <Activity className="h-4 w-4" />
            <span>Real-time Monitoring</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Globe className="h-4 w-4" />
            <span>54 African Countries</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Zap className="h-4 w-4" />
            <span>50+ Languages</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <Button asChild size="lg" variant="secondary">
            <Link to="/auth">
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="bg-transparent border-primary-foreground/30 hover:bg-primary-foreground/10">
            <a href="#dashboard">
              View Dashboard
            </a>
          </Button>
        </div>
      </div>

      {/* Stats preview */}
      <div className="relative z-10 mt-8 pt-8 border-t border-primary-foreground/20 grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Signals', value: '—' },
          { label: 'Countries Covered', value: '54' },
          { label: 'Diseases Tracked', value: '50+' },
          { label: 'Languages', value: '50+' },
        ].map((stat) => (
          <div key={stat.label} className="text-center">
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-sm opacity-70">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
