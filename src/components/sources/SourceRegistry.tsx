import { API_SOURCES } from '@/lib/constants';
import { CheckCircle2, AlertOctagon, RefreshCw, Server, Lock, Globe } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function SourceRegistry() {
  const getStatusConfig = (status: 'active' | 'inactive') => {
    if (status === 'active') {
      return {
        icon: CheckCircle2,
        color: 'text-savanna',
        bg: 'bg-savanna/10',
        label: 'Online'
      };
    }
    return {
      icon: AlertOctagon,
      color: 'text-muted-foreground',
      bg: 'bg-muted',
      label: 'Offline'
    };
  };

  const getAuthIcon = (authType: string) => {
    if (authType === 'None') return Globe;
    return Lock;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-foreground rounded-lg">
            <Server className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg font-black uppercase tracking-tight">
              Source Registry
            </CardTitle>
            <CardDescription>
              Live API connections & data pipelines
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted text-[10px] uppercase font-black text-muted-foreground border-b">
              <tr>
                <th className="px-4 py-3 tracking-widest">Source</th>
                <th className="px-4 py-3 tracking-widest">Status</th>
                <th className="px-4 py-3 tracking-widest">Type</th>
                <th className="px-4 py-3 tracking-widest">Coverage</th>
                <th className="px-4 py-3 tracking-widest">Auth</th>
                <th className="px-4 py-3 tracking-widest">Priority</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {API_SOURCES.map((source) => {
                const statusConfig = getStatusConfig(source.status);
                const StatusIcon = statusConfig.icon;
                const AuthIcon = getAuthIcon(source.auth_type);

                return (
                  <tr key={source.source_id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground">{source.source_name}</span>
                        <span className="text-[10px] font-mono text-muted-foreground mt-0.5">
                          {source.source_id}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className={cn(
                        'flex items-center gap-1.5 px-2 py-1 rounded-full w-fit text-[10px] font-black uppercase',
                        statusConfig.bg,
                        statusConfig.color
                      )}>
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig.label}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant="outline" className="text-[10px]">
                        {source.source_type}
                      </Badge>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-xs text-muted-foreground font-medium">
                        {source.coverage}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <AuthIcon className="w-3 h-3" />
                        {source.auth_type}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <Badge 
                        variant={source.priority === 1 ? 'default' : 'secondary'}
                        className="text-[10px]"
                      >
                        P{source.priority}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
