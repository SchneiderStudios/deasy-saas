import type { NextApiRequest, NextApiResponse } from 'next';
import { sendMail, mailConfigured, ownerEmail } from '@/lib/mail';

/**
 * Анонимный отзыв под разбором (тест спроса).
 * POST /api/feedback { helpful: 'ja'|'teilweise'|'nein', missing?: string, language, demo?, website? (honeypot) }
 * → { success: true } — письмо владельцу (OWNER_EMAIL или COMPANY.email).
 */

const HELPFUL = ['ja', 'teilweise', 'nein'];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ success: false });
  const b = req.body || {};
  if (b.website) return res.status(200).json({ success: true }); // honeypot

  const helpful = HELPFUL.includes(b.helpful) ? b.helpful : null;
  if (!helpful) return res.status(400).json({ success: false, error: 'helpful fehlt' });
  const missing = String(b.missing || '').replace(/\r/g, '').trim().slice(0, 800);
  const language = b.language === 'ru' ? 'ru' : 'de';
  const demo = b.demo === true;

  if (!mailConfigured()) return res.status(503).json({ success: false });

  const icon = helpful === 'ja' ? '🟢' : helpful === 'teilweise' ? '🟡' : '🔴';
  try {
    await sendMail(
      ownerEmail(),
      `[DEASY Feedback] ${icon} geholfen: ${helpful}${demo ? ' · Beispiel' : ''}`,
      [
        `Geholfen: ${helpful}`,
        `Gefehlt: ${missing || '–'}`,
        `Sprache: ${language}`,
        `Quelle: ${demo ? 'Beispiel-Brief (Demo)' : 'eigener Brief'}`,
        `Zeit: ${new Date().toLocaleString('de-DE', { timeZone: 'Europe/Berlin' })}`,
      ].join('\n')
    );
  } catch (e: any) {
    console.error('Feedback-Mail fehlgeschlagen:', e?.message);
    return res.status(502).json({ success: false });
  }
  return res.status(200).json({ success: true });
}
