import { useState, useMemo } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { DashboardAnalytics } from '@/components/dashboard/DashboardAnalytics';
import { DashboardHero } from '@/components/dashboard/DashboardHero';
import { StatsSidebar } from '@/components/dashboard/StatsSidebar';
import { SignalCard } from '@/components/signals/SignalCard';
import { SignalModal } from '@/components/signals/SignalModal';
import { AlertsList } from '@/components/signals/AlertsList';
import { SourceRegistry } from '@/components/sources/SourceRegistry';
import { AfricaMap } from '@/components/map/AfricaMap';
import { AutoDetectionPopup } from '@/components/alerts/AutoDetectionPopup';
import { useAuth } from '@/hooks/useAuth';
import { useSignals, Signal } from '@/hooks/useSignals';
import { useRealtimeAlerts } from '@/hooks/useRealtimeAlerts';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { LayoutDashboard, Radio, Database, Map as MapIcon, Bell, Moon, Sun, User, Settings, LogOut } from 'lucide-react';

const Index = () => {
  const { user, role, signOut, isAdmin, isAnalyst, loading: authLoading } = useAuth();
  const [isDark, setIsDark] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('AFRO Regional Panorama');
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Real-time P1/P2 alert system - must be called before any early returns
  const { alerts, dismissAlert } = useRealtimeAlerts({ enabled: !!user, playSound: true });

  // Filter signals by country if not regional view
  const signalFilters = useMemo(() => {
    if (selectedCountry === 'AFRO Regional Panorama') {
      return { limit: 50 };
    }
    return { limit: 50 };
  }, [selectedCountry]);

  // ALL hooks must be called before any early returns to follow React's Rules of Hooks
  const { data: signals, isLoading: signalsLoading } = useSignals(signalFilters);

  // Filter by country client-side for now
  const filteredSignals = useMemo(() => {
    if (!signals) return [];
    if (selectedCountry === 'AFRO Regional Panorama') return signals;
    return signals.filter(s => 
      s.location_country.toLowerCase().includes(selectedCountry.toLowerCase())
    );
  }, [signals, selectedCountry]);

  // Compute analytics data from signals
  const analyticsData = useMemo(() => {
    if (!signals) return { timeline: [], diseaseDistribution: [] };

    // Timeline data grouped by date
    const timelineMap: Record<string, { dateStr: string; signals: number; alerts: number; sortTime: number }> = {};
    const diseaseMap = new Map<string, number>();

    signals.forEach((signal) => {
      const d = new Date(signal.created_at);
      const dateKey = d.toISOString().split('T')[0] || '';
      const dateLabel = d.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });

      if (!timelineMap[dateKey]) {
        timelineMap[dateKey] = { dateStr: dateLabel, signals: 0, alerts: 0, sortTime: d.getTime() };
      }
      timelineMap[dateKey].signals += 1;
      if (signal.status === 'validated') {
        timelineMap[dateKey].alerts += 1;
      }

      // Disease distribution
      const disease = signal.disease_name || 'Unspecified';
      diseaseMap.set(disease, (diseaseMap.get(disease) || 0) + 1);
    });

    const timeline = Object.values(timelineMap).sort((a, b) => a.sortTime - b.sortTime);
    const diseaseDistribution = Array.from(diseaseMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    return { timeline, diseaseDistribution };
  }, [signals]);

  // Early returns AFTER all hooks have been called
  if (authLoading) {
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

  // Redirect to auth if not authenticated
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  const getRoleBadgeColor = () => {
    switch (role) {
      case 'admin':
        return 'bg-destructive text-destructive-foreground';
      case 'analyst':
        return 'bg-accent text-accent-foreground';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  // Authenticated full dashboard with premium layout
  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-background via-background to-primary/5 overflow-hidden">
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar with role-aware footer */}
        <Sidebar
          selectedCountry={selectedCountry}
          onSelectCountry={setSelectedCountry}
          user={user}
          role={role}
          isAdmin={isAdmin}
          isAnalyst={isAnalyst}
          onSignOut={signOut}
        />

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Tabs Navigation with right-side icons */}
          <div className="border-b bg-card/30 px-6 py-3">
            <div className="flex items-center justify-between">
              {/* Left: Tabs */}
              <div className="flex gap-2">
                {[
                  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
                  { id: 'signals', icon: Radio, label: 'Signals' },
                  { id: 'sources', icon: Database, label: 'Sources' },
                  { id: 'map', icon: MapIcon, label: 'Map' },
                ].map(({ id, icon: Icon, label }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`
                      flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                      ${activeTab === id 
                        ? 'neuro-card text-primary' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                      }
                    `}
                  >
                    <div className={`
                      w-8 h-8 rounded-lg flex items-center justify-center transition-all
                      ${activeTab === id ? 'shadow-inset bg-primary/10' : 'bg-background/50'}
                    `}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span>{label}</span>
                  </button>
                ))}
              </div>

              {/* Right: Icons (Alert, Theme, Account) */}
              <div className="flex items-center gap-2">
                {/* Notifications */}
                <Button variant="ghost" size="icon" className="relative rounded-xl hover:bg-muted/50">
                  <Bell className="h-5 w-5 text-muted-foreground" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-sky-500 rounded-full animate-pulse" />
                </Button>

                {/* Theme toggle */}
                <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-xl hover:bg-muted/50">
                  {isDark ? <Sun className="h-5 w-5 text-muted-foreground" /> : <Moon className="h-5 w-5 text-muted-foreground" />}
                </Button>

                {/* User menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                          {getInitials(user?.email || 'U')}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user?.email}</p>
                        <div className="flex items-center gap-2 pt-1">
                          <Badge className={getRoleBadgeColor()} variant="secondary">
                            {role || 'viewer'}
                          </Badge>
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut} className="text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden flex">
            <ScrollArea className="flex-1">
              <div className="p-6">
                {activeTab === 'dashboard' && (
                  <div className="space-y-6 animate-fade-in">
                    {/* Hero Section */}
                    <DashboardHero />

                    {/* Analytics Charts */}
                    <DashboardAnalytics
                      timelineData={analyticsData.timeline}
                      diseaseDistribution={analyticsData.diseaseDistribution}
                    />

                    {/* Signal Cards Grid */}
                    <div>
                      <h2 className="text-lg font-bold text-foreground tracking-tight mb-4">
                        Active Signals
                      </h2>
                      {signalsLoading ? (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                          {[...Array(6)].map((_, i) => (
                            <Skeleton key={i} className="h-80 rounded-2xl" />
                          ))}
                        </div>
                      ) : (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                          {filteredSignals.slice(0, 9).map((signal, index) => (
                            <div 
                              key={signal.id} 
                              className="animate-fade-in-up"
                              style={{ animationDelay: `${index * 50}ms` }}
                            >
                              <SignalCard
                                signal={signal}
                                onClick={setSelectedSignal}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'signals' && (
                  <div className="space-y-6">
                    <div>
                      <h1 className="text-2xl font-black text-foreground uppercase tracking-tight">
                        Intelligence Stream
                      </h1>
                      <p className="text-muted-foreground text-sm">
                        Full signal feed with multilingual search
                      </p>
                    </div>
                    <AlertsList
                      signals={filteredSignals}
                      onSignalSelect={setSelectedSignal}
                    />
                  </div>
                )}

                {activeTab === 'sources' && (
                  <div className="space-y-6">
                    <div>
                      <h1 className="text-2xl font-black text-foreground uppercase tracking-tight">
                        Data Sources
                      </h1>
                      <p className="text-muted-foreground text-sm">
                        Connected APIs and intelligence pipelines
                      </p>
                    </div>
                    <SourceRegistry />
                  </div>
                )}

                {activeTab === 'map' && (
                  <div className="space-y-6 h-full">
                    <div>
                      <h1 className="text-2xl font-black text-foreground uppercase tracking-tight">
                        Geospatial View
                      </h1>
                      <p className="text-muted-foreground text-sm">
                        Interactive Africa choropleth with outbreak markers
                      </p>
                    </div>
                    <div className="h-[calc(100vh-280px)] min-h-[500px]">
                      <AfricaMap
                        signals={filteredSignals}
                        selectedSignal={selectedSignal}
                        onSignalSelect={setSelectedSignal}
                        onCountrySelect={setSelectedCountry}
                      />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Right Sidebar - Stats Panel (only on dashboard) */}
            {activeTab === 'dashboard' && <StatsSidebar />}
          </div>
        </main>
      </div>

      {/* Signal Detail Modal */}
      <SignalModal signal={selectedSignal} onClose={() => setSelectedSignal(null)} />

      {/* Real-time P1/P2 Alert Popups */}
      <AutoDetectionPopup detections={alerts} onDismiss={dismissAlert} />

      {/* Footer */}
      <footer className="border-t py-2 px-6 bg-card/50">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <p className="text-gradient-african font-medium">AFRO Sentinel Watchtower</p>
          <p>Early warning over certainty. Every signal surfaced could be a life saved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
