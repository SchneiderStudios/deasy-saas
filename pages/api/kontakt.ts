import type { NextApiRequest, NextApiResponse } from 'next';
import { sendMail, mailConfigured, ownerEmail } from '@/lib/mail';

/**
 * Заявки «Стать тестером» и «Стать партнёром» (тест спроса).
 * POST /api/kontakt { art: 'tester'|'partner', name, email, organisation?, themen?: string[], nachricht?, language, einwilligung: true, website? (honeypot) }
 * → { success: true } — письмо владельцу (OWNER_EMAIL или COMPANY.email), ответ — прямо на e-mail заявителя.
 * Ничего не сохраняем на сервере (см. Datenschutz, раздел «Tester und Partner»).
 */

const THEMEN = ['jobcenter', 'krankenkasse', 'auslaenderbehoerde', 'vermieter', 'inkasso', 'rundfunk', 'betrug', 'sonstiges'];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const clean = (v: unknown, n: number) => String(v ?? '').replace(/\r/g, '').trim().slice(0, n);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ success: false });
  const b = req.body || {};
  if (b.website) return res.status(200).json({ success: true }); // honeypot

  const art = b.art === 'partner' ? 'partner' : b.art === 'tester' ? 'tester' : null;
  const name = clean(b.name, 100);
  const email = clean(b.email, 160);
  const organisation = clean(b.organisation, 160);
  const nachricht = clean(b.nachricht, 1500);
  const themen = Array.isArray(b.themen) ? b.themen.filter((x: unknown) => THEMEN.includes(String(x))).slice(0, 8) : [];
  const language = b.language === 'ru' ? 'ru' : 'de';

  if (!art || !name || !EMAIL.test(email) || b.einwilligung !== true || (art === 'partner' && !organisation)) {
    return res.status(400).json({ success: false, error: language === 'ru' ? 'Проверьте поля формы.' : 'Bitte Eingaben prüfen.' });
  }
  if (!mailConfigured()) return res.status(503).json({ success: false });

  try {
    await sendMail(
      ownerEmail(),
      art === 'tester' ? `[DEASY Tester] ${name}` : `[DEASY Partner] ${organisation} – ${name}`,
      [
        `Art: ${art === 'tester' ? 'Tester / Feedback-Gespräch' : 'Partner'}`,
        `Name: ${name}`,
        `E-Mail: ${email}`,
        organisation ? `Organisation: ${organisation}` : '',
        themen.length ? `Briefe von: ${themen.join(', ')}` : '',
        `Nachricht: ${nachricht || '–'}`,
        `Sprache: ${language}`,
        `Einwilligung Kontaktaufnahme: ja`,
        `Zeit: ${new Date().toLocaleString('de-DE', { timeZone: 'Europe/Berlin' })}`,
      ]
        .filter(Boolean)
        .join('\n'),
      email
    );
  } catch (e: any) {
    console.error('Kontakt-Mail fehlgeschlagen:', e?.message);
    return res.status(502).json({ success: false });
  }
  return res.status(200).json({ success: true });
}
