const NEON_AUTH_URL =
  process.env.VITE_NEON_AUTH_URL ||
  process.env.NEON_AUTH_URL ||
  'postgresql://neondb_owner:npg_i35UjNDvaZoh@ep-restless-salad-ad9c8chi-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const NEON_SQL_ENDPOINT = 'https://ep-restless-salad-ad9c8chi-pooler.c-2.us-east-1.aws.neon.tech/sql';

const COUNTRY_ISO_MAP: Record<string, string> = {
  angola: 'AGO',
  benin: 'BEN',
  botswana: 'BWA',
  'burkina faso': 'BFA',
  burundi: 'BDI',
  'cabo verde': 'CPV',
  'cape verde': 'CPV',
  cameroon: 'CMR',
  'central african republic': 'CAF',
  chad: 'TCD',
  comoros: 'COM',
  congo: 'COG',
  'republic of the congo': 'COG',
  "côte d'ivoire": 'CIV',
  'cote d ivoire': 'CIV',
  'ivory coast': 'CIV',
  'dr congo': 'COD',
  'democratic republic of the congo': 'COD',
  drc: 'COD',
  djibouti: 'DJI',
  egypt: 'EGY',
  'equatorial guinea': 'GNQ',
  eritrea: 'ERI',
  eswatini: 'SWZ',
  swaziland: 'SWZ',
  ethiopia: 'ETH',
  gabon: 'GAB',
  gambia: 'GMB',
  ghana: 'GHA',
  guinea: 'GIN',
  'guinea-bissau': 'GNB',
  kenya: 'KEN',
  lesotho: 'LSO',
  liberia: 'LBR',
  libya: 'LBY',
  madagascar: 'MDG',
  malawi: 'MWI',
  mali: 'MLI',
  mauritania: 'MRT',
  mauritius: 'MUS',
  morocco: 'MAR',
  mozambique: 'MOZ',
  namibia: 'NAM',
  niger: 'NER',
  nigeria: 'NGA',
  rwanda: 'RWA',
  'sao tome and principe': 'STP',
  senegal: 'SEN',
  seychelles: 'SYC',
  'sierra leone': 'SLE',
  somalia: 'SOM',
  'south africa': 'ZAF',
  'south sudan': 'SSD',
  sudan: 'SDN',
  tanzania: 'TZA',
  togo: 'TGO',
  tunisia: 'TUN',
  uganda: 'UGA',
  zambia: 'ZMB',
  zimbabwe: 'ZWE',
  algeria: 'DZA',
};

async function queryNeon(sql: string) {
  const res = await fetch(NEON_SQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'neon-connection-string': NEON_AUTH_URL,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Neon SQL error: ${errorText}`);
  }

  const data = await res.json();
  return data.rows || [];
}

function categorizeDisease(disease: string): string {
  const d = (disease || '').toLowerCase();
  if (d.includes('marburg') || d.includes('ebola') || d.includes('lassa') || d.includes('vhf') || d.includes('hemorrhagic')) return 'vhf';
  if (d.includes('cholera') || d.includes('diarrh') || d.includes('typhoid') || d.includes('poisoning') || d.includes('enteric')) return 'enteric';
  if (d.includes('malaria') || d.includes('dengue') || d.includes('chikungunya') || d.includes('zika') || d.includes('yellow fever')) return 'vector_borne';
  if (d.includes('mpox') || d.includes('monkeypox') || d.includes('anthrax') || d.includes('rabies') || d.includes('plague') || d.includes('zoonotic')) return 'zoonotic';
  if (d.includes('measles') || d.includes('polio') || d.includes('meningitis') || d.includes('rubella') || d.includes('tetanus') || d.includes('pertussis')) return 'vaccine_preventable';
  if (d.includes('covid') || d.includes('corona') || d.includes('flu') || d.includes('influenza') || d.includes('respiratory')) return 'respiratory';
  return 'unknown';
}

function getCountryIso(country: string): string | null {
  if (!country) return null;
  const normalized = country.trim().toLowerCase();
  return COUNTRY_ISO_MAP[normalized] || null;
}

function mapWhoEventToSignal(row: any) {
  const lat = row.latitude ? parseFloat(row.latitude) : null;
  const lng = row.longitude ? parseFloat(row.longitude) : null;

  let priority = 'P4';
  if (row.grade === 'Grade 3') priority = 'P1';
  else if (row.grade === 'Grade 2') priority = 'P2';
  else if (row.grade === 'Grade 1') priority = 'P3';

  let status = 'new';
  const rawStatus = (row.status || '').toLowerCase();
  if (rawStatus === 'ongoing') status = 'validated';
  else if (rawStatus === 'monitoring') status = 'triaged';
  else if (rawStatus === 'closed') status = 'dismissed';

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
    location_country_iso: getCountryIso(country),
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

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const url = new URL(req.url, `http://${req.headers?.host || 'localhost'}`);
    const limitParam = req.query?.limit || url.searchParams.get('limit') || '50';
    const limit = Math.min(Math.max(parseInt(limitParam, 10) || 50, 1), 200);
    const priority = (req.query?.priority as string) || url.searchParams.get('priority');
    const status = (req.query?.status as string) || url.searchParams.get('status');
    const country = (req.query?.country as string) || url.searchParams.get('country');
    const disease = (req.query?.disease as string) || url.searchParams.get('disease');
    const id = (req.query?.id as string) || url.searchParams.get('id');

    const whereClauses: string[] = [];

    if (id) {
      const cleanId = id.replace(/^who-/, '');
      const numId = parseInt(cleanId, 10);
      if (!isNaN(numId) && numId > 0) {
        whereClauses.push(`(id = ${numId} OR event_id = '${id.replace(/'/g, "''")}')`);
      } else {
        whereClauses.push(`event_id = '${id.replace(/'/g, "''")}'`);
      }
    }

    if (priority) {
      const pList = priority.split(',').map((p: string) => p.trim());
      const pConditions: string[] = [];
      for (const p of pList) {
        if (p === 'P1') pConditions.push("grade = 'Grade 3'");
        else if (p === 'P2') pConditions.push("grade = 'Grade 2'");
        else if (p === 'P3') pConditions.push("grade = 'Grade 1'");
        else if (p === 'P4') pConditions.push("(grade = 'Ungraded' OR grade IS NULL)");
        else pConditions.push(`grade = '${p.replace(/'/g, "''")}'`);
      }
      if (pConditions.length > 0) {
        whereClauses.push(`(${pConditions.join(' OR ')})`);
      }
    }

    if (status) {
      const sList = status.split(',').map((s: string) => s.trim().toLowerCase());
      const sConditions: string[] = [];
      for (const s of sList) {
        if (s === 'new') sConditions.push("LOWER(status) = 'new'");
        else if (s === 'validated') sConditions.push("LOWER(status) = 'ongoing'");
        else if (s === 'triaged') sConditions.push("LOWER(status) = 'monitoring'");
        else if (s === 'dismissed') sConditions.push("LOWER(status) = 'closed'");
        else sConditions.push(`LOWER(status) = '${s.replace(/'/g, "''")}'`);
      }
      if (sConditions.length > 0) {
        whereClauses.push(`(${sConditions.join(' OR ')})`);
      }
    }

    if (country) {
      whereClauses.push(`LOWER(country) LIKE '%${country.toLowerCase().replace(/'/g, "''")}%'`);
    }

    if (disease) {
      whereClauses.push(`LOWER(disease) LIKE '%${disease.toLowerCase().replace(/'/g, "''")}%'`);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const sql = `
      SELECT id, event_id, country, disease, grade, event_type, status, report_date, year, description, cases, deaths, latitude, longitude, created_at, updated_at
      FROM who_events
      ${whereSql}
      ORDER BY id DESC
      LIMIT ${limit};
    `;

    const rows = await queryNeon(sql);
    const signals = rows.map(mapWhoEventToSignal);

    res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate=59');
    return res.status(200).json(signals);
  } catch (err: any) {
    console.error('API signals error:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch signals' });
  }
}
