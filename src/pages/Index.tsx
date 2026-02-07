import { useState, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { ExecutiveCards } from '@/components/dashboard/ExecutiveCards';
import { IntelligenceInsights } from '@/components/dashboard/IntelligenceInsights';
import { LiveIntelligenceFeed } from '@/components/dashboard/LiveIntelligenceFeed';
import { AutoTriagePanel } from '@/components/dashboard/AutoTriagePanel';
import { SignalModal } from '@/components/signals/SignalModal';
import { AfricaMap } from '@/components/map/AfricaMap';
import { AutoDetectionPopup } from '@/components/alerts/AutoDetectionPopup';
import { useAuth } from '@/hooks/useAuth';
import { useSignals, Signal, type UseSignalsOptions } from '@/hooks/useSignals';
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
import { Bell, Moon, Sun, User, Settings, LogOut, Filter, X } from 'lucide-react';

const Index = () => {
  const { user, role, signOut, isAdmin, isAnalyst, loading: authLoading } = useAuth();
  const [isDark, setIsDark] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('AFRO Regional Panorama');
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');

  // Real-time P1/P2 alert system
  const { alerts, dismissAlert, injectTestAlert } = useRealtimeAlerts({ enabled: !!user, playSound: true });

  // Fetch signals with active filter
  const signalFilters = useMemo((): UseSignalsOptions => {
    const filters: UseSignalsOptions = { limit: 100 };

    if (activeFilter === 'P1') {
      filters.priority = ['P1'] as const;
    } else if (activeFilter === 'validated') {
      filters.status = ['validated'] as const;
    } else if (activeFilter === 'new') {
      filters.status = ['new'] as const;
    }

    return filters;
  }, [activeFilter]);

  const { data: signals, isLoading: signalsLoading } = useSignals(signalFilters);

  // Filter by country client-side
  const filteredSignals = useMemo(() => {
    if (!signals) return [];
    if (selectedCountry === 'AFRO Regional Panorama') return signals;
    return signals.filter(s =>
      s.location_country.toLowerCase().includes(selectedCountry.toLowerCase())
    );
  }, [signals, selectedCountry]);

  // Early returns AFTER all hooks
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

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-background via-background to-primary/5 overflow-hidden">
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
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
          {/* Minimal Header - Icons Only */}
          <div className="border-b bg-card/30 px-4 py-2">
            <div className="flex items-center justify-end gap-2">
              {/* Test Alert Button (development) */}
              <Button
                variant="ghost"
                size="sm"
                onClick={injectTestAlert}
                className="text-[10px] text-muted-foreground hover:text-foreground h-7 px-2"
              >
                Test Alert
              </Button>

              {/* Notifications */}
              <Button variant="ghost" size="icon" className="relative h-8 w-8 rounded-lg hover:bg-muted/50">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-sky-500 rounded-full animate-pulse" />
              </Button>

              {/* Theme toggle */}
              <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-8 w-8 rounded-lg hover:bg-muted/50">
                {isDark ? <Sun className="h-4 w-4 text-muted-foreground" /> : <Moon className="h-4 w-4 text-muted-foreground" />}
              </Button>

              {/* User menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
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

          {/* Dashboard Content */}
          <div className="flex-1 overflow-hidden flex">
            {/* Main Dashboard Area */}
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-4">
                {/* A. Executive Cards - Top */}
                <ExecutiveCards
                  activeFilter={activeFilter}
                  onFilterChange={setActiveFilter}
                />

                {/* Active Filter Indicator Banner */}
                {activeFilter !== 'all' && (
                  <div className="flex items-center justify-between px-4 py-2 bg-primary/5 border border-primary/20 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">
                        Filter Active:{' '}
                        <span className="font-bold text-primary">
                          {activeFilter === 'P1' && 'Critical (P1) Threats'}
                          {activeFilter === 'validated' && 'Guru-Validated Signals'}
                          {activeFilter === 'new' && 'Awaiting Triage'}
                        </span>
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {filteredSignals.length} signals
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveFilter('all')}
                      className="h-7 px-2 text-xs gap-1"
                    >
                      <X className="w-3 h-3" />
                      Clear
                    </Button>
                  </div>
                )}

                {/* B. Map - Primary Visual Anchor */}
                <div className="h-[50vh] min-h-[400px] rounded-2xl overflow-hidden">
                  {signalsLoading ? (
                    <Skeleton className="w-full h-full" />
                  ) : (
                    <AfricaMap
                      signals={filteredSignals}
                      selectedSignal={selectedSignal}
                      onSignalSelect={setSelectedSignal}
                      onCountrySelect={setSelectedCountry}
                    />
                  )}
                </div>

                {/* C. Intelligence Insights - Bottom */}
                <IntelligenceInsights signals={filteredSignals} />

                {/* D. AI Triage Control Panel - Visible to analysts/admins */}
                {(isAdmin || isAnalyst) && (
                  <AutoTriagePanel />
                )}
              </div>
            </ScrollArea>

            {/* Right Sidebar - Live Intelligence Feed (Always Visible) */}
            <LiveIntelligenceFeed
              onSignalClick={setSelectedSignal}
              activeFilter={activeFilter}
            />
          </div>
        </main>
      </div>

      {/* Signal Detail Modal */}
      <SignalModal signal={selectedSignal} onClose={() => setSelectedSignal(null)} />

      {/* Real-time P1/P2 Alert Popups */}
      <AutoDetectionPopup detections={alerts} onDismiss={dismissAlert} />

      {/* Minimal Footer */}
      <footer className="border-t py-1.5 px-4 bg-card/30">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <p className="font-medium">AFRO Sentinel Watchtower</p>
          <p>Early warning over certainty</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
