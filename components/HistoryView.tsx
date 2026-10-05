import React from 'react';
import type { SavedCase } from '@/hooks/useDocumentHistory';
import { fmtDate, daysLeft } from '@/lib/ics';

type Lang = 'de' | 'ru';

const riskIcon = (r?: string) => (r === 'Kritisch' ? '🔴' : r === 'Mittel' ? '🟡' : r === 'Gering' ? '🟢' : '⚪');

/** Ближайший будущий срок письма. */
function nextFrist(c: SavedCase) {
  const upcoming = (c.fristen || []).filter((f) => daysLeft(f.datum) >= 0).sort((a, b) => a.datum.localeCompare(b.datum));
  return upcoming[0];
}

export default function HistoryView({
  cases,
  language,
  onOpen,
  onDelete,
  onToggleDone,
  onBack,
}: {
  cases: SavedCase[];
  language: Lang;
  onOpen: (c: SavedCase) => void;
  onDelete: (id: string) => void;
  onToggleDone: (id: string) => void;
  onBack: () => void;
}) {
  const de = language === 'de';
  // Сначала открытые письма с ближайшим сроком, потом остальные по дате
  const sorted = [...cases].sort((a, b) => {
    if (!!a.erledigt !== !!b.erledigt) return a.erledigt ? 1 : -1;
    const fa = nextFrist(a)?.datum || '9999';
    const fb = nextFrist(b)?.datum || '9999';
    if (fa !== fb) return fa.localeCompare(fb);
    return b.date.localeCompare(a.date);
  });

  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
      <button
        onClick={onBack}
        style={{ background: 'none', border: 'none', color: '#2b4fd8', fontWeight: 600, fontSize: 15, padding: '4px 0', marginBottom: 12, cursor: 'pointer' }}
      >
        ← {de ? 'Zurück' : 'Назад'}
      </button>
      <h2 style={{ margin: '0 0 4px' }}>📁 {de ? 'Meine Briefe' : 'Мои письма'}</h2>
      <p style={{ margin: '0 0 16px', fontSize: 13, color: '#6b7085' }}>
        {de
          ? 'Nur auf diesem Gerät gespeichert (ohne Bilder). Löschen Sie die Websitedaten des Browsers, ist der Verlauf weg.'
          : 'Хранится только на этом устройстве (без фото писем). Если очистить данные браузера, история удалится.'}
      </p>

      {sorted.length === 0 && (
        <p style={{ color: '#4b4e5c' }}>{de ? 'Noch keine Briefe analysiert.' : 'Вы ещё не загружали писем.'}</p>
      )}

      {sorted.map((c) => {
        const nf = nextFrist(c);
        const d = nf ? daysLeft(nf.datum) : null;
        return (
          <div
            key={c.id}
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: 12,
              padding: '12px 14px',
              marginBottom: 10,
              opacity: c.erledigt ? 0.6 : 1,
            }}
          >
            <button
              onClick={() => onOpen(c)}
              style={{ all: 'unset', cursor: 'pointer', display: 'block', width: '100%' }}
              aria-label={de ? 'Brief öffnen' : 'Открыть письмо'}
            >
              <div style={{ fontWeight: 700, color: '#1c2340' }}>
                {riskIcon(c.risk)} {c.absender || c.fileName}
                {c.echtheit === 'pruefen' && <span style={{ color: '#b54708', fontSize: 13 }}> · 🛡️ {de ? 'prüfen' : 'проверить'}</span>}
              </div>
              <div style={{ fontSize: 13, color: '#6b7085' }}>
                {de ? 'Hochgeladen' : 'Загружено'}: {new Date(c.date).toLocaleDateString(de ? 'de-DE' : 'ru-RU')}
                {c.aktenzeichen && ` · ${c.aktenzeichen}`}
              </div>
              {nf && !c.erledigt && (
                <div style={{ fontSize: 14, marginTop: 4, color: d !== null && d <= 7 ? '#b54708' : '#067647', fontWeight: 600 }}>
                  ⏰ {fmtDate(nf.datum)} – {nf.was} ({de ? `noch ${d} Tage` : `осталось ${d} дн.`})
                </div>
              )}
            </button>
            <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
              <button onClick={() => onToggleDone(c.id)} style={smallBtn}>
                {c.erledigt ? (de ? '↺ Wieder offen' : '↺ Снова открыть') : de ? '✓ Erledigt' : '✓ Сделано'}
              </button>
              <button onClick={() => onDelete(c.id)} style={{ ...smallBtn, color: '#b42318', borderColor: '#fecdca', background: '#fff' }}>
                🗑 {de ? 'Löschen' : 'Удалить'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const smallBtn: React.CSSProperties = {
  border: '1px solid #c9d4fb',
  background: '#eef2ff',
  color: '#1f3bb0',
  borderRadius: 8,
  padding: '6px 10px',
  fontWeight: 600,
  fontSize: 13,
  cursor: 'pointer',
};
