'use client';

import React, { useState, useEffect, useCallback } from 'react';
import styles from '@/styles/App.module.css';
import { translations } from '@/lib/translations';
import { usePricingTiers } from '@/hooks/usePricingTiers';
import { usePdfUpload } from '@/hooks/usePdfUpload';
import { useReplyGenerator } from '@/hooks/useReplyGenerator';
import { useDocumentHistory } from '@/hooks/useDocumentHistory';

interface AnalysisResult {
  summary: string;
  riskLevel: string;
  keyPoints: string[];
}

type ViewType = 'upload' | 'results' | 'history' | 'reply';

export default function App() {
  const [selectedLanguage, setSelectedLanguage] = useState<'de' | 'ru'>('de');
  const [currentView, setCurrentView] = useState<ViewType>('upload');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showReplyModal, setShowReplyModal] = useState(false);

  const { usageStats, canMakeRequest, incrementUsage, allTiers } = usePricingTiers();
  const { convertPdfToImages } = usePdfUpload();
  const { generateReply } = useReplyGenerator();
  const { cases: caseHistory, saveCaseToHistory } = useDocumentHistory();

  const t = useCallback(
    (key: string): string => {
      const lang = selectedLanguage === 'ru' ? 'ru' : 'de';
      return (translations[lang] as any)[key] || (translations.de as any)[key] || key;
    },
    [selectedLanguage]
  );

  // Detect language on mount
  useEffect(() => {
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.includes('ru')) {
      setSelectedLanguage('ru');
    }
  }, []);

  const handleFileUpload = async (file: File) => {
    if (!canMakeRequest()) {
      setShowPricingModal(true);
      return;
    }

    setIsLoading(true);
    setFileName(file.name);

    try {
      let imagesToAnalyze: string[] = [];

      if (file.type === 'application/pdf') {
        const result = await convertPdfToImages(file);
        imagesToAnalyze = result.base64Images;
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            imagesToAnalyze = [e.target.result as string];
          }
        };
        reader.readAsDataURL(file);
      }

      if (imagesToAnalyze.length === 0) return;

      setSelectedImage(imagesToAnalyze[0]);

      // Call analyze API
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: imagesToAnalyze[0],
          language: selectedLanguage,
        }),
      });

      const result = await response.json();
      setAnalysisResult(result);
      incrementUsage();
      saveCaseToHistory(result, file.name);
      setCurrentView('results');
    } catch (error) {
      console.error('Analysis error:', error);
      alert('Error processing file');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  // Render Upload View
  const renderUploadView = () => (
    <div className={styles.uploadSection}>
      <div
        className={styles.uploadArea}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <div className={styles.uploadIcon}>📄</div>
        <p className={styles.uploadText}>{t('uploadTitle')}</p>
        <p className={styles.uploadSubtext}>{t('uploadSubtext')}</p>
        <input
          type="file"
          id="fileInput"
          style={{ display: 'none' }}
          onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])}
          accept=".pdf,image/*"
        />
        <button
          className={styles.analyzeButton}
          onClick={() => document.getElementById('fileInput')?.click()}
          disabled={isLoading}
        >
          {isLoading ? t('processing') : t('uploadButton')}
        </button>
      </div>
    </div>
  );

  // Render Results View
  const renderResultsView = () => (
    <div className={styles.analysisPanel}>
      <div className={styles.analysisLayout}>
        <div>
          {selectedImage && (
            <img
              src={selectedImage}
              alt="Analyzed document"
              style={{ maxWidth: '100%', borderRadius: '8px', marginBottom: '16px' }}
            />
          )}
        </div>
        <div className={styles.chatPanel}>
          <div className={styles.chatMessages}>
            {analysisResult && (
              <div className={styles.chatMessage}>
                <p><strong>{t('summary')}</strong></p>
                <p>{analysisResult.summary}</p>
                <p><strong>{t('riskLevel')}</strong> {analysisResult.riskLevel}</p>
                <p><strong>{t('keyPoints')}</strong></p>
                <ul>
                  {analysisResult.keyPoints?.map((point, i) => (
                    <li key={i}>{point}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div style={{ marginTop: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              className={styles.analyzeButton}
              onClick={() => setShowReplyModal(true)}
            >
              ✉️ {t('generateReply')}
            </button>
            <button
              className={styles.analyzeButton}
              onClick={() => setCurrentView('upload')}
              style={{ background: '#666' }}
            >
              ↑ {t('uploadNew')}
            </button>
            <button
              className={styles.analyzeButton}
              onClick={() => setCurrentView('history')}
              style={{ background: '#666' }}
            >
              📋 {t('history')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Render History View
  const renderHistoryView = () => (
    <div className={styles.chatPanel}>
      <h3>{t('caseHistory')}</h3>
      <div className={styles.chatMessages}>
        {caseHistory.length === 0 ? (
          <p>{t('noCases')}</p>
        ) : (
          caseHistory.map((case_, idx) => (
            <div key={idx} className={styles.chatMessage} style={{ marginBottom: '12px' }}>
              <p><strong>{case_.fileName}</strong></p>
              <p>{new Date(case_.date).toLocaleDateString()}</p>
              <p>{case_.analysis?.summary}</p>
            </div>
          ))
        )}
      </div>
      <button
        className={styles.analyzeButton}
        onClick={() => setCurrentView('upload')}
        style={{ marginTop: '16px' }}
      >
        ↑ {t('uploadNew')}
      </button>
    </div>
  );

  // Render Reply Modal
  const renderReplyModal = () => {
    if (!showReplyModal || !analysisResult) return null;

    const reply = generateReply({
      summary: analysisResult.summary,
      risk: analysisResult.riskLevel,
      language: selectedLanguage,
    });

    return (
      <div className={styles.modal}>
        <div className={styles.modalContent}>
          <button
            onClick={() => setShowReplyModal(false)}
            style={{ float: 'right', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}
          >
            ✕
          </button>
          <h2>{t('replyGenerator')}</h2>
          <div style={{ marginBottom: '16px', padding: '12px', background: '#f5f5f5', borderRadius: '8px' }}>
            <p><strong>{t('subject')}:</strong> {reply.subject}</p>
            <p style={{ marginTop: '12px', whiteSpace: 'pre-wrap' }}>{reply.body}</p>
            {reply.tips && (
              <div style={{ marginTop: '12px', padding: '8px', background: '#e3f2fd', borderRadius: '4px' }}>
                <p><strong>{t('tips')}:</strong></p>
                <p>{reply.tips}</p>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className={styles.analyzeButton} onClick={() => navigator.clipboard.writeText(reply.body)}>
              📋 {t('copy')}
            </button>
            <button className={styles.analyzeButton} style={{ background: '#666' }} onClick={() => setShowReplyModal(false)}>
              {t('close')}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render Pricing Modal
  const renderPricingModal = () => {
    if (!showPricingModal) return null;

       const tiers = allTiers;

    return (
      <div className={styles.modal}>
        <div className={styles.modalContent}>
          <button
            onClick={() => setShowPricingModal(false)}
            style={{ float: 'right', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}
          >
            ✕
          </button>
          <h2>{t('upgradePlan')}</h2>
          <div className={styles.plans}>
            {tiers.map((tier) => (
              <div key={tier.id} className={styles.planCard}>
                <h3>{t(tier.labelKey)}</h3>
                <p className={styles.price}>{tier.price}</p>
                <p>{tier.requests} {t('requestsPerMonth')}</p>
                <ul>
                  {tier.features.map((feature, i) => (
                    <li key={i}>✓ {feature}</li>
                  ))}
                </ul>
                <button
                  className={styles.analyzeButton}
                  onClick={() => {
                    if (tier.stripeLink) {
                      window.open(tier.stripeLink, '_blank');
                    } else {
                      alert(t('free'));
                    }
                  }}
                >
                  {t('select')}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.app}>
      {/* Header */}
      <div style={{ padding: '16px', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>{t('appTitle')}</h1>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span>{usageStats.usedThisMonth}/{usageStats.tier === 'free' ? 3 : usageStats.tier === 'plus' ? 50 : 100}</span>
          <button
            style={{ padding: '6px 12px', background: '#1976d2', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            onClick={() => setShowPricingModal(true)}
          >
            {t('upgrade')}
          </button>
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value as 'de' | 'ru')}
            style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #ccc', cursor: 'pointer' }}
          >
            <option value="de">🇩🇪 DE</option>
            <option value="ru">🇷🇺 RU</option>
          </select>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ padding: '24px', flex: 1 }}>
        {currentView === 'upload' && renderUploadView()}
        {currentView === 'results' && renderResultsView()}
        {currentView === 'history' && renderHistoryView()}
      </div>

      {/* Modals */}
      {renderPricingModal()}
      {renderReplyModal()}
    </div>
  );
}
