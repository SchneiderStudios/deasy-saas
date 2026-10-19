import React from 'react';

/**
 * Подсветка маркером в тексте разбора: даты, время, суммы и номер дела.
 * Ничего не меняет в тексте — только оборачивает найденные куски в <mark>.
 * Используется на экране разбора («лист с пометками»).
 */

const MUSTER = [
  /\b\d{1,2}\.\s?\d{1,2}\.\s?\d{4}\b/g, // 28.10.2026 — только с полным годом, чтобы не подсветить «кабинет 3.12»
  /\b\d{1,2}\.\s?(?:Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember)\s?\d{0,4}\b/gi,
  /\b\d{1,2}\s?(?:января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)(?:\s?\d{4})?(?:\s?года)?\b/gi,
  /\b\d{1,2}:\d{2}(?:\s?(?:Uhr|час[а-я]*))?\b/g, // 9:30, 9:30 Uhr (точка не считается временем: «кабинет 3.12»)
  /\b\d{1,3}(?:[.\s]\d{3})*(?:,\d{2})?\s?(?:€|EUR|евро)\b/gi, // 123,45 €
];

function spans(text: string, extra: string[]): [number, number][] {
  const found: [number, number][] = [];
  const quellen = [...MUSTER];
  for (const e of extra) {
    const s = e.trim();
    if (s.length >= 4) quellen.push(new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'));
  }
  for (const re of quellen) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      if (m[0].trim()) found.push([m.index, m.index + m[0].length]);
      if (m.index === re.lastIndex) re.lastIndex++;
    }
  }
  // убрать пересечения: сначала более ранние и более длинные
  found.sort((a, b) => a[0] - b[0] || b[1] - a[1]);
  const out: [number, number][] = [];
  for (const s of found) {
    if (!out.length || s[0] >= out[out.length - 1][1]) out.push(s);
  }
  return out;
}

/** Возвращает текст с подсвеченными кусками. markClass — класс для <mark>. */
export function markieren(text: string, markClass: string, extra: string[] = []): React.ReactNode {
  if (!text) return text;
  const stellen = spans(text, extra);
  if (!stellen.length) return text;
  const teile: React.ReactNode[] = [];
  let pos = 0;
  stellen.forEach(([a, b], i) => {
    if (a > pos) teile.push(text.slice(pos, a));
    teile.push(
      <mark key={`m${i}`} className={markClass}>
        {text.slice(a, b)}
      </mark>
    );
    pos = b;
  });
  if (pos < text.length) teile.push(text.slice(pos));
  return teile;
}

/** Делит разбор на первую фразу (заголовок) и остальной текст. */
export function ersterSatz(text: string): [string, string] {
  const t = (text || '').trim();
  const m = t.match(/^([\s\S]{25,150}?[.!?])\s+([\s\S]+)$/);
  if (!m) return ['', t];
  return [m[1].trim(), m[2].trim()];
}
