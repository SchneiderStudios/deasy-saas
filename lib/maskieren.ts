/**
 * Скрытие персональных данных в тексте, который пользователь пишет в чат, до отправки ИИ.
 * Работает в браузере. Не ловит всё (имена и адреса — нет), поэтому в UI честно пишем «автоматически скрываются номера счетов, карт и e-mail».
 */

const REGELN: { re: RegExp; ersatz: string }[] = [
  // IBAN (DE89 3704 0044 0532 0130 00 и др. страны ЕС)
  { re: /\b[A-Z]{2}\d{2}(?:[ ]?[A-Z0-9]{4}){2,7}(?:[ ]?[A-Z0-9]{1,3})?\b/g, ersatz: '[IBAN]' },
  // E-mail
  { re: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, ersatz: '[E-Mail]' },
  // Номер карты (13–19 цифр, с пробелами или дефисами)
  { re: /\b(?:\d[ -]?){12,18}\d\b/g, ersatz: '[Kartennummer]' },
  // Steuer-ID (11 цифр подряд или блоками 2-3-3-3)
  { re: /\b\d{2}[ ]?\d{3}[ ]?\d{3}[ ]?\d{3}\b/g, ersatz: '[Nummer]' },
];

export function maskieren(text: string): { text: string; geaendert: boolean } {
  let out = text;
  for (const r of REGELN) out = out.replace(r.re, r.ersatz);
  return { text: out, geaendert: out !== text };
}
