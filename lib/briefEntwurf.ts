/**
 * Конструктор письма (/brief): структура письма и разбор текста из шаблонов
 * (lib/replyBuilder.ts, lib/replyTemplates.ts) в поля формы DIN 5008.
 * Всё работает только в браузере — на сервер ничего не отправляется.
 */

export interface BriefFelder {
  absenderName: string;
  absenderStrasse: string;
  absenderOrt: string;
  empfaengerFirma: string;
  empfaengerName: string;
  empfaengerStrasse: string;
  empfaengerOrt: string;
  ort: string;
  datum: string;
  zeichen: string;
  betreff: string;
  text: string;
  gruss: string;
  unterschrift: string;
}

export const LEER: BriefFelder = {
  absenderName: '',
  absenderStrasse: '',
  absenderOrt: '',
  empfaengerFirma: '',
  empfaengerName: '',
  empfaengerStrasse: '',
  empfaengerOrt: '',
  ort: '',
  datum: '',
  zeichen: '',
  betreff: '',
  text: '',
  gruss: 'Mit freundlichen Grüßen',
  unterschrift: '',
};

/** Ключ localStorage: «Написать ответ» → «Оформить письмо по DIN» (новая вкладка). Удаляется сразу после чтения. */
export const ENTWURF_KEY = 'deasyBriefEntwurf';
/** Ключ localStorage: адрес отправителя, только если пользователь сам попросил запомнить. */
export const ABSENDER_KEY = 'deasyAbsender';

const PLATZHALTER = /^\[[^\]]*\]$/;
const echt = (s: string | undefined) => (s && !PLATZHALTER.test(s.trim()) ? s.trim() : '');

/**
 * Разбирает письмо в формате шаблонов DEASY:
 * отправитель · пустая строка · получатель · пустая строка · «Ort, Datum» · пустая строка ·
 * «Aktenzeichen: …» и строка темы · «Sehr geehrte …» … «Mit freundlichen Grüßen» · подпись.
 * Плейсхолдеры в [квадратных скобках] в адресных полях не переносятся — их заполняет пользователь.
 */
export function parseBrief(raw: string, extra?: { betreff?: string }): Partial<BriefFelder> {
  const lines = raw.replace(/\r/g, '').split('\n');
  const anrede = lines.findIndex((l) => /^\s*sehr geehrte/i.test(l));
  if (anrede < 0) return { text: raw.trim(), betreff: extra?.betreff || '' };

  // Блоки шапки, разделённые пустыми строками
  const kopf = lines.slice(0, anrede);
  const bloecke: string[][] = [];
  let cur: string[] = [];
  for (const l of kopf) {
    if (l.trim() === '') {
      if (cur.length) bloecke.push(cur);
      cur = [];
    } else cur.push(l.trim());
  }
  if (cur.length) bloecke.push(cur);

  const out: Partial<BriefFelder> = {};
  const [abs = [], emp = [], ortDatum = [], ref = []] = bloecke;

  out.absenderName = echt(abs[0]);
  out.absenderStrasse = echt(abs[1]);
  out.absenderOrt = echt(abs[2]);

  if (emp.length >= 3) {
    out.empfaengerFirma = echt(emp[0]);
    out.empfaengerName = echt(emp[1]);
    out.empfaengerStrasse = echt(emp[emp.length - 2]);
    out.empfaengerOrt = echt(emp[emp.length - 1]);
  } else {
    out.empfaengerFirma = echt(emp[0]);
    // «Straße, PLZ Ort» одной строкой → разделяем по последней запятой
    const adr = echt(emp[1]);
    const m = adr.match(/^(.*),\s*(\d{5}\s+.+)$/);
    out.empfaengerStrasse = m ? m[1].trim() : adr;
    out.empfaengerOrt = m ? m[2].trim() : '';
  }

  const od = (ortDatum[0] || '').split(',');
  out.ort = echt(od[0]);
  out.datum = echt(od.slice(1).join(',').trim());

  const az = ref.find((l) => /^aktenzeichen\s*:/i.test(l));
  const azWert = az ? az.replace(/^aktenzeichen\s*:\s*/i, '') : '';
  out.zeichen = azWert && !PLATZHALTER.test(azWert) ? `Aktenzeichen: ${azWert}` : '';
  out.betreff = ref.filter((l) => l !== az).join(' ') || extra?.betreff || '';

  // Текст: от обращения до «Mit freundlichen Grüßen»
  const rest = lines.slice(anrede);
  const grussIdx = rest.findIndex((l) => /^\s*mit freundlichen gr(ü|ue)(ß|ss)en/i.test(l));
  const body = (grussIdx >= 0 ? rest.slice(0, grussIdx) : rest).join('\n').trim();
  out.text = body;
  if (grussIdx >= 0) {
    out.gruss = rest[grussIdx].trim();
    const nach = rest
      .slice(grussIdx + 1)
      .map((l) => l.trim())
      .filter(Boolean)
      .filter((l) => !/^\[unterschrift\]$/i.test(l));
    out.unterschrift = echt(nach[nach.length - 1]);
  }
  return out;
}

/** Сегодняшняя дата как TT.MM.JJJJ */
export const heute = () => {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
};
