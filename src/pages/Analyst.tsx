import { Header } from '@/components/layout/Header';
import { TriageWorkflow } from '@/components/triage/TriageWorkflow';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { Shield, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function Analyst() {
  const { user, loading, isAnalyst, isAdmin } = useAuth();

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

  // For development, show triage to everyone but with a warning
  // TODO: Re-enable proper auth check: if (!user || (!isAnalyst && !isAdmin))
  const showDevWarning = !user;

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
            </div>
            <p className="text-muted-foreground">
              Triage incoming signals, validate outbreaks, and manage the intelligence pipeline
            </p>
          </div>
        </div>

        {/* Dev Warning */}
        {showDevWarning && (
          <Card className="mb-6 border-amber-500/30 bg-amber-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-500">Development Mode</p>
                  <p className="text-xs text-muted-foreground">
                    Authentication is disabled for development. In production, only Analysts and Admins can access this page.
                  </p>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link to="/auth">Sign In</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Triage Workflow */}
        <TriageWorkflow />
      </main>
    </div>
  );
}
