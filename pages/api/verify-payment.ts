import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Проверка оплаты через Stripe после возврата с Payment Link.
 * GET /api/verify-payment?session_id=cs_...
 * → { success: true, plan: 'plus'|'pro', paidUntil: ISO } или { success: false, error }
 *
 * Тариф определяется по сумме оплаты, поэтому ID цен в коде не нужны.
 * Требуется переменная окружения STRIPE_SECRET_KEY в Vercel.
 */

const PLAN_BY_AMOUNT_CENTS: Record<number, 'plus' | 'pro'> = {
  499: 'plus',
  999: 'pro',
};

const DAY = 24 * 60 * 60 * 1000;
const STRIPE_API = process.env.STRIPE_API_BASE || 'https://api.stripe.com/v1'; // переопределяется только в тестах

async function stripeGet(path: string, key: string) {
  const res = await fetch(`${STRIPE_API}/${path}`, {
    headers: { Authorization: `Bearer ${key}` },
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
    const session = await stripeGet(`checkout/sessions/${sessionId}?expand[]=subscription`, key);

    const paid = session.status === 'complete' && ['paid', 'no_payment_required'].includes(session.payment_status);
    if (!paid) return res.status(402).json({ success: false, error: 'Zahlung nicht abgeschlossen' });

    // Сумма одного периода: у подписки берём цену первой позиции, иначе amount_total
    const sub = session.subscription && typeof session.subscription === 'object' ? session.subscription : null;
    const item = sub?.items?.data?.[0];
    const amount: number = item?.price?.unit_amount ?? session.amount_subtotal ?? session.amount_total;
    const plan = PLAN_BY_AMOUNT_CENTS[amount];
    if (!plan) {
      console.error('Unbekannter Betrag für Plan:', amount);
      return res.status(422).json({ success: false, error: 'Tarif konnte nicht zugeordnet werden' });
    }

    let paidUntil = new Date(Date.now() + 31 * DAY);
    if (sub) {
      if (!['active', 'trialing', 'past_due'].includes(sub.status)) {
        return res.status(402).json({ success: false, error: 'Abo ist nicht aktiv', status: sub.status });
      }
      // current_period_end: у старых версий API — на подписке, у новых — на позиции
      const periodEnd: number | undefined = sub.current_period_end ?? item?.current_period_end;
      if (periodEnd) paidUntil = new Date(periodEnd * 1000 + DAY); // +1 день запаса на продление
    }

    return res.status(200).json({ success: true, plan, paidUntil: paidUntil.toISOString() });
  } catch (error: any) {
    console.error('Stripe-Prüfung fehlgeschlagen:', error?.status, error?.message);
    if (error?.status === 404) return res.status(404).json({ success: false, error: 'Zahlung nicht gefunden' });
    return res.status(502).json({ success: false, error: 'Zahlung konnte nicht geprüft werden' });
  }
}
