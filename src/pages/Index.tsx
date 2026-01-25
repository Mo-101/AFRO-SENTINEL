import { Header } from '@/components/layout/Header';
import { WelcomeHero } from '@/components/dashboard/WelcomeHero';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { SignalFeed } from '@/components/dashboard/SignalFeed';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-16 border-b flex items-center px-4">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-6 w-32 ml-2" />
        </div>
        <main className="container py-8">
          <Skeleton className="h-64 w-full rounded-xl mb-8" />
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-lg" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-6">
        {/* Hero for unauthenticated users */}
        <WelcomeHero />

        {/* Dashboard section */}
        <section id="dashboard" className="space-y-6">
          {user && (
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Dashboard</h2>
                <p className="text-muted-foreground">
                  Real-time epidemic intelligence overview
                </p>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          <StatsCards />

          {/* Main content grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Signal Feed */}
            <div className="lg:col-span-1">
              <SignalFeed />
            </div>

            {/* Map placeholder - will be implemented in Phase 5 */}
            <div className="lg:col-span-1">
              <div className="h-full min-h-[600px] rounded-lg border bg-muted/30 flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    🗺️
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Interactive Map</h3>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    Africa choropleth with outbreak markers coming in Phase 5.
                    Fly-to animations on signal selection.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t mt-12">
        <div className="container py-6 text-center text-sm text-muted-foreground">
          <p className="text-gradient-african font-medium">
            AFRO Sentinel Watchtower
          </p>
          <p className="mt-1">
            Early warning over certainty. Every signal surfaced could be a life saved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
