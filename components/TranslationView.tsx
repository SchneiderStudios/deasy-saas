import React, { useState } from 'react';

/**
 * «Оригинал и перевод рядом»: письмо по абзацам — немецкий текст и русский перевод.
 * Запрос к /api/translate-document только по кнопке (лимит разборов не списывается).
 * Для писем из «Моих писем» перевод берётся из сохранённого (фото писем мы не храним).
 */

type Absatz = { de: string; ru: string };

const box: React.CSSProperties = {
  margin: '0 0 16px',
  padding: '14px 16px',
  borderRadius: 12,
  background: '#fff',
  border: '1px solid #dfe2e8',
};

const btn: React.CSSProperties = {
  border: '1px solid #c9d4fb',
  background: '#eef2ff',
  color: '#1f3bb0',
  borderRadius: 10,
  padding: '10px 14px',
  fontWeight: 600,
  fontSize: 15,
  cursor: 'pointer',
};

export default function TranslationView({
  images,
  saved,
  onLoaded,
}: {
  images: string[];
  saved?: Absatz[];
  onLoaded?: (a: Absatz[]) => void;
}) {
  const [absaetze, setAbsaetze] = useState<Absatz[] | null>(saved && saved.length ? saved : null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nurRu, setNurRu] = useState(false);
  const [open, setOpen] = useState(false);

  const load = async () => {
    setOpen(true);
    if (absaetze || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/translate-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images, language: 'ru' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.error || 'Не удалось перевести письмо.');
      setAbsaetze(data.absaetze);
      onLoaded?.(data.absaetze);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось перевести письмо.');
    } finally {
      setLoading(false);
    }
  };

  // Нечего показывать: письмо открыто из истории без сохранённого перевода
  if (!absaetze && images.length === 0) return null;

  if (!open) {
    return (
      <div style={box}>
        <strong>🔤 Оригинал и перевод рядом</strong>
        <p style={{ margin: '4px 0 10px', fontSize: 14, color: '#4b4e5c' }}>
          Каждый абзац письма — по-немецки и по-русски. Удобно, чтобы понять, какая строка что значит. Разбор при этом не списывается.
        </p>
        <button type="button" style={btn} onClick={load}>
          Показать перевод по абзацам
        </button>
      </div>
    );
  }

  return (
    <div style={box}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
        <strong>🔤 Оригинал и перевод</strong>
        <div style={{ display: 'flex', gap: 8 }}>
          {absaetze && (
            <button type="button" style={{ ...btn, padding: '6px 10px', fontSize: 13 }} onClick={() => setNurRu((v) => !v)}>
              {nurRu ? 'Показать оригинал' : 'Только перевод'}
            </button>
          )}
          <button type="button" style={{ ...btn, padding: '6px 10px', fontSize: 13 }} onClick={() => setOpen(false)}>
            Свернуть
          </button>
        </div>
      </div>
      <p style={{ margin: '0 0 12px', fontSize: 12, color: '#6b7085' }}>
        🤖 Перевод сделан ИИ · может содержать ошибки · номера счетов скрыты · действует немецкий оригинал
      </p>

      {loading && <p style={{ color: '#4b4e5c' }}>Переводим письмо… это занимает до 30 секунд.</p>}
      {error && <p style={{ color: '#b42318' }}>{error}</p>}

      {absaetze &&
        absaetze.map((a, i) => (
          <div
            key={i}
            style={{
              display: 'grid',
              gridTemplateColumns: nurRu ? '1fr' : 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 12,
              padding: '10px 0',
              borderTop: i ? '1px solid #eef0f4' : 'none',
            }}
          >
            {!nurRu && (
              <p lang="de" style={{ margin: 0, fontSize: 14, color: '#5b6272', whiteSpace: 'pre-wrap' }}>
                {a.de}
              </p>
            )}
            <p lang="ru" style={{ margin: 0, fontSize: 15, color: '#1d2433', whiteSpace: 'pre-wrap' }}>
              {a.ru}
            </p>
          </div>
        ))}
    </div>
  );
}
