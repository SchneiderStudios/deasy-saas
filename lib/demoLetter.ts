/**
 * Пример разбора для кнопки «Попробовать на примере» (/app?demo=1).
 * Без загрузки, без ИИ-запроса, лимит не списывается. Письмо вымышленное.
 */

export const DEMO_LETTER_TEXT = `Jobcenter Berlin Musterbezirk
Musterstraße 1, 10115 Berlin
Telefon: 030 5555 0000

Herrn Max Muster
Beispielweg 7, 10117 Berlin

Berlin, 01.10.2026
BG-Nummer: 12345BG0098765

Einladung

Sehr geehrter Herr Muster,

bitte kommen Sie am 28.10.2026 um 09:30 Uhr in das Jobcenter, Zimmer 3.12,
um mit mir über Ihre aktuelle berufliche Situation zu sprechen.

Bitte bringen Sie mit:
– Ihren Personalausweis oder Reisepass
– Ihren aktuellen Lebenslauf
– Nachweise über Ihre Bewerbungen der letzten 3 Monate

Wenn Sie ohne wichtigen Grund nicht erscheinen, können Ihre Leistungen
gemindert werden.
Können Sie den Termin nicht wahrnehmen, melden Sie sich bitte vorher.

Mit freundlichen Grüßen
Im Auftrag
A. Beispiel`;

type Lang = 'de' | 'ru';

export interface DemoAnalysis {
  summary: string;
  risk: 'Gering' | 'Mittel' | 'Kritisch';
  deadlines: string[];
  actions: string[];
  language: Lang;
  absender: string;
  aktenzeichen: string;
  briefdatum: string;
  telefon: string;
  fristen: { datum: string; was: string }[];
  unterlagen: string[];
  echtheit: 'unauffaellig' | 'pruefen';
  betrugsHinweise: string[];
}

const COMMON = {
  risk: 'Kritisch' as const,
  absender: 'Jobcenter Berlin Musterbezirk',
  aktenzeichen: '12345BG0098765',
  briefdatum: '01.10.2026',
  telefon: '030 5555 0000',
  echtheit: 'unauffaellig' as const,
  betrugsHinweise: [] as string[],
};

export const DEMO_ANALYSIS: Record<Lang, DemoAnalysis> = {
  ru: {
    ...COMMON,
    language: 'ru',
    summary:
      'Jobcenter приглашает вас на личную встречу (Einladung) 28 октября 2026 года в 9:30, кабинет 3.12. Хотят поговорить о вашей работе и поиске работы. С собой нужно взять паспорт или удостоверение личности, резюме и подтверждения откликов на вакансии за последние 3 месяца. В письме сказано: если не прийти без уважительной причины, выплаты могут сократить. Если прийти не получается, нужно заранее сообщить в Jobcenter.',
    fristen: [{ datum: '2026-10-28', was: 'Встреча в Jobcenter в 9:30, кабинет 3.12' }],
    deadlines: ['28.10.2026 – Встреча в Jobcenter в 9:30, кабинет 3.12'],
    unterlagen: [
      'Паспорт или удостоверение личности (Personalausweis / Reisepass)',
      'Актуальное резюме (Lebenslauf)',
      'Подтверждения откликов на вакансии за последние 3 месяца',
    ],
    actions: [
      'Прийти 28.10.2026 к 9:30 или заранее сообщить, если не получается (телефон: 030 5555 0000)',
      'Подготовить документы из списка',
      'Если что-то непонятно — позвонить в Jobcenter или спросить в Migrationsberatung',
    ],
  },
  de: {
    ...COMMON,
    language: 'de',
    summary:
      'Das Jobcenter lädt Sie zu einem persönlichen Termin (Einladung) am 28.10.2026 um 09:30 Uhr in Zimmer 3.12 ein. Es geht um Ihre berufliche Situation. Mitbringen sollen Sie: Ausweis oder Reisepass, Ihren aktuellen Lebenslauf und Nachweise über Bewerbungen der letzten 3 Monate. Laut Brief können Ihre Leistungen gemindert werden, wenn Sie ohne wichtigen Grund nicht erscheinen. Wenn Sie nicht kommen können, sollen Sie sich vorher melden.',
    fristen: [{ datum: '2026-10-28', was: 'Termin im Jobcenter um 09:30 Uhr, Zimmer 3.12' }],
    deadlines: ['28.10.2026 – Termin im Jobcenter um 09:30 Uhr, Zimmer 3.12'],
    unterlagen: ['Personalausweis oder Reisepass', 'Aktueller Lebenslauf', 'Nachweise über Bewerbungen der letzten 3 Monate'],
    actions: [
      'Am 28.10.2026 um 09:30 Uhr erscheinen oder vorher absagen (Telefon: 030 5555 0000)',
      'Die genannten Unterlagen vorbereiten',
      'Bei Unklarheiten das Jobcenter anrufen oder eine Migrationsberatung fragen',
    ],
  },
};
