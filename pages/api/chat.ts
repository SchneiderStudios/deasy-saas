import type { NextApiRequest, NextApiResponse } from 'next';
import Anthropic from '@anthropic-ai/sdk';

export const config = { api: { bodyParser: { sizeLimit: '4.5mb' } } };

const CHAT_MODEL = 'claude-sonnet-5-5';
/** Быстрый фильтр вопросов (RDG): понимание письма — отвечаем; правовая оценка случая — вежливый отказ. */
const GUARD_MODEL = 'claude-haiku-4-5-20251001';
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


const GUARD_PROMPT = `Du prüfst Fragen an einen KI-Assistenten, der deutsche Behördenbriefe nur ERKLÄRT (Rechtsdienstleistungsgesetz: keine rechtliche Prüfung des Einzelfalls).

Antworte mit genau einem Wort:
VERSTEHEN – die Frage betrifft das Verständnis: was im Brief steht, was ein Wort bedeutet, was der Brief verlangt, bis wann, welche Unterlagen, wen man kontaktieren kann, welche Folgen der Brief selbst nennt, wie ein Ablauf allgemein funktioniert, Übersetzung, Begrüßung oder Dank.
BEWERTUNG – die Frage verlangt eine rechtliche Einschätzung des eigenen Falls: ob der Bescheid oder die Forderung richtig, rechtmäßig oder angreifbar ist; ob man rechtlich wirklich verpflichtet ist bzw. es ablehnen darf; Erfolgsaussichten; ob man Widerspruch, Einspruch, Klage oder Beschwerde einlegen soll oder ein solches Schreiben/Argumente dafür; wie man eine Pflicht, Zahlung oder Sanktion umgehen kann; rechtliche Strategie; Folgen für den eigenen Aufenthaltsstatus; Steuerfragen.

Im Zweifel: BEWERTUNG.`;

async function isBewertung(question: string, previousAnswer: string): Promise<boolean> {
  try {
    const r = await client.messages.create(
      {
        model: GUARD_MODEL,
        max_tokens: 5,
        system: GUARD_PROMPT,
        messages: [
          {
            role: 'user',
            content: `${previousAnswer ? `Vorherige Antwort des Assistenten (Kontext): ${previousAnswer.slice(0, 600)}\n\n` : ''}Frage: ${question.slice(0, 1500)}`,
          },
        ],
      },
      { timeout: 12000 }
    );
    const out = r.content.map((b) => (b.type === 'text' ? b.text : '')).join('').toUpperCase();
    return out.includes('BEWERTUNG');
  } catch (e: any) {
    console.error('Guard-Fehler (Frage wird normal beantwortet):', e?.status, e?.message);
    return false; // основной промпт тоже запрещает правовую оценку
  }
}

const ABLEHNUNG = {
  de: `Das ist eine Frage nach einer **rechtlichen Einschätzung Ihres Falls**. Die darf DEASY nach dem Rechtsdienstleistungsgesetz nicht geben – ich erkläre nur, was im Brief steht.

**Wo Sie verbindlich Hilfe bekommen:**
• Die Behörde selbst – Telefonnummer im Briefkopf, oder Behördennummer 115 (115.de)
• Migrationsberatung – kostenlos, Suche: bamf-navi.bamf.de
• Verbraucherzentrale, Mieterverein oder Sozialberatung – je nach Thema
• Anwalt – mit einem Beratungshilfeschein vom Amtsgericht oft für 15 €

Ob und bis wann Sie Widerspruch einlegen können, steht meist im Abschnitt **„Rechtsbehelfsbelehrung“** am Ende des Briefes.

Gern erkläre ich Ihnen, **was der Brief verlangt, bis wann und welche Unterlagen nötig sind** – fragen Sie einfach.`,
  ru: `Это вопрос о **правовой оценке вашей ситуации**. По немецкому закону о юридических услугах (RDG) DEASY не может её давать — я объясняю только, что написано в письме.

**Где получить надёжную помощь:**
• Само ведомство — телефон в шапке письма или единый номер 115 (115.de)
• Migrationsberatung — бесплатно, поиск: bamf-navi.bamf.de
• Verbraucherzentrale, Mieterverein или Sozialberatung — в зависимости от темы
• Адвокат — с Beratungshilfeschein из Amtsgericht часто всего за 15 €

Можно ли подать возражение (Widerspruch) и до какого числа, обычно написано в разделе **«Rechtsbehelfsbelehrung»** в конце письма.

С радостью объясню, **что требует письмо, до какого срока и какие документы нужны** — спрашивайте.`,
};

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
    a.risk ? `Dringlichkeit laut Brief: ${a.risk}` : '',
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
Отвечай на русском, коротко и понятно. Немецкие термины давай в оригинале с переводом.
Твоя задача — только перевод и понимание письма: что в нём написано, что оно требует, до какого срока, какие документы нужны, какие последствия называет само письмо и куда обратиться. Если спрашивают, как реагировать, перескажи требования письма, а не советуй, что выбрать. Про Widerspruch, Einspruch или суд можно сказать только то, что такая возможность и срок указаны в Rechtsbehelfsbelehrung письма и что решать это стоит со специалистом.
Письма-ответы в чате не пиши: для простых писем (продление срока, документы, вопрос) есть вкладка «Написать ответ» — направь туда.
Важные рамки (закон о юридических услугах, RDG/StBerG):
- Ты ИИ-помощник для понимания писем, а не адвокат и не налоговый консультант. Объясняй, что написано в письме, термины, общие правила и типичные варианты действий.
- Не давай индивидуальную юридическую оценку: не утверждай, что решение законно, незаконно или ошибочно, не говори, обязан ли человек платить или выполнять требование сверх того, что написано в письме, не прогнозируй шансы и не советуй подавать или не подавать Widerspruch. Не применяй законы к ситуации пользователя.
- Перед важным решением (оспорить, не платить, суд, крупные суммы, вопросы ВНЖ) советуй сначала обратиться к самому ведомству (телефон в шапке письма, официальный сайт ведомства, единый номер ведомств 115 — 115.de), а также в бесплатную консультацию: Migrationsberatung (поиск: bamf-navi.bamf.de), Sozialberatung, Verbraucherzentrale, Mieterverein, адвокат (Beratungshilfeschein). Давай только официальные адреса сайтов, в которых уверен; не выдумывай ссылки.
- Налоговые вопросы (Finanzamt, налоговая декларация или решение, Kindergeld от Familienkasse, Kfz-Steuer, Grundsteuer и т. п.) ты не разбираешь по существу: вежливо объясни, что помощь в налоговых делах в Германии вправе оказывать только Steuerberater, Lohnsteuerhilfeverein и некоторые другие, и предложи обратиться туда или напрямую в Finanzamt.
- Если не уверен — так и скажи.`
      : `Du bist der DEASY-Assistent. Du erklärst deutsche Behördenbriefe verständlich.
Der Nutzer hat einen Brief hochgeladen. Zusammenfassung der Analyse:
${summary || '(keine Daten)'}

Der Brief selbst ist der ersten Nutzernachricht beigefügt – stütze dich darauf und erfinde keine Daten.
Antworte auf Deutsch, kurz und in einfacher Sprache.
Deine Aufgabe ist nur das Verstehen des Briefes: was drinsteht, was er verlangt, bis wann, welche Unterlagen nötig sind, welche Folgen der Brief selbst nennt und an wen man sich wenden kann. Fragt jemand, wie er reagieren soll, gib wieder, was der Brief verlangt – empfiehl keine Entscheidung. Zu Widerspruch, Einspruch oder Klage sag nur, dass Möglichkeit und Frist in der Rechtsbehelfsbelehrung des Briefes stehen und man das mit einer Fachperson entscheiden sollte.
Schreibe im Chat keine Antwortbriefe: Für einfache Schreiben (Fristverlängerung, Unterlagen, Rückfrage) gibt es den Reiter „Antwort schreiben“ – verweise dorthin.
Wichtige Grenzen (Rechtsdienstleistungsgesetz, Steuerberatungsgesetz):
- Du bist ein KI-Assistent zum Verstehen von Briefen, kein Anwalt und keine Steuerberatung. Erkläre, was im Brief steht, Fachbegriffe, allgemeine Regeln und typische Handlungsmöglichkeiten.
- Keine rechtliche Einzelfallprüfung: Sag nicht, ob ein Bescheid rechtmäßig, rechtswidrig oder falsch ist, ob jemand über den Brief hinaus rechtlich verpflichtet ist, prognostiziere keine Erfolgsaussichten und rate weder zu noch von Widerspruch ab. Wende keine Gesetze auf die Situation des Nutzers an.
- Vor wichtigen Entscheidungen (Widerspruch, nicht zahlen, Gericht, hohe Beträge, Aufenthalt) empfiehl zuerst die Behörde selbst (Telefonnummer im Briefkopf, offizielle Website der Behörde, Behördennummer 115 – 115.de) sowie kostenlose Beratung: Migrationsberatung (Suche: bamf-navi.bamf.de), Sozialberatung, Verbraucherzentrale, Mieterverein, Anwalt (Beratungshilfeschein). Nenne nur offizielle Website-Adressen, bei denen du sicher bist; erfinde keine Links.
- Steuerfragen (Finanzamt, Steuererklärung oder -bescheid, Kindergeld der Familienkasse, Kfz-Steuer, Grundsteuer usw.) beantwortest du nicht inhaltlich: Erkläre freundlich, dass Hilfe in Steuersachen in Deutschland nur Steuerberatungen, Lohnsteuerhilfevereine und einige andere Stellen leisten dürfen, und verweise dorthin oder direkt an das Finanzamt.
- Wenn du unsicher bist, sag es.`;

  // RDG-фильтр: вопросы с просьбой о правовой оценке не отправляем в основную модель
  const lastQuestion = messages[messages.length - 1].content;
  const prevAnswer = [...messages].reverse().find((m) => m.role === 'assistant')?.content || '';
  if (await isBewertung(lastQuestion, prevAnswer)) {
    return res.status(200).json({ success: true, message: ABLEHNUNG[language], guarded: true });
  }

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
