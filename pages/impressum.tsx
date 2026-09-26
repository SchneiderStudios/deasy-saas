import React from 'react';
import Link from 'next/link';
import styles from '@/styles/Legal.module.css';

export default function Impressum() {
  return (
    <div className={styles.container}>
      <nav className={styles.nav}>
        <Link href="/">← Zurück zur Startseite</Link>
      </nav>

      <article className={styles.content}>
        <h1>Impressum</h1>

        <div className={styles.warning}>
          <strong>⚠️ Platzhalter — vor dem echten Launch ausfüllen.</strong>
          <p>
            Ein Impressum ist in Deutschland für jede kommerzielle Website gesetzlich
            erforderlich (§ 5 TMG / Telemediengesetz). Bitte ersetzen Sie die Angaben
            unten mit Ihren echten Daten.
          </p>
        </div>

        <h2>Angaben gemäß § 5 Telemediengesetz (TMG)</h2>

        <h3>Inhaltverantwortlicher</h3>
        <p>
          [Vor- und Nachname/Firmenname]
          <br />
          [Straße und Hausnummer]
          <br />
          [PLZ und Ort]
          <br />
          Deutschland
        </p>

        <h2>Kontakt</h2>
        <p>
          Telefon: [Telefonnummer]
          <br />
          E-Mail: <a href="mailto:info@deasy.de">info@deasy.de</a>
        </p>

        <h2>Umsatzsteuer-ID</h2>
        <p>[Falls vorhanden: Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG]</p>

        <h2>Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
        <p>
          [Name und Anschrift der verantwortlichen Person]
        </p>

        <h2>Haftungsausschluss</h2>
        <p>
          Die Inhalte dieser Website werden mit größter Sorgfalt erstellt. Wir
          übernehmen jedoch keine Gewähr für die Korrektheit, Vollständigkeit und
          Aktualität der Inhalte. Die Verwendung unseres Services erfolgt auf
          Eigenrisiko des Nutzers. DEASY ist kein Rechtsberatungsservice.
        </p>

        <h2>Externe Links</h2>
        <p>
          Unser Service enthält Links zu externen Websites. Wir sind nicht
          verantwortlich für den Inhalt, Verfügbarkeit oder Aktualität dieser
          externen Seiten. Für Inhalte verknüpfter Seiten sind ausschließlich deren
          Betreiber verantwortlich.
        </p>

        <h2>Urheberrecht</h2>
        <p>
          Die Inhalte und Werke auf diesen Seiten unterliegen dem deutschen
          Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art
          der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der
          schriftlichen Zustimmung des Autors oder Urhebers. Downloads und Kopien
          dieser Seite sind nur für den privaten, nicht kommerziellen Gebrauch
          gestattet.
        </p>

        <h2>Datenschutz</h2>
        <p>
          Informationen zur Verarbeitung Ihrer Daten finden Sie in unserer{' '}
          <Link href="/datenschutz">Datenschutzerklärung</Link>.
        </p>

        <h2>Streitschlichtung</h2>
        <p>
          Wir sind nicht verpflichtet und nicht bereit, an
          Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle
          teilzunehmen.
        </p>

        <p className={styles.lastUpdated}>
          Letzte Aktualisierung: September 2024
        </p>
      </article>
    </div>
  );
}
