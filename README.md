# DEASY – KI-Assistent für Behördenbriefe

DEASY erklärt deutsche Behördenschreiben in einfacher Sprache (Deutsch/Russisch), beantwortet Fragen dazu im Chat und hilft beim Entwurf einer Antwort. Steuerschreiben werden nicht ausgewertet; DEASY verweist dort auf befugte Stellen.

**Live:** https://deasy-saas.vercel.app

## Tarife
| Tarif | Preis | Dokumente/Monat |
|---|---|---|
| Kostenlos | 0 € | 3 |
| Plus | 4,99 €/Monat | 50 |
| Pro | 9,99 €/Monat | 100 |

Endpreise, Kleinunternehmer gem. § 19 UStG. Plus und Pro sind monatlich kündbar.

## Technik
Next.js 14 · React 18 · TypeScript · Anthropic Claude (Vision + Chat) · Stripe Payment Links · Resend (Bestätigungs-E-Mails) · Vercel (Region Frankfurt). Kein Benutzerkonto, keine Datenbank – Verlauf und Tarif liegen im Browser.

## Umgebungsvariablen (Vercel)
| Variable | Zweck |
|---|---|
| `ANTHROPIC_API_KEY` | KI-Analyse, Chat, Antwortentwürfe |
| `STRIPE_SECRET_KEY` | Zahlungsprüfung, Kündigung (Restricted Key: Checkout Sessions Read, Customers Read, Subscriptions Write) |
| `RESEND_API_KEY`, `MAIL_FROM`, `OWNER_EMAIL` | Eingangsbestätigung bei Kündigung/Widerruf (§§ 312k, 356a BGB) |

Inhaberdaten und Stripe-Links: `lib/siteConfig.ts`. Projektregeln für Entwicklung: `CLAUDE.md`.

## Hinweis
DEASY ist eine Verständnishilfe und keine Rechts-, Steuer- oder Sozialberatung.

© 2026 Ilja Schneider – Schneider Studios
