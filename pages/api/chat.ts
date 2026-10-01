import type { NextApiRequest, NextApiResponse } from 'next';
import Anthropic from '@anthropic-ai/sdk';

export const config = { api: { bodyParser: { sizeLimit: '4.5mb' } } };

const CHAT_MODEL = 'claude-sonnet-5-5';
const MAX_PAGES = 3;
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
  const a = req.body?.analysis || {};
  const summary: string = [
    String(a.summary || req.body?.analysisSummary || req.body?.context || ''),
    Array.isArray(a.deadlines) && a.deadlines.length ? `Fristen/Сроки: ${a.deadlines.join('; ')}` : '',
    Array.isArray(a.actions) && a.actions.length ? `Empfehlungen/Рекомендации: ${a.actions.join('; ')}` : '',
    a.risk ? `Risiko/Риск: ${a.risk}` : '',
  ].filter(Boolean).join('\n').slice(0, 4000);
  const images: string[] = (Array.isArray(req.body?.images) ? req.body.images : [])
    .filter((s: unknown) => typeof s === 'string' && s)
    .slice(0, MAX_PAGES)
    .map((s: string) => s.replace(/^data:[^;]+;base64,/, ''));

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

Само письмо приложено к первому сообщению пользователя — опирайся на него, не выдумывай данных.
Отвечай на русском, коротко и понятно, с практическими шагами. Немецкие термины давай в оригинале с переводом.
Если просят варианты ответа — перечисли 2–4 реальных варианта (например: Widerspruch, просьба продлить срок, рассрочка, досылка документов) с плюсами и рисками каждого.
Если просят написать письмо — само письмо пиши на немецком (его отправляют в ведомство), а под ним дай краткий перевод на русский.
Ты не адвокат: в сложных случаях (суд, крупные суммы, депортация) советуй обратиться в консультацию (Beratungsstelle, Mieterverein, адвокат).`
      : `Du bist der DEASY-Assistent. Du erklärst deutsche Behördenbriefe verständlich.
Der Nutzer hat einen Brief hochgeladen. Zusammenfassung der Analyse:
${summary || '(keine Daten)'}

Der Brief selbst ist der ersten Nutzernachricht beigefügt – stütze dich darauf und erfinde keine Daten.
Antworte auf Deutsch, kurz, in einfacher Sprache und mit praktischen Schritten.
Wenn nach Antwortmöglichkeiten gefragt wird, nenne 2–4 realistische Optionen (z. B. Widerspruch, Fristverlängerung, Ratenzahlung, Unterlagen nachreichen) mit Vor- und Nachteilen.
Du bist kein Anwalt: bei ernsten Fällen (Gericht, hohe Beträge, Aufenthalt) empfiehl eine Beratungsstelle, den Mieterverein oder einen Anwalt.`;

  // Изображения письма прикрепляем к первому сообщению пользователя
  const apiMessages: any[] = messages.map((m, i) =>
    i === 0 && images.length
      ? {
          role: 'user',
          content: [
            ...images.map((data) => ({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data } })),
            { type: 'text', text: m.content },
          ],
        }
      : m
  );

  try {
    const response = await client.messages.create(
      { model: CHAT_MODEL, max_tokens: 1500, system, messages: apiMessages },
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
