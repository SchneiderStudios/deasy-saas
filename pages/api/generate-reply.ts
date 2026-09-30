import type { NextApiRequest, NextApiResponse } from 'next';
import Anthropic from '@anthropic-ai/sdk';

interface ReplyGeneratorInput {
  summary: string;
  risk: string;
  deadlines?: string[];
  nextSteps?: string[];
  language: 'de' | 'ru';
}

interface GeneratedReply {
  subject: string;
  body: string;
  signature: string;
  tips: string[];
  createdAt: string;
}

type ResponseData = GeneratedReply | { error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { summary, risk, deadlines, nextSteps, language }: ReplyGeneratorInput = req.body;

    if (!summary || !language) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const client = new Anthropic();

    const isGerman = language === 'de';
    const prompt = isGerman
      ? `Du bist ein Experte für deutsche Behördenkommunikation. Generiere eine professionelle und höfliche Antwort auf den folgenden Behördenbrief.

Zusammenfassung des Briefs: ${summary}
Risiko-Level: ${risk}
Fristen: ${deadlines?.join(', ') || 'Keine'}
Nächste Schritte: ${nextSteps?.join(', ') || 'Keine'}

Bitte generiere eine professionelle Antwort mit folgender Struktur (als JSON):
{
  "subject": "Betreffzeile",
  "body": "Vollständiger Brief-Text",
  "signature": "Unterschriftsblock",
  "tips": ["Tipp 1", "Tipp 2", "Tipp 3"]
}`
      : `Ты эксперт в немецкой официальной переписке. Создай профессиональный и вежливый ответ на следующее официальное письмо.

Резюме письма: ${summary}
Уровень риска: ${risk}
Сроки: ${deadlines?.join(', ') || 'Нет'}
Следующие шаги: ${nextSteps?.join(', ') || 'Нет'}

Пожалуйста, создай профессиональный ответ со следующей структурой (как JSON):
{
  "subject": "Строка темы",
  "body": "Полный текст письма",
  "signature": "Блок подписи",
  "tips": ["Совет 1", "Совет 2", "Совет 3"]
}`;

    const message = await client.messages.create({
      model: 'claude-opus-5-5',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const responseText =
      message.content[0].type === 'text' ? message.content[0].text : '';

    // Parse JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse generated reply');
    }

    const parsedReply = JSON.parse(jsonMatch[0]);

    const reply: GeneratedReply = {
      subject: parsedReply.subject || 'Antwort auf Ihr Schreiben',
      body: parsedReply.body || '',
      signature:
        parsedReply.signature ||
        (isGerman
          ? 'Mit freundlichen Grüßen'
          : 'С уважением'),
      tips: parsedReply.tips || [],
      createdAt: new Date().toISOString(),
    };

    res.status(200).json(reply);
  } catch (error) {
    console.error('Error generating reply:', error);
    res.status(500).json({
      error: 'Failed to generate reply. Please try again.',
    });
  }
}
