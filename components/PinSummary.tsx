import React, { useEffect, useState } from 'react';
import s from '@/styles/Sheet.module.css';

/**
 * Накопительная сводка на телефоне: пока листаешь разбор, важные строки
 * (срок, что сделать, проверка) по одной прилипают сверху и остаются там.
 * Строка появляется, когда её раздел ушёл вверх за шапку.
 * На компьютере не показывается (всё и так видно на полях) — см. .pinBar в Sheet.module.css.
 */

export interface PinItem {
  key: string; // совпадает с data-pin="..." у раздела
  label: string;
  value: string;
  alarm?: boolean;
}

const KOPF = 58; // высота липкой шапки приложения

export default function PinSummary({ items }: { items: PinItem[] }) {
  const [offen, setOffen] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let frame = 0;

    const pruefen = () => {
      frame = 0;
      const sichtbar: string[] = [];
      items.forEach((it, i) => {
        const el = document.querySelector(`[data-pin="${it.key}"]`);
        if (!el) return;
        const grenze = KOPF + i * 34 + 24;
        if (el.getBoundingClientRect().top <= grenze) sichtbar.push(it.key);
      });
      setOffen((alt) => (alt.join('|') === sichtbar.join('|') ? alt : sichtbar));
    };

    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(pruefen);
    };

    pruefen();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [items]);

  const zeilen = items.filter((i) => offen.includes(i.key));

  return (
    <div className={s.pinBar} aria-hidden={zeilen.length === 0}>
      {zeilen.map((z) => (
        <div key={z.key} className={`${s.pinRow} ${z.alarm ? s.pinAlarm : ''}`}>
          <span className={s.pinLabel}>{z.label}</span>
          <span className={s.pinValue}>{z.value}</span>
        </div>
      ))}
    </div>
  );
}
