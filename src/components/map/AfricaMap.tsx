import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Signal } from '@/hooks/useSignals';
import { MAPBOX_TOKEN, AFRO_COUNTRIES } from '@/lib/constants';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Layers, ZoomIn, ZoomOut, Locate, AlertTriangle, Wind } from 'lucide-react';

mapboxgl.accessToken = MAPBOX_TOKEN;

interface AfricaMapProps {
  signals: Signal[];
  selectedSignal?: Signal | null;
  onSignalSelect?: (signal: Signal) => void;
  onCountrySelect?: (country: string) => void;
}

// Color scale for choropleth severity
const getSeverityColor = (count: number, hasP1: boolean): string => {
  if (hasP1) return '#dc2626';
  if (count >= 10) return '#ea580c';
  if (count >= 5) return '#d97706';
  if (count >= 2) return '#ca8a04';
  if (count >= 1) return '#65a30d';
  return '#374151';
};

// Priority colors for markers
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
  const [showWindLayer, setShowWindLayer] = useState(false);

  // Compute country-level statistics
  const countryStats = useCallback(() => {
    const stats: Record<string, { count: number; hasP1: boolean }> = {};
    signals.forEach(signal => {
      const code = signal.location_country_iso || '';
      if (!stats[code]) stats[code] = { count: 0, hasP1: false };
      stats[code].count += 1;
      if (signal.priority === 'P1') stats[code].hasP1 = true;
    });
    return stats;
  }, [signals]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [20, 0],
      zoom: 3,
      minZoom: 2,
      maxZoom: 14,
      maxBounds: [[-35, -45], [65, 45]],
    });

    // Add navigation control
    map.current.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right');

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

      // === WIND PARTICLE LAYER ===
      m.addSource('raster-array-source', {
        type: 'raster-array',
        url: 'mapbox://rasterarrayexamples.gfs-winds',
        tileSize: 512,
      });

      m.addLayer({
        id: 'wind-layer',
        type: 'raster-particle',
        source: 'raster-array-source',
        'source-layer': '10winds',
        layout: {
          visibility: 'none', // Hidden by default
        },
        paint: {
          'raster-particle-speed-factor': 0.4,
          'raster-particle-fade-opacity-factor': 0.9,
          'raster-particle-reset-rate-factor': 0.4,
          'raster-particle-count': 4000,
          'raster-particle-max-speed': 40,
          'raster-particle-color': [
            'interpolate',
            ['linear'],
            ['raster-particle-speed'],
            1.5, 'rgba(134,163,171,255)',
            2.5, 'rgba(126,152,188,255)',
            4.12, 'rgba(110,143,208,255)',
            6.17, 'rgba(15,147,167,255)',
            9.26, 'rgba(57,163,57,255)',
            11.83, 'rgba(194,134,62,255)',
            14.92, 'rgba(200,66,13,255)',
            18.0, 'rgba(210,0,50,255)',
            21.6, 'rgba(175,80,136,255)',
            25.21, 'rgba(117,74,147,255)',
            29.32, 'rgba(68,105,141,255)',
            33.44, 'rgba(194,251,119,255)',
            43.72, 'rgba(241,255,109,255)',
            50.41, 'rgba(255,255,255,255)',
            59.16, 'rgba(0,255,255,255)',
            69.44, 'rgba(255,37,255,255)',
          ],
        },
      });

      // === CHOROPLETH: Country boundaries ===
      m.addSource('africa-countries', {
        type: 'vector',
        url: 'mapbox://mapbox.country-boundaries-v1',
      });

      m.addLayer({
        id: 'africa-fill',
        type: 'fill',
        source: 'africa-countries',
        'source-layer': 'country_boundaries',
        filter: ['in', 'iso_3166_1_alpha_3', ...AFRO_COUNTRIES.map(c => c.code)],
        paint: {
          'fill-color': '#374151',
          'fill-opacity': 0.5,
        },
      });

      m.addLayer({
        id: 'africa-borders',
        type: 'line',
        source: 'africa-countries',
        'source-layer': 'country_boundaries',
        filter: ['in', 'iso_3166_1_alpha_3', ...AFRO_COUNTRIES.map(c => c.code)],
        paint: {
          'line-color': '#6b7280',
          'line-width': 0.8,
        },
      });

      // === SIGNALS: GeoJSON source with clustering ===
      m.addSource('signals', {
        type: 'geojson',
        data: signalsToGeoJSON([]),
        cluster: true,
        clusterMaxZoom: 10,
        clusterRadius: 50,
        clusterProperties: {
          // Track minimum priority in cluster (1=P1, 4=P4)
          minPriority: ['min', ['get', 'priorityNum']],
        },
      });

      // Cluster circles layer
      m.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'signals',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step',
            ['get', 'minPriority'],
            PRIORITY_COLORS.P1, // minPriority <= 1
            1.5, PRIORITY_COLORS.P2,
            2.5, PRIORITY_COLORS.P3,
            3.5, PRIORITY_COLORS.P4,
          ],
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            18,   // < 10 points
            10, 24,
            50, 32,
            100, 40,
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
          'circle-opacity': 0.9,
        },
      });

      // Cluster count label
      m.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'signals',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': ['get', 'point_count_abbreviated'],
          'text-font': ['DIN Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 12,
        },
        paint: {
          'text-color': '#ffffff',
        },
      });

      // Unclustered individual points
      m.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'signals',
        filter: ['!', ['has', 'point_count']],
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
            3, 6,
            8, 10,
            12, 14,
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
          'circle-opacity': 0.95,
        },
      });

      // === INTERACTIONS ===

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
              <div class="popup-header" style="color: ${PRIORITY_COLORS[props.priority] || '#fff'}">
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

      // Click on country choropleth
      m.on('click', 'africa-fill', (e) => {
        if (e.features?.[0]) {
          const code = e.features[0].properties?.iso_3166_1_alpha_3;
          const country = AFRO_COUNTRIES.find(c => c.code === code);
          if (country && onCountrySelect) onCountrySelect(country.name);
        }
      });

      m.on('mouseenter', 'africa-fill', () => {
        m.getCanvas().style.cursor = 'pointer';
      });
      m.on('mouseleave', 'africa-fill', () => {
        m.getCanvas().style.cursor = '';
      });
    });

    return () => {
      popup.current?.remove();
      map.current?.remove();
      map.current = null;
    };
  }, [onCountrySelect, onSignalSelect, signals]);

  // Update choropleth colors
  useEffect(() => {
    if (!map.current || !mapLoaded || !map.current.isStyleLoaded()) return;
    const stats = countryStats();
    const colorExpr: mapboxgl.Expression = ['match', ['get', 'iso_3166_1_alpha_3']];
    Object.entries(stats).forEach(([code, data]) => {
      colorExpr.push(code, getSeverityColor(data.count, data.hasP1));
    });
    colorExpr.push('#374151');
    try {
      map.current.setPaintProperty('africa-fill', 'fill-color', colorExpr);
    } catch (e) {
      // Style not ready yet, will retry on next render
      console.debug('Map style not ready, skipping choropleth update');
    }
  }, [signals, mapLoaded, countryStats]);

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
    ['clusters', 'cluster-count', 'unclustered-point'].forEach(layer => {
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
      if (map.current.getLayer('wind-layer')) {
        map.current.setLayoutProperty('wind-layer', 'visibility', showWindLayer ? 'visible' : 'none');
      }
    } catch (e) {
      // Ignore if style not ready
    }
  }, [showWindLayer, mapLoaded]);

  // Fly to selected signal
  useEffect(() => {
    if (!map.current || !mapLoaded || !selectedSignal) return;
    if (selectedSignal.location_lat && selectedSignal.location_lng) {
      map.current.flyTo({
        center: [selectedSignal.location_lng, selectedSignal.location_lat],
        zoom: 8,
        duration: 1200,
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
  const handleReset = () => map.current?.flyTo({ center: [20, 0], zoom: 3, duration: 800 });

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
              variant={showWindLayer ? 'default' : 'secondary'}
              onClick={() => setShowWindLayer(!showWindLayer)}
              className="h-8 w-8 bg-card/90 backdrop-blur"
            >
              <Wind className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Toggle Wind Patterns</TooltipContent>
        </Tooltip>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur rounded-lg p-3 z-20">
        <div className="text-xs font-semibold mb-2 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Signal Density
        </div>
        <div className="flex flex-col gap-1 text-xs">
          {[
            { color: '#dc2626', label: 'Critical (P1)' },
            { color: '#ea580c', label: 'High (10+)' },
            { color: '#d97706', label: 'Medium (5-9)' },
            { color: '#ca8a04', label: 'Low (2-4)' },
            { color: '#65a30d', label: 'Minimal (1)' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
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
          border-radius: 8px;
          padding: 0;
          box-shadow: 0 4px 16px rgba(0,0,0,0.25);
        }
        .mapboxgl-popup-tip {
          border-top-color: hsl(var(--card)) !important;
        }
        .signal-popup-content {
          padding: 10px 12px;
          min-width: 160px;
        }
        .popup-header {
          font-weight: 600;
          font-size: 13px;
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
