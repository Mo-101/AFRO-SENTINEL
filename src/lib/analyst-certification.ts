/**
 * AFRO Sentinel Analyst Certification System
 * Based on WHO PHEOC Framework + CDC Event-Based Surveillance (EBS) Guidelines
 * 
 * Certification ensures analysts can accurately triage signals before handling real data.
 */

// ============= TYPES =============

export type CertificationLevel = 'trainee' | 'certified' | 'senior' | 'expert';

export interface CertificationBadge {
  level: CertificationLevel;
  icon: string;
  label: string;
  minScore: number;
  permissions: string[];
  color: string;
}

export interface TrainingModule {
  id: string;
  title: string;
  description: string;
  icon: string;
  duration: string;
  content: ModuleContent[];
  quiz: QuizQuestion[];
}

export interface ModuleContent {
  type: 'text' | 'list' | 'callout' | 'example';
  title?: string;
  content: string | string[];
  variant?: 'info' | 'warning' | 'critical';
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: { id: string; text: string }[];
  correctAnswer: string;
  explanation: string;
}

export interface TriageScenario {
  id: string;
  signal: {
    source: string;
    sourceType: 'social_media' | 'news' | 'official' | 'community';
    timestamp: string;
    location: string;
    originalText: string;
    language: string;
  };
  correctAction: 'P1' | 'P2' | 'P3' | 'P4' | 'DISMISS';
  correctReasoning: string;
  category: 'vhf' | 'respiratory' | 'enteric' | 'vector_borne' | 'zoonotic' | 'vaccine_preventable' | 'unknown';
  difficulty: 'basic' | 'intermediate' | 'advanced';
}

export interface CertificationResult {
  analystId: string;
  level: CertificationLevel;
  score: number;
  completedAt: string;
  moduleScores: Record<string, number>;
  scenarioScores: Record<string, boolean>;
}

// ============= CERTIFICATION LEVELS =============

export const CERTIFICATION_BADGES: Record<CertificationLevel, CertificationBadge> = {
  trainee: {
    level: 'trainee',
    icon: '🔰',
    label: 'Trainee',
    minScore: 0,
    permissions: ['view_signals', 'view_training'],
    color: 'bg-muted text-muted-foreground',
  },
  certified: {
    level: 'certified',
    icon: '🎖️',
    label: 'Certified Analyst',
    minScore: 80,
    permissions: ['view_signals', 'triage_p3_p4', 'add_notes'],
    color: 'bg-savanna text-savanna-foreground',
  },
  senior: {
    level: 'senior',
    icon: '⭐',
    label: 'Senior Analyst',
    minScore: 90,
    permissions: ['view_signals', 'triage_all', 'validate', 'add_notes'],
    color: 'bg-sahara text-sahara-foreground',
  },
  expert: {
    level: 'expert',
    icon: '👑',
    label: 'Expert Analyst',
    minScore: 95,
    permissions: ['view_signals', 'triage_all', 'validate', 'escalate_p1', 'train_others'],
    color: 'bg-primary text-primary-foreground',
  },
};

// ============= ALWAYS P1 PATHOGENS (MEMORIZE) =============

export const ALWAYS_P1_PATHOGENS = [
  'Ebola virus disease',
  'Marburg virus disease',
  'Plague (pneumonic)',
  'MERS-CoV',
  'Novel influenza',
  'SARS',
  'Anthrax',
  'Smallpox',
  'Unknown VHF',
  'Unknown cluster with deaths',
  'AFP cluster (polio suspected)',
  'Cholera in non-endemic area',
];

// ============= TRAINING MODULES =============

export const TRAINING_MODULES: TrainingModule[] = [
  {
    id: 'ebs-basics',
    title: 'Event-Based Surveillance Fundamentals',
    description: 'Understanding the EBS framework and early warning principles',
    icon: '📡',
    duration: '15 min',
    content: [
      {
        type: 'text',
        title: 'What is EBS?',
        content: 'Event-Based Surveillance (EBS) is the organized collection, monitoring, assessment, and interpretation of unstructured health information. Unlike Indicator-Based Surveillance, EBS captures signals BEFORE they become confirmed cases.',
      },
      {
        type: 'callout',
        variant: 'critical',
        title: 'AFRO Sentinel Core Principle',
        content: 'Early warning over certainty. A false positive costs time. A missed outbreak costs lives.',
      },
      {
        type: 'list',
        title: 'Signal Sources (WHO Tiers)',
        content: [
          'Tier 1: Official sources (WHO, MoH, verified health authorities)',
          'Tier 2: Verified media (established news outlets, credible journalists)',
          'Tier 3: Community/social media (requires verification before escalation)',
        ],
      },
      {
        type: 'example',
        title: 'Signal vs. Event vs. Outbreak',
        content: 'Signal: Unverified report of illness → Event: Verified occurrence → Outbreak: Confirmed cluster requiring response',
      },
    ],
    quiz: [
      {
        id: 'ebs-1',
        question: 'What is the primary advantage of EBS over indicator-based surveillance?',
        options: [
          { id: 'a', text: 'It is more accurate' },
          { id: 'b', text: 'It detects signals before confirmed cases' },
          { id: 'c', text: 'It requires less resources' },
          { id: 'd', text: 'It only uses official sources' },
        ],
        correctAnswer: 'b',
        explanation: 'EBS captures signals BEFORE they become confirmed cases, enabling early warning and rapid response.',
      },
      {
        id: 'ebs-2',
        question: 'A Tier 3 source reports deaths from an unknown illness. What should you do?',
        options: [
          { id: 'a', text: 'Dismiss - Tier 3 sources are unreliable' },
          { id: 'b', text: 'Wait for Tier 1 confirmation' },
          { id: 'c', text: 'Flag for immediate verification - deaths require attention' },
          { id: 'd', text: 'Mark as P4 for monitoring' },
        ],
        correctAnswer: 'c',
        explanation: 'Death reports from ANY source require immediate verification. Tier 3 sources often detect events first in remote areas.',
      },
    ],
  },
  {
    id: 'signal-verification',
    title: 'Signal Verification & Source Assessment',
    description: 'How to evaluate signal credibility and source reliability',
    icon: '🔍',
    duration: '20 min',
    content: [
      {
        type: 'text',
        title: 'The 5W+H Framework',
        content: 'Every signal must answer: WHAT (illness/symptoms), WHO (affected population), WHERE (location), WHEN (timeline), WHY (potential cause), HOW (transmission suspected).',
      },
      {
        type: 'list',
        title: 'Source Credibility Indicators',
        content: [
          'Official statements or press releases',
          'Named health officials or facilities',
          'Specific numbers (cases, deaths, dates)',
          'Geographic precision (not just "Africa")',
          'Corroborating reports from multiple sources',
        ],
      },
      {
        type: 'callout',
        variant: 'warning',
        title: 'Red Flags for Misinformation',
        content: 'Vague locations, sensational language without specifics, single anonymous source, contradicted by official sources, old news recycled.',
      },
      {
        type: 'list',
        title: 'Lingua Fidelity Considerations',
        content: [
          'Local language sources often have HIGHER fidelity for ground truth',
          'Translation may lose nuance - flag for native speaker review',
          'Swahili/Hausa/Amharic sources from affected areas are valuable',
          'Social media in local languages may precede official reports',
        ],
      },
    ],
    quiz: [
      {
        id: 'ver-1',
        question: 'A Hausa-language Facebook post from Kano says "people are dying in the hospital". How should you treat this?',
        options: [
          { id: 'a', text: 'Dismiss - social media is unreliable' },
          { id: 'b', text: 'P4 Monitor - vague report' },
          { id: 'c', text: 'P2/P3 - deaths reported, local source, needs verification' },
          { id: 'd', text: 'Wait for English news coverage' },
        ],
        correctAnswer: 'c',
        explanation: 'Local language sources from affected areas often have high fidelity. Deaths reported = never dismiss. Flag for verification.',
      },
      {
        id: 'ver-2',
        question: 'Which element is MOST critical for geographic verification?',
        options: [
          { id: 'a', text: 'Country name' },
          { id: 'b', text: 'Admin1/Admin2 (state/district) precision' },
          { id: 'c', text: 'GPS coordinates' },
          { id: 'd', text: 'Continent' },
        ],
        correctAnswer: 'b',
        explanation: 'Admin1/Admin2 precision allows response teams to target resources. GPS is ideal but rare. Country-level is too vague for response.',
      },
    ],
  },
  {
    id: 'risk-assessment',
    title: 'Risk Assessment & Priority Classification',
    description: 'WHO criteria for classifying signal priority (P1-P4)',
    icon: '⚠️',
    duration: '25 min',
    content: [
      {
        type: 'list',
        title: 'P1 - CRITICAL (Immediate Action)',
        content: [
          'High-consequence pathogen (Ebola, Marburg, Plague, etc.)',
          'Novel/unknown pathogen with deaths',
          'Unusual cluster with high case fatality',
          'Cross-border outbreak potential',
          'Healthcare worker infections',
          'Polio-like AFP cluster',
        ],
      },
      {
        type: 'list',
        title: 'P2 - HIGH (Urgent Verification)',
        content: [
          'Deaths reported (even unverified)',
          'Unusual disease presentation',
          'Outbreak in vulnerable population',
          'Cholera/measles in outbreak-prone area',
          'Multiple cases with unknown etiology',
        ],
      },
      {
        type: 'list',
        title: 'P3 - MODERATE (Monitor Closely)',
        content: [
          'Known disease with higher than expected cases',
          'Single case of reportable disease',
          'Environmental hazard (chemical spill, etc.)',
          'Rumor requiring investigation',
        ],
      },
      {
        type: 'list',
        title: 'P4 - LOW (Routine Monitoring)',
        content: [
          'Expected seasonal illness patterns',
          'Single case of endemic disease',
          'Resolved incidents',
          'Non-urgent environmental reports',
        ],
      },
      {
        type: 'callout',
        variant: 'critical',
        title: 'The "Always P1" List - MEMORIZE',
        content: 'Ebola • Marburg • Plague • MERS • Novel flu • SARS • Anthrax • Smallpox • Unknown VHF • Unknown cluster with deaths • AFP cluster • Cholera in non-endemic area',
      },
    ],
    quiz: [
      {
        id: 'risk-1',
        question: 'A report mentions "bleeding fever" in a village with 3 deaths. What priority?',
        options: [
          { id: 'a', text: 'P4 - Need more information' },
          { id: 'b', text: 'P3 - Monitor for updates' },
          { id: 'c', text: 'P2 - High, needs verification' },
          { id: 'd', text: 'P1 - Possible VHF, immediate action' },
        ],
        correctAnswer: 'd',
        explanation: '"Bleeding fever" + deaths = suspected VHF. VHF is ALWAYS P1. Do not wait for confirmation.',
      },
      {
        id: 'risk-2',
        question: 'Two nurses at a hospital in DRC fall ill with respiratory symptoms. What priority?',
        options: [
          { id: 'a', text: 'P4 - Healthcare workers get sick often' },
          { id: 'b', text: 'P3 - Monitor the situation' },
          { id: 'c', text: 'P2 - Concerning but not critical' },
          { id: 'd', text: 'P1 - Healthcare worker cluster in DRC = immediate escalation' },
        ],
        correctAnswer: 'd',
        explanation: 'Healthcare worker infections are a key P1 indicator. In DRC (Ebola history), this requires immediate investigation.',
      },
    ],
  },
  {
    id: 'high-consequence-pathogens',
    title: 'High-Consequence Pathogens',
    description: 'Recognition and response to VHF, respiratory threats, and other critical pathogens',
    icon: '☣️',
    duration: '30 min',
    content: [
      {
        type: 'text',
        title: 'Viral Hemorrhagic Fevers (VHF)',
        content: 'VHFs include Ebola, Marburg, Lassa, Crimean-Congo, and Rift Valley fever. Key indicators: fever + bleeding (gums, nose, eyes), fever + unexplained deaths, fever + healthcare worker infection.',
      },
      {
        type: 'list',
        title: 'VHF Signal Keywords (All Languages)',
        content: [
          'English: bleeding, hemorrhagic, Ebola, Marburg',
          'French: fièvre hémorragique, saignement',
          'Swahili: homa ya kutokwa na damu',
          'Hausa: zazzabin zubar jini',
          'Arabic: حمى نزفية',
        ],
      },
      {
        type: 'callout',
        variant: 'critical',
        title: 'VHF Response Protocol',
        content: 'ANY suspected VHF = P1 IMMEDIATELY. Do not wait for lab confirmation. Alert supervisor. Verify source location for response team deployment.',
      },
      {
        type: 'list',
        title: 'Respiratory Threats',
        content: [
          'Novel influenza (H5N1, H7N9)',
          'MERS-CoV (Middle East Respiratory Syndrome)',
          'SARS-like illness',
          'Key indicator: Severe pneumonia cluster with unusual features',
        ],
      },
      {
        type: 'list',
        title: 'Other Critical Pathogens',
        content: [
          'Plague (especially pneumonic)',
          'Anthrax (especially inhalational)',
          'Cholera in non-endemic areas',
          'Polio (AFP clusters)',
          'Meningitis during non-outbreak season',
        ],
      },
    ],
    quiz: [
      {
        id: 'hcp-1',
        question: 'A Swahili news report mentions "homa ya kutokwa na damu" (fever with bleeding). What action?',
        options: [
          { id: 'a', text: 'Dismiss - foreign language report' },
          { id: 'b', text: 'P3 - Request translation first' },
          { id: 'c', text: 'P1 - This describes VHF symptoms' },
          { id: 'd', text: 'P2 - Wait for death reports' },
        ],
        correctAnswer: 'c',
        explanation: '"Homa ya kutokwa na damu" = fever with bleeding = VHF signal. P1 immediately. Do not wait for translation or confirmation.',
      },
      {
        id: 'hcp-2',
        question: 'A cluster of pneumonia cases in camels and humans is reported from Saudi Arabia. What priority?',
        options: [
          { id: 'a', text: 'P4 - Pneumonia is common' },
          { id: 'b', text: 'P3 - Animal involvement is unusual' },
          { id: 'c', text: 'P2 - Needs verification' },
          { id: 'd', text: 'P1 - Possible MERS-CoV (camel-human transmission)' },
        ],
        correctAnswer: 'd',
        explanation: 'Camels are MERS-CoV reservoirs. Human-camel respiratory cluster in Middle East = P1 for MERS investigation.',
      },
    ],
  },
];

// ============= PRACTICAL SCENARIOS =============

export const TRIAGE_SCENARIOS: TriageScenario[] = [
  {
    id: 'scenario-1',
    signal: {
      source: 'Twitter/X',
      sourceType: 'social_media',
      timestamp: '2 hours ago',
      location: 'Village X, Eastern DRC',
      originalText: 'People are dying from a mysterious illness in our village. Blood coming from their eyes and mouths. Please help us!',
      language: 'English',
    },
    correctAction: 'P1',
    correctReasoning: 'Bleeding symptoms + deaths in DRC = suspected VHF. DRC is endemic for Ebola. Local voices reporting deaths are critical signals. P1 for immediate verification and response team alert.',
    category: 'vhf',
    difficulty: 'basic',
  },
  {
    id: 'scenario-2',
    signal: {
      source: 'Vanguard Nigeria',
      sourceType: 'news',
      timestamp: '6 hours ago',
      location: 'Kano State, Nigeria',
      originalText: 'Health officials confirm 15 cases of acute watery diarrhea in Kano metropolitan area. Two deaths reported among children under 5.',
      language: 'English',
    },
    correctAction: 'P2',
    correctReasoning: 'Acute watery diarrhea + deaths in children = suspected cholera. Kano is cholera-endemic, but deaths and confirmed cases require P2 for urgent verification and potential outbreak response.',
    category: 'enteric',
    difficulty: 'basic',
  },
  {
    id: 'scenario-3',
    signal: {
      source: 'Facebook Community Group',
      sourceType: 'community',
      timestamp: '4 hours ago',
      location: 'Mombasa, Kenya',
      originalText: 'Mtoto wangu ana homa kali na anatapika damu. Hospitali imejaa wagonjwa wenye dalili sawa.',
      language: 'Swahili',
    },
    correctAction: 'P1',
    correctReasoning: 'Translation: "My child has high fever and is vomiting blood. Hospital is full of patients with similar symptoms." Bleeding + fever cluster = VHF suspected. P1 immediately.',
    category: 'vhf',
    difficulty: 'intermediate',
  },
  {
    id: 'scenario-4',
    signal: {
      source: 'Reuters',
      sourceType: 'news',
      timestamp: '12 hours ago',
      location: 'Cairo, Egypt',
      originalText: 'Egyptian health ministry reports 3 confirmed cases of H5N1 avian influenza in poultry workers from Fayoum governorate. Workers are in stable condition.',
      language: 'English',
    },
    correctAction: 'P1',
    correctReasoning: 'H5N1 human cases = ALWAYS P1. Novel influenza with pandemic potential requires immediate escalation regardless of current patient status. WHO IHR notifiable.',
    category: 'respiratory',
    difficulty: 'intermediate',
  },
  {
    id: 'scenario-5',
    signal: {
      source: 'WHO AFRO',
      sourceType: 'official',
      timestamp: '1 day ago',
      location: 'Niamey, Niger',
      originalText: 'Niger health authorities report seasonal malaria cases within expected range for this time of year. Prevention campaigns ongoing.',
      language: 'English',
    },
    correctAction: 'P4',
    correctReasoning: 'Seasonal endemic disease within expected range. Official source confirms routine situation. P4 for monitoring only.',
    category: 'vector_borne',
    difficulty: 'basic',
  },
  {
    id: 'scenario-6',
    signal: {
      source: 'Local Radio Transcript',
      sourceType: 'community',
      timestamp: '3 hours ago',
      location: 'Goma, DRC',
      originalText: 'Watu wengi wameugua na wengine wamefariki bila kujua sababu. Madaktari wanasema ni ugonjwa mpya.',
      language: 'Swahili',
    },
    correctAction: 'P1',
    correctReasoning: 'Translation: "Many people are sick and some have died without knowing the cause. Doctors say it is a new disease." Unknown disease + deaths in DRC = P1. "New disease" from healthcare providers is critical signal.',
    category: 'unknown',
    difficulty: 'advanced',
  },
  {
    id: 'scenario-7',
    signal: {
      source: 'AllAfrica News',
      sourceType: 'news',
      timestamp: '8 hours ago',
      location: 'Kampala, Uganda',
      originalText: 'Uganda Ministry of Health announces start of annual measles vaccination campaign targeting 5 million children.',
      language: 'English',
    },
    correctAction: 'DISMISS',
    correctReasoning: 'This is a routine public health announcement about vaccination, not a disease signal. DISMISS - not relevant to outbreak surveillance.',
    category: 'vaccine_preventable',
    difficulty: 'basic',
  },
  {
    id: 'scenario-8',
    signal: {
      source: 'BBC Hausa',
      sourceType: 'news',
      timestamp: '5 hours ago',
      location: 'Maiduguri, Borno State, Nigeria',
      originalText: 'An gano yara 8 da suke fama da rauni a kafafunsu kuma ba sa iya tafiya a asibitin yara na Maiduguri.',
      language: 'Hausa',
    },
    correctAction: 'P1',
    correctReasoning: 'Translation: "8 children found with leg weakness and unable to walk at Maiduguri children\'s hospital." AFP cluster (Acute Flaccid Paralysis) = suspected polio. ALWAYS P1 for AFP clusters.',
    category: 'vaccine_preventable',
    difficulty: 'advanced',
  },
  {
    id: 'scenario-9',
    signal: {
      source: 'Al Jazeera',
      sourceType: 'news',
      timestamp: '10 hours ago',
      location: 'Khartoum, Sudan',
      originalText: 'Authorities report increase in dengue fever cases in Khartoum state. 45 cases confirmed this week, no deaths reported.',
      language: 'English',
    },
    correctAction: 'P3',
    correctReasoning: 'Known disease (dengue) with elevated but not critical numbers. No deaths. Sudan has dengue seasonally. P3 for monitoring and trend analysis.',
    category: 'vector_borne',
    difficulty: 'intermediate',
  },
  {
    id: 'scenario-10',
    signal: {
      source: 'Twitter/X Health Worker',
      sourceType: 'social_media',
      timestamp: '1 hour ago',
      location: 'Abuja, Nigeria',
      originalText: 'Three of my nursing colleagues are now in ICU with severe respiratory illness. We all worked the same shift last week. Something is very wrong.',
      language: 'English',
    },
    correctAction: 'P1',
    correctReasoning: 'Healthcare worker cluster with severe illness = P1 ALWAYS. Nosocomial spread, potential novel pathogen. Requires immediate investigation and infection control assessment.',
    category: 'respiratory',
    difficulty: 'intermediate',
  },
];

// ============= SCORING FUNCTIONS =============

export function calculateCertificationLevel(score: number): CertificationLevel {
  if (score >= 95) return 'expert';
  if (score >= 90) return 'senior';
  if (score >= 80) return 'certified';
  return 'trainee';
}

export function calculateModuleScore(
  answers: Record<string, string>,
  module: TrainingModule
): number {
  const correct = module.quiz.filter(q => answers[q.id] === q.correctAnswer).length;
  return Math.round((correct / module.quiz.length) * 100);
}

export function calculateScenarioScore(
  answers: Record<string, string>,
  scenarios: TriageScenario[]
): { score: number; details: Record<string, boolean> } {
  const details: Record<string, boolean> = {};
  let correct = 0;

  scenarios.forEach(scenario => {
    const isCorrect = answers[scenario.id] === scenario.correctAction;
    details[scenario.id] = isCorrect;
    if (isCorrect) correct++;
  });

  return {
    score: Math.round((correct / scenarios.length) * 100),
    details,
  };
}

export function calculateOverallScore(
  moduleScores: number[],
  scenarioScore: number
): number {
  // Modules: 40%, Scenarios: 60% (practical skills weighted higher)
  const avgModuleScore = moduleScores.reduce((a, b) => a + b, 0) / moduleScores.length;
  return Math.round(avgModuleScore * 0.4 + scenarioScore * 0.6);
}
