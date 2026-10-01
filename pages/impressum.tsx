import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import styles from '@/styles/Legal.module.css';
import { COMPANY, LEGAL_UPDATED, companyComplete } from '@/lib/siteConfig';

export default function Impressum() {
  const complete = companyComplete();

  return (
    <div className={styles.container}>
      <Head>
        <title>Impressum – {COMPANY.brand}</title>
        <meta name="robots" content="noindex" />
      </Head>

      <nav className={styles.nav}>
        <Link href="/">← Zurück zur Startseite</Link>
      </nav>

      <article className={styles.content}>
        <h1>Impressum</h1>

        {!complete && (
          <div className={styles.warning}>
            <strong>⚠️ Angaben unvollständig</strong>
            <p>Die ladungsfähige Anschrift fehlt noch. Bitte in <code>lib/siteConfig.ts</code> ergänzen.</p>
          </div>
        )}

        <h2>Angaben gemäß § 5 Digitale-Dienste-Gesetz (DDG)</h2>
        <p>
          {COMPANY.name}
          {COMPANY.brand && <> – {COMPANY.brand}</>}
          <br />
          {COMPANY.street || '[Straße und Hausnummer]'}
          <br />
          {COMPANY.zipCity || '[PLZ und Ort]'}
          <br />
          {COMPANY.country}
        </p>

        <h2>Kontakt</h2>
        <p>
          E-Mail: <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>
          {COMPANY.phone && (
            <>
              <br />
              Telefon: {COMPANY.phone}
            </>
          )}
        </p>

        <h2>Umsatzsteuer</h2>
        {COMPANY.vatId ? (
          <p>Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG: {COMPANY.vatId}</p>
        ) : COMPANY.kleinunternehmer ? (
          <p>Kleinunternehmer gemäß § 19 UStG – es wird keine Umsatzsteuer ausgewiesen.</p>
        ) : null}

        <h2>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
        <p>
          {COMPANY.name}
          <br />
          {COMPANY.street || '[Straße und Hausnummer]'}, {COMPANY.zipCity || '[PLZ und Ort]'}
        </p>

        <h2>Hinweis zum Dienst</h2>
        <p>
          {COMPANY.brand} erklärt Behördenschreiben mithilfe künstlicher Intelligenz (Claude von Anthropic).
          Die Ergebnisse werden automatisch erzeugt und können Fehler enthalten. {COMPANY.brand} ist kein
          Rechtsdienstleister und ersetzt keine Rechts-, Steuer- oder Sozialberatung. Bei Fristen, hohen
          Beträgen oder Fragen zum Aufenthalt wenden Sie sich bitte an eine Beratungsstelle, einen
          Mieterverein, eine Steuerberatung oder eine Anwaltskanzlei.
        </p>

        <h2>Verbraucherstreitbeilegung</h2>
        <p>
          Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
          Verbraucherschlichtungsstelle teilzunehmen.
        </p>

        <h2>Haftung für Inhalte und Links</h2>
        <p>
          Die Inhalte dieser Website wurden mit Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und
          Aktualität können wir jedoch keine Gewähr übernehmen. Für Inhalte externer Websites, auf die wir
          verlinken, sind ausschließlich deren Betreiber verantwortlich.
        </p>

        <h2>Datenschutz</h2>
        <p>
          Informationen zur Verarbeitung Ihrer Daten finden Sie in der{' '}
          <Link href="/datenschutz">Datenschutzerklärung</Link>.
        </p>

        <p className={styles.lastUpdated}>Stand: {LEGAL_UPDATED}</p>
      </article>
    </div>
  );
}
