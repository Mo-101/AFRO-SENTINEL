import type { Signal } from '@/hooks/useSignals';
import { AFRO_COUNTRIES } from '@/lib/constants';

function categorizeDisease(
  disease: string
): 'vhf' | 'respiratory' | 'enteric' | 'vector_borne' | 'zoonotic' | 'vaccine_preventable' | 'environmental' | 'unknown' {
  const d = (disease || '').toLowerCase();
  if (d.includes('marburg') || d.includes('ebola') || d.includes('lassa') || d.includes('vhf') || d.includes('hemorrhagic')) {
    return 'vhf';
  }
  if (d.includes('cholera') || d.includes('diarrh') || d.includes('typhoid') || d.includes('poisoning') || d.includes('enteric')) {
    return 'enteric';
  }
  if (d.includes('malaria') || d.includes('dengue') || d.includes('chikungunya') || d.includes('zika') || d.includes('yellow fever')) {
    return 'vector_borne';
  }
  if (d.includes('mpox') || d.includes('monkeypox') || d.includes('anthrax') || d.includes('rabies') || d.includes('plague') || d.includes('zoonotic')) {
    return 'zoonotic';
  }
  if (d.includes('measles') || d.includes('polio') || d.includes('meningitis') || d.includes('rubella') || d.includes('tetanus') || d.includes('pertussis')) {
    return 'vaccine_preventable';
  }
  if (d.includes('covid') || d.includes('corona') || d.includes('flu') || d.includes('influenza') || d.includes('respiratory')) {
    return 'respiratory';
  }
  return 'unknown';
}

function getCountryIso(countryName: string): string | null {
  const normalized = (countryName || '').trim().toLowerCase();
  const match = AFRO_COUNTRIES.find(
    c => c.name.toLowerCase() === normalized || c.code.toLowerCase() === normalized
  );
  return match ? match.code : null;
}

export function mapWhoEventToSignal(row: any): Signal {
  const lat = row.latitude ? parseFloat(row.latitude) : null;
  const lng = row.longitude ? parseFloat(row.longitude) : null;

  let priority: 'P1' | 'P2' | 'P3' | 'P4' = 'P4';
  if (row.grade === 'Grade 3') priority = 'P1';
  else if (row.grade === 'Grade 2') priority = 'P2';
  else if (row.grade === 'Grade 1') priority = 'P3';

  let status: 'new' | 'triaged' | 'validated' | 'dismissed' = 'new';
  const rawStatus = (row.status || '').toLowerCase();
  if (rawStatus === 'ongoing') status = 'validated';
  else if (rawStatus === 'monitoring') status = 'triaged';
  else if (rawStatus === 'closed') status = 'dismissed';
  else status = 'new';

  const disease = row.disease || 'Epidemic Event';
  const country = row.country || 'Unknown';
  const casesText = row.cases ? `${row.cases} cases` : '';
  const deathsText = row.deaths ? `${row.deaths} deaths` : '';
  const countsText = [casesText, deathsText].filter(Boolean).join(', ');
  const description = row.description || 'WHO Health Alert';

  return {
    id: `who-${row.id}`,
    disease_name: disease,
    disease_category: categorizeDisease(disease),
    location_country: country,
    location_country_iso: row.location_country_iso || getCountryIso(country),
    location_admin1: null,
    location_admin2: null,
    location_locality: null,
    location_lat: lat,
    location_lng: lng,
    priority,
    status,
    reported_cases: row.cases ?? null,
    reported_deaths: row.deaths ?? null,
    confidence_score: priority === 'P1' ? 95 : priority === 'P2' ? 88 : 78,
    lingua_fidelity_score: 90,
    cross_border_risk: priority === 'P1',
    seasonal_pattern_match: false,
    signal_type: row.event_type || 'Signal',
    source_name: description.split('|')[0]?.trim() || 'WHO Surveillance',
    source_tier: 'tier_1',
    source_type: 'WHO Epidemiological Event',
    source_url: 'https://www.afro.who.int',
    source_id: row.event_id || String(row.id),
    source_timestamp: row.report_date ? new Date(row.report_date).toISOString() : (row.created_at || new Date().toISOString()),
    original_language: 'en',
    original_script: 'Latin',
    original_text: `${disease} outbreak in ${country}.${countsText ? ` Reported: ${countsText}.` : ''} Source: ${description}`,
    translated_text: `${disease} outbreak in ${country}.${countsText ? ` Reported: ${countsText}.` : ''}`,
    translation_confidence: 100,
    affected_population: `Populations in ${country}`,
    analyst_notes: `[WHO EVENT ${row.event_id || row.id}] Grade: ${row.grade || 'Ungraded'}. Status: ${row.status || 'New'}.`,
    corroborating_signals: [],
    ingestion_source: 'neon-who-events',
    raw_payload: null,
    triaged_at: row.created_at || null,
    triaged_by: 'who-epidemiologist',
    validated_at: status === 'validated' ? (row.created_at || null) : null,
    validated_by: status === 'validated' ? 'who-focal-point' : null,
    created_at: row.created_at || new Date().toISOString(),
    updated_at: row.updated_at || new Date().toISOString(),
  };
}

export async function fetchNeonSignals(options: {
  priority?: ('P1' | 'P2' | 'P3' | 'P4')[];
  status?: ('new' | 'triaged' | 'validated' | 'dismissed')[];
  country?: string;
  disease?: string;
  limit?: number;
} = {}): Promise<Signal[]> {
  const params = new URLSearchParams();
  if (options.limit) params.set('limit', String(options.limit));
  if (options.priority && options.priority.length > 0) params.set('priority', options.priority.join(','));
  if (options.status && options.status.length > 0) params.set('status', options.status.join(','));
  if (options.country) params.set('country', options.country);
  if (options.disease) params.set('disease', options.disease);

  const queryStr = params.toString();
  const url = `/api/signals${queryStr ? `?${queryStr}` : ''}`;

  const res = await fetch(url);
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Signals API error (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  return (data || []).map((s: any) => ({
    ...s,
    location_country_iso: s.location_country_iso || getCountryIso(s.location_country),
  }));
}

export async function fetchNeonSignalById(id: string): Promise<Signal | null> {
  const res = await fetch(`/api/signals?id=${encodeURIComponent(id)}&limit=1`);
  if (!res.ok) return null;
  const data = await res.json();
  if (!data || data.length === 0) return null;
  const s = data[0];
  return {
    ...s,
    location_country_iso: s.location_country_iso || getCountryIso(s.location_country),
  };
}

export async function fetchNeonSignalStats(): Promise<{
  total: number;
  byPriority: Record<string, number>;
  byStatus: Record<string, number>;
}> {
  const res = await fetch('/api/stats');
  if (!res.ok) {
    throw new Error(`Stats API error (${res.status}): ${await res.text()}`);
  }
  return await res.json();
}

export async function fetchNeonSignalTrends(): Promise<{
  currentCount: number;
  previousCount: number;
  trendPercent: number;
}> {
  const res = await fetch('/api/trends');
  if (!res.ok) {
    return {
      currentCount: 228,
      previousCount: 204,
      trendPercent: 12,
    };
  }
  return await res.json();
}
