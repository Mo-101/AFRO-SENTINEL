import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Signal } from '@/hooks/useSignals';
import { MAPBOX_TOKEN, AFRO_COUNTRIES, PRIORITIES } from '@/lib/constants';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Layers, ZoomIn, ZoomOut, Locate, AlertTriangle } from 'lucide-react';

mapboxgl.accessToken = MAPBOX_TOKEN;

interface AfricaMapProps {
  signals: Signal[];
  selectedSignal?: Signal | null;
  onSignalSelect?: (signal: Signal) => void;
  onCountrySelect?: (country: string) => void;
}

// Color scale for severity (based on signal count and priority)
const getSeverityColor = (count: number, hasP1: boolean): string => {
  if (hasP1) return '#dc2626'; // red-600
  if (count >= 10) return '#ea580c'; // orange-600
  if (count >= 5) return '#d97706'; // amber-600
  if (count >= 2) return '#ca8a04'; // yellow-600
  if (count >= 1) return '#65a30d'; // lime-600
  return '#6b7280'; // gray-500
};

// Priority marker colors
const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case 'P1': return '#dc2626';
    case 'P2': return '#ea580c';
    case 'P3': return '#ca8a04';
    case 'P4': return '#22c55e';
    default: return '#6b7280';
  }
};

export function AfricaMap({ signals, selectedSignal, onSignalSelect, onCountrySelect }: AfricaMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [showMarkers, setShowMarkers] = useState(true);

  // Compute country-level statistics
  const countryStats = useCallback(() => {
    const stats: Record<string, { count: number; hasP1: boolean; signals: Signal[] }> = {};
    
    signals.forEach(signal => {
      const countryCode = signal.location_country_iso || '';
      if (!stats[countryCode]) {
        stats[countryCode] = { count: 0, hasP1: false, signals: [] };
      }
      stats[countryCode].count += 1;
      stats[countryCode].signals.push(signal);
      if (signal.priority === 'P1') {
        stats[countryCode].hasP1 = true;
      }
    });
    
    return stats;
  }, [signals]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [20, 0], // Center on Africa
      zoom: 3,
      minZoom: 2,
      maxZoom: 12,
      maxBounds: [[-30, -40], [60, 40]], // Restrict to Africa region
    });

    map.current.on('load', () => {
      setMapLoaded(true);

      // Add Africa countries source
      map.current!.addSource('africa-countries', {
        type: 'vector',
        url: 'mapbox://mapbox.country-boundaries-v1',
      });

      // Add choropleth fill layer
      map.current!.addLayer({
        id: 'africa-fill',
        type: 'fill',
        source: 'africa-countries',
        'source-layer': 'country_boundaries',
        filter: ['in', 'iso_3166_1_alpha_3', ...AFRO_COUNTRIES.map(c => c.code)],
        paint: {
          'fill-color': '#374151',
          'fill-opacity': 0.6,
        },
      });

      // Add country borders
      map.current!.addLayer({
        id: 'africa-borders',
        type: 'line',
        source: 'africa-countries',
        'source-layer': 'country_boundaries',
        filter: ['in', 'iso_3166_1_alpha_3', ...AFRO_COUNTRIES.map(c => c.code)],
        paint: {
          'line-color': '#6b7280',
          'line-width': 1,
        },
      });

      // Add click handler for countries
      map.current!.on('click', 'africa-fill', (e) => {
        if (e.features && e.features[0]) {
          const countryCode = e.features[0].properties?.iso_3166_1_alpha_3;
          const country = AFRO_COUNTRIES.find(c => c.code === countryCode);
          if (country && onCountrySelect) {
            onCountrySelect(country.name);
          }
        }
      });

      // Change cursor on hover
      map.current!.on('mouseenter', 'africa-fill', () => {
        map.current!.getCanvas().style.cursor = 'pointer';
      });

      map.current!.on('mouseleave', 'africa-fill', () => {
        map.current!.getCanvas().style.cursor = '';
      });
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [onCountrySelect]);

  // Update choropleth colors based on signals
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const stats = countryStats();
    
    // Build color expression for choropleth
    const colorExpression: mapboxgl.Expression = ['match', ['get', 'iso_3166_1_alpha_3']];
    
    Object.entries(stats).forEach(([code, data]) => {
      colorExpression.push(code, getSeverityColor(data.count, data.hasP1));
    });
    
    // Default color for countries without signals
    colorExpression.push('#374151');

    map.current.setPaintProperty('africa-fill', 'fill-color', colorExpression);
  }, [signals, mapLoaded, countryStats]);

  // Add/update markers for signals
  useEffect(() => {
    if (!map.current || !mapLoaded || !showMarkers) {
      // Clear markers if hidden
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      return;
    }

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add markers for signals with coordinates
    signals.forEach(signal => {
      if (!signal.location_lat || !signal.location_lng) return;

      // Create custom marker element
      const el = document.createElement('div');
      el.className = 'signal-marker';
      el.style.cssText = `
        width: 24px;
        height: 24px;
        background: ${getPriorityColor(signal.priority)};
        border: 2px solid white;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        transition: transform 0.2s;
      `;
      
      // Add pulse animation for P1 signals
      if (signal.priority === 'P1') {
        el.style.animation = 'pulse 2s infinite';
      }

      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.3)';
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
      });

      // Create popup
      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: false,
        className: 'signal-popup',
      }).setHTML(`
        <div style="padding: 8px; max-width: 200px;">
          <div style="font-weight: bold; margin-bottom: 4px; color: ${getPriorityColor(signal.priority)};">
            ${signal.priority} - ${signal.disease_name || 'Unknown'}
          </div>
          <div style="font-size: 12px; color: #9ca3af;">
            ${signal.location_country}${signal.location_admin1 ? `, ${signal.location_admin1}` : ''}
          </div>
          <div style="font-size: 11px; color: #6b7280; margin-top: 4px;">
            ${signal.source_name}
          </div>
        </div>
      `);

      const marker = new mapboxgl.Marker(el)
        .setLngLat([signal.location_lng, signal.location_lat])
        .setPopup(popup)
        .addTo(map.current!);

      // Click handler
      el.addEventListener('click', () => {
        onSignalSelect?.(signal);
      });

      markersRef.current.push(marker);
    });
  }, [signals, mapLoaded, showMarkers, onSignalSelect]);

  // Fly to selected signal
  useEffect(() => {
    if (!map.current || !mapLoaded || !selectedSignal) return;

    if (selectedSignal.location_lat && selectedSignal.location_lng) {
      map.current.flyTo({
        center: [selectedSignal.location_lng, selectedSignal.location_lat],
        zoom: 6,
        duration: 1500,
        essential: true,
      });
    } else if (selectedSignal.location_country_iso) {
      const country = AFRO_COUNTRIES.find(c => c.code === selectedSignal.location_country_iso);
      if (country) {
        map.current.flyTo({
          center: [country.lng, country.lat],
          zoom: 5,
          duration: 1500,
          essential: true,
        });
      }
    }
  }, [selectedSignal, mapLoaded]);

  // Map controls
  const handleZoomIn = () => map.current?.zoomIn();
  const handleZoomOut = () => map.current?.zoomOut();
  const handleResetView = () => {
    map.current?.flyTo({
      center: [20, 0],
      zoom: 3,
      duration: 1000,
    });
  };

  // Count active alerts by priority
  const alertCounts = signals.reduce((acc, s) => {
    acc[s.priority] = (acc[s.priority] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border bg-card">
      {/* Map Container */}
      <div ref={mapContainer} className="absolute inset-0" />

      {/* Loading overlay */}
      {!mapLoaded && (
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-muted-foreground">Loading map...</span>
          </div>
        </div>
      )}

      {/* Map Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
        <Button
          size="icon"
          variant="secondary"
          onClick={handleZoomIn}
          className="h-8 w-8 bg-card/90 backdrop-blur"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="secondary"
          onClick={handleZoomOut}
          className="h-8 w-8 bg-card/90 backdrop-blur"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="secondary"
          onClick={handleResetView}
          className="h-8 w-8 bg-card/90 backdrop-blur"
        >
          <Locate className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant={showMarkers ? "default" : "secondary"}
          onClick={() => setShowMarkers(!showMarkers)}
          className="h-8 w-8 bg-card/90 backdrop-blur"
        >
          <Layers className="h-4 w-4" />
        </Button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur rounded-lg p-3 z-20">
        <div className="text-xs font-semibold mb-2 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Signal Density
        </div>
        <div className="flex flex-col gap-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#dc2626' }} />
            <span>Critical (P1)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#ea580c' }} />
            <span>High (10+)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#d97706' }} />
            <span>Medium (5-9)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#ca8a04' }} />
            <span>Low (2-4)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#65a30d' }} />
            <span>Minimal (1)</span>
          </div>
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
              style={{
                borderColor: getPriorityColor(priority),
                color: getPriorityColor(priority),
              }}
            >
              {priority}: {alertCounts[priority] || 0}
            </Badge>
          ))}
        </div>
      </div>

      {/* Mapbox CSS for popups */}
      <style>{`
        .mapboxgl-popup-content {
          background: hsl(var(--card));
          border: 1px solid hsl(var(--border));
          border-radius: 8px;
          padding: 0;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }
        .mapboxgl-popup-tip {
          border-top-color: hsl(var(--card));
        }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.4); }
          50% { box-shadow: 0 0 0 10px rgba(220, 38, 38, 0); }
        }
      `}</style>
    </div>
  );
}
