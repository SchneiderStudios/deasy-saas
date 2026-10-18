import React from 'react';
import Head from 'next/head';
import type { GetStaticPaths, GetStaticProps } from 'next';
import SiteHeader from '@/components/SiteHeader';
import LegalLinks from '@/components/LegalLinks';
import styles from '@/styles/Site.module.css';
import { useLang } from '@/lib/useLang';
import { GUIDES, getGuide } from '@/lib/guides';

/** /ratgeber/[slug] — один гайд, RU/DE. Статическая генерация при сборке. */
export default function GuidePage({ slug }: { slug: string }) {
  const [lang, setLang] = useLang();
  const ru = lang === 'ru';
  const guide = getGuide(slug);
  if (!guide) return null;
  const g = guide[lang];

  return (
    <div className={styles.page} lang={lang}>
      <Head>
        <title>{`${g.title} — DEASY`}</title>
        <meta name="description" content={g.lead} />
      </Head>
      <SiteHeader lang={lang} onLang={setLang} />
      <main className={`${styles.main} ${styles.narrow}`}>
        <p className={styles.breadcrumb}>
          <a href="/ratgeber">{ru ? '← Все гайды' : '← Alle Ratgeber'}</a>
        </p>
        <span className={styles.eyebrow} aria-hidden="true">
          {guide.icon} {ru ? 'Гайд' : 'Ratgeber'}
        </span>
        <h1>{g.title}</h1>
        <p className={styles.lead}>{g.lead}</p>

        <article className={styles.article}>
          {g.sections.map((s) => (
            <section key={s.h}>
              <h2>{s.h}</h2>
              {s.p && <p>{s.p}</p>}
              {s.list && (
                <ul>
                  {s.list.map((li) => (
                    <li key={li}>{li}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}

          <h2>{ru ? 'Куда обратиться' : 'Wer hilft'}</h2>
          <ul className={styles.links}>
            {g.links.map((l) => (
              <li key={l.url}>
                <a href={l.url} target="_blank" rel="noopener noreferrer">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </article>

        <p className={styles.notice}>
          {ru
            ? 'Это общая информация, а не юридическая консультация. Правила могут отличаться в вашем случае — главное всегда написано в самом письме. При сомнениях спросите отправителя или бесплатную консультацию.'
            : 'Allgemeine Informationen, keine Rechtsberatung. Im Einzelfall kann es abweichen – maßgeblich ist, was im Brief steht. Fragen Sie im Zweifel beim Absender oder einer kostenlosen Beratungsstelle nach.'}{' '}
          <span className={styles.muted}>
            {ru ? 'Обновлено' : 'Stand'}: {guide.updated}
          </span>
        </p>

        <div className={styles.ctaBox}>
          <div>
            <strong>{ru ? 'Письмо лежит на столе?' : 'Liegt ein Brief auf dem Tisch?'}</strong>
            <p>
              {ru
                ? 'DEASY переведёт его, покажет сроки и подскажет, куда обратиться.'
                : 'DEASY erklärt ihn, zeigt die Fristen und wer weiterhilft.'}
            </p>
          </div>
          <a href={slug === 'betrug-erkennen' ? '/app?modus=betrug' : '/app'} className={styles.btnPrimary}>
            {slug === 'betrug-erkennen'
              ? ru
                ? 'Проверить на обман бесплатно'
                : 'Kostenlos auf Betrug prüfen'
              : ru
                ? 'Сфотографировать письмо'
                : 'Brief fotografieren'}
          </a>
        </div>
      </main>
      <LegalLinks />
    </div>
  );
}

export const getStaticPaths: GetStaticPaths = async () => ({
  paths: GUIDES.map((g) => ({ params: { slug: g.slug } })),
  fallback: false,
});

export const getStaticProps: GetStaticProps = async ({ params }) => ({
  props: { slug: String(params?.slug || '') },
});
