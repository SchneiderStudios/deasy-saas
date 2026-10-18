import type { NextApiRequest, NextApiResponse } from 'next';
import Anthropic from '@anthropic-ai/sdk';
import { TAX_SENDER } from '@/lib/steuer';

/**
 * Перевод письма по абзацам: оригинал (DE) рядом с переводом (RU).
 * POST /api/translate-document { images: string[], language: 'ru' }
 * → { success: true, absaetze: { de: string, ru: string }[] }
 *   403 { error } — налоговое письмо (§ 2 StBerG, как в /api/analyze-document)
 * Только перевод, без пояснений и оценок (RDG). Лимит разборов не списывается: перевод — часть уже купленного разбора.
 */

export const config = { api: { bodyParser: { sizeLimit: '4.5mb' } } };

const MODEL = 'claude-sonnet-5-5';
const MAX_PAGES = 3;
const MAX_ABSAETZE = 60;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const PROMPT = `Übertrage den Brief auf den Bildern Absatz für Absatz ins Russische.
Antworte NUR mit JSON ohne Markdown:
{"kategorie": "steuer" | "sonstige", "absaetze": [{"de": "Originalabsatz wörtlich", "ru": "russische Übersetzung"}]}
Regeln:
- Reihenfolge wie im Brief: Briefkopf, Betreff, Text, Hinweise, Rechtsbehelfsbelehrung.
- Absätze, Listen und Zeilen des Briefkopfs nicht zusammenfassen und nichts weglassen; Kontonummern (IBAN), Steuer-ID und ähnliche Nummern im Original durch „[…]“ ersetzen.
- Nur übersetzen: keine Erklärungen, Kommentare, Bewertungen oder Ratschläge.
- Fachbegriffe beim ersten Vorkommen auf Deutsch in Klammern lassen, z. B. „возражение (Widerspruch)“.
- kategorie = "steuer", wenn es um eine Steuersache geht (Finanzamt, Bundeszentralamt für Steuern, Kindergeld der Familienkasse, Hauptzollamt, Grund-/Hunde-/Zweitwohnungsteuer). Dann "absaetze": [].`;

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
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: 'Server-Konfiguration fehlt (API-Schlüssel)' });

  const images: string[] = (Array.isArray(req.body?.images) ? req.body.images : [])
    .filter((s: unknown) => typeof s === 'string' && s.length > 0)
    .slice(0, MAX_PAGES)
    .map((s: string) => s.replace(/^data:[^;]+;base64,/, ''));
  if (!images.length) return res.status(400).json({ error: 'Изображение не получено' });

  try {
    const response = await client.messages.create(
      {
        model: MODEL,
        max_tokens: 6000,
        messages: [
          {
            role: 'user',
            content: [
              ...images.map((data) => ({
                type: 'image' as const,
                source: { type: 'base64' as const, media_type: 'image/jpeg' as const, data },
              })),
              { type: 'text' as const, text: PROMPT },
            ],
          },
        ],
      },
      { timeout: 55000 }
    );

    const text = response.content.map((b) => (b.type === 'text' ? b.text : '')).join('').trim();
    const parsed = extractJson(text);
    const absaetze = (Array.isArray(parsed?.absaetze) ? parsed.absaetze : [])
      .map((a: any) => ({ de: String(a?.de || '').trim().slice(0, 3000), ru: String(a?.ru || '').trim().slice(0, 3000) }))
      .filter((a: { de: string; ru: string }) => a.de || a.ru)
      .slice(0, MAX_ABSAETZE);

    const kopf = absaetze.slice(0, 4).map((a: { de: string }) => a.de).join(' ');
    if (String(parsed?.kategorie || '').toLowerCase() === 'steuer' || TAX_SENDER.test(kopf)) {
      return res.status(403).json({ error: 'Налоговые письма мы не переводим и не разбираем — с ними помогают Steuerberater и Lohnsteuerhilfeverein.' });
    }
    if (!absaetze.length) {
      return res.status(502).json({ error: 'Не удалось прочитать письмо. Попробуйте более чёткое фото.' });
    }
    return res.status(200).json({ success: true, absaetze });
  } catch (error: any) {
    console.error('Übersetzung fehlgeschlagen:', error?.status, error?.message);
    if (error?.status === 429 || error?.status === 529) return res.status(503).json({ error: 'Сервис перегружен, попробуйте через минуту.' });
    if (String(error?.message || '').toLowerCase().includes('timeout')) return res.status(504).json({ error: 'Перевод занял слишком много времени. Попробуйте ещё раз.' });
    return res.status(500).json({ error: 'Техническая ошибка перевода. Попробуйте ещё раз.' });
  }
}
