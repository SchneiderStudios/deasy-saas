import type { NextApiRequest, NextApiResponse } from 'next';
import Anthropic from '@anthropic-ai/sdk';

/**
 * Отдельная проверка на мошенничество: письмо, e-mail или SMS (фото/скриншот).
 * POST /api/check-fraud { images: string[], language: 'de'|'ru' }
 * → { success: true, check: { art, absender, echtheit, betrugsHinweise, entwarnung, schritte } }
 *
 * Работает для любых писем, включая «от Finanzamt»: это не консультация по налогам,
 * а проверка признаков подделки. Без правовой оценки самого требования.
 */

export const config = { api: { bodyParser: { sizeLimit: '4.5mb' } } };

const MODEL = 'claude-sonnet-5-5';
const MAX_PAGES = 3;
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const arr = (v: unknown, n = 8) => (Array.isArray(v) ? v.map((x) => String(x).trim()).filter(Boolean).slice(0, n) : []);

function extractJson(text: string): any | null {
  const m = text.replace(/```(?:json)?/gi, '').match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    return JSON.parse(m[0]);
  } catch {
    return null;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ success: false, error: 'Server-Konfiguration fehlt (API-Schlüssel)' });
  }

  const language: 'de' | 'ru' = req.body?.language === 'ru' ? 'ru' : 'de';
  const images: string[] = (Array.isArray(req.body?.images) ? req.body.images : [])
    .filter((s: unknown) => typeof s === 'string' && s)
    .slice(0, MAX_PAGES)
    .map((s: string) => s.replace(/^data:[^;]+;base64,/, ''));
  if (images.length === 0) {
    return res.status(400).json({ success: false, error: language === 'ru' ? 'Изображение не получено' : 'Kein Bild empfangen' });
  }

  const L = language === 'ru' ? 'на русском' : 'auf Deutsch';
  const prompt = `Prüfe dieses Dokument (Brief, E-Mail, SMS oder Messenger-Nachricht, angeblich von einer Behörde, Firma, Bank oder einem Inkassobüro) auf Anzeichen von Betrug.
Antworte NUR mit JSON ohne Markdown:
{
  "art": "brief" | "email" | "sms" | "messenger" | "sonstiges",
  "absender": "angeblicher Absender",
  "echtheit": "unauffaellig" | "pruefen" | "verdaechtig",
  "betrugsHinweise": ["konkretes Warnzeichen, das im Dokument wirklich vorkommt, ${L}"],
  "entwarnung": ["Merkmal, das für Echtheit spricht, ${L}"],
  "schritte": ["konkreter sicherer nächster Schritt, ${L}"]
}
Typische Warnzeichen: Zahlung per Gutscheinkarte, Krypto, Western Union oder auf ein privates/ausländisches Konto; Drohung mit Haft, Polizei, Abschiebung oder Kontosperrung binnen Stunden/Tagen; Link zur Eingabe von Bank- oder Ausweisdaten; Absender-Adresse von Gmail/Outlook/fremder Domain statt Behördendomain; Kontakt nur per WhatsApp/Telegram; fehlendes Aktenzeichen; Rechtschreibfehler und falsche Behördennamen; Forderung ohne erkennbare Grundlage (keine Rechnung, kein Vertrag).
Regeln:
- "verdaechtig" bei mehreren klaren Warnzeichen, "pruefen" bei einzelnen, sonst "unauffaellig".
- Erfinde keine Warnzeichen. Bewerte NICHT, ob eine echte Forderung rechtlich berechtigt ist – nur, ob das Dokument gefälscht sein könnte.
- schritte: z. B. Behörde über die Nummer auf der offiziellen Website anrufen, nicht auf Links klicken, nichts zahlen bevor geprüft, Verbraucherzentrale fragen, bei Betrug Anzeige bei der Polizei (online-Wache des Bundeslandes).`;

  try {
    const response = await client.messages.create(
      {
        model: MODEL,
        max_tokens: 900,
        messages: [
          {
            role: 'user',
            content: [
              ...images.map((data) => ({ type: 'image' as const, source: { type: 'base64' as const, media_type: 'image/jpeg' as const, data } })),
              { type: 'text' as const, text: prompt },
            ],
          },
        ],
      },
      { timeout: 45000 }
    );
    const text = response.content.map((b) => (b.type === 'text' ? b.text : '')).join('').trim();
    const p = extractJson(text);
    if (!p) {
      return res.status(502).json({ success: false, error: language === 'ru' ? 'Не удалось проверить. Попробуйте более чёткое фото.' : 'Prüfung fehlgeschlagen. Bitte ein schärferes Bild versuchen.' });
    }
    const hinweise = arr(p.betrugsHinweise);
    const echtheit = ['unauffaellig', 'pruefen', 'verdaechtig'].includes(p.echtheit)
      ? p.echtheit
      : hinweise.length >= 2
      ? 'verdaechtig'
      : hinweise.length
      ? 'pruefen'
      : 'unauffaellig';
    return res.status(200).json({
      success: true,
      check: {
        art: String(p.art || 'sonstiges').slice(0, 20),
        absender: String(p.absender || '').slice(0, 200),
        echtheit,
        betrugsHinweise: hinweise,
        entwarnung: arr(p.entwarnung, 5),
        schritte: arr(p.schritte, 6),
      },
    });
  } catch (error: any) {
    console.error('Betrugsprüfung fehlgeschlagen:', error?.status, error?.message);
    return res.status(500).json({ success: false, error: language === 'ru' ? 'Техническая ошибка. Попробуйте ещё раз.' : 'Technischer Fehler. Bitte erneut versuchen.' });
  }
}
