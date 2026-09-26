import React from 'react';
import Link from 'next/link';
import styles from '@/styles/Legal.module.css';

export default function Datenschutz() {
  return (
    <div className={styles.container}>
      <nav className={styles.nav}>
        <Link href="/">← Zurück zur Startseite</Link>
      </nav>

      <article className={styles.content}>
        <h1>Datenschutzerklärung</h1>

        <div className={styles.warning}>
          <strong>⚠️ Platzhalter — vor dem echten Launch von einem Anwalt prüfen lassen.</strong>
          <p>
            DEASY verarbeitet Dokumente mit sensiblen Daten. Eine vollständige,
            rechtlich geprüfte Datenschutzerklärung ist erforderlich.
          </p>
        </div>

        <h2>1. Verantwortlicher</h2>
        <p>
          [Name und Kontakt des Verantwortlichen einfügen]
          <br />
          [Straße, PLZ, Stadt]
          <br />
          [E-Mail] [Telefon]
        </p>

        <h2>2. Verarbeitung hochgeladener Dokumente</h2>
        <p>
          Wenn du ein Dokument zur Analyse hochlädst, wird der Inhalt einmalig an
          unseren KI-Partner <strong>Anthropic</strong> zur Auswertung übermittelt.
        </p>
        <ul>
          <li>Das Dokument wird NICHT dauerhaft in unserer Datenbank gespeichert</li>
          <li>
            Claude Vision API analysiert das Bild, speichert es gemäß{' '}
            <a href="https://www.anthropic.com/privacy" target="_blank" rel="noopener">
              Anthropic Privacy Policy
            </a>
          </li>
          <li>
            Wir haben einen Auftragsverarbeitungsvertrag (AVV) mit Anthropic
            abgeschlossen
          </li>
        </ul>

        <h2>3. Rechtsgrundlage</h2>
        <p>
          Die Verarbeitung erfolgt auf Basis deiner Einwilligung (Art. 6 Abs. 1 lit.
          a DSGVO) bzw. zur Erfüllung eines Vertrags (Art. 6 Abs. 1 lit. b DSGVO).
        </p>

        <h2>4. Cookies &amp; Analyse</h2>
        <p>
          Wir nutzen optional Analyse-Tools wie Plausible Analytics (Privacy-First).
          [Wird aktualisiert, sobald implementiert]
        </p>

        <h2>5. Deine Datenschutzrechte</h2>
        <p>Du hast das Recht auf:</p>
        <ul>
          <li>Auskunft (Art. 15 DSGVO)</li>
          <li>Berichtigung (Art. 16 DSGVO)</li>
          <li>Löschung (Art. 17 DSGVO)</li>
          <li>Datenportabilität (Art. 20 DSGVO)</li>
          <li>Widerspruch (Art. 21 DSGVO)</li>
        </ul>
        <p>
          Wende dich an: <a href="mailto:privacy@deasy.de">privacy@deasy.de</a>
        </p>

        <h2>6. Beschwerde bei Datenschutzbehörde</h2>
        <p>
          Du hast das Recht, eine Beschwerde bei deiner Datenschutzaufsichtsbehörde
          einzureichen (für Berlin: Berliner Datenschutzbeauftragte).
        </p>

        <h2>7. Speicherdauer</h2>
        <p>
          [Konkrete Fristen einfügen, sobald User-Accounts implementiert sind]
        </p>

        <p className={styles.lastUpdated}>
          Letzte Aktualisierung: September 2024
        </p>
      </article>
    </div>
  );
}
