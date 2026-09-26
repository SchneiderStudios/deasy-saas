import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from '@/styles/App.module.css';
import { translations, Language } from '@/lib/translations';

interface AnalysisResult {
  summary?: string;
  risk?: string;
  deadlines?: string[];
  nextSteps?: string[];
  error?: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface UsageStats {
  analysisUsed: number;
  analysisPaid: number;
  proMonthlyUntil: string | null;
}

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [language, setLanguage] = useState<Language>('de');
  const [usage, setUsage] = useState<UsageStats>({ analysisUsed: 0, analysisPaid: 0, proMonthlyUntil: null });
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const t = translations[language];

  useEffect(() => {
    const stored = localStorage.getItem('deasyUsage');
    if (stored) setUsage(JSON.parse(stored));
    const lang = (localStorage.getItem('deasyLanguage') as Language) || 'de';
    setLanguage(lang);
  }, []);

  const getAvailableAnalyses = () => {
    const isProMonthly = usage.proMonthlyUntil && new Date(usage.proMonthlyUntil) > new Date();
    if (isProMonthly) return 100;
    if (usage.analysisPaid > 0) return usage.analysisPaid;
    if (usage.analysisUsed < 2) return 2 - usage.analysisUsed;
    return 0;
  };

  const canAnalyze = usage.analysisUsed < 2 || usage.analysisPaid > 0 || (usage.proMonthlyUntil && new Date(usage.proMonthlyUntil) > new Date());

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (event) => {
      setImageData(event.target?.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleAnalyze = async () => {
    if (!imageData) return;
    if (!canAnalyze) {
      setShowUpgradeModal(true);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageData, fileName: file?.name }),
      });

      const data = await response.json();
      setAnalysis(data);
      setChatMessages([]);

      const newUsage = { ...usage, analysisUsed: usage.analysisUsed + 1 };
      if (usage.analysisPaid > 0 && usage.analysisUsed >= 2) {
        newUsage.analysisPaid = Math.max(0, usage.analysisPaid - 1);
      }
      setUsage(newUsage);
      localStorage.setItem('deasyUsage', JSON.stringify(newUsage));
    } catch (error) {
      setAnalysis({ error: t.technicalError });
    } finally {
      setLoading(false);
    }
  };

  const handleChatSend = async () => {
    if (!chatInput || !analysis) return;

    const newMessage: ChatMessage = { role: 'user', content: chatInput };
    setChatMessages([...chatMessages, newMessage]);
    setChatInput('');
    setChatLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: chatInput, context: analysis.summary }),
      });

      const data = await response.json();
      setChatMessages((prev) => [...prev, { role: 'assistant', content: data.response || data.error || 'Error' }]);
    } catch (error) {
      setChatMessages((prev) => [...prev, { role: 'assistant', content: 'Chat error' }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link href="/" className={styles.logo}>← DEASY</Link>
        <div className={styles.headerRight}>
          <span className={styles.plan}>{getAvailableAnalyses()} {t.freeDescription.toLowerCase()}</span>
          <button
            className={styles.upgradeButton}
            onClick={() => {
              const newLang = language === 'de' ? 'ru' : 'de';
              setLanguage(newLang);
              localStorage.setItem('deasyLanguage', newLang);
            }}
          >
            {language === 'de' ? '🇷🇺 РУ' : '🇩🇪 DE'}
          </button>
        </div>
      </header>

      <div className={styles.content}>
        {!analysis ? (
          <div className={styles.uploadSection}>
            <h1>{t.uploadTitle}</h1>
            <p>{t.uploadSubtitle}</p>
            <div
              className={styles.uploadArea}
              onClick={() => document.getElementById('fileInput')?.click()}
            >
              <div className={styles.uploadIcon}>📄</div>
              <p className={styles.uploadText}>{t.uploadPlaceholder}</p>
              <input id="fileInput" type="file" accept="image/*" onChange={handleFileChange} hidden />
            </div>

            {file && (
              <div className={styles.filePreview}>
                <p>📎 {file.name}</p>
                <button
                  className={styles.analyzeButton}
                  onClick={handleAnalyze}
                  disabled={loading || !canAnalyze}
                >
                  {loading ? `⏳ ${t.analyzing}` : `▶ ${t.analyzeButton}`}
                </button>
              </div>
            )}

            {usage.analysisUsed >= 2 && !canAnalyze && (
              <button onClick={() => setShowUpgradeModal(true)} className={styles.upgradePrompt}>
                📤 {t.analysisLimitReached}
              </button>
            )}

            <div className={styles.securityNote}>
              🔒 {language === 'de'
                ? 'Dein Dokument ist verschlüsselt und wird nach der Analyse nicht gespeichert.'
                : 'Ваш документ зашифрован и не сохраняется после анализа.'}
            </div>
          </div>
        ) : (
          <div className={styles.analysisLayout}>
            <div className={styles.analysisPanel}>
              {analysis.error ? (
                <div className={styles.errorBox}>
                  <p>❌ {analysis.error}</p>
                  <button
                    className={styles.resetButton}
                    onClick={() => {
                      setAnalysis(null);
                      setFile(null);
                      setImageData(null);
                    }}
                  >
                    ← {language === 'de' ? 'Neues Dokument' : 'Новый документ'}
                  </button>
                </div>
              ) : (
                <>
                  <div className={`${styles.riskBadge} ${styles[`risk${analysis.risk}`]}`}>
                    {analysis.risk === 'Kritisch' && '🔴'}
                    {analysis.risk === 'Wichtig' && '🟡'}
                    {analysis.risk === 'Niedrig' && '🟢'}
                    {analysis.risk}
                  </div>

                  <div className={styles.analysisContent}>
                    <h2>{language === 'de' ? 'Zusammenfassung' : 'Резюме'}</h2>
                    <p>{analysis.summary}</p>

                    {analysis.deadlines && analysis.deadlines.length > 0 && (
                      <>
                        <h3>⏰ {language === 'de' ? 'Fristen' : 'Сроки'}</h3>
                        <ul>
                          {analysis.deadlines.map((deadline, i) => (
                            <li key={i}>{deadline}</li>
                          ))}
                        </ul>
                      </>
                    )}

                    {analysis.nextSteps && analysis.nextSteps.length > 0 && (
                      <>
                        <h3>👣 {language === 'de' ? 'Nächste Schritte' : 'Следующие шаги'}</h3>
                        <ul>
                          {analysis.nextSteps.map((step, i) => (
                            <li key={i}>{step}</li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>

                  <button
                    className={styles.resetButton}
                    onClick={() => {
                      setAnalysis(null);
                      setFile(null);
                      setImageData(null);
                    }}
                  >
                    ← {language === 'de' ? 'Neues Dokument' : 'Новый документ'}
                  </button>
                </>
              )}
            </div>

            {!analysis.error && (
              <div className={styles.chatPanel}>
                <h2>💬 {language === 'de' ? 'Fragen zum Brief?' : 'Вопросы к письму?'}</h2>
                <div className={styles.chatMessages}>
                  {chatMessages.length === 0 && (
                    <p className={styles.chatPlaceholder}>{t.chatPlaceholder}</p>
                  )}
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`${styles.chatMessage} ${styles[msg.role]}`}>
                      <p>{msg.content}</p>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className={`${styles.chatMessage} ${styles.assistant}`}>
                      <p className={styles.typing}>⏳ {language === 'de' ? 'Antwortet...' : 'Отвечает...'}</p>
                    </div>
                  )}
                </div>

                <div className={styles.chatInput}>
                  <input
                    type="text"
                    placeholder={t.chatPlaceholder}
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') handleChatSend();
                    }}
                    disabled={chatLoading}
                  />
                  <button onClick={handleChatSend} disabled={!chatInput || chatLoading}>
                    📤
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {showUpgradeModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h2>{t.upgradeTitle}</h2>
            <p>{t.upgradeSubtitle}</p>

            <div className={styles.plans}>
              <div className={styles.planCard}>
                <h3>$2.99</h3>
                <p>{t.proDescription}</p>
                <a
                  href="https://buy.stripe.com/REPLACE_WITH_YOUR_ONCE_LINK"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.planButton}
                >
                  {t.upgradeButton}
                </a>
              </div>

              <div className={styles.planCard}>
                <h3>$9.99</h3>
                <p>{t.proMonthlyDescription}</p>
                <a
                  href="https://buy.stripe.com/REPLACE_WITH_YOUR_MONTHLY_LINK"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.planButton}
                >
                  {t.upgradeButton}
                </a>
              </div>

              <div className={styles.planCard}>
                <h3>$49.99</h3>
                <p>{t.businessDescription}</p>
                <a
                  href="https://buy.stripe.com/REPLACE_WITH_YOUR_UNLIMITED_LINK"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.planButton}
                >
                  {t.upgradeButton}
                </a>
              </div>
            </div>

            <button onClick={() => setShowUpgradeModal(false)} className={styles.closeModal}>
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
