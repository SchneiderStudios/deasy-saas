import type { NextApiRequest, NextApiResponse } from 'next';
import Anthropic from '@anthropic-ai/sdk';
import { buildReply, REPLY_TYPE_IDS, type ReplyType, type Fakten } from '@/lib/replyBuilder';

export const config = { api: { bodyParser: { sizeLimit: '4.5mb' } } };

const REPLY_MODEL = 'claude-opus-5-5';
const MAX_PAGES = 3;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * RDG: текст письма берётся из готовых шаблонов (lib/replyBuilder.ts).
 * ИИ только извлекает факты из письма и дословно переводит слова пользователя — без своей аргументации.
 */
const stripDataPrefix = (s: string) => s.replace(/^data:[^;]+;base64,/, '');

function extractJson(text: string): any | null {
  const match = text.replace(/```(?:json)?/gi, '').match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
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
  if (req.body?.analysis?.restricted === 'steuer') {
    return res.status(403).json({
      success: false,
      error:
        language === 'ru'
          ? 'По налоговым вопросам DEASY не консультирует. Обратитесь в Lohnsteuerhilfeverein или к Steuerberater.'
          : 'Zu Steuersachen berät DEASY nicht. Bitte wenden Sie sich an einen Lohnsteuerhilfeverein oder eine Steuerberatung.',
    });
  }
  const replyType = req.body?.replyType as ReplyType;
  if (!REPLY_TYPE_IDS.includes(replyType)) {
    return res.status(400).json({ success: false, error: language === 'ru' ? 'Неизвестный тип письма' : 'Unbekannte Art des Schreibens' });
  }
  const notes = String(req.body?.notes || '').slice(0, 1500);
  const analysis = req.body?.analysis || {};
  const images: string[] = (Array.isArray(req.body?.images) ? req.body.images : [])
    .filter((s: unknown) => typeof s === 'string' && s)
    .slice(0, MAX_PAGES)
    .map(stripDataPrefix);

  if (images.length === 0 && !analysis.summary) {
    return res.status(400).json({ success: false, error: language === 'ru' ? 'Нет данных о письме' : 'Keine Daten zum Brief' });
  }

  const prompt = `Lies den beigefügten deutschen Behördenbrief und gib NUR Fakten zurück. Du schreibst KEINEN Brief und keine Argumente.

${notes ? `Angaben des Nutzers (beliebige Sprache): «${notes}»` : 'Der Nutzer hat keine Angaben gemacht.'}

Antworte NUR mit JSON ohne Markdown:
{
  "behoerde": "Name der absendenden Stelle wie im Briefkopf, sonst leer",
  "adresse": "Postanschrift der absendenden Stelle (Straße, PLZ Ort), Zeilen mit \\n getrennt, sonst leer",
  "aktenzeichen": "Aktenzeichen/Kundennummer/BG-Nummer wie im Brief, sonst leer",
  "briefdatum": "Datum des Briefes TT.MM.JJJJ, sonst leer",
  "frist": "im Brief genannte Frist TT.MM.JJJJ, nur wenn als Datum angegeben, sonst leer",
  "betrag": "im Brief geforderter Gesamtbetrag, z. B. 123,45 €, sonst leer",
  "unterlagen": ["im Brief angeforderte Unterlagen, wörtlich und kurz"],
  "angaben_de": "die Angaben des Nutzers wörtlich und neutral ins Deutsche übersetzt, in Ich-Form; NICHTS hinzufügen, nichts verstärken, keine Rechtsbegriffe oder Paragraphen ergänzen; leer, wenn keine Angaben",
  "angaben_ru": "dieselben Angaben auf Russisch, ebenso wörtlich; leer, wenn keine Angaben",
  "rechtsbehelf": false
}
"rechtsbehelf" = true, wenn der Nutzer einen Widerspruch, Einspruch, eine Klage, Beschwerde, Anfechtung oder rechtliche Argumente gegen den Bescheid möchte.
Kontext der bisherigen Analyse: ${String(analysis.summary || '-').slice(0, 1500)}`;

  try {
    const response = await client.messages.create(
      {
        model: REPLY_MODEL,
        max_tokens: 1200,
        messages: [
          {
            role: 'user',
            content: [
              ...images.map((data) => ({
                type: 'image' as const,
                source: { type: 'base64' as const, media_type: 'image/jpeg' as const, data },
              })),
              { type: 'text' as const, text: prompt },
            ],
          },
        ],
      },
      { timeout: 58000 }
    );

    const text = response.content.map((b) => (b.type === 'text' ? b.text : '')).join('').trim();
    const parsed = extractJson(text);
    if (!parsed) {
      return res.status(502).json({ success: false, error: language === 'ru' ? 'Не удалось составить письмо. Попробуйте ещё раз.' : 'Brief konnte nicht erstellt werden. Bitte erneut versuchen.' });
    }

    if (parsed.rechtsbehelf === true) {
      return res.status(422).json({
        success: false,
        error:
          language === 'ru'
            ? 'Возражения (Widerspruch), жалобы и иски DEASY не составляет — это юридическая услуга. Срок и способ указаны в разделе «Rechtsbehelfsbelehrung» письма. Помогут: Migrationsberatung (bamf-navi.bamf.de), Verbraucherzentrale или адвокат с Beratungshilfeschein.'
            : 'Widersprüche, Einsprüche und Klagen erstellt DEASY nicht – das ist Rechtsberatung. Frist und Form stehen in der „Rechtsbehelfsbelehrung“ des Briefes. Hilfe: Migrationsberatung (bamf-navi.bamf.de), Verbraucherzentrale oder Anwalt mit Beratungshilfeschein.',
      });
    }

    const str = (x: unknown, max = 300) => (typeof x === 'string' ? x.trim().slice(0, max) : '');
    const fakten: Fakten = {
      behoerde: str(parsed.behoerde, 150),
      adresse: str(parsed.adresse, 200),
      aktenzeichen: str(parsed.aktenzeichen, 80),
      briefdatum: str(parsed.briefdatum, 12),
      frist: str(parsed.frist, 12),
      betrag: str(parsed.betrag, 30),
      unterlagen: Array.isArray(parsed.unterlagen) ? parsed.unterlagen.map((u: unknown) => str(u, 150)).filter(Boolean).slice(0, 10) : [],
      angaben_de: notes ? str(parsed.angaben_de, 1500) : '',
      angaben_ru: notes ? str(parsed.angaben_ru, 1500) || notes : '',
    };

    return res.status(200).json({ success: true, reply: buildReply(replyType, fakten, language) });
  } catch (error: any) {
    console.error('Reply-Fehler:', error?.status, error?.message);
    return res.status(500).json({ success: false, error: language === 'ru' ? 'Ошибка при создании письма. Попробуйте ещё раз.' : 'Fehler beim Erstellen des Briefs. Bitte erneut versuchen.' });
  }
}
