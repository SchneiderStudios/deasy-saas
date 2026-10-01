import { useState, useCallback, useEffect } from 'react';
import { STRIPE_LINKS, BUSINESS_CONTACT_MAILTO } from '@/lib/siteConfig';

export interface PricingTier {
  id: 'free' | 'plus' | 'pro' | 'business';
  name: string;
  price: number;
  monthlyLimit: number;
  features: string[];
  stripeLink?: string;
}

export interface UsageStats {
  tier: 'free' | 'plus' | 'pro' | 'business';
  usedThisMonth: number;
  lastResetDate: string;
  /** ISO-дата, до которой оплачен тариф (из Stripe) */
  paidUntil?: string;
  /** ID сессии Stripe Checkout — для повторной проверки подписки */
  checkoutSession?: string;
}

export type ActivationState = 'idle' | 'checking' | 'activated' | 'failed';

const PRICING_TIERS: Record<string, PricingTier> = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    monthlyLimit: 3,
    features: ['3 Dokumente kostenlos', 'Unbegrenzter Chat', 'Basis-Analyse'],
  },
  plus: {
    id: 'plus',
    name: 'Plus',
    price: 4.99,
    monthlyLimit: 50,
    features: ['50 Dokumente/Monat', 'PDF-Support', 'Antwort-Generator'],
    stripeLink: STRIPE_LINKS.plus,
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 9.99,
    monthlyLimit: 100,
    features: ['100 Dokumente/Monat', 'Fälle-Tracking', 'Export in PDF', 'Priority Support'],
    stripeLink: STRIPE_LINKS.pro,
  },
  business: {
    id: 'business',
    name: 'Business',
    price: 49.99,
    monthlyLimit: Infinity,
    features: ['Unlimited Dokumente', 'Team-Zugang (bis 5 User)', 'API-Zugang', 'White-Label-Option'],
    stripeLink: BUSINESS_CONTACT_MAILTO,
  },
};

export function usePricingTiers() {
  const [usageStats, setUsageStats] = useState<UsageStats>({
    tier: 'free',
    usedThisMonth: 0,
    lastResetDate: new Date().toISOString().split('T')[0],
  });

  // Load usage stats from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('deasyUsageStats');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Reset monthly usage if month has changed
        const currentMonth = new Date().toISOString().split('T')[0].substring(0, 7);
        const storedMonth = parsed.lastResetDate.substring(0, 7);

        if (currentMonth !== storedMonth) {
          setUsageStats({
            ...parsed,
            usedThisMonth: 0,
            lastResetDate: new Date().toISOString().split('T')[0],
          });
        } else {
          setUsageStats(parsed);
        }
      }
    } catch (error) {
      console.error('Error loading usage stats:', error);
    }
  }, []);

  // Save usage stats to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('deasyUsageStats', JSON.stringify(usageStats));
    } catch (error) {
      console.error('Error saving usage stats:', error);
    }
  }, [usageStats]);

  const getCurrentTier = useCallback((): PricingTier => {
    return PRICING_TIERS[usageStats.tier] || PRICING_TIERS.free;
  }, [usageStats.tier]);

  const getRemainingRequests = useCallback((): number => {
    const tier = getCurrentTier();
    return Math.max(0, tier.monthlyLimit - usageStats.usedThisMonth);
  }, [usageStats, getCurrentTier]);

  const canMakeRequest = useCallback((): boolean => {
    return getRemainingRequests() > 0;
  }, [getRemainingRequests]);

  const incrementUsage = useCallback(() => {
    setUsageStats((prev) => ({
      ...prev,
      usedThisMonth: prev.usedThisMonth + 1,
    }));
  }, []);

  const setTier = useCallback((tier: UsageStats['tier']) => {
    setUsageStats((prev) => ({
      ...prev,
      tier,
    }));
  }, []);

  const [activation, setActivation] = useState<ActivationState>('idle');
  const [activationError, setActivationError] = useState<string | null>(null);

  const verify = useCallback(async (sessionId: string) => {
    const res = await fetch(`/api/verify-payment?session_id=${encodeURIComponent(sessionId)}`);
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok && data.success, data };
  }, []);

  // 1) Возврат со Stripe: /app?checkout=cs_... → проверяем оплату и включаем тариф
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    const sessionId = url.searchParams.get('checkout');
    if (!sessionId) return;

    url.searchParams.delete('checkout');
    window.history.replaceState({}, '', url.pathname + url.search);

    setActivation('checking');
    verify(sessionId)
      .then(({ ok, data }) => {
        if (!ok) throw new Error(data.error || 'Zahlung konnte nicht bestätigt werden');
        setUsageStats((prev) => ({
          ...prev,
          tier: data.plan,
          paidUntil: data.paidUntil,
          checkoutSession: sessionId,
        }));
        setActivation('activated');
      })
      .catch((e) => {
        setActivationError(e instanceof Error ? e.message : String(e));
        setActivation('failed');
      });
  }, [verify]);

  // 2) Оплаченный период истёк → спрашиваем Stripe, продлена ли подписка
  useEffect(() => {
    const { tier, paidUntil, checkoutSession } = usageStats;
    if (tier === 'free' || tier === 'business' || !paidUntil) return;
    if (new Date(paidUntil).getTime() > Date.now()) return;

    const downgrade = () => setUsageStats((prev) => ({ ...prev, tier: 'free', paidUntil: undefined, checkoutSession: undefined }));
    if (!checkoutSession) return downgrade();

    verify(checkoutSession)
      .then(({ ok, data }) => {
        if (ok) setUsageStats((prev) => ({ ...prev, tier: data.plan, paidUntil: data.paidUntil }));
        else if (data?.error !== 'Zahlung konnte nicht geprüft werden') downgrade(); // при сбое сети не наказываем
      })
      .catch(() => {});
  }, [usageStats.tier, usageStats.paidUntil, usageStats.checkoutSession, verify]);

  return {
    usageStats,
    activation,
    activationError,
    dismissActivation: () => setActivation('idle'),
    getCurrentTier,
    getRemainingRequests,
    canMakeRequest,
    incrementUsage,
    setTier,
    allTiers: Object.values(PRICING_TIERS),
  };
}
