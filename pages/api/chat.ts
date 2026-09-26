import type { NextApiRequest, NextApiResponse } from 'next';
import Anthropic from '@anthropic-ai/sdk';

interface ChatResponse {
  response?: string;
  error?: string;
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ChatResponse>
) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ ANTHROPIC_API_KEY not set');
    res.status(500).json({ error: 'API-Konfiguration fehlt' });
    return;
  }

  try {
    const { message, context } = req.body;

    if (!message) {
      res.status(400).json({ error: 'Nachricht erforderlich' });
      return;
    }

    const systemPrompt = `Du bist ein hilfsbereiter KI-Assistent, der Deutschen hilft, ihre Behördenbriefe zu verstehen.
Der Nutzer hat gerade einen Brief analysiert. Hier ist die Zusammenfassung:

${context || 'Keine Zusammenfassung verfügbar'}

Antworte kurz, verständlich und auf Deutsch. Konzentriere dich auf praktische Tipps.`;

    const messageResponse = await anthropic.messages.create(
      {
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 512,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: message,
          },
        ],
      },
      {
        timeout: 30000,
      }
    );

    const responseText = messageResponse.content
      .filter((block) => block.type === 'text')
      .map((block) => (block.type === 'text' ? block.text : ''))
      .join('');

    res.status(200).json({ response: responseText });
  } catch (error: any) {
    console.error('❌ Chat-Fehler:', error?.message);

    if (error?.status === 401) {
      res.status(401).json({ error: 'API-Authentifizierung fehlgeschlagen' });
    } else if (error?.message?.includes('timeout')) {
      res.status(504).json({ error: 'Chat-Timeout' });
    } else {
      res.status(500).json({ error: 'Chat-Fehler' });
    }
  }
}
