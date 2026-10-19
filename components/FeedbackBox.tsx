import React, { useState } from 'react';

/** Короткий отзыв под разбором (для теста спроса). Анонимно: уходит владельцу по e-mail через /api/feedback. */

type Lang = 'de' | 'ru';
type Answer3 = 'ja' | 'teilweise' | 'nein';

const T = {
  ru: {
    title: 'Помогите улучшить DEASY',
    sub: '2 коротких вопроса, анонимно',
    q1: 'Разбор помог понять письмо?',
    a1: { ja: 'Да', teilweise: 'Частично', nein: 'Нет' },
    q2: 'Чего не хватило? (необязательно)',
    ph2: 'Например: хотел спросить, … / непонятно было …',
    send: 'Отправить',
    sending: 'Отправляю…',
    thanks: '🙏 Спасибо! Ваш отзыв очень помогает.',
    privacy: 'Не пишите сюда имена, адреса и номера дел.',
    error: 'Не удалось отправить. Попробуйте позже.',
  },
  de: {
    title: 'Helfen Sie, DEASY zu verbessern',
    sub: '2 kurze Fragen, anonym',
    q1: 'Hat die Erklärung geholfen, den Brief zu verstehen?',
    a1: { ja: 'Ja', teilweise: 'Teilweise', nein: 'Nein' },
    q2: 'Was hat gefehlt? (optional)',
    ph2: 'z. B. Ich wollte wissen, … / Unklar war …',
    send: 'Absenden',
    sending: 'Wird gesendet…',
    thanks: '🙏 Danke! Ihr Feedback hilft sehr.',
    privacy: 'Bitte keine Namen, Adressen oder Aktenzeichen eintragen.',
    error: 'Senden fehlgeschlagen. Bitte später erneut versuchen.',
  },
};

const chip = (active: boolean): React.CSSProperties => ({
  padding: '8px 14px',
  borderRadius: 999,
  border: `1px solid ${active ? '#2b4fd8' : '#d6d9e1'}`,
  background: active ? '#2b4fd8' : '#fff',
  color: active ? '#fff' : '#1d2433',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
});

export default function FeedbackBox({ language, demo }: { language: Lang; demo?: boolean }) {
  const t = T[language];
  const [helpful, setHelpful] = useState<Answer3 | null>(null);
  const [missing, setMissing] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');

  const submit = async () => {
    if (!helpful || state === 'sending') return;
    setState('sending');
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ helpful, missing, language, demo: !!demo }),
      });
      if (!res.ok) throw new Error();
      setState('done');
    } catch {
      setState('error');
    }
  };

  if (state === 'done') {
    return (
      <div style={{ margin: '8px 0 0', padding: '18px 2px 2px', borderTop: '1px solid var(--line)' }}>
        {t.thanks}
      </div>
    );
  }

  return (
    <div style={{ margin: '8px 0 0', padding: '18px 2px 2px', borderTop: '1px solid var(--line)' }}>
      <h3 style={{ margin: 0 }}>{t.title}</h3>
      <p style={{ margin: '2px 0 12px', fontSize: 13, color: '#6b7085' }}>{t.sub}</p>

      <p style={{ margin: '0 0 8px', fontWeight: 600 }}>{t.q1}</p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        {(Object.keys(t.a1) as Answer3[]).map((k) => (
          <button key={k} type="button" style={chip(helpful === k)} onClick={() => setHelpful(k)}>
            {t.a1[k]}
          </button>
        ))}
      </div>

      <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>
        {t.q2}
        <textarea
          value={missing}
          onChange={(e) => setMissing(e.target.value.slice(0, 800))}
          placeholder={t.ph2}
          rows={2}
          style={{ display: 'block', width: '100%', boxSizing: 'border-box', marginTop: 6, padding: '10px 12px', borderRadius: 10, border: '1px solid #d6d9e1', fontSize: 15, fontFamily: 'inherit', fontWeight: 400 }}
        />
      </label>
      <p style={{ margin: '0 0 14px', fontSize: 12, color: '#6b7085' }}>{t.privacy}</p>

      <button
        type="button"
        onClick={submit}
        disabled={!helpful || state === 'sending'}
        style={{ ...chip(true), padding: '10px 20px', opacity: helpful ? 1 : 0.5 }}
      >
        {state === 'sending' ? t.sending : t.send}
      </button>
      {state === 'error' && <p style={{ color: '#b42318', fontSize: 14, margin: '8px 0 0' }}>{t.error}</p>}
    </div>
  );
}
