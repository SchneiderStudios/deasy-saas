import React, { useEffect, useRef, useState } from 'react';
import styles from '@/styles/Assistant.module.css';
import { REPLY_TEMPLATES } from '@/lib/replyTemplates';

export interface AssistantAnalysis {
  summary: string;
  risk: string;
  deadlines: string[];
  actions: string[];
  language: 'de' | 'ru';
}

interface Props {
  analysis: AssistantAnalysis;
  images: string[];
  language: 'de' | 'ru';
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface Reply {
  subject: string;
  body: string;
  translation: string;
  tips: string[];
  placeholders: string[];
}

const T = {
  de: {
    title: 'DEASY-Assistent',
    subtitle: 'Fragen zum Brief stellen oder eine Antwort schreiben lassen',
    tabChat: '💬 Fragen',
    tabReply: '✉️ Antwort schreiben',
    welcome: 'Ich habe Ihren Brief gelesen. Fragen Sie mich alles dazu – oder wählen Sie unten eine Frage aus.',
    chips: [
      'Was muss ich jetzt tun?',
      'Welche Antwortmöglichkeiten habe ich?',
      'Erkläre die Fachbegriffe',
      'Was passiert, wenn ich nichts tue?',
      'Welche Unterlagen brauche ich?',
    ],
    placeholder: 'Ihre Frage zum Brief…',
    send: 'Senden',
    typing: 'DEASY schreibt…',
    chatError: 'Antwort konnte nicht geladen werden. Bitte erneut versuchen.',
    chooseType: '1. Welche Antwort brauchen Sie?',
    notesLabel: '2. Was soll rein? (optional)',
    notesPlaceholder: 'z. B. „Ich habe die Rechnung bereits am 3.9. bezahlt“ oder „Ich bin bis 20.10. im Urlaub“',
    generate: 'Antwort mit KI erstellen',
    generating: 'Brief wird erstellt… (ca. 20–40 Sek.)',
    yourLetter: 'Ihr Antwortschreiben (bearbeitbar)',
    copy: '📋 Kopieren',
    copied: '✓ Kopiert',
    download: '⬇️ Als Datei',
    email: '📧 Per E-Mail',
    again: '↺ Neu erstellen',
    fill: 'Bitte noch ausfüllen:',
    tips: 'Hinweise',
    translation: '',
    templatesTitle: 'Oder eine fertige Vorlage verwenden (ohne KI):',
    disclaimer: 'DEASY ersetzt keine Rechtsberatung. Bei Gericht, hohen Beträgen oder Fragen zum Aufenthalt wenden Sie sich an eine Beratungsstelle.',
    replyError: 'Brief konnte nicht erstellt werden. Bitte erneut versuchen.',
    askAboutLetter: '❓ Frage zum Brief',
    types: {
      widerspruch: ['Widerspruch / Einspruch', 'Ich bin nicht einverstanden'],
      fristverlaengerung: ['Fristverlängerung', 'Ich brauche mehr Zeit'],
      ratenzahlung: ['Ratenzahlung', 'Ich kann nicht alles zahlen'],
      unterlagen: ['Unterlagen nachreichen', 'Dokumente schicken'],
      rueckfrage: ['Rückfrage', 'Etwas ist unklar'],
      frei: ['Eigene Antwort', 'Ich beschreibe es selbst'],
    } as Record<string, [string, string]>,
  },
  ru: {
    title: 'Ассистент DEASY',
    subtitle: 'Задайте вопрос по письму или попросите составить ответ',
    tabChat: '💬 Вопросы',
    tabReply: '✉️ Написать ответ',
    welcome: 'Я прочитал ваше письмо. Спрашивайте что угодно — или выберите вопрос ниже.',
    chips: [
      'Что мне сейчас делать?',
      'Какие у меня варианты ответа?',
      'Объясни немецкие термины',
      'Что будет, если ничего не делать?',
      'Какие документы нужны?',
    ],
    placeholder: 'Ваш вопрос по письму…',
    send: 'Отправить',
    typing: 'DEASY печатает…',
    chatError: 'Не удалось получить ответ. Попробуйте ещё раз.',
    chooseType: '1. Какой ответ нужен?',
    notesLabel: '2. Что важно указать? (необязательно, можно по-русски)',
    notesPlaceholder: 'Например: «Я уже оплатил счёт 3 сентября» или «Я в отпуске до 20 октября»',
    generate: 'Составить ответ с ИИ',
    generating: 'Составляю письмо… (20–40 сек.)',
    yourLetter: 'Ваше письмо на немецком (можно редактировать)',
    copy: '📋 Копировать',
    copied: '✓ Скопировано',
    download: '⬇️ Скачать',
    email: '📧 Отправить e-mail',
    again: '↺ Составить заново',
    fill: 'Осталось заполнить:',
    tips: 'Советы',
    translation: 'Перевод на русский — чтобы вы понимали, что отправляете',
    templatesTitle: 'Или готовый шаблон (без ИИ):',
    disclaimer: 'DEASY не заменяет юриста. При суде, крупных суммах или вопросах ВНЖ обратитесь в консультацию (Beratungsstelle).',
    replyError: 'Не удалось составить письмо. Попробуйте ещё раз.',
    askAboutLetter: '❓ Спросить про письмо',
    types: {
      widerspruch: ['Возражение', 'Widerspruch / Einspruch'],
      fristverlaengerung: ['Продлить срок', 'Fristverlängerung'],
      ratenzahlung: ['Рассрочка', 'Не могу оплатить сразу'],
      unterlagen: ['Досылаю документы', 'Unterlagen nachreichen'],
      rueckfrage: ['Уточнить', 'Что-то непонятно'],
      frei: ['Свой вариант', 'Опишу сам'],
    } as Record<string, [string, string]>,
  },
};

const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export default function DocumentAssistant({ analysis, images, language }: Props) {
  const t = T[language];
  const [tab, setTab] = useState<'chat' | 'reply'>('chat');

  // ---------- Chat ----------
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'welcome', role: 'assistant', content: t.welcome },
  ]);
  const [input, setInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, chatLoading]);

  const sendMessage = async (text: string) => {
    const question = text.trim();
    if (!question || chatLoading) return;

    const userMsg: ChatMessage = { id: newId(), role: 'user', content: question };
    const history = [...messages.filter((m) => m.id !== 'welcome'), userMsg];
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setChatLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history.map(({ role, content }) => ({ role, content })),
          analysis,
          images,
          language,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.error || t.chatError);
      setMessages((prev) => [...prev, { id: newId(), role: 'assistant', content: data.message }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { id: newId(), role: 'assistant', content: `⚠️ ${err instanceof Error ? err.message : t.chatError}` },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  // ---------- Reply ----------
  const [replyType, setReplyType] = useState<string>('widerspruch');
  const [notes, setNotes] = useState('');
  const [reply, setReply] = useState<Reply | null>(null);
  const [letter, setLetter] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generateReply = async () => {
    setReplyLoading(true);
    setReplyError(null);
    try {
      const res = await fetch('/api/generate-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ replyType, notes, analysis, images, language }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.error || t.replyError);
      setReply(data.reply);
      setLetter(data.reply.body);
    } catch (err) {
      setReplyError(err instanceof Error ? err.message : t.replyError);
    } finally {
      setReplyLoading(false);
    }
  };

  const useTemplate = (id: string) => {
    const tpl = REPLY_TEMPLATES.find((x) => x.id === id);
    if (!tpl) return;
    setReply({
      subject: '',
      body: tpl.body_de,
      translation: language === 'ru' ? tpl.body_ru : '',
      tips: [],
      placeholders: [],
    });
    setLetter(tpl.body_de);
  };

  const copyLetter = async () => {
    try {
      await navigator.clipboard.writeText(letter);
    } catch {
      // Старые браузеры: выделяем текст вручную
      const ta = document.getElementById('deasy-letter') as HTMLTextAreaElement | null;
      ta?.select();
      document.execCommand('copy');
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadLetter = () => {
    const blob = new Blob([letter], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Antwort_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const emailHref = `mailto:?subject=${encodeURIComponent(reply?.subject || '')}&body=${encodeURIComponent(letter)}`;

  return (
    <section className={styles.wrap}>
      <div className={styles.head}>
        <div className={styles.avatar}>D</div>
        <div>
          <p className={styles.headTitle}>{t.title}</p>
          <p className={styles.headSub}>{t.subtitle}</p>
        </div>
      </div>

      <div className={styles.tabs} role="tablist">
        <button
          role="tab"
          aria-selected={tab === 'chat'}
          className={`${styles.tab} ${tab === 'chat' ? styles.tabActive : ''}`}
          onClick={() => setTab('chat')}
        >
          {t.tabChat}
        </button>
        <button
          role="tab"
          aria-selected={tab === 'reply'}
          className={`${styles.tab} ${tab === 'reply' ? styles.tabActive : ''}`}
          onClick={() => setTab('reply')}
        >
          {t.tabReply}
        </button>
      </div>

      {tab === 'chat' && (
        <>
          <div className={styles.messages} ref={messagesRef}>
            {messages.map((m) => (
              <div key={m.id} className={`${styles.msg} ${m.role === 'user' ? styles.msgUser : styles.msgBot}`}>
                {m.content}
              </div>
            ))}
            {chatLoading && <div className={styles.typing}>{t.typing}</div>}
          </div>

          <div className={styles.chips}>
            {t.chips.map((c) => (
              <button key={c} className={styles.chip} disabled={chatLoading} onClick={() => sendMessage(c)}>
                {c}
              </button>
            ))}
            <button className={styles.chip} onClick={() => setTab('reply')}>
              {t.tabReply}
            </button>
          </div>

          <form
            className={styles.inputRow}
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
          >
            <input
              className={styles.input}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t.placeholder}
              disabled={chatLoading}
              enterKeyHint="send"
            />
            <button type="submit" className={styles.primary} disabled={chatLoading || !input.trim()}>
              {t.send}
            </button>
          </form>
        </>
      )}

      {tab === 'reply' && (
        <div className={styles.panel}>
          {!reply && (
            <>
              <span className={styles.label}>{t.chooseType}</span>
              <div className={styles.typeGrid}>
                {Object.entries(t.types).map(([id, [title, hint]]) => (
                  <button
                    key={id}
                    className={`${styles.typeBtn} ${replyType === id ? styles.typeBtnActive : ''}`}
                    onClick={() => setReplyType(id)}
                  >
                    {title}
                    <small>{hint}</small>
                  </button>
                ))}
              </div>

              <label className={styles.label} htmlFor="deasy-notes">
                {t.notesLabel}
              </label>
              <textarea
                id="deasy-notes"
                className={`${styles.input} ${styles.notes}`}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t.notesPlaceholder}
              />

              <button className={styles.primary} style={{ width: '100%' }} disabled={replyLoading} onClick={generateReply}>
                {replyLoading ? t.generating : t.generate}
              </button>
              {replyError && <p className={styles.error}>{replyError}</p>}

              <div className={styles.templates}>
                <span className={styles.label}>{t.templatesTitle}</span>
                <div className={styles.templateList}>
                  {REPLY_TEMPLATES.map((tpl) => (
                    <button key={tpl.id} className={styles.secondary} onClick={() => useTemplate(tpl.id)}>
                      {language === 'ru' ? tpl.title_ru : tpl.title_de}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {reply && (
            <>
              <label className={styles.label} htmlFor="deasy-letter">
                {t.yourLetter}
              </label>
              <textarea
                id="deasy-letter"
                className={styles.letter}
                value={letter}
                onChange={(e) => setLetter(e.target.value)}
              />

              <div className={styles.actions}>
                <button className={styles.primary} onClick={copyLetter}>
                  {copied ? t.copied : t.copy}
                </button>
                <button className={styles.secondary} onClick={downloadLetter}>
                  {t.download}
                </button>
                <a className={styles.secondary} href={emailHref} style={{ textDecoration: 'none' }}>
                  {t.email}
                </a>
                <button className={styles.secondary} onClick={() => setReply(null)}>
                  {t.again}
                </button>
                <button className={styles.secondary} onClick={() => setTab('chat')}>
                  {t.askAboutLetter}
                </button>
              </div>

              {reply.placeholders.length > 0 && (
                <div className={styles.note}>
                  <strong>{t.fill}</strong>
                  <ul>
                    {reply.placeholders.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                </div>
              )}

              {reply.tips.length > 0 && (
                <div className={styles.note} style={{ background: '#eef6ff', borderColor: '#c7dcf7', color: '#1d3a5f' }}>
                  <strong>{t.tips}</strong>
                  <ul>
                    {reply.tips.map((tip) => (
                      <li key={tip}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}

              {reply.translation && (
                <div className={styles.translation}>
                  <strong>{t.translation}</strong>
                  {'\n\n'}
                  {reply.translation}
                </div>
              )}
            </>
          )}

          <p className={styles.disclaimer}>{t.disclaimer}</p>
        </div>
      )}
    </section>
  );
}
