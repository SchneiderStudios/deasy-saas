import React from 'react';
import Head from 'next/head';
import SiteHeader from '@/components/SiteHeader';
import LegalLinks from '@/components/LegalLinks';
import styles from '@/styles/Site.module.css';
import { useLang } from '@/lib/useLang';
import { GUIDES } from '@/lib/guides';

/** /ratgeber — список гайдов (общая информация, без оценки конкретных случаев). */
export default function Ratgeber() {
  const [lang, setLang] = useLang();
  const ru = lang === 'ru';
  return (
    <div className={styles.page} lang={lang}>
      <Head>
        <title>{ru ? 'Гайды по письмам из немецких ведомств — DEASY' : 'Ratgeber zu Behördenbriefen – DEASY'}</title>
        <meta
          name="description"
          content={
            ru
              ? 'Гайды на русском: письма из Jobcenter, Krankenkasse, Ausländerbehörde, Rundfunkbeitrag, сроки и мошенничество — что это и куда обратиться.'
              : 'Ratgeber in einfacher Sprache: Briefe vom Jobcenter, der Krankenkasse, Ausländerbehörde, Rundfunkbeitrag, Fristen und Betrug.'
          }
        />
      </Head>
      <SiteHeader lang={lang} onLang={setLang} />
      <main className={styles.main}>
        <span className={styles.eyebrow}>{ru ? 'Гайды' : 'Ratgeber'}</span>
        <h1>{ru ? 'Письма из немецких ведомств — простыми словами' : 'Behördenbriefe in einfachen Worten'}</h1>
        <p className={styles.lead}>
          {ru
            ? 'Что за письмо пришло, какие бывают сроки и куда обратиться за помощью. Общая информация — без оценки вашей ситуации.'
            : 'Welcher Brief gekommen ist, welche Fristen es gibt und wo Sie Hilfe bekommen. Allgemeine Informationen – keine Bewertung Ihres Einzelfalls.'}
        </p>
        <div className={styles.guideGrid}>
          {GUIDES.map((g) => (
            <a key={g.slug} href={`/ratgeber/${g.slug}`} className={styles.guideCard}>
              <span aria-hidden="true">{g.icon}</span>
              <h3>{g[lang].title}</h3>
              <p>{g[lang].lead}</p>
            </a>
          ))}
        </div>
        <p className={styles.notice}>
          {ru
            ? 'Гайды не заменяют консультацию. Письма из Finanzamt и Familienkasse (Kindergeld) мы не разбираем: с ними помогают Steuerberater и Lohnsteuerhilfeverein.'
            : 'Die Ratgeber ersetzen keine Beratung. Post vom Finanzamt und von der Familienkasse (Kindergeld) erklären wir nicht – dabei helfen Steuerberatungen und Lohnsteuerhilfevereine.'}
        </p>
      </main>
      <LegalLinks />
    </div>
  );
}
