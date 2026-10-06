import type { NextApiRequest, NextApiResponse } from 'next';
import { COMPANY, SITE_URL } from '@/lib/siteConfig';
import { sendMail, mailConfigured, ownerEmail } from '@/lib/mail';

/**
 * Проверка разовой оплаты пакета после возврата с Stripe Payment Link.
 * GET /api/verify-payment?session_id=cs_...
 * → { success: true, letters, expiresAt } или { success: false, error }
 *
 * - Пакет определяется по сумме (499 → 5 писем, 999 → 15 писем).
 * - Повторная активация того же платежа блокируется: при первой активации ставим
 *   metadata[deasy_redeemed] на PaymentIntent в Stripe (БД не нужна).
 * Нужен STRIPE_SECRET_KEY (restricted: Checkout Sessions Read, Payment Intents Write).
 * После активации покупателю уходит Vertragsbestätigung (§ 312f BGB) — с отметкой о согласии
 * на начало услуги до конца срока отзыва (client_reference_id = verzicht_<время>, ставится в окне покупки).
 */

const berlin = (d: Date) =>
  d.toLocaleString('de-DE', { timeZone: 'Europe/Berlin', dateStyle: 'long', timeStyle: 'short' }) + ' Uhr';

async function sendBestaetigung(session: any, letters: number, amount: number, expiresAt: Date) {
  const email: string | undefined = session.customer_details?.email;
  if (!email || !mailConfigured()) return;
  const paidAt = new Date((session.created || Date.now() / 1000) * 1000);
  const ref = String(session.client_reference_id || '');
  const zustimmung = ref.startsWith('verzicht_')
    ? `Ja – erteilt am ${berlin(new Date(Number(ref.slice(9)) || paidAt.getTime()))}`
    : 'nicht dokumentiert';
  const preis = (amount / 100).toFixed(2).replace('.', ',') + ' €';
  const text = [
    'Guten Tag,',
    '',
    `vielen Dank für Ihren Kauf. Hiermit bestätigen wir Ihren Vertrag:`,
    '',
    `Paket: DEASY ${letters} Briefe (einmalige Zahlung, kein Abo)`,
    `Preis: ${preis} (gem. § 19 UStG ohne Umsatzsteuer)`,
    `Gekauft am: ${berlin(paidAt)}`,
    `Gültig bis: ${expiresAt.toLocaleDateString('de-DE', { timeZone: 'Europe/Berlin' })}`,
    '',
    'Ihre Zustimmung beim Kauf:',
    '„Ich verlange ausdrücklich, dass DEASY vor Ablauf der Widerrufsfrist mit der Leistung beginnt. Mir ist bekannt, dass ich bei einem Widerruf für bereits genutzte Briefe anteilig Wertersatz leiste und mein Widerrufsrecht erlischt, sobald alle Briefe des Pakets genutzt sind.“',
    `Zustimmung: ${zustimmung}`,
    '',
    `AGB: ${SITE_URL}/agb`,
    `Widerrufsbelehrung und Muster-Widerrufsformular: ${SITE_URL}/widerruf`,
    `Vertrag widerrufen: ${SITE_URL}/vertrag?aktion=widerrufen`,
    '',
    'Die Briefe sind in dem Browser gutgeschrieben, in dem Sie bezahlt haben.',
    '',
    'Mit freundlichen Grüßen',
    `${COMPANY.name} – ${COMPANY.brand}`,
    `${COMPANY.street}, ${COMPANY.zipCity}`,
    COMPANY.email,
  ].join('\n');
  try {
    await sendMail(email, `Ihre Vertragsbestätigung – ${COMPANY.brand} ${letters} Briefe`, text, COMPANY.email);
    await sendMail(ownerEmail(), `[${COMPANY.brand}] Verkauf: ${letters} Briefe (${preis})`, `Käufer: ${email}\nZustimmung: ${zustimmung}\nSession: ${session.id}`);
  } catch (e: any) {
    console.error('Vertragsbestätigung fehlgeschlagen:', e?.message);
  }
}

const LETTERS_BY_AMOUNT_CENTS: Record<number, number> = {
  499: 5,
  999: 15,
};
const VALID_MONTHS = 12;

const STRIPE_API = process.env.STRIPE_API_BASE || 'https://api.stripe.com/v1'; // переопределяется только в тестах

async function stripe(method: 'GET' | 'POST', path: string, key: string, body?: Record<string, string>) {
  const res = await fetch(`${STRIPE_API}/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      ...(body ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
    },
    body: body ? new URLSearchParams(body).toString() : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data?.error?.message || `Stripe ${res.status}`), { status: res.status });
  return data;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method not allowed' });

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    console.error('STRIPE_SECRET_KEY ist nicht gesetzt');
    return res.status(500).json({ success: false, error: 'Zahlungsprüfung nicht konfiguriert' });
  }

  const sessionId = String(req.query.session_id || '');
  if (!/^cs_(test|live)_[A-Za-z0-9]+$/.test(sessionId)) {
    return res.status(400).json({ success: false, error: 'Ungültige Zahlungs-ID' });
  }

  try {
    const session = await stripe('GET', `checkout/sessions/${sessionId}?expand[]=payment_intent`, key);

    if (session.mode !== 'payment') {
      return res.status(422).json({ success: false, error: 'Unerwartete Zahlungsart' });
    }
    if (session.status !== 'complete' || session.payment_status !== 'paid') {
      return res.status(402).json({ success: false, error: 'Zahlung nicht abgeschlossen' });
    }

    const amount: number = session.amount_subtotal ?? session.amount_total;
    const letters = LETTERS_BY_AMOUNT_CENTS[amount];
    if (!letters) {
      console.error('Unbekannter Betrag für Paket:', amount);
      return res.status(422).json({ success: false, error: 'Paket konnte nicht zugeordnet werden' });
    }

    const pi = session.payment_intent && typeof session.payment_intent === 'object' ? session.payment_intent : null;
    if (!pi?.id) return res.status(422).json({ success: false, error: 'Zahlung nicht gefunden' });
    if (pi.metadata?.deasy_redeemed) {
      return res.status(409).json({
        success: false,
        error: 'Dieses Paket wurde bereits in einem anderen Browser eingelöst. Schreiben Sie uns, wenn Sie es übertragen möchten.',
      });
    }

    await stripe('POST', `payment_intents/${pi.id}`, key, { 'metadata[deasy_redeemed]': new Date().toISOString() });

    const paidAt = new Date((session.created || Date.now() / 1000) * 1000);
    const expiresAt = new Date(paidAt);
    expiresAt.setMonth(expiresAt.getMonth() + VALID_MONTHS);

    await sendBestaetigung(session, letters, amount, expiresAt);

    return res.status(200).json({ success: true, letters, expiresAt: expiresAt.toISOString() });
  } catch (error: any) {
    console.error('Stripe-Prüfung fehlgeschlagen:', error?.status, error?.message);
    if (error?.status === 404) return res.status(404).json({ success: false, error: 'Zahlung nicht gefunden' });
    return res.status(502).json({ success: false, error: 'Zahlung konnte nicht geprüft werden' });
  }
}
