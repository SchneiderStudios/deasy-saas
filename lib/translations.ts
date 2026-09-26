export const translations = {
  de: {
    // Header
    appTitle: "DEASY",
    appSubtitle: "KI-Assistent für deutsche Behördenbriefe",

    // Navigation
    home: "Startseite",
    analyzer: "Analysieren",
    checkout: "Bezahlen",

    // Landing Page
    heroTitle: "Verstehen Sie Ihre Behördenbriefe",
    heroSubtitle: "Mit Claude AI analysieren wir deutsche Behördenschreiben und erklären Sie einfach",
    analyzeButton: "Jetzt analysieren",

    // Analyzer
    uploadTitle: "Dokument hochladen",
    uploadSubtitle: "Laden Sie einen Screenshot oder ein Foto Ihres Behördenbriefes hoch",
    uploadPlaceholder: "Klicken Sie zum Hochladen oder ziehen Sie Ihre Datei hierher",
    analyzing: "Wird analysiert...",
    uploadError: "Fehler beim Hochladen",

    // Results
    riskLevel: "Risiko-Level",
    critical: "Kritisch",
    important: "Wichtig",
    low: "Niedrig",
    summary: "Zusammenfassung",
    deadlines: "Fristen",
    nextSteps: "Nächste Schritte",

    // Chat
    chatPlaceholder: "Stellen Sie eine Frage zum Brief...",
    send: "Senden",
    chatError: "Chat-Fehler",

    // Pricing
    free: "Kostenlos",
    freeDescription: "2 Analysen",
    pro: "Pro",
    proDescription: "10 Analysen",
    proMonthly: "Pro Monatsabo",
    proMonthlyDescription: "100 Analysen/Monat",
    business: "Business",
    businessDescription: "Unlimited Analysen",
    upgradeButton: "Upgraden",
    upgradeTitle: "Wählen Sie einen Plan",
    upgradeSubtitle: "Sie haben 2 kostenlose Analysen verwendet",

    // Messages
    analysisLimitReached: "Sie haben Ihr Limit erreicht. Bitte wählen Sie einen Plan.",
    upgradeSuccess: "Vielen Dank für den Kauf!",
    technicalError: "Technischer Fehler bei der Analyse",
  },
  ru: {
    // Header
    appTitle: "DEASY",
    appSubtitle: "AI-ассистент для немецких официальных писем",

    // Navigation
    home: "Главная",
    analyzer: "Анализатор",
    checkout: "Оплата",

    // Landing Page
    heroTitle: "Разберитесь в официальных письмах",
    heroSubtitle: "Claude AI анализирует немецкие официальные письма и объясняет их просто",
    analyzeButton: "Начать анализ",

    // Analyzer
    uploadTitle: "Загрузить документ",
    uploadSubtitle: "Загрузите скриншот или фото вашего официального письма",
    uploadPlaceholder: "Нажмите для загрузки или перетащите файл",
    analyzing: "Анализируется...",
    uploadError: "Ошибка загрузки",

    // Results
    riskLevel: "Уровень риска",
    critical: "Критично",
    important: "Важно",
    low: "Низкий",
    summary: "Резюме",
    deadlines: "Сроки",
    nextSteps: "Следующие шаги",

    // Chat
    chatPlaceholder: "Задайте вопрос о письме...",
    send: "Отправить",
    chatError: "Ошибка чата",

    // Pricing
    free: "Бесплатно",
    freeDescription: "2 анализа",
    pro: "Про",
    proDescription: "10 анализов",
    proMonthly: "Про подписка",
    proMonthlyDescription: "100 анализов/месяц",
    business: "Бизнес",
    businessDescription: "Неограниченно",
    upgradeButton: "Обновить",
    upgradeTitle: "Выберите план",
    upgradeSubtitle: "Вы использовали 2 бесплатных анализа",

    // Messages
    analysisLimitReached: "Вы достигли лимита. Выберите план.",
    upgradeSuccess: "Спасибо за покупку!",
    technicalError: "Техническая ошибка при анализе",
  }
};

export type Language = 'de' | 'ru';
export type TranslationKey = keyof typeof translations.de;
