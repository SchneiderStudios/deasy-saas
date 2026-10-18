import React, { useState } from 'react';
import styles from '@/styles/Forms.module.css';

/**
 * Форма «Стать тестером» / «Стать партнёром» → POST /api/kontakt.
 * Ничего не хранится на сервере: заявка приходит владельцу по e-mail (см. Datenschutz).
 */

type Lang = 'de' | 'ru';
type Art = 'tester' | 'partner';

const THEMEN: { id: string; de: string; ru: string }[] = [
  { id: 'jobcenter', de: 'Jobcenter', ru: 'Jobcenter' },
  { id: 'krankenkasse', de: 'Krankenkasse', ru: 'Больничная касса' },
  { id: 'auslaenderbehoerde', de: 'Ausländerbehörde', ru: 'Ausländerbehörde' },
  { id: 'vermieter', de: 'Vermieter', ru: 'Арендодатель' },
  { id: 'inkasso', de: 'Inkasso / Mahnung', ru: 'Inkasso / Mahnung' },
  { id: 'rundfunk', de: 'Rundfunkbeitrag', ru: 'Rundfunkbeitrag' },
  { id: 'betrug', de: 'Verdächtige SMS / E-Mails', ru: 'Подозрительные SMS / e-mail' },
  { id: 'sonstiges', de: 'Anderes', ru: 'Другое' },
];

const T = {
  ru: {
    name: 'Имя',
    email: 'E-mail',
    org: 'Организация',
    themen: 'Какие письма вам приходят? (необязательно)',
    msgTester: 'Что для вас сложнее всего с письмами? (необязательно)',
    msgPartner: 'Кому вы помогаете и как можем работать вместе?',
    consent: 'Я согласен(на), что DEASY свяжется со мной по этому e-mail по поводу моей заявки. Подробнее — в',
    send: { tester: 'Записаться в тестеры', partner: 'Отправить заявку' },
    sending: 'Отправляю…',
    done: {
      tester: '🙏 Спасибо! Напишем вам в течение недели и договоримся о коротком разговоре (15–20 минут).',
      partner: '🙏 Спасибо! Ответим в течение недели.',
    },
    error: 'Не удалось отправить. Напишите нам на e-mail из футера.',
    privacy: 'Не указывайте здесь номера дел, адреса и другие данные из писем.',
  },
  de: {
    name: 'Name',
    email: 'E-Mail',
    org: 'Organisation',
    themen: 'Von wem bekommen Sie Briefe? (optional)',
    msgTester: 'Was ist für Sie an Behördenpost am schwierigsten? (optional)',
    msgPartner: 'Wen unterstützen Sie und wie könnten wir zusammenarbeiten?',
    consent: 'Ich bin einverstanden, dass DEASY mich zu meiner Anfrage unter dieser E-Mail-Adresse kontaktiert. Mehr in der',
    send: { tester: 'Als Tester anmelden', partner: 'Anfrage senden' },
    sending: 'Wird gesendet…',
    done: {
      tester: '🙏 Danke! Wir melden uns innerhalb einer Woche für ein kurzes Gespräch (15–20 Minuten).',
      partner: '🙏 Danke! Wir antworten innerhalb einer Woche.',
    },
    error: 'Senden fehlgeschlagen. Schreiben Sie uns gern an die E-Mail-Adresse im Footer.',
    privacy: 'Bitte keine Aktenzeichen, Adressen oder andere Daten aus Briefen eintragen.',
  },
};

export default function ContactForm({ art, language }: { art: Art; language: Lang }) {
  const t = T[language];
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [organisation, setOrganisation] = useState('');
  const [themen, setThemen] = useState<string[]>([]);
  const [nachricht, setNachricht] = useState('');
  const [einwilligung, setEinwilligung] = useState(false);
  const [website, setWebsite] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');

  const valid = name.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim()) && einwilligung && (art === 'tester' || organisation.trim());

  const toggle = (id: string) => setThemen((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || state === 'sending') return;
    setState('sending');
    try {
      const res = await fetch('/api/kontakt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ art, name, email, organisation, themen, nachricht, language, einwilligung, website }),
      });
      if (!res.ok) throw new Error();
      setState('done');
    } catch {
      setState('error');
    }
  };

  if (state === 'done') return <p className={styles.done} role="status">{t.done[art]}</p>;

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <div className={styles.row}>
        <label className={styles.field}>
          <span>{t.name} *</span>
          <input value={name} onChange={(e) => setName(e.target.value.slice(0, 100))} autoComplete="name" required />
        </label>
        <label className={styles.field}>
          <span>{t.email} *</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value.slice(0, 160))} autoComplete="email" required />
        </label>
      </div>

      {art === 'partner' && (
        <label className={styles.field}>
          <span>{t.org} *</span>
          <input value={organisation} onChange={(e) => setOrganisation(e.target.value.slice(0, 160))} autoComplete="organization" required />
        </label>
      )}

      {art === 'tester' && (
        <fieldset className={styles.chips}>
          <legend>{t.themen}</legend>
          {THEMEN.map((th) => (
            <button type="button" key={th.id} aria-pressed={themen.includes(th.id)} onClick={() => toggle(th.id)}>
              {th[language]}
            </button>
          ))}
        </fieldset>
      )}

      <label className={styles.field}>
        <span>{art === 'tester' ? t.msgTester : t.msgPartner}</span>
        <textarea rows={3} value={nachricht} onChange={(e) => setNachricht(e.target.value.slice(0, 1500))} />
      </label>
      <p className={styles.hint}>{t.privacy}</p>

      {/* honeypot — скрыт от людей */}
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        className={styles.hp}
        aria-hidden="true"
      />

      <label className={styles.consent}>
        <input type="checkbox" checked={einwilligung} onChange={(e) => setEinwilligung(e.target.checked)} />
        <span>
          {t.consent} <a href="/datenschutz" target="_blank">Datenschutzerklärung</a>.
        </span>
      </label>

      <button type="submit" className={styles.submit} disabled={!valid || state === 'sending'}>
        {state === 'sending' ? t.sending : t.send[art]}
      </button>
      {state === 'error' && <p className={styles.error}>{t.error}</p>}
    </form>
  );
}
