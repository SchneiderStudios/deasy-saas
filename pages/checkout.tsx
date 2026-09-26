import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import styles from '@/styles/Checkout.module.css';

export default function Checkout() {
  const router = useRouter();
  const { plan } = router.query;
  const [loading, setLoading] = useState(false);

  const plans = {
    pro: {
      name: 'Pro',
      price: '9,99',
      description: '100 Dokumente/Monat',
      stripeLink: 'https://buy.stripe.com/test_YOUR_PRO_LINK_HERE',
    },
    business: {
      name: 'Business',
      price: '49,99',
      description: 'Unlimited Dokumente + Team-Zugang',
      stripeLink: 'https://buy.stripe.com/test_YOUR_BUSINESS_LINK_HERE',
    },
  };

  const selectedPlan = plans[plan as keyof typeof plans];

  const handleStripeCheckout = () => {
    if (!selectedPlan) return;
    setLoading(true);
    // Stripe Payment Link wird in neuem Tab geöffnet
    window.open(selectedPlan.stripeLink, '_blank');
    setLoading(false);
  };

  return (
    <div className={styles.container}>
      <nav className={styles.navbar}>
        <Link href="/">← Zurück zur Startseite</Link>
      </nav>

      <div className={styles.content}>
        {selectedPlan ? (
          <div className={styles.checkoutCard}>
            <h1>Upgrade zu {selectedPlan.name}</h1>

            <div className={styles.planDetails}>
              <div className={styles.price}>
                €{selectedPlan.price}<span>/Monat</span>
              </div>
              <p className={styles.description}>{selectedPlan.description}</p>

              <div className={styles.features}>
                <h3>Das ist im Plan enthalten:</h3>
                {plan === 'pro' && (
                  <ul>
                    <li>✓ 100 Dokumente pro Monat</li>
                    <li>✓ Unbegrenzter Chat mit KI</li>
                    <li>✓ Fälle-Tracking (bis 10 Fälle)</li>
                    <li>✓ Export in PDF</li>
                    <li>✓ Email-Support</li>
                    <li>✓ Jederzeit kündbar</li>
                  </ul>
                )}
                {plan === 'business' && (
                  <ul>
                    <li>✓ Unbegrenzte Dokumente</li>
                    <li>✓ Team-Zugang (bis 5 User)</li>
                    <li>✓ Unlimited Fälle-Tracking</li>
                    <li>✓ API-Zugang (Beta)</li>
                    <li>✓ White-Label-Option</li>
                    <li>✓ Priority Phone Support</li>
                    <li>✓ Dedicated Account Manager</li>
                    <li>✓ Jederzeit kündbar</li>
                  </ul>
                )}
              </div>

              <button
                className={styles.payButton}
                onClick={handleStripeCheckout}
                disabled={loading}
              >
                {loading ? 'Wird weitergeleitet...' : 'Mit Stripe zahlen →'}
              </button>

              <p className={styles.note}>
                Du wirst zu Stripe weitergeleitet für sichere Zahlungsabwicklung.
              </p>
            </div>
          </div>
        ) : (
          <div className={styles.error}>
            <p>Plan nicht gefunden.</p>
            <Link href="/">← Zurück zur Startseite</Link>
          </div>
        )}

        <div className={styles.faq}>
          <h2>Fragen zur Zahlung?</h2>
          <details>
            <summary>Welche Zahlungsmethoden werden akzeptiert?</summary>
            <p>
              Stripe akzeptiert Kreditkarten (Visa, Mastercard, American Express),
              SEPA-Lastschrift, Giropay und viele weitere Methoden.
            </p>
          </details>
          <details>
            <summary>Ist meine Zahlung sicher?</summary>
            <p>
              Ja! Wir nutzen Stripe, ein zertifizierter PCI-DSS-Level-1-Zahlungsanbieter.
              Deine Zahlungsdaten sind vollständig verschlüsselt.
            </p>
          </details>
          <details>
            <summary>Kann ich mein Abo kündigen?</summary>
            <p>
              Ja, jederzeit ohne Kündigungsfrist. Du kannst dein Abo in den
              Kontoeinstellungen selbst kündigen oder uns eine E-Mail schreiben.
            </p>
          </details>
        </div>
      </div>
    </div>
  );
}
