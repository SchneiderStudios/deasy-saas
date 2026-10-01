import type { NextApiRequest, NextApiResponse } from 'next';
import Anthropic from '@anthropic-ai/sdk';

export const config = { api: { bodyParser: { sizeLimit: '4.5mb' } } };

const REPLY_MODEL = 'claude-opus-5-5';
const MAX_PAGES = 3;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/** Типы ответа: id → что именно должен сделать ответ (инструкция для модели на немецком). */
const REPLY_TYPES: Record<string, string> = {
  widerspruch: 'Widerspruch bzw. Einspruch gegen den Bescheid (je nach Behörde den richtigen Begriff verwenden), fristgerecht, mit Platz für die Begründung.',
  fristverlaengerung: 'Bitte um Verlängerung der gesetzten Frist mit kurzer Begründung.',
  ratenzahlung: 'Antrag auf Ratenzahlung oder Stundung der geforderten Summe.',
  unterlagen: 'Begleitschreiben zum Nachreichen der angeforderten Unterlagen, mit Liste der Anlagen.',
  rueckfrage: 'Höfliche Rückfrage zu unklaren Punkten des Schreibens.',
  bestaetigung: 'Kurze Bestätigung bzw. Zustimmung zum Schreiben.',
  frei: 'Antwort nach den Wünschen des Nutzers.',
};

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
  const replyType: string = REPLY_TYPES[req.body?.replyType] ? req.body.replyType : 'frei';
  const notes = String(req.body?.notes || '').slice(0, 2000);
  const analysis = req.body?.analysis || {};
  const images: string[] = (Array.isArray(req.body?.images) ? req.body.images : [])
    .filter((s: unknown) => typeof s === 'string' && s)
    .slice(0, MAX_PAGES)
    .map(stripDataPrefix);

  if (images.length === 0 && !analysis.summary) {
    return res.status(400).json({ success: false, error: language === 'ru' ? 'Нет данных о письме' : 'Keine Daten zum Brief' });
  }

  const prompt = `Du schreibst für einen Privatmenschen ein Antwortschreiben auf den beigefügten deutschen Behördenbrief.

Art der Antwort: ${REPLY_TYPES[replyType]}
${notes ? `Angaben des Nutzers (in jeder Sprache möglich, übernimm die Fakten): ${notes}` : 'Der Nutzer hat keine zusätzlichen Angaben gemacht.'}
Bisherige Analyse: ${analysis.summary || '-'} | Fristen: ${(analysis.deadlines || []).join('; ') || '-'}

Anforderungen an den Brief:
- Auf Deutsch, sachlich und höflich, formeller deutscher Briefaufbau (Absender, Empfänger, Ort/Datum, Betreff mit Aktenzeichen, Anrede, Text, Grußformel).
- Übernimm Behörde, Adresse, Aktenzeichen/Steuernummer/BG-Nummer und Datum des Schreibens aus dem Brief, wenn lesbar.
- Alles, was du nicht weißt, als Platzhalter in eckigen Klammern, z. B. [Ihr Name], [Begründung]. Erfinde keine Fakten.
- Keine Rechtsberatung vortäuschen, keine erfundenen Paragraphen.

Antworte NUR mit JSON ohne Markdown:
{
  "subject": "Betreffzeile",
  "body": "vollständiger Brief inkl. Absender- und Empfängerblock, Zeilenumbrüche mit \\n",
  "translation": ${language === 'ru' ? '"vollständige Übersetzung des Briefes ins Russische, damit der Nutzer versteht, was er unterschreibt"' : '""'},
  "tips": ["2-4 kurze praktische Hinweise ${language === 'ru' ? 'auf Russisch' : 'auf Deutsch'} (z. B. Versand per Einschreiben, Frist, Anlagen)"],
  "placeholders": ["Liste der Platzhalter, die der Nutzer noch ausfüllen muss"]
}`;

  try {
    const response = await client.messages.create(
      {
        model: REPLY_MODEL,
        max_tokens: 3000,
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
    if (!parsed?.body) {
      return res.status(502).json({ success: false, error: language === 'ru' ? 'Не удалось составить письмо. Попробуйте ещё раз.' : 'Brief konnte nicht erstellt werden. Bitte erneut versuchen.' });
    }

    const arr = (v: unknown) => (Array.isArray(v) ? v.map(String).filter(Boolean) : []);
    return res.status(200).json({
      success: true,
      reply: {
        subject: String(parsed.subject || ''),
        body: String(parsed.body),
        translation: language === 'ru' ? String(parsed.translation || '') : '',
        tips: arr(parsed.tips),
        placeholders: arr(parsed.placeholders),
      },
    });
  } catch (error: any) {
    console.error('Reply-Fehler:', error?.status, error?.message);
    return res.status(500).json({ success: false, error: language === 'ru' ? 'Ошибка при создании письма. Попробуйте ещё раз.' : 'Fehler beim Erstellen des Briefs. Bitte erneut versuchen.' });
  }
}
