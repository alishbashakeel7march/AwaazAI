import { HeartPulse, Scale, Wallet } from 'lucide-react'

/**
 * Language configuration for MultiModel.
 * Every field drives a real behaviour somewhere in the app:
 *  - speechCode  -> Web Speech API (SpeechRecognition + speechSynthesis)
 *  - whisperCode -> Groq Whisper `language` hint (Balochi is not yet
 *                   supported by Whisper, so it falls back to Urdu)
 *  - script      -> which Arabic-script font family the UI renders with
 *  - ui          -> native UI strings; missing keys fall back to Urdu
 */
export const LANGUAGES = [
  {
    code: 'ur',
    name: 'Urdu',
    native: 'اردو',
    region: 'National',
    speechCode: 'ur-PK',
    whisperCode: 'ur',
    gttsCode: 'ur',
    dir: 'rtl',
    script: 'nastaliq',
    color: '#059669',
    ui: {
      tapToSpeak: 'بولنے کے لیے بٹن دبائیں',
      listening: 'سن رہا ہوں…',
      transcribing: 'آواز پڑھی جا رہی ہے…',
      thinking: 'جواب تیار ہو رہا ہے…',
      playAgain: 'دوبارہ سنیں',
      pause: 'روکیں',
      resume: 'جاری رکھیں',
      askAnother: 'نیا سوال پوچھیں',
      selectLanguage: 'اپنی زبان منتخب کریں',
      keyPoints: 'اہم نکات',
      error: 'معذرت، کچھ غلط ہو گیا۔ دوبارہ کوشش کریں۔',
      micDenied: 'براہ کرم مائیکروفون کی اجازت دیں',
      typeHint: 'یا سوال لکھیں…',
      disclaimer: 'یہ عمومی رہنمائی ہے — ذاتی معاملات کے لیے ماہر سے رجوع کریں۔',
      tryThis: 'یہ پوچھیں',
      youAsked: 'آپ کا سوال',
    },
  },
  {
    code: 'sd',
    name: 'Sindhi',
    native: 'سنڌي',
    region: 'Sindh',
    speechCode: 'sd-PK',
    whisperCode: 'sd',
    gttsCode: 'sd',
    dir: 'rtl',
    script: 'arabic',
    color: '#0891B2',
    ui: {
      tapToSpeak: 'ڳالهائڻ لاءِ دٻايو',
      listening: 'ٻڌي رهيو آهيان…',
      transcribing: 'آواز پڙهي رهيو آهي…',
      thinking: 'جواب تيار ٿي رهيو آهي…',
      playAgain: 'ٻيهر ٻڌو',
      pause: 'روڪيو',
      resume: 'جاري رکو',
      askAnother: 'ٻيو سوال پڇو',
      selectLanguage: 'پنهنجي ٻولي چونڊيو',
      keyPoints: 'اهم نكتا',
      error: 'معافي، ڪجهه غلط ٿي ويو. ٻيهر ڪوشش ڪريو.',
      micDenied: 'مهرباني ڪري مائڪروفون جي اجازت ڏيو',
      typeHint: 'يا سوال لکو…',
      disclaimer: 'هي عام رهنمائي آهي — ذاتي معاملن لاءِ ماھر سان رابطو ڪريو.',
      tryThis: 'هي پڇو',
      youAsked: 'توهان جو سوال',
    },
  },
  {
    code: 'ps',
    name: 'Pashto',
    native: 'پښتو',
    region: 'Khyber Pakhtunkhwa',
    speechCode: 'ps-PK',
    whisperCode: 'ps',
    gttsCode: 'ps',
    dir: 'rtl',
    script: 'arabic',
    color: '#7C3AED',
    ui: {
      tapToSpeak: 'د خبرو لپاره تڼۍ فشار کړه',
      listening: 'اوسېدم…',
      transcribing: 'غږ لولم…',
      thinking: 'ځواب جوړیږي…',
      playAgain: 'بیا واوره',
      pause: 'ودروه',
      resume: 'ادامه ورکړه',
      askAnother: 'بله پوښتنه وکړه',
      selectLanguage: 'خپله ژبه وټاکه',
      keyPoints: 'مهم ټکي',
      error: 'بښنه، یو اشتباه وشو. بیا هڅه وکړه.',
      micDenied: 'مهرباني وکړه مایکروفون ته اجازه ورکړه',
      typeHint: 'یا پوښتنه ولیکه…',
      disclaimer: 'دا عمومي لارښوونه ده — شخصي چارو لپاره متخصص سره مراجعه وکړه.',
      tryThis: 'دا وپوښته',
      youAsked: 'ستا پوښتنه',
    },
  },
  {
    code: 'pa',
    name: 'Punjabi',
    native: 'پنجابی',
    region: 'Punjab',
    speechCode: 'pa-PK',
    whisperCode: 'pa',
    gttsCode: 'pa',
    dir: 'rtl',
    script: 'nastaliq',
    color: '#EA580C',
    ui: {
      tapToSpeak: 'بولن لئی دباؤ',
      listening: 'سنی جاندا واں…',
      transcribing: 'آواز پڑھی جا رہی اے…',
      thinking: 'جواب بن رہیا اے…',
      playAgain: 'دوبارہ سݨو',
      pause: 'روکو',
      resume: 'جاری رکھو',
      askAnother: 'ہور سوال پچھو',
      selectLanguage: 'اپنی بولی چݨو',
      keyPoints: 'اہم گلاں',
      error: 'معاف کریا، کجھ غلط ہو گیا۔ دوبارہ کوشش کرو۔',
      micDenied: 'مہربانی کرکے مائیکروفون دی اجازت دیو',
      typeHint: 'یا سوال لکھو…',
      disclaimer: 'ایہہ عمومی رہنمائی اے — ذاتی معاملات لئی ماہر نال رابطہ کرو۔',
      tryThis: 'ایہہ پچھو',
      youAsked: 'تواڈا سوال',
    },
  },
  {
    code: 'bal',
    name: 'Balochi',
    native: 'بلوچی',
    region: 'Balochistan',
    speechCode: 'ur-PK',
    whisperCode: 'ur',
    gttsCode: 'ur',
    dir: 'rtl',
    script: 'arabic',
    color: '#DB2777',
    ui: {},
  },
]

export const CATEGORIES = [
  {
    id: 'health',
    name: 'Healthcare Guidance',
    emoji: '❤️',
    icon: HeartPulse,
    color: '#E11D48',
    soft: '#FFF1F2',
    native: {
      ur: 'صحت کے مشورے',
      sd: 'صحت جا مشورا',
      ps: 'د روغتیا مشورې',
      pa: 'صحت دے مشورے',
      bal: 'صحت دے مشورے',
    },
    examples: {
      ur: 'مجھے بخار ہے، کیا کروں؟',
      sd: 'مون کي تپ آهي، ڇا ڪريان؟',
      ps: 'تور لګیږم، څه وکړم؟',
      pa: 'مینوں بخار اے، کی کراں؟',
      bal: 'مجھے بخار ہے، کیا کروں؟',
    },
  },
  {
    id: 'finance',
    name: 'Financial Literacy',
    emoji: '💼',
    icon: Wallet,
    color: '#D97706',
    soft: '#FFFBEB',
    native: {
      ur: 'مالی خواندگی',
      sd: 'مالي تعليم',
      ps: 'مالي پوهه',
      pa: 'مالی خواندگی',
      bal: 'مالی خواندگی',
    },
    examples: {
      ur: 'پیسے بچانے کا آسان طریقہ کیا ہے؟',
      sd: 'پئسا بچائڻ جو آسان طريقو ڇا آهي؟',
      ps: 'پيسې خوندي کولو اسانه لار څه ده؟',
      pa: 'پیسے بچان دا آسان طریقہ کی اے؟',
      bal: 'پیسے بچانے کا آسان طریقہ کیا ہے؟',
    },
  },
  {
    id: 'legal',
    name: 'Civic & Legal Rights',
    emoji: '⚖️',
    icon: Scale,
    color: '#4F46E5',
    soft: '#EEF2FF',
    native: {
      ur: 'شہری و قانونی حقوق',
      sd: 'شهري ۽ قانوني حق',
      ps: 'مدني او قانوني حقوق',
      pa: 'شہری تے قانونی حقوق',
      bal: 'شہری و قانونی حقوق',
    },
    examples: {
      ur: 'پولیس میں FIR کیسے درج کروں؟',
      sd: 'پوليس ۾ FIR ڪيئن درج ڪريان؟',
      ps: 'پوليس کې FIR څنګه ثبت کړم؟',
      pa: 'پولیس وچ FIR کِویں لِکھواؤاں؟',
      bal: 'پولیس میں FIR کیسے درج کروں؟',
    },
  },
]

export const DEFAULT_LANGUAGE = LANGUAGES[0].code

export function getLanguage(code) {
  return LANGUAGES.find((l) => l.code === code) || LANGUAGES[0]
}

export function getCategory(id) {
  return CATEGORIES.find((c) => c.id === id) || null
}

export function nativeCategory(category, langCode) {
  if (!category) return 'General'
  return category.native[langCode] || category.native.ur || category.name
}

export function exampleFor(category, langCode) {
  if (!category) return ''
  return category.examples[langCode] || category.examples.ur
}

export function scriptClass(lang) {
  return lang?.script === 'nastaliq' ? 'font-nastaliq' : 'font-arabic'
}

export function t(langCode, key) {
  const lang = getLanguage(langCode)
  return (lang.ui && lang.ui[key]) || LANGUAGES[0].ui[key] || key
}
