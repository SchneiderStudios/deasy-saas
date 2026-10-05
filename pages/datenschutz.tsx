import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import styles from '@/styles/Legal.module.css';
import LegalLinks from '@/components/LegalLinks';
import { COMPANY, LEGAL_UPDATED, companyComplete } from '@/lib/siteConfig';

export default function Datenschutz() {
  return (
    <div className={styles.container}>
      <Head>
        <title>Datenschutzerklärung – {COMPANY.brand}</title>
        <meta name="robots" content="noindex" />
      </Head>

      <nav className={styles.nav}>
        <Link href="/">← Zurück zur Startseite</Link>
      </nav>

      <article className={styles.content}>
        <h1>Datenschutzerklärung</h1>

        {!companyComplete() && (
          <div className={styles.warning}>
            <strong>⚠️ Angaben unvollständig</strong>
            <p>Die Anschrift des Verantwortlichen fehlt noch. Bitte in <code>lib/siteConfig.ts</code> ergänzen.</p>
          </div>
        )}

        <h2>1. Verantwortlicher</h2>
        <p>
          {COMPANY.name}
          <br />
          {COMPANY.street || '[Straße und Hausnummer]'}, {COMPANY.zipCity || '[PLZ und Ort]'}
          <br />
          E-Mail: <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>
        </p>

        <h2>2. Kurz zusammengefasst</h2>
        <ul>
          <li>Kein Benutzerkonto, keine Cookies, kein Tracking, keine Werbung.</li>
          <li>Hochgeladene Briefe werden nur zur Analyse an unseren KI-Dienstleister übermittelt und von uns nicht dauerhaft gespeichert.</li>
          <li>Ihr Dokumentverlauf und Ihr Nutzungszähler liegen ausschließlich in Ihrem eigenen Browser.</li>
        </ul>

        <h2>3. Hosting und Server-Logfiles</h2>
        <p>
          Diese Website wird bei Vercel Inc. (440 N Barranca Ave #4133, Covina, CA 91723, USA) gehostet. Beim
          Aufruf verarbeitet Vercel technisch notwendige Daten (u. a. IP-Adresse, Datum und Uhrzeit, aufgerufene
          Seite, Browsertyp), um die Website auszuliefern und vor Missbrauch zu schützen. Rechtsgrundlage ist
          unser berechtigtes Interesse an einem sicheren und stabilen Betrieb (Art. 6 Abs. 1 lit. f DSGVO). Die
          Serverfunktionen laufen in der Region Frankfurt am Main. Soweit Daten in die USA übermittelt werden, erfolgt dies
          auf Grundlage des EU-US Data Privacy Framework bzw. von EU-Standardvertragsklauseln (Art. 45, 46 DSGVO).
        </p>

        <h2>4. Analyse hochgeladener Dokumente (KI)</h2>
        <p>
          Wenn Sie ein Dokument hochladen (Brief, PDF oder Screenshot einer E-Mail/SMS für den Echtheits-Check), wird es in Ihrem Browser verkleinert und als Bild an unseren Server
          gesendet. Von dort wird es zur Analyse, für Ihre Fragen im Chat und zum Erstellen von Antwortschreiben
          an die Schnittstelle (API) von Anthropic PBC (548 Market Street, PMB 90375, San Francisco, CA 94104,
          USA) übermittelt. Anthropic verarbeitet die Daten als Auftragsverarbeiter in unserem Auftrag. Nach
          Angaben von Anthropic werden Inhalte, die über die kommerzielle API übermittelt werden, nicht zum
          Training von KI-Modellen verwendet und nach einer begrenzten Frist gelöscht. Einzelheiten:{' '}
          <a href="https://www.anthropic.com/legal/privacy" target="_blank" rel="noopener noreferrer">
            Datenschutzhinweise von Anthropic
          </a>
          .
        </p>
        <p>
          Wir speichern Ihre Dokumente, Analysen und Chatnachrichten nicht auf unseren Servern. Rechtsgrundlage
          ist die Erfüllung des Nutzungsvertrags (Art. 6 Abs. 1 lit. b DSGVO). Behördenbriefe können besondere
          Kategorien personenbezogener Daten enthalten (z. B. Gesundheitsdaten in Schreiben der Krankenkasse).
          Vor dem ersten Hochladen holen wir per Kontrollkästchen Ihre ausdrückliche Einwilligung in diese
          Verarbeitung und in die Übermittlung an Anthropic in die USA ein (Art. 6 Abs. 1 lit. a, Art. 9 Abs. 2 lit. a,
          Art. 49 Abs. 1 lit. a DSGVO); die Übermittlung ist zusätzlich durch die Datenschutzvereinbarung von Anthropic
          mit EU-Standardvertragsklauseln abgesichert (Art. 46 DSGVO). Sie können die Einwilligung jederzeit mit Wirkung
          für die Zukunft widerrufen, indem Sie das Häkchen entfernen; die bis dahin erfolgte Verarbeitung bleibt
          rechtmäßig. Ohne Einwilligung ist eine Analyse nicht möglich. Tipp: Schwärzen Sie Angaben, die für die Erklärung nicht
          nötig sind (z. B. Kontonummern).
        </p>

        <h2>5. Speicherung in Ihrem Browser</h2>
        <p>
          Ihr Dokumentverlauf (Zusammenfassungen, Fristen), Ihre Einwilligung (Abschnitt 4), Ihre Sprachauswahl, die Zähler für kostenlose Briefe und
          Echtheits-Checks sowie Ihr Paket-Guthaben werden im lokalen Speicher (localStorage) Ihres Browsers abgelegt. Diese Daten
          verlassen Ihr Gerät nicht und sind für die von Ihnen gewünschte Funktion unbedingt erforderlich
          (§ 25 Abs. 2 Nr. 2 TDDDG). Sie können sie jederzeit löschen, indem Sie die Websitedaten in Ihrem
          Browser entfernen.
        </p>

        <h2>6. Zahlungen</h2>
        <p>
          Kostenpflichtige Tarife werden über Stripe Payments Europe, Ltd. (1 Grand Canal Street Lower, Dublin 2,
          Irland) abgewickelt. Ihre Zahlungsdaten geben Sie direkt bei Stripe ein; wir erhalten sie nicht. Nach
          der Zahlung fragen wir bei Stripe ab, ob die Zahlung erfolgreich war und welches Paket gekauft wurde, und
          vermerken bei Stripe, dass das Paket eingelöst ist (damit es nicht mehrfach gutgeschrieben wird). Rechtsgrundlage ist die Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO); gesetzliche
          Aufbewahrungspflichten (Art. 6 Abs. 1 lit. c DSGVO) bleiben unberührt. Details:{' '}
          <a href="https://stripe.com/de/privacy" target="_blank" rel="noopener noreferrer">
            Datenschutzerklärung von Stripe
          </a>
          .
        </p>

        <h2>7. Widerruf über die Website</h2>
        <p>
          Wenn Sie über „Vertrag widerrufen“ eine Erklärung abgeben, verarbeiten wir Ihren
          Namen, Ihre E-Mail-Adresse, den Vertrag und den Zeitpunkt des Eingangs, um die Erklärung umzusetzen, die Zahlung zu
          erstatten und Ihnen den Eingang zu bestätigen (Art. 6 Abs. 1 lit. b und c DSGVO, § 356a BGB).
          Die Bestätigungs-E-Mails versenden wir über Resend (Plus Five Five, Inc., 2261 Market Street #5039,
          San Francisco, CA 94114, USA) als Auftragsverarbeiter auf Grundlage von EU-Standardvertragsklauseln. Wir bewahren
          die Erklärungen bis zum Ablauf der gesetzlichen Verjährungs- und Aufbewahrungsfristen auf.
        </p>

        <h2>8. Kontakt per E-Mail</h2>
        <p>
          Wenn Sie uns per E-Mail schreiben, verarbeiten wir Ihre Angaben zur Bearbeitung der Anfrage
          (Art. 6 Abs. 1 lit. b bzw. f DSGVO) und löschen sie, sobald sie nicht mehr erforderlich sind und keine
          Aufbewahrungspflichten bestehen.
        </p>

        <h2>9. Ihre Rechte</h2>
        <p>
          Sie haben das Recht auf Auskunft (Art. 15), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung
          der Verarbeitung (Art. 18), Datenübertragbarkeit (Art. 20) und Widerspruch (Art. 21 DSGVO) sowie das
          Recht, eine Einwilligung jederzeit zu widerrufen (Art. 7 Abs. 3 DSGVO). Wenden Sie sich dazu an{' '}
          <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>.
        </p>
        <p>
          Sie können sich außerdem bei einer Datenschutz-Aufsichtsbehörde beschweren, insbesondere in dem
          Bundesland Ihres Wohnorts oder des Sitzes des Verantwortlichen.
        </p>

        <h2>10. Automatisierte Ergebnisse</h2>
        <p>
          Analysen und Antwortentwürfe werden von einer KI erzeugt (Art. 50 KI-Verordnung). Sie dienen nur der
          Orientierung; es findet keine automatisierte Entscheidung mit rechtlicher Wirkung für Sie statt
          (Art. 22 DSGVO).
        </p>

        <p className={styles.lastUpdated}>Stand: {LEGAL_UPDATED}</p>
      </article>
      <LegalLinks compact />
    </div>
  );
}
