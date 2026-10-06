/**
 * Антворт-шаблоны для /api/generate-reply (RDG): текст писем ЗАДАН здесь и не пишется ИИ.
 * ИИ только вытаскивает факты из письма (ведомство, Aktenzeichen, даты, сумма, документы)
 * и дословно переводит слова пользователя на немецкий. Свою аргументацию ИИ не добавляет.
 */

export type ReplyType = 'fristverlaengerung' | 'ratenzahlung' | 'unterlagen' | 'rueckfrage' | 'bestaetigung';
export const REPLY_TYPE_IDS: ReplyType[] = ['fristverlaengerung', 'ratenzahlung', 'unterlagen', 'rueckfrage', 'bestaetigung'];

export interface Fakten {
  behoerde?: string;
  adresse?: string;
  aktenzeichen?: string;
  briefdatum?: string; // TT.MM.JJJJ
  frist?: string; // TT.MM.JJJJ
  betrag?: string; // "123,45 €"
  unterlagen?: string[];
  angaben_de?: string; // слова пользователя на немецком
  angaben_ru?: string; // слова пользователя на русском
}

export interface BuiltReply {
  subject: string;
  body: string;
  translation: string;
  tips: string[];
  placeholders: string[];
}

const v = (x: string | undefined, ph: string) => (x && x.trim() ? x.trim() : `[${ph}]`);

function kopf(f: Fakten, betreff: string) {
  return [
    '[Ihr Vor- und Nachname]',
    '[Ihre Straße und Hausnummer]',
    '[PLZ und Ort]',
    '',
    v(f.behoerde, 'Behörde'),
    v(f.adresse, 'Adresse der Behörde'),
    '',
    '[Ort], [Datum]',
    '',
    `Aktenzeichen: ${v(f.aktenzeichen, 'Aktenzeichen / Kundennummer')}`,
    `Ihr Schreiben vom ${v(f.briefdatum, 'Datum des Briefes')} – ${betreff}`,
    '',
    'Sehr geehrte Damen und Herren,',
    '',
    '',
  ].join('\n');
}

const GRUSS = '\n\nMit freundlichen Grüßen\n\n\n[Unterschrift]\n[Ihr Vor- und Nachname]';

const TEXTE: Record<ReplyType, { betreff: string; betreffRu: string; de: (f: Fakten) => string; ru: (f: Fakten) => string }> = {
  fristverlaengerung: {
    betreff: 'Bitte um Fristverlängerung',
    betreffRu: 'Просьба продлить срок',
    de: (f) =>
      `vielen Dank für Ihr Schreiben. Die darin genannte Frist bis zum ${v(f.frist, 'Frist laut Brief')} kann ich leider nicht einhalten.\n\nGrund: ${v(f.angaben_de, 'Grund in eigenen Worten')}\n\nIch bitte Sie daher, die Frist bis zum [neues Datum] zu verlängern. Für eine kurze Bestätigung wäre ich Ihnen dankbar.`,
    ru: (f) =>
      `благодарю за ваше письмо. К указанному в нём сроку (${v(f.frist, 'срок из письма')}) я, к сожалению, не успеваю.\n\nПричина: ${v(f.angaben_ru, 'причина своими словами')}\n\nПрошу продлить срок до [новая дата]. Буду благодарен(на) за короткое подтверждение.`,
  },
  ratenzahlung: {
    betreff: 'Bitte um Ratenzahlung',
    betreffRu: 'Просьба о рассрочке',
    de: (f) =>
      `vielen Dank für Ihr Schreiben. Den geforderten Betrag von ${v(f.betrag, 'Betrag laut Brief')} kann ich leider nicht auf einmal bezahlen.\n\n${f.angaben_de ? `${f.angaben_de}\n\n` : ''}Ich bitte Sie, mir eine Zahlung in monatlichen Raten von [Betrag] € ab dem [Datum] zu ermöglichen. Bitte teilen Sie mir mit, ob Sie damit einverstanden sind.`,
    ru: (f) =>
      `благодарю за ваше письмо. Требуемую сумму (${v(f.betrag, 'сумма из письма')}) я, к сожалению, не могу оплатить сразу.\n\n${f.angaben_ru ? `${f.angaben_ru}\n\n` : ''}Прошу разрешить мне платить ежемесячно по [сумма] € начиная с [дата]. Пожалуйста, сообщите, согласны ли вы.`,
  },
  unterlagen: {
    betreff: 'Nachreichung von Unterlagen',
    betreffRu: 'Досылаю документы',
    de: (f) =>
      `wie in Ihrem Schreiben angefordert, sende ich Ihnen anbei folgende Unterlagen:\n\n${(f.unterlagen && f.unterlagen.length ? f.unterlagen : ['[Unterlage 1]', '[Unterlage 2]']).map((u) => `– ${u}`).join('\n')}\n${f.angaben_de ? `\n${f.angaben_de}\n` : ''}\nBitte bestätigen Sie mir kurz den Eingang.`,
    ru: (f) =>
      `как вы просили в письме, прилагаю следующие документы:\n\n${(f.unterlagen && f.unterlagen.length ? f.unterlagen : ['[документ 1]', '[документ 2]']).map((u) => `– ${u}`).join('\n')}\n${f.angaben_ru ? `\n${f.angaben_ru}\n` : ''}\nПрошу коротко подтвердить получение.`,
  },
  rueckfrage: {
    betreff: 'Rückfrage',
    betreffRu: 'Вопрос по письму',
    de: (f) =>
      `vielen Dank für Ihr Schreiben. Dazu habe ich eine Frage:\n\n${v(f.angaben_de, 'Ihre Frage')}\n\nIch bitte um eine kurze Erklärung. Gern können Sie mich auch telefonisch unter [Ihre Telefonnummer] erreichen.`,
    ru: (f) =>
      `благодарю за ваше письмо. У меня есть вопрос:\n\n${v(f.angaben_ru, 'ваш вопрос')}\n\nПрошу коротко пояснить. Также можно позвонить мне по номеру [ваш телефон].`,
  },
  bestaetigung: {
    betreff: 'Eingangsbestätigung',
    betreffRu: 'Подтверждение получения',
    de: (f) =>
      `hiermit bestätige ich den Erhalt Ihres Schreibens vom ${v(f.briefdatum, 'Datum des Briefes')}.${f.angaben_de ? `\n\n${f.angaben_de}` : ''}`,
    ru: (f) =>
      `настоящим подтверждаю получение вашего письма от ${v(f.briefdatum, 'дата письма')}.${f.angaben_ru ? `\n\n${f.angaben_ru}` : ''}`,
  },
};

const TIPPS: Record<'de' | 'ru', string[]> = {
  de: [
    'Füllen Sie alle Stellen in [eckigen Klammern] aus und prüfen Sie jeden Satz – Sie unterschreiben den Brief.',
    'Senden Sie den Brief vor Ablauf der Frist; wichtig: per Einschreiben oder Fax, oder geben Sie ihn persönlich ab und lassen Sie sich den Eingang bestätigen.',
    'Behalten Sie eine Kopie des Briefes und aller Anlagen.',
    'Unsicher? Fragen Sie vor dem Absenden die Behörde (Telefon im Briefkopf) oder eine Beratungsstelle.',
  ],
  ru: [
    'Заполните все места в [квадратных скобках] и проверьте каждое предложение — письмо подписываете вы.',
    'Отправьте письмо до истечения срока; важное — заказным письмом (Einschreiben) или факсом, либо отнесите лично и попросите отметку о получении.',
    'Сохраните копию письма и всех приложений.',
    'Сомневаетесь? До отправки спросите само ведомство (телефон в шапке письма) или консультацию (Beratungsstelle).',
  ],
};

export function buildReply(type: ReplyType, f: Fakten, language: 'de' | 'ru'): BuiltReply {
  const t = TEXTE[type];
  const body = kopf(f, t.betreff) + t.de(f) + GRUSS;
  const translation =
    language === 'ru'
      ? [
          `Тема: ${t.betreffRu}`,
          '',
          'Уважаемые дамы и господа,',
          '',
          t.ru(f),
          '',
          'С уважением,',
          '[подпись, имя и фамилия]',
        ].join('\n')
      : '';
  const placeholders = Array.from(new Set(body.match(/\[[^\]]+\]/g) || [])).map((p) => p.slice(1, -1));
  return {
    subject: `Aktenzeichen ${v(f.aktenzeichen, 'Aktenzeichen')} – ${t.betreff}`,
    body,
    translation,
    tips: TIPPS[language],
    placeholders,
  };
}
