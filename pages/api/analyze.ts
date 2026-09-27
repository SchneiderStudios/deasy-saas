import type { NextApiRequest, NextApiResponse } from 'next';
import Anthropic from '@anthropic-ai/sdk';

interface AnalysisResult {
  summary?: string;
  risk?: string;
  deadlines?: string[];
  nextSteps?: string[];
  actionSuggestions?: string[];
  language?: string;
  error?: string;
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '25mb',
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
    let mediaType = mediaTypeMatch ? mediaTypeMatch[1].toLowerCase() : 'image/jpeg';
    const base64Data = imageData.replace(/^data:[^;]+;base64,/, '');

    // Validate media type - only allow supported formats
    const allowedMediaTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMediaTypes.includes(mediaType)) {
      console.error(`❌ Unsupported media type: ${mediaType}`);
      res.status(400).json({
        error: `Format nicht unterstützt: ${mediaType}. Bitte verwende JPG, PNG, GIF oder WebP.`
      });
      return;
    }

    // First, detect document language
    const langDetectionMessage = await anthropic.messages.create(
      {
        model: 'claude-opus-5-5',
        max_tokens: 50,
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
                text: `What language is this document in? Answer with ONLY "de" for German or "ru" for Russian. No other text.`,
              },
            ],
          },
        ],
      },
      {
        timeout: 45000,
      }
    );

    const langText = langDetectionMessage.content
      .filter((block) => block.type === 'text')
      .map((block) => (block.type === 'text' ? block.text : ''))
      .join('')
      .trim();

    const documentLanguage = langText.includes('ru') ? 'ru' : 'de';

    // Create analysis prompt based on detected language
    let analysisPrompt = '';
    let riskTerms = '';

    if (documentLanguage === 'ru') {
      analysisPrompt = `Проанализируй это официальное письмо и ответь СТРОГО в следующем JSON-формате:

{
  "summary": "2-3 предложения: О чем этот письмо?",
  "risk": "КРИТИЧНО | ВАЖНО | НИЗКИЙ",
  "deadlines": ["Срок 1", "Срок 2"],
  "nextSteps": ["Шаг 1", "Шаг 2"],
  "actionSuggestions": ["Написать ответ", "Подать возражение", "Подготовить шаблон ответа"]
}

Только JSON, без других слов.`;
      riskTerms = 'КРИТИЧНО | ВАЖНО | НИЗКИЙ';
    } else {
      analysisPrompt = `Analysiere diesen deutschen Behördenbrief und antworte STRIKT im folgenden JSON-Format:

{
  "summary": "2-3 Sätze: Worum geht es in diesem Brief?",
  "risk": "KRITISCH | WICHTIG | NIEDRIG",
  "deadlines": ["Frist 1", "Frist 2"],
  "nextSteps": ["Schritt 1", "Schritt 2"],
  "actionSuggestions": ["Antwort schreiben", "Einspruch einreichen", "Antwort-Vorlage"]
}

Nur JSON, keine weiteren Worte.`;
      riskTerms = 'KRITISCH | WICHTIG | NIEDRIG';
    }

    const message = await anthropic.messages.create(
      {
        model: 'claude-opus-5-5',
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
                text: analysisPrompt,
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
    result.language = documentLanguage;
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
      console.error('❌ Full error object:', JSON.stringify(error, null, 2));
      res.status(500).json({
        error: 'Technischer Fehler bei der Analyse. Bitte versuchen Sie es später erneut oder kontaktieren Sie den Support.'
      });
    }
  }
}

