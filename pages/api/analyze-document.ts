import { Anthropic } from "@anthropic-ai/sdk";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

const client = new Anthropic();

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { imageBase64, language } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "No image provided" });
    }

    // Вызываем Claude Vision для анализа
    const response = await client.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/jpeg",
                data: imageBase64,
              },
            },
            {
              type: "text",
              text:
                language === "ru"
                  ? `Ты немецкий юристический консультант. Проанализируй это официальное письмо и дай ответ в формате JSON:
{
  "summary": "краткое описание письма (2-3 предложения)",
  "risk": "Gering|Mittel|Kritisch",
  "deadlines": ["дата 1", "дата 2"],
  "actions": ["действие 1", "действие 2"]
}
Отвечай ТОЛЬКО JSON, без лишнего текста.`
                  : `Du bist ein deutscher Rechtsberater. Analysiere diesen offiziellen Brief und antworte im JSON-Format:
{
  "summary": "kurze Beschreibung des Briefes (2-3 Sätze)",
  "risk": "Gering|Mittel|Kritisch",
  "deadlines": ["datum 1", "datum 2"],
  "actions": ["aktion 1", "aktion 2"]
}
Antworte NUR mit JSON, ohne zusätzlichen Text.`,
            },
          ],
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      return res.status(500).json({ error: "Unexpected response format" });
    }

    const analysisText = content.text.trim();
    let analysis;

    try {
      analysis = JSON.parse(analysisText);
    } catch (e) {
      // Fallback if JSON parsing fails
      analysis = {
        summary: analysisText,
        risk: "Mittel",
        deadlines: [],
        actions: [],
      };
    }

    return res.status(200).json({
      success: true,
      analysis: {
        ...analysis,
        language: language || "de",
      },
    });
  } catch (error: any) {
    console.error("API Error:", error);
    return res.status(500).json({
      error: error.message || "Failed to analyze document",
    });
  }
}
