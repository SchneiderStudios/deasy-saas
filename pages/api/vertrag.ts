import type { NextApiRequest, NextApiResponse } from 'next';
import { COMPANY } from '@/lib/siteConfig';

/**
 * Kündigung (§ 312k BGB) и Widerruf (§ 356a BGB) через сайт.
 * POST /api/vertrag
 *   { aktion: 'kuendigen'|'widerrufen', name, email, tarif, art?, grund?, zeitpunkt?, datum?, bestelldatum?, website? (honeypot) }
 * → { success: true, eingang: ISO, eingangText, stripe: 'cancelled'|'scheduled'|'not_found'|'skipped'|'error' }
 *
 * Подтверждение «unverzüglich in Textform» отправляется письмом через Resend:
 *   RESEND_API_KEY, MAIL_FROM (например "DEASY <noreply@ваш-домен.de>"), OWNER_EMAIL (куда приходят заявки)
 * Отмена подписки в Stripe — если STRIPE_SECRET_KEY имеет право Subscriptions: Write.
 */

const STRIPE_API = process.env.STRIPE_API_BASE || 'https://api.stripe.com/v1';
const RESEND_API = process.env.RESEND_API_BASE || 'https://api.resend.com';

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

async function sendMail(to: string, subject: string, text: string, replyTo?: string) {
  const res = await fetch(`${RESEND_API}/emails`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: process.env.MAIL_FROM, to: [to], subject, text, ...(replyTo ? { reply_to: replyTo } : {}) }),
  });
  if (!res.ok) throw new Error(`Mail ${res.status}: ${(await res.text()).slice(0, 200)}`);
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
  if (!process.env.RESEND_API_KEY || !process.env.MAIL_FROM) {
    console.error('RESEND_API_KEY / MAIL_FROM fehlen – Bestätigung kann nicht versendet werden');
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
      ? 'Ihr Vertrag ist damit beendet. Bereits geleistete Zahlungen erstatten wir gemäß unserer Widerrufsbelehrung spätestens binnen 14 Tagen.'
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
    not_found: 'Stripe: KEIN aktives Abo zu dieser E-Mail gefunden – bitte manuell prüfen!',
    skipped: 'Stripe: nicht konfiguriert – bitte manuell kündigen!',
    error: 'Stripe: FEHLER – bitte manuell kündigen!',
  };
  const owner = [
    `Neue ${titel} über die Website.`,
    '',
    ...lines,
    '',
    stripeHinweis[stripeResult],
    aktion === 'widerrufen' ? 'TODO: Zahlung binnen 14 Tagen erstatten (ggf. anteiliger Wertersatz).' : '',
  ].join('\n');

  try {
    const betreff = aktion === 'widerrufen' ? 'Ihres Widerrufs' : 'Ihrer Kündigung';
    await sendMail(email, `Eingangsbestätigung ${betreff} – ${COMPANY.brand}`, kunde, COMPANY.email);
    await sendMail(process.env.OWNER_EMAIL || COMPANY.email, `[${COMPANY.brand}] ${titel}: ${name}`, owner, email);
  } catch (e: any) {
    console.error('Bestätigungsmail fehlgeschlagen:', e?.message);
    return res.status(502).json({
      success: false,
      error: `Die Bestätigung konnte nicht versendet werden. Bitte senden Sie Ihre Erklärung zusätzlich per E-Mail an ${COMPANY.email}.`,
    });
  }

  return res.status(200).json({ success: true, eingang: eingang.toISOString(), eingangText, lines, stripe: stripeResult });
}
