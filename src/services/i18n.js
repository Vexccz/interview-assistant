// i18n - Multi-language support (EN/BM)

const translations = {
  en: {
    // Controls
    start: '▶ Start',
    stop: '⏹ Stop',
    clear: 'Clear',
    settings: 'Settings',
    minimize: 'Minimize',

    // Modes
    listening: '● LIVE',
    paused: '⏸ PAUSED',
    hidden: '👁 HIDDEN',

    // Overlay
    interviewer: '🎤 Interviewer',
    suggestedResponse: '💡 Suggested Response',
    generating: 'generating...',
    listeningPlaceholder: 'Listening for questions...',
    startPlaceholder: 'Press Ctrl+Shift+Space to start',
    responsePlaceholder: 'AI response will appear here after the interviewer finishes speaking',

    // Settings tabs
    tabGeneral: 'General',
    tabAudio: 'Audio',
    tabAI: 'AI',
    tabDisplay: 'Display',

    // Settings - General
    llmConfig: 'LLM Configuration',
    apiBaseUrl: 'API Base URL',
    apiKey: 'API Key',
    model: 'Model',
    ollamaPreset: 'Use Ollama (Local)',
    ollamaDetected: '✓ Ollama detected',
    ollamaNotFound: '✗ Ollama not running',
    interviewContext: 'Interview Context',
    resume: 'Your Resume',
    jobDescription: 'Job Description',
    companyInfo: 'Company Info',
    language: 'Language',

    // Settings - Audio
    audioSource: 'Audio Source',
    micOnly: 'Microphone Only',
    systemOnly: 'System Audio Only',
    both: 'Both (Mic + System)',
    noiseCancellation: 'Noise Cancellation',
    enableNoiseGate: 'Enable noise gate filter',
    sttEngine: 'Speech-to-Text Engine',
    useDeepgram: 'Use Deepgram (better accuracy)',
    deepgramKey: 'Deepgram API Key',

    // Settings - AI
    responseMode: 'Response Mode',
    concise: 'Concise (2-3 sentences)',
    detailed: 'Detailed (full answer)',
    starMethod: 'STAR Method',
    enableStar: 'Auto-format behavioral answers with STAR',
    bulletMode: 'Bullet Point Mode',
    enableBullets: 'Format answers as bullet points',

    // Settings - Display
    fontSize: 'Font Size',
    opacity: 'Overlay Opacity',
    theme: 'Theme',
    dark: 'Dark',
    light: 'Light',

    // Actions
    save: 'Save Settings',
    cancel: 'Cancel',
    saveTranscript: 'Save Transcript',
    questionBank: 'Question Bank',
    analytics: 'Analytics',
    copy: 'Copy',
    copied: 'Copied!',

    // Analytics
    analyticsTitle: 'Interview Analytics',
    totalQuestions: 'Total Questions',
    avgResponseTime: 'Avg Time Between Questions',
    duration: 'Interview Duration',
    typeBreakdown: 'Question Types',
    topicsDiscussed: 'Topics Discussed',
    noData: 'No interview data yet. Start an interview to see analytics.',
    seconds: 's',
    minutes: 'min',

    // Question Bank
    questionBankTitle: 'Common Interview Questions',
    allCategories: 'All',
    behavioral: 'Behavioral',
    technical: 'Technical',
    general: 'General',
    practiceThis: 'Practice',

    // Confidence
    confidenceHigh: '🟢 High',
    confidenceMedium: '🟡 Medium',
    confidenceLow: '🔴 Low'
  },
  bm: {
    // Controls
    start: '▶ Mula',
    stop: '⏹ Berhenti',
    clear: 'Padam',
    settings: 'Tetapan',
    minimize: 'Kecilkan',

    // Modes
    listening: '● AKTIF',
    paused: '⏸ JEDA',
    hidden: '👁 SEMBUNYI',

    // Overlay
    interviewer: '🎤 Penemuduga',
    suggestedResponse: '💡 Cadangan Jawapan',
    generating: 'menjana...',
    listeningPlaceholder: 'Mendengar soalan...',
    startPlaceholder: 'Tekan Ctrl+Shift+Space untuk mula',
    responsePlaceholder: 'Jawapan AI akan muncul di sini selepas penemuduga selesai bercakap',

    // Settings tabs
    tabGeneral: 'Umum',
    tabAudio: 'Audio',
    tabAI: 'AI',
    tabDisplay: 'Paparan',

    // Settings - General
    llmConfig: 'Konfigurasi LLM',
    apiBaseUrl: 'URL API',
    apiKey: 'Kunci API',
    model: 'Model',
    ollamaPreset: 'Guna Ollama (Lokal)',
    ollamaDetected: '✓ Ollama dikesan',
    ollamaNotFound: '✗ Ollama tidak aktif',
    interviewContext: 'Konteks Temuduga',
    resume: 'Resume Anda',
    jobDescription: 'Deskripsi Kerja',
    companyInfo: 'Info Syarikat',
    language: 'Bahasa',

    // Settings - Audio
    audioSource: 'Sumber Audio',
    micOnly: 'Mikrofon Sahaja',
    systemOnly: 'Audio Sistem Sahaja',
    both: 'Kedua-dua (Mic + Sistem)',
    noiseCancellation: 'Pembatalan Bunyi',
    enableNoiseGate: 'Aktifkan penapis bunyi bising',
    sttEngine: 'Enjin Pertuturan-ke-Teks',
    useDeepgram: 'Guna Deepgram (lebih tepat)',
    deepgramKey: 'Kunci API Deepgram',

    // Settings - AI
    responseMode: 'Mod Jawapan',
    concise: 'Ringkas (2-3 ayat)',
    detailed: 'Terperinci (jawapan penuh)',
    starMethod: 'Kaedah STAR',
    enableStar: 'Format auto jawapan behavioral dengan STAR',
    bulletMode: 'Mod Bullet Point',
    enableBullets: 'Format jawapan sebagai bullet points',

    // Settings - Display
    fontSize: 'Saiz Font',
    opacity: 'Ketelusan Overlay',
    theme: 'Tema',
    dark: 'Gelap',
    light: 'Cerah',

    // Actions
    save: 'Simpan Tetapan',
    cancel: 'Batal',
    saveTranscript: 'Simpan Transkrip',
    questionBank: 'Bank Soalan',
    analytics: 'Analitik',
    copy: 'Salin',
    copied: 'Disalin!',

    // Analytics
    analyticsTitle: 'Analitik Temuduga',
    totalQuestions: 'Jumlah Soalan',
    avgResponseTime: 'Purata Masa Antara Soalan',
    duration: 'Tempoh Temuduga',
    typeBreakdown: 'Jenis Soalan',
    topicsDiscussed: 'Topik Dibincangkan',
    noData: 'Tiada data temuduga lagi. Mulakan temuduga untuk lihat analitik.',
    seconds: 's',
    minutes: 'min',

    // Question Bank
    questionBankTitle: 'Soalan Temuduga Lazim',
    allCategories: 'Semua',
    behavioral: 'Behavioral',
    technical: 'Teknikal',
    general: 'Umum',
    practiceThis: 'Latih',

    // Confidence
    confidenceHigh: '🟢 Tinggi',
    confidenceMedium: '🟡 Sederhana',
    confidenceLow: '🔴 Rendah'
  }
};

export function t(key, language = 'en') {
  return translations[language]?.[key] || translations.en[key] || key;
}

export function getLanguages() {
  return [
    { code: 'en', label: 'English' },
    { code: 'bm', label: 'Bahasa Malaysia' }
  ];
}
