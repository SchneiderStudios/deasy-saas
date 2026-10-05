import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import styles from '@/styles/Legal.module.css';
import LegalLinks from '@/components/LegalLinks';
import { COMPANY } from '@/lib/siteConfig';

/**
 * § 312k BGB «Verträge hier kündigen» → Bestätigungsseite → «jetzt kündigen»
 * § 356a BGB «Vertrag widerrufen» → Eingabe → «Widerruf bestätigen»
 * Подписи кнопок заданы законом — не менять. Страница доступна без входа в аккаунт.
 */

type Aktion = 'kuendigen' | 'widerrufen';

interface Done {
  eingangText: string;
  lines: string[];
}

const field: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '12px 14px',
  borderRadius: 10,
  border: '1px solid #d6d9e1',
  fontSize: 16,
  fontFamily: 'inherit',
  marginTop: 6,
};
const labelStyle: React.CSSProperties = { display: 'block', fontWeight: 600, fontSize: 14, marginTop: 16, color: '#1c2340' };
const primary: React.CSSProperties = {
  marginTop: 24,
  width: '100%',
  padding: '14px 18px',
  borderRadius: 12,
  border: 'none',
  background: '#b42318',
  color: '#fff',
  fontSize: 17,
  fontWeight: 700,
  cursor: 'pointer',
};

export default function Vertrag() {
  const router = useRouter();
  const [aktion, setAktion] = useState<Aktion>('kuendigen');
  const [form, setForm] = useState({
    name: '',
    email: '',
    tarif: 'DEASY Plus',
    art: 'ordentlich',
    grund: '',
    zeitpunkt: 'naechstmoeglich',
    datum: '',
    bestelldatum: '',
    website: '',
  });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Done | null>(null);

  useEffect(() => {
    if (router.query.aktion === 'widerrufen') setAktion('widerrufen');
    else if (router.query.aktion === 'kuendigen') setAktion('kuendigen');
  }, [router.query.aktion]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const switchTo = (a: Aktion) => {
    setAktion(a);
    setError(null);
    router.replace({ pathname: '/vertrag', query: { aktion: a } }, undefined, { shallow: true });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError(null);
    try {
      const res = await fetch('/api/vertrag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aktion, ...form }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.error || 'Die Erklärung konnte nicht übermittelt werden.');
      setDone({ eingangText: data.eingangText, lines: data.lines || [] });
      window.scrollTo({ top: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSending(false);
    }
  };

  const titel = aktion === 'widerrufen' ? 'Widerruf' : 'Kündigung';
  const saveFile = () => {
    if (!done) return;
    const text = [
      `${titel} – ${COMPANY.brand}`,
      `Abgegeben durch Betätigen der Schaltfläche „${aktion === 'widerrufen' ? 'Widerruf bestätigen' : 'jetzt kündigen'}“ auf ${typeof window !== 'undefined' ? window.location.host : ''}`,
      '',
      ...done.lines,
      '',
      `Empfänger: ${COMPANY.name}, ${COMPANY.street}, ${COMPANY.zipCity}, ${COMPANY.email}`,
    ].join('\n');
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `${titel}_${COMPANY.brand}_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>{aktion === 'widerrufen' ? 'Vertrag widerrufen' : 'Verträge hier kündigen'} – {COMPANY.brand}</title>
        <meta name="robots" content="noindex" />
      </Head>

      <nav className={styles.nav}>
        <Link href="/">← Zurück zur Startseite</Link>
      </nav>

      <article className={styles.content}>
        {done ? (
          <>
            <h1>✅ {titel} eingegangen</h1>
            <p>
              Ihre Erklärung ist am <strong>{done.eingangText}</strong> bei uns eingegangen. Eine Eingangsbestätigung haben
              wir an Ihre E-Mail-Adresse gesendet.
            </p>
            <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: '12px 16px', background: '#fafbfc' }}>
              {done.lines.map((l) => (
                <div key={l}>{l}</div>
              ))}
            </div>
            <p style={{ marginTop: 16 }}>
              Bitte speichern Sie diese Erklärung mit Datum und Uhrzeit:
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={saveFile} style={{ ...primary, background: '#4338ca', width: 'auto', marginTop: 0 }}>
                ⬇️ Als Datei speichern
              </button>
              <button onClick={() => window.print()} style={{ ...primary, background: '#fff', color: '#4338ca', border: '1px solid #4338ca', width: 'auto', marginTop: 0 }}>
                🖨️ Drucken / als PDF
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
              {(['kuendigen', 'widerrufen'] as Aktion[]).map((a) => (
                <button
                  key={a}
                  onClick={() => switchTo(a)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 999,
                    border: '1px solid #4338ca',
                    background: aktion === a ? '#4338ca' : '#fff',
                    color: aktion === a ? '#fff' : '#4338ca',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {a === 'kuendigen' ? 'Verträge hier kündigen' : 'Vertrag widerrufen'}
                </button>
              ))}
            </div>

            <h1>{aktion === 'kuendigen' ? 'Abonnement kündigen' : 'Vertrag widerrufen'}</h1>
            <p>
              {aktion === 'kuendigen'
                ? 'Kündigen Sie Ihr DEASY-Abonnement hier ohne Anmeldung. Bei einer ordentlichen Kündigung endet es zum Ende des laufenden bezahlten Monats.'
                : 'Innerhalb von 14 Tagen nach Vertragsschluss können Sie Ihren Vertrag ohne Angabe von Gründen widerrufen (siehe Widerrufsbelehrung).'}
            </p>
            <p style={{ fontSize: 14, color: '#4b4e5c' }}>
              Kostenloser Tarif? Dafür ist keine Kündigung nötig – es besteht kein kostenpflichtiger Vertrag.
            </p>

            <form onSubmit={submit}>
              {aktion === 'kuendigen' && (
                <>
                  <label style={labelStyle}>
                    Art der Kündigung
                    <select value={form.art} onChange={set('art')} style={field}>
                      <option value="ordentlich">Ordentliche Kündigung</option>
                      <option value="ausserordentlich">Außerordentliche Kündigung (aus wichtigem Grund)</option>
                    </select>
                  </label>
                  {form.art === 'ausserordentlich' && (
                    <label style={labelStyle}>
                      Kündigungsgrund
                      <textarea value={form.grund} onChange={set('grund')} required rows={3} style={field} />
                    </label>
                  )}
                </>
              )}

              <label style={labelStyle}>
                Vor- und Nachname
                <input value={form.name} onChange={set('name')} required autoComplete="name" style={field} />
              </label>

              <label style={labelStyle}>
                E-Mail-Adresse (wie bei der Zahlung angegeben)
                <input type="email" value={form.email} onChange={set('email')} required autoComplete="email" style={field} />
                <span style={{ fontWeight: 400, fontSize: 13, color: '#6b7085' }}>
                  Dient der Zuordnung des Vertrags; an diese Adresse senden wir die Eingangsbestätigung.
                </span>
              </label>

              <label style={labelStyle}>
                Vertrag
                <select value={form.tarif} onChange={set('tarif')} style={field}>
                  <option>DEASY Plus</option>
                  <option>DEASY Pro</option>
                </select>
              </label>

              {aktion === 'kuendigen' && form.art === 'ordentlich' && (
                <>
                  <label style={labelStyle}>
                    Zeitpunkt
                    <select value={form.zeitpunkt} onChange={set('zeitpunkt')} style={field}>
                      <option value="naechstmoeglich">Zum nächstmöglichen Zeitpunkt</option>
                      <option value="datum">Zu einem bestimmten Datum</option>
                    </select>
                  </label>
                  {form.zeitpunkt === 'datum' && (
                    <label style={labelStyle}>
                      Datum
                      <input type="date" value={form.datum} onChange={set('datum')} required style={field} />
                    </label>
                  )}
                </>
              )}

              {aktion === 'widerrufen' && (
                <label style={labelStyle}>
                  Bestellt am (optional)
                  <input type="date" value={form.bestelldatum} onChange={set('bestelldatum')} style={field} />
                </label>
              )}

              {/* Honeypot: скрытое поле для ботов */}
              <input
                tabIndex={-1}
                autoComplete="off"
                value={form.website}
                onChange={set('website')}
                aria-hidden="true"
                style={{ position: 'absolute', left: '-9999px', width: 1, height: 1 }}
              />

              {error && (
                <p style={{ color: '#b42318', background: '#fef3f2', border: '1px solid #fecdca', borderRadius: 10, padding: '10px 12px', marginTop: 16 }}>
                  {error}
                </p>
              )}

              <button type="submit" disabled={sending} style={{ ...primary, opacity: sending ? 0.6 : 1 }}>
                {sending ? 'Wird übermittelt…' : aktion === 'kuendigen' ? 'jetzt kündigen' : 'Widerruf bestätigen'}
              </button>
            </form>
          </>
        )}
      </article>
      <LegalLinks compact />
    </div>
  );
}
