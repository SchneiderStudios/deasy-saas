import React from 'react';
import Link from 'next/link';
import styles from '@/styles/Landing.module.css';

export default function Home() {
  return (
    <div className={styles.container}>
      {/* Navigation */}
      <nav className={styles.navbar}>
        <div className={styles.navContent}>
          <div className={styles.logo}>🇩🇪 DEASY</div>
          <div className={styles.navLinks}>
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <a href="#faq">FAQ</a>
            <Link href="/app" className={styles.ctaButton}>
              Start Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1>Verstehe deine Behördenbriefe mit KI</h1>
          <p>
            DEASY hilft dir, deutsche Bürokratiebriefe in 30 Sekunden zu verstehen.
            Fristen, nächste Schritte, einfach erklärt.
          </p>
          <Link href="/app" className={styles.heroButton}>
            Dokument analysieren →
          </Link>
        </div>
        <div className={styles.heroIllustration}>
          <div className={styles.documentIcon}>📄</div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className={styles.features}>
        <h2>Wie funktioniert's?</h2>
        <div className={styles.featureGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>📸</div>
            <h3>1. Dokument hochladen</h3>
            <p>Fotografiere deinen Brief oder lade eine Datei hoch</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>⚡</div>
            <h3>2. KI analysiert</h3>
            <p>Claude Vision liest die Behörden-DNA in 30 Sekunden</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🎯</div>
            <h3>3. Ergebnisse</h3>
            <p>Zusammenfassung, Fristen, Nächste Schritte, auf Deutsch</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>💬</div>
            <h3>4. Chat mit KI</h3>
            <p>Stelle Fragen zu deinem Brief, KI antwortet</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>📁</div>
            <h3>5. Alle Fälle tracken</h3>
            <p>Organisiere Dokumente in Cases (Pro+)</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🔒</div>
            <h3>6. Datenschutz</h3>
            <p>DSGVO-konform, deine Daten sind sicher</p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className={styles.pricing}>
        <h2>Transparent Pricing</h2>
        <div className={styles.pricingGrid}>
          <div className={styles.pricingCard}>
            <h3>Free</h3>
            <div className={styles.price}>€0<span>/Monat</span></div>
            <ul>
              <li>✓ 5 Dokumente/Monat</li>
              <li>✓ Unbegrenzter Chat</li>
              <li>✓ Basis-Analyse</li>
            </ul>
            <Link href="/app" className={styles.pricingButton}>
              Jetzt starten
            </Link>
          </div>

          <div className={styles.pricingCard + ' ' + styles.featured}>
            <div className={styles.badge}>Beliebt</div>
            <h3>Pro</h3>
            <div className={styles.price}>€9,99<span>/Monat</span></div>
            <ul>
              <li>✓ 100 Dokumente/Monat</li>
              <li>✓ Fälle-Tracking</li>
              <li>✓ Export in PDF</li>
              <li>✓ Priority Support</li>
            </ul>
            <a href="/checkout?plan=pro" className={styles.pricingButton}>
              Pro aktivieren
            </a>
          </div>

          <div className={styles.pricingCard}>
            <h3>Business</h3>
            <div className={styles.price}>€49,99<span>/Monat</span></div>
            <ul>
              <li>✓ Unlimited Dokumente</li>
              <li>✓ Team-Zugang (bis 5 User)</li>
              <li>✓ API-Zugang</li>
              <li>✓ White-Label-Option</li>
            </ul>
            <a href="/checkout?plan=business" className={styles.pricingButton}>
              Business aktivieren
            </a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className={styles.faq}>
        <h2>Häufig gefragt</h2>
        <div className={styles.faqList}>
          <details className={styles.faqItem}>
            <summary>Welche Dateiformate werden unterstützt?</summary>
            <p>JPG, PNG, GIF, WebP, PDF bis 10 MB. Neue Formate folgen bald.</p>
          </details>
          <details className={styles.faqItem}>
            <summary>Ist mein Dokument sicher?</summary>
            <p>
              Ja! Dein Brief wird verschlüsselt übertragen, einmal analysiert und nicht
              dauerhaft gespeichert. Details in unserer Datenschutzerklärung.
            </p>
          </details>
          <details className={styles.faqItem}>
            <summary>Kann ich mein Abo kündigen?</summary>
            <p>Ja, jederzeit ohne Kündigungsfrist. Deine Dokumente bleiben erhalten.</p>
          </details>
          <details className={styles.faqItem}>
            <summary>Gibt es eine kostenlosen Trial?</summary>
            <p>Ja! Das Free-Plan ist zeitlich unbegrenzt (5 Dokumente/Monat).</p>
          </details>
          <details className={styles.faqItem}>
            <summary>Wie viel kostet die API?</summary>
            <p>
              Business-Kunden bekommen API-Zugang für €49,99/Monat. Maßgeschneiderte
              Enterprise-Lösungen auf Anfrage.
            </p>
          </details>
          <details className={styles.faqItem}>
            <summary>Akzeptiert ihr internationale Briefe?</summary>
            <p>
              Momentan nur deutsche Briefe (beste Qualität). Internationale Varianten
              folgen Anfang 2027.
            </p>
          </details>
        </div>
      </section>

      {/* CTA Footer */}
      <section className={styles.ctaFooter}>
        <h2>Bereit für weniger Bürokratie-Stress?</h2>
        <p>Starte jetzt kostenlos. Kein Zahlungsmittel erforderlich.</p>
        <Link href="/app" className={styles.ctaButtonLarge}>
          Kostenlos starten →
        </Link>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div>
            <strong>DEASY</strong>
            <p>KI-Assistent für deutsche Bürokratie</p>
          </div>
          <div>
            <h4>Links</h4>
            <ul>
              <li>
                <a href="/datenschutz">Datenschutz</a>
              </li>
              <li>
                <a href="/impressum">Impressum</a>
              </li>
              <li>
                <a href="mailto:info@deasy.de">Kontakt</a>
              </li>
            </ul>
          </div>
          <div>
            <h4>Sozial</h4>
            <ul>
              <li>
                <a href="https://twitter.com/deasy_de" target="_blank">
                  Twitter
                </a>
              </li>
              <li>
                <a href="https://github.com/deasy-ai" target="_blank">
                  GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>
        <p className={styles.footerCopy}>© 2024 DEASY. All rights reserved.</p>
      </footer>
    </div>
  );
}
