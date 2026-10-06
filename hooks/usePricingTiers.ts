import { useState, useCallback, useEffect } from 'react';
import { STRIPE_LINKS } from '@/lib/siteConfig';

/**
 * Разовые пакеты без подписки.
 * - Бесплатно: FREE_PER_MONTH писем в календарный месяц.
 * - Пакеты: покупаются через Stripe Payment Link (разовый платёж), письма действуют 12 месяцев.
 * Баланс хранится в браузере (localStorage). Оплата проверяется сервером (/api/verify-payment),
 * повторная активация того же платежа блокируется на стороне Stripe (metadata платежа).
 */

export const FREE_PER_MONTH = 2;
export const PACK_VALID_MONTHS = 12;

export interface Pack {
  id: 'paket5' | 'paket15';
  name: string;
  price: number; // €
  letters: number;
  stripeLink: string;
}

export const PACKS: Pack[] = [
  { id: 'paket5', name: 'Plus', price: 4.99, letters: 5, stripeLink: STRIPE_LINKS.paket5 },
  { id: 'paket15', name: 'Pro', price: 9.99, letters: 15, stripeLink: STRIPE_LINKS.paket15 },
];

export interface CreditBatch {
  session: string;
  total: number;
  remaining: number;
  expiresAt: string; // ISO
}

export interface Balance {
  month: string; // YYYY-MM
  freeUsed: number;
  batches: CreditBatch[];
}

export type ActivationState = 'idle' | 'checking' | 'activated' | 'failed';

const KEY = 'deasyBalance';
const monthKey = () => new Date().toISOString().slice(0, 7);
const empty = (): Balance => ({ month: monthKey(), freeUsed: 0, batches: [] });

function load(): Balance {
  try {
    const b = JSON.parse(localStorage.getItem(KEY) || 'null') as Balance | null;
    if (!b || !Array.isArray(b.batches)) return empty();
    return b.month === monthKey() ? b : { ...b, month: monthKey(), freeUsed: 0 };
  } catch {
    return empty();
  }
}

const valid = (b: CreditBatch) => b.remaining > 0 && new Date(b.expiresAt).getTime() > Date.now();

export function usePricingTiers() {
  const [balance, setBalance] = useState<Balance>(empty);
  const [loaded, setLoaded] = useState(false);
  const [activation, setActivation] = useState<ActivationState>('idle');
  const [activationError, setActivationError] = useState<string | null>(null);
  const [activatedLetters, setActivatedLetters] = useState(0);

  useEffect(() => {
    setBalance(load());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(balance));
    } catch {}
  }, [balance, loaded]);

  const freeLeft = Math.max(0, FREE_PER_MONTH - balance.freeUsed);
  const paidLeft = balance.batches.filter(valid).reduce((s, b) => s + b.remaining, 0);
  const totalLeft = freeLeft + paidLeft;

  const canMakeRequest = useCallback(() => totalLeft > 0, [totalLeft]);

  /** Списывает одно письмо: сначала бесплатные, потом пакет с ближайшим сроком действия. */
  const incrementUsage = useCallback(() => {
    setBalance((prev) => {
      const cur = prev.month === monthKey() ? prev : { ...prev, month: monthKey(), freeUsed: 0 };
      if (cur.freeUsed < FREE_PER_MONTH) return { ...cur, freeUsed: cur.freeUsed + 1 };
      const order = [...cur.batches].filter(valid).sort((a, b) => a.expiresAt.localeCompare(b.expiresAt));
      const target = order[0];
      if (!target) return cur;
      return { ...cur, batches: cur.batches.map((b) => (b.session === target.session ? { ...b, remaining: b.remaining - 1 } : b)) };
    });
  }, []);

  // Возврат со Stripe: /app?checkout=cs_... → сервер проверяет оплату, мы добавляем письма
  useEffect(() => {
    if (!loaded || typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    const sessionId = url.searchParams.get('checkout');
    if (!sessionId) return;
    url.searchParams.delete('checkout');
    window.history.replaceState({}, '', url.pathname + url.search);

    if (load().batches.some((b) => b.session === sessionId)) {
      setActivation('activated');
      return;
    }

    setActivation('checking');
    fetch(`/api/verify-payment?session_id=${encodeURIComponent(sessionId)}`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) throw new Error(data.error || 'Zahlung konnte nicht bestätigt werden');
        setBalance((prev) => ({
          ...prev,
          batches: [...prev.batches, { session: sessionId, total: data.letters, remaining: data.letters, expiresAt: data.expiresAt }],
        }));
        setActivatedLetters(data.letters);
        setActivation('activated');
      })
      .catch((e) => {
        setActivationError(e instanceof Error ? e.message : String(e));
        setActivation('failed');
      });
  }, [loaded]);

  return {
    balance,
    freeLeft,
    paidLeft,
    totalLeft,
    canMakeRequest,
    incrementUsage,
    packs: PACKS,
    activation,
    activationError,
    activatedLetters,
    dismissActivation: () => setActivation('idle'),
  };
}
