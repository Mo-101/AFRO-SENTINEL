import { useState } from 'react';
import { ChevronDown, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AFRO_COUNTRIES } from '@/lib/constants';
import { AFRO_REGIONS } from '@/lib/who-classifications';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface CountryListProps {
  selectedCountry: string;
  onSelectCountry: (country: string) => void;
}

export function CountryList({ selectedCountry, onSelectCountry }: CountryListProps) {
  const [openRegions, setOpenRegions] = useState<Record<string, boolean>>({});

  const toggleRegion = (regionId: string) => {
    setOpenRegions(prev => ({ ...prev, [regionId]: !prev[regionId] }));
  };

  const getCountriesForRegion = (regionId: string) => {
    const region = AFRO_REGIONS.find(r => r.id === regionId);
    if (!region) return [];
    return AFRO_COUNTRIES.filter(c => (region.countries as readonly string[]).includes(c.code));
  };

  return (
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

      {/* Collapsible Regions */}
      {AFRO_REGIONS.map((region) => {
        const countries = getCountriesForRegion(region.id);
        const isOpen = openRegions[region.id] ?? false;
        const hasSelectedCountry = countries.some(c => c.name === selectedCountry);

        return (
          <Collapsible key={region.id} open={isOpen || hasSelectedCountry} onOpenChange={() => toggleRegion(region.id)}>
            <CollapsibleTrigger className="w-full">
              <div className={cn(
                'flex items-center justify-between px-4 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors',
                hasSelectedCountry 
                  ? 'text-primary bg-primary/5' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
              )}>
                <span>{region.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-medium bg-muted/50 px-1.5 py-0.5 rounded">
                    {countries.length}
                  </span>
                  <ChevronDown className={cn(
                    'w-3.5 h-3.5 transition-transform duration-200',
                    (isOpen || hasSelectedCountry) && 'rotate-180'
                  )} />
                </div>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="pl-2 space-y-0.5 mt-1">
                {countries.map((country) => (
                  <button
                    key={country.code}
                    onClick={() => onSelectCountry(country.name)}
                    className={cn(
                      'w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-between group',
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
            </CollapsibleContent>
          </Collapsible>
        );
      })}
    </div>
  );
}
