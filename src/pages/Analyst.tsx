import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { TriageWorkflow } from '@/components/triage/TriageWorkflow';
import { AnalystOnboarding } from '@/components/certification/AnalystOnboarding';
import { CertificationBadge } from '@/components/certification/CertificationBadge';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Shield, GraduationCap, RefreshCw } from 'lucide-react';
import { CertificationLevel } from '@/lib/analyst-certification';

export default function Analyst() {
  const { user, loading, isAnalyst, isAdmin } = useAuth();
  const [certificationLevel, setCertificationLevel] = useState<CertificationLevel | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Check for existing certification in localStorage
  useEffect(() => {
    if (user) {
      const stored = localStorage.getItem(`afro_cert_${user.id}`);
      if (stored) {
        const { level, completedAt } = JSON.parse(stored);
        setCertificationLevel(level);
      } else {
        // New analyst - show onboarding
        setShowOnboarding(true);
      }
    }
  }, [user]);

  const handleCertificationComplete = (level: CertificationLevel) => {
    setCertificationLevel(level);
    setShowOnboarding(false);
    
    // Store certification
    if (user) {
      localStorage.setItem(`afro_cert_${user.id}`, JSON.stringify({
        level,
        completedAt: new Date().toISOString(),
      }));
    }
  };

  const handleRetakeCertification = () => {
    setShowOnboarding(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-16 border-b flex items-center px-4">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-6 w-32 ml-2" />
        </div>
        <main className="container py-8">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="grid gap-4 md:grid-cols-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-[600px] rounded-xl" />
        </main>
      </div>
    );
  }

  // Require authentication and analyst role
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAnalyst && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  // Show onboarding for new analysts or those retaking certification
  if (showOnboarding) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8">
          <AnalystOnboarding
            analystId={user.id}
            analystName={user.email?.split('@')[0] || 'Analyst'}
            existingLevel={certificationLevel || undefined}
            onCertificationComplete={handleCertificationComplete}
            onSkip={certificationLevel ? () => setShowOnboarding(false) : undefined}
          />
        </main>
      </div>
    );
  }

  // Check if certified (trainee level can only view, not triage)
  const canTriage = certificationLevel && certificationLevel !== 'trainee';

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary rounded-lg">
                <Shield className="w-6 h-6 text-primary-foreground" />
              </div>
              <h1 className="text-3xl font-black text-foreground uppercase tracking-tight">
                Analyst Workbench
              </h1>
              {certificationLevel && (
                <CertificationBadge level={certificationLevel} />
              )}
            </div>
            <p className="text-muted-foreground">
              {canTriage 
                ? 'Triage incoming signals, validate outbreaks, and manage the intelligence pipeline'
                : 'Complete certification to unlock triage capabilities'}
            </p>
          </div>
          
          {/* Certification Actions */}
          <div className="flex items-center gap-2">
            {certificationLevel && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleRetakeCertification}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retake Training
              </Button>
            )}
            {!certificationLevel && (
              <Button onClick={() => setShowOnboarding(true)}>
                <GraduationCap className="w-4 h-4 mr-2" />
                Start Certification
              </Button>
            )}
          </div>
        </div>

        {/* Triage Workflow or Training Prompt */}
        {canTriage ? (
          <TriageWorkflow />
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
              <GraduationCap className="w-12 h-12 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-bold mb-2">Certification Required</h2>
            <p className="text-muted-foreground max-w-md mb-6">
              Before you can triage real signals affecting African lives, you must complete 
              the WHO PHEOC + CDC EBS certification training.
            </p>
            <Button size="lg" onClick={() => setShowOnboarding(true)}>
              <GraduationCap className="w-5 h-5 mr-2" />
              Begin Certification Training
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
