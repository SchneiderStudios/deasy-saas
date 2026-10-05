export interface ReplyTemplate {
  id: string;
  title_de: string;
  title_ru: string;
  body_de: string;
  body_ru: string;
}

/** Готовые шаблоны без ИИ — запасной вариант. Письмо в ведомство всегда на немецком, body_ru — перевод для понимания. */
export const REPLY_TEMPLATES: ReplyTemplate[] = [
  {
    id: 'widerspruch_jobcenter',
    title_de: 'Widerspruch beim Jobcenter',
    title_ru: 'Возражение в Jobcenter (Widerspruch)',
    body_de: `[Ihr Name]
[Ihre Adresse]

Jobcenter [Ort]
[Adresse]

[Ort], [Datum]

BG-Nummer: [Nummer der Bedarfsgemeinschaft]
Widerspruch gegen den Bescheid vom [Datum des Bescheids]

Sehr geehrte Damen und Herren,

gegen den oben genannten Bescheid lege ich hiermit Widerspruch ein.

Begründung:
[Begründung einfügen]

Ich bitte um Überprüfung des Bescheids und um eine schriftliche Eingangsbestätigung.

Mit freundlichen Grüßen

[Ihr Name]`,
    body_ru: `Перевод: подаю возражение против решения от [дата]. Обоснование: [...]. Прошу пересмотреть решение и письменно подтвердить получение.`,
  },
  {
    id: 'fristverlaengerung',
    title_de: 'Bitte um Fristverlängerung',
    title_ru: 'Просьба продлить срок',
    body_de: `[Ihr Name]
[Ihre Adresse]

[Behörde]
[Adresse]

[Ort], [Datum]

Aktenzeichen: [Aktenzeichen]
Ihr Schreiben vom [Datum] – Bitte um Fristverlängerung

Sehr geehrte Damen und Herren,

für Ihr Schreiben vom [Datum] danke ich Ihnen. Leider kann ich die gesetzte Frist bis zum [Frist] nicht einhalten, weil [Grund].

Ich bitte daher um eine Verlängerung der Frist bis zum [neues Datum].

Mit freundlichen Grüßen

[Ihr Name]`,
    body_ru: `Перевод: благодарю за письмо от [дата]. К сожалению, не могу уложиться в срок до [срок], потому что [причина]. Прошу продлить срок до [новая дата].`,
  },
  {
    id: 'vermieter',
    title_de: 'Antwort an den Vermieter',
    title_ru: 'Ответ арендодателю',
    body_de: `[Ihr Name]
[Ihre Adresse]

[Name des Vermieters]
[Adresse]

[Ort], [Datum]

Ihr Schreiben vom [Datum]

Sehr geehrte(r) [Name],

bezüglich Ihres Schreibens vom [Datum] teile ich Ihnen Folgendes mit:

[Antwort einfügen]

Für Rückfragen stehe ich gern zur Verfügung.

Mit freundlichen Grüßen

[Ihr Name]`,
    body_ru: `Перевод: по поводу вашего письма от [дата] сообщаю следующее: [...]. Готов(а) ответить на вопросы.`,
  },
];
