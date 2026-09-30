import { useState, useCallback, useEffect } from 'react';

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
}

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
    stripeLink: 'https://buy.stripe.com/your_plus_link', // Replace with actual Stripe link
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 9.99,
    monthlyLimit: 100,
    features: ['100 Dokumente/Monat', 'Fälle-Tracking', 'Export in PDF', 'Priority Support'],
    stripeLink: 'https://buy.stripe.com/your_pro_link', // Replace with actual Stripe link
  },
  business: {
    id: 'business',
    name: 'Business',
    price: 49.99,
    monthlyLimit: Infinity,
    features: ['Unlimited Dokumente', 'Team-Zugang (bis 5 User)', 'API-Zugang', 'White-Label-Option'],
    stripeLink: 'https://buy.stripe.com/your_business_link', // Replace with actual Stripe link
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

  return {
    usageStats,
    getCurrentTier,
    getRemainingRequests,
    canMakeRequest,
    incrementUsage,
    setTier,
    allTiers: Object.values(PRICING_TIERS),
  };
}
