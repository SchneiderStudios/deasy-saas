import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import styles from '@/styles/Legal.module.css';
import LegalLinks from '@/components/LegalLinks';
import { COMPANY, LEGAL_UPDATED } from '@/lib/siteConfig';

export default function AGB() {
  const address = `${COMPANY.name}, ${COMPANY.street}, ${COMPANY.zipCity}`;

  return (
    <div className={styles.container}>
      <Head>
        <title>AGB – {COMPANY.brand}</title>
        <meta name="robots" content="noindex" />
      </Head>

      <nav className={styles.nav}>
        <Link href="/">← Zurück zur Startseite</Link>
      </nav>

      <article className={styles.content}>
        <h1>Allgemeine Geschäftsbedingungen (AGB)</h1>

        <h2>§ 1 Geltungsbereich und Anbieter</h2>
        <p>
          (1) Diese AGB gelten für die Nutzung des Online-Dienstes „{COMPANY.brand}“ unter
          deasy-saas.vercel.app. Anbieter ist {address}, E-Mail: {COMPANY.email} („wir“).
        </p>
        <p>(2) Abweichende Bedingungen der Nutzerinnen und Nutzer gelten nicht.</p>

        <h2>§ 2 Leistungen</h2>
        <p>
          (1) {COMPANY.brand} erklärt hochgeladene Schreiben (z. B. von Behörden, Krankenkassen oder Vermietern) mithilfe
          künstlicher Intelligenz in einfacher Sprache, beantwortet Fragen dazu in einem Chat und erstellt auf Wunsch
          Entwürfe für Antwortschreiben. Die Ergebnisse werden automatisch von einem KI-Modell (Claude der Anthropic PBC)
          erzeugt.
        </p>
        <p>
          (2) {COMPANY.brand} ist eine allgemeine Verständnis- und Formulierungshilfe. Wir erbringen{' '}
          <strong>keine Rechtsdienstleistung, Steuerberatung oder Sozialberatung</strong> und prüfen den Einzelfall nicht
          rechtlich. KI-Ergebnisse können unvollständig oder fehlerhaft sein. Sie sind vor jeder Verwendung selbst zu
          prüfen; bei wichtigen Entscheidungen, insbesondere bei Fristen, hohen Beträgen, Steuer- oder
          Aufenthaltsfragen, sollte eine Beratungsstelle oder eine zugelassene Fachperson hinzugezogen werden.
        </p>
        <p>
          (3) Schreiben in Steuersachen (insbesondere vom Finanzamt, vom Bundeszentralamt für Steuern, von der
          Familienkasse zum Kindergeld, vom Hauptzollamt sowie zu Gemeindesteuern) werden nicht inhaltlich ausgewertet,
          da Hilfe in Steuersachen nur durch die nach dem Steuerberatungsgesetz befugten Personen und Stellen geleistet
          werden darf. In diesen Fällen weist {COMPANY.brand} lediglich auf geeignete Beratungsstellen hin; das Dokument
          wird nicht auf das Kontingent angerechnet.
        </p>
        <p>
          (4) Wir bemühen uns um eine hohe Verfügbarkeit, schulden aber keine bestimmte Verfügbarkeit des Dienstes.
          Wartungen und Störungen bei Dienstleistern (Hosting, KI-Anbieter, Zahlungsdienst) können zu Unterbrechungen
          führen.
        </p>

        <h2>§ 3 Nutzung</h2>
        <p>
          (1) Die Nutzung ist Personen ab 18 Jahren gestattet; Minderjährige benötigen die Zustimmung ihrer
          Erziehungsberechtigten.
        </p>
        <p>
          (2) Laden Sie nur Dokumente hoch, die Sie betreffen oder zu deren Verarbeitung Sie berechtigt sind. Eine
          missbräuchliche Nutzung, insbesondere automatisierte Massenabfragen oder Versuche, Kontingente zu umgehen, ist
          untersagt.
        </p>

        <h2>§ 4 Leistungsumfang, Pakete und Vertragsschluss</h2>
        <p>
          (1) Jeden Kalendermonat können 2 Briefe kostenlos erklärt werden. Zusätzlich sind bis zu 5 Echtheits-Checks
          (Prüfung auf Betrugsmerkmale) pro Monat kostenlos. Nicht genutzte kostenlose Kontingente verfallen am Monatsende.
        </p>
        <p>
          (2) Darüber hinaus bieten wir Pakete zum einmaligen Preis an: „5 Briefe“ und „15 Briefe“. Es handelt sich{' '}
          <strong>nicht um ein Abonnement</strong>; es entstehen keine wiederkehrenden Zahlungen und keine Kündigung ist
          nötig. Die Briefe eines Pakets können 12 Monate ab dem Kauf genutzt werden; danach verfallen nicht genutzte
          Briefe. Kostenlose Briefe werden vor Paket-Briefen verbraucht. Schreiben in Steuersachen (§ 2 Abs. 3) werden nicht
          angerechnet.
        </p>
        <p>
          (3) Die Darstellung der Pakete auf der Website ist kein bindendes Angebot. Durch Klick auf die Schaltfläche zur
          kostenpflichtigen Bestellung auf der Zahlungsseite unseres Zahlungsdienstleisters Stripe geben Sie ein
          verbindliches Angebot ab; der Vertrag kommt mit der Bestätigung der Zahlung zustande. Vertragssprache ist
          Deutsch.
        </p>
        <p>
          (4) {COMPANY.brand} arbeitet ohne Benutzerkonto. Ein Paket wird in dem Browser gutgeschrieben, in dem die Zahlung
          abgeschlossen wurde, und kann nur einmal eingelöst werden. Werden die Websitedaten dieses Browsers gelöscht oder
          ein anderes Gerät genutzt, übertragen wir das verbleibende Guthaben auf Anfrage per E-Mail.
        </p>
        <p>
          (5) Wir speichern den Vertragstext nicht gesondert. Diese AGB können Sie jederzeit auf dieser Seite abrufen und
          ausdrucken oder speichern. Die Zahlungsbestätigung erhalten Sie per E-Mail von Stripe, eine Vertragsbestätigung
          mit Ihrer Erklärung nach § 7 Abs. 2 per E-Mail von uns.
        </p>

        <h2>§ 5 Preise und Zahlung</h2>
        <p>
          (1) Es gelten die bei der Bestellung angegebenen Preise. Alle Preise sind Endpreise; als Kleinunternehmer gemäß
          § 19 UStG berechnen wir keine Umsatzsteuer.
        </p>
        <p>(2) Der Preis eines Pakets ist mit der Bestellung fällig und wird einmalig über Stripe bezahlt.</p>

        <h2>§ 6 Laufzeit</h2>
        <p>
          Der Vertrag über ein Paket endet, wenn alle Briefe des Pakets genutzt sind, spätestens 12 Monate nach dem Kauf.
          Eine Kündigung ist nicht erforderlich.
        </p>

        <h2>§ 7 Widerrufsrecht</h2>
        <p>
          (1) Verbraucherinnen und Verbrauchern steht ein gesetzliches Widerrufsrecht zu. Einzelheiten enthält die{' '}
          <Link href="/widerruf">Widerrufsbelehrung</Link>. Der Widerruf ist auch über die Schaltfläche{' '}
          <Link href="/vertrag?aktion=widerrufen">„Vertrag widerrufen“</Link> möglich.
        </p>
        <p>
          (2) Vor dem Kauf bestätigen Sie ausdrücklich, dass wir vor Ablauf der Widerrufsfrist mit der Leistung beginnen
          sollen. Widerrufen Sie danach, erstatten wir den Kaufpreis abzüglich eines anteiligen Wertersatzes für bereits
          genutzte Briefe. Der Wertersatz beträgt je genutztem Brief den Paketpreis geteilt durch die Zahl der Briefe des
          Pakets (Paket „5 Briefe“: 1,00 € je Brief; Paket „15 Briefe“: 0,67 € je Brief). Kostenlose Briefe werden nicht
          berechnet.
        </p>
        <p>
          (3) Das Widerrufsrecht erlischt, sobald alle Briefe des Pakets genutzt sind und die Leistung damit vollständig
          erbracht ist, wenn Sie vorher ausdrücklich zugestimmt haben, dass wir vor Ablauf der Widerrufsfrist mit der
          Leistung beginnen, und Ihre Kenntnis davon bestätigt haben (§ 356 Abs. 4 BGB).
        </p>

        <h2>§ 8 Haftung</h2>
        <p>
          (1) Wir haften unbeschränkt bei Vorsatz und grober Fahrlässigkeit, bei der Verletzung von Leben, Körper oder
          Gesundheit, nach dem Produkthaftungsgesetz sowie im Umfang einer übernommenen Garantie.
        </p>
        <p>
          (2) Bei leicht fahrlässiger Verletzung einer wesentlichen Vertragspflicht (einer Pflicht, deren Erfüllung die
          ordnungsgemäße Durchführung des Vertrags überhaupt erst ermöglicht und auf deren Einhaltung Sie regelmäßig
          vertrauen dürfen) ist unsere Haftung auf den vertragstypischen, vorhersehbaren Schaden begrenzt. Im Übrigen ist
          die Haftung für leichte Fahrlässigkeit ausgeschlossen.
        </p>
        <p>
          (3) Für den kostenlosen Tarif haften wir – außer in den Fällen des Absatzes 1 – nur für Vorsatz und grobe
          Fahrlässigkeit.
        </p>

        <h2>§ 9 Datenschutz</h2>
        <p>
          Wie wir Daten verarbeiten, erklärt die <Link href="/datenschutz">Datenschutzerklärung</Link>.
        </p>

        <h2>§ 10 Schlussbestimmungen</h2>
        <p>
          (1) Es gilt das Recht der Bundesrepublik Deutschland. Gegenüber Verbraucherinnen und Verbrauchern gilt diese
          Rechtswahl nur, soweit dadurch nicht zwingende Schutzvorschriften des Staates ihres gewöhnlichen Aufenthalts
          entzogen werden.
        </p>
        <p>
          (2) Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
          Verbraucherschlichtungsstelle teilzunehmen.
        </p>
        <p>(3) Sollten einzelne Bestimmungen unwirksam sein, bleibt der Vertrag im Übrigen wirksam.</p>

        <p className={styles.lastUpdated}>Stand: {LEGAL_UPDATED}</p>
      </article>
      <LegalLinks compact />
    </div>
  );
}
