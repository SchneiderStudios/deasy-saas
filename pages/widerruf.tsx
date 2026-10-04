import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import styles from '@/styles/Legal.module.css';
import LegalLinks from '@/components/LegalLinks';
import { COMPANY, LEGAL_UPDATED } from '@/lib/siteConfig';

export default function Widerruf() {
  const addressBlock = (
    <>
      {COMPANY.name}
      <br />
      {COMPANY.street}
      <br />
      {COMPANY.zipCity}
      <br />
      E-Mail: <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>
    </>
  );

  return (
    <div className={styles.container}>
      <Head>
        <title>Widerrufsbelehrung – {COMPANY.brand}</title>
        <meta name="robots" content="noindex" />
      </Head>

      <nav className={styles.nav}>
        <Link href="/">← Zurück zur Startseite</Link>
      </nav>

      <article className={styles.content}>
        <h1>Widerrufsbelehrung</h1>
        <p>Verbraucherinnen und Verbrauchern steht ein Widerrufsrecht nach folgender Maßgabe zu:</p>

        <h2>Widerrufsrecht</h2>
        <p>Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen.</p>
        <p>Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag des Vertragsabschlusses.</p>
        <p>
          Um Ihr Widerrufsrecht auszuüben, müssen Sie uns
          <br />
          {addressBlock}
          <br />
          mittels einer eindeutigen Erklärung (z. B. ein mit der Post versandter Brief oder eine E-Mail) über Ihren
          Entschluss, diesen Vertrag zu widerrufen, informieren. Sie können dafür das unten stehende
          Muster-Widerrufsformular verwenden, das jedoch nicht vorgeschrieben ist.
        </p>
        <p>
          Sie können den Widerruf auch über die Schaltfläche{' '}
          <Link href="/vertrag?aktion=widerrufen">„Vertrag widerrufen“</Link> auf unserer Website erklären. Machen Sie
          von dieser Möglichkeit Gebrauch, so übermitteln wir Ihnen unverzüglich per E-Mail eine Bestätigung über den
          Eingang des Widerrufs mit Datum und Uhrzeit.
        </p>
        <p>
          Zur Wahrung der Widerrufsfrist reicht es aus, dass Sie die Mitteilung über die Ausübung des Widerrufsrechts vor
          Ablauf der Widerrufsfrist absenden.
        </p>

        <h2>Folgen des Widerrufs</h2>
        <p>
          Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir von Ihnen erhalten haben,
          unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag zurückzuzahlen, an dem die Mitteilung über Ihren
          Widerruf dieses Vertrags bei uns eingegangen ist. Für diese Rückzahlung verwenden wir dasselbe Zahlungsmittel,
          das Sie bei der ursprünglichen Transaktion eingesetzt haben, es sei denn, mit Ihnen wurde ausdrücklich etwas
          anderes vereinbart; in keinem Fall werden Ihnen wegen dieser Rückzahlung Entgelte berechnet.
        </p>
        <p>
          Haben Sie verlangt, dass die Dienstleistungen während der Widerrufsfrist beginnen sollen, so haben Sie uns einen
          angemessenen Betrag zu zahlen, der dem Anteil der bis zu dem Zeitpunkt, zu dem Sie uns von der Ausübung des
          Widerrufsrechts hinsichtlich dieses Vertrags unterrichten, bereits erbrachten Dienstleistungen im Vergleich zum
          Gesamtumfang der im Vertrag vorgesehenen Dienstleistungen entspricht.
        </p>

        <h2>Muster-Widerrufsformular</h2>
        <p>
          (Wenn Sie den Vertrag widerrufen wollen, dann füllen Sie bitte dieses Formular aus und senden Sie es zurück.)
        </p>
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '12px 16px', background: '#fafbfc' }}>
          <p>
            An:
            <br />
            {addressBlock}
          </p>
          <p>
            Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über die Erbringung der
            folgenden Dienstleistung (*): ______________________
          </p>
          <p>Bestellt am (*) / erhalten am (*): ______________________</p>
          <p>Name des/der Verbraucher(s): ______________________</p>
          <p>Anschrift des/der Verbraucher(s): ______________________</p>
          <p>Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier): ______________________</p>
          <p>Datum: ______________________</p>
          <p style={{ fontSize: 13 }}>(*) Unzutreffendes streichen.</p>
        </div>

        <p className={styles.lastUpdated}>Stand: {LEGAL_UPDATED}</p>
      </article>
      <LegalLinks compact />
    </div>
  );
}
