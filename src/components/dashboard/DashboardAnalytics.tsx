import { useSignalStats } from '@/hooks/useSignals';
import { API_SOURCES } from '@/lib/constants';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, Legend, PieChart, Pie, Cell 
} from 'recharts';
import { AlertTriangle, Activity, ShieldAlert, Radio, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--sunset))', 'hsl(var(--destructive))', 'hsl(var(--savanna))', 'hsl(var(--sahara))'];

interface StatCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon: React.ReactNode;
  accentColor?: string;
  isLoading?: boolean;
}

function StatCard({ title, value, subtext, icon, accentColor = 'text-primary', isLoading }: StatCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
            </div>
            <Skeleton className="h-10 w-10 rounded-lg" />
          </div>
          <Skeleton className="h-4 w-32 mt-4" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="text-2xl font-bold text-foreground mt-2">{value}</h3>
          </div>
          <div className={`p-3 bg-muted rounded-lg ${accentColor}`}>
            {icon}
          </div>
        </div>
        {subtext && (
          <div className="mt-4 flex items-center text-sm text-muted-foreground">
            <span className="font-medium">{subtext}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface DashboardAnalyticsProps {
  timelineData?: { dateStr: string; signals: number; alerts: number }[];
  diseaseDistribution?: { name: string; value: number }[];
}

export function DashboardAnalytics({ timelineData = [], diseaseDistribution = [] }: DashboardAnalyticsProps) {
  const { data: stats, isLoading } = useSignalStats();
  
  const activeSourcesCount = API_SOURCES.filter(s => s.status === 'active').length;

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Active Alerts"
          value={stats?.total || 0}
          subtext="Detected in last 7 days"
          icon={<AlertTriangle className="w-5 h-5" />}
          accentColor="text-sunset"
          isLoading={isLoading}
        />
        <StatCard
          title="High Severity"
          value={stats?.byPriority?.P1 || 0}
          subtext="Requires immediate attention"
          icon={<ShieldAlert className="w-5 h-5" />}
          accentColor="text-destructive"
          isLoading={isLoading}
        />
        <StatCard
          title="New Signals"
          value={stats?.byStatus?.new || 0}
          subtext="Awaiting triage"
          icon={<Radio className="w-5 h-5" />}
          accentColor="text-primary"
          isLoading={isLoading}
        />
        <StatCard
          title="Active Sources"
          value={`${activeSourcesCount}/${API_SOURCES.length}`}
          subtext="Live API Connections"
          icon={<Activity className="w-5 h-5" />}
          accentColor="text-savanna"
          isLoading={isLoading}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Signal Trend Timeline */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center">
              <Clock className="w-5 h-5 mr-2 text-muted-foreground" />
              Detection Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {timelineData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timelineData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                    <XAxis dataKey="dateStr" axisLine={false} tickLine={false} className="fill-muted-foreground text-xs" dy={10} />
                    <YAxis yAxisId="left" axisLine={false} tickLine={false} className="fill-muted-foreground text-xs" />
                    <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} className="fill-muted-foreground text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        borderRadius: '8px', 
                        border: '1px solid hsl(var(--border))',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                      }} 
                    />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="signals" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Raw Signals" />
                    <Line yAxisId="right" type="monotone" dataKey="alerts" stroke="hsl(var(--destructive))" strokeWidth={3} dot={{ r: 4 }} name="Validated Alerts" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  <p>Waiting for live data stream...</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Disease Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Top Event Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {diseaseDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={diseaseDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {diseaseDistribution.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        borderRadius: '8px', 
                        border: '1px solid hsl(var(--border))'
                      }} 
                    />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  <p>Waiting for live data stream...</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
