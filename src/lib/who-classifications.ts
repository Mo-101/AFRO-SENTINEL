// =====================================================
// WHO Emergency Classification System
// Based on WHO Emergency Response Framework (ERF) 2.1
// =====================================================

export const WHO_EMERGENCY_GRADES = [
  {
    grade: 'ungraded',
    label: 'Ungraded',
    description: 'Monitored but no operational response required',
    color: 'bg-muted text-muted-foreground',
    badgeColor: 'bg-slate-100 text-slate-600 border-slate-200',
  },
  {
    grade: 'grade_1',
    label: 'Grade 1',
    description: 'Limited response - manageable with in-country assets',
    color: 'bg-emerald-50 text-emerald-700',
    badgeColor: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  },
  {
    grade: 'grade_2',
    label: 'Grade 2',
    description: 'Moderate response - exceeds country office capacity',
    color: 'bg-amber-50 text-amber-700',
    badgeColor: 'bg-amber-100 text-amber-700 border-amber-200',
  },
  {
    grade: 'grade_3',
    label: 'Grade 3',
    description: 'Major response - Organization-wide mobilization',
    color: 'bg-rose-50 text-rose-700',
    badgeColor: 'bg-rose-100 text-rose-700 border-rose-200',
  },
] as const;

export const EMERGENCY_TYPES = [
  {
    type: 'acute',
    label: 'Acute',
    description: 'Newly occurring emergency (< 6 months)',
    icon: '⚡',
  },
  {
    type: 'protracted',
    label: 'Protracted',
    description: 'Sustained emergency (> 6 months)',
    icon: '🔄',
  },
] as const;

export const PROTECTION_LEVELS = [
  {
    level: 1,
    label: 'Level 1',
    description: 'Minimal protection concerns',
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  },
  {
    level: 2,
    label: 'Level 2',
    description: 'Moderate protection issues',
    color: 'bg-amber-100 text-amber-700 border-amber-200',
  },
  {
    level: 3,
    label: 'Level 3',
    description: 'Severe protection crisis',
    color: 'bg-rose-100 text-rose-700 border-rose-200',
  },
] as const;

export const AFRO_REGIONS = [
  { id: 'north', label: 'North Africa', countries: ['DZA', 'EGY', 'LBY', 'MAR', 'TUN', 'SDN'] },
  { id: 'west', label: 'West Africa', countries: ['BEN', 'BFA', 'CPV', 'CIV', 'GMB', 'GHA', 'GIN', 'GNB', 'LBR', 'MLI', 'MRT', 'NER', 'NGA', 'SEN', 'SLE', 'TGO'] },
  { id: 'central', label: 'Central Africa', countries: ['CMR', 'CAF', 'TCD', 'COG', 'COD', 'GNQ', 'GAB', 'STP'] },
  { id: 'east', label: 'East Africa', countries: ['BDI', 'COM', 'DJI', 'ERI', 'ETH', 'KEN', 'MDG', 'MUS', 'RWA', 'SYC', 'SOM', 'SSD', 'TZA', 'UGA'] },
  { id: 'southern', label: 'Southern Africa', countries: ['AGO', 'BWA', 'SWZ', 'LSO', 'MWI', 'MOZ', 'NAM', 'ZAF', 'ZMB', 'ZWE'] },
] as const;

export type WHOGrade = typeof WHO_EMERGENCY_GRADES[number]['grade'];
export type EmergencyType = typeof EMERGENCY_TYPES[number]['type'];
export type ProtectionLevel = typeof PROTECTION_LEVELS[number]['level'];
export type AfroRegionId = typeof AFRO_REGIONS[number]['id'];
