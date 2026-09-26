# DEASY — KI-Assistent für deutsche Bürokratie

**Hilf Migranten, ihre Behördenbriefe zu verstehen.**

[![Deploy](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fdeasy-ai%2Fdeasy-saas)

---

## 🎯 Was ist DEASY?

DEASY analysiert deutsche Behördenbriefe mit KI:
- 📄 Dokument hochladen (JPG, PNG, PDF)
- 🤖 Claude Vision liest & analysiert
- 📊 Zusammenfassung, Fristen, Nächste Schritte
- 💬 Chat mit KI über den Brief
- 💰 **Фаза 1**: Stripe Payment Link
- 🔐 **Фаза 2**: Full SaaS mit Accounts

---

## ✨ Features

✅ **Dokument-Analyse**
- Claude 3.5 Sonnet Vision API
- Erkennung von Fristen, Risiko-Levels
- Deutsche Sprache optimiert

✅ **Chat Interface**
- Fragen zum Brief stellen
- Kontextbewusste Antworten
- Echtzeit-Response

✅ **Pricing Tiers**
- Free: 5 Docs/Monat
- Pro: 100 Docs/Monat (€9.99)
- Business: Unlimited + API (€49.99)

✅ **Security**
- DSGVO-konform
- Encrypted transmission
- No document storage

---

## 🚀 Quick Start

### Local Development

```bash
# 1. Clone & Setup
git clone <this-repo>
cd deasy-saas-combo

# 2. Install deps
npm install

# 3. Environment
cp .env.example .env.local
# Add: ANTHROPIC_API_KEY, STRIPE keys

# 4. Dev Server
npm run dev
# Open http://localhost:3000
```

### Deploy to Vercel

```bash
# 1. Push to GitHub
git push origin main

# 2. Vercel Dashboard
- Import repo
- Add Environment Variables
- Deploy!

# Or one-click:
vercel deploy
```

---

## 📁 Project Structure

```
deasy-saas-combo/
├── pages/
│   ├── index.tsx              ← Landing Page
│   ├── app.tsx                ← Analyzer
│   ├── checkout.tsx           ← Payment Link
│   ├── datenschutz.tsx        ← Privacy Policy
│   ├── impressum.tsx          ← Legal
│   └── api/
│       ├── analyze.ts         ← Claude Vision
│       ├── chat.ts            ← Chat endpoint
│       └── ... (Фаза 2 APIs)
├── styles/                    ← CSS Modules
├── prisma/
│   └── schema.prisma          ← Database (Фаза 2)
├── lib/                       ← Utilities
├── public/                    ← Static files
├── .env.example
├── README.md
└── README-PHASE-GUIDE.md      ← Detailed guide
```

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Backend**: Next.js API Routes
- **AI**: Anthropic Claude 3.5 Sonnet
- **Auth**: NextAuth.js (Фаза 2)
- **Database**: PostgreSQL + Prisma (Фаза 2)
- **Payments**: Stripe
- **Hosting**: Vercel
- **Styling**: CSS Modules

---

## 💾 Environment Variables

```bash
# Required
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Optional (Фаза 2)
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=...
```

See `.env.example` for complete list.

---

## 🌍 Phase Roadmap

### **Фаза 1** (Сейчас)
✅ Landing Page
✅ Document Analyzer
✅ Chat Interface
✅ Stripe Payment Link
✅ Basic Pricing

### **Фаза 2** (Next)
🔧 User Accounts (NextAuth)
🔧 Document History (PostgreSQL)
🔧 Case Tracking
🔧 Billing Dashboard
🔧 Usage Limits
🔧 Stripe Subscriptions
🔧 Team Management (Business plan)

### **Фаза 3** (Future)
💡 API Public
💡 Webhook Support
💡 Custom Integrations
💡 White-label Version

---

## 📊 Architecture

```
┌─────────────────────────────────────┐
│        DEASY Frontend                │
│    (Next.js Pages + React)           │
├─────────────────────────────────────┤
│       API Layer (Next.js)            │
│  /api/analyze    → Claude Vision     │
│  /api/chat       → Claude Chat       │
│  /api/checkout   → Stripe Link       │
│  /api/auth/*     → NextAuth (Ф2)    │
├─────────────────────────────────────┤
│    External Services (Фаза 2)        │
│  - PostgreSQL (Prisma)               │
│  - Stripe Payments                   │
│  - Anthropic API                     │
└─────────────────────────────────────┘
```

---

## 🔐 Security

- ✅ Environment variables for secrets
- ✅ CORS enabled only for trusted origins
- ✅ API timeouts (45s analyze, 30s chat)
- ✅ File size validation (10MB max)
- ✅ DSGVO compliance (Anthropic AVV)

**Before Production:**
- [ ] Complete Privacy Policy (Datenschutzerklärung)
- [ ] Complete Impressum
- [ ] AVV signed with Anthropic
- [ ] Stripe webhook HMAC verification
- [ ] Rate limiting (Redis or Upstash)

---

## 💰 Pricing Model

| Plan | Monthly | Docs | Features |
|------|---------|------|----------|
| Free | €0 | 5 | Analysis, Chat |
| Pro | €9.99 | 100 | + Case tracking, Export |
| Business | €49.99 | ∞ | + Team, API, White-label |

**Stripe Setup:**
1. Create Products in Stripe Dashboard
2. Get Payment Link URLs
3. Add to `/pages/checkout.tsx`
4. Set Environment Variables

---

## 🔍 API Examples

### Analyze Document
```bash
POST /api/analyze
Content-Type: application/json

{
  "imageData": "data:image/jpeg;base64,...",
  "fileName": "schreiben.jpg"
}

Response:
{
  "summary": "...",
  "risk": "Kritisch",
  "deadlines": ["30.10.2024"],
  "nextSteps": ["Formular ausfüllen", "..."]
}
```

### Chat
```bash
POST /api/chat
Content-Type: application/json

{
  "message": "Muss ich zahlen?",
  "context": "Das war eine Mahnung vom Finanzamt..."
}

Response:
{
  "response": "Ja, laut Brief müssen Sie bis..."
}
```

---

## 📈 Analytics & Monitoring

Recommended tools:
- **Vercel Analytics** (free)
- **Plausible Analytics** (privacy-first)
- **PostHog** (self-hosted option)
- **Sentry** (error tracking)

---

## 🚨 Common Issues

### "API-Fehler" on Upload
→ Check `ANTHROPIC_API_KEY` in Vercel Environment Variables
→ Verify API key is valid at https://console.anthropic.com

### Stripe Webhook Not Working
→ Check `STRIPE_WEBHOOK_SECRET` matches Stripe Dashboard
→ Verify webhook endpoint in Stripe (Settings → Webhooks)

### Database Connection Error
→ PostgreSQL only for Phase 2
→ Phase 1 works without database

---

## 📞 Support

- **Anthropic Docs**: https://docs.anthropic.com/
- **Stripe Docs**: https://stripe.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Prisma Docs**: https://www.prisma.io/docs

---

## 📄 License

MIT — Use freely for commercial projects

---

## 🎯 Next Steps

1. ✅ Clone this repo
2. ✅ Set up environment variables
3. ✅ Deploy to Vercel
4. ✅ Get first users
5. ✅ Upgrade to Phase 2 (Accounts + Billing)

**Viel Erfolg mit DEASY! 🚀**
