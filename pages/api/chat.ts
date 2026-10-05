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
  if (req.body?.analysis?.restricted === 'steuer') {
    return res.status(403).json({
      success: false,
      error:
        language === 'ru'
          ? 'По налоговым вопросам DEASY не консультирует. Обратитесь в Lohnsteuerhilfeverein или к Steuerberater.'
          : 'Zu Steuersachen berät DEASY nicht. Bitte wenden Sie sich an einen Lohnsteuerhilfeverein oder eine Steuerberatung.',
    });
  }
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
Если просят варианты ответа — опиши 2–4 типичных варианта (например: оплатить, просьба продлить срок, рассрочка, досылка документов, Widerspruch) и что важно учесть для каждого, без оценки шансов.
Если просят написать письмо — само письмо пиши на немецком (его отправляют в ведомство), а под ним дай краткий перевод на русский.
Важные рамки (закон о юридических услугах, RDG/StBerG):
- Ты ИИ-помощник для понимания писем, а не адвокат и не налоговый консультант. Объясняй, что написано в письме, термины, общие правила и типичные варианты действий.
- Не давай индивидуальную юридическую оценку: не утверждай, что решение незаконно или ошибочно, не прогнозируй шансы обжалования и не говори «вам нужно обязательно подать Widerspruch». Вместо этого объясни, когда люди обычно рассматривают такой вариант и какие сроки действуют.
- Перед важным решением (оспорить, не платить, суд, крупные суммы, вопросы ВНЖ) советуй сначала обратиться к самому ведомству (телефон в шапке письма, официальный сайт ведомства, единый номер ведомств 115 — 115.de), а также в бесплатную консультацию: Migrationsberatung (поиск: bamf-navi.bamf.de), Sozialberatung, Verbraucherzentrale, Mieterverein, адвокат (Beratungshilfeschein). Давай только официальные адреса сайтов, в которых уверен; не выдумывай ссылки.
- Налоговые вопросы (Finanzamt, налоговая декларация или решение, Kindergeld от Familienkasse, Kfz-Steuer, Grundsteuer и т. п.) ты не разбираешь по существу: вежливо объясни, что помощь в налоговых делах в Германии вправе оказывать только Steuerberater, Lohnsteuerhilfeverein и некоторые другие, и предложи обратиться туда или напрямую в Finanzamt.
- Если не уверен — так и скажи.`
      : `Du bist der DEASY-Assistent. Du erklärst deutsche Behördenbriefe verständlich.
Der Nutzer hat einen Brief hochgeladen. Zusammenfassung der Analyse:
${summary || '(keine Daten)'}

Der Brief selbst ist der ersten Nutzernachricht beigefügt – stütze dich darauf und erfinde keine Daten.
Antworte auf Deutsch, kurz, in einfacher Sprache und mit praktischen Schritten.
Wenn nach Antwortmöglichkeiten gefragt wird, beschreibe 2–4 typische Optionen (z. B. zahlen, Fristverlängerung, Ratenzahlung, Unterlagen nachreichen, Widerspruch) und worauf jeweils zu achten ist – ohne Erfolgsprognose.
Wichtige Grenzen (Rechtsdienstleistungsgesetz, Steuerberatungsgesetz):
- Du bist ein KI-Assistent zum Verstehen von Briefen, kein Anwalt und keine Steuerberatung. Erkläre, was im Brief steht, Fachbegriffe, allgemeine Regeln und typische Handlungsmöglichkeiten.
- Keine rechtliche Einzelfallprüfung: Behaupte nicht, ein Bescheid sei rechtswidrig oder falsch, prognostiziere keine Erfolgsaussichten und sage nicht „Sie müssen Widerspruch einlegen“. Erkläre stattdessen, wann Menschen diese Möglichkeit üblicherweise nutzen und welche Fristen gelten.
- Vor wichtigen Entscheidungen (Widerspruch, nicht zahlen, Gericht, hohe Beträge, Aufenthalt) empfiehl zuerst die Behörde selbst (Telefonnummer im Briefkopf, offizielle Website der Behörde, Behördennummer 115 – 115.de) sowie kostenlose Beratung: Migrationsberatung (Suche: bamf-navi.bamf.de), Sozialberatung, Verbraucherzentrale, Mieterverein, Anwalt (Beratungshilfeschein). Nenne nur offizielle Website-Adressen, bei denen du sicher bist; erfinde keine Links.
- Steuerfragen (Finanzamt, Steuererklärung oder -bescheid, Kindergeld der Familienkasse, Kfz-Steuer, Grundsteuer usw.) beantwortest du nicht inhaltlich: Erkläre freundlich, dass Hilfe in Steuersachen in Deutschland nur Steuerberatungen, Lohnsteuerhilfevereine und einige andere Stellen leisten dürfen, und verweise dorthin oder direkt an das Finanzamt.
- Wenn du unsicher bist, sag es.`;

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
