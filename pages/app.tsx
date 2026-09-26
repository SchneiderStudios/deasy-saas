import React, { useState } from 'react';
import Link from 'next/link';
import styles from '@/styles/App.module.css';

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

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageData(event.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleAnalyze = async () => {
    if (!imageData) return;

    setLoading(true);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageData,
          fileName: file?.name,
        }),
      });

      const data = await response.json();
      setAnalysis(data);
      setChatMessages([]);
    } catch (error) {
      setAnalysis({
        error: 'Fehler beim Analysieren des Dokuments',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChatSend = async () => {
    if (!chatInput || !analysis) return;

    const newMessage: ChatMessage = {
      role: 'user',
      content: chatInput,
    };

    setChatMessages([...chatMessages, newMessage]);
    setChatInput('');
    setChatLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: chatInput,
          context: analysis.summary,
        }),
      });

      const data = await response.json();

      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.response || data.error || 'Fehler beim Chat',
        },
      ]);
    } catch (error) {
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Chat-Fehler',
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <Link href="/" className={styles.logo}>
          ← DEASY
        </Link>
        <div className={styles.headerRight}>
          <span className={styles.plan}>Free Plan (5 Dokumente/Monat)</span>
          <Link href="/checkout?plan=pro" className={styles.upgradeButton}>
            Upgrade
          </Link>
        </div>
      </header>

      <div className={styles.content}>
        {/* Upload Section */}
        {!analysis ? (
          <div className={styles.uploadSection}>
            <h1>Dokument hochladen</h1>
            <div
              className={styles.uploadArea}
              onClick={() => document.getElementById('fileInput')?.click()}
            >
              <div className={styles.uploadIcon}>📄</div>
              <p className={styles.uploadText}>
                Ziehe ein Dokument hier hin oder klicke zum Upload
              </p>
              <p className={styles.uploadSubtext}>JPG, PNG, GIF, WebP bis 10 MB</p>
              <input
                id="fileInput"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                hidden
              />
            </div>

            {file && (
              <div className={styles.filePreview}>
                <p>📎 {file.name}</p>
                <button
                  className={styles.analyzeButton}
                  onClick={handleAnalyze}
                  disabled={loading}
                >
                  {loading ? '⏳ Analysiere...' : '▶ Analysieren'}
                </button>
              </div>
            )}

            <div className={styles.securityNote}>
              🔒 Dein Dokument ist verschlüsselt und wird nach der Analyse nicht
              gespeichert.
            </div>
          </div>
        ) : (
          <div className={styles.analysisLayout}>
            {/* Analysis Result */}
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
                    ← Neues Dokument
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
                    <h2>Zusammenfassung</h2>
                    <p>{analysis.summary}</p>

                    {analysis.deadlines && analysis.deadlines.length > 0 && (
                      <>
                        <h3>⏰ Fristen</h3>
                        <ul>
                          {analysis.deadlines.map((deadline, i) => (
                            <li key={i}>{deadline}</li>
                          ))}
                        </ul>
                      </>
                    )}

                    {analysis.nextSteps && analysis.nextSteps.length > 0 && (
                      <>
                        <h3>👣 Nächste Schritte</h3>
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
                    ← Neues Dokument
                  </button>
                </>
              )}
            </div>

            {/* Chat Section */}
            {!analysis.error && (
              <div className={styles.chatPanel}>
                <h2>💬 Fragen zum Brief?</h2>

                <div className={styles.chatMessages}>
                  {chatMessages.length === 0 && (
                    <p className={styles.chatPlaceholder}>
                      Stelle eine Frage zu deinem Brief...
                    </p>
                  )}
                  {chatMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={`${styles.chatMessage} ${styles[msg.role]}`}
                    >
                      <p>{msg.content}</p>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className={styles.chatMessage + ' ' + styles.assistant}>
                      <p className={styles.typing}>⏳ Antwortet...</p>
                    </div>
                  )}
                </div>

                <div className={styles.chatInput}>
                  <input
                    type="text"
                    placeholder="Deine Frage..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') handleChatSend();
                    }}
                    disabled={chatLoading}
                  />
                  <button
                    onClick={handleChatSend}
                    disabled={!chatInput || chatLoading}
                  >
                    📤
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
