import { useMemo, useState, useRef, useEffect } from 'react';
import { useLiveSignalFeed } from '@/hooks/useLiveSignalFeed';
import { useSignalStats, useSignals } from '@/hooks/useSignals';
import { Signal } from '@/hooks/useSignals';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Radio, AlertTriangle, Activity, Bug, Shield, MapPin } from 'lucide-react';

interface LiveIntelligenceFeedProps {
  onSignalClick?: (signal: Signal) => void;
  activeFilter?: string;
}

// Neuromorphic disease color palette with soft shadows
const DISEASE_STYLES: Record<string, {
  bar: string;
  accent: string;
  bg: string;
  // Neuromorphic shadow colors (light and dark)
  shadowLight: string;
  shadowDark: string;
  glowColor: string;
  // Gradient for raised effect
  gradientFrom: string;
  gradientTo: string;
}> = {
  cholera: {
    bar: 'bg-cyan-500',
    accent: 'text-cyan-600',
    bg: 'bg-cyan-50',
    shadowLight: 'rgba(6, 182, 212, 0.15)',
    shadowDark: 'rgba(8, 145, 178, 0.3)',
    glowColor: 'rgba(6, 182, 212, 0.4)',
    gradientFrom: 'rgba(6, 182, 212, 0.08)',
    gradientTo: 'rgba(255, 255, 255, 0.9)',
  },
  ebola: {
    bar: 'bg-red-600',
    accent: 'text-red-700',
    bg: 'bg-red-50',
    shadowLight: 'rgba(220, 38, 38, 0.15)',
    shadowDark: 'rgba(185, 28, 28, 0.35)',
    glowColor: 'rgba(220, 38, 38, 0.5)',
    gradientFrom: 'rgba(220, 38, 38, 0.1)',
    gradientTo: 'rgba(255, 255, 255, 0.9)',
  },
  'lassa fever': {
    bar: 'bg-orange-500',
    accent: 'text-orange-600',
    bg: 'bg-orange-50',
    shadowLight: 'rgba(249, 115, 22, 0.15)',
    shadowDark: 'rgba(194, 65, 12, 0.3)',
    glowColor: 'rgba(249, 115, 22, 0.4)',
    gradientFrom: 'rgba(249, 115, 22, 0.08)',
    gradientTo: 'rgba(255, 255, 255, 0.9)',
  },
  malaria: {
    bar: 'bg-amber-500',
    accent: 'text-amber-600',
    bg: 'bg-amber-50',
    shadowLight: 'rgba(245, 158, 11, 0.15)',
    shadowDark: 'rgba(180, 83, 9, 0.3)',
    glowColor: 'rgba(245, 158, 11, 0.4)',
    gradientFrom: 'rgba(245, 158, 11, 0.08)',
    gradientTo: 'rgba(255, 255, 255, 0.9)',
  },
  measles: {
    bar: 'bg-pink-500',
    accent: 'text-pink-600',
    bg: 'bg-pink-50',
    shadowLight: 'rgba(236, 72, 153, 0.15)',
    shadowDark: 'rgba(190, 24, 93, 0.3)',
    glowColor: 'rgba(236, 72, 153, 0.4)',
    gradientFrom: 'rgba(236, 72, 153, 0.08)',
    gradientTo: 'rgba(255, 255, 255, 0.9)',
  },
  meningitis: {
    bar: 'bg-purple-500',
    accent: 'text-purple-600',
    bg: 'bg-purple-50',
    shadowLight: 'rgba(168, 85, 247, 0.15)',
    shadowDark: 'rgba(126, 34, 206, 0.3)',
    glowColor: 'rgba(168, 85, 247, 0.4)',
    gradientFrom: 'rgba(168, 85, 247, 0.08)',
    gradientTo: 'rgba(255, 255, 255, 0.9)',
  },
  'yellow fever': {
    bar: 'bg-yellow-500',
    accent: 'text-yellow-600',
    bg: 'bg-yellow-50',
    shadowLight: 'rgba(234, 179, 8, 0.15)',
    shadowDark: 'rgba(161, 98, 7, 0.3)',
    glowColor: 'rgba(234, 179, 8, 0.4)',
    gradientFrom: 'rgba(234, 179, 8, 0.08)',
    gradientTo: 'rgba(255, 255, 255, 0.9)',
  },
  mpox: {
    bar: 'bg-indigo-500',
    accent: 'text-indigo-600',
    bg: 'bg-indigo-50',
    shadowLight: 'rgba(99, 102, 241, 0.15)',
    shadowDark: 'rgba(67, 56, 202, 0.3)',
    glowColor: 'rgba(99, 102, 241, 0.4)',
    gradientFrom: 'rgba(99, 102, 241, 0.08)',
    gradientTo: 'rgba(255, 255, 255, 0.9)',
  },
  default: {
    bar: 'bg-slate-500',
    accent: 'text-slate-600',
    bg: 'bg-slate-50',
    shadowLight: 'rgba(100, 116, 139, 0.15)',
    shadowDark: 'rgba(71, 85, 105, 0.3)',
    glowColor: 'rgba(100, 116, 139, 0.4)',
    gradientFrom: 'rgba(100, 116, 139, 0.08)',
    gradientTo: 'rgba(255, 255, 255, 0.9)',
  },
};

// Country ISO3 to flag emoji mapping (subset for African countries)
const COUNTRY_FLAGS: Record<string, string> = {
  NGA: '🇳🇬', DRC: '🇨🇩', ETH: '🇪🇹', EGY: '🇪🇬', TZA: '🇹🇿',
  KEN: '🇰🇪', UGA: '🇺🇬', SDN: '🇸🇩', DZA: '🇩🇿', MAR: '🇲🇦',
  AGO: '🇦🇴', GHA: '🇬🇭', MOZ: '🇲🇿', MDG: '🇲🇬', CMR: '🇨🇲',
  CIV: '🇨🇮', NER: '🇳🇪', BFA: '🇧🇫', MLI: '🇲🇱', MWI: '🇲🇼',
  ZMB: '🇿🇲', SOM: '🇸🇴', SEN: '🇸🇳', TCD: '🇹🇩', ZWE: '🇿🇼',
  GIN: '🇬🇳', RWA: '🇷🇼', BEN: '🇧🇯', TUN: '🇹🇳', BDI: '🇧🇮',
  SSD: '🇸🇸', TGO: '🇹🇬', SLE: '🇸🇱', LBY: '🇱🇾', LBR: '🇱🇷',
  MRT: '🇲🇷', CAF: '🇨🇫', ERI: '🇪🇷', GMB: '🇬🇲', BWA: '🇧🇼',
  NAM: '🇳🇦', GAB: '🇬🇦', LSO: '🇱🇸', GNB: '🇬🇼', GNQ: '🇬🇶',
  MUS: '🇲🇺', SWZ: '🇸🇿', DJI: '🇩🇯', COM: '🇰🇲', CPV: '🇨🇻',
  STP: '🇸🇹', SYC: '🇸🇨', ZAF: '🇿🇦', COG: '🇨🇬',
};

function getDiseaseStyle(diseaseName: string | null) {
  if (!diseaseName) return DISEASE_STYLES.default;
  const key = diseaseName.toLowerCase();
  return DISEASE_STYLES[key] || DISEASE_STYLES.default;
}

function getCountryFlag(countryISO: string | null) {
  if (!countryISO) return '🌍';
  return COUNTRY_FLAGS[countryISO] || '🌍';
}

interface FeedItemProps {
  signal: Signal;
  onClick?: () => void;
  isNew?: boolean;
  ageIndex: number;
}

function FeedItem({ signal, onClick, isNew, ageIndex }: FeedItemProps) {
  const style = getDiseaseStyle(signal.disease_name);
  const countryFlag = getCountryFlag(signal.location_country_iso);
  const timeAgo = formatDistanceToNow(new Date(signal.created_at), { addSuffix: false });
  const fadeOpacity = Math.max(0.7, 1 - (ageIndex * 0.006));
  const isCritical = signal.priority === 'P1';

  // Dynamic neuromorphic shadows based on disease
  const neuromorphicShadow = {
    boxShadow: `
      6px 6px 12px ${style.shadowDark},
      -6px -6px 12px ${style.shadowLight},
      inset 0 0 0 transparent,
      inset 0 0 0 transparent
    `,
  };

  const neuromorphicHoverShadow = {
    boxShadow: `
      8px 8px 16px ${style.shadowDark},
      -8px -8px 16px ${style.shadowLight},
      inset 2px 2px 4px ${style.shadowDark},
      inset -2px -2px 4px ${style.shadowLight}
    `,
  };

  const neuromorphicActiveShadow = {
    boxShadow: `
      inset 4px 4px 8px ${style.shadowDark},
      inset -4px -4px 8px ${style.shadowLight},
      0 0 0 transparent,
      0 0 0 transparent
    `,
  };

  return (
    <div
      onClick={onClick}
      style={{ opacity: fadeOpacity }}
      className={cn(
        "group relative w-full text-left p-4 mb-3 rounded-2xl cursor-pointer overflow-hidden transition-all duration-300",
        "border border-white/50",
        isNew && "animate-in slide-in-from-right-2 duration-500"
      )}
    >
      {/* Neuromorphic base layer with disease-specific gradient */}
      <div
        className="absolute inset-0 rounded-2xl transition-all duration-300 group-hover:scale-[1.01]"
        style={{
          background: `linear-gradient(145deg, ${style.gradientFrom}, ${style.gradientTo})`,
          ...neuromorphicShadow,
        }}
      />

      {/* Hover/Active shadow overlay */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={neuromorphicHoverShadow}
      />

      {/* Active/Pressed state */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-active:opacity-100 transition-opacity duration-150 pointer-events-none"
        style={neuromorphicActiveShadow}
      />

      {/* Critical priority glow effect */}
      {isCritical && (
        <div
          className="absolute inset-0 rounded-2xl animate-pulse pointer-events-none"
          style={{
            boxShadow: `0 0 20px ${style.glowColor}, inset 0 0 10px ${style.glowColor}`,
          }}
        />
      )}

      {/* Content container */}
      <div className="relative z-10">
        {/* Top row: Flag + Disease Bar + Icon + Content */}
        <div className="flex items-start gap-3">
          {/* Country Flag with neuromorphic pill */}
          <div
            className="flex-shrink-0 flex flex-col items-center gap-1"
          >
            <div
              className="text-2xl p-2 rounded-xl bg-white/80 backdrop-blur-sm"
              style={{
                boxShadow: `
                  3px 3px 6px ${style.shadowDark},
                  -3px -3px 6px white
                `,
              }}
            >
              {countryFlag}
            </div>
            {/* Mini priority indicator */}
            <div
              className={cn(
                "w-2 h-2 rounded-full",
                signal.priority === 'P1' && "bg-red-500 animate-pulse",
                signal.priority === 'P2' && "bg-orange-500",
                signal.priority === 'P3' && "bg-yellow-500",
                signal.priority === 'P4' && "bg-green-500"
              )}
              style={{
                boxShadow: `
                  1px 1px 2px ${style.shadowDark},
                  -1px -1px 2px white
                `,
              }}
            />
          </div>

          {/* Vertical Disease Color Bar - Neuromorphic */}
          <div
            className={cn(
              "w-2 h-16 rounded-full flex-shrink-0",
              style.bar
            )}
            style={{
              boxShadow: `
                inset 2px 2px 4px rgba(0,0,0,0.2),
                inset -2px -2px 4px rgba(255,255,255,0.3),
                2px 2px 4px ${style.shadowDark},
                -2px -2px 4px white
              `,
            }}
          />

          {/* Contextual Icon - Neuromorphic button style */}
          <div
            className={cn(
              "flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center",
              style.bg
            )}
            style={{
              boxShadow: `
                4px 4px 8px ${style.shadowDark},
                -4px -4px 8px white,
                inset 1px 1px 2px rgba(255,255,255,0.8),
                inset -1px -1px 2px rgba(0,0,0,0.1)
              `,
            }}
          >
            {signal.priority === 'P1' ? (
              <AlertTriangle className={cn("w-5 h-5", style.accent)} />
            ) : signal.disease_category === 'vhf' ? (
              <Bug className={cn("w-5 h-5", style.accent)} />
            ) : (
              <Activity className={cn("w-5 h-5", style.accent)} />
            )}
          </div>

          {/* Content Area */}
          <div className="flex-1 min-w-0 space-y-1.5">
            {/* Title with disease color */}
            <h4 className={cn(
              "text-sm font-black uppercase tracking-tight leading-tight",
              style.accent
            )}>
              {signal.disease_name || 'Anomalous Signal'}
            </h4>

            {/* Description in neuromorphic inset container */}
            <div
              className="rounded-lg px-2 py-1.5 bg-white/60"
              style={{
                boxShadow: `
                  inset 2px 2px 4px ${style.shadowDark},
                  inset -2px -2px 4px white
                `,
              }}
            >
              <p className="text-[10px] leading-relaxed text-slate-600 line-clamp-2 font-medium">
                {signal.translated_text || signal.original_text}
              </p>
            </div>

            {/* Footer Metadata */}
            <div className="flex items-center gap-2 text-[9px] font-mono flex-wrap">
              {/* AFRO Verified Badge - Neuromorphic */}
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold"
                style={{
                  boxShadow: `
                    2px 2px 4px rgba(16, 185, 129, 0.2),
                    -2px -2px 4px white
                  `,
                }}
              >
                <Shield className="w-2.5 h-2.5" />
                AFRO✓
              </span>

              {/* Country pill */}
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/80 text-slate-600"
                style={{
                  boxShadow: `
                    2px 2px 4px ${style.shadowDark},
                    -2px -2px 4px white
                  `,
                }}
              >
                <MapPin className="w-2.5 h-2.5" />
                {signal.location_country}
              </span>

              {/* Time */}
              <span className="text-slate-400 px-1">
                {timeAgo}
              </span>

              {/* Priority Badge - Neuromorphic */}
              <span
                className={cn(
                  "px-2 py-0.5 rounded-full font-black text-[8px]",
                  signal.priority === 'P1' && "bg-red-100 text-red-700",
                  signal.priority === 'P2' && "bg-orange-100 text-orange-700",
                  signal.priority === 'P3' && "bg-yellow-100 text-yellow-700",
                  signal.priority === 'P4' && "bg-green-100 text-green-700"
                )}
                style={{
                  boxShadow: `
                    2px 2px 4px rgba(0,0,0,0.1),
                    -2px -2px 4px white
                  `,
                }}
              >
                {signal.priority}
              </span>
            </div>
          </div>
        </div>

        {/* Strategic Footnote (if validated) - Neuromorphic inset */}
        {signal.status === 'validated' && signal.analyst_notes && (
          <div
            className="mt-3 ml-[5.5rem] p-3 rounded-xl bg-gradient-to-r from-slate-50 to-white/80 border border-white"
            style={{
              boxShadow: `
                inset 3px 3px 6px ${style.shadowDark},
                inset -3px -3px 6px white
              `,
            }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <div className={cn("w-1.5 h-1.5 rounded-full", style.bar)} />
              <span className="text-[8px] font-bold uppercase tracking-wider text-slate-500">
                Guru Analysis
              </span>
            </div>
            <p className="text-[10px] leading-relaxed text-slate-600 font-medium">
              {signal.analyst_notes.substring(0, 120)}...
            </p>
          </div>
        )}
      </div>

      {/* Corner accent for critical signals */}
      {isCritical && (
        <div
          className="absolute top-0 right-0 w-16 h-16 pointer-events-none overflow-hidden rounded-tr-2xl"
        >
          <div
            className="absolute top-2 right-2 w-3 h-3 rounded-full bg-red-500"
            style={{
              boxShadow: `
                0 0 10px ${style.glowColor},
                2px 2px 4px ${style.shadowDark}
              `,
            }}
          />
        </div>
      )}
    </div>
  );
}

function FeedItemSkeleton() {
  return (
    <div className="p-4 mb-3">
      <div
        className="rounded-2xl p-4 bg-slate-50"
        style={{
          boxShadow: `
            6px 6px 12px rgba(0,0,0,0.1),
            -6px -6px 12px white
          `,
        }}
      >
        <div className="flex gap-3">
          <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
          <Skeleton className="h-16 w-2 rounded-full shrink-0" />
          <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function LiveIntelligenceFeed({ onSignalClick, activeFilter }: LiveIntelligenceFeedProps) {
  const { liveSignals, isConnected, isLoading, newSignalIds, streamRate } = useLiveSignalFeed();
  const { data: stats } = useSignalStats();
  const [isPaused, setIsPaused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // When a specific filter is active (validated, P1, new), fetch those signals directly from DB
  const filterQuery = useMemo(() => {
    if (!activeFilter || activeFilter === 'all') return {};
    if (activeFilter === 'P1') return { priority: ['P1' as const], limit: 50 };
    if (activeFilter === 'validated') return { status: ['validated' as const], limit: 50 };
    if (activeFilter === 'new') return { status: ['new' as const], limit: 50 };
    return {};
  }, [activeFilter]);

  const isFiltered = activeFilter && activeFilter !== 'all';
  const { data: filteredFromDB, isLoading: filterLoading } = useSignals(
    isFiltered ? filterQuery : { limit: 0 }
  );

  // Calculate compact stats based on current filter context
  const displayStats = useMemo(() => {
    if (!stats) return { p1: 0, new: 0, validated: 0, total: 0 };
    return {
      p1: stats.byPriority?.P1 || 0,
      new: stats.byStatus?.new || 0,
      validated: stats.byStatus?.validated || 0,
      total: stats.total || 0,
    };
  }, [stats]);

  // Use DB query for filtered view, live feed for unfiltered
  const displaySignals = useMemo(() => {
    if (isFiltered) return filteredFromDB || [];
    return liveSignals;
  }, [isFiltered, filteredFromDB, liveSignals]);

  // Auto-scroll to top when new signals arrive (if not paused)
  useEffect(() => {
    if (!isPaused && newSignalIds.size > 0 && scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [newSignalIds.size, isPaused]);

  return (
    <div
      className="w-96 xl:w-[450px] bg-slate-50/50 backdrop-blur-sm border-l border-slate-200/50 flex flex-col h-full shrink-0"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Header with connection status - Neuromorphic */}
      <div
        className="m-3 p-4 rounded-2xl bg-slate-50/80 border border-white"
        style={{
          boxShadow: `
            6px 6px 12px rgba(0,0,0,0.08),
            -6px -6px 12px white
          `,
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="p-1.5 rounded-lg bg-emerald-50"
              style={{
                boxShadow: `
                  2px 2px 4px rgba(0,0,0,0.1),
                  -2px -2px 4px white
                `,
              }}
            >
              <Radio className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-700">
              Live Feed
            </h3>
          </div>
          <div className="flex items-center gap-1.5">
            {isPaused && (
              <span className="text-[9px] text-slate-400 uppercase font-medium">Paused</span>
            )}
            <div
              className={cn(
                "w-2.5 h-2.5 rounded-full transition-all",
                isConnected ? "bg-emerald-500 animate-pulse" : "bg-red-500"
              )}
              style={{
                boxShadow: isConnected
                  ? '0 0 8px rgba(16, 185, 129, 0.6)'
                  : '0 0 8px rgba(239, 68, 68, 0.6)',
              }}
            />
          </div>
        </div>
        <p className="text-[10px] text-slate-500 mt-2 font-medium">
          {isConnected
            ? `Streaming • ${streamRate > 0 ? `${streamRate}/min` : 'Waiting for signals'}`
            : 'Connecting...'}
        </p>
        {activeFilter && activeFilter !== 'all' && (
          <div
            className="mt-3 px-3 py-1.5 rounded-lg bg-primary/5 border border-white inline-block"
            style={{
              boxShadow: `
                inset 2px 2px 4px rgba(0,0,0,0.05),
                inset -2px -2px 4px white
              `,
            }}
          >
            <span className="text-[9px] font-black text-primary uppercase tracking-wider">
              Filter: {activeFilter.toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Scrollable signal list */}
      <ScrollArea className="flex-1 px-3" ref={scrollRef}>
        {isLoading ? (
          <>
            {[...Array(5)].map((_, i) => (
              <FeedItemSkeleton key={i} />
            ))}
          </>
        ) : displaySignals.length > 0 ? (
          displaySignals.map((signal, index) => (
            <FeedItem
              key={signal.id}
              signal={signal}
              onClick={() => onSignalClick?.(signal)}
              isNew={newSignalIds.has(signal.id)}
              ageIndex={index}
            />
          ))
        ) : (
          <div
            className="m-3 p-6 rounded-2xl text-center bg-slate-50 border border-white"
            style={{
              boxShadow: `
                inset 4px 4px 8px rgba(0,0,0,0.05),
                inset -4px -4px 8px white
              `,
            }}
          >
            <p className="text-sm text-slate-400 font-medium">No signals detected</p>
            <p className="text-xs text-slate-300 mt-1">
              {activeFilter && activeFilter !== 'all'
                ? `No ${activeFilter} signals in feed`
                : 'Monitoring AFRO region...'}
            </p>
          </div>
        )}
      </ScrollArea>

      {/* Stats footer - Neuromorphic */}
      <div
        className="m-3 p-3 rounded-2xl bg-slate-50/80 border border-white"
        style={{
          boxShadow: `
            6px 6px 12px rgba(0,0,0,0.08),
            -6px -6px 12px white
          `,
        }}
      >
        <div className="flex items-center justify-between text-[10px] font-bold">
          <span
            className={cn(
              "px-2 py-1 rounded-lg transition-all",
              activeFilter === 'P1' ? "bg-red-100 text-red-700" : "text-slate-500"
            )}
            style={{
              boxShadow: activeFilter === 'P1'
                ? 'inset 2px 2px 4px rgba(0,0,0,0.1), inset -2px -2px 4px white'
                : '2px 2px 4px rgba(0,0,0,0.08), -2px -2px 4px white',
            }}
          >
            P1: {displayStats.p1}
          </span>
          <span
            className={cn(
              "px-2 py-1 rounded-lg transition-all",
              activeFilter === 'new' ? "bg-orange-100 text-orange-700" : "text-slate-500"
            )}
            style={{
              boxShadow: activeFilter === 'new'
                ? 'inset 2px 2px 4px rgba(0,0,0,0.1), inset -2px -2px 4px white'
                : '2px 2px 4px rgba(0,0,0,0.08), -2px -2px 4px white',
            }}
          >
            NEW: {displayStats.new}
          </span>
          <span
            className={cn(
              "px-2 py-1 rounded-lg transition-all",
              activeFilter === 'validated' ? "bg-emerald-100 text-emerald-700" : "text-slate-500"
            )}
            style={{
              boxShadow: activeFilter === 'validated'
                ? 'inset 2px 2px 4px rgba(0,0,0,0.1), inset -2px -2px 4px white'
                : '2px 2px 4px rgba(0,0,0,0.08), -2px -2px 4px white',
            }}
          >
            VAL: {displayStats.validated}
          </span>
        </div>
        <div
          className="flex items-center justify-center mt-3 pt-2 border-t border-slate-200/50"
        >
          <span
            className="text-emerald-600 flex items-center gap-1.5 text-[10px] font-bold px-3 py-1 rounded-full bg-emerald-50"
            style={{
              boxShadow: `
                2px 2px 4px rgba(0,0,0,0.08),
                -2px -2px 4px white
              `,
            }}
          >
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {isConnected ? `${streamRate}/min` : 'Connecting...'}
          </span>
        </div>
      </div>
    </div>
  );
}
