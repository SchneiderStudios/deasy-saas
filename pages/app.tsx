import React, { useState, useEffect, useCallback, useRef } from 'react';
import { usePricingTiers } from '@/hooks/usePricingTiers';
import { usePdfUpload } from '@/hooks/usePdfUpload';
import { useDocumentHistory } from '@/hooks/useDocumentHistory';
import styles from '@/styles/App.module.css';

interface AnalysisResult {
  summary: string;
  risk: 'Gering' | 'Mittel' | 'Kritisch';
  deadlines: string[];
  actions: string[];
  language: 'de' | 'ru';
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface ReplyTemplate {
  id: string;
  title_de: string;
  title_ru: string;
  subject_de: string;
  subject_ru: string;
  body_de: string;
  body_ru: string;
  tips_de: string[];
  tips_ru: string[];
}

const TEXTS_DE = {
  title: 'DEASY – Deutsch-Bürokratie Assistent',
  subtitle: 'Verstehe deutsche Behördenschreiben in Sekunden',
  uploadTitle: 'Dokument hochladen',
  uploadHint: 'PDF oder Bild hier ablegen oder klicken',
  uploadFormats: 'Formate: PDF, JPG, PNG (max 10 MB)',
  uploadInfo: 'DEASY analysiert automatisch jeden Brief, den du hochlädst und erklärt dir, was er bedeutet.',
  analyzeBtn: 'Dokument analysieren',
  analyzing: 'Analysieren...',
  analysis: 'Analyse',
  upgradeBtn: 'Auf Plus upgraden',
  freePlan: 'Kostenlos: 3 Dokumente/Monat',
  plusPlan: '€4,99: 50 Dokumente/Monat',
  proPlan: '€9,99: 100 Dokumente/Monat',
  businessPlan: '€49,99: Unbegrenzt',
  myDocuments: 'Meine Dokumente',
  language: 'Sprache',
  logout: 'Abmelden',
  summary: 'Zusammenfassung',
  risk: 'Risiko-Niveau',
  deadlines: 'Fristen',
  actions: 'Empfohlene Aktionen',
  askQuestion: 'Frage stellen',
  generateReply: 'Antwort schreiben',
  close: 'Schließen',
  chat: 'Chat',
  typeMessage: 'Deine Frage...',
  send: 'Senden',
  noMessages: 'Stelle eine Frage zum Dokument',
  replyTemplates: 'Antwort-Vorlagen',
  selectTemplate: 'Wähle eine Vorlage',
  copyToClipboard: 'In Zwischenablage kopieren',
  copied: 'Kopiert!',
  download: 'Herunterladen',
  back: 'Zurück',
  caseHistory: 'Dokumentverlauf',
  noCases: 'Keine Dokumente noch',
  date: 'Datum',
  file: 'Datei',
  edit: 'Bearbeiten',
  delete: 'Löschen',
  usage: 'Nutzung',
  error: 'Fehler bei der Analyse. Bitte versuche es erneut.',
  loading: 'Lädt...',
};

const TEXTS_RU = {
  title: 'DEASY – Помощник по немецкой бюрократии',
  subtitle: 'Разберись в немецких официальных письмах за секунды',
  uploadTitle: 'Загрузить документ',
  uploadHint: 'Перетащи PDF или изображение сюда или нажми',
  uploadFormats: 'Форматы: PDF, JPG, PNG (макс 10 МБ)',
  uploadInfo: 'DEASY автоматически анализирует каждое письмо, которое ты загружаешь, и объясняет тебе, что оно означает.',
  analyzeBtn: 'Анализировать документ',
  analyzing: 'Анализирование...',
  analysis: 'Анализ',
  upgradeBtn: 'Обновить на Plus',
  freePlan: 'Бесплатно: 3 документа/месяц',
  plusPlan: '€4,99: 50 документов/месяц',
  proPlan: '€9,99: 100 документов/месяц',
  businessPlan: '€49,99: Без ограничений',
  myDocuments: 'Мои документы',
  language: 'Язык',
  logout: 'Выход',
  summary: 'Резюме',
  risk: 'Уровень риска',
  deadlines: 'Сроки',
  actions: 'Рекомендуемые действия',
  askQuestion: 'Задать вопрос',
  generateReply: 'Написать ответ',
  close: 'Закрыть',
  chat: 'Чат',
  typeMessage: 'Твой вопрос...',
  send: 'Отправить',
  noMessages: 'Задай вопрос о документе',
  replyTemplates: 'Шаблоны ответов',
  selectTemplate: 'Выбрать шаблон',
  copyToClipboard: 'Скопировать',
  copied: 'Скопировано!',
  download: 'Загрузить',
  back: 'Назад',
  caseHistory: 'История документов',
  noCases: 'Документов ещё нет',
  date: 'Дата',
  file: 'Файл',
  edit: 'Редактировать',
  delete: 'Удалить',
  usage: 'Использование',
  error: 'Ошибка при анализе. Попробуй ещё раз.',
  loading: 'Загрузка...',
};

const TIER_LIMITS = { free: 3, plus: 50, pro: 100, business: 999 };
const TIER_PRICES = { free: '€0', plus: '€4,99', pro: '€9,99', business: '€49,99' };

const REPLY_TEMPLATES: ReplyTemplate[] = [
  {
    id: 'reject_finanzamt',
    title_de: 'Finanzamt-Einspruch',
    title_ru: 'Возражение налоговой инспекции',
    subject_de: 'Einspruch gegen Bescheid vom [DATUM]',
    subject_ru: 'Возражение на решение от [ДАТА]',
    body_de: `Sehr geehrte Damen und Herren,

gegen Ihren Bescheid vom [DATUM] mit dem Aktenzeichen [AKTENZEICHEN] lege ich hiermit Einspruch ein.

Begründung:
[BEGRÜNDUNG EINFÜGEN]

Ich bitte Sie, den Bescheid zu überprüfen und angepasst zu erlassen.

Mit freundlichen Grüßen,
[DEIN NAME]`,
    
    body_ru: `Уважаемые дамы и господа,

против решения от [ДАТА] с номером дела [НОМЕР] я подаю возражение.

Обоснование:
[ОБОСНОВАНИЕ]

Прошу пересмотреть решение и выдать исправленное.

С уважением,
[ТВОЁ ИМЯ]`,
    tips_de: ['Aktennummer копировать', 'Конкретные основания', 'Приложить документы'],
    tips_ru: ['Копировать номер дела', 'Указать конкретные причины', 'Приложить документы'],
  },
];

export default function App() {
  const { usageStats, canMakeRequest, incrementUsage, allTiers } = usePricingTiers();
  const { convertPdfToImages } = usePdfUpload();
  const { saveCaseToHistory } = useDocumentHistory();

  const [selectedLanguage, setSelectedLanguage] = useState<'de' | 'ru'>('de');
  const TEXTS = selectedLanguage === 'ru' ? TEXTS_RU : TEXTS_DE;

  const [currentView, setCurrentView] = useState<'upload' | 'analysis' | 'chat' | 'reply'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ReplyTemplate | null>(null);
  const [generatedReply, setGeneratedReply] = useState<{ subject: string; body: string } | null>(null);

  const [showPricingModal, setShowPricingModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file upload
  const handleFileUpload = useCallback(
    async (files: File[]) => {
      if (!files.length) return;

      const file = files[0];
      if (file.size > 10 * 1024 * 1024) {
        setError(selectedLanguage === 'de' ? 'Datei zu groß' : 'Файл слишком большой');
        return;
      }

      if (!canMakeRequest()) {
        setShowPricingModal(true);
        return;
      }

      setError(null);
      setSelectedFile(file);
      setIsLoading(true);

      try {
                const result = await convertPdfToImages(file);
        const images = result.base64Images;
        setUploadedImages(images);

        // Отправляем на анализ в API
        if (images.length > 0) {
          const response = await fetch('/api/analyze-document', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageBase64: images[0].split(',')[1],
              language: selectedLanguage,
            }),
          });

          if (!response.ok) throw new Error('Analysis failed');

          const data = await response.json();
          if (data.success) {
            setAnalysis(data.analysis);
            incrementUsage();
            saveCaseToHistory(data.analysis, file.name);
            setCurrentView('analysis');
          }
        }
      } catch (err) {
        setError(TEXTS.error);
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    },
    [canMakeRequest, incrementUsage, saveCaseToHistory, convertPdfToImages, selectedLanguage]
  );

  // Drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    handleFileUpload(files);
  };

  // Chat
  const handleSendMessage = async () => {
    if (!chatInput.trim() || !analysis) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: chatInput,
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput('');
    setChatLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            ...chatMessages.map((m) => ({ role: m.role, content: m.content })),
            { role: 'user', content: chatInput },
          ],
          analysisSummary: analysis.summary,
          language: selectedLanguage,
        }),
      });

      if (!response.ok) throw new Error('Chat failed');

      const data = await response.json();
      if (data.success) {
        setChatMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: data.message,
          },
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setChatLoading(false);
    }
  };

  const renderUploadView = () => (
    <div className={styles.uploadSection}>
      <h2>{TEXTS.uploadTitle}</h2>
      <p style={{ marginBottom: '20px', color: '#666', fontSize: '14px' }}>
        {TEXTS.uploadInfo}
      </p>

      <div
        className={styles.uploadArea}
        onDragOver={handleDragOver}
        onDragLeave={() => {}}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div style={{ textAlign: 'center', cursor: 'pointer' }}>
          <div style={{ fontSize: '48px', marginBottom: '10px' }}>📄</div>
          <p className={styles.uploadText}>{TEXTS.uploadHint}</p>
          <p className={styles.uploadSubtext}>{TEXTS.uploadFormats}</p>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={(e) => handleFileUpload(Array.from(e.target.files || []))}
        style={{ display: 'none' }}
      />

      {error && <div style={{ color: 'red', marginTop: '10px' }}>{error}</div>}
      {isLoading && <div style={{ marginTop: '10px', color: '#666' }}>{TEXTS.analyzing}</div>}
    </div>
  );

  const renderAnalysisView = () => (
    <div className={styles.analysisPanel}>
      <button onClick={() => setCurrentView('upload')} style={{ marginBottom: '20px' }}>
        ← {TEXTS.back}
      </button>

      {uploadedImages.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h3>{selectedLanguage === 'de' ? 'Dokument' : 'Документ'}</h3>
          <img src={uploadedImages[0]} alt="doc" style={{ maxHeight: '200px', borderRadius: '8px' }} />
        </div>
      )}

      {analysis && (
        <>
          <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f0f7ff', borderRadius: '8px' }}>
            <h3>{TEXTS.summary}</h3>
            <p>{analysis.summary}</p>
          </div>

          <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '8px' }}>
            <h3>{TEXTS.risk}</h3>
            <p>{analysis.risk === 'Kritisch' ? '🔴' : analysis.risk === 'Mittel' ? '🟡' : '🟢'} {analysis.risk}</p>
          </div>

          <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#e8f5e9', borderRadius: '8px' }}>
            <h3>{TEXTS.deadlines}</h3>
            <ul>
              {analysis.deadlines.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
          </div>

          <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#ede7f6', borderRadius: '8px' }}>
            <h3>{TEXTS.actions}</h3>
            <ul>
              {analysis.actions.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button className={styles.analyzeButton} onClick={() => setCurrentView('chat')} style={{ flex: 1 }}>
              💬 {TEXTS.askQuestion}
            </button>
            <button className={styles.analyzeButton} onClick={() => setCurrentView('reply')} style={{ flex: 1 }}>
              ✉️ {TEXTS.generateReply}
            </button>
          </div>
        </>
      )}
    </div>
  );

  const renderChatView = () => (
    <div className={styles.chatPanel}>
      <button onClick={() => setCurrentView('analysis')} style={{ marginBottom: '20px' }}>
        ← {TEXTS.back}
      </button>

      <h2>{TEXTS.chat}</h2>
      <div style={{ height: '400px', overflowY: 'auto', marginBottom: '10px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
        {chatMessages.length === 0 && (
          <p style={{ color: '#999', textAlign: 'center', marginTop: '20px' }}>{TEXTS.noMessages}</p>
        )}
        {chatMessages.map((msg) => (
          <div
            key={msg.id}
            style={{
              marginBottom: '10px',
              padding: '10px',
              backgroundColor: msg.role === 'user' ? '#007bff' : '#e9ecef',
              color: msg.role === 'user' ? 'white' : 'black',
              borderRadius: '8px',
            }}
          >
            {msg.content}
          </div>
        ))}
        {chatLoading && <div style={{ color: '#999' }}>{TEXTS.loading}</div>}
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <input
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !chatLoading && handleSendMessage()}
          placeholder={TEXTS.typeMessage}
          disabled={chatLoading}
          style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <button onClick={handleSendMessage} disabled={chatLoading} className={styles.analyzeButton}>
          {TEXTS.send}
        </button>
      </div>
    </div>
  );

  const renderReplyView = () => (
    <div className={styles.chatPanel}>
      <button onClick={() => setCurrentView('analysis')} style={{ marginBottom: '20px' }}>
        ← {TEXTS.back}
      </button>

      <h2>{TEXTS.replyTemplates}</h2>

      {!selectedTemplate && (
        <div style={{ display: 'grid', gap: '10px', marginTop: '15px' }}>
          {REPLY_TEMPLATES.map((template) => (
            <button
              key={template.id}
              onClick={() => setSelectedTemplate(template)}
              style={{
                padding: '15px',
                textAlign: 'left',
                backgroundColor: '#f5f5f5',
                border: '1px solid #ddd',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              <strong>{selectedLanguage === 'de' ? template.title_de : template.title_ru}</strong>
            </button>
          ))}
        </div>
      )}

      {selectedTemplate && (
        <div>
          <button onClick={() => setSelectedTemplate(null)} style={{ marginBottom: '15px' }}>
            ← {TEXTS.back}
          </button>
          <textarea
            defaultValue={selectedLanguage === 'de' ? selectedTemplate.body_de : selectedTemplate.body_ru}
            style={{
              width: '100%',
              height: '400px',
              padding: '10px',
              borderRadius: '4px',
              border: '1px solid #ddd',
            }}
          />
          <button
            onClick={() => {
              const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
              navigator.clipboard.writeText(textarea?.value || '');
              alert(TEXTS.copied);
            }}
            className={styles.analyzeButton}
            style={{ marginTop: '10px', width: '100%' }}
          >
            {TEXTS.copyToClipboard}
          </button>
        </div>
      )}
    </div>
  );

   const currentTierId = 'free'; // Default to free tier
  const currentTier = allTiers.find((t) => t.id === currentTierId) || allTiers[0];
  const tierLimit = TIER_LIMITS[currentTierId as keyof typeof TIER_LIMITS] || 3;
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>{TEXTS.title}</h1>
            <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>
              {usageStats.monthlyUsage}/{tierLimit} {TEXTS.usage}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value as 'de' | 'ru')}
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
            >
              <option value="de">Deutsch</option>
              <option value="ru">Русский</option>
            </select>
                       {currentTierId === 'free' && (
              <button onClick={() => setShowPricingModal(true)} className={styles.analyzeButton}>
                {TEXTS.upgradeBtn}
              </button>
            )}
          </div>
        </div>
      </header>

      <main className={styles.mainContent}>
        {currentView === 'upload' && renderUploadView()}
        {currentView === 'analysis' && renderAnalysisView()}
        {currentView === 'chat' && renderChatView()}
        {currentView === 'reply' && renderReplyView()}
      </main>

      {showPricingModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h2>{selectedLanguage === 'de' ? 'Pläne & Preise' : 'Планы и цены'}</h2>
            <div className={styles.plans}>
              {allTiers.map((tier) => (
                <div key={tier.id} className={styles.planCard}>
                  <h3>{tier.name}</h3>
                  <p className={styles.price}>{TIER_PRICES[tier.id as keyof typeof TIER_PRICES] || '€0'}</p>
                  <p>{TIER_LIMITS[tier.id as keyof typeof TIER_LIMITS] || 3}</p>
                  <button
                    onClick={() => {
                      if (tier.id === 'free') setShowPricingModal(false);
                      else window.open(`https://buy.stripe.com/${tier.id}`, '_blank');
                    }}
                    className={styles.analyzeButton}
                  >
                    {tier.id === 'free' ? TEXTS.close : 'Upgrade'}
                  </button>
                </div>
              ))}
            </div>
            <button onClick={() => setShowPricingModal(false)} className={styles.analyzeButton}>
              {TEXTS.close}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
