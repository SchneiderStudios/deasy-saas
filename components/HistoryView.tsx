import React, { useMemo, useState } from 'react';
import type { SavedCase } from '@/hooks/useDocumentHistory';
import { fmtDate, daysLeft } from '@/lib/ics';

type Lang = 'de' | 'ru';

const riskIcon = (r?: string) => (r === 'Kritisch' ? '🔴' : r === 'Mittel' ? '🟡' : r === 'Gering' ? '🟢' : '⚪');

/** Ближайший будущий срок письма. */
function nextFrist(c: SavedCase) {
  const upcoming = (c.fristen || []).filter((f) => daysLeft(f.datum) >= 0).sort((a, b) => a.datum.localeCompare(b.datum));
  return upcoming[0];
}

/** Сначала открытые письма с ближайшим сроком, потом остальные по дате */
const byUrgency = (a: SavedCase, b: SavedCase) => {
  if (!!a.erledigt !== !!b.erledigt) return a.erledigt ? 1 : -1;
  const fa = nextFrist(a)?.datum || '9999';
  const fb = nextFrist(b)?.datum || '9999';
  if (fa !== fb) return fa.localeCompare(fb);
  return b.date.localeCompare(a.date);
};

/** Нормализованный отправитель для группировки: «Jobcenter Berlin Mitte» и «JOBCENTER Berlin-Mitte» — одна группа */
const senderKey = (c: SavedCase) =>
  (c.absender || '').toLowerCase().replace(/[^a-zа-яäöüß0-9]+/gi, ' ').trim() || '—';

/** Текст, по которому ищем (только то, что сохранено на устройстве) */
const haystack = (c: SavedCase) =>
  [c.titel, c.absender, c.fileName, c.aktenzeichen, c.briefdatum, c.summary, ...(c.fristen || []).map((f) => f.was), ...(c.unterlagen || [])]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

export default function HistoryView({
  cases,
  language,
  onOpen,
  onDelete,
  onToggleDone,
  onRename,
  onBack,
}: {
  cases: SavedCase[];
  language: Lang;
  onOpen: (c: SavedCase) => void;
  onDelete: (id: string) => void;
  onToggleDone: (id: string) => void;
  onRename: (id: string, titel: string) => void;
  onBack: () => void;
}) {
  const de = language === 'de';
  const [query, setQuery] = useState('');
  const [grouped, setGrouped] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  const filtered = useMemo(() => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    return cases.filter((c) => {
      const h = haystack(c);
      return words.every((w) => h.includes(w));
    });
  }, [cases, query]);

  // Группы по отправителю: группа с самым срочным письмом — выше
  const groups = useMemo(() => {
    const map = new Map<string, SavedCase[]>();
    filtered.forEach((c) => {
      const k = senderKey(c);
      map.set(k, [...(map.get(k) || []), c]);
    });
    return Array.from(map.values())
      .map((list) => list.sort(byUrgency))
      .sort((a, b) => byUrgency(a[0], b[0]));
  }, [filtered]);

  const startRename = (c: SavedCase) => {
    setEditing(c.id);
    setDraft(c.titel || c.absender || c.fileName);
  };
  const saveRename = (id: string) => {
    onRename(id, draft.trim().slice(0, 80));
    setEditing(null);
  };

  const renderCase = (c: SavedCase, showSender: boolean) => {
    const nf = nextFrist(c);
    const d = nf ? daysLeft(nf.datum) : null;
    const name = c.titel || (showSender ? c.absender : '') || c.summary?.slice(0, 60) || c.fileName;
    return (
      <div
        key={c.id}
        style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: '12px 14px', marginBottom: 10, opacity: c.erledigt ? 0.6 : 1, background: '#fff' }}
      >
        {editing === c.id ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveRename(c.id);
            }}
            style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}
          >
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              aria-label={de ? 'Neuer Name' : 'Новое название'}
              style={{ flex: '1 1 200px', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #2b4fd8', fontSize: 15 }}
            />
            <button type="submit" style={smallBtn}>
              {de ? 'Speichern' : 'Сохранить'}
            </button>
            <button type="button" style={{ ...smallBtn, background: '#fff' }} onClick={() => setEditing(null)}>
              {de ? 'Abbrechen' : 'Отмена'}
            </button>
          </form>
        ) : (
          <button onClick={() => onOpen(c)} style={{ all: 'unset', cursor: 'pointer', display: 'block', width: '100%' }} aria-label={de ? 'Brief öffnen' : 'Открыть письмо'}>
            <div style={{ fontWeight: 700, color: '#1c2340' }}>
              {riskIcon(c.risk)} {name}
              {c.echtheit === 'pruefen' && <span style={{ color: '#b54708', fontSize: 13 }}> · 🛡️ {de ? 'prüfen' : 'проверить'}</span>}
            </div>
            <div style={{ fontSize: 13, color: '#6b7085' }}>
              {de ? 'Hochgeladen' : 'Загружено'}: {new Date(c.date).toLocaleDateString(de ? 'de-DE' : 'ru-RU')}
              {c.briefdatum && ` · ${de ? 'Brief vom' : 'письмо от'} ${c.briefdatum}`}
              {c.aktenzeichen && ` · ${c.aktenzeichen}`}
              {c.uebersetzung?.length ? ` · 🔤` : ''}
            </div>
            {nf && !c.erledigt && (
              <div style={{ fontSize: 14, marginTop: 4, color: d !== null && d <= 7 ? '#b54708' : '#067647', fontWeight: 600 }}>
                ⏰ {fmtDate(nf.datum)} – {nf.was} ({de ? `noch ${d} Tage` : `осталось ${d} дн.`})
              </div>
            )}
          </button>
        )}
        {editing !== c.id && (
          <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            <button onClick={() => onToggleDone(c.id)} style={smallBtn}>
              {c.erledigt ? (de ? '↺ Wieder offen' : '↺ Снова открыть') : de ? '✓ Erledigt' : '✓ Сделано'}
            </button>
            <button onClick={() => startRename(c)} style={smallBtn}>
              ✏️ {de ? 'Umbenennen' : 'Переименовать'}
            </button>
            <button onClick={() => onDelete(c.id)} style={{ ...smallBtn, color: '#b42318', borderColor: '#fecdca', background: '#fff' }}>
              🗑 {de ? 'Löschen' : 'Удалить'}
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#2b4fd8', fontWeight: 600, fontSize: 15, padding: '4px 0', marginBottom: 12, cursor: 'pointer' }}>
        ← {de ? 'Zurück' : 'Назад'}
      </button>
      <h2 style={{ margin: '0 0 4px' }}>📁 {de ? 'Meine Briefe' : 'Мои письма'}</h2>
      <p style={{ margin: '0 0 16px', fontSize: 13, color: '#6b7085' }}>
        {de
          ? 'Nur auf diesem Gerät gespeichert (ohne Bilder). Löschen Sie die Websitedaten des Browsers, ist der Verlauf weg.'
          : 'Хранится только на этом устройстве (без фото писем). Если очистить данные браузера, история удалится.'}
      </p>

      {cases.length === 0 ? (
        <p style={{ color: '#4b4e5c' }}>{de ? 'Noch keine Briefe analysiert.' : 'Вы ещё не загружали писем.'}</p>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={de ? '🔎 Suchen: Absender, Aktenzeichen, Inhalt …' : '🔎 Поиск: отправитель, номер дела, текст …'}
              aria-label={de ? 'Briefe durchsuchen' : 'Поиск по письмам'}
              style={{ flex: '1 1 240px', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #dfe2e8', fontSize: 15 }}
            />
            <div role="group" aria-label={de ? 'Ansicht' : 'Вид'} style={{ display: 'flex', border: '1px solid #dfe2e8', borderRadius: 10, overflow: 'hidden' }}>
              <button onClick={() => setGrouped(true)} aria-pressed={grouped} style={toggleBtn(grouped)}>
                {de ? 'Nach Absender' : 'По отправителю'}
              </button>
              <button onClick={() => setGrouped(false)} aria-pressed={!grouped} style={toggleBtn(!grouped)}>
                {de ? 'Nach Frist' : 'По сроку'}
              </button>
            </div>
          </div>

          {filtered.length === 0 && <p style={{ color: '#4b4e5c' }}>{de ? 'Nichts gefunden.' : 'Ничего не найдено.'}</p>}

          {grouped
            ? groups.map((list) => (
                <section key={senderKey(list[0])} style={{ marginBottom: 18 }}>
                  <h3 style={{ margin: '0 0 8px', fontSize: 15, color: '#1d2433', display: 'flex', gap: 8, alignItems: 'baseline' }}>
                    <span>🏛️ {list[0].absender || (de ? 'Absender unbekannt' : 'Отправитель не указан')}</span>
                    <span style={{ fontSize: 13, color: '#6b7085', fontWeight: 500 }}>
                      {list.length} {de ? (list.length === 1 ? 'Brief' : 'Briefe') : ruBriefe(list.length)}
                    </span>
                  </h3>
                  <div style={{ paddingLeft: 10, borderLeft: '3px solid #ffe45c' }}>{list.map((c) => renderCase(c, false))}</div>
                </section>
              ))
            : [...filtered].sort(byUrgency).map((c) => renderCase(c, true))}
        </>
      )}
    </div>
  );
}

/** «1 письмо», «3 письма», «11 писем» */
function ruBriefe(n: number) {
  const d = n % 10;
  const dd = n % 100;
  if (d === 1 && dd !== 11) return 'письмо';
  if (d >= 2 && d <= 4 && (dd < 12 || dd > 14)) return 'письма';
  return 'писем';
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

const toggleBtn = (active: boolean): React.CSSProperties => ({
  border: 'none',
  padding: '8px 12px',
  fontSize: 13.5,
  fontWeight: 600,
  cursor: 'pointer',
  background: active ? '#1d2433' : '#fff',
  color: active ? '#fff' : '#5b6272',
});
