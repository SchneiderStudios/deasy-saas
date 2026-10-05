import React from 'react';
import { COMPANY } from '@/lib/siteConfig';

/**
 * Юридические ссылки — должны быть на КАЖДОЙ странице (§ 5 DDG «unmittelbar erreichbar»,
 * § 312k BGB Kündigungsbutton, § 356a BGB Widerrufsfunktion).
 * Подписи кнопок «Verträge hier kündigen» / «Vertrag widerrufen» заданы законом — не переводить и не менять.
 */
export const LEGAL_LINKS = [
  { href: '/impressum', label: 'Impressum' },
  { href: '/datenschutz', label: 'Datenschutz' },
  { href: '/agb', label: 'AGB' },
  { href: '/widerruf', label: 'Widerrufsbelehrung' },
  { href: '/vertrag?aktion=kuendigen', label: 'Verträge hier kündigen' },
  { href: '/vertrag?aktion=widerrufen', label: 'Vertrag widerrufen' },
];

export default function LegalLinks({ compact = false }: { compact?: boolean }) {
  return (
    <footer
      style={{
        borderTop: '1px solid #e5e7eb',
        padding: compact ? '16px' : '24px 16px',
        marginTop: compact ? 24 : 40,
        textAlign: 'center',
        fontSize: 13,
        color: '#6b7085',
        lineHeight: 1.9,
      }}
    >
      <nav aria-label="Rechtliches" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '4px 16px' }}>
        {LEGAL_LINKS.map((l) => (
          <a key={l.href} href={l.href} style={{ color: '#4b4e5c' }}>
            {l.label}
          </a>
        ))}
        <a href={`mailto:${COMPANY.email}`} style={{ color: '#4b4e5c' }}>
          Kontakt
        </a>
      </nav>
      <div style={{ marginTop: 6 }}>© 2026 {COMPANY.name}</div>
    </footer>
  );
}
