// =====================================================
// AFRO SENTINEL - Multilingual Disease Keywords
// Expanded coverage: Arabic, Portuguese, French, Swahili, Hausa, Amharic, Yoruba
// =====================================================

export interface DiseaseKeywords {
  disease: string;
  icd_code: string;
  category: 'vhf' | 'respiratory' | 'enteric' | 'vector_borne' | 'zoonotic' | 'vaccine_preventable' | 'environmental' | 'unknown';
  keywords: {
    en: string[];
    fr: string[];
    ar: string[];
    pt: string[];
    sw: string[];
    ha: string[];
    am: string[];
    yo: string[];
  };
}

export const DISEASE_KEYWORDS: DiseaseKeywords[] = [
  // =====================================================
  // VIRAL HEMORRHAGIC FEVERS (VHF) - ALWAYS P1
  // =====================================================
  {
    disease: 'Ebola',
    icd_code: 'A98.4',
    category: 'vhf',
    keywords: {
      en: ['ebola', 'ebola virus', 'evd', 'hemorrhagic fever', 'bleeding fever', 'blood vomit'],
      fr: ['ebola', 'fièvre ebola', 'fièvre hémorragique', 'saignement', 'vomissement de sang'],
      ar: ['إيبولا', 'حمى إيبولا', 'حمى نزفية', 'نزيف', 'قيء دموي'],
      pt: ['ebola', 'febre ebola', 'febre hemorrágica', 'sangramento', 'vômito de sangue'],
      sw: ['ebola', 'homa ya ebola', 'kutapika damu', 'damu', 'homa ya kutoka damu'],
      ha: ['ebola', 'cutar ebola', 'zazzabin zubar jini', 'jini', 'amai jini'],
      am: ['ኢቦላ', 'የኢቦላ በሽታ', 'ደም ትውከት', 'ደም መፍሰስ'],
      yo: ['ebola', 'arun ebola', 'iba ẹjẹ', 'ẹjẹ gbigbẹ'],
    },
  },
  {
    disease: 'Marburg',
    icd_code: 'A98.3',
    category: 'vhf',
    keywords: {
      en: ['marburg', 'marburg virus', 'green monkey disease', 'hemorrhagic fever'],
      fr: ['marburg', 'virus marburg', 'fièvre hémorragique'],
      ar: ['ماربورغ', 'فيروس ماربورغ', 'حمى نزفية'],
      pt: ['marburg', 'vírus marburg', 'febre hemorrágica'],
      sw: ['marburg', 'virusi ya marburg', 'homa ya kutoka damu'],
      ha: ['marburg', 'cutar marburg', 'zazzabin zubar jini'],
      am: ['ማርበርግ', 'የማርበርግ ቫይረስ'],
      yo: ['marburg', 'arun marburg'],
    },
  },
  {
    disease: 'Lassa Fever',
    icd_code: 'A96.2',
    category: 'vhf',
    keywords: {
      en: ['lassa', 'lassa fever', 'lassa virus', 'rat fever'],
      fr: ['lassa', 'fièvre de lassa', 'virus lassa'],
      ar: ['لاسا', 'حمى لاسا', 'فيروس لاسا'],
      pt: ['lassa', 'febre lassa', 'vírus lassa'],
      sw: ['lassa', 'homa ya lassa'],
      ha: ['lassa', 'cutar lassa', 'zazzabin bera'],
      am: ['ላሳ', 'የላሳ ትኩሳት'],
      yo: ['lassa', 'arun lassa', 'iba lassa'],
    },
  },
  {
    disease: 'Yellow Fever',
    icd_code: 'A95',
    category: 'vhf',
    keywords: {
      en: ['yellow fever', 'yellow jack', 'jaundice fever', 'black vomit'],
      fr: ['fièvre jaune', 'jaunisse', 'vomissement noir'],
      ar: ['الحمى الصفراء', 'اليرقان', 'القيء الأسود'],
      pt: ['febre amarela', 'icterícia', 'vômito preto'],
      sw: ['homa ya manjano', 'homa njano', 'manjano'],
      ha: ['zazzabin rawaya', 'rawaya', 'cutar rawaya'],
      am: ['ቢጫ ትኩሳት', 'ቢጫ በሽታ'],
      yo: ['iba pupa', 'ara riro', 'iba ofeefee'],
    },
  },
  {
    disease: 'Rift Valley Fever',
    icd_code: 'A92.4',
    category: 'vhf',
    keywords: {
      en: ['rift valley fever', 'rvf', 'enzootic hepatitis'],
      fr: ['fièvre de la vallée du rift', 'fvr'],
      ar: ['حمى الوادي المتصدع', 'حمى الصدع'],
      pt: ['febre do vale do rift', 'fvr'],
      sw: ['homa ya bonde la ufa', 'rift valley'],
      ha: ['zazzabin rift valley', 'cutar rift'],
      am: ['ሪፍት ቫሊ ትኩሳት'],
      yo: ['iba rift valley'],
    },
  },

  // =====================================================
  // RESPIRATORY DISEASES
  // =====================================================
  {
    disease: 'COVID-19',
    icd_code: 'U07.1',
    category: 'respiratory',
    keywords: {
      en: ['covid', 'covid-19', 'coronavirus', 'sars-cov-2', 'corona'],
      fr: ['covid', 'covid-19', 'coronavirus', 'corona'],
      ar: ['كوفيد', 'كورونا', 'فيروس كورونا', 'كوفيد-19'],
      pt: ['covid', 'covid-19', 'coronavírus', 'corona'],
      sw: ['covid', 'korona', 'virusi vya korona'],
      ha: ['covid', 'korona', 'cutar korona'],
      am: ['ኮቪድ', 'ኮሮና', 'ኮሮና ቫይረስ'],
      yo: ['covid', 'korona', 'arun korona'],
    },
  },
  {
    disease: 'Tuberculosis',
    icd_code: 'A15-A19',
    category: 'respiratory',
    keywords: {
      en: ['tuberculosis', 'tb', 'consumption', 'lung disease', 'coughing blood'],
      fr: ['tuberculose', 'tb', 'phtisie', 'toux sang'],
      ar: ['السل', 'الدرن', 'سعال دموي', 'مرض الرئة'],
      pt: ['tuberculose', 'tb', 'tísica', 'tosse com sangue'],
      sw: ['kifua kikuu', 'tb', 'ukohozi damu'],
      ha: ['tarin fuka', 'tb', 'tari jini', 'cutar huhu'],
      am: ['ሳንባ ነቀርሳ', 'ቲቢ', 'ሳል በደም'],
      yo: ['iko', 'tb', 'iko ẹjẹ', 'arun ẹdọforo'],
    },
  },
  {
    disease: 'MERS',
    icd_code: 'U04.9',
    category: 'respiratory',
    keywords: {
      en: ['mers', 'middle east respiratory syndrome', 'camel flu'],
      fr: ['mers', 'syndrome respiratoire moyen-orient'],
      ar: ['ميرس', 'متلازمة الشرق الأوسط التنفسية', 'كورونا الإبل'],
      pt: ['mers', 'síndrome respiratória do oriente médio'],
      sw: ['mers', 'ugonjwa wa kupumua mashariki ya kati'],
      ha: ['mers', 'cutar numfashi'],
      am: ['ሜርስ', 'የመካከለኛው ምስራቅ የመተንፈሻ በሽታ'],
      yo: ['mers', 'arun mimi aarin ila-oorun'],
    },
  },
  {
    disease: 'Influenza/Flu',
    icd_code: 'J09-J11',
    category: 'respiratory',
    keywords: {
      en: ['influenza', 'flu', 'avian flu', 'bird flu', 'h5n1', 'h7n9', 'swine flu'],
      fr: ['grippe', 'influenza', 'grippe aviaire', 'grippe porcine'],
      ar: ['الأنفلونزا', 'الإنفلونزا', 'أنفلونزا الطيور', 'أنفلونزا الخنازير'],
      pt: ['gripe', 'influenza', 'gripe aviária', 'gripe suína'],
      sw: ['mafua', 'homa', 'mafua ya ndege', 'influenza'],
      ha: ['mura', 'zazzabin mura', 'mura tsuntsaye'],
      am: ['ጉንፋን', 'ኢንፍሉዌንዛ', 'የወፎች ጉንፋን'],
      yo: ['aisan otutu', 'iba', 'arun ẹyẹ'],
    },
  },
  {
    disease: 'Pneumonia',
    icd_code: 'J12-J18',
    category: 'respiratory',
    keywords: {
      en: ['pneumonia', 'lung infection', 'chest infection', 'difficulty breathing'],
      fr: ['pneumonie', 'infection pulmonaire', 'difficulté respiratoire'],
      ar: ['التهاب رئوي', 'ذات الرئة', 'صعوبة التنفس'],
      pt: ['pneumonia', 'infecção pulmonar', 'dificuldade respiratória'],
      sw: ['nimonia', 'maambukizi ya mapafu', 'ugumu wa kupumua'],
      ha: ['ciwon huhu', 'numfashi wahala'],
      am: ['የሳንባ ምች', 'የመተንፈስ ችግር'],
      yo: ['arun ẹdọforo', 'ìṣòro mímí'],
    },
  },

  // =====================================================
  // ENTERIC/DIARRHEAL DISEASES
  // =====================================================
  {
    disease: 'Cholera',
    icd_code: 'A00',
    category: 'enteric',
    keywords: {
      en: ['cholera', 'watery diarrhea', 'rice water stool', 'acute diarrhea', 'dehydration deaths'],
      fr: ['choléra', 'diarrhée aqueuse', 'selles eau de riz', 'déshydratation'],
      ar: ['الكوليرا', 'إسهال مائي', 'براز ماء الأرز', 'جفاف'],
      pt: ['cólera', 'diarreia aquosa', 'fezes água de arroz', 'desidratação'],
      sw: ['kipindupindu', 'kuhara maji', 'kinyesi cha maji', 'upungufu wa maji mwilini'],
      ha: ['cutar zawo', 'zawo mai ruwa', 'zawo mai yawa', 'bushara jiki'],
      am: ['ኮሌራ', 'ውሃማ ተቅማጥ', 'የሩዝ ውሃ ሰገራ'],
      yo: ['arun igbẹ gbuuru', 'igbẹ gbuuru omi', 'arun kolera'],
    },
  },
  {
    disease: 'Typhoid',
    icd_code: 'A01',
    category: 'enteric',
    keywords: {
      en: ['typhoid', 'typhoid fever', 'enteric fever', 'rose spots'],
      fr: ['typhoïde', 'fièvre typhoïde', 'fièvre entérique'],
      ar: ['التيفوئيد', 'حمى التيفوئيد', 'الحمى المعوية'],
      pt: ['tifoide', 'febre tifoide', 'febre entérica'],
      sw: ['homa ya matumbo', 'taifodi', 'typhoid'],
      ha: ['zazzabin cizon sauro', 'typhoid', 'cutar ciki'],
      am: ['ታይፎይድ', 'የታይፎይድ ትኩሳት'],
      yo: ['iba taifoyidi', 'iba inu'],
    },
  },
  {
    disease: 'Dysentery',
    icd_code: 'A03-A06',
    category: 'enteric',
    keywords: {
      en: ['dysentery', 'bloody diarrhea', 'bloody stool', 'shigella', 'amoebic'],
      fr: ['dysenterie', 'diarrhée sanglante', 'selles sanglantes'],
      ar: ['الزحار', 'إسهال دموي', 'براز دموي'],
      pt: ['disenteria', 'diarreia com sangue', 'fezes com sangue'],
      sw: ['ugonjwa wa tumbo', 'kuhara damu', 'kinyesi cha damu'],
      ha: ['zawo jini', 'gudawa jini', 'ciwon ciki'],
      am: ['ተቅማጥ በደም', 'ደማዊ ሰገራ'],
      yo: ['igbẹ gbuuru ẹjẹ', 'igbẹ pẹlu ẹjẹ'],
    },
  },

  // =====================================================
  // VECTOR-BORNE DISEASES
  // =====================================================
  {
    disease: 'Malaria',
    icd_code: 'B50-B54',
    category: 'vector_borne',
    keywords: {
      en: ['malaria', 'marsh fever', 'ague', 'mosquito fever', 'cerebral malaria'],
      fr: ['paludisme', 'malaria', 'fièvre des marais', 'palu'],
      ar: ['الملاريا', 'البرداء', 'حمى المستنقعات'],
      pt: ['malária', 'paludismo', 'febre do pântano', 'sezões'],
      sw: ['malaria', 'homa ya malaria', 'baridi kali'],
      ha: ['zazzabin cizon sauro', 'malaria', 'zazzabi'],
      am: ['ወባ', 'ማላሪያ', 'የወባ በሽታ'],
      yo: ['iba', 'malaria', 'arun ẹfọn'],
    },
  },
  {
    disease: 'Dengue',
    icd_code: 'A90-A91',
    category: 'vector_borne',
    keywords: {
      en: ['dengue', 'dengue fever', 'breakbone fever', 'dengue hemorrhagic'],
      fr: ['dengue', 'fièvre dengue', 'fièvre des os'],
      ar: ['حمى الضنك', 'الدنج', 'حمى كسر العظام'],
      pt: ['dengue', 'febre dengue', 'febre quebra-ossos'],
      sw: ['homa ya dengue', 'dengue'],
      ha: ['zazzabin dengue', 'cutar dengue'],
      am: ['ዴንጉ', 'የዴንጉ ትኩሳት'],
      yo: ['iba dengue', 'arun dengue'],
    },
  },
  {
    disease: 'Chikungunya',
    icd_code: 'A92.0',
    category: 'vector_borne',
    keywords: {
      en: ['chikungunya', 'chik', 'bending disease', 'joint pain fever'],
      fr: ['chikungunya', 'maladie de homme courbé'],
      ar: ['شيكونغونيا', 'حمى المفاصل'],
      pt: ['chikungunya', 'febre chikungunya'],
      sw: ['chikungunya', 'homa ya viungo'],
      ha: ['chikungunya', 'zazzabin gabbai'],
      am: ['ቺኩንጉንያ'],
      yo: ['chikungunya', 'iba ese'],
    },
  },
  {
    disease: 'Zika',
    icd_code: 'A92.5',
    category: 'vector_borne',
    keywords: {
      en: ['zika', 'zika virus', 'zika fever', 'microcephaly'],
      fr: ['zika', 'virus zika', 'fièvre zika'],
      ar: ['زيكا', 'فيروس زيكا', 'حمى زيكا'],
      pt: ['zika', 'vírus zika', 'febre zika', 'microcefalia'],
      sw: ['zika', 'virusi ya zika'],
      ha: ['zika', 'cutar zika'],
      am: ['ዚካ', 'የዚካ ቫይረስ'],
      yo: ['zika', 'arun zika'],
    },
  },

  // =====================================================
  // ZOONOTIC DISEASES
  // =====================================================
  {
    disease: 'Plague',
    icd_code: 'A20',
    category: 'zoonotic',
    keywords: {
      en: ['plague', 'bubonic plague', 'black death', 'pneumonic plague', 'swollen lymph'],
      fr: ['peste', 'peste bubonique', 'mort noire', 'peste pulmonaire'],
      ar: ['الطاعون', 'الموت الأسود', 'طاعون دملي'],
      pt: ['peste', 'peste bubônica', 'morte negra', 'peste pneumônica'],
      sw: ['tauni', 'tauni ya buboni', 'kifo cheusi'],
      ha: ['annoba', 'cutar annoba', 'baƙin mutuwa'],
      am: ['ቸነፈር', 'ጥቁር ሞት'],
      yo: ['arun ajakalẹ', 'iku dudu'],
    },
  },
  {
    disease: 'Rabies',
    icd_code: 'A82',
    category: 'zoonotic',
    keywords: {
      en: ['rabies', 'hydrophobia', 'mad dog', 'dog bite', 'animal bite'],
      fr: ['rage', 'hydrophobie', 'chien enragé', 'morsure de chien'],
      ar: ['داء الكلب', 'السعار', 'عضة كلب'],
      pt: ['raiva', 'hidrofobia', 'mordida de cão'],
      sw: ['kichaa cha mbwa', 'kuumwa na mbwa'],
      ha: ['haukan kare', 'cizon kare'],
      am: ['የውሻ እብደት', 'የውሻ ንክሻ'],
      yo: ['arun aja', 'buje aja'],
    },
  },
  {
    disease: 'Mpox',
    icd_code: 'B04',
    category: 'zoonotic',
    keywords: {
      en: ['mpox', 'monkeypox', 'pox lesions', 'pox rash', 'pustules'],
      fr: ['variole du singe', 'mpox', 'éruption cutanée'],
      ar: ['جدري القرود', 'الجدري', 'طفح جلدي'],
      pt: ['mpox', 'varíola dos macacos', 'pústulas'],
      sw: ['mpox', 'ndui ya nyani', 'upele'],
      ha: ['mpox', 'agana biri', 'kuraje'],
      am: ['ምፖክስ', 'የዝንጀሮ ፈንጣጣ'],
      yo: ['mpox', 'arun ọbọ'],
    },
  },
  {
    disease: 'Anthrax',
    icd_code: 'A22',
    category: 'zoonotic',
    keywords: {
      en: ['anthrax', 'woolsorters disease', 'black eschar', 'cutaneous anthrax'],
      fr: ['charbon', 'anthrax', 'maladie des trieurs de laine'],
      ar: ['الجمرة الخبيثة', 'الأنثراكس'],
      pt: ['antraz', 'carbúnculo', 'anthrax'],
      sw: ['kimeta', 'anthrax'],
      ha: ['anthrax', 'cutar dabbobi'],
      am: ['አንትራክስ', 'የከብት በሽታ'],
      yo: ['anthrax', 'arun ẹran'],
    },
  },

  // =====================================================
  // VACCINE-PREVENTABLE DISEASES
  // =====================================================
  {
    disease: 'Measles',
    icd_code: 'B05',
    category: 'vaccine_preventable',
    keywords: {
      en: ['measles', 'rubeola', 'red rash', 'koplik spots', 'measles outbreak'],
      fr: ['rougeole', 'éruption rouge', 'taches de koplik'],
      ar: ['الحصبة', 'طفح أحمر', 'بقع كوبليك'],
      pt: ['sarampo', 'erupção vermelha', 'manchas de koplik'],
      sw: ['surua', 'upele mwekundu', 'shurua'],
      ha: ['kyanda', 'jan kuraje', 'cutar kyanda'],
      am: ['ኩፍኝ', 'ቀይ ሽፍታ'],
      yo: ['arun aarun', 'iba pupa'],
    },
  },
  {
    disease: 'Polio',
    icd_code: 'A80',
    category: 'vaccine_preventable',
    keywords: {
      en: ['polio', 'poliomyelitis', 'paralysis', 'afp', 'acute flaccid paralysis', 'floppy child'],
      fr: ['polio', 'poliomyélite', 'paralysie', 'paralysie flasque'],
      ar: ['شلل الأطفال', 'البوليو', 'شلل رخو حاد'],
      pt: ['pólio', 'poliomielite', 'paralisia', 'paralisia flácida'],
      sw: ['polio', 'ugonjwa wa kupooza', 'kupooza'],
      ha: ['polio', 'shan inna', 'gurguwar yara'],
      am: ['ፖሊዮ', 'ሽባ', 'የልጆች ሽባ'],
      yo: ['polio', 'arun ẹsẹ rọ'],
    },
  },
  {
    disease: 'Meningitis',
    icd_code: 'A39',
    category: 'vaccine_preventable',
    keywords: {
      en: ['meningitis', 'brain fever', 'stiff neck', 'meningococcal', 'spinal meningitis'],
      fr: ['méningite', 'fièvre cérébrale', 'raideur de la nuque'],
      ar: ['التهاب السحايا', 'حمى الدماغ', 'تصلب الرقبة'],
      pt: ['meningite', 'febre cerebral', 'rigidez no pescoço'],
      sw: ['homa ya uti wa mgongo', 'meningitis', 'shingo ngumu'],
      ha: ['cutar sankarau', 'zazzabin kwakwalwa', 'wuya ta taurara'],
      am: ['ማጅራት ገትር', 'የአንጎል ትኩሳት'],
      yo: ['arun ọpọlọ', 'iba ori'],
    },
  },
  {
    disease: 'Diphtheria',
    icd_code: 'A36',
    category: 'vaccine_preventable',
    keywords: {
      en: ['diphtheria', 'throat membrane', 'strangling angel', 'bull neck'],
      fr: ['diphtérie', 'membrane de la gorge', 'cou de taureau'],
      ar: ['الدفتيريا', 'الخناق', 'غشاء الحلق'],
      pt: ['difteria', 'membrana da garganta', 'pescoço de touro'],
      sw: ['dondakoo', 'ugonjwa wa koo'],
      ha: ['cutar makogwaro', 'ciwon makogwaro'],
      am: ['ዲፍቴሪያ', 'የጉሮሮ በሽታ'],
      yo: ['arun ọfun', 'iba ọfun'],
    },
  },
  {
    disease: 'Tetanus',
    icd_code: 'A33-A35',
    category: 'vaccine_preventable',
    keywords: {
      en: ['tetanus', 'lockjaw', 'neonatal tetanus', 'muscle spasms', 'trismus'],
      fr: ['tétanos', 'trismus', 'tétanos néonatal'],
      ar: ['الكزاز', 'التيتانوس', 'تيتانوس حديثي الولادة'],
      pt: ['tétano', 'trismo', 'tétano neonatal'],
      sw: ['pepopunda', 'tetanasi', 'ugumu wa misuli'],
      ha: ['cutar ciwan tagwai', 'tetanus'],
      am: ['ቴታነስ', 'ተንታንተን'],
      yo: ['tetanus', 'arun ese le'],
    },
  },
];

// =====================================================
// SYMPTOM KEYWORDS (Cross-disease detection)
// =====================================================
export interface SymptomKeywords {
  symptom: string;
  severity: 'high' | 'medium' | 'low';
  associated_categories: string[];
  keywords: {
    en: string[];
    fr: string[];
    ar: string[];
    pt: string[];
    sw: string[];
    ha: string[];
    am: string[];
    yo: string[];
  };
}

export const SYMPTOM_KEYWORDS: SymptomKeywords[] = [
  {
    symptom: 'Hemorrhage/Bleeding',
    severity: 'high',
    associated_categories: ['vhf'],
    keywords: {
      en: ['bleeding', 'hemorrhage', 'blood vomit', 'bloody stool', 'blood in urine', 'bleeding from eyes'],
      fr: ['saignement', 'hémorragie', 'vomissement de sang', 'sang dans les selles'],
      ar: ['نزيف', 'نزف', 'قيء دموي', 'دم في البراز', 'بول دموي'],
      pt: ['sangramento', 'hemorragia', 'vômito com sangue', 'sangue nas fezes'],
      sw: ['kutoka damu', 'damu', 'kutapika damu', 'kinyesi cha damu'],
      ha: ['zubar jini', 'jini', 'amai jini', 'kashi jini'],
      am: ['ደም መፍሰስ', 'ደም ትውከት', 'ደም በሽንት'],
      yo: ['ẹjẹ nsàn', 'ẹjẹ', 'eebi ẹjẹ'],
    },
  },
  {
    symptom: 'Paralysis',
    severity: 'high',
    associated_categories: ['vaccine_preventable', 'zoonotic'],
    keywords: {
      en: ['paralysis', 'cannot walk', 'weakness', 'floppy limbs', 'sudden weakness'],
      fr: ['paralysie', 'ne peut pas marcher', 'faiblesse', 'membres flasques'],
      ar: ['شلل', 'لا يستطيع المشي', 'ضعف', 'أطراف رخوة'],
      pt: ['paralisia', 'não pode andar', 'fraqueza', 'membros flácidos'],
      sw: ['kupooza', 'hawezi kutembea', 'udhaifu', 'miguu dhaifu'],
      ha: ['gurguwa', 'ba ya iya tafiya', 'rashin karfi'],
      am: ['ሽባ', 'መራመድ አልቻለም', 'ድክመት'],
      yo: ['arun rọ', 'ko le rin', 'ailera'],
    },
  },
  {
    symptom: 'Acute Watery Diarrhea',
    severity: 'high',
    associated_categories: ['enteric'],
    keywords: {
      en: ['watery diarrhea', 'rice water stool', 'severe diarrhea', 'running stomach', 'loose motions'],
      fr: ['diarrhée aqueuse', 'selles eau de riz', 'diarrhée sévère'],
      ar: ['إسهال مائي', 'براز ماء الأرز', 'إسهال شديد'],
      pt: ['diarreia aquosa', 'fezes água de arroz', 'diarreia grave'],
      sw: ['kuhara maji', 'kinyesi cha maji', 'kuhara kali'],
      ha: ['zawo mai ruwa', 'zawo mai yawa', 'ciwon ciki'],
      am: ['ውሃማ ተቅማጥ', 'የሩዝ ውሃ ሰገራ'],
      yo: ['igbẹ gbuuru omi', 'igbẹ gbuuru líle'],
    },
  },
  {
    symptom: 'Rash',
    severity: 'medium',
    associated_categories: ['vaccine_preventable', 'zoonotic', 'vector_borne'],
    keywords: {
      en: ['rash', 'skin lesions', 'pox', 'blisters', 'pustules', 'spots'],
      fr: ['éruption', 'lésions cutanées', 'pustules', 'vésicules'],
      ar: ['طفح جلدي', 'آفات جلدية', 'بثور', 'حبوب'],
      pt: ['erupção', 'lesões cutâneas', 'pústulas', 'bolhas'],
      sw: ['upele', 'vidonda vya ngozi', 'vipele'],
      ha: ['kuraje', 'gyambon fata', 'ƙuraje'],
      am: ['ሽፍታ', 'የቆዳ ቁስል', 'ቅላት'],
      yo: ['ìgbóná ara', 'ọgbẹ ara', 'ẹ̀sẹ̀ ara'],
    },
  },
  {
    symptom: 'Cluster of Deaths',
    severity: 'high',
    associated_categories: ['vhf', 'respiratory', 'enteric', 'unknown'],
    keywords: {
      en: ['deaths', 'died', 'dead', 'fatalities', 'cluster deaths', 'sudden deaths', 'mysterious deaths'],
      fr: ['morts', 'décès', 'décédé', 'mortalité', 'morts mystérieuses'],
      ar: ['وفيات', 'موت', 'وفاة', 'موت غامض', 'وفيات مفاجئة'],
      pt: ['mortes', 'óbitos', 'falecidos', 'mortes misteriosas'],
      sw: ['vifo', 'wamekufa', 'mauti', 'vifo vya ghafla'],
      ha: ['mutuwa', 'sun mutu', 'mutuwar asiri'],
      am: ['ሞት', 'ሞቱ', 'ድንገተኛ ሞት'],
      yo: ['ikú', 'wọn ku', 'ikú àjèjì'],
    },
  },
];

// =====================================================
// EVENT KEYWORDS (Urgency indicators)
// =====================================================
export const EVENT_KEYWORDS = {
  en: ['outbreak', 'epidemic', 'pandemic', 'emergency', 'alert', 'cases reported', 'spreading', 'surge', 'cluster', 'unknown disease', 'new disease', 'novel virus'],
  fr: ['épidémie', 'pandémie', 'urgence', 'alerte', 'cas signalés', 'propagation', 'flambée', 'maladie inconnue', 'nouvelle maladie'],
  ar: ['تفشي', 'وباء', 'جائحة', 'طوارئ', 'تنبيه', 'حالات مُبلغ عنها', 'انتشار', 'مرض مجهول', 'مرض جديد'],
  pt: ['surto', 'epidemia', 'pandemia', 'emergência', 'alerta', 'casos reportados', 'propagação', 'doença desconhecida', 'nova doença'],
  sw: ['mlipuko', 'janga', 'dharura', 'tahadhari', 'visa vilivyoripotiwa', 'kuenea', 'ugonjwa usiojulikana', 'ugonjwa mpya'],
  ha: ['annobar', 'cutar', 'gaggawa', 'faɗakarwa', 'yaɗuwa', 'cutar da ba a sani ba', 'sabuwar cuta'],
  am: ['ወረርሽኝ', 'ወረርሽኝ', 'አስቸኳይ', 'ማስጠንቀቂያ', 'የተዘገቡ ጉዳዮች', 'መስፋፋት', 'አዲስ በሽታ'],
  yo: ['ajakale-arun', 'àjàkálẹ̀-àrùn', 'pàjáwìrì', 'ìkìlọ̀', 'àwọn ìṣẹ̀lẹ̀ tí a ròyìn', 'tàn', 'àrùn tuntun'],
};

// =====================================================
// LANGUAGE DETECTION PATTERNS
// =====================================================
export const LANGUAGE_DETECTION = {
  // Script-based detection
  amharic: /[\u1200-\u137F]/, // Ge'ez script
  arabic: /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/, // Arabic script
  
  // Character patterns for Latin-based African languages
  hausa: /[ɓɗƙ'ʼ]|[bdksy]'/, // Hooked letters and glottal
  yoruba: /[ẹọṣ]|[eosn]̣/, // Subdot characters
  igbo: /[ịọụ]|[iou]̣/, // Subdot characters
  fulfulde: /[ɓɗɲŋƴ]/, // Hooked and special characters
};

// =====================================================
// COUNTRY-LANGUAGE MAPPING
// =====================================================
export const COUNTRY_LANGUAGES: Record<string, string[]> = {
  // North Africa (Arabic + French)
  'DZA': ['ar', 'fr'],
  'EGY': ['ar'],
  'LBY': ['ar'],
  'MAR': ['ar', 'fr'],
  'TUN': ['ar', 'fr'],
  'SDN': ['ar'],
  
  // Francophone West/Central Africa
  'BEN': ['fr'],
  'BFA': ['fr'],
  'CMR': ['fr', 'en'],
  'CAF': ['fr'],
  'TCD': ['fr', 'ar'],
  'CIV': ['fr'],
  'COG': ['fr'],
  'COD': ['fr', 'sw'],
  'GAB': ['fr'],
  'GIN': ['fr'],
  'MLI': ['fr'],
  'MRT': ['ar', 'fr'],
  'NER': ['fr', 'ha'],
  'SEN': ['fr'],
  'TGO': ['fr'],
  
  // Lusophone Africa
  'AGO': ['pt'],
  'CPV': ['pt'],
  'GNB': ['pt'],
  'MOZ': ['pt'],
  'STP': ['pt'],
  
  // Anglophone Africa
  'BWA': ['en'],
  'GMB': ['en'],
  'GHA': ['en'],
  'KEN': ['en', 'sw'],
  'LSO': ['en'],
  'LBR': ['en'],
  'MWI': ['en'],
  'MUS': ['en', 'fr'],
  'NAM': ['en'],
  'NGA': ['en', 'ha', 'yo'],
  'RWA': ['en', 'fr', 'sw'],
  'SYC': ['en', 'fr'],
  'SLE': ['en'],
  'ZAF': ['en'],
  'SSD': ['en', 'ar'],
  'SWZ': ['en'],
  'TZA': ['en', 'sw'],
  'UGA': ['en', 'sw'],
  'ZMB': ['en'],
  'ZWE': ['en'],
  
  // East Africa (Swahili belt)
  'BDI': ['fr', 'sw'],
  'COM': ['ar', 'fr'],
  'DJI': ['ar', 'fr'],
  'ERI': ['ar', 'en'],
  'ETH': ['am', 'en'],
  'MDG': ['fr'],
  'SOM': ['ar', 'so'],
};

// Helper function to get keywords for a language
export function getKeywordsForLanguage(lang: string): string[] {
  const allKeywords: string[] = [];
  
  const langKey = lang as keyof typeof EVENT_KEYWORDS;
  if (EVENT_KEYWORDS[langKey]) {
    allKeywords.push(...EVENT_KEYWORDS[langKey]);
  }
  
  DISEASE_KEYWORDS.forEach(disease => {
    const keywords = disease.keywords[langKey as keyof typeof disease.keywords];
    if (keywords) {
      allKeywords.push(...keywords);
    }
  });
  
  SYMPTOM_KEYWORDS.forEach(symptom => {
    const keywords = symptom.keywords[langKey as keyof typeof symptom.keywords];
    if (keywords) {
      allKeywords.push(...keywords);
    }
  });
  
  return [...new Set(allKeywords)];
}

// Helper to detect language from text
export function detectLanguageFromText(text: string): string | null {
  // Check for non-Latin scripts first
  if (LANGUAGE_DETECTION.amharic.test(text)) return 'am';
  if (LANGUAGE_DETECTION.arabic.test(text)) return 'ar';
  
  // Check for Latin-based African language patterns
  if (LANGUAGE_DETECTION.hausa.test(text)) return 'ha';
  if (LANGUAGE_DETECTION.yoruba.test(text)) return 'yo';
  if (LANGUAGE_DETECTION.igbo.test(text)) return 'ig';
  if (LANGUAGE_DETECTION.fulfulde.test(text)) return 'ff';
  
  return null;
}
