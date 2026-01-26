import whoAfroLogo from '@/assets/who-afro-logo.png';

export function SidebarHeader() {
  return (
    <div className="p-4 border-b border-sidebar-border sticky top-0 z-10 bg-sidebar-background">
      <div className="flex flex-col items-center text-center gap-3">
        <div className="neuro-card p-1.5 rounded-2xl w-full max-w-[200px]">
          <img 
            src={whoAfroLogo} 
            alt="WHO African Region" 
            className="w-full h-auto rounded-xl object-contain"
          />
        </div>
        <div className="w-full">
          <h1 className="text-lg font-bold text-sidebar-foreground leading-tight">
            AFRO Sentinel
          </h1>
          <p className="text-xs font-semibold text-primary">Watchtower</p>
          <div className="flex items-center justify-center gap-1.5 mt-2">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider">
              Online
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
