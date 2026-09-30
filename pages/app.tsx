'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { translations, Language } from '@/lib/translations';
import { useDocumentHistory } from '@/hooks/useDocumentHistory';
import { usePricingTiers } from '@/hooks/usePricingTiers';
import { usePdfUpload } from '@/hooks/usePdfUpload';
import { useReplyGenerator } from '@/hooks/useReplyGenerator';
import styles from '@/styles/app.module.css';

type ViewType = 'upload' | 'results' | 'history' | 'reply';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewType>('upload');
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('de');
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ role: string; content: string }>>([]);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [caseHistory, setCaseHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showReplyModal, setShowReplyModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { saveCaseToHistory, getCaseHistory } = useDocumentHistory();
  const { usageStats, getCurrentTier, getRemainingRequests, canMakeRequest, incrementUsage, allTiers } =
    usePricingTiers();
  const { isConverting, convertPdfToImages, convertFileToBase64 } = usePdfUpload();
  const { isGenerating, generatedReply, generateReplyLocal } = useReplyGenerator();

    const t = (key: keyof typeof translations.de): string => {
    const lang = selectedLanguage === 'ru' ? 'ru' : 'de';
    return (translations[lang] as any)[key] || translations.de[key];
  };

  // Load case history
  useEffect(() => {
    const history = getCaseHistory();
    setCaseHistory(history);
  }, [getCaseHistory]);

  // Load language preference
  useEffect(() => {
    const saved = localStorage.getItem('deasyLanguage');
    if (saved) {
      setSelectedLanguage(saved as Language);
    }
  }, []);

  // Save language preference
  useEffect(() => {
    localStorage.setItem('deasyLanguage', selectedLanguage);
  }, [selectedLanguage]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError('');

    // For PDFs, convert to images
    if (selectedFile.type === 'application/pdf') {
      setIsLoading(true);
      try {
        const images = await convertPdfToImages(selectedFile);
        if (images.base64Images && images.base64Images.length > 0) {
          setAnalysis({ ...analysis, images: images.base64Images });
          handleAnalyze(images.base64Images[0]);
        }
      } catch (err) {
        setError(t('uploadError'));
      } finally {
        setIsLoading(false);
      }
    } else {
      // For images, read directly
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        handleAnalyze(base64);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleAnalyze = async (imageData: string) => {
    if (!imageData) return;

    if (!canMakeRequest()) {
      setShowUpgradeModal(true);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: imageData,
          language: selectedLanguage,
        }),
      });

      const result = await response.json();
      if (response.ok) {
        setAnalysis(result);
        incrementUsage();
        setCurrentView('results');
        
        // Save to history
        saveCaseToHistory({
          id: Date.now().toString(),
          date: new Date().toISOString(),
          image: imageData,
          analysis: result,
          language: selectedLanguage,
        });
      } else {
        setError(result.error || t('technicalError'));
      }
    } catch (err) {
      setError(t('technicalError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleChat = async () => {
    if (!chatMessage.trim() || !analysis) return;

    const userMessage = chatMessage;
    setChatMessage('');
    setChatHistory(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          context: analysis,
          language: selectedLanguage,
          history: chatHistory,
        }),
      });

      const result = await response.json();
      if (response.ok) {
        setChatHistory(prev => [...prev, { role: 'assistant', content: result.response }]);
      } else {
        setError(result.error || t('chatError'));
      }
    } catch (err) {
      setError(t('chatError'));
    }
  };

  const handleGenerateReply = () => {
    if (!analysis) return;
    const reply = generateReplyLocal({
      summary: analysis.summary || '',
      risk: analysis.risk || 'Важно',
      language: selectedLanguage,
    });
    setShowReplyModal(true);
  };

  const handleUpgrade = () => {
    const tier = allTiers[1]; // Plus tier
    if (tier.stripeLink) {
      window.location.href = tier.stripeLink;
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1>{t('appTitle')}</h1>
          <div className={styles.headerActions}>
            <button 
              className={styles.langButton}
              onClick={() => setSelectedLanguage(selectedLanguage === 'de' ? 'ru' : 'de')}
            >
              {selectedLanguage === 'de' ? '🇷🇺 RU' : '🇩🇪 DE'}
            </button>
            <button 
              className={styles.upgradeButton}
              onClick={() => setShowUpgradeModal(true)}
            >
              ⬆️ {t('upgradeButton')}
            </button>
          </div>
        </div>
        <p className={styles.usageInfo}>
          {t('planFree')}: {getRemainingRequests()} {t('planFreeFeature1')}
        </p>
      </header>

      {/* Navigation */}
      <nav className={styles.nav}>
        <button 
          className={currentView === 'upload' ? styles.navActive : ''}
          onClick={() => setCurrentView('upload')}
        >
          📤 {t('uploadTitle')}
        </button>
        <button 
          className={currentView === 'history' ? styles.navActive : ''}
          onClick={() => setCurrentView('history')}
        >
          📋 {t('summary')}
        </button>
      </nav>

      {/* Main Content */}
      <main className={styles.main}>
        {error && <div className={styles.error}>{error}</div>}

        {/* Upload View */}
        {currentView === 'upload' && (
          <div className={styles.uploadSection}>
            <h2>{t('uploadTitle')}</h2>
            <p>{t('uploadSubtitle')}</p>
            <div 
              className={styles.dropzone}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const files = e.dataTransfer.files;
                if (files[0]) {
                  const input = fileInputRef.current;
                  if (input) {
                    input.files = files;
                    handleFileChange({ target: { files } } as any);
                  }
                }
              }}
            >
              <p>{t('uploadPlaceholder')}</p>
              <p className={styles.formatHint}>{t('supportedFormats')}</p>
              {file && <p>✅ {file.name}</p>}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            {isLoading && <p className={styles.loading}>{t('analyzing')}</p>}
          </div>
        )}

        {/* Results View */}
        {currentView === 'results' && analysis && (
          <div className={styles.resultsSection}>
            <h2>{t('summary')}</h2>
            <div className={styles.analysisCard}>
              <div className={styles.riskBadge}>
                {t('riskLevel')}: <strong>{analysis.risk}</strong>
              </div>
              <p>{analysis.summary}</p>
              
              {analysis.deadlines && analysis.deadlines.length > 0 && (
                <div className={styles.section}>
                  <h3>📅 {t('deadlines')}</h3>
                  <ul>
                    {analysis.deadlines.map((d: string, i: number) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                </div>
              )}

              {analysis.nextSteps && analysis.nextSteps.length > 0 && (
                <div className={styles.section}>
                  <h3>➡️ {t('nextSteps')}</h3>
                  <ul>
                    {analysis.nextSteps.map((s: string, i: number) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Buttons */}
              <div className={styles.actionButtons}>
                <button 
                  className={styles.actionBtn}
                  onClick={handleGenerateReply}
                  disabled={isGenerating}
                >
                  ✉️ {t('generateReply')}
                </button>
                <button 
                  className={styles.actionBtn}
                  onClick={() => setCurrentView('upload')}
                >
                  📤 {t('uploadTitle')}
                </button>
              </div>
            </div>

            {/* Chat */}
            <div className={styles.chatSection}>
              <h3>{t('chatPlaceholder')}</h3>
              <div className={styles.chatMessages}>
                {chatHistory.map((msg, i) => (
                  <div key={i} className={msg.role === 'user' ? styles.userMsg : styles.assistantMsg}>
                    {msg.content}
                  </div>
                ))}
              </div>
              <div className={styles.chatInput}>
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleChat()}
                  placeholder={t('chatPlaceholder')}
                />
                <button onClick={handleChat} disabled={!chatMessage.trim()}>
                  {t('send')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* History View */}
        {currentView === 'history' && (
          <div className={styles.historySection}>
            <h2>{t('summary')}</h2>
            {caseHistory.length === 0 ? (
              <p>{t('uploadError')}</p>
            ) : (
              <div className={styles.historyList}>
                {caseHistory.map((item: any) => (
                  <div key={item.id} className={styles.historyItem}>
                    <p className={styles.historyDate}>
                      {new Date(item.date).toLocaleDateString(selectedLanguage === 'de' ? 'de-DE' : 'ru-RU')}
                    </p>
                    <p className={styles.historySummary}>{item.analysis?.summary}</p>
                    <button
                      onClick={() => {
                        setAnalysis(item.analysis);
                        setCurrentView('results');
                      }}
                    >
                      {t('summary')}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <button 
              className={styles.closeBtn}
              onClick={() => setShowUpgradeModal(false)}
            >
              ✕
            </button>
            <h2>{t('upgradeTitle')}</h2>
            <p>{t('upgradeSubtitle')}</p>
            
            <div className={styles.pricingGrid}>
              {allTiers.map((tier: any) => (
                <div key={tier.name} className={styles.pricingCard}>
                  <h3>{tier.name}</h3>
                  <p className={styles.price}>{tier.price}</p>
                  <ul>
                    {tier.features.map((f: string, i: number) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                  {tier.stripeLink && (
                    <a href={tier.stripeLink} className={styles.upgradeBtn}>
                      {t('planPlusButton')}
                    </a>
                  )}
                </div>
              ))}
            </div>
            
            <button 
              className={styles.closeBtn}
              onClick={() => setShowUpgradeModal(false)}
            >
              {t('send')}
            </button>
          </div>
        </div>
      )}

      {/* Reply Modal */}
      {showReplyModal && generatedReply && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <button 
              className={styles.closeBtn}
              onClick={() => setShowReplyModal(false)}
            >
              ✕
            </button>
            <h2>{t('replyGeneratorTitle')}</h2>
            <div className={styles.replyBody}>
              <h4>{generatedReply.subject}</h4>
              <p>{generatedReply.body}</p>
              <p className={styles.signature}>{generatedReply.signature}</p>
            </div>
            <div className={styles.replyActions}>
              <button onClick={() => navigator.clipboard.writeText(generatedReply.body)}>
                {t('copyReply')}
              </button>
              <button onClick={() => setShowReplyModal(false)}>
                {t('send')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
