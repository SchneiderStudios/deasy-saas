import React, { useState, useEffect, useCallback, useRef } from 'react';
import { usePricingTiers } from '@/hooks/usePricingTiers';
import { usePdfUpload } from '@/hooks/usePdfUpload';
import { useDocumentHistory } from '@/hooks/useDocumentHistory';
import styles from '@/styles/App.module.css';
import DocumentAssistant from '@/components/DocumentAssistant';
import LegalLinks from '@/components/LegalLinks';
import { BeratungHinweis, SteuerHinweis } from '@/components/BeratungHinweis';

interface AnalysisResult {
  summary: string;
  risk: 'Gering' | 'Mittel' | 'Kritisch';
  deadlines: string[];
  actions: string[];
  language: 'de' | 'ru';
  absender?: string;
  restricted?: 'steuer';
}

const TEXTS_DE = {
  title: 'DEASY – Deutsch-Bürokratie Assistent',
  subtitle: 'Verstehe deutsche Behördenschreiben in Sekunden',
  uploadTitle: 'Dokument hochladen',
  uploadHint: 'PDF oder Bild hier ablegen oder klicken',
  uploadFormats: 'Formate: PDF, JPG, PNG, HEIC (max 10 MB)',
  uploadInfo: 'DEASY analysiert automatisch jeden Brief, den du hochlädst und erklärt dir, was er bedeutet.',
  analyzeBtn: 'Dokument analysieren',
  analyzing: 'Analysieren...',
  analysis: 'Analyse',
  upgradeBtn: 'Auf Plus upgraden',
  freePlan: 'Kostenlos: 3 Dokumente/Monat',
  plusPlan: '€4,99: 50 Dokumente/Monat',
  proPlan: '€9,99: 100 Dokumente/Monat',
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
  uploadFormats: 'Форматы: PDF, JPG, PNG, HEIC (макс 10 МБ)',
  uploadInfo: 'DEASY автоматически анализирует каждое письмо, которое ты загружаешь, и объясняет тебе, что оно означает.',
  analyzeBtn: 'Анализировать документ',
  analyzing: 'Анализирование...',
  analysis: 'Анализ',
  upgradeBtn: 'Обновить на Plus',
  freePlan: 'Бесплатно: 3 документа/месяц',
  plusPlan: '€4,99: 50 документов/месяц',
  proPlan: '€9,99: 100 документов/месяц',
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


export default function App() {
  const { usageStats, canMakeRequest, incrementUsage, getCurrentTier, getRemainingRequests, allTiers, activation, activationError, dismissActivation } = usePricingTiers();
  const { convertFileToImages, error: pdfError, clearError } = usePdfUpload();
  const { saveCaseToHistory } = useDocumentHistory();

  const [selectedLanguage, setSelectedLanguage] = useState<'de' | 'ru'>('de');
  const TEXTS = selectedLanguage === 'ru' ? TEXTS_RU : TEXTS_DE;

  const [currentView, setCurrentView] = useState<'upload' | 'analysis'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [docKey, setDocKey] = useState(0);

  const [showPricingModal, setShowPricingModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Einwilligung (Art. 6 Abs. 1 lit. a, Art. 9 Abs. 2 lit. a, Art. 49 DSGVO) — до первой загрузки
  const CONSENT_KEY = 'deasyConsent';
  const CONSENT_VERSION = '2026-10';
  const [consent, setConsent] = useState(false);
  const [consentHint, setConsentHint] = useState(false);
  useEffect(() => {
    try {
      setConsent(localStorage.getItem(CONSENT_KEY) === CONSENT_VERSION);
    } catch {}
  }, []);
  const updateConsent = (value: boolean) => {
    setConsent(value);
    setConsentHint(false);
    try {
      if (value) localStorage.setItem(CONSENT_KEY, CONSENT_VERSION);
      else localStorage.removeItem(CONSENT_KEY);
    } catch {}
  };

  // Handle file upload
  const handleFileUpload = async (files: File[]) => {
    if (files.length === 0) return;

    if (isLoading) return;
    if (!consent) {
      setConsentHint(true);
      return;
    }
    const file = files[0]; // Берем первый файл

    if (!canMakeRequest()) {
      setShowPricingModal(true);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Конвертируем файл (фото или PDF) в images
      const result = await convertFileToImages(file);

      if (!result.base64Images || result.base64Images.length === 0) {
        throw new Error('Failed to process file');
      }

      // Отправляем на анализ все страницы (для PDF — до 3)
      const response = await fetch('/api/analyze-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: result.base64Images,
          language: selectedLanguage,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 413) {
          throw new Error(selectedLanguage === 'de' ? 'Datei zu groß für die Analyse' : 'Файл слишком большой для анализа');
        }
        throw new Error(errorData.error || `Analysis failed (${response.status})`);
      }

      const data = await response.json();
      const raw = data.analysis || data;
      const analysisData: AnalysisResult = {
        summary: raw.summary || '',
        risk: raw.risk || 'Mittel',
        deadlines: Array.isArray(raw.deadlines) ? raw.deadlines : [],
        actions: Array.isArray(raw.actions) ? raw.actions : [],
        language: raw.language || selectedLanguage,
        absender: raw.absender || '',
        restricted: raw.restricted === 'steuer' ? 'steuer' : undefined,
      };

      // Сохраняем результат анализа
      setAnalysis(analysisData);
      setUploadedImages(result.base64Images);
      setCurrentView('analysis');

      // Налоговые письма не разбираем (§ 2 StBerG): не сохраняем и не списываем лимит
      if (!analysisData.restricted) {
        saveCaseToHistory({ ...analysisData, nextSteps: analysisData.actions }, result.fileName);
        incrementUsage();
      }

      setDocKey((k) => k + 1); // новый документ → новый чат

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : (selectedLanguage === 'de' ? 'Upload fehlgeschlagen' : 'Загрузка не удалась');
      setError(errorMessage);
      console.error('Upload error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    handleFileUpload(files);
  };

  const renderUploadView = () => (
    <div className={styles.uploadSection}>
      <h2>{TEXTS.uploadTitle}</h2>
      <p style={{ marginBottom: '20px', color: '#666', fontSize: '14px' }}>
        {TEXTS.uploadInfo}
      </p>

      <p style={{ margin: '0 0 16px', padding: '10px 12px', background: '#f5f3ff', borderRadius: 10, fontSize: 13, color: '#3829a0' }}>
        🤖 {selectedLanguage === 'de'
          ? 'DEASY nutzt künstliche Intelligenz (Claude von Anthropic). Ergebnisse werden automatisch erzeugt, können Fehler enthalten und ersetzen keine Beratung durch Fachleute. Steuerschreiben (z. B. Finanzamt, Familienkasse) erklären wir nicht.'
          : 'DEASY работает на искусственном интеллекте (Claude от Anthropic). Результаты создаются автоматически, могут содержать ошибки и не заменяют консультацию специалиста. Налоговые письма (например, от Finanzamt или Familienkasse) мы не разбираем.'}
      </p>

      <div
        className={styles.uploadArea}
        onDragOver={handleDragOver}
        onDragLeave={() => {}}
        onDrop={handleDrop}
        onClick={() => (consent ? fileInputRef.current?.click() : setConsentHint(true))}
        style={consent ? undefined : { opacity: 0.6 }}
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
        accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.heif"
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          e.target.value = ''; // позволяет выбрать тот же файл повторно
          handleFileUpload(files);
        }}
        style={{ display: 'none' }}
      />

      <label
        style={{
          display: 'flex', gap: 10, alignItems: 'flex-start', marginTop: 4, padding: '12px 14px', borderRadius: 10,
          fontSize: 13, lineHeight: 1.5, color: '#3d4257', cursor: 'pointer',
          background: consentHint ? '#fef3f2' : '#f8f9fb', border: `1px solid ${consentHint ? '#fda29b' : '#e5e7eb'}`,
        }}
      >
        <input type="checkbox" checked={consent} onChange={(e) => updateConsent(e.target.checked)} style={{ marginTop: 3, width: 18, height: 18, flexShrink: 0 }} />
        <span>
          {selectedLanguage === 'de' ? (
            <>
              Ich willige ein, dass mein Dokument – einschließlich darin enthaltener sensibler Daten (z. B. Gesundheits- oder Sozialdaten) –
              zur Analyse an Anthropic PBC in den USA übermittelt wird. Ich habe die{' '}
              <a href="/datenschutz" target="_blank">Datenschutzerklärung</a> gelesen; Widerruf jederzeit möglich. Es gelten die{' '}
              <a href="/agb" target="_blank">AGB</a>.
            </>
          ) : (
            <>
              Я согласен(на), что мой документ — включая чувствительные данные в нём (например, о здоровье или пособиях) — будет передан
              для анализа компании Anthropic PBC в США. Я прочитал(а){' '}
              <a href="/datenschutz" target="_blank">Datenschutzerklärung</a>; согласие можно отозвать в любой момент. Действуют{' '}
              <a href="/agb" target="_blank">AGB</a>.
            </>
          )}
        </span>
      </label>
      {consentHint && (
        <div style={{ color: '#b42318', marginTop: 8, fontSize: 14 }}>
          {selectedLanguage === 'de' ? 'Bitte zuerst die Einwilligung bestätigen.' : 'Сначала подтвердите согласие.'}
        </div>
      )}

      {error && <div style={{ color: 'red', marginTop: '10px' }}>{error}</div>}
      {isLoading && <div style={{ marginTop: '10px', color: '#666' }}>{TEXTS.analyzing}</div>}
    </div>
  );

  const renderAnalysisView = () => (
    <div className={styles.analysisPanel}>
      <button onClick={() => setCurrentView('upload')} className={styles.backButton}>
        ← {selectedLanguage === 'ru' ? 'Новое письмо' : 'Neuer Brief'}
      </button>

      {uploadedImages.length > 0 && (
        <details className={styles.docPreview}>
          <summary>📄 {selectedLanguage === 'de' ? 'Dokument anzeigen' : 'Показать документ'}{uploadedImages.length > 1 ? ` (${uploadedImages.length})` : ''}</summary>
          {uploadedImages.map((img, i) => (
            <img key={i} src={`data:image/jpeg;base64,${img}`} alt={`Seite ${i + 1}`} />
          ))}
        </details>
      )}

      {analysis?.restricted === 'steuer' && (
        <>
          <SteuerHinweis language={selectedLanguage} absender={analysis.absender} />
          <BeratungHinweis language={selectedLanguage} />
        </>
      )}

      {analysis && !analysis.restricted && (
        <>
          <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f0f7ff', borderRadius: '8px' }}>
            <h3>{TEXTS.summary}</h3>
            <p style={{ fontSize: 12, color: '#6b7085', margin: '-4px 0 8px' }}>
              🤖 {selectedLanguage === 'de' ? 'KI-generiert · ohne Gewähr · keine Rechtsberatung' : 'Создано ИИ · без гарантий · не юридическая консультация'}
            </p>
            <p>{analysis.summary}</p>
          </div>

          <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '8px' }}>
            <h3>{TEXTS.risk}</h3>
            <p>
              {analysis.risk === 'Kritisch' ? '🔴' : analysis.risk === 'Mittel' ? '🟡' : '🟢'}{' '}
              {selectedLanguage === 'ru'
                ? { Kritisch: 'Критично', Mittel: 'Важно', Gering: 'Низкий' }[analysis.risk] || analysis.risk
                : analysis.risk}
            </p>
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

          <DocumentAssistant
            key={docKey}
            analysis={analysis}
            images={uploadedImages}
            language={selectedLanguage}
          />

          <BeratungHinweis language={selectedLanguage} />
        </>
      )}
    </div>
  );

  const currentTier = getCurrentTier();
  const remainingRequests = getRemainingRequests();

  return (
    <div className={styles.container}>
      <header className={styles.topBar}>
        <div className={styles.brand}>
          <a href="/" className={styles.logo}>DEASY</a>
          <span className={styles.usagePill}>
            {usageStats.usedThisMonth}/{currentTier.monthlyLimit === Infinity ? '∞' : currentTier.monthlyLimit} {selectedLanguage === 'ru' ? 'документов' : 'Dokumente'}
          </span>
        </div>
        <div className={styles.topActions}>
          <select
            aria-label={TEXTS.language}
            className={styles.langSelect}
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value as 'de' | 'ru')}
          >
            <option value="de">DE</option>
            <option value="ru">RU</option>
          </select>
          {usageStats.tier === 'free' && (
            <button onClick={() => setShowPricingModal(true)} className={styles.plusButton}>
              Plus
            </button>
          )}
        </div>
      </header>

      {activation !== 'idle' && (
        <div
          role="status"
          style={{
            maxWidth: 760, margin: '16px auto 0', padding: '12px 16px', borderRadius: 12, fontSize: 15,
            display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center',
            background: activation === 'failed' ? '#fef3f2' : activation === 'activated' ? '#ecfdf3' : '#f5f3ff',
            color: activation === 'failed' ? '#b42318' : activation === 'activated' ? '#067647' : '#3829a0',
            border: '1px solid currentColor',
          }}
        >
          <span>
            {activation === 'checking' && (selectedLanguage === 'de' ? '⏳ Zahlung wird geprüft…' : '⏳ Проверяем оплату…')}
            {activation === 'activated' && (selectedLanguage === 'de'
              ? `✅ Danke! Ihr Plan ${currentTier.name} ist aktiv.`
              : `✅ Спасибо! Тариф ${currentTier.name} активирован.`)}
            {activation === 'failed' && (selectedLanguage === 'de'
              ? `⚠️ Zahlung konnte nicht bestätigt werden (${activationError}). Schreiben Sie uns, wir helfen sofort.`
              : `⚠️ Не удалось подтвердить оплату (${activationError}). Напишите нам — поможем сразу.`)}
          </span>
          {activation !== 'checking' && (
            <button onClick={dismissActivation} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'inherit' }} aria-label="close">×</button>
          )}
        </div>
      )}

      <main className={styles.mainContent}>
        {currentView === 'upload' && renderUploadView()}
        {currentView === 'analysis' && renderAnalysisView()}
      </main>

      <LegalLinks compact />

      {showPricingModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h2>{selectedLanguage === 'de' ? 'Pläne & Preise' : 'Планы и цены'}</h2>
            <div className={styles.plans}>
              {allTiers.map((tier) => (
                <div key={tier.id} className={styles.planCard}>
                  <h3>{tier.name}</h3>
                  <p className={styles.price}>€{tier.price === 0 ? '0' : tier.price}</p>
                  <p>{tier.monthlyLimit} {selectedLanguage === 'de' ? 'Dokumente' : 'документов'}</p>
                  {tier.id === usageStats.tier ? (
                    <button className={styles.analyzeButton} disabled style={{ opacity: 0.6 }}>
                      {selectedLanguage === 'de' ? '✓ Aktueller Plan' : '✓ Текущий тариф'}
                    </button>
                  ) : tier.id === 'free' ? (
                    <button onClick={() => setShowPricingModal(false)} className={styles.analyzeButton}>
                      {TEXTS.close}
                    </button>
                  ) : tier.stripeLink ? (
                    <a
                      href={tier.stripeLink}
                      className={styles.analyzeButton}
                      style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}
                    >
                      {selectedLanguage === 'de' ? `${tier.name} buchen` : `Подключить ${tier.name}`}
                    </a>
                  ) : (
                    <button className={styles.analyzeButton} disabled style={{ opacity: 0.6 }}>
                      {selectedLanguage === 'de' ? 'Bald verfügbar' : 'Скоро'}
                    </button>
                  )}
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
