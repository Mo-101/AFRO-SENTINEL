 import { useState } from 'react';
 import { supabase } from '@/integrations/supabase/client';
 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { Progress } from '@/components/ui/progress';
 import { Bot, Loader2, CheckCircle2, XCircle, AlertTriangle, Database, Play, Zap } from 'lucide-react';
 import { toast } from 'sonner';
 import { cn } from '@/lib/utils';
 
 interface TriageStats {
   validated: number;
   dismissed: number;
   escalated: number;
   errors: number;
 }
 
 interface SyncStats {
   synced: number;
   deleted: number;
   errors: number;
   skipped: number;
 }
 
 export function AutoTriagePanel() {
   const [isTriaging, setIsTriaging] = useState(false);
   const [isSyncing, setIsSyncing] = useState(false);
   const [triageStats, setTriageStats] = useState<TriageStats | null>(null);
   const [syncStats, setSyncStats] = useState<SyncStats | null>(null);
   const [lastRunTime, setLastRunTime] = useState<string | null>(null);
 
   const runAutoTriage = async (batchSize: number = 50) => {
     setIsTriaging(true);
     setTriageStats(null);
 
     try {
       const { data, error } = await supabase.functions.invoke('auto-triage', {
         body: { batchSize },
       });
 
       if (error) {
         console.error('Auto-triage error:', error);
         toast.error('Auto-triage failed', { description: error.message });
         return;
       }
 
       setTriageStats(data.results);
       setLastRunTime(new Date().toLocaleTimeString());
       
       const total = data.results.validated + data.results.dismissed + data.results.escalated;
       toast.success(`Processed ${total} signals`, {
         description: `✓ ${data.results.validated} validated · ✗ ${data.results.dismissed} dismissed · ⚠ ${data.results.escalated} escalated`,
       });
     } catch (error) {
       console.error('Auto-triage error:', error);
       toast.error('Auto-triage failed');
     } finally {
       setIsTriaging(false);
     }
   };
 
   const runAzureSync = async () => {
     setIsSyncing(true);
     setSyncStats(null);
 
     try {
       const { data, error } = await supabase.functions.invoke('sync-to-azure', {
         body: { batchSize: 500, archiveAgeDays: 7, deleteAfterSync: false },
       });
 
       if (error) {
         console.error('Azure sync error:', error);
         toast.error('Azure sync failed', { description: error.message });
         return;
       }
 
       setSyncStats(data.results);
       toast.success(`Synced ${data.results.synced} signals to Azure`);
     } catch (error) {
       console.error('Azure sync error:', error);
       toast.error('Azure sync failed');
     } finally {
       setIsSyncing(false);
     }
   };
 
   const totalProcessed = triageStats
     ? triageStats.validated + triageStats.dismissed + triageStats.escalated
     : 0;
 
   return (
     <Card className="border-0 neuro-card">
       <CardHeader className="pb-3">
         <div className="flex items-center justify-between">
           <div className="flex items-center gap-2">
             <div className="p-2 rounded-lg bg-primary/10">
               <Bot className="w-4 h-4 text-primary" />
             </div>
             <div>
               <CardTitle className="text-sm font-semibold">AI Virtual Analyst</CardTitle>
               <CardDescription className="text-[10px]">
                 Automated WHO/CDC-aligned signal triage
               </CardDescription>
             </div>
           </div>
           {lastRunTime && (
             <Badge variant="outline" className="text-[9px]">
               Last: {lastRunTime}
             </Badge>
           )}
         </div>
       </CardHeader>
       <CardContent className="space-y-4">
         {/* Action Buttons */}
         <div className="flex gap-2">
           <Button
             size="sm"
             onClick={() => runAutoTriage(50)}
             disabled={isTriaging || isSyncing}
             className="flex-1 h-8 text-xs"
           >
             {isTriaging ? (
               <>
                 <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                 Processing...
               </>
             ) : (
               <>
                 <Zap className="w-3 h-3 mr-1" />
                 Triage 50
               </>
             )}
           </Button>
           <Button
             size="sm"
             variant="outline"
             onClick={() => runAutoTriage(100)}
             disabled={isTriaging || isSyncing}
             className="h-8 text-xs"
           >
             <Play className="w-3 h-3 mr-1" />
             100
           </Button>
           <Button
             size="sm"
             variant="secondary"
             onClick={runAzureSync}
             disabled={isTriaging || isSyncing}
             className="h-8 text-xs"
           >
             {isSyncing ? (
               <Loader2 className="w-3 h-3 animate-spin" />
             ) : (
               <>
                 <Database className="w-3 h-3 mr-1" />
                 Archive
               </>
             )}
           </Button>
         </div>
 
         {/* Triage Results */}
         {triageStats && (
           <div className="space-y-2">
             <div className="flex items-center justify-between text-[10px] text-muted-foreground">
               <span>Triage Results</span>
               <span>{totalProcessed} signals</span>
             </div>
             <div className="grid grid-cols-3 gap-2">
               <div className="flex flex-col items-center p-2 rounded-lg bg-savanna/10">
                 <CheckCircle2 className="w-4 h-4 text-savanna mb-1" />
                 <span className="text-lg font-bold text-savanna">{triageStats.validated}</span>
                 <span className="text-[9px] text-muted-foreground">Validated</span>
               </div>
               <div className="flex flex-col items-center p-2 rounded-lg bg-destructive/10">
                 <XCircle className="w-4 h-4 text-destructive mb-1" />
                 <span className="text-lg font-bold text-destructive">{triageStats.dismissed}</span>
                 <span className="text-[9px] text-muted-foreground">Dismissed</span>
               </div>
               <div className="flex flex-col items-center p-2 rounded-lg bg-sunset/10">
                 <AlertTriangle className="w-4 h-4 text-sunset mb-1" />
                 <span className="text-lg font-bold text-sunset">{triageStats.escalated}</span>
                 <span className="text-[9px] text-muted-foreground">Escalated</span>
               </div>
             </div>
             {totalProcessed > 0 && (
               <div className="space-y-1">
                 <div className="flex h-2 rounded-full overflow-hidden bg-muted">
                   <div
                     className="bg-savanna transition-all"
                     style={{ width: `${(triageStats.validated / totalProcessed) * 100}%` }}
                   />
                   <div
                     className="bg-destructive transition-all"
                     style={{ width: `${(triageStats.dismissed / totalProcessed) * 100}%` }}
                   />
                   <div
                     className="bg-sunset transition-all"
                     style={{ width: `${(triageStats.escalated / totalProcessed) * 100}%` }}
                   />
                 </div>
               </div>
             )}
             {triageStats.errors > 0 && (
               <p className="text-[10px] text-destructive">
                 {triageStats.errors} error(s) during processing
               </p>
             )}
           </div>
         )}
 
         {/* Sync Results */}
         {syncStats && (
           <div className="pt-2 border-t">
             <div className="flex items-center justify-between text-[10px]">
               <span className="text-muted-foreground">Azure Archive</span>
               <Badge variant="outline" className={cn(
                 "text-[9px]",
                 syncStats.synced > 0 && "bg-savanna/10 text-savanna border-savanna/20"
               )}>
                 {syncStats.synced} synced
               </Badge>
             </div>
           </div>
         )}
       </CardContent>
     </Card>
   );
 }