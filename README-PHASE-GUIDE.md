# DEASY SaaS — Комбо-вариант (Фаза 1 + Фаза 2)

**Привет, Ilja! 👋**

Это полный SaaS для DEASY с двумя фазами развертывания.

## 🚀 Быстрый старт (5 минут)

### 1. Git & GitHub

```bash
cd deasy-saas-combo
git init
git add .
git commit -m "DEASY SaaS: Фаза 1 + Фаза 2"
git branch -M main
git remote add origin https://github.com/<твой-username>/deasy-saas.git
git push -u origin main
```

### 2. Vercel Deploy

1. Зайди на **https://vercel.com**
2. Connect твой GitHub
3. Import repo `deasy-saas`
4. **Важно**: добавь переменные в `Settings → Environment Variables`:
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```
5. Deploy!

---

## 📊 Архитектура

```
deasy-saas-combo/
├── pages/
│   ├── index.tsx           ← Landing Page (Фаза 0)
│   ├── app.tsx             ← Analyzer (Document Upload + Chat)
│   ├── checkout.tsx        ← Payment Link (Фаза 1)
│   ├── datenschutz.tsx     ← Privacy Policy
│   ├── impressum.tsx       ← Legal
│   └── api/
│       ├── analyze.ts      ← Claude Vision API
│       ├── chat.ts         ← Chat endpoint
│       ├── auth/
│       │   └── [...nextauth].ts  ← NextAuth (Фаза 2)
│       ├── documents/      ← CRUD (Фаза 2)
│       └── webhooks/
│           └── stripe.ts   ← Webhook (Фаза 2)
├── prisma/
│   └── schema.prisma       ← DB Schema (Фаза 2)
├── lib/
│   └── auth.ts             ← Auth helpers (Фаза 2)
├── styles/
│   ├── Landing.module.css
│   ├── App.module.css
│   ├── Checkout.module.css
│   └── Legal.module.css
└── .env.example
```

---

## 🎯 Фаза 1 — Payment Link (Сейчас)

**Что работает:**
- ✅ Landing Page
- ✅ Document Analyzer (Claude Vision)
- ✅ Chat с KI
- ✅ Checkout с Stripe Payment Link
- ✅ Simple Counter

**Что нужно:**
1. `ANTHROPIC_API_KEY` — из https://console.anthropic.com/keys
2. Stripe Payment Links (из Stripe Dashboard)
3. Обновить `/datenschutz.tsx` и `/impressum.tsx` с реальными контактами

**Сколько стоит:**
- Claude Vision: ~$0.003 за анализ
- Stripe: 1.4% + €0.25 за платёж

---

## 🔧 Фаза 2 — Полный SaaS (После Фазы 1)

### Что добавляется:

#### A. Аутентификация (NextAuth + Prisma)
```typescript
// pages/api/auth/[...nextauth].ts
import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@next-auth/prisma-adapter"

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
}

export default NextAuth(authOptions)
```

#### B. Database (PostgreSQL via Prisma)
```bash
# .env
DATABASE_URL=postgresql://user:password@localhost:5432/deasy_db

# Deploy
npx prisma db push
npx prisma migrate dev --name init
```

#### C. Document Storage
- Локальное хранилище в `/public/uploads`
- Или S3 (позже)

#### D. User Profiles & History
- Все документы сохраняются в DB
- Фаза-трекинг (Cases)
- Usage counting

#### E. Billing Dashboard
- Stripe Subscriptions
- Invoice history
- Usage limits per plan

#### F. Stripe Webhook
```typescript
// pages/api/webhooks/stripe.ts
export default async function handler(req, res) {
  const sig = req.headers['stripe-signature']
  const event = stripe.webhooks.constructEvent(
    req.body,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET
  )

  switch (event.type) {
    case 'customer.subscription.updated':
      // Update user plan
      break
    case 'invoice.payment_succeeded':
      // Log payment
      break
  }
}
```

---

## 💳 Stripe Setup

### 1. Create Stripe Account
- https://stripe.com

### 2. Create Products & Prices
```
Product: DEASY Pro
- Price: €9.99/month
- Billing Interval: Monthly

Product: DEASY Business
- Price: €49.99/month
- Billing Interval: Monthly
```

### 3. Payment Links (Фаза 1)
```
https://buy.stripe.com/test_<YOUR_PRO_LINK>
https://buy.stripe.com/test_<YOUR_BUSINESS_LINK>
```

### 4. API Keys
- **Publishable Key**: `pk_test_...` → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- **Secret Key**: `sk_test_...` → `STRIPE_SECRET_KEY`
- **Webhook Secret**: `whsec_...` → `STRIPE_WEBHOOK_SECRET`

---

## 🔐 Legal Setup

### Required (перед лансем)
- [ ] Datenschutzerklärung (от юриста)
- [ ] Impressum (твои реальные данные)
- [ ] AGB (Terms of Service)
- [ ] Auftragsverarbeitungsvertrag (AVV) с Anthropic

### AGB Template
```markdown
# Allgemeine Geschäftsbedingungen (AGB)

1. Leistungsumfang
2. Zahlung & Abrechnung
3. Nutzerrechte & Pflichten
4. Datenschutz (Link zu Datenschutzerklärung)
5. Haftung
6. Kündigungsfrist (keine Kündigungsfrist!)
7. Schlussbestimmungen
```

---

## 🚀 Deploy Timeline

### Woche 1 (Фаза 1)
- [ ] GitHub repo с этим кодом
- [ ] Vercel deployment
- [ ] Anthropic API Key aktiviert
- [ ] Stripe Payment Links готовы
- [ ] /datenschutz и /impressum заполнены
- [ ] Beta-users invited

### Woche 2 (Фаза 1 Refinement)
- [ ] Analytics (Plausible или PostHog)
- [ ] Feedback loop с users
- [ ] Bug fixes
- [ ] Stripe webhook testing

### Woche 3 (Фаза 2 Planning)
- [ ] PostgreSQL DB (Railway, Supabase, или нативный)
- [ ] Prisma migration plan
- [ ] NextAuth integration
- [ ] User accounts design

### Woche 4+ (Фаза 2 Implementation)
- [ ] NextAuth implementation
- [ ] Dashboard building
- [ ] Document history
- [ ] Case tracking
- [ ] Billing dashboard

---

## 📈 Pricing Strategy (Recommended)

| Plan | Цена | Docs/Мес | Фичи |
|------|------|----------|------|
| Free | €0 | 5 | Basic analysis, Chat |
| Pro | €9.99 | 100 | Case tracking, Export |
| Business | €49.99 | ∞ | Team, API, White-label |

**Монетизация в Фазе 1:**
- 70% free users (trial)
- 20% Pro (case tracking need)
- 10% Business (team/API)

---

## 🛠️ Tech Stack

| Слой | Технология |
|------|-----------|
| Frontend | Next.js 14, React 18, CSS Modules |
| Backend | Next.js API Routes, TypeScript |
| AI | Claude 3.5 Sonnet (Vision + Chat) |
| Auth | NextAuth.js v4 |
| DB | PostgreSQL + Prisma |
| Payments | Stripe |
| Hosting | Vercel |
| Storage | Local (/public) or S3 |

---

## 🔑 Environment Variables (Complete)

```bash
# Required (Фаза 1)
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Optional (Фаза 2)
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=<random-string>
NEXTAUTH_URL=https://deasy.vercel.app
STRIPE_WEBHOOK_SECRET=whsec_...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

---

## 📞 Support & Questions

- Anthropic API Docs: https://docs.anthropic.com/
- Stripe Docs: https://stripe.com/docs
- Next.js Docs: https://nextjs.org/docs
- Prisma Docs: https://www.prisma.io/docs

---

## 🎉 Готово!

Развёртывай Фазу 1, получай first users, потом переходи на Фазу 2.

**Success criteria:**
- 100 free users к концу месяца
- 5-10 Pro conversions
- 1+ Business trial

**Go live! 🚀**
