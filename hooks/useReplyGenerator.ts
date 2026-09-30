import { useState, useCallback } from 'react';

export interface ReplyGeneratorInput {
  summary: string;
  risk: string;
  deadlines?: string[];
  nextSteps?: string[];
  language: 'de' | 'ru';
}

export interface GeneratedReply {
  subject: string;
  body: string;
  signature: string;
  tips: string[];
  createdAt: string;
}

export function useReplyGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingError, setGeneratingError] = useState<string | null>(null);
  const [generatedReply, setGeneratedReply] = useState<GeneratedReply | null>(null);

  const generateReply = useCallback(async (input: ReplyGeneratorInput): Promise<GeneratedReply> => {
    try {
      setIsGenerating(true);
      setGeneratingError(null);

      const response = await fetch('/api/generate-reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        throw new Error('Failed to generate reply');
      }

      const reply: GeneratedReply = await response.json();
      setGeneratedReply(reply);
      setIsGenerating(false);

      return reply;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to generate reply';
      setGeneratingError(errorMessage);
      setIsGenerating(false);
      throw error;
    }
  }, []);

  // Local reply generation as fallback (without API)
  const generateReplyLocal = useCallback(
    (input: ReplyGeneratorInput): GeneratedReply => {
      const { summary, risk, deadlines, nextSteps, language } = input;
      const isGerman = language === 'de';

      // German templates
      const germanSubject = risk === 'Kritisch' ? 'Einhaltung der Frist - ' + (deadlines?.[0] || 'Ihre Antwort benötigt')
        : 'Antwort auf Ihr Behörden-Schreiben';
      const germanSignature = 'Mit freundlichen Grüßen,\n\n[Ihr Name]\n[Ihr Adresse]\n[Telefon / E-Mail]';
      const germanTips = [
        '✉️ Speichern Sie diese Antwort als Entwurf',
        '📋 Passen Sie Ihr Name und Adresse an',
        '✍️ Fügen Sie zusätzliche Details hinzu, wenn nötig',
        '📎 Senden Sie per Einschreiben für Wichtiges',
      ];

      // Russian templates
      const russianSubject = risk === 'Критично' ? 'Соблюдение крайнего срока - ' + (deadlines?.[0] || 'Требуется ответ')
        : 'Ответ на ваше официальное письмо';
      const russianSignature = 'С уважением,\n\n[Ваше имя]\n[Ваш адрес]\n[Телефон / E-mail]';
      const russianTips = [
        '✉️ Сохраните этот ответ как черновик',
        '📋 Измените свое имя и адрес',
        '✍️ Добавьте дополнительные детали при необходимости',
        '📎 Отправьте заказным письмом для важных документов',
      ];

      const subject = isGerman ? germanSubject : russianSubject;
      const signature = isGerman ? germanSignature : russianSignature;
      const tips = isGerman ? germanTips : russianTips;

      let body = isGerman
        ? 'Sehr geehrte Damen und Herren,\n\n'
        : 'Уважаемые дамы и господа,\n\n';

      // Add context from summary
      if (isGerman) {
        body += `ich beziehe mich auf Ihr Schreiben vom ${new Date().toLocaleDateString('de-DE')}.\n\n`;
        body += `Nach sorgfältiger Prüfung möchte ich folgende Punkte klarstellen:\n`;
        body += `- ${summary}\n\n`;
        if (nextSteps && nextSteps.length > 0) {
          body += `Meine nächsten Schritte:\n`;
          nextSteps.slice(0, 3).forEach((step) => {
            body += `- ${step}\n`;
          });
          body += '\n';
        }
        body += `Ich bitte um Bestätigung des Eingangs dieses Schreibens.\n\n`;
      } else {
        body += `я ссылаюсь на ваше письмо от ${new Date().toLocaleDateString('ru-RU')}.\n\n`;
        body += `После тщательного рассмотрения я хотел бы уточнить следующие моменты:\n`;
        body += `- ${summary}\n\n`;
        if (nextSteps && nextSteps.length > 0) {
          body += `Мои следующие шаги:\n`;
          nextSteps.slice(0, 3).forEach((step) => {
            body += `- ${step}\n`;
          });
          body += '\n';
        }
        body += `Прошу подтвердить получение данного письма.\n\n`;
      }

      body += signature;

      const reply: GeneratedReply = {
        subject,
        body,
        signature,
        tips,
        createdAt: new Date().toISOString(),
      };

      setGeneratedReply(reply);
      return reply;
    },
    []
  );

  const copyToClipboard = useCallback(async (text: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      return false;
    }
  }, []);

  const downloadAsText = useCallback((reply: GeneratedReply, fileName: string = 'reply.txt') => {
    const content = `Betreff: ${reply.subject}\n\n${reply.body}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  return {
    isGenerating,
    generatingError,
    generatedReply,
    generateReply,
    generateReplyLocal,
    copyToClipboard,
    downloadAsText,
  };
}
