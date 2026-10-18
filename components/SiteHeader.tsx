import React from 'react';
import Link from 'next/link';
import styles from '@/styles/Site.module.css';
import type { Lang } from '@/lib/useLang';

/** Шапка внутренних страниц (гайды, конструктор письма, партнёры) — в стиле главной. */
export default function SiteHeader({ lang, onLang }: { lang: Lang; onLang: (l: Lang) => void }) {
  const ru = lang === 'ru';
  return (
    <header className={styles.nav}>
      <div className={styles.navInner}>
        <a href="/" className={styles.logo} aria-label="DEASY">
          D<span>EASY</span>
        </a>
        <nav className={styles.navLinks} aria-label={ru ? 'Разделы' : 'Bereiche'}>
          <a href="/ratgeber">{ru ? 'Гайды' : 'Ratgeber'}</a>
          <a href="/brief">{ru ? 'Конструктор письма' : 'Brief-Generator'}</a>
          <a href="/partner">{ru ? 'Партнёрам' : 'Für Partner'}</a>
        </nav>
        <div className={styles.navRight}>
          <div className={styles.lang} role="group" aria-label="Sprache / Язык">
            <button aria-pressed={lang === 'ru'} onClick={() => onLang('ru')}>
              RU
            </button>
            <button aria-pressed={lang === 'de'} onClick={() => onLang('de')}>
              DE
            </button>
          </div>
          <Link href="/app" className={styles.navCta}>
            {ru ? 'Открыть DEASY' : 'DEASY öffnen'}
          </Link>
        </div>
      </div>
    </header>
  );
}
