import React, { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Шаг перед отправкой: предпросмотр письма и закрашивание личных данных прямо в браузере.
 * Прямоугольники рисуются поверх фото и «впекаются» в JPEG до отправки — на сервер уходит уже закрашенное изображение.
 */

type Lang = 'de' | 'ru';
type Rect = { x: number; y: number; w: number; h: number }; // в пикселях исходного изображения

const T = {
  ru: {
    title: 'Проверьте письмо перед отправкой',
    hint: 'Можно закрыть то, что не нужно для разбора: номер счёта (IBAN), Steuer-ID, номер карты, имена. Закрашенное остаётся только на вашем телефоне.',
    draw: '✏️ Закрасить данные',
    drawing: '✏️ Режим закрашивания: проведите по данным',
    stop: '✋ Готово, прокрутка',
    undo: '↶ Отменить',
    page: 'Стр.',
    send: { erklaeren: 'Отправить на разбор', betrug: 'Проверить на обман' },
    cancel: 'Выбрать другой файл',
    skip: 'Больше не показывать этот шаг',
    count: (n: number) => `Закрашено: ${n}`,
  },
  de: {
    title: 'Brief vor dem Senden prüfen',
    hint: 'Schwärzen Sie, was für die Erklärung nicht nötig ist: Kontonummer (IBAN), Steuer-ID, Kartennummer, Namen. Das passiert nur auf Ihrem Gerät.',
    draw: '✏️ Daten schwärzen',
    drawing: '✏️ Schwärzen aktiv: über die Angaben ziehen',
    stop: '✋ Fertig, scrollen',
    undo: '↶ Rückgängig',
    page: 'S.',
    send: { erklaeren: 'Zur Erklärung senden', betrug: 'Auf Betrug prüfen' },
    cancel: 'Andere Datei wählen',
    skip: 'Diesen Schritt nicht mehr anzeigen',
    count: (n: number) => `Geschwärzt: ${n}`,
  },
};

export const SKIP_KEY = 'deasySchwaerzenAus';

function PageCanvas({
  src,
  rects,
  drawMode,
  onAdd,
  label,
}: {
  src: string;
  rects: Rect[];
  drawMode: boolean;
  onAdd: (r: Rect) => void;
  label: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const [live, setLive] = useState<Rect | null>(null);

  const paint = useCallback(() => {
    const c = canvasRef.current;
    const img = imgRef.current;
    if (!c || !img) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(img, 0, 0);
    ctx.fillStyle = '#000';
    [...rects, ...(live ? [live] : [])].forEach((r) => ctx.fillRect(r.x, r.y, r.w, r.h));
  }, [rects, live]);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      const c = canvasRef.current;
      if (c) {
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
      }
      paint();
    };
    img.src = `data:image/jpeg;base64,${src}`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  useEffect(paint, [paint]);

  const toImage = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = canvasRef.current!;
    const b = c.getBoundingClientRect();
    return { x: ((e.clientX - b.left) / b.width) * c.width, y: ((e.clientY - b.top) / b.height) * c.height };
  };
  const norm = (a: { x: number; y: number }, b: { x: number; y: number }): Rect => ({
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    w: Math.abs(a.x - b.x),
    h: Math.abs(a.y - b.y),
  });

  return (
    <canvas
      ref={canvasRef}
      aria-label={label}
      style={{
        display: 'block',
        width: '100%',
        height: 'auto',
        borderRadius: 8,
        border: drawMode ? '2px solid #2b4fd8' : '1px solid #dfe2e8',
        touchAction: drawMode ? 'none' : 'auto',
        cursor: drawMode ? 'crosshair' : 'default',
        background: '#fff',
      }}
      onPointerDown={(e) => {
        if (!drawMode) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        start.current = toImage(e);
      }}
      onPointerMove={(e) => {
        if (!drawMode || !start.current) return;
        setLive(norm(start.current, toImage(e)));
      }}
      onPointerUp={(e) => {
        if (!drawMode || !start.current) return;
        const r = norm(start.current, toImage(e));
        start.current = null;
        setLive(null);
        // Короткий штрих пальцем → полоса по высоте строки текста
        const c = canvasRef.current!;
        const minH = c.height * 0.028;
        if (r.w > 4) onAdd(r.h < minH ? { ...r, y: r.y - (minH - r.h) / 2, h: minH } : r);
      }}
    />
  );
}

export default function RedactionEditor({
  images,
  mode,
  language,
  busy,
  onConfirm,
  onCancel,
}: {
  images: string[];
  mode: 'erklaeren' | 'betrug';
  language: Lang;
  busy: boolean;
  onConfirm: (images: string[]) => void;
  onCancel: () => void;
}) {
  const t = T[language];
  const [rects, setRects] = useState<Rect[][]>(() => images.map(() => []));
  const [drawMode, setDrawMode] = useState(false);
  const [history, setHistory] = useState<number[]>([]); // номера страниц в порядке добавления — для «Отменить»
  const [skip, setSkip] = useState(false);
  const total = rects.reduce((n, r) => n + r.length, 0);

  const add = (page: number, r: Rect) => {
    setRects((prev) => prev.map((list, i) => (i === page ? [...list, r] : list)));
    setHistory((h) => [...h, page]);
  };
  const undo = () => {
    const page = history[history.length - 1];
    if (page === undefined) return;
    setRects((prev) => prev.map((list, i) => (i === page ? list.slice(0, -1) : list)));
    setHistory((h) => h.slice(0, -1));
  };

  /** «Впекаем» прямоугольники в JPEG. Страницы без закрашивания отправляются как есть. */
  const confirm = async () => {
    try {
      if (skip) localStorage.setItem(SKIP_KEY, '1');
    } catch {}
    const out = await Promise.all(
      images.map(
        (src, i) =>
          new Promise<string>((resolve) => {
            if (!rects[i].length) return resolve(src);
            const img = new Image();
            img.onload = () => {
              const c = document.createElement('canvas');
              c.width = img.naturalWidth;
              c.height = img.naturalHeight;
              const ctx = c.getContext('2d')!;
              ctx.drawImage(img, 0, 0);
              ctx.fillStyle = '#000';
              rects[i].forEach((r) => ctx.fillRect(r.x, r.y, r.w, r.h));
              resolve(c.toDataURL('image/jpeg', 0.85).replace(/^data:image\/jpeg;base64,/, ''));
            };
            img.onerror = () => resolve(src);
            img.src = `data:image/jpeg;base64,${src}`;
          })
      )
    );
    onConfirm(out);
  };

  return (
    <div>
      <h2 style={{ margin: '0 0 6px' }}>{t.title}</h2>
      <p style={{ margin: '0 0 14px', fontSize: 14, color: '#4b4e5c' }}>🔒 {t.hint}</p>

      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 5,
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
          alignItems: 'center',
          padding: '10px 0',
          background: 'rgba(255,255,255,0.96)',
        }}
      >
        <button type="button" onClick={() => setDrawMode((v) => !v)} style={drawMode ? btnActive : btn}>
          {drawMode ? t.stop : t.draw}
        </button>
        <button type="button" onClick={undo} disabled={!total} style={{ ...btn, opacity: total ? 1 : 0.5 }}>
          {t.undo}
        </button>
        {total > 0 && <span style={{ fontSize: 13, color: '#4b4e5c' }}>{t.count(total)}</span>}
      </div>
      {drawMode && <p style={{ margin: '0 0 8px', fontSize: 13, color: '#1f3bb0', fontWeight: 600 }}>{t.drawing}</p>}

      <div style={{ display: 'grid', gap: 12, maxHeight: '70vh', overflowY: drawMode ? 'hidden' : 'auto', paddingRight: 2 }}>
        {images.map((src, i) => (
          <div key={i}>
            {images.length > 1 && (
              <div style={{ fontSize: 12, color: '#6b7085', marginBottom: 4 }}>
                {t.page} {i + 1}
              </div>
            )}
            <PageCanvas src={src} rects={rects[i]} drawMode={drawMode} onAdd={(r) => add(i, r)} label={`${t.page} ${i + 1}`} />
          </div>
        ))}
      </div>

      <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: '#4b4e5c', margin: '14px 0', cursor: 'pointer' }}>
        <input type="checkbox" checked={skip} onChange={(e) => setSkip(e.target.checked)} style={{ width: 16, height: 16 }} />
        {t.skip}
      </label>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={confirm}
          disabled={busy}
          style={{ ...btnActive, padding: '14px 22px', fontSize: 16, background: mode === 'betrug' ? '#c8321f' : '#2b4fd8', borderColor: 'transparent', opacity: busy ? 0.6 : 1 }}
        >
          {t.send[mode]}
        </button>
        <button type="button" onClick={onCancel} disabled={busy} style={btn}>
          {t.cancel}
        </button>
      </div>
    </div>
  );
}

const btn: React.CSSProperties = {
  border: '1px solid #c9d4fb',
  background: '#eef2ff',
  color: '#1f3bb0',
  borderRadius: 10,
  padding: '10px 14px',
  fontWeight: 600,
  fontSize: 14.5,
  cursor: 'pointer',
};

const btnActive: React.CSSProperties = {
  ...btn,
  background: '#1d2433',
  borderColor: '#1d2433',
  color: '#fff',
};
