import nodemailer from 'nodemailer';
import { COMPANY } from '@/lib/siteConfig';

/**
 * Отправка писем с сайта (подтверждение Widerruf, подтверждение покупки).
 *
 * Вариант 1 (сейчас): Gmail. В Vercel → Settings → Environment Variables:
 *   GMAIL_USER          = herr.ishneider@gmail.com
 *   GMAIL_APP_PASSWORD  = пароль приложения Google (16 символов, без пробелов)
 * Вариант 2 (позже, свой домен): Resend — RESEND_API_KEY + MAIL_FROM.
 * OWNER_EMAIL (необязательно) — куда приходят уведомления владельцу; по умолчанию COMPANY.email.
 */

export const mailConfigured = () =>
  Boolean((process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) || (process.env.RESEND_API_KEY && process.env.MAIL_FROM));

export const ownerEmail = () => process.env.OWNER_EMAIL || COMPANY.email;

export async function sendMail(to: string, subject: string, text: string, replyTo?: string) {
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    const transport = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD.replace(/\s+/g, '') },
    });
    await transport.sendMail({
      from: `"${COMPANY.brand}" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      text,
      ...(replyTo ? { replyTo } : {}),
    });
    return;
  }

  if (process.env.RESEND_API_KEY && process.env.MAIL_FROM) {
    const res = await fetch(`${process.env.RESEND_API_BASE || 'https://api.resend.com'}/emails`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: process.env.MAIL_FROM, to: [to], subject, text, ...(replyTo ? { reply_to: replyTo } : {}) }),
    });
    if (!res.ok) throw new Error(`Mail ${res.status}: ${(await res.text()).slice(0, 200)}`);
    return;
  }

  throw new Error('E-Mail-Versand nicht konfiguriert (GMAIL_USER/GMAIL_APP_PASSWORD fehlen)');
}
