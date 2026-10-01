import type { NextApiRequest, NextApiResponse } from 'next';
import Anthropic from '@anthropic-ai/sdk';

const CHAT_MODEL = 'claude-sonnet-5-5';
const MAX_HISTORY = 20;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

type Role = 'user' | 'assistant';
interface InMessage {
  role: Role;
  content: string;
}

/** Anthropic требует: первое сообщение от user, роли чередуются. */
function sanitizeHistory(raw: unknown): InMessage[] {
  if (!Array.isArray(raw)) return [];
  const msgs = raw
    .filter((m: any) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .map((m: any) => ({ role: m.role as Role, content: m.content.trim() }))
    .slice(-MAX_HISTORY);

  while (msgs.length && msgs[0].role !== 'user') msgs.shift();

  const merged: InMessage[] = [];
  for (const m of msgs) {
    const last = merged[merged.length - 1];
    if (last && last.role === m.role) last.content += `\n\n${m.content}`;
    else merged.push({ ...m });
  }
  return merged;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ success: false, error: 'Server-Konfiguration fehlt (API-Schlüssel)' });
  }

  const language: 'de' | 'ru' = req.body?.language === 'ru' ? 'ru' : 'de';
  const summary: string = String(req.body?.analysisSummary || req.body?.context || '').slice(0, 4000);

  // Новый формат: messages[]; старый: message (строка)
  let messages = sanitizeHistory(req.body?.messages);
  if (messages.length === 0 && typeof req.body?.message === 'string' && req.body.message.trim()) {
    messages = [{ role: 'user', content: req.body.message.trim() }];
  }
  if (messages.length === 0 || messages[messages.length - 1].role !== 'user') {
    return res.status(400).json({ success: false, error: language === 'ru' ? 'Нет вопроса' : 'Keine Frage' });
  }

  const system =
    language === 'ru'
      ? `Ты помощник DEASY. Ты объясняешь немецкие официальные письма людям, которые плохо знают немецкий.
Пользователь загрузил письмо. Краткое содержание анализа:
${summary || '(нет данных)'}

Отвечай на русском, коротко и понятно, с практическими шагами. Немецкие термины давай в оригинале с переводом.
Ты не адвокат: в сложных случаях (суд, крупные суммы, депортация) советуй обратиться в консультацию (Beratungsstelle, Mieterverein, адвокат).`
      : `Du bist der DEASY-Assistent. Du erklärst deutsche Behördenbriefe verständlich.
Der Nutzer hat einen Brief hochgeladen. Zusammenfassung der Analyse:
${summary || '(keine Daten)'}

Antworte auf Deutsch, kurz, in einfacher Sprache und mit praktischen Schritten.
Du bist kein Anwalt: bei ernsten Fällen (Gericht, hohe Beträge, Aufenthalt) empfiehl eine Beratungsstelle, den Mieterverein oder einen Anwalt.`;

  try {
    const response = await client.messages.create(
      { model: CHAT_MODEL, max_tokens: 800, system, messages },
      { timeout: 45000 }
    );

    const text = response.content
      .map((b) => (b.type === 'text' ? b.text : ''))
      .join('')
      .trim();

    return res.status(200).json({ success: true, message: text });
  } catch (error: any) {
    console.error('Chat-Fehler:', error?.status, error?.message);
    return res.status(500).json({
      success: false,
      error: language === 'ru' ? 'Ошибка чата. Попробуйте ещё раз.' : 'Chat-Fehler. Bitte erneut versuchen.',
    });
  }
}
