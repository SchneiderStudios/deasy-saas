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
  /** Absender (Behörde/Firma), wie im Brief angegeben */
  absender?: string;
  /** 'steuer' = Steuersache → keine inhaltliche Analyse (Hilfeleistung in Steuersachen nur durch Befugte, § 2 StBerG) */
  restricted?: 'steuer';
  aktenzeichen?: string;
  briefdatum?: string;
  telefon?: string;
  /** Fristen mit ISO-Datum für den Kalender-Export */
  fristen?: { datum: string; was: string }[];
  unterlagen?: string[];
  echtheit?: 'unauffaellig' | 'pruefen';
  betrugsHinweise?: string[];
}

const clip = (v: unknown, n = 200) => String(v ?? '').trim().slice(0, n);

function toFristen(v: unknown): { datum: string; was: string }[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((f: any) => ({ datum: clip(f?.datum, 10), was: clip(f?.was, 200) }))
    .filter((f) => /^\d{4}-\d{2}-\d{2}$/.test(f.datum) && !Number.isNaN(Date.parse(f.datum)))
    .slice(0, 10);
}

/** Поля, которые возвращаем всегда (и для налоговых писем): проверка на мошенничество и реквизиты для звонка */
function extras(parsed: any) {
  const hinweise = toStringArray(parsed?.betrugsHinweise).slice(0, 8);
  return {
    aktenzeichen: clip(parsed?.aktenzeichen, 80),
    briefdatum: clip(parsed?.briefdatum, 20),
    telefon: clip(parsed?.telefon, 40),
    echtheit: (hinweise.length || String(parsed?.echtheit).toLowerCase().startsWith('pr') ? 'pruefen' : 'unauffaellig') as
      | 'pruefen'
      | 'unauffaellig',
    betrugsHinweise: hinweise,
  };
}

/**
 * Steuersachen analysieren wir nicht: Hilfe in Steuersachen dürfen nur Steuerberater, Lohnsteuerhilfevereine
 * u. a. leisten (§§ 2–4 StBerG). Dazu zählen auch Kindergeld nach EStG (Familienkasse), Kfz-Steuer und Zölle
 * (Hauptzollamt) sowie Gemeindesteuern (Grundsteuer, Hundesteuer, Zweitwohnungsteuer).
 * Zusätzlich zur Einstufung durch die KI prüfen wir den Absender per Muster.
 */
const TAX_SENDER = /finanzamt|finanzverwaltung|bundeszentralamt\s+f(ü|ue)r\s+steuern|\bbzst\b|hauptzollamt|familienkasse|steueramt|steuerverwaltung|kasse\s*\/\s*steuern|elster/i;

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
  const ru = language === 'ru';
  const pagesNote =
    pageCount > 1
      ? ru
        ? `Письмо состоит из ${pageCount} страниц (изображения по порядку). `
        : `Der Brief besteht aus ${pageCount} Seiten (Bilder in Reihenfolge). `
      : '';
  const L = ru ? 'на русском' : 'auf Deutsch';

  // Схема одна; тексты для пользователя — на выбранном языке
  return `${pagesNote}${
    ru
      ? 'Ты помогаешь людям, плохо знающим немецкий, понять официальное письмо: что в нём написано, какие сроки и куда обратиться.'
      : 'Du hilfst Menschen, einen offiziellen Brief zu verstehen: was drinsteht, welche Fristen gelten und an wen man sich wenden kann.'
  }
Antworte NUR mit einem JSON-Objekt ohne Markdown:
{
  "absender": "Absender (Behörde/Organisation) wie im Brief",
  "kategorie": "steuer" | "sonstige",
  "aktenzeichen": "Aktenzeichen/Kundennummer/BG-Nummer aus dem Brief oder leer",
  "briefdatum": "Datum des Briefes als TT.MM.JJJJ oder leer",
  "telefon": "Telefonnummer des Absenders laut Brief oder leer",
  "summary": "2–4 einfache Sätze ${L}: wer schreibt, was steht im Brief, was passiert laut Brief, wenn man nichts tut",
  "risk": "Gering" | "Mittel" | "Kritisch",
  "fristen": [{"datum": "JJJJ-MM-TT", "was": "was bis dahin laut Brief zu tun ist, ${L}"}],
  "unterlagen": ["Unterlagen, die der Brief ausdrücklich anfordert, ${L}"],
  "actions": ["nächster praktischer Schritt ${L}"],
  "echtheit": "unauffaellig" | "pruefen",
  "betrugsHinweise": ["konkretes Warnzeichen aus dem Brief ${L}"]
}
Regeln:
- risk gibt NUR wieder, was im Brief steht (keine eigene Einschätzung): "Kritisch", wenn der Brief selbst eine Frist UND eine Folge nennt (Mahnung, Säumniszuschlag, Kürzung/Einstellung von Leistungen, Vollstreckung, Bußgeld, Gericht); "Mittel", wenn der Brief eine Handlung verlangt; "Gering", wenn er nur informiert.
- Nur Daten, die im Brief stehen. Keine erfundenen Fristen. Relative Fristen („innerhalb eines Monats nach Zugang“) nur als Text in actions, nicht in fristen.
- actions beschränken sich auf: Frist einhalten, angeforderte Unterlagen schicken, beim Absender nachfragen, eine passende Beratungsstelle aufsuchen. KEINE rechtliche Bewertung, keine Empfehlung für oder gegen Widerspruch/Klage, keine Erfolgsprognose.
- echtheit = "pruefen", wenn Warnzeichen für Betrug vorliegen, z. B.: Zahlung auf ein privates/ausländisches Konto, Gutscheinkarten oder Krypto, ungewöhnlicher Zeitdruck oder Drohungen, fehlendes Aktenzeichen bei einer Behörde, Kontakt nur per WhatsApp/Messenger, Absender-E-Mail mit Gmail/Outlook statt Behördendomain, Rechtschreibfehler im Briefkopf, Links zu fremden Websites. Liste nur Warnzeichen auf, die wirklich vorkommen; sonst leeres Array und "unauffaellig".
- kategorie = "steuer", wenn das Schreiben eine Steuersache betrifft: Finanzamt, Bundeszentralamt für Steuern, Steuerbescheid, Steuererklärung, Steuer-ID, Kindergeld der Familienkasse, Kfz-Steuer oder Zoll (Hauptzollamt), Grund-, Hunde- oder Zweitwohnungsteuer. Dann lass summary, fristen, unterlagen und actions LEER – echtheit und betrugsHinweise trotzdem ausfüllen.`;
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

    const absender = parsed ? String(parsed.absender || '').trim().slice(0, 200) : '';
    const isTax =
      (parsed && String(parsed.kategorie || '').toLowerCase() === 'steuer') ||
      TAX_SENDER.test(absender) ||
      (!parsed && TAX_SENDER.test(text));
    if (isTax) {
      // Keine inhaltliche Auswertung von Steuersachen — nur Hinweis auf befugte Stellen (UI)
      return res.status(200).json({
        success: true,
        analysis: {
          summary: '',
          risk: 'Mittel',
          deadlines: [],
          actions: [],
          language,
          absender,
          restricted: 'steuer',
          ...extras(parsed),
          telefon: '', // для налоговых — номер берём только с официального сайта
        },
      });
    }
    analysis.absender = absender;
    if (parsed) {
      const fristen = toFristen(parsed.fristen);
      Object.assign(analysis, extras(parsed), { fristen, unterlagen: toStringArray(parsed.unterlagen).slice(0, 10) });
      // Совместимость: deadlines (строки) строим из fristen, если модель не вернула их
      if (!analysis.deadlines.length && fristen.length) {
        analysis.deadlines = fristen.map((f) => `${f.datum.split('-').reverse().join('.')} – ${f.was}`);
      }
    }

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
