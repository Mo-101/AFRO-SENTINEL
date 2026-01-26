import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Signal } from '@/hooks/useSignals';
import { MAPBOX_TOKEN, AFRO_COUNTRIES } from '@/lib/constants';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Layers, ZoomIn, ZoomOut, Locate, AlertTriangle, Sun, Moon, Sunrise, Sunset, Wind } from 'lucide-react';

mapboxgl.accessToken = MAPBOX_TOKEN;

interface AfricaMapProps {
  signals: Signal[];
  selectedSignal?: Signal | null;
  onSignalSelect?: (signal: Signal) => void;
  onCountrySelect?: (country: string) => void;
}

// Light presets for Mapbox Standard
type LightPreset = 'dawn' | 'day' | 'dusk' | 'night';

const LIGHT_PRESETS: LightPreset[] = ['dawn', 'day', 'dusk', 'night'];

const LIGHT_PRESET_ICONS: Record<LightPreset, React.ReactNode> = {
  dawn: <Sunrise className="h-4 w-4" />,
  day: <Sun className="h-4 w-4" />,
  dusk: <Sunset className="h-4 w-4" />,
  night: <Moon className="h-4 w-4" />,
};

// Priority colors for markers with emissive support
const PRIORITY_COLORS: Record<string, string> = {
  P1: '#dc2626',
  P2: '#ea580c',
  P3: '#ca8a04',
  P4: '#22c55e',
};

// Convert signals to GeoJSON
const signalsToGeoJSON = (signals: Signal[]): GeoJSON.FeatureCollection => ({
  type: 'FeatureCollection',
  features: signals
    .filter(s => s.location_lat && s.location_lng)
    .map(signal => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [signal.location_lng!, signal.location_lat!],
      },
      properties: {
        id: signal.id,
        priority: signal.priority,
        priorityNum: signal.priority === 'P1' ? 1 : signal.priority === 'P2' ? 2 : signal.priority === 'P3' ? 3 : 4,
        disease: signal.disease_name || 'Unknown',
        country: signal.location_country,
        admin1: signal.location_admin1 || '',
        source: signal.source_name,
        status: signal.status,
      },
    })),
});

export function AfricaMap({ signals, selectedSignal, onSignalSelect, onCountrySelect }: AfricaMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const popup = useRef<mapboxgl.Popup | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [showMarkers, setShowMarkers] = useState(true);
  const [showWind, setShowWind] = useState(true);
  const [lightPreset, setLightPreset] = useState<LightPreset>('day');

  // Initialize map with Mapbox Standard style
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/standard',
      center: [20, 0],
      zoom: 3,
      minZoom: 2,
      maxZoom: 18,
      maxBounds: [[-35, -45], [65, 45]],
    });

    // Add navigation control with compass
    map.current.addControl(new mapboxgl.NavigationControl({ showCompass: true }), 'bottom-right');

    // Create reusable popup
    popup.current = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 15,
      className: 'signal-popup',
    });

    map.current.on('load', () => {
      const m = map.current!;
      setMapLoaded(true);

      // Set initial light preset
      m.setConfigProperty('basemap', 'lightPreset', 'day');
      m.setConfigProperty('basemap', 'show3dObjects', true);

      // === SIGNALS: GeoJSON source with clustering ===
      m.addSource('signals', {
        type: 'geojson',
        data: signalsToGeoJSON([]),
        cluster: true,
        clusterMaxZoom: 10,
        clusterRadius: 50,
        clusterProperties: {
          minPriority: ['min', ['get', 'priorityNum']],
        },
      });

      // Cluster circles layer - using 'top' slot for visibility above Standard layers
      m.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'signals',
        filter: ['has', 'point_count'],
        slot: 'top',
        paint: {
          'circle-color': [
            'step',
            ['get', 'minPriority'],
            PRIORITY_COLORS.P1,
            1.5, PRIORITY_COLORS.P2,
            2.5, PRIORITY_COLORS.P3,
            3.5, PRIORITY_COLORS.P4,
          ],
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            18,
            10, 24,
            50, 32,
            100, 40,
          ],
          'circle-stroke-width': 3,
          'circle-stroke-color': '#ffffff',
          'circle-opacity': 0.95,
          'circle-emissive-strength': 0.8,
        },
      });

      // Cluster count label
      m.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'signals',
        filter: ['has', 'point_count'],
        slot: 'top',
        layout: {
          'text-field': ['get', 'point_count_abbreviated'],
          'text-font': ['DIN Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 13,
        },
        paint: {
          'text-color': '#ffffff',
          'text-emissive-strength': 1,
        },
      });

      // Unclustered individual points
      m.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'signals',
        filter: ['!', ['has', 'point_count']],
        slot: 'top',
        paint: {
          'circle-color': [
            'match',
            ['get', 'priority'],
            'P1', PRIORITY_COLORS.P1,
            'P2', PRIORITY_COLORS.P2,
            'P3', PRIORITY_COLORS.P3,
            'P4', PRIORITY_COLORS.P4,
            '#6b7280',
          ],
          'circle-radius': [
            'interpolate', ['linear'], ['zoom'],
            3, 8,
            8, 12,
            12, 16,
          ],
          'circle-stroke-width': 3,
          'circle-stroke-color': '#ffffff',
          'circle-opacity': 0.95,
          'circle-emissive-strength': 0.8,
        },
      });

      // P1 pulse animation ring
      m.addLayer({
        id: 'p1-pulse',
        type: 'circle',
        source: 'signals',
        filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'priority'], 'P1']],
        slot: 'top',
        paint: {
          'circle-color': 'transparent',
          'circle-radius': [
            'interpolate', ['linear'], ['zoom'],
            3, 16,
            8, 24,
            12, 32,
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': PRIORITY_COLORS.P1,
          'circle-stroke-opacity': 0.5,
        },
      });

      // === WIND PARTICLE LAYER ===
      // Using GFS (Global Forecast System) wind data from Mapbox
      m.addSource('wind', {
        type: 'raster-array',
        url: 'mapbox://mapbox.gfs-winds',
        tileSize: 512,
      });

      m.addLayer({
        id: 'wind-particles',
        type: 'raster-particle',
        source: 'wind',
        'source-layer': 'wind',
        slot: 'top',
        paint: {
          'raster-particle-speed-factor': 0.4,
          'raster-particle-fade-opacity-factor': 0.9,
          'raster-particle-reset-rate-factor': 0.4,
          'raster-particle-count': 2048,
          'raster-particle-max-speed': 40,
          'raster-particle-color': [
            'interpolate',
            ['linear'],
            ['raster-particle-speed'],
            1.5, 'rgba(134, 239, 172, 0.4)',  // Light green - gentle
            4, 'rgba(56, 189, 248, 0.5)',    // Sky blue - moderate  
            8, 'rgba(14, 165, 233, 0.6)',    // Blue - strong
            15, 'rgba(6, 182, 212, 0.7)',    // Cyan - very strong
            25, 'rgba(20, 184, 166, 0.8)',   // Teal - extreme
          ],
        },
      });

      // Click on cluster: zoom in
      m.on('click', 'clusters', (e) => {
        const features = m.queryRenderedFeatures(e.point, { layers: ['clusters'] });
        if (!features.length) return;
        const clusterId = features[0].properties?.cluster_id;
        const source = m.getSource('signals') as mapboxgl.GeoJSONSource;
        source.getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err) return;
          m.easeTo({
            center: (features[0].geometry as GeoJSON.Point).coordinates as [number, number],
            zoom: zoom ?? 6,
          });
        });
      });

      // Click on unclustered point: select signal
      m.on('click', 'unclustered-point', (e) => {
        if (!e.features?.length) return;
        const props = e.features[0].properties;
        if (props?.id && onSignalSelect) {
          const signal = signals.find(s => s.id === props.id);
          if (signal) onSignalSelect(signal);
        }
      });

      // Hover on unclustered point: show popup
      m.on('mouseenter', 'unclustered-point', (e) => {
        m.getCanvas().style.cursor = 'pointer';
        if (!e.features?.length || !popup.current) return;
        const coords = (e.features[0].geometry as GeoJSON.Point).coordinates.slice() as [number, number];
        const props = e.features[0].properties!;
        popup.current
          .setLngLat(coords)
          .setHTML(`
            <div class="signal-popup-content">
              <div class="popup-header" style="color: ${PRIORITY_COLORS[props.priority] || '#3b82f6'}">
                <strong>${props.priority}</strong> · ${props.disease}
              </div>
              <div class="popup-location">${props.country}${props.admin1 ? ', ' + props.admin1 : ''}</div>
              <div class="popup-source">${props.source}</div>
            </div>
          `)
          .addTo(m);
      });

      m.on('mouseleave', 'unclustered-point', () => {
        m.getCanvas().style.cursor = '';
        popup.current?.remove();
      });

      // Hover on cluster: pointer cursor
      m.on('mouseenter', 'clusters', () => {
        m.getCanvas().style.cursor = 'pointer';
      });
      m.on('mouseleave', 'clusters', () => {
        m.getCanvas().style.cursor = '';
      });
    });

    return () => {
      popup.current?.remove();
      map.current?.remove();
      map.current = null;
    };
  }, [onCountrySelect, onSignalSelect, signals]);

  // Update GeoJSON source when signals change
  useEffect(() => {
    if (!map.current || !mapLoaded || !map.current.isStyleLoaded()) return;
    const source = map.current.getSource('signals') as mapboxgl.GeoJSONSource | undefined;
    if (source) {
      source.setData(signalsToGeoJSON(signals));
    }
  }, [signals, mapLoaded]);

  // Toggle marker visibility
  useEffect(() => {
    if (!map.current || !mapLoaded || !map.current.isStyleLoaded()) return;
    const visibility = showMarkers ? 'visible' : 'none';
    ['clusters', 'cluster-count', 'unclustered-point', 'p1-pulse'].forEach(layer => {
      try {
        if (map.current?.getLayer(layer)) {
          map.current.setLayoutProperty(layer, 'visibility', visibility);
        }
      } catch (e) {
        // Ignore if style not ready
      }
    });
  }, [showMarkers, mapLoaded]);

  // Toggle wind layer visibility
  useEffect(() => {
    if (!map.current || !mapLoaded || !map.current.isStyleLoaded()) return;
    try {
      if (map.current.getLayer('wind-particles')) {
        map.current.setLayoutProperty('wind-particles', 'visibility', showWind ? 'visible' : 'none');
      }
    } catch (e) {
      // Ignore if style not ready
    }
  }, [showWind, mapLoaded]);

  // Update light preset
  useEffect(() => {
    if (!map.current || !mapLoaded || !map.current.isStyleLoaded()) return;
    try {
      map.current.setConfigProperty('basemap', 'lightPreset', lightPreset);
    } catch (e) {
      console.debug('Failed to set light preset');
    }
  }, [lightPreset, mapLoaded]);

  // Fly to selected signal
  useEffect(() => {
    if (!map.current || !mapLoaded || !selectedSignal) return;
    if (selectedSignal.location_lat && selectedSignal.location_lng) {
      map.current.flyTo({
        center: [selectedSignal.location_lng, selectedSignal.location_lat],
        zoom: 10,
        duration: 1200,
        pitch: 45,
      });
    } else if (selectedSignal.location_country_iso) {
      const country = AFRO_COUNTRIES.find(c => c.code === selectedSignal.location_country_iso);
      if (country) {
        map.current.flyTo({
          center: [country.lng, country.lat],
          zoom: 5,
          duration: 1200,
        });
      }
    }
  }, [selectedSignal, mapLoaded]);

  // Controls
  const handleZoomIn = () => map.current?.zoomIn();
  const handleZoomOut = () => map.current?.zoomOut();
  const handleReset = () => map.current?.flyTo({ center: [20, 0], zoom: 3, duration: 800, pitch: 0 });
  
  const cycleLightPreset = () => {
    const currentIndex = LIGHT_PRESETS.indexOf(lightPreset);
    const nextIndex = (currentIndex + 1) % LIGHT_PRESETS.length;
    setLightPreset(LIGHT_PRESETS[nextIndex]);
  };

  // Alert counts
  const alertCounts = signals.reduce((acc, s) => {
    acc[s.priority] = (acc[s.priority] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border bg-card">
      <div ref={mapContainer} className="absolute inset-0" />

      {/* Loading */}
      {!mapLoaded && (
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-muted-foreground">Loading map...</span>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
        <Button size="icon" variant="secondary" onClick={handleZoomIn} className="h-8 w-8 bg-card/90 backdrop-blur">
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="secondary" onClick={handleZoomOut} className="h-8 w-8 bg-card/90 backdrop-blur">
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="secondary" onClick={handleReset} className="h-8 w-8 bg-card/90 backdrop-blur">
          <Locate className="h-4 w-4" />
        </Button>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant={showMarkers ? 'default' : 'secondary'}
              onClick={() => setShowMarkers(!showMarkers)}
              className="h-8 w-8 bg-card/90 backdrop-blur"
            >
              <Layers className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Toggle Signal Markers</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant={showWind ? 'default' : 'secondary'}
              onClick={() => setShowWind(!showWind)}
              className="h-8 w-8 bg-card/90 backdrop-blur"
            >
              <Wind className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Toggle Wind Particles</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="secondary"
              onClick={cycleLightPreset}
              className="h-8 w-8 bg-card/90 backdrop-blur"
            >
              {LIGHT_PRESET_ICONS[lightPreset]}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            Light: {lightPreset.charAt(0).toUpperCase() + lightPreset.slice(1)}
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur rounded-lg p-3 z-20">
        <div className="text-xs font-semibold mb-2 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Signal Priority
        </div>
        <div className="flex flex-col gap-1 text-xs">
          {[
            { color: PRIORITY_COLORS.P1, label: 'P1 · Critical' },
            { color: PRIORITY_COLORS.P2, label: 'P2 · High' },
            { color: PRIORITY_COLORS.P3, label: 'P3 · Medium' },
            { color: PRIORITY_COLORS.P4, label: 'P4 · Low' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full border-2 border-white" style={{ backgroundColor: color }} />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Alert Summary */}
      <div className="absolute top-4 left-4 bg-card/90 backdrop-blur rounded-lg p-3 z-20">
        <div className="text-xs font-semibold mb-2">Active Signals</div>
        <div className="flex gap-2">
          {(['P1', 'P2', 'P3', 'P4'] as const).map(priority => (
            <Badge
              key={priority}
              variant="outline"
              className="text-xs"
              style={{ borderColor: PRIORITY_COLORS[priority], color: PRIORITY_COLORS[priority] }}
            >
              {priority}: {alertCounts[priority] || 0}
            </Badge>
          ))}
        </div>
      </div>

      {/* Popup styles */}
      <style>{`
        .mapboxgl-popup-content {
          background: hsl(var(--card));
          border: 1px solid hsl(var(--border));
          border-radius: 12px;
          padding: 0;
          box-shadow: 0 8px 32px rgba(0,0,0,0.15);
        }
        .mapboxgl-popup-tip {
          border-top-color: hsl(var(--card)) !important;
        }
        .signal-popup-content {
          padding: 12px 14px;
          min-width: 180px;
        }
        .popup-header {
          font-weight: 600;
          font-size: 14px;
          margin-bottom: 4px;
        }
        .popup-location {
          font-size: 12px;
          color: hsl(var(--muted-foreground));
        }
        .popup-source {
          font-size: 11px;
          color: hsl(var(--muted-foreground));
          opacity: 0.7;
          margin-top: 4px;
        }
      `}</style>
    </div>
  );
}
