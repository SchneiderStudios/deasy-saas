import type { NextApiRequest, NextApiResponse } from 'next';
import { COMPANY } from '@/lib/siteConfig';
import { sendMail, mailConfigured, ownerEmail } from '@/lib/mail';

/**
 * Kündigung (§ 312k BGB) и Widerruf (§ 356a BGB) через сайт.
 * POST /api/vertrag
 *   { aktion: 'kuendigen'|'widerrufen', name, email, tarif, art?, grund?, zeitpunkt?, datum?, bestelldatum?, website? (honeypot) }
 * → { success: true, eingang: ISO, eingangText, stripe: 'cancelled'|'scheduled'|'not_found'|'skipped'|'error' }
 *
 * Подтверждение «unverzüglich in Textform» отправляется письмом через lib/mail.ts (Gmail или Resend).
 * Отмена подписки в Stripe — если STRIPE_SECRET_KEY имеет право Subscriptions: Write.
 */

const STRIPE_API = process.env.STRIPE_API_BASE || 'https://api.stripe.com/v1';

type Aktion = 'kuendigen' | 'widerrufen';
type StripeResult = 'cancelled' | 'scheduled' | 'not_found' | 'skipped' | 'error';

const clean = (v: unknown, max = 300) => String(v ?? '').replace(/[\r\n]+/g, ' ').trim().slice(0, max);
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
const berlin = (d: Date) =>
  d.toLocaleString('de-DE', { timeZone: 'Europe/Berlin', dateStyle: 'long', timeStyle: 'medium' }) + ' Uhr (MEZ/MESZ)';

async function stripe(method: 'GET' | 'POST' | 'DELETE', path: string, body?: Record<string, string>) {
  const key = process.env.STRIPE_SECRET_KEY as string;
  const res = await fetch(`${STRIPE_API}/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      ...(body ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
    },
    body: body ? new URLSearchParams(body).toString() : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message || `Stripe ${res.status}`);
  return data;
}

/** Находит активные подписки по e-mail и отменяет их (Kündigung — к концу периода, Widerruf — сразу). */
async function cancelInStripe(email: string, aktion: Aktion, sofort: boolean): Promise<StripeResult> {
  if (!process.env.STRIPE_SECRET_KEY) return 'skipped';
  try {
    const customers = await stripe('GET', `customers?email=${encodeURIComponent(email)}&limit=10`);
    const subs: any[] = [];
    for (const c of customers.data || []) {
      const list = await stripe('GET', `subscriptions?customer=${c.id}&status=active&limit=10`);
      subs.push(...(list.data || []));
    }
    if (subs.length === 0) return 'not_found';
    for (const s of subs) {
      if (aktion === 'widerrufen' || sofort) await stripe('DELETE', `subscriptions/${s.id}`);
      else await stripe('POST', `subscriptions/${s.id}`, { cancel_at_period_end: 'true' });
    }
    return aktion === 'widerrufen' || sofort ? 'cancelled' : 'scheduled';
  } catch (e: any) {
    console.error('Stripe-Kündigung fehlgeschlagen:', e?.message);
    return 'error';
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  const b = req.body || {};
  if (b.website) return res.status(200).json({ success: true }); // honeypot для ботов

  const aktion: Aktion = b.aktion === 'widerrufen' ? 'widerrufen' : 'kuendigen';
  const name = clean(b.name, 120);
  const email = clean(b.email, 200).toLowerCase();
  const tarif = clean(b.tarif, 40) || 'DEASY Abonnement';
  const art = b.art === 'ausserordentlich' ? 'außerordentliche Kündigung' : 'ordentliche Kündigung';
  const grund = clean(b.grund, 1000);
  const zeitpunkt = b.zeitpunkt === 'datum' && clean(b.datum, 20) ? `zum ${clean(b.datum, 20)}` : 'zum nächstmöglichen Zeitpunkt';
  const bestelldatum = clean(b.bestelldatum, 20);

  if (!name || !isEmail(email)) {
    return res.status(400).json({ success: false, error: 'Bitte Namen und eine gültige E-Mail-Adresse angeben.' });
  }
  if (b.art === 'ausserordentlich' && !grund) {
    return res.status(400).json({ success: false, error: 'Bitte den Grund der außerordentlichen Kündigung angeben.' });
  }
  if (!mailConfigured()) {
    console.error('E-Mail-Versand nicht konfiguriert – Bestätigung kann nicht versendet werden');
    return res.status(503).json({
      success: false,
      error: `Die Online-Erklärung ist gerade nicht verfügbar. Bitte senden Sie Ihre Erklärung per E-Mail an ${COMPANY.email}.`,
    });
  }

  const eingang = new Date();
  const eingangText = berlin(eingang);
  const stripeResult = await cancelInStripe(email, aktion, b.art === 'ausserordentlich');

  const titel = aktion === 'widerrufen' ? 'Widerruf' : 'Kündigung';
  const inhalt =
    aktion === 'widerrufen'
      ? [`Erklärung: Widerruf des Vertrags`, `Vertrag: ${tarif}`, bestelldatum && `Bestellt am: ${bestelldatum}`]
      : [`Erklärung: ${art}`, `Vertrag: ${tarif}`, `Beendigung: ${zeitpunkt}`, grund && `Grund: ${grund}`];
  const lines = [`Name: ${name}`, `E-Mail: ${email}`, ...inhalt.filter(Boolean), `Eingang: ${eingangText}`];

  const kunde = [
    `Guten Tag ${name},`,
    '',
    `wir bestätigen den Eingang Ihrer folgenden ${titel}serklärung:`,
    '',
    ...lines,
    '',
    aktion === 'widerrufen'
      ? 'Ihr Vertrag ist damit beendet. Den Kaufpreis erstatten wir spätestens binnen 14 Tagen über das ursprüngliche Zahlungsmittel. Haben Sie bereits Briefe aus dem Paket genutzt, ziehen wir dafür gemäß Widerrufsbelehrung einen anteiligen Betrag ab (Paketpreis geteilt durch die Zahl der Briefe, je genutztem Brief).'
      : 'Ihr Abonnement endet zum genannten Zeitpunkt; bis dahin bleibt Ihr Tarif nutzbar. Es erfolgen keine weiteren Abbuchungen.',
    '',
    'Mit freundlichen Grüßen',
    `${COMPANY.name} – ${COMPANY.brand}`,
    `${COMPANY.street}, ${COMPANY.zipCity}`,
    COMPANY.email,
  ].join('\n');

  const stripeHinweis: Record<StripeResult, string> = {
    cancelled: 'Stripe: Abo sofort beendet.',
    scheduled: 'Stripe: Abo zum Periodenende gekündigt (cancel_at_period_end).',
    not_found: 'Stripe: kein Abo (Paketkauf) – Erstattung bitte manuell, siehe unten.',
    skipped: 'Stripe: nicht automatisch geprüft – bitte manuell erledigen, siehe unten.',
    error: 'Stripe: FEHLER – bitte manuell kündigen!',
  };
  const owner = [
    `${titel} über die Website eingegangen.`,
    '',
    ...lines,
    '',
    stripeHinweis[stripeResult],
    aktion === 'widerrufen'
      ? [
          'TODO binnen 14 Tagen: Stripe → Zahlungen → Zahlung dieser E-Mail suchen → Erstatten.',
          'Anteilig: Paketpreis ÷ Briefe × genutzte Briefe abziehen (5 Briefe: 1,00 €/Brief, 15 Briefe: 0,67 €/Brief).',
          'Genutzte Briefe beim Kunden erfragen, falls unklar. Alle Briefe genutzt + Zustimmung beim Kauf → Widerrufsrecht erloschen.',
        ].join('\n')
      : '',
  ].join('\n');

  try {
    const betreff = aktion === 'widerrufen' ? 'Ihres Widerrufs' : 'Ihrer Kündigung';
    await sendMail(email, `Eingangsbestätigung ${betreff} – ${COMPANY.brand}`, kunde, COMPANY.email);
    await sendMail(ownerEmail(), `[${COMPANY.brand}] ${titel}: ${name}`, owner, email);
  } catch (e: any) {
    console.error('Bestätigungsmail fehlgeschlagen:', e?.message);
    return res.status(502).json({
      success: false,
      error: `Die Bestätigung konnte nicht versendet werden. Bitte senden Sie Ihre Erklärung zusätzlich per E-Mail an ${COMPANY.email}.`,
    });
  }

  return res.status(200).json({ success: true, eingang: eingang.toISOString(), eingangText, lines, stripe: stripeResult });
}
