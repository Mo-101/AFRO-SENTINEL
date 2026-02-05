import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// =====================================================
// 🔥 STRUCTURED LOGGER - AFRO SENTINEL WATCHTOWER
// Levels: DEBUG < INFO < WARN < ERROR
// =====================================================
type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  component: string;
  message: string;
  metadata?: Record<string, unknown>;
}

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

// Set minimum log level (can be configured via env)
const MIN_LOG_LEVEL: LogLevel = (Deno.env.get('LOG_LEVEL') as LogLevel) || 'INFO';

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[MIN_LOG_LEVEL];
}

function formatLog(entry: LogEntry): string {
  const emoji = {
    DEBUG: '🔍',
    INFO: '📋',
    WARN: '⚠️',
    ERROR: '🚨',
  }[entry.level];

  const meta = entry.metadata ? ` | ${JSON.stringify(entry.metadata)}` : '';
  return `${emoji} [${entry.level}] [${entry.component}] ${entry.message}${meta}`;
}

const logger = {
  debug: (component: string, message: string, metadata?: Record<string, unknown>) => {
    if (!shouldLog('DEBUG')) return;
    const entry: LogEntry = { timestamp: new Date().toISOString(), level: 'DEBUG', component, message, metadata };
    console.log(formatLog(entry));
  },

  info: (component: string, message: string, metadata?: Record<string, unknown>) => {
    if (!shouldLog('INFO')) return;
    const entry: LogEntry = { timestamp: new Date().toISOString(), level: 'INFO', component, message, metadata };
    console.log(formatLog(entry));
  },

  warn: (component: string, message: string, metadata?: Record<string, unknown>) => {
    if (!shouldLog('WARN')) return;
    const entry: LogEntry = { timestamp: new Date().toISOString(), level: 'WARN', component, message, metadata };
    console.warn(formatLog(entry));
  },

  error: (component: string, message: string, metadata?: Record<string, unknown>) => {
    if (!shouldLog('ERROR')) return;
    const entry: LogEntry = { timestamp: new Date().toISOString(), level: 'ERROR', component, message, metadata };
    console.error(formatLog(entry));
  },

  // Special method for tracking rejection statistics
  rejection: (reason: string, text: string, source?: string) => {
    if (!shouldLog('INFO')) return;
    const preview = text.length > 80 ? text.substring(0, 80) + '...' : text;
    console.log(`🚫 [REJECTED] ${reason} | "${preview}"${source ? ` | Source: ${source}` : ''}`);
  },

  // Summary logging for pipeline stages
  summary: (component: string, stats: Record<string, number>) => {
    if (!shouldLog('INFO')) return;
    const statsStr = Object.entries(stats).map(([k, v]) => `${k}=${v}`).join(', ');
    console.log(`📊 [SUMMARY] [${component}] ${statsStr}`);
  },
};

// AFRO country codes (ISO3) - hard filter
const AFRO_COUNTRIES = [
  "AGO", "BEN", "BWA", "BFA", "BDI", "CPV", "CMR", "CAF", "TCD", "COM", "COG", "CIV", "COD",
  "GNQ", "ERI", "ETH", "GAB", "GMB", "GHA", "GIN", "GNB", "KEN", "LSO", "LBR", "MDG", "MWI",
  "MLI", "MRT", "MUS", "MOZ", "NAM", "NER", "NGA", "RWA", "STP", "SEN", "SYC", "SLE", "ZAF",
  "SSD", "TZA", "TGO", "UGA", "ZMB", "ZWE", "DZA", "TUN", "LBY", "MAR", "SWZ"
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
// 🔥 SURGICAL NOISE FILTER - AFRO SENTINEL WATCHTOWER
// "If it's not about PEOPLE GETTING SICK or DYING from disease — it's noise."
// Ported from Python NoiseFilter v2.0
// =====================================================

// POLITICAL FIGURES AND OFFICES - AUTO REJECT
const POLITICAL_FIGURES = [
  // US Politics
  "trump", "biden", "desantis", "obama", "pence", "kamala", "harris",
  "pompeo", "blinken", "kennedy jr", "rfk", "vivek", "ramaswamy",
  "maga", "republican", "democrat", "gop",
  // Offices
  "white house", "oval office", "congress", "senate", "house of representatives",
  "capitol hill", "state department", "pentagon",
  // International political figures
  "macron", "scholz", "sunak", "putin", "xi jinping", "modi",
  "prime minister", "chancellor"
];

// POLITICAL ACTION VERBS - NOT outbreak verbs
const POLITICAL_ACTIONS = [
  "withdraws", "withdrawal", "withdrew", "pulls out", "pulled out",
  "defunds", "defunding", "defunded", "cuts funding", "funding cut",
  "sanctions", "sanctioned", "vetoes", "vetoed", "veto",
  "signs executive order", "executive order", "executive action",
  "passes bill", "bill passed", "legislation", "legislative",
  "announces policy", "policy change", "new policy",
  "reforms", "reform plan", "restructuring",
  "appoints", "appointed", "nomination", "nominates",
  "fires", "fired", "dismisses", "dismissed",
  "threatens", "threatened to",
  "criticizes", "criticized", "slams", "blasts",
  "supports", "endorses", "backs", "opposes", "opposition to"
];

// INSTITUTIONAL/ORGANIZATIONAL DRAMA
const INSTITUTIONAL_NOISE = [
  "who reform", "un reform", "reform the who", "reform the un",
  "who leadership", "who director", "tedros", "director-general",
  "un secretary", "secretary general", "guterres",
  "who budget", "un budget", "funding crisis", "budget crisis",
  "member states", "general assembly", "security council",
  "treaty", "agreement", "accord", "pact", "deal",
  "summit", "conference", "meeting of", "annual meeting",
  "diplomatic", "diplomacy", "bilateral", "multilateral",
  "geopolitical", "foreign policy", "international relations",
  // Swahili political terms
  "kuiondoa marekani", "siasa", "uchaguzi", "serikali imetangaza", "mkutano wa viongozi",
  // Hausa political terms
  "siyasa", "zabe", "gwamnati ta sanar", "taron shugabanni",
  // French political terms
  "politique", "élection", "gouvernement annonce", "sommet", "traité"
];

// OPINION/COMMENTARY MARKERS - Editorial content
const OPINION_MARKERS = [
  "opinion:", "editorial:", "op-ed:", "commentary:",
  "analysis:", "perspective:", "viewpoint:",
  "critics say", "experts warn about policy", "analysts say",
  "according to critics", "opponents argue", "supporters claim",
  "controversial", "debate over", "debate about",
  "should be", "must be", "needs to be", "ought to"
];

// FUNDING/BUDGET (without outbreak context) - Policy noise
const FUNDING_NOISE = [
  "funding", "budget", "financial", "fiscal",
  "billion dollar", "million dollar", "cost of",
  "investment", "spending", "expenditure",
  "grant awarded", "donation", "contribution",
  "economic impact", "financial impact"
];

// ALL POLITICAL NOISE COMBINED
const ALL_POLITICAL_NOISE = [
  ...POLITICAL_FIGURES,
  ...POLITICAL_ACTIONS,
  ...INSTITUTIONAL_NOISE,
  ...OPINION_MARKERS
];

// OUTBREAK INDICATORS - REQUIRED for acceptance
const CASE_INDICATORS = [
  "cases", "case", "infections", "infection", "infected",
  "patients", "patient", "sick", "ill", "illness",
  "hospitalized", "hospitalised", "admitted", "admission",
  "diagnosed", "diagnosis", "confirmed case", "confirmed cases",
  "suspected case", "suspected cases", "probable case",
  "positive", "tested positive", "test positive"
];

const DEATH_INDICATORS = [
  "deaths", "death", "died", "dead", "dying",
  "fatalities", "fatality", "fatal", "mortality",
  "killed", "kills", "claimed lives", "lost lives",
  "death toll", "body count", "corpses"
];

const OUTBREAK_LANGUAGE = [
  "outbreak", "outbreaks", "epidemic", "epidemics",
  "pandemic", "endemic", "surge", "surges", "surging",
  "spike", "spikes", "spiking", "uptick",
  "cluster", "clusters", "clustering",
  "spreading", "spread", "spreads", "transmission",
  "detected", "detection", "reported", "reports",
  "emerged", "emerging", "emergence",
  "resurgence", "resurging", "wave", "new wave"
];

// HEALTHCARE STRAIN - Accept even without named disease
const HEALTHCARE_STRAIN = [
  "hospitals overwhelmed", "hospital overwhelmed", "overwhelmed",
  "wards full", "ward full", "beds full", "no beds",
  "shortage of beds", "bed shortage", "at capacity",
  "healthcare workers infected", "health workers infected",
  "medical staff infected", "doctors infected", "nurses infected",
  "icu full", "icu capacity", "ventilator shortage",
  "morgue full", "morgues full", "overwhelmed morgue",
  "emergency response", "rapid response", "response team",
  "quarantine", "quarantined", "isolation", "isolated",
  "lockdown", "containment", "contact tracing",
  "stretched thin", "under pressure", "overburdened"
];

// SYMPTOM CLUSTERS - For unknown disease detection
const SYMPTOM_INDICATORS = [
  "fever", "fevers", "high fever",
  "bleeding", "hemorrhage", "hemorrhagic",
  "vomiting", "vomit", "diarrhea", "diarrhoea",
  "rash", "rashes", "lesions", "sores",
  "cough", "coughing", "respiratory",
  "paralysis", "paralyzed", "weakness",
  "seizures", "convulsions",
  "jaundice", "yellow eyes",
  "dehydration", "dehydrated"
];

// ALL OUTBREAK INDICATORS COMBINED
const ALL_OUTBREAK_INDICATORS = [
  ...CASE_INDICATORS,
  ...DEATH_INDICATORS,
  ...OUTBREAK_LANGUAGE,
  ...SYMPTOM_INDICATORS
];

// MULTILINGUAL OUTBREAK INDICATORS - For grassroots signals
const REQUIRED_OUTBREAK_INDICATORS_MULTILINGUAL: Record<string, string[]> = {
  en: [...CASE_INDICATORS, ...DEATH_INDICATORS, ...OUTBREAK_LANGUAGE],
  ha: [
    "annobar", "masu fama", "mutuwa", "kamuwa", "asibiti", "marasa lafiya",
    "tabbatacce", "yadu", "tsanani", "keɓewa", "mace", "cututtuka"
  ],
  yo: [
    "ajakale", "olugbẹ", "iku", "akoran", "ile-iwosan", "alaisan",
    "jẹrisi", "ntan", "pajawiri", "ya sọtọ", "àrùn"
  ],
  sw: [
    "mlipuko", "wagonjwa", "vifo", "maambukizi", "hospitalini",
    "kuthibitishwa", "kuenea", "dharura", "karantini", "dalili", "maiti"
  ],
  fr: [
    "épidémie", "cas", "décès", "infectés", "hospitalisés", "patients",
    "confirmés", "suspects", "propagation", "urgence", "quarantaine", "morts"
  ],
  am: [
    "ወረርሽኝ", "ሞት", "በሽታ", "ታማሚዎች", "ሆስፒታል"
  ]
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
  },
  // NEW DISEASES FROM CONFIG
  "pertussis": {
    name: "Pertussis",
    category: "respiratory",
    priority: "P2",
    keywords: {
      en: ["pertussis", "whooping cough", "whooping"],
      ha: ["tarin tari", "cutar tari"],
      yo: ["ikọ́ ikọ́", "àrùn ikọ́"],
      sw: ["kifaduro", "kikohozi cha mvua"]
    }
  },
  "tetanus": {
    name: "Neonatal tetanus",
    category: "vaccine_preventable",
    priority: "P1",
    keywords: {
      en: ["tetanus", "neonatal tetanus", "lockjaw", "trismus"],
      ha: ["cutar taurin baki", "karya baki"],
      yo: ["àrùn ẹnu dídí"],
      sw: ["pepopunda", "kifafa cha wachanga"]
    }
  },
  "leishmaniasis": {
    name: "Leishmaniasis",
    category: "vector_borne",
    priority: "P2",
    keywords: {
      en: ["leishmaniasis", "kala-azar", "visceral leishmaniasis", "cutaneous"],
      ha: ["kala-azar", "cutar kala-azar"],
      yo: ["àrùn kala-azar"],
      sw: ["kala-azar", "usubi"]
    }
  },
  "leptospirosis": {
    name: "Leptospirosis",
    category: "zoonotic",
    priority: "P2",
    keywords: {
      en: ["leptospirosis", "weil's disease", "rat fever"],
      ha: ["cutar bera", "zazzabin bera"],
      yo: ["àrùn eku"],
      sw: ["homa ya panya", "leptospirosis"]
    }
  },
  "qfever": {
    name: "Q fever",
    category: "zoonotic",
    priority: "P2",
    keywords: {
      en: ["q fever", "query fever", "coxiella"],
      ha: ["zazzabin q"],
      yo: ["ibà q"],
      sw: ["homa ya q"]
    }
  },
  "typhus": {
    name: "Typhus",
    category: "vector_borne",
    priority: "P2",
    keywords: {
      en: ["typhus", "epidemic typhus", "murine typhus", "scrub typhus"],
      ha: ["zazzabin typhus"],
      yo: ["ibà typhus"],
      sw: ["homa ya chawa"]
    }
  },
  "hiv": {
    name: "HIV/AIDS",
    category: "respiratory",  // Using 'respiratory' as proxy for 'chronic'
    priority: "P3",
    keywords: {
      en: ["hiv", "aids", "human immunodeficiency"],
      ha: ["cutar kanjamau", "hiv"],
      yo: ["àrùn kòkòrò hiv", "arun kogbogun"],
      sw: ["virusi vya ukimwi", "ukimwi"]
    }
  },
  "chikungunya": {
    name: "Chikungunya",
    category: "vector_borne",
    priority: "P2",
    keywords: {
      en: ["chikungunya", "chik", "joint fever"],
      ha: ["zazzabin chikungunya"],
      yo: ["ibà chikungunya"],
      sw: ["homa ya chikungunya", "chikungunya"]
    }
  },
  "diphtheria": {
    name: "Diphtheria",
    category: "vaccine_preventable",
    priority: "P1",
    keywords: {
      en: ["diphtheria", "corynebacterium"],
      ha: ["cutar makogwaro"],
      yo: ["àrùn ọ̀fun"],
      sw: ["dondakoo", "diphtheria"]
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

// NON-AFRICAN COUNTRIES - Explicit blocklist for signals that slip through
const NON_AFRICAN_COUNTRIES = [
  "afghanistan", "albania", "argentina", "armenia", "australia", "austria", "azerbaijan",
  "bahrain", "bangladesh", "belarus", "belgium", "bhutan", "bolivia", "bosnia", "brazil",
  "brunei", "bulgaria", "cambodia", "canada", "chile", "china", "colombia", "costa rica",
  "croatia", "cuba", "cyprus", "czech", "denmark", "dominican", "ecuador", "el salvador",
  "estonia", "fiji", "finland", "france", "georgia", "germany", "greece", "guatemala",
  "haiti", "honduras", "hong kong", "hungary", "iceland", "india", "indonesia", "iran",
  "iraq", "ireland", "israel", "italy", "jamaica", "japan", "jordan", "kazakhstan",
  "korea", "north korea", "south korea", "kosovo", "kuwait", "kyrgyzstan", "laos",
  "latvia", "lebanon", "liechtenstein", "lithuania", "luxembourg", "macau", "malaysia",
  "maldives", "malta", "mexico", "moldova", "monaco", "mongolia", "montenegro", "myanmar",
  "nepal", "netherlands", "new zealand", "nicaragua", "norway", "oman", "pakistan",
  "palestine", "panama", "papua new guinea", "paraguay", "peru", "philippines", "poland",
  "portugal", "qatar", "romania", "russia", "russian", "saudi", "saudi arabia", "serbia",
  "singapore", "slovakia", "slovenia", "spain", "sri lanka", "sweden", "switzerland",
  "syria", "taiwan", "tajikistan", "thailand", "turkey", "turkmenistan", "ukraine",
  "united arab emirates", "uae", "united kingdom", "uk", "england", "scotland", "wales",
  "united states", "usa", "u.s.", "america", "american", "uruguay", "uzbekistan",
  "venezuela", "vietnam", "yemen"
];

// Check if text is primarily about a non-African country
function isPrimaryNonAfricanSubject(text: string): boolean {
  const lowerText = text.toLowerCase();

  // Check if any non-African country appears BEFORE any African country
  let firstNonAfricanPos = Infinity;
  let firstAfricanPos = Infinity;

  for (const country of NON_AFRICAN_COUNTRIES) {
    const pos = lowerText.indexOf(country);
    if (pos !== -1 && pos < firstNonAfricanPos) {
      firstNonAfricanPos = pos;
    }
  }

  for (const name of Object.keys(COUNTRY_NAME_TO_ISO3)) {
    const pos = lowerText.indexOf(name);
    if (pos !== -1 && pos < firstAfricanPos) {
      firstAfricanPos = pos;
    }
  }

  // If non-African country appears first in headline, it's the primary subject
  if (firstNonAfricanPos < firstAfricanPos && firstNonAfricanPos < 100) {
    return true;
  }

  // Also check for possessive form (e.g., "Bangladesh's")
  for (const country of NON_AFRICAN_COUNTRIES) {
    if (lowerText.includes(`${country}'s `) || lowerText.includes(`${country}n `)) {
      // Check if this appears before position 50 (likely in headline)
      const pos = lowerText.indexOf(country);
      if (pos < 50) {
        return true;
      }
    }
  }

  return false;
}

function extractCountryISO3(text: string): string | null {
  const lowerText = text.toLowerCase();

  // FIRST: Check if this is primarily about a non-African country
  if (isPrimaryNonAfricanSubject(text)) {
    return null;  // Reject - not about Africa
  }

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
// Country to expected languages mapping (for validation)
const COUNTRY_LANGUAGES: Record<string, string[]> = {
  'TCD': ['fr', 'ar'],  // Chad - French/Arabic, NOT Spanish
  'NGA': ['en', 'ha', 'yo', 'ig'],  // Nigeria
  'NER': ['fr', 'ha'],  // Niger
  'SEN': ['fr', 'wo'],  // Senegal
  'GHA': ['en', 'tw'],  // Ghana
  'KEN': ['en', 'sw'],  // Kenya
  'TZA': ['sw', 'en'],  // Tanzania
  'ETH': ['am', 'om', 'en'],  // Ethiopia
  'ERI': ['ti', 'ar'],  // Eritrea
  'DZA': ['ar', 'fr'],  // Algeria
  'MAR': ['ar', 'fr'],  // Morocco
  'TUN': ['ar', 'fr'],  // Tunisia
  'LBY': ['ar'],  // Libya
  'SDN': ['ar'],  // Sudan
  'SSD': ['en', 'ar'],  // South Sudan
  'COD': ['fr', 'ln', 'sw'],  // DRC
  'COG': ['fr', 'ln'],  // Congo
  'CMR': ['fr', 'en'],  // Cameroon
  'CAF': ['fr'],  // Central African Republic
  'AGO': ['pt'],  // Angola
  'MOZ': ['pt'],  // Mozambique
  'GNB': ['pt'],  // Guinea-Bissau
  'CPV': ['pt'],  // Cape Verde
  'STP': ['pt'],  // Sao Tome
  'RWA': ['rw', 'fr', 'en'],  // Rwanda
  'BDI': ['rw', 'fr'],  // Burundi
  'UGA': ['en', 'sw'],  // Uganda
  'ZAF': ['en', 'zu', 'xh'],  // South Africa
  'ZWE': ['en', 'sn'],  // Zimbabwe
  'ZMB': ['en'],  // Zambia
  'MWI': ['en', 'ny'],  // Malawi
  'MDG': ['mg', 'fr'],  // Madagascar
  'MLI': ['fr', 'ff'],  // Mali
  'BFA': ['fr'],  // Burkina Faso
  'CIV': ['fr'],  // Ivory Coast
  'TGO': ['fr'],  // Togo
  'BEN': ['fr', 'yo'],  // Benin
  'GIN': ['fr'],  // Guinea
  'SLE': ['en'],  // Sierra Leone
  'LBR': ['en'],  // Liberia
  'GMB': ['en', 'wo'],  // Gambia
  'MRT': ['ar', 'fr'],  // Mauritania
};

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

// Infer language from country when article language is wrong (e.g. Spanish for Chad)
function inferLanguageFromCountry(
  detectedLang: string,
  countryISO3: string,
  articleLang?: string
): string {
  const expectedLangs = COUNTRY_LANGUAGES[countryISO3] || ['en'];

  // If detected language matches expected, use it
  if (expectedLangs.includes(detectedLang)) {
    return detectedLang;
  }

  // If article language matches expected, use it
  if (articleLang && expectedLangs.includes(articleLang)) {
    return articleLang;
  }

  // If both detected and article are NOT expected for this country,
  // use the first expected language (most likely lingua franca)
  // This fixes: Chad getting "Spanish" from diariosur.es
  if (articleLang && !expectedLangs.includes(articleLang) && !expectedLangs.includes(detectedLang)) {
    console.log(`Language override: ${countryISO3} detected "${articleLang}" -> using "${expectedLangs[0]}"`);
    return expectedLangs[0];
  }

  // Default: use detected if African language, otherwise article, otherwise expected
  if (['ha', 'yo', 'sw', 'am', 'ig', 'wo', 'ff', 'ar', 'fr', 'pt'].includes(detectedLang)) {
    return detectedLang;
  }

  return articleLang || expectedLangs[0] || 'en';
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

// =====================================================
// 🔥 SURGICAL NOISE FILTER FUNCTIONS - v2.0
// Multi-step filtering with word boundary matching
// =====================================================

// Find all matches with word boundary matching for accuracy
function findMatches(text: string, keywords: string[]): string[] {
  const textLower = text.toLowerCase();
  return keywords.filter(kw => {
    // Escape special regex characters and use word boundaries
    const pattern = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    return pattern.test(textLower);
  });
}

// Check if text contains POLITICAL NOISE keywords
function containsPoliticalNoise(text: string): { hasPolitical: boolean; matches: string[] } {
  const matches = findMatches(text, ALL_POLITICAL_NOISE);
  return { hasPolitical: matches.length > 0, matches };
}

// Check if text contains FUNDING NOISE without outbreak context
function containsFundingNoise(text: string): { hasFunding: boolean; matches: string[] } {
  const matches = findMatches(text, FUNDING_NOISE);
  return { hasFunding: matches.length > 0, matches };
}

// Check if text contains OUTBREAK INDICATORS
function containsOutbreakIndicators(text: string): { hasOutbreak: boolean; matches: string[]; hasNumbers: boolean } {
  const textLower = text.toLowerCase();
  const matches = findMatches(text, ALL_OUTBREAK_INDICATORS);

  // Also check for multilingual indicators
  for (const [_lang, indicators] of Object.entries(REQUIRED_OUTBREAK_INDICATORS_MULTILINGUAL)) {
    for (const indicator of indicators) {
      if (textLower.includes(indicator.toLowerCase()) && !matches.includes(indicator)) {
        matches.push(indicator);
      }
    }
  }

  // Check for numbers associated with cases/deaths
  const hasNumbers = /\b(\d+)\s*(cases?|deaths?|infected|patients?|killed|died|fatalities)\b/i.test(text);

  return { hasOutbreak: matches.length > 0, matches, hasNumbers };
}

// Check for HEALTHCARE STRAIN signals
function containsHealthcareStrain(text: string): { hasStrain: boolean; matches: string[] } {
  const matches = findMatches(text, HEALTHCARE_STRAIN);
  return { hasStrain: matches.length > 0, matches };
}

// Check for SYMPTOM CLUSTERS (possible unknown outbreak)
function containsSymptomCluster(text: string): { hasSymptoms: boolean; matches: string[] } {
  const matches = findMatches(text, SYMPTOM_INDICATORS);
  return { hasSymptoms: matches.length >= 2, matches }; // Need 2+ symptoms
}

// 🔥 MAIN SURGICAL FILTER - Multi-step validation
function isValidOutbreakSignal(text: string): {
  valid: boolean;
  reason: string;
  matchedIndicators?: string[];
  filterStage?: string;
} {
  if (!text || text.trim().length < 10) {
    return { valid: false, reason: 'Signal too short or empty', filterStage: 'length' };
  }

  // ━━━ 🌐 GEOGRAPHIC SOVEREIGNTY CHECK ━━━
  // Strictly enforce African focus (54 countries)
  const countryISO3 = extractCountryISO3(text);
  if (!countryISO3 || !AFRO_COUNTRIES.includes(countryISO3)) {
    return {
      valid: false,
      reason: 'Non-African or ambiguous geographic context (Strict 54-country filter)',
      filterStage: 'geography'
    };
  }

  // ━━━ STEP 1: Check for POLITICAL NOISE ━━━
  const politicalCheck = containsPoliticalNoise(text);
  if (politicalCheck.hasPolitical) {
    // But check if there are STRONG outbreak indicators that override
    const outbreakCheck = containsOutbreakIndicators(text);

    // Political content WITHOUT strong outbreak evidence = REJECT
    if (!outbreakCheck.hasOutbreak || !outbreakCheck.hasNumbers) {
      return {
        valid: false,
        reason: `Political noise without outbreak indicators: ${politicalCheck.matches.slice(0, 3).join(', ')}`,
        filterStage: 'political'
      };
    }
  }

  // ━━━ STEP 2: Check for FUNDING/BUDGET NOISE ━━━
  const fundingCheck = containsFundingNoise(text);
  if (fundingCheck.hasFunding) {
    const outbreakCheck = containsOutbreakIndicators(text);
    // Funding news WITHOUT outbreak context = REJECT
    if (!outbreakCheck.hasOutbreak) {
      return {
        valid: false,
        reason: `Funding/policy news without disease outbreak context`,
        filterStage: 'funding'
      };
    }
  }

  // ━━━ STEP 3: REQUIRE OUTBREAK INDICATORS ━━━
  const outbreakCheck = containsOutbreakIndicators(text);

  // ━━━ STEP 4: Check for HEALTHCARE STRAIN (special case) ━━━
  const strainCheck = containsHealthcareStrain(text);
  if (strainCheck.hasStrain) {
    return {
      valid: true,
      reason: '⚠️ Healthcare strain signal - hospitals/system under pressure',
      matchedIndicators: strainCheck.matches,
      filterStage: 'healthcare_strain'
    };
  }

  // ━━━ STEP 5: Check for SYMPTOM CLUSTERS (unknown outbreak) ━━━
  const symptomCheck = containsSymptomCluster(text);
  if (symptomCheck.hasSymptoms) {
    return {
      valid: true,
      reason: '⚠️ Symptom cluster detected - possible unknown illness',
      matchedIndicators: symptomCheck.matches,
      filterStage: 'symptom_cluster'
    };
  }

  // ━━━ STEP 6: Standard outbreak indicator check ━━━
  if (!outbreakCheck.hasOutbreak) {
    return {
      valid: false,
      reason: 'No outbreak indicators found (cases, deaths, symptoms, etc.)',
      filterStage: 'no_indicators'
    };
  }

  // ✅ SIGNAL IS VALID
  return {
    valid: true,
    reason: '✅ Valid outbreak signal (African context verified)',
    matchedIndicators: outbreakCheck.matches,
    filterStage: 'accepted'
  };
}

// Stricter Quality Filter for AI avoidance
function isHighQualitySignal(signal: any): boolean {
  // Reject signals from news aggregators if they don't have a disease name already
  if (signal.source_tier === 'tier_3' && !signal.disease_name) {
    return false;
  }

  // Require at least one specific disease match or high confidence indicator for P3/P4 sources
  if (signal.source_tier !== 'tier_1' && !signal.disease_name) {
    const text = signal.original_text.toLowerCase();
    const highIntensityKeywords = ['death', 'died', 'killed', 'fatal', 'outbreak', 'epidemic', 'emergency'];
    return highIntensityKeywords.some(kw => text.includes(kw));
  }

  return true;
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
          original_language: inferLanguageFromCountry(langDetection.code, countryISO3, article.language),
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

// Fetch from ReliefWeb API (simple approach)
async function fetchReliefWeb(): Promise<any[]> {
  const signals: any[] = [];

  try {
    // Use simplest possible query format
    const baseUrl = new URL('https://api.reliefweb.int/v1/reports');
    baseUrl.searchParams.set('appname', 'afro-sentinel');
    baseUrl.searchParams.set('preset', 'latest');
    baseUrl.searchParams.set('limit', '30');

    const response = await fetch(baseUrl.toString(), {
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      console.log('ReliefWeb failed:', response.status, await response.text().catch(() => ''));
      return signals;
    }

    const data = await response.json();
    const reports = data.data || [];

    for (const report of reports) {
      const fields = report.fields || {};
      const country = fields.primary_country;
      const countryISO3 = country?.iso3;

      if (!countryISO3 || !AFRO_COUNTRIES.includes(countryISO3)) continue;

      const title = fields.title || '';

      // Filter for health-related content
      const healthKeywords = ['health', 'disease', 'outbreak', 'epidemic', 'cholera', 'measles', 'malaria', 'ebola', 'marburg', 'mpox'];
      const hasHealth = healthKeywords.some(kw => title.toLowerCase().includes(kw));
      if (!hasHealth) continue;

      const multilingualDiseaseInfo = detectDiseaseMultilingual(title);
      const diseaseInfo = multilingualDiseaseInfo || detectDisease(title);

      const langDetection = detectLanguage(title);
      const sourceTier = 'tier_1';

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
        source_url: fields.url || `https://reliefweb.int/node/${report.id}`,
        source_type: 'official',
        source_tier: sourceTier,
        original_text: title,
        original_language: langDetection.code !== 'en' ? langDetection.code : (fields.language?.[0]?.code || 'en'),
        location_country: country?.name || countryISO3,
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

// Fetch from AllAfrica Health News (fixed endpoint)
async function fetchAllAfrica(): Promise<any[]> {
  const signals: any[] = [];

  try {
    // Fixed URL - use the main RSS feed
    const url = 'https://allafrica.com/tools/headlines/rdf/latest/headlines.rdf';
    const response = await fetch(url, {
      headers: { 'User-Agent': 'AFRO-Sentinel-Watchtower/1.0' }
    });

    if (!response.ok) {
      // Fallback to atom feed
      const atomUrl = 'https://allafrica.com/tools/headlines/atom/health/headlines.xml';
      const atomResponse = await fetch(atomUrl, {
        headers: { 'User-Agent': 'AFRO-Sentinel-Watchtower/1.0' }
      });

      if (!atomResponse.ok) {
        console.log('AllAfrica all endpoints failed:', response.status, atomResponse.status);
        return signals;
      }

      const atomText = await atomResponse.text();
      const entries = atomText.match(/<entry>[\s\S]*?<\/entry>/g) || [];

      for (const entry of entries.slice(0, 20)) {
        const titleMatch = entry.match(/<title[^>]*>([^<]+)<\/title>/);
        const linkMatch = entry.match(/<link[^>]*href="([^"]+)"/);
        const dateMatch = entry.match(/<updated>([^<]+)<\/updated>/);

        if (!titleMatch) continue;

        const title = titleMatch[1];
        const countryISO3 = extractCountryISO3(title);

        if (!countryISO3 || !AFRO_COUNTRIES.includes(countryISO3)) continue;

        const multilingualDiseaseInfo = detectDiseaseMultilingual(title);
        const diseaseInfo = multilingualDiseaseInfo || detectDisease(title);

        const healthKeywords = ['health', 'disease', 'outbreak', 'epidemic', 'cholera', 'malaria', 'fever', 'hospital', 'death', 'cases'];
        const hasHealth = healthKeywords.some(kw => title.toLowerCase().includes(kw)) || diseaseInfo;
        if (!hasHealth) continue;

        const langDetection = detectLanguage(title);

        signals.push({
          source_id: 'ALLAFRICA',
          source_name: 'AllAfrica',
          source_url: linkMatch?.[1] || 'https://allafrica.com',
          source_type: 'news',
          source_tier: 'tier_2',
          original_text: title,
          original_language: langDetection.code,
          location_country: Object.entries(COUNTRY_NAME_TO_ISO3).find(([_, iso]) => iso === countryISO3)?.[0] || countryISO3,
          location_country_iso: countryISO3,
          location_lat: COUNTRY_COORDS[countryISO3]?.lat || null,
          location_lng: COUNTRY_COORDS[countryISO3]?.lng || null,
          disease_name: diseaseInfo?.name || null,
          disease_category: diseaseInfo?.category || 'unknown',
          priority: diseaseInfo?.priority || 'P3',
          source_timestamp: dateMatch?.[1] || new Date().toISOString(),
          confidence_score: 70,
          signal_type: 'media_report',
          status: 'new',
          ingestion_source: 'ALLAFRICA-HEALTH',
          duplicate_hash: generateHash(linkMatch?.[1] || title),
        });
      }
      return signals;
    }

    const xmlText = await response.text();

    // Simple XML parsing for RSS items
    const items = xmlText.match(/<item[^>]*>[\s\S]*?<\/item>/g) || [];

    for (const item of items.slice(0, 20)) {
      const titleMatch = item.match(/<title>([^<]+)<\/title>/);
      const linkMatch = item.match(/<link>([^<]+)<\/link>/);
      const dateMatch = item.match(/<dc:date>([^<]+)<\/dc:date>/) || item.match(/<pubDate>([^<]+)<\/pubDate>/);

      if (!titleMatch) continue;

      const title = titleMatch[1];
      const countryISO3 = extractCountryISO3(title);

      if (!countryISO3 || !AFRO_COUNTRIES.includes(countryISO3)) continue;

      const multilingualDiseaseInfo = detectDiseaseMultilingual(title);
      const diseaseInfo = multilingualDiseaseInfo || detectDisease(title);

      const healthKeywords = ['health', 'disease', 'outbreak', 'epidemic', 'cholera', 'malaria', 'fever', 'hospital', 'death', 'cases'];
      const hasHealth = healthKeywords.some(kw => title.toLowerCase().includes(kw)) || diseaseInfo;
      if (!hasHealth) continue;

      const langDetection = detectLanguage(title);
      const sourceTier = 'tier_2';

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

  const systemPrompt = `You are an epidemiologist analyzing disease outbreak signals from Africa.

CRITICAL FILTER: REJECT any content that is:
- Political news (government decisions, policy changes, WHO membership/funding discussions)
- Administrative health news (hospital funding, healthcare reform, medical education)
- General news mentioning health topics without actual disease cases/deaths
- Conference announcements, research papers, or clinical trial news

ONLY ACCEPT signals about ACTUAL disease outbreaks with:
- Confirmed or suspected cases of illness
- Deaths from disease
- Ongoing transmission or spread
- Active public health emergencies

If the text is about policy/politics/administration rather than an actual outbreak, return:
{"is_outbreak": false, "rejection_reason": "policy/political content"}

For valid outbreak signals, extract and return JSON:
{
  "is_outbreak": true,
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

// =====================================================
// GRASSROOTS SIGNAL SOURCES - NO API KEYS REQUIRED
// BBC Language Services + African News Aggregators + Local Newspapers
// =====================================================

// Fetch from BBC Hausa (Nigeria, Niger, Cameroon)
async function fetchBBCHausa(): Promise<any[]> {
  const signals: any[] = [];

  try {
    const url = 'https://feeds.bbci.co.uk/hausa/rss.xml';
    const response = await fetch(url, {
      headers: { 'User-Agent': 'AFRO-Sentinel-Watchtower/1.0' }
    });

    if (!response.ok) {
      console.log('BBC Hausa failed:', response.status);
      return signals;
    }

    const xmlText = await response.text();
    const items = xmlText.match(/<item>[\s\S]*?<\/item>/g) || [];

    for (const item of items.slice(0, 25)) {
      const titleMatch = item.match(/<title>(?:<!\[CDATA\[)?([^\]<]+)(?:\]\]>)?<\/title>/);
      const linkMatch = item.match(/<link>([^<]+)<\/link>/);
      const descMatch = item.match(/<description>(?:<!\[CDATA\[)?([^\]<]+)(?:\]\]>)?<\/description>/);
      const dateMatch = item.match(/<pubDate>([^<]+)<\/pubDate>/);

      if (!titleMatch) continue;

      const title = titleMatch[1].replace(/&amp;/g, '&');
      const description = descMatch?.[1] || '';
      const fullText = `${title} ${description}`;

      // Filter for health-related content
      const multilingualDiseaseInfo = detectDiseaseMultilingual(fullText);
      const diseaseInfo = multilingualDiseaseInfo || detectDisease(fullText);

      // Also check for health keywords in Hausa
      const healthKeywords = ['lafiya', 'cuta', 'asibiti', 'likita', 'maganin', 'annoba', 'zazzabi', 'mutuwa', 'rashin lafiya'];
      const hasHealthContent = healthKeywords.some(kw => fullText.toLowerCase().includes(kw)) || diseaseInfo;

      if (!hasHealthContent) continue;

      const countryISO3 = extractCountryISO3(fullText) || 'NGA'; // Default to Nigeria for BBC Hausa

      const linguaTrustScore = calculateLinguaTrustScore('ha', countryISO3, 'tier_2', multilingualDiseaseInfo?.matched_keywords?.length || 0);

      signals.push({
        source_id: 'BBC_HAUSA',
        source_name: 'BBC Hausa',
        source_url: linkMatch?.[1] || 'https://www.bbc.com/hausa',
        source_type: 'media',
        source_tier: 'tier_2',
        original_text: title,
        translated_text: null, // Will be translated by AI
        original_language: 'ha',
        original_script: 'latin',
        location_country: Object.entries(COUNTRY_NAME_TO_ISO3).find(([_, iso]) => iso === countryISO3)?.[0] || 'Nigeria',
        location_country_iso: countryISO3,
        location_lat: COUNTRY_COORDS[countryISO3]?.lat || null,
        location_lng: COUNTRY_COORDS[countryISO3]?.lng || null,
        disease_name: diseaseInfo?.name || null,
        disease_category: diseaseInfo?.category || 'unknown',
        priority: diseaseInfo?.priority || 'P3',
        source_timestamp: dateMatch?.[1] ? new Date(dateMatch[1]).toISOString() : new Date().toISOString(),
        confidence_score: 70,
        lingua_fidelity_score: linguaTrustScore,
        signal_type: 'community_report',
        status: 'new',
        ingestion_source: 'BBC-HAUSA-RSS',
        duplicate_hash: generateHash(linkMatch?.[1] || title),
      });
    }
  } catch (error) {
    console.error('BBC Hausa error:', error);
  }

  return signals;
}

// Fetch from BBC Swahili (Kenya, Tanzania, DRC, Uganda)
async function fetchBBCSwahili(): Promise<any[]> {
  const signals: any[] = [];

  try {
    const url = 'https://feeds.bbci.co.uk/swahili/rss.xml';
    const response = await fetch(url, {
      headers: { 'User-Agent': 'AFRO-Sentinel-Watchtower/1.0' }
    });

    if (!response.ok) {
      console.log('BBC Swahili failed:', response.status);
      return signals;
    }

    const xmlText = await response.text();
    const items = xmlText.match(/<item>[\s\S]*?<\/item>/g) || [];

    for (const item of items.slice(0, 25)) {
      const titleMatch = item.match(/<title>(?:<!\[CDATA\[)?([^\]<]+)(?:\]\]>)?<\/title>/);
      const linkMatch = item.match(/<link>([^<]+)<\/link>/);
      const dateMatch = item.match(/<pubDate>([^<]+)<\/pubDate>/);

      if (!titleMatch) continue;

      const title = titleMatch[1].replace(/&amp;/g, '&');
      const fullText = title;

      const multilingualDiseaseInfo = detectDiseaseMultilingual(fullText);
      const diseaseInfo = multilingualDiseaseInfo || detectDisease(fullText);

      // Swahili health keywords
      const healthKeywords = ['afya', 'ugonjwa', 'hospitali', 'daktari', 'homa', 'vifo', 'mlipuko', 'kipindupindu', 'malaria'];
      const hasHealthContent = healthKeywords.some(kw => fullText.toLowerCase().includes(kw)) || diseaseInfo;

      if (!hasHealthContent) continue;

      const countryISO3 = extractCountryISO3(fullText) || 'KEN'; // Default to Kenya
      const linguaTrustScore = calculateLinguaTrustScore('sw', countryISO3, 'tier_2', multilingualDiseaseInfo?.matched_keywords?.length || 0);

      signals.push({
        source_id: 'BBC_SWAHILI',
        source_name: 'BBC Swahili',
        source_url: linkMatch?.[1] || 'https://www.bbc.com/swahili',
        source_type: 'media',
        source_tier: 'tier_2',
        original_text: title,
        original_language: 'sw',
        original_script: 'latin',
        location_country: Object.entries(COUNTRY_NAME_TO_ISO3).find(([_, iso]) => iso === countryISO3)?.[0] || 'Kenya',
        location_country_iso: countryISO3,
        location_lat: COUNTRY_COORDS[countryISO3]?.lat || null,
        location_lng: COUNTRY_COORDS[countryISO3]?.lng || null,
        disease_name: diseaseInfo?.name || null,
        disease_category: diseaseInfo?.category || 'unknown',
        priority: diseaseInfo?.priority || 'P3',
        source_timestamp: dateMatch?.[1] ? new Date(dateMatch[1]).toISOString() : new Date().toISOString(),
        confidence_score: 70,
        lingua_fidelity_score: linguaTrustScore,
        signal_type: 'community_report',
        status: 'new',
        ingestion_source: 'BBC-SWAHILI-RSS',
        duplicate_hash: generateHash(linkMatch?.[1] || title),
      });
    }
  } catch (error) {
    console.error('BBC Swahili error:', error);
  }

  return signals;
}

// Fetch from BBC Amharic (Ethiopia)
async function fetchBBCAmharic(): Promise<any[]> {
  const signals: any[] = [];

  try {
    const url = 'https://feeds.bbci.co.uk/amharic/rss.xml';
    const response = await fetch(url, {
      headers: { 'User-Agent': 'AFRO-Sentinel-Watchtower/1.0' }
    });

    if (!response.ok) {
      console.log('BBC Amharic failed:', response.status);
      return signals;
    }

    const xmlText = await response.text();
    const items = xmlText.match(/<item>[\s\S]*?<\/item>/g) || [];

    for (const item of items.slice(0, 25)) {
      const titleMatch = item.match(/<title>(?:<!\[CDATA\[)?([^\]<]+)(?:\]\]>)?<\/title>/);
      const linkMatch = item.match(/<link>([^<]+)<\/link>/);
      const dateMatch = item.match(/<pubDate>([^<]+)<\/pubDate>/);

      if (!titleMatch) continue;

      const title = titleMatch[1];
      const fullText = title;

      const multilingualDiseaseInfo = detectDiseaseMultilingual(fullText);
      const diseaseInfo = multilingualDiseaseInfo || detectDisease(fullText);

      // Amharic health keywords (Ge'ez script)
      const healthKeywords = ['ጤና', 'በሽታ', 'ሆስፒታል', 'ዶክተር', 'ትኩሳት', 'ሞት', 'ወረርሽኝ', 'ኮሌራ'];
      const hasHealthContent = healthKeywords.some(kw => fullText.includes(kw)) || diseaseInfo;

      if (!hasHealthContent) continue;

      const countryISO3 = extractCountryISO3(fullText) || 'ETH';
      const linguaTrustScore = calculateLinguaTrustScore('am', countryISO3, 'tier_2', multilingualDiseaseInfo?.matched_keywords?.length || 0);

      signals.push({
        source_id: 'BBC_AMHARIC',
        source_name: 'BBC Amharic',
        source_url: linkMatch?.[1] || 'https://www.bbc.com/amharic',
        source_type: 'media',
        source_tier: 'tier_2',
        original_text: title,
        original_language: 'am',
        original_script: 'geez',
        location_country: 'Ethiopia',
        location_country_iso: countryISO3,
        location_lat: COUNTRY_COORDS[countryISO3]?.lat || null,
        location_lng: COUNTRY_COORDS[countryISO3]?.lng || null,
        disease_name: diseaseInfo?.name || null,
        disease_category: diseaseInfo?.category || 'unknown',
        priority: diseaseInfo?.priority || 'P3',
        source_timestamp: dateMatch?.[1] ? new Date(dateMatch[1]).toISOString() : new Date().toISOString(),
        confidence_score: 70,
        lingua_fidelity_score: linguaTrustScore,
        signal_type: 'community_report',
        status: 'new',
        ingestion_source: 'BBC-AMHARIC-RSS',
        duplicate_hash: generateHash(linkMatch?.[1] || title),
      });
    }
  } catch (error) {
    console.error('BBC Amharic error:', error);
  }

  return signals;
}

// Fetch from Sahara Reporters (Nigeria - unfiltered grassroots)
async function fetchSaharaReporters(): Promise<any[]> {
  const signals: any[] = [];

  try {
    const url = 'https://saharareporters.com/articles/rss-feed';
    const response = await fetch(url, {
      headers: { 'User-Agent': 'AFRO-Sentinel-Watchtower/1.0' }
    });

    if (!response.ok) {
      console.log('Sahara Reporters failed:', response.status);
      return signals;
    }

    const xmlText = await response.text();
    const items = xmlText.match(/<item>[\s\S]*?<\/item>/g) || [];

    for (const item of items.slice(0, 30)) {
      const titleMatch = item.match(/<title>(?:<!\[CDATA\[)?([^\]<]+)(?:\]\]>)?<\/title>/);
      const linkMatch = item.match(/<link>([^<]+)<\/link>/);
      const dateMatch = item.match(/<pubDate>([^<]+)<\/pubDate>/);

      if (!titleMatch) continue;

      const title = titleMatch[1].replace(/&amp;/g, '&');
      const fullText = title;

      const multilingualDiseaseInfo = detectDiseaseMultilingual(fullText);
      const diseaseInfo = multilingualDiseaseInfo || detectDisease(fullText);

      // Health/outbreak keywords
      const healthKeywords = ['disease', 'outbreak', 'death', 'hospital', 'epidemic', 'cholera', 'fever', 'health', 'virus', 'infection', 'cases', 'died'];
      const hasHealthContent = healthKeywords.some(kw => fullText.toLowerCase().includes(kw)) || diseaseInfo;

      if (!hasHealthContent) continue;

      const countryISO3 = extractCountryISO3(fullText) || 'NGA';
      const langDetection = detectLanguage(fullText);

      signals.push({
        source_id: 'SAHARA_REPORTERS',
        source_name: 'Sahara Reporters',
        source_url: linkMatch?.[1] || 'https://saharareporters.com',
        source_type: 'media',
        source_tier: 'tier_3', // Community/citizen journalism
        original_text: title,
        original_language: langDetection.code,
        location_country: 'Nigeria',
        location_country_iso: countryISO3,
        location_lat: COUNTRY_COORDS[countryISO3]?.lat || null,
        location_lng: COUNTRY_COORDS[countryISO3]?.lng || null,
        disease_name: diseaseInfo?.name || null,
        disease_category: diseaseInfo?.category || 'unknown',
        priority: diseaseInfo?.priority || 'P3',
        source_timestamp: dateMatch?.[1] ? new Date(dateMatch[1]).toISOString() : new Date().toISOString(),
        confidence_score: 60,
        signal_type: 'community_report',
        status: 'new',
        ingestion_source: 'SAHARA-RSS',
        duplicate_hash: generateHash(linkMatch?.[1] || title),
      });
    }
  } catch (error) {
    console.error('Sahara Reporters error:', error);
  }

  return signals;
}

// Fetch from Africa CDC Weekly Bulletins (Official - Tier 1)
async function fetchAfricaCDC(): Promise<any[]> {
  const signals: any[] = [];

  try {
    // Africa CDC bulletin RSS/feed endpoint
    const url = 'https://africacdc.org/feed/';
    const response = await fetch(url, {
      headers: { 'User-Agent': 'AFRO-Sentinel-Watchtower/1.0' }
    });

    if (!response.ok) {
      console.log('Africa CDC failed:', response.status);
      return signals;
    }

    const xmlText = await response.text();
    const items = xmlText.match(/<item>[\s\S]*?<\/item>/g) || [];

    for (const item of items.slice(0, 20)) {
      const titleMatch = item.match(/<title>(?:<!\[CDATA\[)?([^\]<]+)(?:\]\]>)?<\/title>/);
      const linkMatch = item.match(/<link>([^<]+)<\/link>/);
      const descMatch = item.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/);
      const dateMatch = item.match(/<pubDate>([^<]+)<\/pubDate>/);

      if (!titleMatch) continue;

      const title = titleMatch[1].replace(/&amp;/g, '&').replace(/<[^>]*>/g, '');
      const description = descMatch?.[1]?.replace(/<[^>]*>/g, '') || '';
      const fullText = `${title} ${description}`;

      // Filter for outbreak/disease content
      const outbreakKeywords = ['outbreak', 'bulletin', 'mpox', 'cholera', 'ebola', 'marburg', 'yellow fever', 'polio', 'measles', 'cases', 'deaths', 'surveillance', 'alert'];
      const hasOutbreakContent = outbreakKeywords.some(kw => fullText.toLowerCase().includes(kw));

      if (!hasOutbreakContent) continue;

      const multilingualDiseaseInfo = detectDiseaseMultilingual(fullText);
      const diseaseInfo = multilingualDiseaseInfo || detectDisease(fullText);
      const countryISO3 = extractCountryISO3(fullText);

      signals.push({
        source_id: 'AFRICA_CDC',
        source_name: 'Africa CDC',
        source_url: linkMatch?.[1] || 'https://africacdc.org',
        source_type: 'official',
        source_tier: 'tier_1',
        original_text: title.substring(0, 500),
        original_language: 'en',
        location_country: countryISO3 ? (Object.entries(COUNTRY_NAME_TO_ISO3).find(([_, iso]) => iso === countryISO3)?.[0] || 'Africa Region') : 'Africa Region',
        location_country_iso: countryISO3 || null,
        location_lat: countryISO3 ? COUNTRY_COORDS[countryISO3]?.lat : null,
        location_lng: countryISO3 ? COUNTRY_COORDS[countryISO3]?.lng : null,
        disease_name: diseaseInfo?.name || null,
        disease_category: diseaseInfo?.category || 'unknown',
        priority: diseaseInfo?.priority || 'P2',
        source_timestamp: dateMatch?.[1] ? new Date(dateMatch[1]).toISOString() : new Date().toISOString(),
        confidence_score: 95,
        signal_type: 'official_report',
        status: 'new',
        ingestion_source: 'AFRICA-CDC-RSS',
        duplicate_hash: generateHash(linkMatch?.[1] || title),
      });
    }
  } catch (error) {
    console.error('Africa CDC error:', error);
  }

  return signals;
}

// Fetch from APO Group Africa Newsroom (fixed endpoint)
async function fetchAPOAfrica(): Promise<any[]> {
  const signals: any[] = [];

  try {
    // Try the main Africa Newsroom feed
    const url = 'https://www.africa-newsroom.com/press/rss';
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AFRO-Sentinel/1.0)',
        'Accept': 'application/rss+xml, application/xml, text/xml'
      }
    });

    if (!response.ok) {
      // Fallback to APO Group direct
      const altUrl = 'https://www.apo-opa.com/rss/';
      const altResponse = await fetch(altUrl, {
        headers: { 'User-Agent': 'AFRO-Sentinel-Watchtower/1.0' }
      });

      if (!altResponse.ok) {
        console.log('APO Africa all endpoints failed:', response.status);
        return signals;
      }

      const xmlText = await altResponse.text();
      const items = xmlText.match(/<item>[\s\S]*?<\/item>/g) || [];

      for (const item of items.slice(0, 20)) {
        const titleMatch = item.match(/<title>(?:<!\[CDATA\[)?([^\]<]+)(?:\]\]>)?<\/title>/);
        const linkMatch = item.match(/<link>([^<]+)<\/link>/);
        const dateMatch = item.match(/<pubDate>([^<]+)<\/pubDate>/);

        if (!titleMatch) continue;

        const title = titleMatch[1].replace(/&amp;/g, '&');

        const healthKeywords = ['health', 'disease', 'outbreak', 'epidemic', 'hospital', 'WHO', 'Africa CDC', 'cholera', 'malaria'];
        const diseaseInfo = detectDiseaseMultilingual(title) || detectDisease(title);
        const hasHealth = healthKeywords.some(kw => title.toLowerCase().includes(kw.toLowerCase())) || diseaseInfo;

        if (!hasHealth) continue;

        const countryISO3 = extractCountryISO3(title);
        if (!countryISO3 || !AFRO_COUNTRIES.includes(countryISO3)) continue;

        signals.push({
          source_id: 'APO_AFRICA',
          source_name: 'APO Group',
          source_url: linkMatch?.[1] || 'https://www.apo-opa.com',
          source_type: 'official',
          source_tier: 'tier_1',
          original_text: title,
          original_language: 'en',
          location_country: Object.entries(COUNTRY_NAME_TO_ISO3).find(([_, iso]) => iso === countryISO3)?.[0] || countryISO3,
          location_country_iso: countryISO3,
          location_lat: COUNTRY_COORDS[countryISO3]?.lat || null,
          location_lng: COUNTRY_COORDS[countryISO3]?.lng || null,
          disease_name: diseaseInfo?.name || null,
          disease_category: diseaseInfo?.category || 'unknown',
          priority: diseaseInfo?.priority || 'P2',
          source_timestamp: dateMatch?.[1] ? new Date(dateMatch[1]).toISOString() : new Date().toISOString(),
          confidence_score: 85,
          signal_type: 'official_report',
          status: 'new',
          ingestion_source: 'APO-RSS',
          duplicate_hash: generateHash(linkMatch?.[1] || title),
        });
      }
      return signals;
    }

    const xmlText = await response.text();
    const items = xmlText.match(/<item>[\s\S]*?<\/item>/g) || [];

    for (const item of items.slice(0, 20)) {
      const titleMatch = item.match(/<title>(?:<!\[CDATA\[)?([^\]<]+)(?:\]\]>)?<\/title>/);
      const linkMatch = item.match(/<link>([^<]+)<\/link>/);
      const dateMatch = item.match(/<pubDate>([^<]+)<\/pubDate>/);

      if (!titleMatch) continue;

      const title = titleMatch[1].replace(/&amp;/g, '&');

      const healthKeywords = ['health', 'disease', 'outbreak', 'epidemic', 'hospital', 'WHO', 'Africa CDC', 'cholera', 'malaria'];
      const diseaseInfo = detectDiseaseMultilingual(title) || detectDisease(title);
      const hasHealth = healthKeywords.some(kw => title.toLowerCase().includes(kw.toLowerCase())) || diseaseInfo;

      if (!hasHealth) continue;

      const countryISO3 = extractCountryISO3(title);
      if (!countryISO3 || !AFRO_COUNTRIES.includes(countryISO3)) continue;

      signals.push({
        source_id: 'APO_AFRICA',
        source_name: 'Africa Newsroom',
        source_url: linkMatch?.[1] || 'https://www.africa-newsroom.com',
        source_type: 'official',
        source_tier: 'tier_1',
        original_text: title,
        original_language: 'en',
        location_country: Object.entries(COUNTRY_NAME_TO_ISO3).find(([_, iso]) => iso === countryISO3)?.[0] || countryISO3,
        location_country_iso: countryISO3,
        location_lat: COUNTRY_COORDS[countryISO3]?.lat || null,
        location_lng: COUNTRY_COORDS[countryISO3]?.lng || null,
        disease_name: diseaseInfo?.name || null,
        disease_category: diseaseInfo?.category || 'unknown',
        priority: diseaseInfo?.priority || 'P2',
        source_timestamp: dateMatch?.[1] ? new Date(dateMatch[1]).toISOString() : new Date().toISOString(),
        confidence_score: 85,
        signal_type: 'official_report',
        status: 'new',
        ingestion_source: 'AFRICA-NEWSROOM-RSS',
        duplicate_hash: generateHash(linkMatch?.[1] || title),
      });
    }
  } catch (error) {
    console.error('APO Africa error:', error);
  }

  return signals;
}

// Fetch from Africanews via France24 Africa RSS (same parent company)
async function fetchAfricanews(): Promise<any[]> {
  const signals: any[] = [];

  try {
    // France24 Africa RSS feed (Africanews is Euronews group, try multiple)
    const urls = [
      'https://www.france24.com/en/africa/rss',
      'https://www.dw.com/en/africa/s-12756/rss',
      'https://www.rfi.fr/en/africa/rss'
    ];

    for (const feedUrl of urls) {
      try {
        const response = await fetch(feedUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; AFRO-Sentinel/1.0)',
            'Accept': 'application/rss+xml, application/xml, text/xml, */*'
          }
        });

        if (!response.ok) continue;

        const xmlText = await response.text();
        const items = xmlText.match(/<item>[\s\S]*?<\/item>/g) || [];

        for (const item of items.slice(0, 20)) {
          const titleMatch = item.match(/<title>(?:<!\[CDATA\[)?([^\]<]+)(?:\]\]>)?<\/title>/);
          const linkMatch = item.match(/<link>([^<]+)<\/link>/);
          const dateMatch = item.match(/<pubDate>([^<]+)<\/pubDate>/);

          if (!titleMatch) continue;

          const title = titleMatch[1].replace(/&amp;/g, '&');
          const fullText = title;

          const multilingualDiseaseInfo = detectDiseaseMultilingual(fullText);
          const diseaseInfo = multilingualDiseaseInfo || detectDisease(fullText);

          const healthKeywords = ['disease', 'outbreak', 'epidemic', 'health', 'hospital', 'death', 'cholera', 'malaria', 'fever', 'virus', 'infection'];
          const hasHealthContent = healthKeywords.some(kw => fullText.toLowerCase().includes(kw)) || diseaseInfo;

          if (!hasHealthContent) continue;

          const countryISO3 = extractCountryISO3(fullText);
          if (!countryISO3 || !AFRO_COUNTRIES.includes(countryISO3)) continue;

          const langDetection = detectLanguage(fullText);

          const sourceName = feedUrl.includes('france24') ? 'France24 Africa' :
            feedUrl.includes('dw.com') ? 'DW Africa' : 'RFI Africa';

          signals.push({
            source_id: 'AFRICANEWS',
            source_name: sourceName,
            source_url: linkMatch?.[1] || feedUrl,
            source_type: 'media',
            source_tier: 'tier_2',
            original_text: title,
            original_language: langDetection.code,
            location_country: Object.entries(COUNTRY_NAME_TO_ISO3).find(([_, iso]) => iso === countryISO3)?.[0] || countryISO3,
            location_country_iso: countryISO3,
            location_lat: COUNTRY_COORDS[countryISO3]?.lat || null,
            location_lng: COUNTRY_COORDS[countryISO3]?.lng || null,
            disease_name: diseaseInfo?.name || null,
            disease_category: diseaseInfo?.category || 'unknown',
            priority: diseaseInfo?.priority || 'P3',
            source_timestamp: dateMatch?.[1] ? new Date(dateMatch[1]).toISOString() : new Date().toISOString(),
            confidence_score: 70,
            signal_type: 'media_report',
            status: 'new',
            ingestion_source: 'INTL-AFRICA-RSS',
            duplicate_hash: generateHash(linkMatch?.[1] || title),
          });
        }

        // Use first successful feed
        if (signals.length > 0) {
          console.log(`Africanews succeeded via ${feedUrl} with ${signals.length} signals`);
          break;
        }
      } catch (e) {
        continue;
      }
    }
  } catch (error) {
    console.error('Africanews error:', error);
  }

  return signals;
}

// Fetch from Vanguard Nigeria (Local Nigerian newspaper)
async function fetchVanguardNigeria(): Promise<any[]> {
  const signals: any[] = [];

  try {
    const url = 'https://www.vanguardngr.com/category/health/feed/';
    const response = await fetch(url, {
      headers: { 'User-Agent': 'AFRO-Sentinel-Watchtower/1.0' }
    });

    if (!response.ok) {
      console.log('Vanguard Nigeria failed:', response.status);
      return signals;
    }

    const xmlText = await response.text();
    const items = xmlText.match(/<item>[\s\S]*?<\/item>/g) || [];

    for (const item of items.slice(0, 20)) {
      const titleMatch = item.match(/<title>(?:<!\[CDATA\[)?([^\]<]+)(?:\]\]>)?<\/title>/);
      const linkMatch = item.match(/<link>([^<]+)<\/link>/);
      const dateMatch = item.match(/<pubDate>([^<]+)<\/pubDate>/);

      if (!titleMatch) continue;

      const title = titleMatch[1].replace(/&amp;/g, '&');
      const fullText = title;

      const multilingualDiseaseInfo = detectDiseaseMultilingual(fullText);
      const diseaseInfo = multilingualDiseaseInfo || detectDisease(fullText);
      const langDetection = detectLanguage(fullText);

      signals.push({
        source_id: 'VANGUARD_NG',
        source_name: 'Vanguard Nigeria',
        source_url: linkMatch?.[1] || 'https://www.vanguardngr.com',
        source_type: 'media',
        source_tier: 'tier_2',
        original_text: title,
        original_language: langDetection.code,
        location_country: 'Nigeria',
        location_country_iso: 'NGA',
        location_lat: COUNTRY_COORDS['NGA']?.lat || null,
        location_lng: COUNTRY_COORDS['NGA']?.lng || null,
        disease_name: diseaseInfo?.name || null,
        disease_category: diseaseInfo?.category || 'unknown',
        priority: diseaseInfo?.priority || 'P3',
        source_timestamp: dateMatch?.[1] ? new Date(dateMatch[1]).toISOString() : new Date().toISOString(),
        confidence_score: 65,
        signal_type: 'media_report',
        status: 'new',
        ingestion_source: 'VANGUARD-RSS',
        duplicate_hash: generateHash(linkMatch?.[1] || title),
      });
    }
  } catch (error) {
    console.error('Vanguard Nigeria error:', error);
  }

  return signals;
}

// Fetch from Daily Nation Kenya (fallback to The Star Kenya)
async function fetchDailyNationKenya(): Promise<any[]> {
  const signals: any[] = [];

  try {
    // Try The Star Kenya (more accessible) as primary
    const url = 'https://www.the-star.co.ke/rss/';
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AFRO-Sentinel/1.0)',
        'Accept': 'application/rss+xml, application/xml, text/xml'
      }
    });

    if (!response.ok) {
      // Fallback to Capital FM Kenya
      const altUrl = 'https://www.capitalfm.co.ke/news/feed/';
      const altResponse = await fetch(altUrl, {
        headers: { 'User-Agent': 'AFRO-Sentinel-Watchtower/1.0' }
      });

      if (!altResponse.ok) {
        console.log('Kenya news sources failed:', response.status);
        return signals;
      }

      const xmlText = await altResponse.text();
      const items = xmlText.match(/<item>[\s\S]*?<\/item>/g) || [];

      for (const item of items.slice(0, 20)) {
        const titleMatch = item.match(/<title>(?:<!\[CDATA\[)?([^\]<]+)(?:\]\]>)?<\/title>/);
        const linkMatch = item.match(/<link>([^<]+)<\/link>/);
        const dateMatch = item.match(/<pubDate>([^<]+)<\/pubDate>/);

        if (!titleMatch) continue;

        const title = titleMatch[1].replace(/&amp;/g, '&');
        const fullText = title;

        const healthKeywords = ['health', 'disease', 'hospital', 'outbreak', 'epidemic', 'death', 'cholera', 'malaria', 'fever'];
        const multilingualDiseaseInfo = detectDiseaseMultilingual(fullText);
        const diseaseInfo = multilingualDiseaseInfo || detectDisease(fullText);
        const hasHealth = healthKeywords.some(kw => fullText.toLowerCase().includes(kw)) || diseaseInfo;

        if (!hasHealth) continue;

        const langDetection = detectLanguage(fullText);

        signals.push({
          source_id: 'CAPITAL_FM_KE',
          source_name: 'Capital FM Kenya',
          source_url: linkMatch?.[1] || 'https://www.capitalfm.co.ke',
          source_type: 'media',
          source_tier: 'tier_2',
          original_text: title,
          original_language: langDetection.code,
          location_country: 'Kenya',
          location_country_iso: 'KEN',
          location_lat: COUNTRY_COORDS['KEN']?.lat || null,
          location_lng: COUNTRY_COORDS['KEN']?.lng || null,
          disease_name: diseaseInfo?.name || null,
          disease_category: diseaseInfo?.category || 'unknown',
          priority: diseaseInfo?.priority || 'P3',
          source_timestamp: dateMatch?.[1] ? new Date(dateMatch[1]).toISOString() : new Date().toISOString(),
          confidence_score: 65,
          signal_type: 'media_report',
          status: 'new',
          ingestion_source: 'CAPITAL-KE-RSS',
          duplicate_hash: generateHash(linkMatch?.[1] || title),
        });
      }
      return signals;
    }

    const xmlText = await response.text();
    const items = xmlText.match(/<item>[\s\S]*?<\/item>/g) || [];

    for (const item of items.slice(0, 20)) {
      const titleMatch = item.match(/<title>(?:<!\[CDATA\[)?([^\]<]+)(?:\]\]>)?<\/title>/);
      const linkMatch = item.match(/<link>([^<]+)<\/link>/);
      const dateMatch = item.match(/<pubDate>([^<]+)<\/pubDate>/);

      if (!titleMatch) continue;

      const title = titleMatch[1].replace(/&amp;/g, '&');
      const fullText = title;

      const healthKeywords = ['health', 'disease', 'hospital', 'outbreak', 'epidemic', 'death', 'cholera', 'malaria', 'fever'];
      const multilingualDiseaseInfo = detectDiseaseMultilingual(fullText);
      const diseaseInfo = multilingualDiseaseInfo || detectDisease(fullText);
      const hasHealth = healthKeywords.some(kw => fullText.toLowerCase().includes(kw)) || diseaseInfo;

      if (!hasHealth) continue;

      const langDetection = detectLanguage(fullText);

      signals.push({
        source_id: 'STAR_KE',
        source_name: 'The Star Kenya',
        source_url: linkMatch?.[1] || 'https://www.the-star.co.ke',
        source_type: 'media',
        source_tier: 'tier_2',
        original_text: title,
        original_language: langDetection.code,
        location_country: 'Kenya',
        location_country_iso: 'KEN',
        location_lat: COUNTRY_COORDS['KEN']?.lat || null,
        location_lng: COUNTRY_COORDS['KEN']?.lng || null,
        disease_name: diseaseInfo?.name || null,
        disease_category: diseaseInfo?.category || 'unknown',
        priority: diseaseInfo?.priority || 'P3',
        source_timestamp: dateMatch?.[1] ? new Date(dateMatch[1]).toISOString() : new Date().toISOString(),
        confidence_score: 65,
        signal_type: 'media_report',
        status: 'new',
        ingestion_source: 'STAR-KE-RSS',
        duplicate_hash: generateHash(linkMatch?.[1] || title),
      });
    }
  } catch (error) {
    console.error('Kenya news error:', error);
  }

  return signals;
}

// Fetch from News24 South Africa
async function fetchNews24SA(): Promise<any[]> {
  const signals: any[] = [];

  try {
    const url = 'https://feeds.news24.com/articles/news24/SouthAfrica/rss';
    const response = await fetch(url, {
      headers: { 'User-Agent': 'AFRO-Sentinel-Watchtower/1.0' }
    });

    if (!response.ok) {
      console.log('News24 SA failed:', response.status);
      return signals;
    }

    const xmlText = await response.text();
    const items = xmlText.match(/<item>[\s\S]*?<\/item>/g) || [];

    for (const item of items.slice(0, 25)) {
      const titleMatch = item.match(/<title>(?:<!\[CDATA\[)?([^\]<]+)(?:\]\]>)?<\/title>/);
      const linkMatch = item.match(/<link>([^<]+)<\/link>/);
      const dateMatch = item.match(/<pubDate>([^<]+)<\/pubDate>/);

      if (!titleMatch) continue;

      const title = titleMatch[1].replace(/&amp;/g, '&');
      const fullText = title;

      const multilingualDiseaseInfo = detectDiseaseMultilingual(fullText);
      const diseaseInfo = multilingualDiseaseInfo || detectDisease(fullText);

      const healthKeywords = ['disease', 'outbreak', 'health', 'hospital', 'death', 'cholera', 'malaria', 'fever', 'virus', 'tb', 'hiv', 'covid'];
      const hasHealthContent = healthKeywords.some(kw => fullText.toLowerCase().includes(kw)) || diseaseInfo;

      if (!hasHealthContent) continue;

      signals.push({
        source_id: 'NEWS24_SA',
        source_name: 'News24 South Africa',
        source_url: linkMatch?.[1] || 'https://www.news24.com',
        source_type: 'media',
        source_tier: 'tier_2',
        original_text: title,
        original_language: 'en',
        location_country: 'South Africa',
        location_country_iso: 'ZAF',
        location_lat: COUNTRY_COORDS['ZAF']?.lat || null,
        location_lng: COUNTRY_COORDS['ZAF']?.lng || null,
        disease_name: diseaseInfo?.name || null,
        disease_category: diseaseInfo?.category || 'unknown',
        priority: diseaseInfo?.priority || 'P3',
        source_timestamp: dateMatch?.[1] ? new Date(dateMatch[1]).toISOString() : new Date().toISOString(),
        confidence_score: 70,
        signal_type: 'media_report',
        status: 'new',
        ingestion_source: 'NEWS24-SA-RSS',
        duplicate_hash: generateHash(linkMatch?.[1] || title),
      });
    }
  } catch (error) {
    console.error('News24 SA error:', error);
  }

  return signals;
}

// Fetch from The Reporter Ethiopia
async function fetchReporterEthiopia(): Promise<any[]> {
  const signals: any[] = [];

  try {
    const url = 'https://www.thereporterethiopia.com/feed/';
    const response = await fetch(url, {
      headers: { 'User-Agent': 'AFRO-Sentinel-Watchtower/1.0' }
    });

    if (!response.ok) {
      console.log('Reporter Ethiopia failed:', response.status);
      return signals;
    }

    const xmlText = await response.text();
    const items = xmlText.match(/<item>[\s\S]*?<\/item>/g) || [];

    for (const item of items.slice(0, 20)) {
      const titleMatch = item.match(/<title>(?:<!\[CDATA\[)?([^\]<]+)(?:\]\]>)?<\/title>/);
      const linkMatch = item.match(/<link>([^<]+)<\/link>/);
      const dateMatch = item.match(/<pubDate>([^<]+)<\/pubDate>/);

      if (!titleMatch) continue;

      const title = titleMatch[1].replace(/&amp;/g, '&');
      const fullText = title;

      const multilingualDiseaseInfo = detectDiseaseMultilingual(fullText);
      const diseaseInfo = multilingualDiseaseInfo || detectDisease(fullText);

      const healthKeywords = ['disease', 'outbreak', 'health', 'hospital', 'death', 'cholera', 'malaria', 'fever', 'virus', 'epidemic'];
      const hasHealthContent = healthKeywords.some(kw => fullText.toLowerCase().includes(kw)) || diseaseInfo;

      if (!hasHealthContent) continue;

      const langDetection = detectLanguage(fullText);

      signals.push({
        source_id: 'REPORTER_ETH',
        source_name: 'The Reporter Ethiopia',
        source_url: linkMatch?.[1] || 'https://www.thereporterethiopia.com',
        source_type: 'media',
        source_tier: 'tier_2',
        original_text: title,
        original_language: langDetection.code,
        location_country: 'Ethiopia',
        location_country_iso: 'ETH',
        location_lat: COUNTRY_COORDS['ETH']?.lat || null,
        location_lng: COUNTRY_COORDS['ETH']?.lng || null,
        disease_name: diseaseInfo?.name || null,
        disease_category: diseaseInfo?.category || 'unknown',
        priority: diseaseInfo?.priority || 'P3',
        source_timestamp: dateMatch?.[1] ? new Date(dateMatch[1]).toISOString() : new Date().toISOString(),
        confidence_score: 65,
        signal_type: 'media_report',
        status: 'new',
        ingestion_source: 'REPORTER-ETH-RSS',
        duplicate_hash: generateHash(linkMatch?.[1] || title),
      });
    }
  } catch (error) {
    console.error('Reporter Ethiopia error:', error);
  }

  return signals;
}

// Fetch from HDX (Humanitarian Data Exchange) - health datasets
async function fetchHDX(): Promise<any[]> {
  const signals: any[] = [];

  try {
    const url = 'https://data.humdata.org/api/3/action/package_search?q=health+disease+outbreak&fq=groups:africa&rows=20&sort=metadata_modified+desc';

    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      console.log('HDX failed:', response.status);
      return signals;
    }

    const data = await response.json();
    const datasets = data.result?.results || [];

    for (const dataset of datasets) {
      const title = dataset.title || dataset.name || '';
      const notes = dataset.notes || '';
      const fullText = `${title} ${notes}`;

      const groups = dataset.groups || [];
      let countryISO3: string | null = null;
      for (const group of groups) {
        const groupName = (group.name || group.title || '').toLowerCase();
        const iso3 = extractCountryISO3(groupName) || COUNTRY_NAME_TO_ISO3[groupName];
        if (iso3 && AFRO_COUNTRIES.includes(iso3)) {
          countryISO3 = iso3;
          break;
        }
      }

      if (!countryISO3) {
        countryISO3 = extractCountryISO3(fullText);
      }

      if (!countryISO3 || !AFRO_COUNTRIES.includes(countryISO3)) continue;

      const multilingualDiseaseInfo = detectDiseaseMultilingual(fullText);
      const diseaseInfo = multilingualDiseaseInfo || detectDisease(fullText);

      if (!diseaseInfo) continue;

      signals.push({
        source_id: 'HDX',
        source_name: 'Humanitarian Data Exchange',
        source_url: `https://data.humdata.org/dataset/${dataset.name}`,
        source_type: 'official',
        source_tier: 'tier_1',
        original_text: title.substring(0, 500),
        original_language: 'en',
        location_country: Object.entries(COUNTRY_NAME_TO_ISO3).find(([_, iso]) => iso === countryISO3)?.[0] || countryISO3,
        location_country_iso: countryISO3,
        location_lat: COUNTRY_COORDS[countryISO3]?.lat || null,
        location_lng: COUNTRY_COORDS[countryISO3]?.lng || null,
        disease_name: diseaseInfo?.name || null,
        disease_category: diseaseInfo?.category || 'unknown',
        priority: diseaseInfo?.priority || 'P3',
        source_timestamp: dataset.metadata_modified || new Date().toISOString(),
        confidence_score: 80,
        signal_type: 'official_report',
        status: 'new',
        ingestion_source: 'HDX-CKAN',
        duplicate_hash: generateHash(dataset.id || title),
      });
    }
  } catch (error) {
    console.error('HDX error:', error);
  }

  return signals;
}

// =====================================================
// NEW SOURCES - DHIS2 ALTERNATIVES & SOCIAL MEDIA
// =====================================================

// Fetch from WHO Disease Outbreak News (DON) - Fixed URL
async function fetchWHODON(): Promise<any[]> {
  const signals: any[] = [];

  try {
    // WHO DON page scraping fallback - the RSS was deprecated
    // Use the WHO emergencies API instead
    const url = 'https://www.who.int/api/news/diseaseoutbreaknews?sf_culture=en&$orderby=PublicationDateAndTime%20desc&$top=30';

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'AFRO-Sentinel-Watchtower/1.0',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      // Fallback to WHO RSS general feed
      const rssUrl = 'https://www.who.int/rss-feeds/news-english.xml';
      const rssResponse = await fetch(rssUrl, {
        headers: { 'User-Agent': 'AFRO-Sentinel-Watchtower/1.0' }
      });

      if (!rssResponse.ok) {
        console.log('WHO DON all endpoints failed:', response.status);
        return signals;
      }

      const xmlText = await rssResponse.text();
      const items = xmlText.match(/<item>[\s\S]*?<\/item>/g) || [];

      for (const item of items.slice(0, 25)) {
        const titleMatch = item.match(/<title>(?:<!\[CDATA\[)?([^\]<]+)(?:\]\]>)?<\/title>/);
        const linkMatch = item.match(/<link>([^<]+)<\/link>/);
        const dateMatch = item.match(/<pubDate>([^<]+)<\/pubDate>/);

        if (!titleMatch) continue;

        const title = titleMatch[1].replace(/&amp;/g, '&');
        const countryISO3 = extractCountryISO3(title);

        if (!countryISO3 || !AFRO_COUNTRIES.includes(countryISO3)) continue;

        const diseaseInfo = detectDiseaseMultilingual(title) || detectDisease(title);

        const outbreakKeywords = ['outbreak', 'disease', 'epidemic', 'emergency', 'cholera', 'ebola', 'marburg', 'mpox', 'measles'];
        const hasOutbreak = outbreakKeywords.some(kw => title.toLowerCase().includes(kw)) || diseaseInfo;
        if (!hasOutbreak) continue;

        signals.push({
          source_id: 'WHO_DON',
          source_name: 'WHO News',
          source_url: linkMatch?.[1] || 'https://www.who.int',
          source_type: 'official',
          source_tier: 'tier_1',
          original_text: title.substring(0, 500),
          original_language: 'en',
          location_country: Object.entries(COUNTRY_NAME_TO_ISO3).find(([_, iso]) => iso === countryISO3)?.[0] || countryISO3,
          location_country_iso: countryISO3,
          location_lat: COUNTRY_COORDS[countryISO3]?.lat || null,
          location_lng: COUNTRY_COORDS[countryISO3]?.lng || null,
          disease_name: diseaseInfo?.name || null,
          disease_category: diseaseInfo?.category || 'unknown',
          priority: diseaseInfo?.priority || 'P1',
          source_timestamp: dateMatch?.[1] ? new Date(dateMatch[1]).toISOString() : new Date().toISOString(),
          confidence_score: 95,
          signal_type: 'official_report',
          status: 'new',
          ingestion_source: 'WHO-NEWS-RSS',
          duplicate_hash: generateHash(linkMatch?.[1] || title),
        });
      }
      return signals;
    }

    const data = await response.json();
    const news = data.value || [];

    for (const item of news) {
      const title = item.Title || '';
      const summary = item.Summary || '';
      const fullText = `${title} ${summary}`;

      const countryISO3 = extractCountryISO3(fullText);
      if (!countryISO3 || !AFRO_COUNTRIES.includes(countryISO3)) continue;

      const diseaseInfo = detectDiseaseMultilingual(fullText) || detectDisease(fullText);

      signals.push({
        source_id: 'WHO_DON',
        source_name: 'WHO Disease Outbreak News',
        source_url: item.UrlName ? `https://www.who.int/emergencies/disease-outbreak-news/${item.UrlName}` : 'https://www.who.int/emergencies/disease-outbreak-news',
        source_type: 'official',
        source_tier: 'tier_1',
        original_text: title.substring(0, 500),
        original_language: 'en',
        location_country: Object.entries(COUNTRY_NAME_TO_ISO3).find(([_, iso]) => iso === countryISO3)?.[0] || countryISO3,
        location_country_iso: countryISO3,
        location_lat: COUNTRY_COORDS[countryISO3]?.lat || null,
        location_lng: COUNTRY_COORDS[countryISO3]?.lng || null,
        disease_name: diseaseInfo?.name || null,
        disease_category: diseaseInfo?.category || 'unknown',
        priority: diseaseInfo?.priority || 'P1',
        source_timestamp: item.PublicationDateAndTime || new Date().toISOString(),
        confidence_score: 95,
        signal_type: 'official_report',
        status: 'new',
        ingestion_source: 'WHO-DON-API',
        duplicate_hash: generateHash(item.Id?.toString() || title),
      });
    }
  } catch (error) {
    console.error('WHO DON error:', error);
  }

  return signals;
}

// Fetch from OCHA ReliefWeb Disasters API (simple approach)
async function fetchOCHAFTS(): Promise<any[]> {
  const signals: any[] = [];

  try {
    // Use URL object for proper encoding
    const baseUrl = new URL('https://api.reliefweb.int/v1/disasters');
    baseUrl.searchParams.set('appname', 'afro-sentinel');
    baseUrl.searchParams.set('preset', 'latest');
    baseUrl.searchParams.set('limit', '25');

    const response = await fetch(baseUrl.toString(), {
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      console.log('OCHA Disasters failed:', response.status);
      return signals;
    }

    const data = await response.json();
    const disasters = data.data || [];

    for (const disaster of disasters) {
      const fields = disaster.fields || {};
      const countries = fields.country || [];

      for (const country of countries) {
        const countryISO3 = country.iso3;
        if (!countryISO3 || !AFRO_COUNTRIES.includes(countryISO3)) continue;

        const title = fields.name || '';
        const diseaseInfo = detectDiseaseMultilingual(title) || detectDisease(title);

        signals.push({
          source_id: 'OCHA_DISASTERS',
          source_name: 'OCHA Disasters',
          source_url: fields.url || `https://reliefweb.int/disaster/${disaster.id}`,
          source_type: 'official',
          source_tier: 'tier_1',
          original_text: title.substring(0, 500),
          original_language: 'en',
          location_country: country.name || countryISO3,
          location_country_iso: countryISO3,
          location_lat: COUNTRY_COORDS[countryISO3]?.lat || null,
          location_lng: COUNTRY_COORDS[countryISO3]?.lng || null,
          disease_name: diseaseInfo?.name || fields.type?.[0]?.name || null,
          disease_category: diseaseInfo?.category || 'unknown',
          priority: 'P2',
          source_timestamp: fields.date?.created || new Date().toISOString(),
          confidence_score: 85,
          signal_type: 'official_report',
          status: 'new',
          ingestion_source: 'OCHA-DISASTERS',
          duplicate_hash: generateHash(`${disaster.id}-${countryISO3}`),
        });
      }
    }
  } catch (error) {
    console.error('OCHA Disasters error:', error);
  }

  return signals;
}

// Fetch from Lemmy World Africa community (Reddit alternative - no rate limits)
async function fetchRedditAfrica(): Promise<any[]> {
  const signals: any[] = [];

  try {
    // Use Lemmy (open-source Reddit alternative) - much more permissive
    const instances = [
      { url: 'https://lemmy.world/api/v3/search', community: 'africa' },
      { url: 'https://lemmy.ml/api/v3/search', community: 'africa' }
    ];

    for (const instance of instances) {
      try {
        const searchUrl = `${instance.url}?q=disease+outbreak+health+epidemic&type_=Posts&sort=New&limit=15`;

        const response = await fetch(searchUrl, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'AFRO-Sentinel-Watchtower/1.0'
          }
        });

        if (!response.ok) {
          console.log(`Lemmy ${instance.url} failed:`, response.status);
          continue;
        }

        const data = await response.json();
        const posts = data.posts || [];

        for (const postWrapper of posts) {
          const post = postWrapper.post || postWrapper;
          const title = post.name || post.title || '';
          const body = post.body || '';
          const fullText = `${title} ${body}`;

          const countryISO3 = extractCountryISO3(fullText);
          if (!countryISO3 || !AFRO_COUNTRIES.includes(countryISO3)) continue;

          const diseaseInfo = detectDiseaseMultilingual(fullText) || detectDisease(fullText);
          if (!diseaseInfo) continue;

          const langDetection = detectLanguage(fullText);

          signals.push({
            source_id: 'LEMMY_AFRICA',
            source_name: 'Lemmy Africa Community',
            source_url: post.ap_id || post.url || instance.url,
            source_type: 'social',
            source_tier: 'tier_3',
            original_text: title.substring(0, 500),
            original_language: inferLanguageFromCountry(langDetection.code, countryISO3),
            location_country: Object.entries(COUNTRY_NAME_TO_ISO3).find(([_, iso]) => iso === countryISO3)?.[0] || countryISO3,
            location_country_iso: countryISO3,
            location_lat: COUNTRY_COORDS[countryISO3]?.lat || null,
            location_lng: COUNTRY_COORDS[countryISO3]?.lng || null,
            disease_name: diseaseInfo?.name || null,
            disease_category: diseaseInfo?.category || 'unknown',
            priority: diseaseInfo?.priority || 'P3',
            source_timestamp: post.published || new Date().toISOString(),
            confidence_score: 45,
            signal_type: 'community_report',
            status: 'new',
            ingestion_source: 'LEMMY-AFRICA',
            duplicate_hash: generateHash(post.id?.toString() || title),
          });
        }

        // Only need one successful instance
        if (signals.length > 0) break;
      } catch (e) {
        continue;
      }
    }
  } catch (error) {
    console.error('Lemmy Africa error:', error);
  }

  return signals;
}

// Fetch from Mastodon health instances - Twitter/X Alternative (Tier 3)
async function fetchMastodonHealth(): Promise<any[]> {
  const signals: any[] = [];

  try {
    // Query Mastodon.social public timeline for health hashtags (no auth required)
    const hashtags = ['outbreak', 'cholera', 'ebola', 'measles', 'epidemic'];

    for (const hashtag of hashtags) {
      const url = `https://mastodon.social/api/v1/timelines/tag/${hashtag}?limit=10`;

      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) continue;

      const posts = await response.json();

      for (const post of posts) {
        const content = post.content?.replace(/<[^>]+>/g, '') || '';
        const countryISO3 = extractCountryISO3(content);

        if (!countryISO3 || !AFRO_COUNTRIES.includes(countryISO3)) continue;

        const multilingualDiseaseInfo = detectDiseaseMultilingual(content);
        const diseaseInfo = multilingualDiseaseInfo || detectDisease(content);

        if (!diseaseInfo) continue;

        const langDetection = detectLanguage(content);

        signals.push({
          source_id: 'MASTODON',
          source_name: 'Mastodon',
          source_url: post.url || post.uri,
          source_type: 'social',
          source_tier: 'tier_3',
          original_text: content.substring(0, 500),
          original_language: inferLanguageFromCountry(langDetection.code, countryISO3, post.language),
          location_country: Object.entries(COUNTRY_NAME_TO_ISO3).find(([_, iso]) => iso === countryISO3)?.[0] || countryISO3,
          location_country_iso: countryISO3,
          location_lat: COUNTRY_COORDS[countryISO3]?.lat || null,
          location_lng: COUNTRY_COORDS[countryISO3]?.lng || null,
          disease_name: diseaseInfo?.name || null,
          disease_category: diseaseInfo?.category || 'unknown',
          priority: diseaseInfo?.priority || 'P3',
          source_timestamp: post.created_at || new Date().toISOString(),
          confidence_score: 40,  // Social source - lower confidence
          signal_type: 'community_report',
          status: 'new',
          ingestion_source: 'MASTODON-HEALTH',
          duplicate_hash: generateHash(post.id || content),
        });
      }

      // Rate limit between hashtags
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  } catch (error) {
    console.error('Mastodon error:', error);
  }

  return signals;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting AFRO-Sentinel Watchtower maintenance & ingestion...');

    // STEP 0: SIGNAL RETENTION & CLEANUP
    // Create space for new signals by removing those older than 3 days
    try {
      const { error: cleanupError } = await supabase.rpc('cleanup_old_signals', { retention_days: 3 });
      if (cleanupError) {
        logger.error('CLEANUP', `Failed to run automatic cleanup: ${cleanupError.message}`);
      } else {
        logger.info('CLEANUP', 'Successfully cleaned up stale signals (>3 days)');
      }
    } catch (e) {
      console.error('Cleanup execution error:', e);
    }

    console.log('Ingesting from 20 grassroots sources...');

    // Fetch from ALL 20 grassroots sources in parallel (16 original + 4 new)
    const [
      gdeltSignals,
      reliefwebSignals,
      whoSignals,
      allAfricaSignals,
      bbcHausaSignals,
      bbcSwahiliSignals,
      bbcAmharicSignals,
      saharaSignals,
      africaCdcSignals,
      apoAfricaSignals,
      africanewsSignals,
      vanguardSignals,
      nationKenyaSignals,
      news24Signals,
      reporterEthSignals,
      hdxSignals,
      // NEW SOURCES (DHIS2 alternatives + Social media)
      whoDonSignals,
      ochaFtsSignals,
      redditSignals,
      mastodonSignals
    ] = await Promise.all([
      fetchGDELT(),
      fetchReliefWeb(),
      fetchWHO(),
      fetchAllAfrica(),
      fetchBBCHausa(),
      fetchBBCSwahili(),
      fetchBBCAmharic(),
      fetchSaharaReporters(),
      fetchAfricaCDC(),
      fetchAPOAfrica(),
      fetchAfricanews(),
      fetchVanguardNigeria(),
      fetchDailyNationKenya(),
      fetchNews24SA(),
      fetchReporterEthiopia(),
      fetchHDX(),
      // NEW SOURCES
      fetchWHODON(),
      fetchOCHAFTS(),
      fetchRedditAfrica(),
      fetchMastodonHealth(),
    ]);

    const allSignals = [
      ...gdeltSignals,
      ...reliefwebSignals,
      ...whoSignals,
      ...allAfricaSignals,
      ...bbcHausaSignals,
      ...bbcSwahiliSignals,
      ...bbcAmharicSignals,
      ...saharaSignals,
      ...africaCdcSignals,
      ...apoAfricaSignals,
      ...africanewsSignals,
      ...vanguardSignals,
      ...nationKenyaSignals,
      ...news24Signals,
      ...reporterEthSignals,
      ...hdxSignals,
      // NEW SOURCES
      ...whoDonSignals,
      ...ochaFtsSignals,
      ...redditSignals,
      ...mastodonSignals
    ];

    // Log source breakdown
    logger.info('INGESTION', `Fetched ${allSignals.length} raw signals from 20 sources`);
    logger.summary('SOURCES', {
      GDELT: gdeltSignals.length,
      ReliefWeb: reliefwebSignals.length,
      WHO_GHO: whoSignals.length,
      AllAfrica: allAfricaSignals.length,
      BBC_Hausa: bbcHausaSignals.length,
      BBC_Swahili: bbcSwahiliSignals.length,
      BBC_Amharic: bbcAmharicSignals.length,
      Sahara_Reporters: saharaSignals.length,
      Africa_CDC: africaCdcSignals.length,
      APO_Africa: apoAfricaSignals.length,
      Africanews: africanewsSignals.length,
      Vanguard_Nigeria: vanguardSignals.length,
      Daily_Nation_Kenya: nationKenyaSignals.length,
      News24_SA: news24Signals.length,
      Reporter_Ethiopia: reporterEthSignals.length,
      HDX: hdxSignals.length,
      WHO_DON: whoDonSignals.length,
      OCHA_FTS: ochaFtsSignals.length,
      Reddit_Africa: redditSignals.length,
      Mastodon_Health: mastodonSignals.length,
    });

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

    // STEP 1: Apply content filter BEFORE deduplication for efficiency
    const rejectionStats: Record<string, number> = {};
    const contentFilteredSignals = allSignals.filter(s => {
      const filterResult = isValidOutbreakSignal(s.original_text);
      if (!filterResult.valid) {
        // Track rejection reasons
        const reason = filterResult.reason || 'unknown';
        rejectionStats[reason] = (rejectionStats[reason] || 0) + 1;
        logger.rejection(filterResult.reason, s.original_text, s.source_name);
      }
      return filterResult.valid;
    });

    // Log rejection summary
    if (Object.keys(rejectionStats).length > 0) {
      logger.info('NOISE_FILTER', 'Rejection breakdown by reason');
      logger.summary('REJECTIONS', rejectionStats);
    }

    logger.info('PIPELINE', `Content filter: ${contentFilteredSignals.length} passed, ${allSignals.length - contentFilteredSignals.length} rejected`);

    // STEP 2: Deduplicate by hash and apply quality filter
    const uniqueSignals = contentFilteredSignals.filter(s => !existingHashes.has(s.duplicate_hash));

    // Apply Quality Filter to prioritize high-value signals before AI analysis
    const newSignals = uniqueSignals.filter(isHighQualitySignal);

    logger.info('PIPELINE', `Deduplication & Quality: ${newSignals.length} high-quality new signals (${contentFilteredSignals.length - newSignals.length} duplicates or low-quality removed)`);

    // STEP 3: Analyze and insert signals
    const insertedSignals: any[] = [];
    const rejectedByAI: any[] = [];

    for (const signal of newSignals.slice(0, 20)) { // Limit to 20 per run
      // AI-enhanced analysis for signals without disease classification
      if (!signal.disease_name || signal.disease_category === 'unknown') {
        const analysis = await analyzeSignal(signal.original_text);

        // Check if AI rejected the signal as non-outbreak content
        if (analysis && analysis.is_outbreak === false) {
          logger.rejection(`AI: ${analysis.rejection_reason || 'Not an outbreak'}`, signal.original_text, 'AI_VALIDATOR');
          rejectedByAI.push({
            text: signal.original_text.substring(0, 100),
            reason: analysis.rejection_reason
          });
          continue; // Skip this signal
        }

        if (analysis && analysis.is_outbreak !== false) {
          signal.disease_name = analysis.disease_name || signal.disease_name;
          signal.disease_category = analysis.disease_category || signal.disease_category;
          signal.priority = analysis.priority || signal.priority;
          signal.confidence_score = analysis.confidence_score || signal.confidence_score;
          signal.location_admin1 = analysis.location_admin1 || null;
          signal.reported_cases = analysis.reported_cases || null;
          signal.reported_deaths = analysis.reported_deaths || null;
          signal.cross_border_risk = analysis.cross_border_risk || false;

          logger.debug('AI_ANALYSIS', `Classified signal`, {
            disease: analysis.disease_name,
            priority: analysis.priority,
            location: analysis.location_admin1
          });
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
        logger.error('DATABASE', `Insert failed: ${error.message}`, { signal_source: signal.source_name });
      } else {
        insertedSignals.push(data);
        logger.info('DATABASE', `Inserted signal`, {
          id: data.id,
          priority: data.priority,
          disease: data.disease_name,
          country: data.location_country
        });
      }
    }

    // Final pipeline summary
    logger.info('INGESTION', '✅ Pipeline complete');
    logger.summary('FINAL_STATS', {
      fetched: allSignals.length,
      passed_filter: contentFilteredSignals.length,
      rejected_filter: allSignals.length - contentFilteredSignals.length,
      after_dedup: newSignals.length,
      inserted: insertedSignals.length,
      ai_rejected: rejectedByAI.length
    });

    return new Response(
      JSON.stringify({
        success: true,
        fetched: allSignals.length,
        content_filtered: contentFilteredSignals.length,
        rejected_by_filter: allSignals.length - contentFilteredSignals.length,
        deduplicated: newSignals.length,
        inserted: insertedSignals.length,
        rejected_by_ai: rejectedByAI.length,
        signals: insertedSignals,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    logger.error('INGESTION', `Pipeline failed: ${error instanceof Error ? error.message : 'Unknown error'}`, {
      stack: error instanceof Error ? error.stack : undefined
    });
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
