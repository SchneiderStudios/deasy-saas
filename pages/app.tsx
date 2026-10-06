import React, { useState, useEffect, useCallback, useRef } from 'react';
import { usePricingTiers } from '@/hooks/usePricingTiers';
import { usePdfUpload } from '@/hooks/usePdfUpload';
import { useDocumentHistory } from '@/hooks/useDocumentHistory';
import styles from '@/styles/App.module.css';
import DocumentAssistant from '@/components/DocumentAssistant';
import LegalLinks from '@/components/LegalLinks';
import { BeratungHinweis, SteuerHinweis } from '@/components/BeratungHinweis';
import { FristenKarte, EchtheitCheck, AnrufVorbereitung, FraudResult } from '@/components/LetterTools';
import type { FraudCheck } from '@/components/LetterTools';
import HistoryView from '@/components/HistoryView';
import type { SavedCase } from '@/hooks/useDocumentHistory';

interface AnalysisResult {
  summary: string;
  risk: 'Gering' | 'Mittel' | 'Kritisch';
  deadlines: string[];
  actions: string[];
  language: 'de' | 'ru';
  absender?: string;
  restricted?: 'steuer';
  aktenzeichen?: string;
  briefdatum?: string;
  telefon?: string;
  fristen?: { datum: string; was: string }[];
  unterlagen?: string[];
  echtheit?: 'unauffaellig' | 'pruefen';
  betrugsHinweise?: string[];
}

const TEXTS_DE = {
  title: 'DEASY – Deutsch-Bürokratie Assistent',
  subtitle: 'Verstehe deutsche Behördenschreiben in Sekunden',
  uploadTitle: 'Brief hochladen',
  uploadHint: 'Tippen, um zu fotografieren oder eine Datei zu wählen',
  uploadFormats: 'Formate: PDF, JPG, PNG, HEIC (max 10 MB)',
  uploadInfo: 'Fotografieren Sie den Brief oder laden Sie ein PDF hoch – DEASY erklärt, was drinsteht, welche Fristen gelten und wer hilft.',
  analyzeBtn: 'Dokument analysieren',
  analyzing: 'Analysieren...',
  analysis: 'Analyse',
  upgradeBtn: 'Auf Plus upgraden',
  plusPlan: '€4,99: 50 Dokumente/Monat',
  proPlan: '€9,99: 100 Dokumente/Monat',
  myDocuments: 'Meine Dokumente',
  language: 'Sprache',
  logout: 'Abmelden',
  summary: 'Zusammenfassung',
  risk: 'Was der Brief verlangt',
  deadlines: 'Fristen',
  actions: 'Empfohlene Aktionen',
  askQuestion: 'Frage stellen',
  generateReply: 'Antwort schreiben',
  close: 'Schließen',
  chat: 'Chat',
  typeMessage: 'Ihre Frage...',
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
  error: 'Fehler bei der Analyse. Bitte erneut versuchen.',
  loading: 'Lädt...',
};

const TEXTS_RU = {
  title: 'DEASY – Помощник по немецкой бюрократии',
  subtitle: 'Немецкие официальные письма — понятным языком',
  uploadTitle: 'Загрузить письмо',
  uploadHint: 'Нажмите, чтобы сфотографировать или выбрать файл',
  uploadFormats: 'Форматы: PDF, JPG, PNG, HEIC (макс 10 МБ)',
  uploadInfo: 'Сфотографируйте письмо или загрузите PDF — DEASY объяснит, что в нём написано, какие сроки и куда обратиться.',
  analyzeBtn: 'Анализировать документ',
  analyzing: 'Анализирование...',
  analysis: 'Анализ',
  upgradeBtn: 'Обновить на Plus',
  plusPlan: '€4,99: 50 документов/месяц',
  proPlan: '€9,99: 100 документов/месяц',
  myDocuments: 'Мои документы',
  language: 'Язык',
  logout: 'Выход',
  summary: 'Резюме',
  risk: 'Что требует письмо',
  deadlines: 'Сроки',
  actions: 'Рекомендуемые действия',
  askQuestion: 'Задать вопрос',
  generateReply: 'Написать ответ',
  close: 'Закрыть',
  chat: 'Чат',
  typeMessage: 'Ваш вопрос...',
  send: 'Отправить',
  noMessages: 'Задайте вопрос о письме',
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
  error: 'Ошибка при анализе. Попробуйте ещё раз.',
  loading: 'Загрузка...',
};


export default function App() {
  const { freeLeft, paidLeft, totalLeft, canMakeRequest, incrementUsage, packs, activation, activationError, activatedLetters, dismissActivation } = usePricingTiers();
  const { convertFileToImages, error: pdfError, clearError } = usePdfUpload();
  const { cases, saveCaseToHistory, deleteCaseFromHistory, toggleDone } = useDocumentHistory();

  const [selectedLanguage, setSelectedLanguage] = useState<'de' | 'ru'>('de');
  const TEXTS = selectedLanguage === 'ru' ? TEXTS_RU : TEXTS_DE;

  const [currentView, setCurrentView] = useState<'upload' | 'analysis' | 'history' | 'fraud'>('upload');
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
  // ---- Режимы: объяснить письмо / проверить на мошенничество ----
  const FRAUD_FREE_PER_MONTH = 5;
  const [verzicht, setVerzicht] = useState(false);
  // Согласие на начало услуги до конца срока отзыва (§ 356 Abs. 4, § 357a Abs. 2 BGB) — фиксируется в Stripe как client_reference_id
  const buyPack = (link: string) => {
    if (!verzicht) return;
    const sep = link.includes('?') ? '&' : '?';
    window.location.href = `${link}${sep}client_reference_id=verzicht_${Date.now()}`;
  };
  const [mode, setMode] = useState<'erklaeren' | 'betrug'>('erklaeren');
  const [fraudCheck, setFraudCheck] = useState<FraudCheck | null>(null);
  const [lastUpload, setLastUpload] = useState<{ images: string[]; fileName: string } | null>(null);
  const [fraudUsed, setFraudUsed] = useState(0);
  const fraudMonth = () => new Date().toISOString().slice(0, 7);

  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search);
      if (q.get('modus') === 'betrug') setMode('betrug');
      if (q.get('kaufen')) setShowPricingModal(true);
      const f = JSON.parse(localStorage.getItem('deasyFraud') || 'null');
      setFraudUsed(f && f.month === fraudMonth() ? f.count : 0);
    } catch {}
  }, []);

  const bumpFraud = () => {
    const next = fraudUsed + 1;
    setFraudUsed(next);
    try {
      localStorage.setItem('deasyFraud', JSON.stringify({ month: fraudMonth(), count: next }));
    } catch {}
  };

  const apiError = async (response: Response) => {
    const errorData = await response.json().catch(() => ({}));
    if (response.status === 413) {
      return new Error(selectedLanguage === 'de' ? 'Datei zu groß für die Analyse' : 'Файл слишком большой для анализа');
    }
    return new Error(errorData.error || `Analysis failed (${response.status})`);
  };

  /** Полный разбор письма (списывает 1 письмо, кроме налоговых). */
  const analyzeImages = async (images: string[], fileName: string) => {
    const response = await fetch('/api/analyze-document', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ images, language: selectedLanguage }),
    });
    if (!response.ok) throw await apiError(response);

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
      aktenzeichen: raw.aktenzeichen || '',
      briefdatum: raw.briefdatum || '',
      telefon: raw.telefon || '',
      fristen: Array.isArray(raw.fristen) ? raw.fristen : [],
      unterlagen: Array.isArray(raw.unterlagen) ? raw.unterlagen : [],
      echtheit: raw.echtheit === 'pruefen' ? 'pruefen' : 'unauffaellig',
      betrugsHinweise: Array.isArray(raw.betrugsHinweise) ? raw.betrugsHinweise : [],
    };

    setAnalysis(analysisData);
    setUploadedImages(images);
    setCurrentView('analysis');

    // Налоговые письма не разбираем (§ 2 StBerG): не сохраняем и не списываем лимит
    if (!analysisData.restricted) {
      saveCaseToHistory(analysisData, fileName);
      incrementUsage();
    }
    setDocKey((k) => k + 1); // новый документ → новый чат
  };

  /** Только проверка на мошенничество (бесплатно, FRAUD_FREE_PER_MONTH в месяц). */
  const checkFraud = async (images: string[]) => {
    const response = await fetch('/api/check-fraud', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ images, language: selectedLanguage }),
    });
    if (!response.ok) throw await apiError(response);
    const data = await response.json();
    setFraudCheck(data.check);
    setCurrentView('fraud');
    bumpFraud();
  };

  const handleFileUpload = async (files: File[]) => {
    if (files.length === 0) return;

    if (isLoading) return;
    if (!consent) {
      setConsentHint(true);
      return;
    }
    const file = files[0]; // Берем первый файл

    if (mode === 'erklaeren' && !canMakeRequest()) {
      setShowPricingModal(true);
      return;
    }
    if (mode === 'betrug' && fraudUsed >= FRAUD_FREE_PER_MONTH) {
      setError(
        selectedLanguage === 'de'
          ? `Sie haben diesen Monat alle ${FRAUD_FREE_PER_MONTH} kostenlosen Echtheits-Checks genutzt. Ein vollständiger Brief-Check enthält die Prüfung ebenfalls.`
          : `В этом месяце вы использовали все ${FRAUD_FREE_PER_MONTH} бесплатных проверок. Полный разбор письма тоже включает проверку на мошенничество.`
      );
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
      setLastUpload({ images: result.base64Images, fileName: result.fileName });

      if (mode === 'betrug') await checkFraud(result.base64Images);
      else await analyzeImages(result.base64Images, result.fileName);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : (selectedLanguage === 'de' ? 'Upload fehlgeschlagen' : 'Загрузка не удалась');
      setError(errorMessage);
      console.error('Upload error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  /** Из результата проверки — полный разбор того же письма без повторной загрузки. */
  const explainAfterFraud = async () => {
    if (!lastUpload) return;
    if (!canMakeRequest()) {
      setShowPricingModal(true);
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      await analyzeImages(lastUpload.images, lastUpload.fileName);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setCurrentView('upload');
    } finally {
      setIsLoading(false);
    }
  };

  // Открыть письмо из истории (без повторного анализа и без списания лимита)
  const openCase = (c: SavedCase) => {
    setAnalysis({
      summary: c.summary || '',
      risk: (c.risk as AnalysisResult['risk']) || 'Mittel',
      deadlines: c.deadlines || [],
      actions: c.actions || [],
      language: (c.language as 'de' | 'ru') || selectedLanguage,
      absender: c.absender,
      aktenzeichen: c.aktenzeichen,
      briefdatum: c.briefdatum,
      telefon: c.telefon,
      fristen: c.fristen || [],
      unterlagen: c.unterlagen || [],
      echtheit: c.echtheit === 'pruefen' ? 'pruefen' : 'unauffaellig',
      betrugsHinweise: c.betrugsHinweise || [],
    });
    setUploadedImages([]);
    setDocKey((k) => k + 1);
    setCurrentView('analysis');
    window.scrollTo({ top: 0 });
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
      <div className={styles.modeSwitch} role="tablist" aria-label={selectedLanguage === 'de' ? 'Was möchten Sie tun?' : 'Что сделать?'}>
        <button role="tab" aria-selected={mode === 'erklaeren'} className={mode === 'erklaeren' ? styles.modeActive : ''} onClick={() => { setMode('erklaeren'); setError(null); }}>
          <strong>📄 {selectedLanguage === 'de' ? 'Brief verstehen' : 'Понять письмо'}</strong>
          <span>{selectedLanguage === 'de' ? 'Übersetzung, Fristen, wohin' : 'Перевод, сроки, куда идти'}</span>
        </button>
        <button role="tab" aria-selected={mode === 'betrug'} className={mode === 'betrug' ? styles.modeActive : ''} onClick={() => { setMode('betrug'); setError(null); }}>
          <strong>🛡️ {selectedLanguage === 'de' ? 'Betrug prüfen' : 'Проверить на обман'}</strong>
          <span>{selectedLanguage === 'de' ? 'Brief, E-Mail oder SMS · kostenlos' : 'Письмо, e-mail или SMS · бесплатно'}</span>
        </button>
      </div>

      <h2>
        {mode === 'betrug'
          ? selectedLanguage === 'de' ? 'Ist das echt?' : 'Это настоящее письмо?'
          : TEXTS.uploadTitle}
      </h2>
      <p style={{ marginBottom: '20px', color: '#666', fontSize: '14px' }}>
        {mode === 'betrug'
          ? selectedLanguage === 'de'
            ? `Foto oder Screenshot hochladen – DEASY sucht nach typischen Betrugsmerkmalen. Noch ${Math.max(0, FRAUD_FREE_PER_MONTH - fraudUsed)} von ${FRAUD_FREE_PER_MONTH} kostenlosen Checks diesen Monat.`
            : `Загрузите фото или скриншот — DEASY поищет типичные признаки мошенничества. Осталось ${Math.max(0, FRAUD_FREE_PER_MONTH - fraudUsed)} из ${FRAUD_FREE_PER_MONTH} бесплатных проверок в этом месяце.`
          : TEXTS.uploadInfo}
      </p>

      <p style={{ margin: '0 0 16px', padding: '10px 12px', background: '#eef2ff', borderRadius: 10, fontSize: 13, color: '#1f3bb0' }}>
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
          <div style={{ height: 16 }} />
          <EchtheitCheck echtheit={analysis.echtheit} hinweise={analysis.betrugsHinweise} language={selectedLanguage} />
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
                ? {
                    Kritisch: 'В письме есть срок и названы последствия (штраф, взыскание, сокращение выплат или суд)',
                    Mittel: 'Письмо просит что-то сделать',
                    Gering: 'Письмо только информирует',
                  }[analysis.risk] || analysis.risk
                : {
                    Kritisch: 'Frist mit genannten Folgen (z. B. Mahnung, Kürzung, Vollstreckung oder Gericht)',
                    Mittel: 'Der Brief verlangt eine Handlung',
                    Gering: 'Der Brief informiert nur',
                  }[analysis.risk] || analysis.risk}
            </p>
            <p style={{ fontSize: 12.5, color: '#6b5a1f', margin: 0 }}>
              {selectedLanguage === 'ru'
                ? 'Это пересказ письма, а не правовая оценка вашей ситуации.'
                : 'Wiedergabe des Briefinhalts – keine rechtliche Bewertung Ihrer Situation.'}
            </p>
          </div>

          <FristenKarte
            fristen={analysis.fristen}
            deadlines={analysis.deadlines}
            absender={analysis.absender}
            aktenzeichen={analysis.aktenzeichen}
            language={selectedLanguage}
          />

          {analysis.actions.length > 0 && (
            <div style={{ marginBottom: '16px', padding: '14px 16px', backgroundColor: '#ede7f6', borderRadius: '12px' }}>
              <h3 style={{ margin: '0 0 8px' }}>{selectedLanguage === 'de' ? '👣 Nächste Schritte' : '👣 Что сделать'}</h3>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {analysis.actions.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          )}

          <EchtheitCheck echtheit={analysis.echtheit} hinweise={analysis.betrugsHinweise} language={selectedLanguage} />

          <AnrufVorbereitung
            absender={analysis.absender}
            aktenzeichen={analysis.aktenzeichen}
            briefdatum={analysis.briefdatum}
            telefon={analysis.telefon}
            unterlagen={analysis.unterlagen}
            verdacht={analysis.echtheit === 'pruefen'}
            language={selectedLanguage}
          />

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


  return (
    <div className={styles.container}>
      <header className={styles.topBar}>
        <div className={styles.brand}>
          <a href="/" className={styles.logo}>DEASY</a>
          <button
            className={styles.usagePill}
            onClick={() => setShowPricingModal(true)}
            style={{ border: 'none', cursor: 'pointer' }}
            title={selectedLanguage === 'de' ? 'Guthaben' : 'Баланс'}
          >
            {selectedLanguage === 'ru' ? `Осталось разборов: ${totalLeft}` : `Noch ${totalLeft} ${totalLeft === 1 ? 'Erklärung' : 'Erklärungen'}`}
          </button>
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
          <button
            onClick={() => setCurrentView('history')}
            className={styles.langSelect}
            style={{ cursor: 'pointer' }}
            aria-label={selectedLanguage === 'de' ? 'Meine Briefe' : 'Мои письма'}
            title={selectedLanguage === 'de' ? 'Meine Briefe' : 'Мои письма'}
          >
            📁{cases.length > 0 ? ` ${cases.length}` : ''}
          </button>
          <button onClick={() => setShowPricingModal(true)} className={styles.plusButton}>
            {selectedLanguage === 'de' ? 'Plus / Pro' : 'Plus / Pro'}
          </button>
        </div>
      </header>

      {activation !== 'idle' && (
        <div
          role="status"
          style={{
            maxWidth: 760, margin: '16px auto 0', padding: '12px 16px', borderRadius: 12, fontSize: 15,
            display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center',
            background: activation === 'failed' ? '#fef3f2' : activation === 'activated' ? '#ecfdf3' : '#eef2ff',
            color: activation === 'failed' ? '#b42318' : activation === 'activated' ? '#067647' : '#1f3bb0',
            border: '1px solid currentColor',
          }}
        >
          <span>
            {activation === 'checking' && (selectedLanguage === 'de' ? '⏳ Zahlung wird geprüft…' : '⏳ Проверяем оплату…')}
            {activation === 'activated' && (selectedLanguage === 'de'
              ? `✅ Danke! ${activatedLetters ? `${activatedLetters} Erklärungen wurden gutgeschrieben.` : 'Ihr Paket ist aktiv.'} Gültig 12 Monate.`
              : `✅ Спасибо! ${activatedLetters ? `Добавлено разборов: ${activatedLetters}.` : 'Пакет активирован.'} Действует 12 месяцев.`)}
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
        {currentView === 'fraud' && fraudCheck && (
          <div className={styles.analysisPanel}>
            <button onClick={() => setCurrentView('upload')} className={styles.backButton}>
              ← {selectedLanguage === 'ru' ? 'Проверить другое' : 'Weiteres prüfen'}
            </button>
            <FraudResult
              check={fraudCheck}
              language={selectedLanguage}
              onExplain={lastUpload ? explainAfterFraud : undefined}
              canExplain={!isLoading}
            />
            {isLoading && <p style={{ color: '#666' }}>{TEXTS.analyzing}</p>}
            {error && <p style={{ color: '#b42318' }}>{error}</p>}
          </div>
        )}
        {currentView === 'history' && (
          <HistoryView
            cases={cases}
            language={selectedLanguage}
            onOpen={openCase}
            onDelete={deleteCaseFromHistory}
            onToggleDone={toggleDone}
            onBack={() => setCurrentView(analysis ? 'analysis' : 'upload')}
          />
        )}
      </main>

      <LegalLinks compact />

      {showPricingModal && (
        <div className={styles.modal} role="dialog" aria-modal="true" onClick={() => setShowPricingModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginTop: 0 }}>{selectedLanguage === 'de' ? 'Pakete Plus und Pro' : 'Пакеты Plus и Pro'}</h2>
            {totalLeft === 0 && (
              <p style={{ margin: '0 0 10px', fontWeight: 600, color: '#1d2433' }}>
                {selectedLanguage === 'de'
                  ? 'Ihre kostenlosen Erklärungen für diesen Monat sind aufgebraucht.'
                  : 'Бесплатные разборы на этот месяц закончились.'}
              </p>
            )}
            <p style={{ marginTop: 0, color: '#4b4e5c' }}>
              {selectedLanguage === 'de'
                ? `Kein Abo. Sie zahlen einmal und nutzen die Erklärungen 12 Monate lang. Jeden Monat sind 2 Erklärungen kostenlos.`
                : `Без подписки. Платите один раз, разборы действуют 12 месяцев. Каждый месяц 2 разбора бесплатно.`}
            </p>
            <p style={{ margin: '0 0 12px', fontSize: 14 }}>
              {selectedLanguage === 'de'
                ? `Guthaben: ${freeLeft} kostenlose Erklärungen diesen Monat + ${paidLeft} aus Paketen`
                : `Баланс: ${freeLeft} бесплатных разборов в этом месяце + ${paidLeft} из пакетов`}
            </p>
            <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13.5, lineHeight: 1.45, margin: '0 0 14px', cursor: 'pointer' }}>
              <input type="checkbox" checked={verzicht} onChange={(e) => setVerzicht(e.target.checked)} style={{ marginTop: 3, width: 18, height: 18, flexShrink: 0 }} />
              <span>
                Ich verlange ausdrücklich, dass DEASY vor Ablauf der Widerrufsfrist mit der Leistung beginnt. Mir ist bekannt,
                dass ich bei einem Widerruf für bereits genutzte Erklärungen anteilig Wertersatz leiste und mein Widerrufsrecht
                erlischt, sobald alle Erklärungen des Pakets genutzt sind.
                {selectedLanguage !== 'de' && (
                  <span style={{ display: 'block', color: '#6b7085', marginTop: 4 }}>
                    Я прошу начать услугу сразу. Мне известно: при отказе от покупки за уже использованные разборы вычитается их стоимость, а когда использованы все разборы пакета, право на отказ пропадает.
                  </span>
                )}
              </span>
            </label>
            <div className={styles.plans}>
              {packs.map((p) => (
                <div key={p.id} className={styles.planCard}>
                  <h3 style={{ marginBottom: 2 }}>{p.name}</h3>
                  <p style={{ margin: '0 0 6px', fontSize: 14, color: '#4b4e5c' }}>{selectedLanguage === 'de' ? `${p.letters} Erklärungen` : `${p.letters} разборов`}</p>
                  <p className={styles.price}>{p.price.toFixed(2).replace('.', ',')} €</p>
                  <p style={{ fontSize: 13, color: '#6b7085' }}>
                    {(p.price / p.letters).toFixed(2).replace('.', ',')} € {selectedLanguage === 'de' ? 'pro Erklärung' : 'за разбор'}
                  </p>
                  {p.stripeLink ? (
                    <button
                      onClick={() => buyPack(p.stripeLink)}
                      disabled={!verzicht}
                      title={verzicht ? undefined : selectedLanguage === 'de' ? 'Bitte zuerst das Häkchen oben setzen' : 'Сначала поставьте галочку выше'}
                      className={styles.analyzeButton}
                      style={{ width: '100%', opacity: verzicht ? 1 : 0.5 }}
                    >
                      {selectedLanguage === 'de' ? `${p.name} – weiter zur Zahlung` : `${p.name} — перейти к оплате`}
                    </button>
                  ) : (
                    <button className={styles.analyzeButton} disabled style={{ opacity: 0.6 }}>
                      {selectedLanguage === 'de' ? 'Bald verfügbar' : 'Скоро'}
                    </button>
                  )}
                </div>
              ))}
            </div>
            <p style={{ fontSize: 12.5, color: '#6b7085' }}>
              {selectedLanguage === 'de'
                ? 'Endpreise, gem. § 19 UStG ohne Umsatzsteuer. Es gelten die AGB und die Widerrufsbelehrung.'
                : 'Окончательные цены, без НДС по § 19 UStG. Действуют AGB и Widerrufsbelehrung.'}
            </p>
            <button onClick={() => setShowPricingModal(false)} className={styles.analyzeButton}>
              {TEXTS.close}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
