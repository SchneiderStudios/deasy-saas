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

type ViewType = 'upload' | 'results' | 'history';

const TIER_LIMITS: { [key: string]: number } = {
  free: 3,
  plus: 50,
  pro: 100,
  business: 999,
};

const TIER_PRICES: { [key: string]: string } = {
  free: '€0',
  plus: '€4,99',
  pro: '€9,99',
  business: '€49,99',
};

export default function App() {
  const [selectedLanguage, setSelectedLanguage] = useState<'de' | 'ru'>('de');
  const [currentView, setCurrentView] = useState<ViewType>('upload');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [generatedReply, setGeneratedReply] = useState<any>(null);
  const [replyLoading, setReplyLoading] = useState(false);

  const { usageStats, canMakeRequest, incrementUsage, allTiers } = usePricingTiers();
  const { convertPdfToImages } = usePdfUpload();
  const { generateReply } = useReplyGenerator();
  const { saveCaseToHistory, getCaseHistory } = useDocumentHistory();
  const caseHistory = getCaseHistory();

  const t = useCallback(
    (key: string): string => {
      const lang = selectedLanguage === 'ru' ? 'ru' : 'de';
      return (translations[lang] as any)[key] || (translations.de as any)[key] || key;
    },
    [selectedLanguage]
  );

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
      } else if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        await new Promise((resolve) => {
          reader.onload = (e) => {
            if (e.target?.result) {
              imagesToAnalyze = [e.target.result as string];
            }
            resolve(null);
          };
          reader.readAsDataURL(file);
        });
      }

      if (imagesToAnalyze.length === 0) {
        alert(t('invalidFile'));
        setIsLoading(false);
        return;
      }

      setSelectedImage(imagesToAnalyze[0]);

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
      alert(t('error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateReply = async () => {
    if (!analysisResult) return;

    setReplyLoading(true);
    try {
      const reply = await generateReply({
        summary: analysisResult.summary,
        risk: analysisResult.riskLevel,
        language: selectedLanguage,
      });
      setGeneratedReply(reply);
      setShowReplyModal(true);
    } catch (error) {
      console.error('Reply generation error:', error);
      alert(t('error'));
    } finally {
      setReplyLoading(false);
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

  // Upload View
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
          accept=".pdf,.jpg,.jpeg,.png,.gif"
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

  // Results View
  const renderResultsView = () => (
    <div className={styles.analysisPanel}>
      <div className={styles.analysisLayout}>
        <div>
          {selectedImage && (
            <img
              src={selectedImage}
              alt="Analyzed document"
              style={{ maxWidth: '100%', borderRadius: '8px', marginBottom: '16px', border: '1px solid #e0e0e0' }}
            />
          )}
        </div>
        <div className={styles.chatPanel}>
          <div className={styles.chatMessages}>
            {analysisResult && (
              <div className={styles.chatMessage}>
                <h3 style={{ marginTop: 0 }}>{t('analysis')}</h3>
                <p>
                  <strong>{t('summary')}:</strong>
                </p>
                <p style={{ fontSize: '14px', lineHeight: '1.6' }}>{analysisResult.summary}</p>
                
                <p style={{ marginTop: '16px' }}>
                  <strong>{t('riskLevel')}:</strong>
                  <span style={{ marginLeft: '8px', padding: '2px 8px', borderRadius: '4px', background: '#f5f5f5', fontSize: '12px' }}>
                    {analysisResult.riskLevel}
                  </span>
                </p>

                {analysisResult.keyPoints && analysisResult.keyPoints.length > 0 && (
                  <div style={{ marginTop: '16px' }}>
                    <p><strong>{t('keyPoints')}:</strong></p>
                    <ul style={{ margin: '8px 0', paddingLeft: '20px', fontSize: '14px' }}>
                      {analysisResult.keyPoints.map((point, i) => (
                        <li key={i}>{point}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
          <div style={{ marginTop: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              className={styles.analyzeButton}
              onClick={handleGenerateReply}
              disabled={replyLoading}
            >
              ✉️ {replyLoading ? t('processing') : t('generateReply')}
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

  // History View
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
              <p style={{ fontSize: '12px', color: '#666' }}>{new Date(case_.date).toLocaleDateString()}</p>
            </div>
          ))
        )}
      </div>
      <button
        className={styles.analyzeButton}
        onClick={() => setCurrentView('upload')}
        style={{ marginTop: '16px', width: '100%' }}
      >
        ↑ {t('uploadNew')}
      </button>
    </div>
  );

  // Reply Modal
  const renderReplyModal = () => {
    if (!showReplyModal || !generatedReply) return null;

    return (
      <div className={styles.modal}>
        <div className={styles.modalContent}>
          <button
            onClick={() => setShowReplyModal(false)}
            style={{ float: 'right', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', padding: 0 }}
          >
            ✕
          </button>
          <h2>{t('replyGenerator')}</h2>
          <div style={{ marginBottom: '16px', padding: '12px', background: '#f5f5f5', borderRadius: '8px', maxHeight: '400px', overflowY: 'auto' }}>
            <p><strong>{t('subject')}:</strong></p>
            <p style={{ margin: '8px 0', color: '#1976d2', fontWeight: '500' }}>{generatedReply.subject || 'RE: Your letter'}</p>
            
            <p style={{ marginTop: '16px' }}><strong>{t('body')}:</strong></p>
            <p style={{ margin: '8px 0', whiteSpace: 'pre-wrap', lineHeight: '1.6', fontSize: '14px' }}>
              {generatedReply.body}
            </p>

            {generatedReply.tips && (
              <div style={{ marginTop: '12px', padding: '8px', background: '#e3f2fd', borderRadius: '4px' }}>
                <p><strong style={{ color: '#1976d2' }}>💡 {t('tips')}:</strong></p>
                <p style={{ margin: '4px 0', fontSize: '13px' }}>{generatedReply.tips}</p>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className={styles.analyzeButton} 
              onClick={() => {
                navigator.clipboard.writeText(generatedReply.body);
                alert(t('copied'));
              }}
              style={{ flex: 1 }}
            >
              📋 {t('copy')}
            </button>
            <button 
              className={styles.analyzeButton} 
              onClick={() => setShowReplyModal(false)}
              style={{ background: '#666', flex: 1 }}
            >
              {t('close')}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Pricing Modal
  const renderPricingModal = () => {
    if (!showPricingModal) return null;

    return (
      <div className={styles.modal}>
        <div className={styles.modalContent}>
          <button
            onClick={() => setShowPricingModal(false)}
            style={{ float: 'right', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', padding: 0 }}
          >
            ✕
          </button>
          <h2>{t('upgradePlan')}</h2>
          <div className={styles.plans}>
            {allTiers && allTiers.map((tier: any) => {
              const tierId = tier.id || 'free';
              return (
                <div key={tierId} className={styles.planCard}>
                  <h3>{tier.name || tierId.toUpperCase()}</h3>
                  <p className={styles.price}>{TIER_PRICES[tierId] || tier.price || '€0'}</p>
                  <p style={{ fontSize: '12px', color: '#666', marginBottom: '12px' }}>
                    {TIER_LIMITS[tierId]} {t('documentsPerMonth')}
                  </p>
                  <ul style={{ textAlign: 'left', marginBottom: '12px' }}>
                    {tier.features && tier.features.map((feature: string, i: number) => (
                      <li key={i} style={{ fontSize: '13px', marginBottom: '4px' }}>✓ {feature}</li>
                    ))}
                  </ul>
                  <button
                    className={styles.analyzeButton}
                    onClick={() => {
                      if (tier.stripeLink) {
                        window.open(tier.stripeLink, '_blank');
                      } else if (tierId !== 'free') {
                        alert('Stripe link not configured');
                      }
                      setShowPricingModal(false);
                    }}
                    style={{ width: '100%' }}
                  >
                    {tierId === 'free' ? t('current') : t('select')}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.app}>
      {/* Header */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent:
