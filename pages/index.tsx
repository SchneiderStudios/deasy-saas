'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from '@/styles/Landing.module.css';
import { translations, Language } from '@/lib/translations';

export default function Home() {
  const [language, setLanguage] = useState<Language>('ru');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedLanguage = localStorage.getItem('deasyLanguage') as Language;
    if (savedLanguage && (savedLanguage === 'de' || savedLanguage === 'ru')) {
      setLanguage(savedLanguage);
    }
    setMounted(true);
  }, []);

  const handleLanguageToggle = () => {
    const newLanguage = language === 'de' ? 'ru' : 'de';
    setLanguage(newLanguage);
    localStorage.setItem('deasyLanguage', newLanguage);
  };

  if (!mounted) return null;

  const t = translations[language];

  return (
    <div className={styles.container}>
      {/* Navigation */}
      <nav className={styles.navbar}>
        <div className={styles.navContent}>
          <div className={styles.logo}>🇩🇪 {t.appTitle}</div>
          <div className={styles.navLinks}>
            <a href="#features">{t.features}</a>
            <a href="#pricing">{t.pricing}</a>
            <a href="#faq">{t.faq}</a>
            <button
              onClick={handleLanguageToggle}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                color: '#666',
                padding: '8px 12px',
              }}
            >
              {language === 'de' ? '🇷🇺 РУ' : '🇩🇪 DE'}
            </button>
            <Link href="/app" className={styles.ctaButton}>
              {t.startFree}
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1>{t.heroTitle}</h1>
          <p>{t.heroSubtitle}</p>
          <Link href="/app" className={styles.heroButton}>
            {t.analyzeButton}
          </Link>
        </div>
        <div className={styles.heroIllustration}>
          <div className={styles.documentIcon}>📄</div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className={styles.features}>
        <h2>{t.featuresTitle}</h2>
        <div className={styles.featureGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>📸</div>
            <h3>{t.feature1Title}</h3>
            <p>{t.feature1Desc}</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>⚡</div>
            <h3>{t.feature2Title}</h3>
            <p>{t.feature2Desc}</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🎯</div>
            <h3>{t.feature3Title}</h3>
            <p>{t.feature3Desc}</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>💬</div>
            <h3>{t.feature4Title}</h3>
            <p>{t.feature4Desc}</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>📁</div>
            <h3>{t.feature5Title}</h3>
            <p>{t.feature5Desc}</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🔒</div>
            <h3>{t.feature6Title}</h3>
            <p>{t.feature6Desc}</p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className={styles.pricing}>
        <h2>{t.pricingTitle}</h2>
        <div className={styles.pricingGrid}>
          <div className={styles.pricingCard}>
            <h3>{t.planFree}</h3>
            <div className={styles.price}>{t.planFreePrice}<span>{t.planFreePeriod}</span></div>
            <ul>
              <li>{t.planFreeFeature1}</li>
              <li>{t.planFreeFeature2}</li>
              <li>{t.planFreeFeature3}</li>
            </ul>
            <Link href="/app" className={styles.pricingButton}>
              {t.planFreeButton}
            </Link>
          </div>

          <div className={styles.pricingCard + ' ' + styles.featured}>
            <div className={styles.badge}>{t.planProBadge}</div>
            <h3>{t.planPro}</h3>
            <div className={styles.price}>{t.planProPrice}<span>{t.planProPeriod}</span></div>
            <ul>
              <li>{t.planProFeature1}</li>
              <li>{t.planProFeature2}</li>
              <li>{t.planProFeature3}</li>
              <li>{t.planProFeature4}</li>
            </ul>
            <a href="https://buy.stripe.com/REPLACE_WITH_YOUR_MONTHLY_LINK" target="_blank" rel="noopener noreferrer" className={styles.pricingButton}>
              {t.planProButton}
            </a>
          </div>

          <div className={styles.pricingCard}>
            <h3>{t.planBusiness}</h3>
            <div className={styles.price}>{language === 'de' ? 'Maßgeschneidert' : 'Индивидуально'}<span></span></div>
            <ul>
              <li>{t.planBusinessFeature1}</li>
              <li>{t.planBusinessFeature2}</li>
              <li>{t.planBusinessFeature3}</li>
              <li>{t.planBusinessFeature4}</li>
            </ul>
            <a href="mailto:info@deasy.de?subject=Business%20Plan%20Anfrage%20-%20API%20Zugang" className={styles.pricingButton}>
              {language === 'de' ? '📧 Anfrage senden' : '📧 Отправить запрос'}
            </a>
            <p style={{ fontSize: '0.85rem', color: '#4b4e5c', marginTop: '0.5rem' }}>
              {language === 'de' ? 'Mit API-Zugang & White-Label' : 'С API-доступом и White-Label'}
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className={styles.faq}>
        <h2>{t.faqTitle}</h2>
        <div className={styles.faqList}>
          <details className={styles.faqItem}>
            <summary>{t.faqQ1}</summary>
            <p>{t.faqA1}</p>
          </details>
          <details className={styles.faqItem}>
            <summary>{t.faqQ2}</summary>
            <p>{t.faqA2}</p>
          </details>
          <details className={styles.faqItem}>
            <summary>{t.faqQ3}</summary>
            <p>{t.faqA3}</p>
          </details>
          <details className={styles.faqItem}>
            <summary>{t.faqQ4}</summary>
            <p>{t.faqA4}</p>
          </details>
          <details className={styles.faqItem}>
            <summary>{t.faqQ5}</summary>
            <p>{t.faqA5}</p>
          </details>
          <details className={styles.faqItem}>
            <summary>{t.faqQ6}</summary>
            <p>{t.faqA6}</p>
          </details>
        </div>
      </section>

      {/* CTA Footer */}
      <section className={styles.ctaFooter}>
        <h2>{t.ctaTitle}</h2>
        <p>{t.ctaSubtitle}</p>
        <Link href="/app" className={styles.ctaButtonLarge}>
          {t.ctaButton}
        </Link>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div>
            <strong>{t.footerCompanyName}</strong>
            <p>{t.footerCompanyDesc}</p>
          </div>
          <div>
            <h4>{t.footerLinksTitle}</h4>
            <ul>
              <li>
                <a href="/datenschutz">{t.footerPrivacy}</a>
              </li>
              <li>
                <a href="/impressum">{t.footerImprint}</a>
              </li>
              <li>
                <a href="mailto:info@deasy.de">{t.footerContact}</a>
              </li>
            </ul>
          </div>
          <div>
            <h4>{t.footerSocialTitle}</h4>
            <ul>
              <li>
                <a href="https://twitter.com/deasy_de" target="_blank">
                  {t.footerTwitter}
                </a>
              </li>
              <li>
                <a href="https://github.com/deasy-ai" target="_blank">
                  {t.footerGithub}
                </a>
              </li>
            </ul>
          </div>
        </div>
        <p className={styles.footerCopy}>{t.footerCopyright}</p>
      </footer>
    </div>
  );
}
