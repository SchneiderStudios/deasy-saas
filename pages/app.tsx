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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { saveCaseToHistory, getCaseHistory } = useDocumentHistory();
  const { usageStats, getCurrentTier, getRemainingRequests, canMakeRequest, incrementUsage, allTiers } =
    usePricingTiers();
  const { isConverting, convertPdfToImages, convertFileToBase64 } = usePdfUpload();
  const { isGenerating, generatedReply, generateReplyLocal } = useReplyGenerator();

  const t = (key: keyof typeof translations.de): string => {
    return translations[selectedLanguage][key as keyof typeof translations[selectedLanguage]] ||
      translations.de[key];
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
  const handleLanguageChange = (lang: Language) => {
    setSelectedLanguage(lang);
    localStorage.setItem('deasyLanguage', lang);
  };

  const handleFileSelect = async (selectedFile: File) => {
    setError('');
    setFile(selectedFile);
    setUploadProgress(0);

    if (selectedFile.type === 'application/pdf') {
      // Handle PDF
      if (!usageStats.tier.includes('plus') && usageStats.tier !== 'pro' && usageStats.tier !== 'business') {
        setShowUpgradeModal(true);
        setError(t('analysisLimitReached'));
        return;
      }
    } else if (!selectedFile.type.startsWith('image/')) {
      setError(t('formatNotSupported'));
      return;
    }

    if (!canMakeRequest()) {
      setShowUpgradeModal(true);
      setError(t('analysisLimitReached'));
      return;
    }

    await analyzeDocument(selectedFile);
  };

  const analyzeDocument = async (documentFile: File) => {
    try {
      setIsLoading(true);
      let base64Data: string | string[];

      if (documentFile.type === 'application/pdf') {
        // Convert PDF to images
        const result = await convertPdfToImages(documentFile);
        base64Data = result.base64Images;
      } else {
        // Handle regular image
        base64Data = await convertFileToBase64(documentFile);
      }

      const payload = {
        image: Array.isArray(base64Data) ? base64Data[0] : base64Data, // Use first page for analysis
        language: selectedLanguage,
      };

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(t('technicalError'));
      }

      const data = await response.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      setAnalysis(data);
      setChatHistory([]);
      setCurrentView('results');
      incrementUsage();

      // Save to history
      if (!documentFile.name.includes('.pdf') || usageStats.tier.includes('plus')) {
        saveCaseToHistory(data, documentFile.name);
        const updated = getCaseHistory();
        setCaseHistory(updated);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('technicalError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      handleFileSelect(droppedFiles[0]);
    }
  };

  const handleSendChat = async () => {
    if (!chatMessage.trim() || !analysis) return;

    const newMessage = { role: 'user', content: chatMessage };
    setChatHistory([...chatHistory, newMessage]);
    setChatMessage('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: chatMessage,
          analysis,
          language: selectedLanguage,
          chatHistory,
        }),
      });

      if (!response.ok) throw new Error(t('chatError'));

      const data = await response.json();
      setChatHistory((prev) => [...prev, { role: 'assistant', content: data.message }]);
    } catch (err) {
      setError(t('chatError'));
    }
  };

  const handleGenerateReply = () => {
    if (!analysis) return;

    try {
      const reply = generateReplyLocal({
        summary: analysis.summary || '',
        risk: analysis.risk || '',
        deadlines: analysis.deadlines,
        nextSteps: analysis.nextSteps,
        language: selectedLanguage,
      });
      setCurrentView('reply');
    } catch (err) {
      setError('Failed to generate reply');
    }
  };

  const handleCopyReply = async () => {
    if (!generatedReply) return;
    const text = `Subject: ${generatedReply.subject}\n\n${generatedReply.body}\n\n${generatedReply.signature}`;
    const success = await navigator.clipboard.writeText(text);
    if (success) {
      alert(t('copyReply'));
    }
  };

  const renderUploadView = () => (
    <div className={styles.uploadContainer}>
      <h2>{t('uploadTitle')}</h2>
      <p>{t('uploadSubtitle')}</p>

      <div
        className={styles.dropZone}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <p>{t('uploadPlaceholder')}</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,image/heic,image/heif"
          onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
          style={{ display: 'none' }}
        />
      </div>

      <p className={styles.supportedFormats}>
        {t('supportedFormats')} + {t('pdfFormatSupported')} ({t('pdfMaxSize')})
      </p>

      {error && <div className={styles.errorMessage}>{error}</div>}

      {isLoading && (
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>{t('analyzing')}</p>
        </div>
      )}
    </div>
  );

  const renderResultsView = () => (
    <div className={styles.resultsContainer}>
      <button onClick={() => setCurrentView('upload')} className={styles.backButton}>
        ← {t('uploadTitle')}
      </button>

      {analysis && (
        <>
          <h2>{t('summary')}</h2>
          <p>{analysis.summary}</p>

          <div className={styles.riskLevel}>
            <span className={styles[`risk-${analysis.risk?.toLowerCase()}`]}>
              {t('riskLevel')}: {analysis.risk}
            </span>
          </div>

          {analysis.deadlines && analysis.deadlines.length > 0 && (
            <div>
              <h3>{t('deadlines')}</h3>
              <ul>
                {analysis.deadlines.map((deadline: string, idx: number) => (
                  <li key={idx}>{deadline}</li>
                ))}
              </ul>
            </div>
          )}

          {analysis.nextSteps && analysis.nextSteps.length > 0 && (
            <div>
              <h3>{t('nextSteps')}</h3>
              <ul>
                {analysis.nextSteps.map((step: string, idx: number) => (
                  <li key={idx}>{step}</li>
                ))}
              </ul>
            </div>
          )}

          <div className={styles.actionButtonsContainer}>
            <h3>{t('actionSuggestions')}</h3>
            <div className={styles.actionButtons}>
              <button onClick={handleGenerateReply} className={styles.actionButton}>
                ✉️ {t('actionReply')}
              </button>
              <button className={styles.actionButton}>
                ⚖️ {t('actionObjection')}
              </button>
              <button className={styles.actionButton}>
                📋 {t('actionTemplate')}
              </button>
            </div>
          </div>

          <div className={styles.chatContainer}>
            <h3>{t('chatPlaceholder')}</h3>
            <div className={styles.chatMessages}>
              {chatHistory.map((msg, idx) => (
                <div
                  key={idx}
                  className={`${styles.chatMessage} ${msg.role === 'assistant' ? styles.assistant : ''}`}
                >
                  {msg.content}
                </div>
              ))}
            </div>

            <div className={styles.chatInputContainer}>
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendChat()}
                placeholder={t('chatPlaceholder')}
              />
              <button onClick={handleSendChat}>{t('send')}</button>
            </div>
          </div>
        </>
      )}
    </div>
  );

  const renderReplyView = () => (
    <div className={styles.replyContainer}>
      <button onClick={() => setCurrentView('results')} className={styles.backButton}>
        ← Back
      </button>

      {generatedReply ? (
        <>
          <h2>{t('replyGeneratorTitle')}</h2>
          <div className={styles.replyContent}>
            <div>
              <strong>Subject:</strong>
              <p>{generatedReply.subject}</p>
            </div>

            <div>
              <strong>Body:</strong>
              <pre className={styles.replyBody}>{generatedReply.body}</pre>
            </div>

            <div className={styles.replyActions}>
              <button onClick={handleCopyReply} className={styles.primaryButton}>
                {t('copyReply')}
              </button>
            </div>

            {generatedReply.tips && generatedReply.tips.length > 0 && (
              <div className={styles.tipsContainer}>
                <h4>Tips:</h4>
                <ul>
                  {generatedReply.tips.map((tip, idx) => (
                    <li key={idx}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>{t('generatingReply')}</p>
        </div>
      )}
    </div>
  );

  const renderHistoryView = () => (
    <div className={styles.historyContainer}>
      <h2>My Cases</h2>
      {caseHistory.length === 0 ? (
        <p>No cases yet</p>
      ) : (
        <div className={styles.historyList}>
          {caseHistory.map((caseItem) => (
            <div key={caseItem.id} className={styles.historyItem}>
              <div>
                <strong>{caseItem.fileName}</strong>
                <p>{caseItem.date}</p>
                <p>{caseItem.summary?.substring(0, 100)}...</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>DEASY</h1>
        <div className={styles.headerControls}>
          <div className={styles.languageSelector}>
            <button
              onClick={() => handleLanguageChange('de')}
              className={selectedLanguage === 'de' ? styles.active : ''}
            >
              🇩🇪 DE
            </button>
            <button
              onClick={() => handleLanguageChange('ru')}
              className={selectedLanguage === 'ru' ? styles.active : ''}
            >
              🇷🇺 RU
            </button>
          </div>

          <button
            onClick={() => setShowHistory(!showHistory)}
            className={styles.historyButton}
            title="My Cases"
          >
            📁 ({caseHistory.length})
          </button>

          <div className={styles.usageInfo}>
            <span>{getRemainingRequests()} remaining</span>
            <button onClick={() => setShowUpgradeModal(true)} className={styles.upgradeButton}>
              {t('upgradeButton')}
            </button>
          </div>
        </div>
      </header>

      {showHistory ? renderHistoryView() : null}

      {currentView === 'upload' && renderUploadView()}
      {currentView === 'results' && renderResultsView()}
      {currentView === 'reply' && renderReplyView()}

      {showUpgradeModal && (
        <div className={styles.modalOverlay} onClick={() => setShowUpgradeModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>{t('upgradeTitle')}</h2>
            <p>{t('upgradeSubtitle')}</p>

            <div className={styles.pricingGrid}>
              {allTiers.map((tier) => (
                <div key={tier.id} className={styles.pricingCard}>
                  <h3>{tier.name}</h3>
                  <p className={styles.price}>
                    €{tier.price}
                    <span>{t('planFreePeriod')}</span>
                  </p>
                  <ul>
                    {tier.features.map((feature, idx) => (
                      <li key={idx}>{feature}</li>
                    ))}
                  </ul>
                  {tier.stripeLink && (
                    <a href={tier.stripeLink} className={styles.buyButton}>
                      {t('upgradeButton')}
                    </a>
                  )}
                </div>
              ))}
            </div>

            <button onClick={() => setShowUpgradeModal(false)} className={styles.closeButton}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
