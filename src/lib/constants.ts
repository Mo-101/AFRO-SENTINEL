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

export const AFRICAN_COUNTRIES = [
  { name: 'Algeria', iso: 'DZ', lat: 28.0339, lng: 1.6596 },
  { name: 'Angola', iso: 'AO', lat: -11.2027, lng: 17.8739 },
  { name: 'Benin', iso: 'BJ', lat: 9.3077, lng: 2.3158 },
  { name: 'Botswana', iso: 'BW', lat: -22.3285, lng: 24.6849 },
  { name: 'Burkina Faso', iso: 'BF', lat: 12.2383, lng: -1.5616 },
  { name: 'Burundi', iso: 'BI', lat: -3.3731, lng: 29.9189 },
  { name: 'Cameroon', iso: 'CM', lat: 7.3697, lng: 12.3547 },
  { name: 'Cape Verde', iso: 'CV', lat: 16.5388, lng: -23.0418 },
  { name: 'Central African Republic', iso: 'CF', lat: 6.6111, lng: 20.9394 },
  { name: 'Chad', iso: 'TD', lat: 15.4542, lng: 18.7322 },
  { name: 'Comoros', iso: 'KM', lat: -11.6455, lng: 43.3333 },
  { name: 'Congo', iso: 'CG', lat: -0.228, lng: 15.8277 },
  { name: 'DRC', iso: 'CD', lat: -4.0383, lng: 21.7587 },
  { name: 'Djibouti', iso: 'DJ', lat: 11.8251, lng: 42.5903 },
  { name: 'Egypt', iso: 'EG', lat: 26.8206, lng: 30.8025 },
  { name: 'Equatorial Guinea', iso: 'GQ', lat: 1.6508, lng: 10.2679 },
  { name: 'Eritrea', iso: 'ER', lat: 15.1794, lng: 39.7823 },
  { name: 'Eswatini', iso: 'SZ', lat: -26.5225, lng: 31.4659 },
  { name: 'Ethiopia', iso: 'ET', lat: 9.145, lng: 40.4897 },
  { name: 'Gabon', iso: 'GA', lat: -0.8037, lng: 11.6094 },
  { name: 'Gambia', iso: 'GM', lat: 13.4432, lng: -15.3101 },
  { name: 'Ghana', iso: 'GH', lat: 7.9465, lng: -1.0232 },
  { name: 'Guinea', iso: 'GN', lat: 9.9456, lng: -9.6966 },
  { name: 'Guinea-Bissau', iso: 'GW', lat: 11.8037, lng: -15.1804 },
  { name: 'Ivory Coast', iso: 'CI', lat: 7.54, lng: -5.5471 },
  { name: 'Kenya', iso: 'KE', lat: -0.0236, lng: 37.9062 },
  { name: 'Lesotho', iso: 'LS', lat: -29.61, lng: 28.2336 },
  { name: 'Liberia', iso: 'LR', lat: 6.4281, lng: -9.4295 },
  { name: 'Libya', iso: 'LY', lat: 26.3351, lng: 17.2283 },
  { name: 'Madagascar', iso: 'MG', lat: -18.7669, lng: 46.8691 },
  { name: 'Malawi', iso: 'MW', lat: -13.2543, lng: 34.3015 },
  { name: 'Mali', iso: 'ML', lat: 17.5707, lng: -3.9962 },
  { name: 'Mauritania', iso: 'MR', lat: 21.0079, lng: -10.9408 },
  { name: 'Mauritius', iso: 'MU', lat: -20.3484, lng: 57.5522 },
  { name: 'Morocco', iso: 'MA', lat: 31.7917, lng: -7.0926 },
  { name: 'Mozambique', iso: 'MZ', lat: -18.6657, lng: 35.5296 },
  { name: 'Namibia', iso: 'NA', lat: -22.9576, lng: 18.4904 },
  { name: 'Niger', iso: 'NE', lat: 17.6078, lng: 8.0817 },
  { name: 'Nigeria', iso: 'NG', lat: 9.082, lng: 8.6753 },
  { name: 'Rwanda', iso: 'RW', lat: -1.9403, lng: 29.8739 },
  { name: 'São Tomé and Príncipe', iso: 'ST', lat: 0.1864, lng: 6.6131 },
  { name: 'Senegal', iso: 'SN', lat: 14.4974, lng: -14.4524 },
  { name: 'Seychelles', iso: 'SC', lat: -4.6796, lng: 55.492 },
  { name: 'Sierra Leone', iso: 'SL', lat: 8.4606, lng: -11.7799 },
  { name: 'Somalia', iso: 'SO', lat: 5.1521, lng: 46.1996 },
  { name: 'South Africa', iso: 'ZA', lat: -30.5595, lng: 22.9375 },
  { name: 'South Sudan', iso: 'SS', lat: 6.877, lng: 31.307 },
  { name: 'Sudan', iso: 'SD', lat: 12.8628, lng: 30.2176 },
  { name: 'Tanzania', iso: 'TZ', lat: -6.369, lng: 34.8888 },
  { name: 'Togo', iso: 'TG', lat: 8.6195, lng: 0.8248 },
  { name: 'Tunisia', iso: 'TN', lat: 33.8869, lng: 9.5375 },
  { name: 'Uganda', iso: 'UG', lat: 1.3733, lng: 32.2903 },
  { name: 'Zambia', iso: 'ZM', lat: -13.1339, lng: 27.8493 },
  { name: 'Zimbabwe', iso: 'ZW', lat: -19.0154, lng: 29.1549 },
] as const;

// Mapbox token (publishable - safe for client-side)
export const MAPBOX_TOKEN = 'pk.eyJ1IjoiYWthbmltbzEiLCJhIjoiY2x4czNxbjU2MWM2eTJqc2gwNGIwaWhkMSJ9.jSwZdyaPa1dOHepNU5P71g';

// WHO Data source
export const WHO_DATA_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS-8N_ALP4IX8k7sFPRzdeALWNNeYpOMmGpbVC3V-nfAyvHsa0ZB6I2YFgONi4McA';

export type Priority = keyof typeof PRIORITIES;
export type SourceTier = keyof typeof SOURCE_TIERS;
export type DiseaseCategory = keyof typeof DISEASE_CATEGORIES;
export type SignalStatus = keyof typeof SIGNAL_STATUSES;
