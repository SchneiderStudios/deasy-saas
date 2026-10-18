import React from 'react';
import Head from 'next/head';
import SiteHeader from '@/components/SiteHeader';
import LegalLinks from '@/components/LegalLinks';
import ContactForm from '@/components/ContactForm';
import styles from '@/styles/Site.module.css';
import { useLang } from '@/lib/useLang';

/**
 * /partner — заявка от организаций (Migrationsberatung, Integrationskurse, языковые школы, HR).
 * Не обещаем того, чего нет (UWG): B2B-тарифа пока нет — говорим о пилоте и обсуждении.
 */

const T = {
  ru: {
    title: 'Партнёрам — DEASY',
    desc: 'Для консультаций, курсов интеграции, языковых школ и работодателей: как DEASY может помочь вашим клиентам с письмами из ведомств.',
    eyebrow: 'Партнёрам',
    h1: 'Вместе помогаем людям разобраться с письмами',
    lead: 'К вам приходят с письмами из Jobcenter, Krankenkasse или Ausländerbehörde? DEASY переводит их на понятный язык, показывает сроки и подсказывает, куда обратиться, — а сложные вопросы остаются за вами.',
    who: [
      { h: 'Консультации', p: 'Migrationsberatung, Sozialberatung, Jugendmigrationsdienste: клиенты приходят подготовленными — с переводом письма и списком сроков.' },
      { h: 'Курсы и школы', p: 'Integrationskurse и языковые школы: учебный материал о реальных письмах и инструмент, которым ученики пользуются сами.' },
      { h: 'Работодатели и HR', p: 'Сотрудники из-за рубежа получают письма и после онбординга. DEASY помогает им разобраться самостоятельно.' },
    ],
    formTitle: 'Давайте поговорим',
    formText: 'Мы сейчас запускаем первые пилоты с партнёрами. Расскажите, кому вы помогаете, — ответим в течение недели и вместе подумаем о формате.',
    note: 'DEASY не даёт юридических консультаций и не заменяет вашу работу — он экономит время на переводе и поиске сроков.',
  },
  de: {
    title: 'Für Partner – DEASY',
    desc: 'Für Beratungsstellen, Integrationskurse, Sprachschulen und Arbeitgeber: wie DEASY Ihren Klientinnen und Klienten bei Behördenpost hilft.',
    eyebrow: 'Für Partner',
    h1: 'Gemeinsam helfen, Behördenbriefe zu verstehen',
    lead: 'Zu Ihnen kommen Menschen mit Post vom Jobcenter, der Krankenkasse oder der Ausländerbehörde? DEASY erklärt sie verständlich, zeigt die Fristen und wer weiterhilft – die eigentliche Beratung bleibt bei Ihnen.',
    who: [
      { h: 'Beratungsstellen', p: 'Migrationsberatung, Sozialberatung, Jugendmigrationsdienste: Klienten kommen vorbereitet – mit verständlicher Erklärung und Fristen.' },
      { h: 'Kurse und Schulen', p: 'Integrationskurse und Sprachschulen: Lernmaterial zu echten Briefen und ein Werkzeug, das Teilnehmende selbst nutzen.' },
      { h: 'Arbeitgeber und HR', p: 'Internationale Mitarbeitende bekommen auch nach dem Onboarding Behördenpost. DEASY hilft ihnen, selbst klarzukommen.' },
    ],
    formTitle: 'Lassen Sie uns sprechen',
    formText: 'Wir starten gerade die ersten Pilotprojekte mit Partnern. Erzählen Sie uns, wen Sie unterstützen – wir antworten innerhalb einer Woche und überlegen gemeinsam ein Format.',
    note: 'DEASY bietet keine Rechtsberatung und ersetzt Ihre Arbeit nicht – es spart Zeit beim Übersetzen und beim Finden von Fristen.',
  },
};

export default function Partner() {
  const [lang, setLang] = useLang();
  const t = T[lang];
  return (
    <div className={styles.page} lang={lang}>
      <Head>
        <title>{t.title}</title>
        <meta name="description" content={t.desc} />
      </Head>
      <SiteHeader lang={lang} onLang={setLang} />
      <main className={styles.main}>
        <span className={styles.eyebrow}>{t.eyebrow}</span>
        <h1>{t.h1}</h1>
        <p className={styles.lead}>{t.lead}</p>

        <div className={styles.partnerGrid}>
          {t.who.map((w) => (
            <div key={w.h} className={styles.partnerItem}>
              <h3>{w.h}</h3>
              <p>{w.p}</p>
            </div>
          ))}
        </div>

        <div className={styles.formWrap}>
          <div>
            <h2>{t.formTitle}</h2>
            <p className={styles.lead}>{t.formText}</p>
            <p className={styles.notice}>{t.note}</p>
          </div>
          <ContactForm art="partner" language={lang} />
        </div>
      </main>
      <LegalLinks />
    </div>
  );
}
