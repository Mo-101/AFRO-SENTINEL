// =====================================================
// AFRO SENTINEL WATCHTOWER - Constants & Types
// =====================================================

export const PRIORITIES = {
  P1: { label: 'Critical', color: 'priority-p1', description: 'Immediate threat - requires urgent attention' },
  P2: { label: 'High', color: 'priority-p2', description: 'Significant threat - respond within hours' },
  P3: { label: 'Medium', color: 'priority-p3', description: 'Moderate concern - monitor closely' },
  P4: { label: 'Low', color: 'priority-p4', description: 'Low concern - routine monitoring' },
} as const;

export const SOURCE_TIERS = {
  tier_1: { label: 'TIER 1', description: 'Official & Institutional', color: 'tier-1', examples: ['WHO', 'Africa CDC', 'ProMED', 'National Health Ministries'] },
  tier_2: { label: 'TIER 2', description: 'Media & News', color: 'tier-2', examples: ['Reuters', 'BBC', 'Al Jazeera', 'AllAfrica'] },
  tier_3: { label: 'TIER 3', description: 'Community & Social', color: 'tier-3', examples: ['X/Twitter', 'Facebook', 'WhatsApp', 'Community Radio'] },
} as const;

export const DISEASE_CATEGORIES = {
  vhf: { label: 'Viral Hemorrhagic Fever', icon: '🩸', color: 'destructive' },
  respiratory: { label: 'Respiratory', icon: '🫁', color: 'primary' },
  enteric: { label: 'Enteric/Diarrheal', icon: '💧', color: 'accent' },
  vector_borne: { label: 'Vector-Borne', icon: '🦟', color: 'sunset' },
  zoonotic: { label: 'Zoonotic', icon: '🦇', color: 'terracotta' },
  vaccine_preventable: { label: 'Vaccine-Preventable', icon: '💉', color: 'savanna' },
  environmental: { label: 'Environmental', icon: '🌍', color: 'sahara' },
  unknown: { label: 'Unknown/Other', icon: '❓', color: 'muted' },
} as const;

export const SIGNAL_STATUSES = {
  new: { label: 'New', description: 'Freshly ingested, awaiting triage' },
  triaged: { label: 'Triaged', description: 'Initial assessment complete' },
  validated: { label: 'Validated', description: 'Confirmed and verified' },
  dismissed: { label: 'Dismissed', description: 'False positive or irrelevant' },
} as const;

// African Countries with ISO-3 codes for map integration
export const AFRO_COUNTRIES = [
  { code: 'AGO', name: 'Angola', region: 'Southern', lat: -11.2027, lng: 17.8739 },
  { code: 'BEN', name: 'Benin', region: 'West', lat: 9.3077, lng: 2.3158 },
  { code: 'BWA', name: 'Botswana', region: 'Southern', lat: -22.3285, lng: 24.6849 },
  { code: 'BFA', name: 'Burkina Faso', region: 'West', lat: 12.2383, lng: -1.5616 },
  { code: 'BDI', name: 'Burundi', region: 'East', lat: -3.3731, lng: 29.9189 },
  { code: 'CPV', name: 'Cabo Verde', region: 'West', lat: 16.5388, lng: -23.0418 },
  { code: 'CMR', name: 'Cameroon', region: 'Central', lat: 7.3697, lng: 12.3547 },
  { code: 'CAF', name: 'Central African Republic', region: 'Central', lat: 6.6111, lng: 20.9394 },
  { code: 'TCD', name: 'Chad', region: 'Central', lat: 15.4542, lng: 18.7322 },
  { code: 'COM', name: 'Comoros', region: 'East', lat: -11.6455, lng: 43.3333 },
  { code: 'COG', name: 'Congo', region: 'Central', lat: -0.228, lng: 15.8277 },
  { code: 'CIV', name: "Côte d'Ivoire", region: 'West', lat: 7.54, lng: -5.5471 },
  { code: 'COD', name: 'DR Congo', region: 'Central', lat: -4.0383, lng: 21.7587 },
  { code: 'DJI', name: 'Djibouti', region: 'East', lat: 11.8251, lng: 42.5903 },
  { code: 'EGY', name: 'Egypt', region: 'North', lat: 26.8206, lng: 30.8025 },
  { code: 'GNQ', name: 'Equatorial Guinea', region: 'Central', lat: 1.6508, lng: 10.2679 },
  { code: 'ERI', name: 'Eritrea', region: 'East', lat: 15.1794, lng: 39.7823 },
  { code: 'SWZ', name: 'Eswatini', region: 'Southern', lat: -26.5225, lng: 31.4659 },
  { code: 'ETH', name: 'Ethiopia', region: 'East', lat: 9.145, lng: 40.4897 },
  { code: 'GAB', name: 'Gabon', region: 'Central', lat: -0.8037, lng: 11.6094 },
  { code: 'GMB', name: 'Gambia', region: 'West', lat: 13.4432, lng: -15.3101 },
  { code: 'GHA', name: 'Ghana', region: 'West', lat: 7.9465, lng: -1.0232 },
  { code: 'GIN', name: 'Guinea', region: 'West', lat: 9.9456, lng: -9.6966 },
  { code: 'GNB', name: 'Guinea-Bissau', region: 'West', lat: 11.8037, lng: -15.1804 },
  { code: 'KEN', name: 'Kenya', region: 'East', lat: -0.0236, lng: 37.9062 },
  { code: 'LSO', name: 'Lesotho', region: 'Southern', lat: -29.61, lng: 28.2336 },
  { code: 'LBR', name: 'Liberia', region: 'West', lat: 6.4281, lng: -9.4295 },
  { code: 'LBY', name: 'Libya', region: 'North', lat: 26.3351, lng: 17.2283 },
  { code: 'MDG', name: 'Madagascar', region: 'East', lat: -18.7669, lng: 46.8691 },
  { code: 'MWI', name: 'Malawi', region: 'Southern', lat: -13.2543, lng: 34.3015 },
  { code: 'MLI', name: 'Mali', region: 'West', lat: 17.5707, lng: -3.9962 },
  { code: 'MRT', name: 'Mauritania', region: 'West', lat: 21.0079, lng: -10.9408 },
  { code: 'MUS', name: 'Mauritius', region: 'East', lat: -20.3484, lng: 57.5522 },
  { code: 'MAR', name: 'Morocco', region: 'North', lat: 31.7917, lng: -7.0926 },
  { code: 'MOZ', name: 'Mozambique', region: 'Southern', lat: -18.6657, lng: 35.5296 },
  { code: 'NAM', name: 'Namibia', region: 'Southern', lat: -22.9576, lng: 18.4904 },
  { code: 'NER', name: 'Niger', region: 'West', lat: 17.6078, lng: 8.0817 },
  { code: 'NGA', name: 'Nigeria', region: 'West', lat: 9.082, lng: 8.6753 },
  { code: 'RWA', name: 'Rwanda', region: 'East', lat: -1.9403, lng: 29.8739 },
  { code: 'STP', name: 'Sao Tome and Principe', region: 'Central', lat: 0.1864, lng: 6.6131 },
  { code: 'SEN', name: 'Senegal', region: 'West', lat: 14.4974, lng: -14.4524 },
  { code: 'SYC', name: 'Seychelles', region: 'East', lat: -4.6796, lng: 55.492 },
  { code: 'SLE', name: 'Sierra Leone', region: 'West', lat: 8.4606, lng: -11.7799 },
  { code: 'SOM', name: 'Somalia', region: 'East', lat: 5.1521, lng: 46.1996 },
  { code: 'ZAF', name: 'South Africa', region: 'Southern', lat: -30.5595, lng: 22.9375 },
  { code: 'SSD', name: 'South Sudan', region: 'East', lat: 6.877, lng: 31.307 },
  { code: 'SDN', name: 'Sudan', region: 'North', lat: 12.8628, lng: 30.2176 },
  { code: 'TZA', name: 'Tanzania', region: 'East', lat: -6.369, lng: 34.8888 },
  { code: 'TGO', name: 'Togo', region: 'West', lat: 8.6195, lng: 0.8248 },
  { code: 'TUN', name: 'Tunisia', region: 'North', lat: 33.8869, lng: 9.5375 },
  { code: 'UGA', name: 'Uganda', region: 'East', lat: 1.3733, lng: 32.2903 },
  { code: 'ZMB', name: 'Zambia', region: 'Southern', lat: -13.1339, lng: 27.8493 },
  { code: 'ZWE', name: 'Zimbabwe', region: 'Southern', lat: -19.0154, lng: 29.1549 },
  { code: 'DZA', name: 'Algeria', region: 'North', lat: 28.0339, lng: 1.6596 },
] as const;

// WHO AFRO Disease Registry
export const AFRO_DISEASES = [
  { code: 'A00', name: 'Cholera', syndrome: 'AWD', category: 'enteric' as const },
  { code: 'A01', name: 'Typhoid fever', syndrome: 'Febrile', category: 'enteric' as const },
  { code: 'A20', name: 'Plague', syndrome: 'Febrile', category: 'zoonotic' as const },
  { code: 'A80', name: 'Polio', syndrome: 'AFP', category: 'vaccine_preventable' as const },
  { code: 'A90', name: 'Dengue', syndrome: 'Febrile', category: 'vector_borne' as const },
  { code: 'A92', name: 'Yellow fever', syndrome: 'Febrile', category: 'vhf' as const },
  { code: 'B50', name: 'Malaria', syndrome: 'Febrile', category: 'vector_borne' as const },
  { code: 'B05', name: 'Measles', syndrome: 'Rash', category: 'vaccine_preventable' as const },
  { code: 'A98', name: 'Viral hemorrhagic fevers', syndrome: 'Hemorrhagic', category: 'vhf' as const },
  { code: 'A99', name: 'Ebola/Marburg', syndrome: 'Hemorrhagic', category: 'vhf' as const },
  { code: 'U07', name: 'COVID-19', syndrome: 'Respiratory', category: 'respiratory' as const },
  { code: 'A82', name: 'Rabies', syndrome: 'Neurological', category: 'zoonotic' as const },
  { code: 'A39', name: 'Meningococcal disease', syndrome: 'Neurological', category: 'vaccine_preventable' as const },
  { code: 'A96', name: 'Lassa fever', syndrome: 'Hemorrhagic', category: 'vhf' as const },
  { code: 'MPOX', name: 'Mpox', syndrome: 'Rash', category: 'zoonotic' as const },
] as const;

// API Sources Registry
export interface ApiSource {
  source_id: string;
  source_name: string;
  status: 'active' | 'inactive';
  base_url: string;
  documentation_url?: string;
  source_type: string;
  category: string;
  coverage: string;
  priority: number;
  auth_type: string;
  data_format: string;
}

export const API_SOURCES: ApiSource[] = [
  {
    source_id: 'GDELT-V2',
    source_name: 'GDELT Project 2.0 Doc API',
    status: 'active',
    base_url: 'https://api.gdeltproject.org/api/v2/doc/doc',
    documentation_url: 'https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/',
    source_type: 'Aggregator',
    category: 'News_Aggregator',
    coverage: 'Global',
    priority: 1,
    auth_type: 'None',
    data_format: 'JSON',
  },
  {
    source_id: 'RELIEF-WEB',
    source_name: 'ReliefWeb API (UN OCHA)',
    status: 'active',
    base_url: 'https://api.reliefweb.int/v1/reports',
    documentation_url: 'https://reliefweb.int/help/api',
    source_type: 'Official',
    category: 'Humanitarian',
    coverage: 'Global',
    priority: 1,
    auth_type: 'None',
    data_format: 'JSON',
  },
  {
    source_id: 'WHO-AFRO-OFFICIAL',
    source_name: 'WHO AFRO Weekly Bulletins',
    status: 'active',
    base_url: 'https://apps.who.int/iris/rest/items',
    source_type: 'Official',
    category: 'Official',
    coverage: 'Regional',
    priority: 2,
    auth_type: 'None',
    data_format: 'XML',
  },
  {
    source_id: 'AFRICA-CDC-FEED',
    source_name: 'Africa CDC News Feed',
    status: 'active',
    base_url: 'https://africacdc.org/feed/',
    source_type: 'Official',
    category: 'Official',
    coverage: 'Regional',
    priority: 2,
    auth_type: 'None',
    data_format: 'RSS',
  },
  {
    source_id: 'NICD-SA',
    source_name: 'South Africa NICD Alerts',
    status: 'active',
    base_url: 'https://www.nicd.ac.za/feed/',
    source_type: 'Official',
    category: 'Official',
    coverage: 'National',
    priority: 2,
    auth_type: 'None',
    data_format: 'RSS',
  },
  {
    source_id: 'ALLAFRICA-HEALTH',
    source_name: 'AllAfrica Health Headlines',
    status: 'active',
    base_url: 'https://allafrica.com/tools/headlines/v2/xml/os/categories/health.xml',
    source_type: 'Aggregator',
    category: 'News_Aggregator',
    coverage: 'Regional',
    priority: 3,
    auth_type: 'None',
    data_format: 'XML',
  },
  {
    source_id: 'PROMED-MAIL',
    source_name: 'ProMED-mail',
    status: 'active',
    base_url: 'https://promedmail.org',
    source_type: 'Official',
    category: 'Surveillance',
    coverage: 'Global',
    priority: 1,
    auth_type: 'None',
    data_format: 'RSS',
  },
  {
    source_id: 'RADIO-BROWSER',
    source_name: 'Radio Browser API',
    status: 'inactive',
    base_url: 'https://de1.api.radio-browser.info/json/stations/search',
    documentation_url: 'https://api.radio-browser.info/',
    source_type: 'Aggregator',
    category: 'Traditional_Media',
    coverage: 'Global',
    priority: 4,
    auth_type: 'None',
    data_format: 'JSON',
  },
];

// Mapbox token (publishable - safe for client-side)
export const MAPBOX_TOKEN = 'pk.eyJ1IjoiYWthbmltbzEiLCJhIjoiY2x4czNxbjU2MWM2eTJqc2gwNGIwaWhkMSJ9.jSwZdyaPa1dOHepNU5P71g';

// WHO Data source
export const WHO_DATA_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS-8N_ALP4IX8k7sFPRzdeALWNNeYpOMmGpbVC3V-nfAyvHsa0ZB6I2YFgONi4McA';

export type Priority = keyof typeof PRIORITIES;
export type SourceTier = keyof typeof SOURCE_TIERS;
export type DiseaseCategory = keyof typeof DISEASE_CATEGORIES;
export type SignalStatus = keyof typeof SIGNAL_STATUSES;
