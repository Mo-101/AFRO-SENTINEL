import { useState, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { DashboardAnalytics } from '@/components/dashboard/DashboardAnalytics';
import { SignalCard } from '@/components/signals/SignalCard';
import { SignalModal } from '@/components/signals/SignalModal';
import { AlertsList } from '@/components/signals/AlertsList';
import { RecentSignals } from '@/components/signals/RecentSignals';
import { SourceRegistry } from '@/components/sources/SourceRegistry';
import { AfricaMap } from '@/components/map/AfricaMap';
import { AutoDetectionPopup } from '@/components/alerts/AutoDetectionPopup';
import { useAuth } from '@/hooks/useAuth';
import { useSignals, Signal } from '@/hooks/useSignals';
import { useRealtimeAlerts } from '@/hooks/useRealtimeAlerts';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LayoutDashboard, Radio, Database, Map as MapIcon } from 'lucide-react';

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const [selectedCountry, setSelectedCountry] = useState('AFRO Regional Panorama');
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Real-time P1/P2 alert system
  const { alerts, dismissAlert } = useRealtimeAlerts({ enabled: true, playSound: true });

  // Filter signals by country if not regional view
  const signalFilters = useMemo(() => {
    if (selectedCountry === 'AFRO Regional Panorama') {
      return { limit: 50 };
    }
    return { limit: 50 };
  }, [selectedCountry]);

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

  // Authenticated full dashboard
  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <Header />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          selectedCountry={selectedCountry}
          onSelectCountry={setSelectedCountry}
        />

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Tabs Navigation */}
          <div className="border-b bg-card/50 px-6 py-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-muted/50">
                <TabsTrigger value="dashboard" className="gap-2">
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </TabsTrigger>
                <TabsTrigger value="signals" className="gap-2">
                  <Radio className="w-4 h-4" />
                  Signals
                </TabsTrigger>
                <TabsTrigger value="sources" className="gap-2">
                  <Database className="w-4 h-4" />
                  Sources
                </TabsTrigger>
                <TabsTrigger value="map" className="gap-2">
                  <MapIcon className="w-4 h-4" />
                  Map
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden flex">
            <ScrollArea className="flex-1">
              <div className="p-6">
                {activeTab === 'dashboard' && (
                  <div className="space-y-6">
                    {/* Country Header */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h1 className="text-2xl font-black text-foreground uppercase tracking-tight">
                          {selectedCountry}
                        </h1>
                        <p className="text-muted-foreground text-sm">
                          Real-time epidemic intelligence overview
                        </p>
                      </div>
                    </div>

                    {/* Analytics */}
                    <DashboardAnalytics
                      timelineData={analyticsData.timeline}
                      diseaseDistribution={analyticsData.diseaseDistribution}
                    />

                    {/* Signal Cards Grid */}
                    <div>
                      <h2 className="text-lg font-black text-foreground uppercase tracking-tight mb-4">
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
                          {filteredSignals.slice(0, 9).map((signal) => (
                            <SignalCard
                              key={signal.id}
                              signal={signal}
                              onClick={setSelectedSignal}
                            />
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

            {/* Right Sidebar - Recent Signals (only on dashboard) */}
            {activeTab === 'dashboard' && (
              <RecentSignals
                signals={filteredSignals}
                isLoading={signalsLoading}
                onSignalClick={setSelectedSignal}
              />
            )}
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
