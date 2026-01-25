import { useState } from 'react';
import { AFRO_COUNTRIES } from '@/lib/constants';
import { Globe, Settings2, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  selectedCountry: string;
  onSelectCountry: (country: string) => void;
  children?: React.ReactNode;
}

export function Sidebar({ selectedCountry, onSelectCountry, children }: SidebarProps) {
  const [activeTab, setActiveTab] = useState<'states' | 'filters'>('states');

  const groupedCountries = AFRO_COUNTRIES.reduce((acc, country) => {
    const region = country.region;
    if (!acc[region]) acc[region] = [];
    acc[region].push(country);
    return acc;
  }, {} as Record<string, typeof AFRO_COUNTRIES[number][]>);

  return (
    <div className="w-72 bg-sidebar-background border-r border-sidebar-border flex flex-col h-full shrink-0 relative z-40">
      {/* Header */}
      <div className="p-6 border-b border-sidebar-border sticky top-0 z-10 bg-sidebar-background">
        <h1 className="text-xl font-black text-sidebar-foreground tracking-tighter uppercase">
          PDX AFRO <span className="text-savanna">INTEL</span>
        </h1>
        <div className="flex items-center gap-2 mt-2">
          <span className="w-2 h-2 bg-savanna rounded-full animate-pulse" />
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            System Online
          </span>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="px-6 py-4 flex gap-2 border-b border-sidebar-border/50">
        <button
          onClick={() => setActiveTab('states')}
          className={cn(
            'flex-1 flex flex-col items-center py-3 rounded-xl transition-all',
            activeTab === 'states'
              ? 'bg-sidebar-accent text-savanna border border-sidebar-border shadow-xl'
              : 'text-muted-foreground hover:text-sidebar-foreground'
          )}
        >
          <Globe className="w-4 h-4 mb-1" />
          <span className="text-[9px] font-black uppercase tracking-widest">States</span>
        </button>
        <button
          onClick={() => setActiveTab('filters')}
          className={cn(
            'flex-1 flex flex-col items-center py-3 rounded-xl transition-all',
            activeTab === 'filters'
              ? 'bg-sidebar-accent text-savanna border border-sidebar-border shadow-xl'
              : 'text-muted-foreground hover:text-sidebar-foreground'
          )}
        >
          <Filter className="w-4 h-4 mb-1" />
          <span className="text-[9px] font-black uppercase tracking-widest">Filters</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {activeTab === 'states' ? (
          <div className="p-3 space-y-1">
            {/* Regional Panorama */}
            <button
              onClick={() => onSelectCountry('AFRO Regional Panorama')}
              className={cn(
                'w-full text-left px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 flex items-center justify-between',
                selectedCountry === 'AFRO Regional Panorama'
                  ? 'bg-savanna text-savanna-foreground shadow-lg'
                  : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground'
              )}
            >
              <span>Regional Panorama</span>
              <Globe className="w-4 h-4 opacity-50" />
            </button>

            {/* Countries by Region */}
            {Object.entries(groupedCountries).map(([region, countries]) => (
              <div key={region}>
                <div className="pt-4 pb-2 px-4 text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                  {region} Africa
                </div>
                {countries.map((country) => (
                  <button
                    key={country.code}
                    onClick={() => onSelectCountry(country.name)}
                    className={cn(
                      'w-full text-left px-4 py-2.5 rounded-lg text-xs font-bold transition-colors flex items-center justify-between group',
                      selectedCountry === country.name
                        ? 'bg-sidebar-accent text-savanna border border-sidebar-border'
                        : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                    )}
                  >
                    <span>{country.name}</span>
                    <span
                      className={cn(
                        'text-[9px] px-1.5 py-0.5 rounded bg-sidebar-accent text-muted-foreground group-hover:bg-sidebar-border transition-colors',
                        selectedCountry === country.name && 'text-savanna'
                      )}
                    >
                      {country.code}
                    </span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="h-full bg-sidebar-background p-4">
            {children || (
              <div className="text-center text-muted-foreground py-8">
                <Filter className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs font-medium">Filters coming soon</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border bg-sidebar-background z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-sidebar-accent border border-sidebar-border flex items-center justify-center">
            <Settings2 className="w-4 h-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-[10px] font-black text-sidebar-foreground uppercase">Analyst Console</p>
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Level 5 Access</p>
          </div>
        </div>
      </div>
    </div>
  );
}
