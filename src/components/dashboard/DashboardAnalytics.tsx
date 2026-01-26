import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Legend, PieChart, Pie, Cell 
} from 'recharts';
import { Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--sunset))', 'hsl(var(--savanna))', 'hsl(var(--sahara))', 'hsl(var(--terracotta))'];

interface DashboardAnalyticsProps {
  timelineData?: { dateStr: string; signals: number; alerts: number }[];
  diseaseDistribution?: { name: string; value: number }[];
}

export function DashboardAnalytics({ timelineData = [], diseaseDistribution = [] }: DashboardAnalyticsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Signal Trend Timeline - Area Chart */}
      <Card className="lg:col-span-2 border-0 neuro-card overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold flex items-center">
            <Clock className="w-5 h-5 mr-2 text-muted-foreground" />
            Detection Timeline
          </CardTitle>
          <p className="text-xs text-muted-foreground">Signal activity over time</p>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            {timelineData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData}>
                  <defs>
                    <linearGradient id="signalGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="alertGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                  <XAxis 
                    dataKey="dateStr" 
                    axisLine={false} 
                    tickLine={false} 
                    className="fill-muted-foreground text-xs" 
                    dy={10} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    className="fill-muted-foreground text-xs" 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      borderRadius: '12px', 
                      border: '1px solid hsl(var(--border))',
                      boxShadow: 'var(--shadow-premium)'
                    }} 
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="signals" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    fill="url(#signalGradient)"
                    dot={{ r: 4, fill: 'hsl(var(--primary))' }} 
                    activeDot={{ r: 6 }} 
                    name="Raw Signals" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="alerts" 
                    stroke="hsl(var(--destructive))" 
                    strokeWidth={3}
                    fill="url(#alertGradient)"
                    dot={{ r: 4, fill: 'hsl(var(--destructive))' }} 
                    name="Validated Alerts" 
                  />
                </AreaChart>
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
      <Card className="border-0 neuro-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">Top Event Types</CardTitle>
          <p className="text-xs text-muted-foreground">Distribution by category</p>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            {diseaseDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={diseaseDistribution}
                    cx="50%"
                    cy="45%"
                    innerRadius={50}
                    outerRadius={85}
                    fill="#8884d8"
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {diseaseDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      borderRadius: '12px', 
                      border: '1px solid hsl(var(--border))',
                      boxShadow: 'var(--shadow-premium)'
                    }} 
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={50}
                    formatter={(value) => <span className="text-xs text-foreground">{value}</span>}
                  />
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
  );
}
