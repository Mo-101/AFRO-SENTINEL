import { useState } from 'react';
import { Globe, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { User } from '@supabase/supabase-js';
import { SidebarHeader } from './sidebar/SidebarHeader';
import { SidebarFooter } from './sidebar/SidebarFooter';
import { CountryList } from './sidebar/CountryList';
import { FilterPanel } from './sidebar/FilterPanel';

interface SidebarProps {
  selectedCountry: string;
  onSelectCountry: (country: string) => void;
  children?: React.ReactNode;
  user?: User | null;
  role?: string | null;
  isAdmin?: boolean;
  isAnalyst?: boolean;
  onSignOut?: () => void;
}

export function Sidebar({ selectedCountry, onSelectCountry, children, user, role, isAdmin, isAnalyst, onSignOut }: SidebarProps) {
  const [activeTab, setActiveTab] = useState<'states' | 'filters'>('states');
  const [filters, setFilters] = useState({
    grades: [] as string[],
    emergencyTypes: [] as string[],
    protectionLevels: [] as number[],
    regions: [] as string[],
    priorities: [] as string[],
  });

  const activeFilterCount = filters.grades.length + filters.emergencyTypes.length + 
    filters.protectionLevels.length + filters.regions.length + filters.priorities.length;

  return (
    <div className="w-72 bg-sidebar-background border-r border-sidebar-border flex flex-col h-full shrink-0 relative z-40">
      <SidebarHeader />

      {/* Tab Switcher - Neuromorphic Style */}
      <div className="px-4 py-4 flex gap-3 border-b border-sidebar-border/50">
        <button
          onClick={() => setActiveTab('states')}
          className={cn(
            'flex-1 flex flex-col items-center py-3 rounded-xl transition-all duration-200',
            activeTab === 'states'
              ? 'neuro-card text-primary'
              : 'bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/50'
          )}
        >
          <div className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center mb-1.5 transition-all',
            activeTab === 'states' ? 'shadow-inset bg-primary/10' : 'bg-background/50'
          )}>
            <Globe className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-semibold">States</span>
        </button>
        <button
          onClick={() => setActiveTab('filters')}
          className={cn(
            'flex-1 flex flex-col items-center py-3 rounded-xl transition-all duration-200 relative',
            activeTab === 'filters'
              ? 'neuro-card text-primary'
              : 'bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/50'
          )}
        >
          <div className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center mb-1.5 transition-all',
            activeTab === 'filters' ? 'shadow-inset bg-primary/10' : 'bg-background/50'
          )}>
            <Filter className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-semibold">Filters</span>
          {activeFilterCount > 0 && (
            <span className="absolute top-2 right-4 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {activeTab === 'states' ? (
          <CountryList 
            selectedCountry={selectedCountry} 
            onSelectCountry={onSelectCountry} 
          />
        ) : (
          <FilterPanel 
            filters={filters} 
            onFilterChange={setFilters} 
          />
        )}
      </div>

      <SidebarFooter 
        user={user}
        role={role}
        isAdmin={isAdmin}
        isAnalyst={isAnalyst}
        onSignOut={onSignOut}
      />
    </div>
  );
}
