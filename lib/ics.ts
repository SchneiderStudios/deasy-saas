/**
 * Календарный файл .ics (RFC 5545) для сроков из письма — работает в Apple/Google/Outlook-календаре.
 * Событие на весь день + напоминания за 3 дня и за 1 день. Ничего не отправляется на сервер.
 */

export interface Frist {
  datum: string; // YYYY-MM-DD
  was: string;
}

const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

/** Строки длиннее 75 октетов переносятся (требование RFC 5545). */
function fold(line: string): string {
  const out: string[] = [];
  let rest = line;
  while (new TextEncoder().encode(rest).length > 74) {
    let cut = 74;
    while (new TextEncoder().encode(rest.slice(0, cut)).length > 74) cut--;
    out.push(rest.slice(0, cut));
    rest = ' ' + rest.slice(cut);
  }
  out.push(rest);
  return out.join('\r\n');
}

function nextDay(iso: string): string {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10).replace(/-/g, '');
}

export function buildIcs(fristen: Frist[], absender: string, aktenzeichen?: string): string {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const events = fristen.map((f, i) => {
    const title = `Frist: ${absender || 'Behördenbrief'} – ${f.was}`.slice(0, 140);
    const desc = [f.was, aktenzeichen && `Aktenzeichen: ${aktenzeichen}`, 'Erinnerung von DEASY (KI-generiert, bitte mit dem Brief abgleichen)']
      .filter(Boolean)
      .join('\n');
    return [
      'BEGIN:VEVENT',
      `UID:deasy-${f.datum}-${i}-${Math.random().toString(36).slice(2, 10)}@deasy`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${f.datum.replace(/-/g, '')}`,
      `DTEND;VALUE=DATE:${nextDay(f.datum)}`,
      `SUMMARY:${esc(title)}`,
      `DESCRIPTION:${esc(desc)}`,
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${esc(title)}`,
      'TRIGGER:-P3D',
      'END:VALARM',
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${esc(title)}`,
      'TRIGGER:-P1D',
      'END:VALARM',
      'END:VEVENT',
    ];
  });
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//DEASY//Fristen//DE', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', ...events.flat(), 'END:VCALENDAR']
    .map(fold)
    .join('\r\n');
}

export function downloadIcs(fristen: Frist[], absender: string, aktenzeichen?: string) {
  const blob = new Blob([buildIcs(fristen, absender, aktenzeichen)], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fristen.length === 1 ? `Frist_${fristen[0].datum}.ics` : 'Fristen_DEASY.ics';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** «2026-10-15» → «15.10.2026» */
export const fmtDate = (iso: string) => iso.split('-').reverse().join('.');

/** Сколько дней осталось (отрицательное — срок прошёл). */
export function daysLeft(iso: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((new Date(`${iso}T00:00:00`).getTime() - today.getTime()) / 86400000);
}
