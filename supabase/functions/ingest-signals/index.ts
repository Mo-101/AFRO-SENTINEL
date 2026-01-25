import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// AFRO country codes (ISO3) - hard filter
const AFRO_COUNTRIES = [
  "AGO","BEN","BWA","BFA","BDI","CPV","CMR","CAF","TCD","COM","COG","CIV","COD",
  "GNQ","ERI","ETH","GAB","GMB","GHA","GIN","GNB","KEN","LSO","LBR","MDG","MWI",
  "MLI","MRT","MUS","MOZ","NAM","NER","NGA","RWA","STP","SEN","SYC","SLE","ZAF",
  "SSD","TZA","TGO","UGA","ZMB","ZWE","DZA","TUN","LBY","MAR","SWZ"
];

// Country name to ISO3 mapping
const COUNTRY_NAME_TO_ISO3: Record<string, string> = {
  "angola": "AGO", "benin": "BEN", "botswana": "BWA", "burkina faso": "BFA",
  "burundi": "BDI", "cabo verde": "CPV", "cape verde": "CPV", "cameroon": "CMR",
  "central african republic": "CAF", "chad": "TCD", "comoros": "COM", "congo": "COG",
  "cote d'ivoire": "CIV", "ivory coast": "CIV", "democratic republic of the congo": "COD",
  "dr congo": "COD", "drc": "COD", "equatorial guinea": "GNQ", "eritrea": "ERI",
  "ethiopia": "ETH", "gabon": "GAB", "gambia": "GMB", "ghana": "GHA", "guinea": "GIN",
  "guinea-bissau": "GNB", "kenya": "KEN", "lesotho": "LSO", "liberia": "LBR",
  "madagascar": "MDG", "malawi": "MWI", "mali": "MLI", "mauritania": "MRT",
  "mauritius": "MUS", "mozambique": "MOZ", "namibia": "NAM", "niger": "NER",
  "nigeria": "NGA", "rwanda": "RWA", "sao tome and principe": "STP", "senegal": "SEN",
  "seychelles": "SYC", "sierra leone": "SLE", "south africa": "ZAF", "south sudan": "SSD",
  "tanzania": "TZA", "togo": "TGO", "uganda": "UGA", "zambia": "ZMB", "zimbabwe": "ZWE",
  "algeria": "DZA", "tunisia": "TUN", "libya": "LBY", "morocco": "MAR", "eswatini": "SWZ",
  "swaziland": "SWZ"
};

// =====================================================
// LINGUA FIDELITY ENGINE - MULTILINGUAL DISEASE KEYWORDS
// Hausa (ha), Yoruba (yo), Swahili (sw) + English
// =====================================================

interface DiseaseKeywordEntry {
  name: string;
  category: string;
  priority: string;
  keywords: {
    en: string[];
    ha: string[];  // Hausa
    yo: string[];  // Yoruba
    sw: string[];  // Swahili
  };
}

const DISEASE_KEYWORDS_MULTILINGUAL: Record<string, DiseaseKeywordEntry> = {
  "cholera": {
    name: "Cholera",
    category: "enteric",
    priority: "P1",
    keywords: {
      en: ["cholera", "watery diarrhea", "acute diarrhea", "awd"],
      ha: ["zawo", "ciwon hanji", "gudawa", "zawo ruwa"],
      yo: ["gbuuru", "igbe gbuuru", "àrùn gbuuru olomi"],
      sw: ["kipindupindu", "kuhara maji", "kuharisha"]
    }
  },
  "ebola": {
    name: "Ebola",
    category: "vhf",
    priority: "P1",
    keywords: {
      en: ["ebola", "hemorrhagic fever", "bleeding", "evd"],
      ha: ["ebola", "zazzabin zubar jini", "cutar zubar jini"],
      yo: ["ebola", "ibà ẹjẹ", "àrùn ẹjẹ sísàn"],
      sw: ["ebola", "homa ya kutoka damu"]
    }
  },
  "marburg": {
    name: "Marburg",
    category: "vhf",
    priority: "P1",
    keywords: {
      en: ["marburg", "marburg virus", "hemorrhagic", "mvd"],
      ha: ["marburg", "cutar marburg"],
      yo: ["marburg"],
      sw: ["marburg", "virusi ya marburg"]
    }
  },
  "lassa": {
    name: "Lassa Fever",
    category: "vhf",
    priority: "P1",
    keywords: {
      en: ["lassa", "lassa fever", "rodent fever"],
      ha: ["zazzabin lassa", "cutar lassa", "zazzabin bera"],
      yo: ["ibà lassa", "àrùn lassa"],
      sw: ["homa ya lassa"]
    }
  },
  "yellow_fever": {
    name: "Yellow Fever",
    category: "vhf",
    priority: "P1",
    keywords: {
      en: ["yellow fever", "jaundice", "flavivirus"],
      ha: ["zazzabin rawaya", "cutar rawaya"],
      yo: ["ibà pupa", "àrùn awọ ofeefee"],
      sw: ["homa ya manjano"]
    }
  },
  "measles": {
    name: "Measles",
    category: "vaccine_preventable",
    priority: "P2",
    keywords: {
      en: ["measles", "rubeola", "rash"],
      ha: ["kyanda", "cutar kyanda"],
      yo: ["igbonwo", "àrùn igbonwo"],
      sw: ["surua", "chokaa", "upele"]
    }
  },
  "polio": {
    name: "Polio",
    category: "vaccine_preventable",
    priority: "P1",
    keywords: {
      en: ["polio", "poliomyelitis", "paralysis", "afp"],
      ha: ["shan inna", "cutar gurguzu"],
      yo: ["roparose", "àrùn ẹsẹ rírọ"],
      sw: ["polio", "kupooza"]
    }
  },
  "meningitis": {
    name: "Meningococcal disease",
    category: "vaccine_preventable",
    priority: "P1",
    keywords: {
      en: ["meningitis", "meningococcal", "stiff neck"],
      ha: ["sankarau", "cutar sankarau", "wuyan taurin"],
      yo: ["àrùn ọpọlọ", "orí wíwọ"],
      sw: ["homa ya uti wa mgongo", "shingo kavu"]
    }
  },
  "malaria": {
    name: "Malaria",
    category: "vector_borne",
    priority: "P3",
    keywords: {
      en: ["malaria", "plasmodium"],
      ha: ["zazzabin cizon sauro", "malariya"],
      yo: ["ibà", "arun efon"],
      sw: ["malaria", "homa ya malaria"]
    }
  },
  "dengue": {
    name: "Dengue",
    category: "vector_borne",
    priority: "P2",
    keywords: {
      en: ["dengue", "breakbone fever"],
      ha: ["zazzabin dengue"],
      yo: ["ibà dengue"],
      sw: ["homa ya dengue"]
    }
  },
  "mpox": {
    name: "Mpox",
    category: "zoonotic",
    priority: "P2",
    keywords: {
      en: ["mpox", "monkeypox", "pox", "clade"],
      ha: ["mpox", "agana", "cutar agana"],
      yo: ["mpox", "àrùn ọbọ"],
      sw: ["mpox", "ndui ya nyani"]
    }
  },
  "covid": {
    name: "COVID-19",
    category: "respiratory",
    priority: "P3",
    keywords: {
      en: ["covid", "coronavirus", "sars-cov-2"],
      ha: ["covid", "korona", "cutar korona"],
      yo: ["covid", "korona"],
      sw: ["covid", "korona"]
    }
  },
  "plague": {
    name: "Plague",
    category: "zoonotic",
    priority: "P1",
    keywords: {
      en: ["plague", "bubonic", "pneumonic plague"],
      ha: ["annoba", "cutar annoba"],
      yo: ["àjàkálẹ̀ àrùn"],
      sw: ["tauni", "pigo"]
    }
  },
  "typhoid": {
    name: "Typhoid fever",
    category: "enteric",
    priority: "P2",
    keywords: {
      en: ["typhoid", "enteric fever"],
      ha: ["zazzabin typhoid", "taifo"],
      yo: ["ibà typhoid", "taifo"],
      sw: ["homa ya matumbo", "taifodi"]
    }
  },
  "rabies": {
    name: "Rabies",
    category: "zoonotic",
    priority: "P2",
    keywords: {
      en: ["rabies", "hydrophobia", "dog bite"],
      ha: ["haukan kare", "cutar kare"],
      yo: ["aja wèrè", "igbẹ aja"],
      sw: ["kichaa cha mbwa"]
    }
  },
  "tuberculosis": {
    name: "Tuberculosis",
    category: "respiratory",
    priority: "P3",
    keywords: {
      en: ["tuberculosis", "tb", "pulmonary"],
      ha: ["tarin fuka", "cutar huhu"],
      yo: ["iko", "àrùn ẹdọ̀fóró"],
      sw: ["kifua kikuu", "tb"]
    }
  },
  "anthrax": {
    name: "Anthrax",
    category: "zoonotic",
    priority: "P1",
    keywords: {
      en: ["anthrax", "bacillus anthracis"],
      ha: ["cutar anthrax"],
      yo: ["àrùn anthrax"],
      sw: ["kimeta"]
    }
  },
  "rift_valley_fever": {
    name: "Rift Valley Fever",
    category: "vhf",
    priority: "P1",
    keywords: {
      en: ["rift valley fever", "rvf"],
      ha: ["zazzabin rift valley"],
      yo: ["ibà rift valley"],
      sw: ["homa ya bonde la ufa"]
    }
  },
  "crimean_congo": {
    name: "CCHF",
    category: "vhf",
    priority: "P1",
    keywords: {
      en: ["crimean-congo", "cchf", "hemorrhagic"],
      ha: ["zazzabin zubar jini"],
      yo: ["ibà ẹjẹ"],
      sw: ["homa ya kutoka damu"]
    }
  }
};

// Language-specific outbreak/alert keywords
const ALERT_KEYWORDS: Record<string, string[]> = {
  en: ["outbreak", "epidemic", "surge", "emergency", "cases", "deaths", "suspected", "confirmed"],
  ha: ["annobar", "cutar da ta yadu", "gaggawa", "mutuwa", "masu cutar"],
  yo: ["àjàkálẹ̀", "àrùn", "pàjáwìrì", "ikú", "àwọn aláìsàn"],
  sw: ["mlipuko", "janga", "dharura", "vifo", "visa"]
};

// Hausa-speaking regions for trust scoring
const HAUSA_COUNTRIES = ["NGA", "NER", "GHA", "CMR", "TCD", "BFA"];
// Yoruba-speaking regions
const YORUBA_COUNTRIES = ["NGA", "BEN", "TGO"];
// Swahili-speaking regions
const SWAHILI_COUNTRIES = ["TZA", "KEN", "UGA", "RWA", "BDI", "COD", "MOZ", "COM"];

// Simple language patterns for detection
const LANGUAGE_PATTERNS: Record<string, { uniqueChars?: RegExp; commonWords: string[] }> = {
  ha: {
    uniqueChars: /[ɓɗƙƴ]/i,
    commonWords: ["da", "na", "ne", "ce", "ba", "ya", "ta", "wa", "an", "su", "ko", "amma", "domin", "saboda", "kuma"]
  },
  yo: {
    uniqueChars: /[ẹọṣ]/i,
    commonWords: ["ti", "ni", "ó", "àti", "pẹ̀lú", "sí", "kí", "náà", "wọn", "àwọn", "kan", "jẹ́", "nínú", "láti"]
  },
  sw: {
    commonWords: ["na", "ya", "wa", "kwa", "ni", "la", "au", "za", "katika", "kutoka", "kwamba", "hii", "watu", "kama", "zaidi"]
  }
};

// Legacy simple keywords for backwards compatibility
const DISEASE_KEYWORDS: Record<string, { name: string; category: string; priority: string }> = {
  "cholera": { name: "Cholera", category: "enteric", priority: "P1" },
  "diarrhea": { name: "Cholera", category: "enteric", priority: "P2" },
  "ebola": { name: "Ebola", category: "vhf", priority: "P1" },
  "marburg": { name: "Marburg", category: "vhf", priority: "P1" },
  "yellow fever": { name: "Yellow Fever", category: "vhf", priority: "P1" },
  "lassa": { name: "Lassa Fever", category: "vhf", priority: "P1" },
  "measles": { name: "Measles", category: "vaccine_preventable", priority: "P2" },
  "polio": { name: "Polio", category: "vaccine_preventable", priority: "P1" },
  "meningitis": { name: "Meningococcal disease", category: "vaccine_preventable", priority: "P1" },
  "malaria": { name: "Malaria", category: "vector_borne", priority: "P3" },
  "dengue": { name: "Dengue", category: "vector_borne", priority: "P2" },
  "mpox": { name: "Mpox", category: "zoonotic", priority: "P2" },
  "monkeypox": { name: "Mpox", category: "zoonotic", priority: "P2" },
  "covid": { name: "COVID-19", category: "respiratory", priority: "P3" },
  "plague": { name: "Plague", category: "zoonotic", priority: "P1" },
  "typhoid": { name: "Typhoid fever", category: "enteric", priority: "P2" },
  "rabies": { name: "Rabies", category: "zoonotic", priority: "P2" },
  "tuberculosis": { name: "Tuberculosis", category: "respiratory", priority: "P3" },
  "anthrax": { name: "Anthrax", category: "zoonotic", priority: "P1" },
  "rift valley fever": { name: "Rift Valley Fever", category: "vhf", priority: "P1" },
  "crimean-congo": { name: "CCHF", category: "vhf", priority: "P1" },
  "hemorrhagic": { name: "Viral hemorrhagic fever", category: "vhf", priority: "P1" },
  "outbreak": { name: "Unknown", category: "unknown", priority: "P2" },
  "epidemic": { name: "Unknown", category: "unknown", priority: "P2" },
};

// Country coordinates for mapping
const COUNTRY_COORDS: Record<string, { lat: number; lng: number }> = {
  "NGA": { lat: 9.082, lng: 8.6753 },
  "KEN": { lat: -0.0236, lng: 37.9062 },
  "ZAF": { lat: -30.5595, lng: 22.9375 },
  "ETH": { lat: 9.145, lng: 40.4897 },
  "COD": { lat: -4.0383, lng: 21.7587 },
  "GHA": { lat: 7.9465, lng: -1.0232 },
  "TZA": { lat: -6.369, lng: 34.8888 },
  "UGA": { lat: 1.3733, lng: 32.2903 },
  "RWA": { lat: -1.9403, lng: 29.8739 },
  "SEN": { lat: 14.4974, lng: -14.4524 },
  "MOZ": { lat: -18.6657, lng: 35.5296 },
  "ZMB": { lat: -13.1339, lng: 27.8493 },
  "ZWE": { lat: -19.0154, lng: 29.1549 },
  "MWI": { lat: -13.2543, lng: 34.3015 },
  "AGO": { lat: -11.2027, lng: 17.8739 },
  "CMR": { lat: 7.3697, lng: 12.3547 },
  "CIV": { lat: 7.54, lng: -5.5471 },
  "MLI": { lat: 17.5707, lng: -3.9962 },
  "NER": { lat: 17.6078, lng: 8.0817 },
  "BFA": { lat: 12.2383, lng: -1.5616 },
  "DZA": { lat: 28.0339, lng: 1.6596 },
  "MAR": { lat: 31.7917, lng: -7.0926 },
  "TUN": { lat: 33.8869, lng: 9.5375 },
  "LBY": { lat: 26.3351, lng: 17.2283 },
  "SSD": { lat: 6.877, lng: 31.307 },
  "SDN": { lat: 12.8628, lng: 30.2176 },
};

function extractCountryISO3(text: string): string | null {
  const lowerText = text.toLowerCase();
  for (const [name, iso3] of Object.entries(COUNTRY_NAME_TO_ISO3)) {
    if (lowerText.includes(name)) {
      return iso3;
    }
  }
  return null;
}

// =====================================================
// LINGUA FIDELITY DETECTION FUNCTIONS
// =====================================================

// Detect language from text patterns
function detectLanguage(text: string): { code: string; confidence: number } {
  // Check for unique script characters first
  for (const [langCode, patterns] of Object.entries(LANGUAGE_PATTERNS)) {
    if (patterns.uniqueChars && patterns.uniqueChars.test(text)) {
      return { code: langCode, confidence: 95 };
    }
  }
  
  const lowerText = text.toLowerCase();
  const scores: Record<string, number> = {};
  
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
  
  // Calculate confidence
  const wordCount = text.split(/\s+/).length;
  const confidence = Math.min(90, Math.round((bestScore / Math.max(wordCount, 1)) * 100) + 40);
  
  if (bestScore < 2) {
    return { code: 'en', confidence: 50 };
  }
  
  return { code: bestLang, confidence };
}

// Multilingual disease detection with keyword matching
function detectDiseaseMultilingual(text: string): {
  name: string;
  category: string;
  priority: string;
  matched_keywords: string[];
  detected_language: string;
} | null {
  const lowerText = text.toLowerCase();
  
  for (const [_, diseaseInfo] of Object.entries(DISEASE_KEYWORDS_MULTILINGUAL)) {
    const matchedKeywords: string[] = [];
    let matchedLanguage = 'en';
    
    for (const [lang, keywords] of Object.entries(diseaseInfo.keywords)) {
      for (const keyword of keywords) {
        if (lowerText.includes(keyword.toLowerCase())) {
          matchedKeywords.push(keyword);
          if (lang !== 'en') matchedLanguage = lang;
        }
      }
    }
    
    if (matchedKeywords.length > 0) {
      return {
        name: diseaseInfo.name,
        category: diseaseInfo.category,
        priority: diseaseInfo.priority,
        matched_keywords: matchedKeywords,
        detected_language: matchedLanguage
      };
    }
  }
  
  return null;
}

// Calculate Language-Location Trust Score
function calculateLinguaTrustScore(
  detectedLanguage: string,
  countryISO3: string,
  sourceTier: string,
  keywordMatches: number
): number {
  let score = 0;
  
  // Factor 1: Language-Country Match (0-35 points)
  if (detectedLanguage === 'ha' && HAUSA_COUNTRIES.includes(countryISO3)) {
    score += 35;
  } else if (detectedLanguage === 'yo' && YORUBA_COUNTRIES.includes(countryISO3)) {
    score += 35;
  } else if (detectedLanguage === 'sw' && SWAHILI_COUNTRIES.includes(countryISO3)) {
    score += 35;
  } else if (['ha', 'yo', 'sw'].includes(detectedLanguage)) {
    score += 15; // African language but different region
  } else if (detectedLanguage === 'en') {
    score += 10; // Colonial language
  }
  
  // Factor 2: Local keyword matches (0-30 points)
  score += Math.min(30, keywordMatches * 6);
  
  // Factor 3: Source tier (0-20 points)
  const tierWeights: Record<string, number> = {
    'tier_1': 20,
    'tier_2': 15,
    'tier_3': 10
  };
  score += tierWeights[sourceTier] || 10;
  
  // Factor 4: Base authenticity (15 points for any local language)
  if (['ha', 'yo', 'sw'].includes(detectedLanguage)) {
    score += 15;
  }
  
  return Math.min(100, score);
}

// Check for alert indicators in text (multilingual)
function detectAlertIndicators(text: string): { type: string; language: string }[] {
  const lowerText = text.toLowerCase();
  const results: { type: string; language: string }[] = [];
  
  for (const [alertType, keywords] of Object.entries(ALERT_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        results.push({ type: alertType, language: alertType === 'en' ? 'en' : 'local' });
        break;
      }
    }
  }
  
  return results;
}

// Legacy simple disease detection (fallback)
function detectDisease(text: string): { name: string; category: string; priority: string } | null {
  const lowerText = text.toLowerCase();
  for (const [keyword, info] of Object.entries(DISEASE_KEYWORDS)) {
    if (lowerText.includes(keyword)) {
      return info;
    }
  }
  return null;
}

function generateHash(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

// Fetch from GDELT API (free, no auth required)
async function fetchGDELT(): Promise<any[]> {
  const diseases = ["cholera", "ebola", "measles", "meningitis", "malaria", "yellow fever", "mpox", "polio", "outbreak"];
  const signals: any[] = [];
  
  for (const disease of diseases) {
    try {
      const query = encodeURIComponent(`${disease} (africa OR african OR nigeria OR kenya OR ethiopia OR congo OR tanzania OR uganda OR ghana OR senegal OR morocco OR egypt OR south africa)`);
      const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${query}&mode=artlist&maxrecords=15&format=json&timespan=48h&sort=datedesc`;
      
      const response = await fetch(url);
      if (!response.ok) {
        console.log(`GDELT failed for ${disease}:`, response.status);
        continue;
      }
      
      const data = await response.json();
      const articles = data.articles || [];
      
      for (const article of articles) {
        const title = article.title || article.segtitle || '';
        const countryISO3 = extractCountryISO3(title);
        if (!countryISO3 || !AFRO_COUNTRIES.includes(countryISO3)) continue;
        
        // LINGUA FIDELITY: Use multilingual disease detection
        const multilingualDiseaseInfo = detectDiseaseMultilingual(title);
        const diseaseInfo = multilingualDiseaseInfo || detectDisease(title);
        
        // LINGUA FIDELITY: Detect language
        const langDetection = detectLanguage(title);
        const sourceTier = 'tier_2';
        
        // LINGUA FIDELITY: Calculate trust score
        const localKeywordCount = multilingualDiseaseInfo?.matched_keywords?.length || 0;
        const linguaTrustScore = calculateLinguaTrustScore(
          langDetection.code, 
          countryISO3, 
          sourceTier,
          localKeywordCount
        );
        
        signals.push({
          source_id: 'GDELT',
          source_name: article.domain || 'GDELT',
          source_url: article.url,
          source_type: 'news',
          source_tier: sourceTier,
          original_text: title,
          original_language: langDetection.code !== 'en' ? langDetection.code : (article.language || 'en'),
          location_country: Object.entries(COUNTRY_NAME_TO_ISO3).find(([_, iso]) => iso === countryISO3)?.[0] || countryISO3,
          location_country_iso: countryISO3,
          location_lat: COUNTRY_COORDS[countryISO3]?.lat || null,
          location_lng: COUNTRY_COORDS[countryISO3]?.lng || null,
          disease_name: diseaseInfo?.name || null,
          disease_category: diseaseInfo?.category || 'unknown',
          priority: diseaseInfo?.priority || 'P3',
          source_timestamp: article.seendate || new Date().toISOString(),
          confidence_score: 65,
          lingua_fidelity_score: linguaTrustScore,
          signal_type: 'media_report',
          status: 'new',
          ingestion_source: 'GDELT-V2',
          duplicate_hash: generateHash(article.url || title),
        });
      }
      
      // Rate limit between disease queries
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`GDELT error for ${disease}:`, error);
    }
  }
  
  return signals;
}

// Fetch from ReliefWeb API (free, no auth required)
async function fetchReliefWeb(): Promise<any[]> {
  const signals: any[] = [];
  
  try {
    // Simplified query for health reports in Africa
    const url = `https://api.reliefweb.int/v1/reports?appname=afro-sentinel&preset=latest&query[value]=health%20disease%20outbreak&query[fields][]=title&filter[field]=primary_country.region.id&filter[value]=4&limit=25`;
    
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) {
      console.log('ReliefWeb failed:', response.status);
      return signals;
    }
    
    const data = await response.json();
    const reports = data.data || [];
    
    for (const report of reports) {
      const fields = report.fields || {};
      const countryISO3 = fields.primary_country?.iso3;
      
      if (!countryISO3 || !AFRO_COUNTRIES.includes(countryISO3)) continue;
      
      const title = fields.title || '';
      
      // LINGUA FIDELITY: Use multilingual disease detection
      const multilingualDiseaseInfo = detectDiseaseMultilingual(title);
      const diseaseInfo = multilingualDiseaseInfo || detectDisease(title);
      
      // LINGUA FIDELITY: Detect language
      const langDetection = detectLanguage(title);
      const sourceTier = 'tier_1';
      
      // LINGUA FIDELITY: Calculate trust score
      const localKeywordCount = multilingualDiseaseInfo?.matched_keywords?.length || 0;
      const linguaTrustScore = calculateLinguaTrustScore(
        langDetection.code, 
        countryISO3, 
        sourceTier,
        localKeywordCount
      );
      
      signals.push({
        source_id: 'RELIEF-WEB',
        source_name: fields.source?.[0]?.name || 'ReliefWeb',
        source_url: fields.url_alias || `https://reliefweb.int/node/${report.id}`,
        source_type: 'official',
        source_tier: sourceTier,
        original_text: title,
        original_language: langDetection.code !== 'en' ? langDetection.code : (fields.language?.[0]?.code || 'en'),
        location_country: fields.primary_country?.name || countryISO3,
        location_country_iso: countryISO3,
        location_lat: COUNTRY_COORDS[countryISO3]?.lat || null,
        location_lng: COUNTRY_COORDS[countryISO3]?.lng || null,
        disease_name: diseaseInfo?.name || null,
        disease_category: diseaseInfo?.category || 'unknown',
        priority: diseaseInfo?.priority || 'P3',
        source_timestamp: fields.date?.created || new Date().toISOString(),
        confidence_score: 80,
        lingua_fidelity_score: linguaTrustScore,
        signal_type: 'official_report',
        status: 'new',
        ingestion_source: 'RELIEF-WEB',
        duplicate_hash: generateHash(report.id?.toString() || title),
      });
    }
  } catch (error) {
    console.error('ReliefWeb error:', error);
  }
  
  return signals;
}

// Fetch from AllAfrica Health News (free RSS)
async function fetchAllAfrica(): Promise<any[]> {
  const signals: any[] = [];
  
  try {
    const url = 'https://allafrica.com/tools/headlines/rdf/health/headlines.rdf';
    const response = await fetch(url);
    
    if (!response.ok) {
      console.log('AllAfrica failed:', response.status);
      return signals;
    }
    
    const xmlText = await response.text();
    
    // Simple XML parsing for RSS items
    const items = xmlText.match(/<item[^>]*>[\s\S]*?<\/item>/g) || [];
    
    for (const item of items.slice(0, 20)) {
      const titleMatch = item.match(/<title>([^<]+)<\/title>/);
      const linkMatch = item.match(/<link>([^<]+)<\/link>/);
      const dateMatch = item.match(/<dc:date>([^<]+)<\/dc:date>/);
      
      if (!titleMatch) continue;
      
      const title = titleMatch[1];
      const countryISO3 = extractCountryISO3(title);
      
      if (!countryISO3 || !AFRO_COUNTRIES.includes(countryISO3)) continue;
      
      // LINGUA FIDELITY: Use multilingual disease detection
      const multilingualDiseaseInfo = detectDiseaseMultilingual(title);
      const diseaseInfo = multilingualDiseaseInfo || detectDisease(title);
      
      // LINGUA FIDELITY: Detect language
      const langDetection = detectLanguage(title);
      const sourceTier = 'tier_2';
      
      // LINGUA FIDELITY: Calculate trust score
      const localKeywordCount = multilingualDiseaseInfo?.matched_keywords?.length || 0;
      const linguaTrustScore = calculateLinguaTrustScore(
        langDetection.code, 
        countryISO3, 
        sourceTier,
        localKeywordCount
      );
      
      signals.push({
        source_id: 'ALLAFRICA',
        source_name: 'AllAfrica',
        source_url: linkMatch?.[1] || '',
        source_type: 'news',
        source_tier: sourceTier,
        original_text: title,
        original_language: langDetection.code !== 'en' ? langDetection.code : 'en',
        location_country: Object.entries(COUNTRY_NAME_TO_ISO3).find(([_, iso]) => iso === countryISO3)?.[0] || countryISO3,
        location_country_iso: countryISO3,
        location_lat: COUNTRY_COORDS[countryISO3]?.lat || null,
        location_lng: COUNTRY_COORDS[countryISO3]?.lng || null,
        disease_name: diseaseInfo?.name || null,
        disease_category: diseaseInfo?.category || 'unknown',
        priority: diseaseInfo?.priority || 'P3',
        source_timestamp: dateMatch?.[1] || new Date().toISOString(),
        confidence_score: 70,
        lingua_fidelity_score: linguaTrustScore,
        signal_type: 'media_report',
        status: 'new',
        ingestion_source: 'ALLAFRICA-HEALTH',
        duplicate_hash: generateHash(linkMatch?.[1] || title),
      });
    }
  } catch (error) {
    console.error('AllAfrica error:', error);
  }
  
  return signals;
}

// Fetch from WHO DON (Disease Outbreak News)
async function fetchWHO(): Promise<any[]> {
  const signals: any[] = [];
  
  try {
    // WHO GHO API for disease data
    const url = `https://ghoapi.azureedge.net/api/CHOLERA_0000000001`;
    
    const response = await fetch(url);
    if (!response.ok) {
      console.log('WHO GHO failed:', response.status);
      return signals;
    }
    
    const data = await response.json();
    const values = data.value || [];
    
    // Get recent data (last 2 years as proxy for recent activity)
    const recentData = values.filter((v: any) => {
      const year = parseInt(v.TimeDim);
      return year >= 2023 && AFRO_COUNTRIES.includes(v.SpatialDim);
    }).slice(0, 10);
    
    for (const item of recentData) {
      const countryISO3 = item.SpatialDim;
      
      signals.push({
        source_id: 'WHO_GHO',
        source_name: 'WHO Global Health Observatory',
        source_url: `https://www.who.int/data/gho/data/indicators/indicator-details/GHO/number-of-reported-cases-of-cholera`,
        source_type: 'official',
        source_tier: 'tier_1',
        original_text: `Cholera cases reported in ${countryISO3}: ${item.NumericValue} cases (${item.TimeDim})`,
        original_language: 'en',
        location_country: countryISO3,
        location_country_iso: countryISO3,
        location_lat: COUNTRY_COORDS[countryISO3]?.lat || null,
        location_lng: COUNTRY_COORDS[countryISO3]?.lng || null,
        disease_name: 'Cholera',
        disease_category: 'enteric',
        priority: item.NumericValue > 1000 ? 'P1' : item.NumericValue > 100 ? 'P2' : 'P3',
        reported_cases: item.NumericValue,
        source_timestamp: `${item.TimeDim}-01-01T00:00:00Z`,
        confidence_score: 95,
        signal_type: 'official_report',
        status: 'validated',
        ingestion_source: 'WHO-GHO',
        duplicate_hash: generateHash(`WHO-${countryISO3}-cholera-${item.TimeDim}`),
      });
    }
  } catch (error) {
    console.error('WHO error:', error);
  }
  
  return signals;
}

// AI Analysis using Azure OpenAI or Lovable AI fallback
async function analyzeSignal(text: string): Promise<any> {
  const endpoint = Deno.env.get('AZURE_OPENAI_ENDPOINT');
  const apiKey = Deno.env.get('AZURE_OPENAI_API_KEY');
  const deployment = Deno.env.get('AZURE_OPENAI_DEPLOYMENT');
  const apiVersion = Deno.env.get('AZURE_OPENAI_API_VERSION') || '2024-12-01-preview';
  
  const systemPrompt = `You are an epidemiologist analyzing disease signals from Africa. Extract and return JSON:
{
  "disease_name": "string or null",
  "disease_category": "vhf|respiratory|enteric|vector_borne|zoonotic|vaccine_preventable|environmental|unknown",
  "priority": "P1|P2|P3|P4",
  "confidence_score": 0-100,
  "location_admin1": "state/province or null",
  "reported_cases": number or null,
  "reported_deaths": number or null,
  "cross_border_risk": true/false
}`;

  // Try Azure OpenAI first
  if (endpoint && apiKey && deployment) {
    try {
      const azureUrl = `${endpoint}openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;
      
      const response = await fetch(azureUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': apiKey,
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: text }
          ],
          temperature: 0.2,
          max_tokens: 500,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        try {
          return JSON.parse(content);
        } catch {
          return null;
        }
      }
    } catch (error) {
      console.error('Azure OpenAI error:', error);
    }
  }
  
  // Fallback to Lovable AI
  const lovableKey = Deno.env.get('LOVABLE_API_KEY');
  if (lovableKey) {
    try {
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableKey}`,
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
      
      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        try {
          // Extract JSON from markdown code blocks if present
          const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
          const jsonStr = jsonMatch ? jsonMatch[1] : content;
          return JSON.parse(jsonStr);
        } catch {
          return null;
        }
      }
    } catch (error) {
      console.error('Lovable AI error:', error);
    }
  }
  
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting signal ingestion...');
    
    // Fetch from all sources in parallel
    const [gdeltSignals, reliefwebSignals, whoSignals, allAfricaSignals] = await Promise.all([
      fetchGDELT(),
      fetchReliefWeb(),
      fetchWHO(),
      fetchAllAfrica(),
    ]);
    
    const allSignals = [...gdeltSignals, ...reliefwebSignals, ...whoSignals, ...allAfricaSignals];
    console.log(`Fetched ${allSignals.length} raw signals`);
    
    // Deduplicate by hash
    const existingHashes = new Set<string>();
    const { data: existingSignals } = await supabase
      .from('signals')
      .select('id, original_text')
      .order('created_at', { ascending: false })
      .limit(500);
    
    for (const signal of existingSignals || []) {
      existingHashes.add(generateHash(signal.original_text));
    }
    
    const newSignals = allSignals.filter(s => !existingHashes.has(s.duplicate_hash));
    console.log(`${newSignals.length} new signals after dedup`);
    
    // Analyze and insert signals
    const insertedSignals: any[] = [];
    
    for (const signal of newSignals.slice(0, 20)) { // Limit to 20 per run
      // AI-enhanced analysis for signals without disease classification
      if (!signal.disease_name || signal.disease_category === 'unknown') {
        const analysis = await analyzeSignal(signal.original_text);
        if (analysis) {
          signal.disease_name = analysis.disease_name || signal.disease_name;
          signal.disease_category = analysis.disease_category || signal.disease_category;
          signal.priority = analysis.priority || signal.priority;
          signal.confidence_score = analysis.confidence_score || signal.confidence_score;
          signal.location_admin1 = analysis.location_admin1 || null;
          signal.reported_cases = analysis.reported_cases || null;
          signal.reported_deaths = analysis.reported_deaths || null;
          signal.cross_border_risk = analysis.cross_border_risk || false;
        }
      }
      
      // Remove duplicate_hash before insert (not in schema)
      const { duplicate_hash, source_id, ...signalData } = signal;
      
      const { data, error } = await supabase
        .from('signals')
        .insert(signalData)
        .select()
        .single();
      
      if (error) {
        console.error('Insert error:', error.message);
      } else {
        insertedSignals.push(data);
      }
    }
    
    console.log(`Inserted ${insertedSignals.length} signals`);
    
    return new Response(
      JSON.stringify({
        success: true,
        fetched: allSignals.length,
        deduplicated: newSignals.length,
        inserted: insertedSignals.length,
        signals: insertedSignals,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Ingestion error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
