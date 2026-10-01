import type { NextApiRequest, NextApiResponse } from 'next';
import Anthropic from '@anthropic-ai/sdk';

export const config = {
  api: {
    bodyParser: {
      // Vercel всё равно режет тело запроса на 4,5 МБ; клиент сжимает картинки заранее
      sizeLimit: '4.5mb',
    },
  },
};

const ANALYSIS_MODEL = 'claude-opus-5-5';
const MAX_PAGES = 3;
const RISK_VALUES = ['Gering', 'Mittel', 'Kritisch'] as const;

type Risk = (typeof RISK_VALUES)[number];

export interface Analysis {
  summary: string;
  risk: Risk;
  deadlines: string[];
  actions: string[];
  language: 'de' | 'ru';
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const stripDataPrefix = (s: string) => s.replace(/^data:[^;]+;base64,/, '');

const toStringArray = (v: unknown): string[] =>
  Array.isArray(v) ? v.map((x) => String(x).trim()).filter(Boolean) : [];

function normalizeRisk(v: unknown): Risk {
  const s = String(v || '').toLowerCase();
  if (s.includes('krit') || s.includes('крит') || s.includes('hoch')) return 'Kritisch';
  if (s.includes('gering') || s.includes('niedrig') || s.includes('низ')) return 'Gering';
  return 'Mittel';
}

function buildPrompt(language: 'de' | 'ru', pageCount: number): string {
  const pagesNote =
    pageCount > 1
      ? language === 'ru'
        ? `Письмо состоит из ${pageCount} страниц (изображения по порядку). `
        : `Der Brief besteht aus ${pageCount} Seiten (Bilder in Reihenfolge). `
      : '';

  if (language === 'ru') {
    return `${pagesNote}Ты помощник, который объясняет немецкие официальные письма людям, плохо знающим немецкий язык.
Проанализируй письмо и ответь ТОЛЬКО JSON-объектом без markdown:
{
  "summary": "2-4 простых предложения на русском: кто пишет, что хочет, что будет, если ничего не делать",
  "risk": "Gering" | "Mittel" | "Kritisch",
  "deadlines": ["конкретная дата и что к ней сделать"],
  "actions": ["конкретное действие на русском"]
}
Правила: risk = "Kritisch", если есть срок, штраф, отказ, взыскание или судебные последствия; "Mittel" — нужно действие без жёсткой угрозы; "Gering" — информационное письмо.
Если сроков нет — пустой массив. Не придумывай даты, которых нет в письме.`;
  }

  return `${pagesNote}Du hilfst Menschen, deutsche Behördenbriefe zu verstehen.
Analysiere den Brief und antworte NUR mit einem JSON-Objekt ohne Markdown:
{
  "summary": "2-4 einfache Sätze: wer schreibt, was wird verlangt, was passiert, wenn man nichts tut",
  "risk": "Gering" | "Mittel" | "Kritisch",
  "deadlines": ["konkretes Datum und was bis dahin zu tun ist"],
  "actions": ["konkrete Handlung in einfacher Sprache"]
}
Regeln: risk = "Kritisch" bei Frist mit Sanktion, Ablehnung, Mahnung, Vollstreckung oder Gericht; "Mittel" wenn eine Handlung nötig ist; "Gering" bei reiner Information.
Keine Fristen → leeres Array. Erfinde keine Daten, die nicht im Brief stehen.`;
}

function extractJson(text: string): any | null {
  const cleaned = text.replace(/```(?:json)?/gi, '');
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY ist nicht gesetzt');
    return res.status(500).json({ error: 'Server-Konfiguration fehlt (API-Schlüssel)' });
  }

  const language: 'de' | 'ru' = req.body?.language === 'ru' ? 'ru' : 'de';

  // Принимаем { images: [...] } (новый формат) и { image } / { imageBase64 } (старый)
  const rawImages: string[] = Array.isArray(req.body?.images)
    ? req.body.images
    : [req.body?.image || req.body?.imageBase64].filter(Boolean);

  const images = rawImages
    .filter((s) => typeof s === 'string' && s.length > 0)
    .slice(0, MAX_PAGES)
    .map(stripDataPrefix);

  if (images.length === 0) {
    return res.status(400).json({
      error: language === 'ru' ? 'Изображение не получено' : 'Kein Bild empfangen',
    });
  }

  try {
    const response = await client.messages.create(
      {
        model: ANALYSIS_MODEL,
        max_tokens: 1500,
        messages: [
          {
            role: 'user',
            content: [
              ...images.map((data) => ({
                type: 'image' as const,
                source: { type: 'base64' as const, media_type: 'image/jpeg' as const, data },
              })),
              { type: 'text' as const, text: buildPrompt(language, images.length) },
            ],
          },
        ],
      },
      { timeout: 55000 }
    );

    const text = response.content
      .map((b) => (b.type === 'text' ? b.text : ''))
      .join('')
      .trim();

    const parsed = extractJson(text);

    const analysis: Analysis = parsed
      ? {
          summary: String(parsed.summary || '').trim(),
          risk: normalizeRisk(parsed.risk),
          deadlines: toStringArray(parsed.deadlines),
          actions: toStringArray(parsed.actions ?? parsed.nextSteps),
          language,
        }
      : { summary: text, risk: 'Mittel', deadlines: [], actions: [], language };

    if (!analysis.summary) {
      return res.status(502).json({
        error: language === 'ru' ? 'Не удалось прочитать письмо. Попробуйте более чёткое фото.' : 'Brief konnte nicht gelesen werden. Bitte ein schärferes Foto versuchen.',
      });
    }

    return res.status(200).json({ success: true, analysis });
  } catch (error: any) {
    console.error('Analyse-Fehler:', error?.status, error?.message);
    const status = error?.status;
    if (status === 401) return res.status(500).json({ error: 'API-Schlüssel ungültig' });
    if (status === 429 || status === 529) {
      return res.status(503).json({
        error: language === 'ru' ? 'Сервис перегружен, попробуйте через минуту.' : 'Dienst überlastet, bitte in einer Minute erneut versuchen.',
      });
    }
    if (String(error?.message || '').toLowerCase().includes('timeout')) {
      return res.status(504).json({ error: language === 'ru' ? 'Превышено время анализа' : 'Zeitüberschreitung bei der Analyse' });
    }
    return res.status(500).json({
      error: language === 'ru' ? 'Техническая ошибка анализа. Попробуйте ещё раз.' : 'Technischer Fehler bei der Analyse. Bitte erneut versuchen.',
    });
  }
}
