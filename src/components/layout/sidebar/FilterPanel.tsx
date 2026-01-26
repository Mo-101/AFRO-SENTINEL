import { useState } from 'react';
import { ChevronDown, AlertTriangle, Shield, MapPin, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WHO_EMERGENCY_GRADES, EMERGENCY_TYPES, PROTECTION_LEVELS, AFRO_REGIONS } from '@/lib/who-classifications';
import { PRIORITIES } from '@/lib/constants';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface FilterPanelProps {
  filters: {
    grades: string[];
    emergencyTypes: string[];
    protectionLevels: number[];
    regions: string[];
    priorities: string[];
  };
  onFilterChange: (filters: FilterPanelProps['filters']) => void;
}

export function FilterPanel({ filters, onFilterChange }: FilterPanelProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    grades: true,
    emergency: false,
    protection: false,
    regions: false,
    priority: false,
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleFilter = <K extends keyof typeof filters>(
    key: K,
    value: typeof filters[K][number]
  ) => {
    const current = filters[key] as (string | number)[];
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    onFilterChange({ ...filters, [key]: updated });
  };

  return (
    <div className="p-3 space-y-2">
      {/* WHO Emergency Grade */}
      <Collapsible open={openSections.grades} onOpenChange={() => toggleSection('grades')}>
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-bold">WHO Emergency Grade</span>
            </div>
            <ChevronDown className={cn(
              'w-4 h-4 text-muted-foreground transition-transform',
              openSections.grades && 'rotate-180'
            )} />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="pt-2 pl-2 space-y-1.5">
            {WHO_EMERGENCY_GRADES.map((grade) => (
              <button
                key={grade.grade}
                onClick={() => toggleFilter('grades', grade.grade)}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-between border',
                  filters.grades.includes(grade.grade)
                    ? grade.badgeColor
                    : 'bg-background/50 text-muted-foreground hover:bg-muted/30 border-transparent'
                )}
              >
                <span>{grade.label}</span>
                <span className="text-[9px] opacity-70">{grade.description.split(' - ')[0]}</span>
              </button>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Emergency Type */}
      <Collapsible open={openSections.emergency} onOpenChange={() => toggleSection('emergency')}>
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold">Emergency Type</span>
            </div>
            <ChevronDown className={cn(
              'w-4 h-4 text-muted-foreground transition-transform',
              openSections.emergency && 'rotate-180'
            )} />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="pt-2 pl-2 space-y-1.5">
            {EMERGENCY_TYPES.map((type) => (
              <button
                key={type.type}
                onClick={() => toggleFilter('emergencyTypes', type.type)}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 border',
                  filters.emergencyTypes.includes(type.type)
                    ? 'bg-primary/10 text-primary border-primary/20'
                    : 'bg-background/50 text-muted-foreground hover:bg-muted/30 border-transparent'
                )}
              >
                <span>{type.icon}</span>
                <div>
                  <span className="font-bold">{type.label}</span>
                  <p className="text-[9px] opacity-70">{type.description}</p>
                </div>
              </button>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Protection Level */}
      <Collapsible open={openSections.protection} onOpenChange={() => toggleSection('protection')}>
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-rose-500" />
              <span className="text-xs font-bold">Protection Level</span>
            </div>
            <ChevronDown className={cn(
              'w-4 h-4 text-muted-foreground transition-transform',
              openSections.protection && 'rotate-180'
            )} />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="pt-2 pl-2 space-y-1.5">
            {PROTECTION_LEVELS.map((level) => (
              <button
                key={level.level}
                onClick={() => toggleFilter('protectionLevels', level.level)}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-between border',
                  filters.protectionLevels.includes(level.level)
                    ? level.color
                    : 'bg-background/50 text-muted-foreground hover:bg-muted/30 border-transparent'
                )}
              >
                <span>{level.label}</span>
                <span className="text-[9px] opacity-70">{level.description.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Regions */}
      <Collapsible open={openSections.regions} onOpenChange={() => toggleSection('regions')}>
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-bold">Regions</span>
            </div>
            <ChevronDown className={cn(
              'w-4 h-4 text-muted-foreground transition-transform',
              openSections.regions && 'rotate-180'
            )} />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="pt-2 pl-2 space-y-1.5">
            {AFRO_REGIONS.map((region) => (
              <button
                key={region.id}
                onClick={() => toggleFilter('regions', region.id)}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-between border',
                  filters.regions.includes(region.id)
                    ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                    : 'bg-background/50 text-muted-foreground hover:bg-muted/30 border-transparent'
                )}
              >
                <span>{region.label}</span>
                <span className="text-[9px] opacity-70">{region.countries.length} countries</span>
              </button>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Signal Priority */}
      <Collapsible open={openSections.priority} onOpenChange={() => toggleSection('priority')}>
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-gradient-to-br from-rose-500 to-amber-500" />
              <span className="text-xs font-bold">Signal Priority</span>
            </div>
            <ChevronDown className={cn(
              'w-4 h-4 text-muted-foreground transition-transform',
              openSections.priority && 'rotate-180'
            )} />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="pt-2 pl-2 grid grid-cols-2 gap-1.5">
            {Object.entries(PRIORITIES).map(([key, priority]) => (
              <button
                key={key}
                onClick={() => toggleFilter('priorities', key)}
                className={cn(
                  'px-3 py-2 rounded-lg text-xs font-bold transition-all border text-center',
                  filters.priorities.includes(key)
                    ? `bg-${priority.color}/20 text-${priority.color} border-${priority.color}/30`
                    : 'bg-background/50 text-muted-foreground hover:bg-muted/30 border-transparent'
                )}
              >
                {key}
              </button>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Clear All Filters */}
      {(filters.grades.length > 0 || filters.emergencyTypes.length > 0 || 
        filters.protectionLevels.length > 0 || filters.regions.length > 0 || 
        filters.priorities.length > 0) && (
        <button
          onClick={() => onFilterChange({
            grades: [],
            emergencyTypes: [],
            protectionLevels: [],
            regions: [],
            priorities: [],
          })}
          className="w-full mt-3 px-3 py-2 rounded-lg text-xs font-semibold text-destructive bg-destructive/10 hover:bg-destructive/20 transition-colors"
        >
          Clear All Filters
        </button>
      )}
    </div>
  );
}
