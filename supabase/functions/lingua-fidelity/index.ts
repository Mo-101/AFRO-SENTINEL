import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// =====================================================
// LINGUA FIDELITY ENGINE (Layer 2E)
// Hausa, Yoruba, Swahili Keyword Detection + Trust Scoring
// =====================================================

// African Language Metadata with Primary Countries
const AFRICAN_LANGUAGES: Record<string, {
  name: string;
  primaryCountries: string[];  // ISO3 codes
  script: string;
  family: string;
  speakers: number; // millions
}> = {
  'ha': { 
    name: 'Hausa', 
    primaryCountries: ['NGA', 'NER', 'GHA', 'CMR', 'TCD', 'BFA'],
    script: 'latin',
    family: 'Afro-Asiatic',
    speakers: 80
  },
  'yo': { 
    name: 'Yoruba', 
    primaryCountries: ['NGA', 'BEN', 'TGO'],
    script: 'latin',
    family: 'Niger-Congo',
    speakers: 45
  },
  'sw': { 
    name: 'Swahili', 
    primaryCountries: ['TZA', 'KEN', 'UGA', 'RWA', 'BDI', 'COD', 'MOZ', 'COM'],
    script: 'latin',
    family: 'Bantu',
    speakers: 100
  },
  'ig': { 
    name: 'Igbo', 
    primaryCountries: ['NGA'],
    script: 'latin',
    family: 'Niger-Congo',
    speakers: 45
  },
  'am': { 
    name: 'Amharic', 
    primaryCountries: ['ETH'],
    script: 'ge_ez',
    family: 'Semitic',
    speakers: 32
  },
  'om': { 
    name: 'Oromo', 
    primaryCountries: ['ETH', 'KEN'],
    script: 'latin',
    family: 'Cushitic',
    speakers: 40
  },
  'so': { 
    name: 'Somali', 
    primaryCountries: ['SOM', 'ETH', 'KEN', 'DJI'],
    script: 'latin',
    family: 'Cushitic',
    speakers: 20
  },
  'zu': { 
    name: 'Zulu', 
    primaryCountries: ['ZAF', 'SWZ', 'LSO'],
    script: 'latin',
    family: 'Nguni',
    speakers: 12
  },
  'xh': { 
    name: 'Xhosa', 
    primaryCountries: ['ZAF'],
    script: 'latin',
    family: 'Nguni',
    speakers: 8
  },
  'rw': { 
    name: 'Kinyarwanda', 
    primaryCountries: ['RWA', 'COD', 'UGA'],
    script: 'latin',
    family: 'Bantu',
    speakers: 12
  },
  'sn': { 
    name: 'Shona', 
    primaryCountries: ['ZWE', 'MOZ'],
    script: 'latin',
    family: 'Bantu',
    speakers: 15
  },
  'wo': { 
    name: 'Wolof', 
    primaryCountries: ['SEN', 'GMB', 'MRT'],
    script: 'latin',
    family: 'Niger-Congo',
    speakers: 10
  },
  'ff': { 
    name: 'Fulfulde/Fula', 
    primaryCountries: ['NGA', 'NER', 'SEN', 'GIN', 'CMR', 'MLI', 'BFA', 'MRT'],
    script: 'latin',
    family: 'Niger-Congo',
    speakers: 40
  },
  'ln': { 
    name: 'Lingala', 
    primaryCountries: ['COD', 'COG', 'CAF', 'AGO'],
    script: 'latin',
    family: 'Bantu',
    speakers: 25
  },
  'kg': { 
    name: 'Kikongo', 
    primaryCountries: ['COD', 'COG', 'AGO'],
    script: 'latin',
    family: 'Bantu',
    speakers: 10
  },
  'ti': { 
    name: 'Tigrinya', 
    primaryCountries: ['ERI', 'ETH'],
    script: 'ge_ez',
    family: 'Semitic',
    speakers: 9
  },
  'tw': { 
    name: 'Twi/Akan', 
    primaryCountries: ['GHA', 'CIV'],
    script: 'latin',
    family: 'Niger-Congo',
    speakers: 20
  },
  'mg': { 
    name: 'Malagasy', 
    primaryCountries: ['MDG'],
    script: 'latin',
    family: 'Austronesian',
    speakers: 25
  },
  'ny': { 
    name: 'Chichewa', 
    primaryCountries: ['MWI', 'ZMB', 'MOZ', 'ZWE'],
    script: 'latin',
    family: 'Bantu',
    speakers: 14
  },
  'ar': { 
    name: 'Arabic', 
    primaryCountries: ['DZA', 'MAR', 'TUN', 'LBY', 'SDN', 'MRT', 'TCD'],
    script: 'arabic',
    family: 'Semitic',
    speakers: 150
  },
  'fr': { 
    name: 'French', 
    primaryCountries: ['SEN', 'CIV', 'MLI', 'BFA', 'NER', 'TCD', 'CMR', 'COD', 'COG', 'GAB', 'CAF', 'TGO', 'BEN', 'GIN', 'RWA', 'BDI', 'DJI'],
    script: 'latin',
    family: 'Romance',
    speakers: 100
  },
  'pt': { 
    name: 'Portuguese', 
    primaryCountries: ['AGO', 'MOZ', 'GNB', 'CPV', 'STP'],
    script: 'latin',
    family: 'Romance',
    speakers: 30
  },
  'en': { 
    name: 'English', 
    primaryCountries: ['NGA', 'GHA', 'KEN', 'TZA', 'UGA', 'ZAF', 'ZMB', 'ZWE', 'MWI', 'BWA', 'SLE', 'LBR', 'GMB'],
    script: 'latin',
    family: 'Germanic',
    speakers: 200
  },
};

// Disease Keywords in African Languages (Hausa, Yoruba, Swahili)
const DISEASE_KEYWORDS_MULTILINGUAL: Record<string, {
  disease: string;
  category: string;
  priority: string;
  keywords: {
    en: string[];
    ha: string[];  // Hausa
    yo: string[];  // Yoruba
    sw: string[];  // Swahili
    fr: string[];  // French (widely used)
    ar: string[];  // Arabic
  };
}> = {
  'cholera': {
    disease: 'Cholera',
    category: 'enteric',
    priority: 'P1',
    keywords: {
      en: ['cholera', 'watery diarrhea', 'acute diarrhea', 'awd', 'dehydration'],
      ha: ['zawo', 'ciwon hanji', 'gudawa', 'rashin ruwa jiki', 'zawo ruwa', 'hauka hanji'],
      yo: ['gbuuru', 'igbe gbuuru', 'àìsàn gbuuru', 'omi ara', 'àrùn gbuuru olomi'],
      sw: ['kipindupindu', 'kuhara maji', 'kuharisha', 'kichaa cha maji', 'ugonjwa wa kuendesha'],
      fr: ['choléra', 'diarrhée aqueuse', 'déshydratation'],
      ar: ['كوليرا', 'إسهال', 'جفاف']
    }
  },
  'ebola': {
    disease: 'Ebola',
    category: 'vhf',
    priority: 'P1',
    keywords: {
      en: ['ebola', 'hemorrhagic fever', 'bleeding', 'evd', 'ebola virus'],
      ha: ['ebola', 'zazzabin zubar jini', 'cutar zubar jini', 'annoba ebola'],
      yo: ['ebola', 'ibà ẹjẹ', 'àrùn ẹjẹ sísàn', 'àìsàn ebola'],
      sw: ['ebola', 'homa ya kutoka damu', 'ugonjwa wa ebola', 'kuumwa na damu'],
      fr: ['ebola', 'fièvre hémorragique', 'saignement'],
      ar: ['إيبولا', 'حمى نزفية', 'نزيف']
    }
  },
  'marburg': {
    disease: 'Marburg',
    category: 'vhf',
    priority: 'P1',
    keywords: {
      en: ['marburg', 'marburg virus', 'hemorrhagic', 'mvd'],
      ha: ['marburg', 'cutar marburg', 'zazzabin zubar jini'],
      yo: ['marburg', 'àrùn marburg'],
      sw: ['marburg', 'homa ya kutoka damu', 'virusi ya marburg'],
      fr: ['marburg', 'virus de marburg', 'fièvre hémorragique'],
      ar: ['ماربورغ', 'فيروس ماربورغ']
    }
  },
  'lassa': {
    disease: 'Lassa Fever',
    category: 'vhf',
    priority: 'P1',
    keywords: {
      en: ['lassa', 'lassa fever', 'rodent fever', 'hemorrhagic'],
      ha: ['zazzabin lassa', 'cutar lassa', 'lassa', 'zazzabin bera'],
      yo: ['ibà lassa', 'àrùn lassa', 'ibà eku'],
      sw: ['homa ya lassa', 'lassa'],
      fr: ['fièvre de lassa', 'lassa'],
      ar: ['حمى لاسا', 'لاسا']
    }
  },
  'measles': {
    disease: 'Measles',
    category: 'vaccine_preventable',
    priority: 'P2',
    keywords: {
      en: ['measles', 'rubeola', 'rash', 'koplik spots'],
      ha: ['kyanda', 'cutar kyanda', 'jan fata'],
      yo: ['igbonwo', 'àrùn igbonwo', 'ojú iwà'],
      sw: ['surua', 'chokaa', 'upele'],
      fr: ['rougeole', 'éruption cutanée'],
      ar: ['حصبة', 'طفح جلدي']
    }
  },
  'meningitis': {
    disease: 'Meningococcal disease',
    category: 'vaccine_preventable',
    priority: 'P1',
    keywords: {
      en: ['meningitis', 'meningococcal', 'stiff neck', 'brain fever'],
      ha: ['sankarau', 'cutar sankarau', 'ciwon kai', 'wuyan taurin'],
      yo: ['àrùn ọpọlọ', 'orí wíwọ', 'àrùn egungun orí'],
      sw: ['homa ya uti wa mgongo', 'meningitis', 'shingo kavu'],
      fr: ['méningite', 'raideur de la nuque'],
      ar: ['التهاب السحايا', 'تصلب الرقبة']
    }
  },
  'malaria': {
    disease: 'Malaria',
    category: 'vector_borne',
    priority: 'P3',
    keywords: {
      en: ['malaria', 'plasmodium', 'mosquito fever'],
      ha: ['zazzabin cizon sauro', 'malariya', 'zazzabi'],
      yo: ['ibà', 'arun efon', 'ibà pọnju'],
      sw: ['malaria', 'homa ya malaria', 'mbu'],
      fr: ['paludisme', 'malaria', 'fièvre'],
      ar: ['ملاريا', 'حمى البرداء']
    }
  },
  'yellow_fever': {
    disease: 'Yellow Fever',
    category: 'vhf',
    priority: 'P1',
    keywords: {
      en: ['yellow fever', 'jaundice', 'flavivirus'],
      ha: ['zazzabin rawaya', 'cutar rawaya', 'fatar rawaya'],
      yo: ['ibà pupa', 'àrùn awọ ofeefee', 'iba ojúlógún'],
      sw: ['homa ya manjano', 'manjano ya ngozi'],
      fr: ['fièvre jaune', 'jaunisse'],
      ar: ['الحمى الصفراء', 'اليرقان']
    }
  },
  'mpox': {
    disease: 'Mpox',
    category: 'zoonotic',
    priority: 'P2',
    keywords: {
      en: ['mpox', 'monkeypox', 'pox', 'clade', 'pustules'],
      ha: ['mpox', 'agana', 'cutar agana', 'kuraje'],
      yo: ['mpox', 'ìyọnu ara', 'àrùn ọbọ'],
      sw: ['mpox', 'ndui ya nyani', 'upele', 'malengelenge'],
      fr: ['mpox', 'variole du singe', 'pustules'],
      ar: ['جدري القردة', 'بثور']
    }
  },
  'dengue': {
    disease: 'Dengue',
    category: 'vector_borne',
    priority: 'P2',
    keywords: {
      en: ['dengue', 'breakbone fever', 'dengue hemorrhagic'],
      ha: ['zazzabin dengue', 'cutar dengue'],
      yo: ['ibà dengue', 'àrùn dengue'],
      sw: ['homa ya dengue', 'dengue'],
      fr: ['dengue', 'fièvre dengue'],
      ar: ['حمى الضنك', 'دنج']
    }
  },
  'typhoid': {
    disease: 'Typhoid fever',
    category: 'enteric',
    priority: 'P2',
    keywords: {
      en: ['typhoid', 'enteric fever', 'salmonella typhi'],
      ha: ['zazzabin typhoid', 'taifo', 'cutar typhoid'],
      yo: ['ibà typhoid', 'taifo', 'àrùn inu'],
      sw: ['homa ya matumbo', 'typhoid', 'taifodi'],
      fr: ['typhoïde', 'fièvre typhoïde'],
      ar: ['حمى التيفوئيد', 'تيفوئيد']
    }
  },
  'polio': {
    disease: 'Polio',
    category: 'vaccine_preventable',
    priority: 'P1',
    keywords: {
      en: ['polio', 'poliomyelitis', 'paralysis', 'afp', 'acute flaccid'],
      ha: ['shan inna', 'polio', 'cutar gurguzu'],
      yo: ['roparose', 'àrùn ẹsẹ rírọ', 'polio'],
      sw: ['polio', 'ugonjwa wa kupooza', 'kupooza'],
      fr: ['polio', 'poliomyélite', 'paralysie'],
      ar: ['شلل الأطفال', 'بوليو']
    }
  },
  'rabies': {
    disease: 'Rabies',
    category: 'zoonotic',
    priority: 'P2',
    keywords: {
      en: ['rabies', 'hydrophobia', 'dog bite', 'mad dog'],
      ha: ['haukan kare', 'cutar kare', 'cizon kare'],
      yo: ['aja wèrè', 'igbẹ aja', 'àrùn aja'],
      sw: ['kichaa cha mbwa', 'mbwa mwendawazimu', 'rabies'],
      fr: ['rage', 'hydrophobie', 'morsure de chien'],
      ar: ['داء الكلب', 'سعار', 'عضة كلب']
    }
  },
  'plague': {
    disease: 'Plague',
    category: 'zoonotic',
    priority: 'P1',
    keywords: {
      en: ['plague', 'bubonic', 'pneumonic plague', 'black death'],
      ha: ['annoba', 'cutar annoba', 'ta\'uni'],
      yo: ['àjàkálẹ̀ àrùn', 'àrùn iku'],
      sw: ['tauni', 'pigo', 'ugonjwa wa tauni'],
      fr: ['peste', 'bubonique', 'peste pulmonaire'],
      ar: ['الطاعون', 'طاعون']
    }
  },
  'covid': {
    disease: 'COVID-19',
    category: 'respiratory',
    priority: 'P3',
    keywords: {
      en: ['covid', 'coronavirus', 'sars-cov-2', 'covid-19'],
      ha: ['covid', 'korona', 'cutar korona'],
      yo: ['covid', 'korona', 'àrùn covid'],
      sw: ['covid', 'korona', 'virusi vya korona'],
      fr: ['covid', 'coronavirus', 'covid-19'],
      ar: ['كوفيد', 'كورونا', 'فيروس كورونا']
    }
  },
  'rift_valley_fever': {
    disease: 'Rift Valley Fever',
    category: 'vhf',
    priority: 'P1',
    keywords: {
      en: ['rift valley fever', 'rvf', 'hemorrhagic', 'livestock fever'],
      ha: ['zazzabin rift valley', 'cutar dabbobi'],
      yo: ['ibà rift valley', 'àrùn ẹran'],
      sw: ['homa ya bonde la ufa', 'rvf', 'ugonjwa wa mifugo'],
      fr: ['fièvre de la vallée du rift'],
      ar: ['حمى الوادي المتصدع']
    }
  },
  'anthrax': {
    disease: 'Anthrax',
    category: 'zoonotic',
    priority: 'P1',
    keywords: {
      en: ['anthrax', 'bacillus anthracis', 'woolsorter disease'],
      ha: ['cutar anthrax', 'cizon anthrax'],
      yo: ['àrùn anthrax'],
      sw: ['kimeta', 'ugonjwa wa anthrax'],
      fr: ['anthrax', 'charbon', 'maladie du charbon'],
      ar: ['الجمرة الخبيثة', 'أنثراكس']
    }
  }
};

// Health/Outbreak Alert Keywords in African Languages
const ALERT_KEYWORDS_MULTILINGUAL: Record<string, {
  en: string[];
  ha: string[];
  yo: string[];
  sw: string[];
  fr: string[];
  ar: string[];
}> = {
  outbreak: {
    en: ['outbreak', 'epidemic', 'surge', 'spike', 'cluster', 'emergency'],
    ha: ['annobar', 'cutar da ta yadu', 'gaggawa', 'karuwar masu rashin lafiya'],
    yo: ['àjàkálẹ̀', 'àrùn', 'ìṣẹlẹ̀ àrùn', 'pàjáwìrì'],
    sw: ['mlipuko', 'janga', 'dharura', 'kuenea'],
    fr: ['épidémie', 'flambée', 'urgence', 'foyer'],
    ar: ['تفشي', 'وباء', 'طوارئ']
  },
  death: {
    en: ['death', 'died', 'mortality', 'fatality', 'deceased', 'killed'],
    ha: ['mutuwa', 'ya mutu', 'mace-mace', 'rasuwa'],
    yo: ['ikú', 'ó kú', 'òkú', 'àwọn tó kú'],
    sw: ['kifo', 'alifariki', 'alikufa', 'vifo'],
    fr: ['mort', 'décès', 'décédé', 'mortalité'],
    ar: ['وفاة', 'موت', 'توفي']
  },
  cases: {
    en: ['cases', 'patients', 'infected', 'confirmed', 'suspected', 'positive'],
    ha: ['masu cutar', 'marasa lafiya', 'waɗanda suka kamu', 'tabbataccen'],
    yo: ['àwọn aláìsàn', 'àkóràn', 'tí a fìdí múlẹ̀'],
    sw: ['visa', 'wagonjwa', 'walioambukizwa', 'imethibitishwa'],
    fr: ['cas', 'patients', 'infectés', 'confirmés', 'suspects'],
    ar: ['حالات', 'مرضى', 'مصابين', 'مؤكد']
  },
  hospital: {
    en: ['hospital', 'clinic', 'health center', 'medical', 'treatment'],
    ha: ['asibitin', 'asibiti', 'cibiyar lafiya', 'likita'],
    yo: ['ilé ìwòsàn', 'ilé ìtọjú', 'dókítà'],
    sw: ['hospitali', 'zahanati', 'kituo cha afya', 'daktari'],
    fr: ['hôpital', 'clinique', 'centre de santé', 'médical'],
    ar: ['مستشفى', 'عيادة', 'مركز صحي']
  },
  children: {
    en: ['children', 'child', 'infant', 'baby', 'pediatric', 'under five'],
    ha: ['yara', 'jariri', 'ƴaƴa', 'yaro'],
    yo: ['àwọn ọmọ', 'ọmọ', 'ìkókó', 'ọmọdé'],
    sw: ['watoto', 'mtoto', 'chini ya miaka mitano'],
    fr: ['enfants', 'enfant', 'nourrisson', 'pédiatrique'],
    ar: ['أطفال', 'طفل', 'رضيع']
  }
};

// Language Detection Patterns
const LANGUAGE_PATTERNS: Record<string, {
  uniqueChars?: RegExp;
  commonWords: string[];
  script: string;
}> = {
  'ha': {
    uniqueChars: /[ɓɗƙƴ]/i,
    commonWords: ['da', 'na', 'ne', 'ce', 'ba', 'ya', 'ta', 'wa', 'an', 'su', 'ko', 'amma', 'wannan', 'wanda', 'domin', 'saboda', 'sannan', 'kuma', 'kafin', 'bayan'],
    script: 'latin'
  },
  'yo': {
    uniqueChars: /[ẹọṣ]/i,
    commonWords: ['ti', 'ni', 'ó', 'àti', 'pẹ̀lú', 'sí', 'kí', 'náà', 'wọn', 'àwọn', 'kan', 'jẹ́', 'yìí', 'nínú', 'láti', 'bí', 'gbogbo', 'àkọ́kọ́'],
    script: 'latin'
  },
  'sw': {
    commonWords: ['na', 'ya', 'wa', 'kwa', 'ni', 'la', 'au', 'za', 'katika', 'kutoka', 'kwamba', 'hii', 'hiyo', 'watu', 'kama', 'baada', 'kabla', 'sasa', 'zaidi', 'wengi'],
    script: 'latin'
  },
  'am': {
    uniqueChars: /[\u1200-\u137F]/,  // Ge'ez script
    commonWords: [],
    script: 'ge_ez'
  },
  'ar': {
    uniqueChars: /[\u0600-\u06FF]/,  // Arabic script
    commonWords: [],
    script: 'arabic'
  }
};

interface LinguaFidelityResult {
  detected_language: string;
  language_name: string;
  script: string;
  language_family: string;
  confidence: number;
  is_african_language: boolean;
  local_voice: boolean;
  
  // Trust Scoring
  language_location_trust_score: number;
  trust_factors: {
    language_match: boolean;
    regional_consistency: boolean;
    keyword_authenticity: number;
    source_tier_weight: number;
  };
  
  // Disease Detection
  detected_diseases: {
    disease: string;
    category: string;
    priority: string;
    matched_keywords: string[];
    language: string;
  }[];
  
  // Alert Indicators
  alert_indicators: {
    type: string;
    matched_keywords: string[];
    language: string;
  }[];
  
  // Translation
  translation?: string;
  translation_confidence?: number;
  cultural_notes?: string;
  
  // Metadata
  processing_time_ms: number;
}

// Detect language from text
function detectLanguage(text: string): { code: string; confidence: number } {
  const lowerText = text.toLowerCase();
  const scores: Record<string, number> = {};
  
  // Check for unique script characters first (highest confidence)
  for (const [langCode, patterns] of Object.entries(LANGUAGE_PATTERNS)) {
    if (patterns.uniqueChars && patterns.uniqueChars.test(text)) {
      return { code: langCode, confidence: 95 };
    }
  }
  
  // Count common words for each language
  for (const [langCode, patterns] of Object.entries(LANGUAGE_PATTERNS)) {
    let matches = 0;
    for (const word of patterns.commonWords) {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const count = (lowerText.match(regex) || []).length;
      matches += count;
    }
    scores[langCode] = matches;
  }
  
  // Find best match
  let bestLang = 'en';
  let bestScore = 0;
  for (const [lang, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      bestLang = lang;
    }
  }
  
  // Calculate confidence based on match density
  const wordCount = text.split(/\s+/).length;
  const confidence = Math.min(90, Math.round((bestScore / wordCount) * 100) + 40);
  
  if (bestScore < 2) {
    return { code: 'en', confidence: 50 };  // Default to English with low confidence
  }
  
  return { code: bestLang, confidence };
}

// Detect diseases in text using multilingual keywords
function detectDiseases(text: string): {
  disease: string;
  category: string;
  priority: string;
  matched_keywords: string[];
  language: string;
}[] {
  const lowerText = text.toLowerCase();
  const results: {
    disease: string;
    category: string;
    priority: string;
    matched_keywords: string[];
    language: string;
  }[] = [];
  
  for (const [_, diseaseInfo] of Object.entries(DISEASE_KEYWORDS_MULTILINGUAL)) {
    const matchedKeywords: string[] = [];
    let matchedLanguage = '';
    
    for (const [lang, keywords] of Object.entries(diseaseInfo.keywords)) {
      for (const keyword of keywords) {
        if (lowerText.includes(keyword.toLowerCase())) {
          matchedKeywords.push(keyword);
          matchedLanguage = lang;
        }
      }
    }
    
    if (matchedKeywords.length > 0) {
      results.push({
        disease: diseaseInfo.disease,
        category: diseaseInfo.category,
        priority: diseaseInfo.priority,
        matched_keywords: matchedKeywords,
        language: matchedLanguage
      });
    }
  }
  
  return results;
}

// Detect alert indicators in text
function detectAlertIndicators(text: string): {
  type: string;
  matched_keywords: string[];
  language: string;
}[] {
  const lowerText = text.toLowerCase();
  const results: {
    type: string;
    matched_keywords: string[];
    language: string;
  }[] = [];
  
  for (const [alertType, keywords] of Object.entries(ALERT_KEYWORDS_MULTILINGUAL)) {
    const matchedKeywords: string[] = [];
    let matchedLanguage = '';
    
    for (const [lang, langKeywords] of Object.entries(keywords)) {
      for (const keyword of langKeywords) {
        if (lowerText.includes(keyword.toLowerCase())) {
          matchedKeywords.push(keyword);
          matchedLanguage = lang;
        }
      }
    }
    
    if (matchedKeywords.length > 0) {
      results.push({
        type: alertType,
        matched_keywords: matchedKeywords,
        language: matchedLanguage
      });
    }
  }
  
  return results;
}

// Calculate Language-Location Trust Score
function calculateTrustScore(
  detectedLanguage: string,
  countryISO3: string,
  sourceTier: string,
  keywordMatches: number
): {
  score: number;
  factors: {
    language_match: boolean;
    regional_consistency: boolean;
    keyword_authenticity: number;
    source_tier_weight: number;
  };
} {
  const langInfo = AFRICAN_LANGUAGES[detectedLanguage];
  
  // Factor 1: Language-Country Match (0-30 points)
  let languageMatchScore = 0;
  let languageMatch = false;
  if (langInfo && langInfo.primaryCountries.includes(countryISO3)) {
    languageMatchScore = 30;
    languageMatch = true;
  } else if (langInfo) {
    languageMatchScore = 10;  // African language but different region
  } else if (detectedLanguage === 'en' || detectedLanguage === 'fr') {
    languageMatchScore = 15;  // Colonial languages - moderate trust
  }
  
  // Factor 2: Regional Consistency (0-25 points)
  let regionalConsistency = false;
  let regionalScore = 0;
  if (langInfo) {
    // Check if the language is spoken in the same general region
    const regions: Record<string, string[]> = {
      'west': ['NGA', 'GHA', 'SEN', 'MLI', 'NER', 'BFA', 'CIV', 'BEN', 'TGO', 'GIN', 'GNB', 'SLE', 'LBR', 'GMB', 'CPV', 'MRT'],
      'east': ['KEN', 'TZA', 'UGA', 'RWA', 'BDI', 'ETH', 'SOM', 'ERI', 'DJI', 'SSD'],
      'central': ['COD', 'COG', 'CAF', 'CMR', 'GAB', 'TCD', 'GNQ', 'STP'],
      'southern': ['ZAF', 'ZWE', 'ZMB', 'MWI', 'MOZ', 'BWA', 'NAM', 'AGO', 'SWZ', 'LSO', 'MDG', 'MUS', 'SYC', 'COM'],
      'north': ['DZA', 'MAR', 'TUN', 'LBY', 'SDN']
    };
    
    for (const [region, countries] of Object.entries(regions)) {
      if (countries.includes(countryISO3) && langInfo.primaryCountries.some(c => countries.includes(c))) {
        regionalConsistency = true;
        regionalScore = 25;
        break;
      }
    }
  }
  
  // Factor 3: Keyword Authenticity (0-25 points)
  // More local language keyword matches = higher authenticity
  const keywordAuthenticity = Math.min(25, keywordMatches * 5);
  
  // Factor 4: Source Tier Weight (0-20 points)
  const tierWeights: Record<string, number> = {
    'tier_1': 20,
    'tier_2': 15,
    'tier_3': 10
  };
  const sourceTierWeight = tierWeights[sourceTier] || 10;
  
  const totalScore = languageMatchScore + regionalScore + keywordAuthenticity + sourceTierWeight;
  
  return {
    score: Math.min(100, totalScore),
    factors: {
      language_match: languageMatch,
      regional_consistency: regionalConsistency,
      keyword_authenticity: keywordAuthenticity,
      source_tier_weight: sourceTierWeight
    }
  };
}

// AI-enhanced translation and analysis (optional)
async function getAIAnalysis(text: string, detectedLanguage: string): Promise<{
  translation?: string;
  translation_confidence?: number;
  cultural_notes?: string;
} | null> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) return null;
  
  // Only use AI for non-English text
  if (detectedLanguage === 'en') return null;
  
  try {
    const langName = AFRICAN_LANGUAGES[detectedLanguage]?.name || detectedLanguage.toUpperCase();
    
    const systemPrompt = `You are an expert translator specializing in African languages, particularly ${langName}. 
Translate the following text to English, preserving cultural context and local expressions.
Also provide a confidence score (0-100) and any important cultural notes.

Respond ONLY with valid JSON:
{
  "translation": "English translation",
  "translation_confidence": number,
  "cultural_notes": "cultural context if relevant, or null"
}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ],
        temperature: 0.2,
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleanContent);
  } catch (error) {
    console.error('AI analysis error:', error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const { 
      text, 
      country_iso3 = '', 
      source_tier = 'tier_3',
      include_translation = false 
    } = await req.json();

    if (!text) {
      return new Response(
        JSON.stringify({ error: 'Text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 1: Detect language
    const { code: detectedLanguage, confidence: langConfidence } = detectLanguage(text);
    const langInfo = AFRICAN_LANGUAGES[detectedLanguage];
    
    // Step 2: Detect diseases using multilingual keywords
    const detectedDiseases = detectDiseases(text);
    
    // Step 3: Detect alert indicators
    const alertIndicators = detectAlertIndicators(text);
    
    // Step 4: Calculate trust score
    const localKeywordMatches = 
      detectedDiseases.filter(d => d.language !== 'en').reduce((sum, d) => sum + d.matched_keywords.length, 0) +
      alertIndicators.filter(a => a.language !== 'en').reduce((sum, a) => sum + a.matched_keywords.length, 0);
    
    const trustResult = calculateTrustScore(detectedLanguage, country_iso3, source_tier, localKeywordMatches);
    
    // Step 5: Optional AI translation
    let aiAnalysis: { translation?: string; translation_confidence?: number; cultural_notes?: string } | null = null;
    if (include_translation && detectedLanguage !== 'en') {
      aiAnalysis = await getAIAnalysis(text, detectedLanguage);
    }
    
    const result: LinguaFidelityResult = {
      detected_language: detectedLanguage,
      language_name: langInfo?.name || (detectedLanguage === 'en' ? 'English' : detectedLanguage.toUpperCase()),
      script: langInfo?.script || 'latin',
      language_family: langInfo?.family || 'unknown',
      confidence: langConfidence,
      is_african_language: !!langInfo && !['en', 'fr', 'pt', 'ar'].includes(detectedLanguage),
      local_voice: !!langInfo && !['en', 'fr', 'pt'].includes(detectedLanguage),
      
      language_location_trust_score: trustResult.score,
      trust_factors: trustResult.factors,
      
      detected_diseases: detectedDiseases,
      alert_indicators: alertIndicators,
      
      translation: aiAnalysis?.translation,
      translation_confidence: aiAnalysis?.translation_confidence,
      cultural_notes: aiAnalysis?.cultural_notes,
      
      processing_time_ms: Date.now() - startTime
    };

    return new Response(
      JSON.stringify({ success: true, ...result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('lingua-fidelity error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
