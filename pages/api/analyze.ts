import type { NextApiRequest, NextApiResponse } from 'next';
import Anthropic from '@anthropic-ai/sdk';

interface AnalysisResult {
  summary?: string;
  risk?: string;
  deadlines?: string[];
  nextSteps?: string[];
  error?: string;
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AnalysisResult>
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
    const { imageData, fileName } = req.body;

    if (!imageData) {
      res.status(400).json({ error: 'Keine Datei hochgeladen' });
      return;
    }

    // Extract media type from data URL
    const mediaTypeMatch = imageData.match(/^data:([^;]+);base64,/);
    const mediaType = mediaTypeMatch ? mediaTypeMatch[1] : 'image/jpeg';
    const base64Data = imageData.replace(/^data:[^;]+;base64,/, '');

    const message = await anthropic.messages.create(
      {
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                  data: base64Data,
                },
              },
              {
                type: 'text',
                text: `Analysiere diesen deutschen Behördenbrief und antworte STRIKT im folgenden JSON-Format:

{
  "summary": "2-3 Sätze: Worum geht es in diesem Brief?",
  "risk": "KRITISCH | WICHTIG | NIEDRIG",
  "deadlines": ["Frist 1", "Frist 2"],
  "nextSteps": ["Schritt 1", "Schritt 2"]
}

Nur JSON, keine weiteren Worte.`,
              },
            ],
          },
        ],
      },
      {
        timeout: 45000,
      }
    );

    // Extract text
    const responseText = message.content
      .filter((block) => block.type === 'text')
      .map((block) => (block.type === 'text' ? block.text : ''))
      .join('');

    // Parse JSON
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('❌ Invalid JSON from Claude');
      res.status(500).json({ error: 'Analysefehler' });
      return;
    }

    const result = JSON.parse(jsonMatch[0]) as AnalysisResult;
    res.status(200).json(result);
  } catch (error: any) {
    console.error('❌ Analyse-Fehler:', error?.message);
    console.error('❌ Error Details:', error);
    console.error('❌ Error Status:', error?.status);
    console.error('❌ Error Type:', error?.type);

    if (error?.status === 401) {
      res.status(401).json({ error: 'API-Authentifizierung fehlgeschlagen' });
    } else if (error?.message?.includes('timeout')) {
      res.status(504).json({ error: 'Analyse-Timeout' });
    } else if (error?.message?.includes('credit')) {
      res.status(402).json({ error: 'Keine Credits verfügbar. Bitte Guthaben aufladen.' });
    } else {
      res.status(500).json({
        error: `Technischer Fehler: ${error?.message || 'Unbekannter Fehler'}`
      });
    }
  }
}
