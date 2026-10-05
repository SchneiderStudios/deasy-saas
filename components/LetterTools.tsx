import React, { useState } from 'react';
import { downloadIcs, fmtDate, daysLeft, Frist } from '@/lib/ics';

type Lang = 'de' | 'ru';

const card: React.CSSProperties = {
  marginBottom: 16,
  padding: '14px 16px',
  borderRadius: 12,
  border: '1px solid #e5e7eb',
  background: '#fff',
  fontSize: 14.5,
  lineHeight: 1.55,
  color: '#1c2340',
};
const h3: React.CSSProperties = { margin: '0 0 8px', fontSize: 17 };
const btn: React.CSSProperties = {
  border: '1px solid #c9d4fb',
  background: '#eef2ff',
  color: '#1f3bb0',
  borderRadius: 10,
  padding: '8px 12px',
  fontWeight: 600,
  fontSize: 14,
  cursor: 'pointer',
};

/* ---------------- Сроки + календарь ---------------- */

export function FristenKarte({
  fristen,
  deadlines,
  absender,
  aktenzeichen,
  language,
}: {
  fristen?: Frist[];
  deadlines: string[];
  absender?: string;
  aktenzeichen?: string;
  language: Lang;
}) {
  const de = language === 'de';
  const list = fristen || [];
  return (
    <div style={{ ...card, background: '#f3faf4', borderColor: '#cfe9d4' }}>
      <h3 style={h3}>⏰ {de ? 'Fristen' : 'Сроки'}</h3>
      {list.length === 0 && deadlines.length === 0 && (
        <p style={{ margin: 0, color: '#4b4e5c' }}>{de ? 'Im Brief steht keine konkrete Frist.' : 'В письме нет конкретного срока.'}</p>
      )}
      {list.length > 0 ? (
        <>
          {list.map((f) => {
            const d = daysLeft(f.datum);
            const badge =
              d < 0
                ? { t: de ? 'abgelaufen' : 'срок прошёл', c: '#b42318' }
                : d <= 7
                ? { t: de ? `noch ${d} Tage` : `осталось ${d} дн.`, c: '#b54708' }
                : { t: de ? `noch ${d} Tage` : `осталось ${d} дн.`, c: '#067647' };
            return (
              <div key={f.datum + f.was} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 0', borderTop: '1px solid #e3f1e6', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 200px' }}>
                  <strong>{fmtDate(f.datum)}</strong>{' '}
                  <span style={{ color: badge.c, fontSize: 13, fontWeight: 600 }}>· {badge.t}</span>
                  <div>{f.was}</div>
                </div>
                <button style={btn} onClick={() => downloadIcs([f], absender || '', aktenzeichen)}>
                  📅 {de ? 'In Kalender' : 'В календарь'}
                </button>
              </div>
            );
          })}
          {list.length > 1 && (
            <button style={{ ...btn, marginTop: 8 }} onClick={() => downloadIcs(list, absender || '', aktenzeichen)}>
              📅 {de ? 'Alle Fristen in den Kalender' : 'Все сроки в календарь'}
            </button>
          )}
          <p style={{ margin: '8px 0 0', fontSize: 12.5, color: '#4b4e5c' }}>
            {de
              ? 'Mit Erinnerung 3 Tage und 1 Tag vorher. Bitte das Datum mit dem Brief abgleichen.'
              : 'С напоминанием за 3 дня и за 1 день. Сверьте дату с письмом.'}
          </p>
        </>
      ) : (
        deadlines.length > 0 && (
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {deadlines.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        )
      )}
    </div>
  );
}

/* ---------------- Проверка на мошенничество ---------------- */

export function EchtheitCheck({ echtheit, hinweise, language }: { echtheit?: string; hinweise?: string[]; language: Lang }) {
  const de = language === 'de';
  const verdacht = echtheit === 'pruefen' || (hinweise && hinweise.length > 0);
  return (
    <div
      style={{
        ...card,
        background: verdacht ? '#fff6ed' : '#f8f9fb',
        borderColor: verdacht ? '#f9c99a' : '#e5e7eb',
      }}
    >
      <h3 style={h3}>
        🛡️ {de ? 'Echtheits-Check' : 'Проверка на мошенничество'}:{' '}
        <span style={{ color: verdacht ? '#b54708' : '#067647' }}>
          {verdacht ? (de ? 'bitte prüfen' : 'стоит проверить') : de ? 'keine Auffälligkeiten erkannt' : 'подозрительного не найдено'}
        </span>
      </h3>
      {verdacht && hinweise && hinweise.length > 0 && (
        <ul style={{ margin: '0 0 8px', paddingLeft: 18 }}>
          {hinweise.map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ul>
      )}
      <details>
        <summary style={{ cursor: 'pointer', color: '#2b4fd8', fontWeight: 600 }}>
          {de ? 'So prüfen Sie einen Brief selbst' : 'Как проверить письмо самому'}
        </summary>
        <ul style={{ margin: '8px 0 0', paddingLeft: 18 }}>
          {(de
            ? [
                'Rufen Sie die Behörde unter einer Nummer von deren offizieller Website an – nicht unter der Nummer aus einem verdächtigen Brief.',
                'Behörden verlangen keine Zahlung per Gutscheinkarte, Krypto, WhatsApp oder auf ein privates Konto.',
                'Echte Behördenbriefe haben ein Aktenzeichen und einen Absender mit Anschrift.',
                'Klicken Sie keine Links in E-Mails oder SMS, die angeblich vom Amt kommen.',
                'Im Zweifel: Verbraucherzentrale oder die Polizei (110 nur im Notfall) kontaktieren.',
              ]
            : [
                'Позвоните в ведомство по номеру с его официального сайта — не по номеру из подозрительного письма.',
                'Ведомства не требуют оплату подарочными картами, криптовалютой, через WhatsApp или на частный счёт.',
                'В настоящем официальном письме есть Aktenzeichen и отправитель с адресом.',
                'Не переходите по ссылкам из e-mail или SMS «от ведомства».',
                'Если сомневаетесь — обратитесь в Verbraucherzentrale или в полицию (110 — только в экстренных случаях).',
              ]
          ).map((t) => (
            <li key={t} style={{ marginBottom: 4 }}>
              {t}
            </li>
          ))}
        </ul>
      </details>
      <p style={{ margin: '8px 0 0', fontSize: 12.5, color: '#6b7085' }}>
        {de
          ? 'Automatische KI-Einschätzung ohne Gewähr – ein unauffälliges Ergebnis garantiert nicht, dass der Brief echt ist.'
          : 'Автоматическая оценка ИИ без гарантий: «ничего не найдено» не означает, что письмо точно настоящее.'}
      </p>
    </div>
  );
}

/* ---------------- Подготовка к звонку / визиту ---------------- */

export function AnrufVorbereitung({
  absender,
  aktenzeichen,
  briefdatum,
  telefon,
  unterlagen,
  verdacht,
  language,
}: {
  absender?: string;
  aktenzeichen?: string;
  briefdatum?: string;
  telefon?: string;
  unterlagen?: string[];
  verdacht?: boolean;
  language: Lang;
}) {
  const de = language === 'de';
  const [name, setName] = useState('');
  const [copied, setCopied] = useState(false);

  const n = name.trim() || '[Ihr Name]';
  const phrases: [string, string][] = [
    [
      `Guten Tag, mein Name ist ${n}. Ich rufe wegen Ihres Schreibens${briefdatum ? ` vom ${briefdatum}` : ''} an.`,
      `Здравствуйте, меня зовут ${name.trim() || '…'}. Я звоню по поводу вашего письма${briefdatum ? ` от ${briefdatum}` : ''}.`,
    ],
    ...(aktenzeichen
      ? ([[`Mein Aktenzeichen ist ${aktenzeichen}.`, `Мой номер дела (Aktenzeichen): ${aktenzeichen}.`]] as [string, string][])
      : []),
    ['Ich spreche nicht so gut Deutsch. Können Sie bitte langsam sprechen?', 'Я плохо говорю по-немецки. Говорите, пожалуйста, медленнее.'],
    ['Können Sie mir bitte erklären, was ich jetzt tun muss?', 'Объясните, пожалуйста, что мне нужно сделать?'],
    ['Bis wann muss ich das erledigen?', 'До какого числа это нужно сделать?'],
    ['Welche Unterlagen brauchen Sie von mir?', 'Какие документы вам от меня нужны?'],
    ['Kann ich die Unterlagen per E-Mail oder online schicken?', 'Можно отправить документы по e-mail или онлайн?'],
    ['Können Sie das bitte wiederholen?', 'Повторите, пожалуйста.'],
    ['Können Sie mir das bitte schriftlich bestätigen?', 'Можете подтвердить это письменно?'],
    ['Wie ist Ihr Name, bitte?', 'Как вас зовут? (запишите имя сотрудника)'],
  ];

  const copyAll = async () => {
    const text = phrases.map(([d, r]) => (de ? d : `${d}\n(${r})`)).join('\n\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <details style={{ ...card, background: '#f5f7ff', borderColor: '#c9d4fb' }}>
      <summary style={{ cursor: 'pointer', fontWeight: 700, fontSize: 16 }}>
        📞 {de ? 'Anruf oder Termin vorbereiten' : 'Подготовка к звонку или визиту'}
      </summary>

      <div style={{ marginTop: 10 }}>
        {(absender || telefon) && (
          <p style={{ margin: '0 0 8px' }}>
            {absender && <strong>{absender}</strong>}
            {telefon && !verdacht && (
              <>
                {' · '}
                {de ? 'Telefon laut Brief' : 'Телефон из письма'}: <a href={`tel:${telefon.replace(/[^\d+]/g, '')}`}>{telefon}</a>
              </>
            )}
          </p>
        )}
        {verdacht && (
          <p style={{ margin: '0 0 8px', color: '#b54708' }}>
            {de
              ? '⚠️ Wegen der Warnzeichen: Nummer nur von der offiziellen Website der Behörde verwenden.'
              : '⚠️ Из-за признаков мошенничества берите номер только с официального сайта ведомства.'}
          </p>
        )}

        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
          {de ? 'Ihr Name (wird in die Sätze eingesetzt, nicht gespeichert)' : 'Ваше имя (подставится во фразы, не сохраняется)'}
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ display: 'block', width: '100%', boxSizing: 'border-box', marginTop: 4, padding: '10px 12px', borderRadius: 10, border: '1px solid #d6d9e1', fontSize: 16 }}
          />
        </label>

        <p style={{ margin: '0 0 6px', fontWeight: 600 }}>{de ? 'Sätze für das Gespräch' : 'Фразы для разговора'}</p>
        <ol style={{ margin: 0, paddingLeft: 20 }}>
          {phrases.map(([d, r]) => (
            <li key={d} style={{ marginBottom: 8 }}>
              <div style={{ fontWeight: 600 }}>{d}</div>
              {!de && <div style={{ color: '#6b7085', fontSize: 13.5 }}>{r}</div>}
            </li>
          ))}
        </ol>
        <button style={btn} onClick={copyAll}>
          {copied ? (de ? '✓ Kopiert' : '✓ Скопировано') : de ? '📋 Sätze kopieren' : '📋 Скопировать фразы'}
        </button>

        <p style={{ margin: '14px 0 6px', fontWeight: 600 }}>{de ? 'Mitnehmen bzw. bereithalten' : 'Взять с собой / держать под рукой'}</p>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          <li>{de ? 'Diesen Brief (alle Seiten)' : 'Это письмо (все страницы)'}</li>
          <li>{de ? 'Ausweis oder Aufenthaltstitel' : 'Паспорт или ВНЖ (Aufenthaltstitel)'}</li>
          {(unterlagen || []).map((u) => (
            <li key={u}>{u}</li>
          ))}
          <li>{de ? 'Stift und Papier: Datum, Uhrzeit und Namen der Ansprechperson notieren' : 'Ручку и бумагу: записать дату, время и имя сотрудника'}</li>
        </ul>
        <p style={{ margin: '10px 0 0', fontSize: 13, color: '#4b4e5c' }}>
          {de
            ? 'Tipp: Viele Behörden bieten auf Anfrage Dolmetscher an – fragen Sie danach. Die Behördennummer 115 hilft, die zuständige Stelle zu finden.'
            : 'Совет: многие ведомства по запросу предоставляют переводчика — спросите об этом. Номер 115 поможет найти нужное ведомство.'}
        </p>
      </div>
    </details>
  );
}

/* ---------------- Отдельная проверка на мошенничество: результат ---------------- */

export interface FraudCheck {
  art: string;
  absender: string;
  echtheit: 'unauffaellig' | 'pruefen' | 'verdaechtig';
  betrugsHinweise: string[];
  entwarnung: string[];
  schritte: string[];
}

export function FraudResult({ check, language, onExplain, canExplain }: { check: FraudCheck; language: Lang; onExplain?: () => void; canExplain?: boolean }) {
  const de = language === 'de';
  const v = {
    unauffaellig: { de: 'Keine Warnzeichen gefunden', ru: 'Признаков мошенничества не найдено', c: '#067647', bg: '#ecfdf3' },
    pruefen: { de: 'Bitte genauer prüfen', ru: 'Стоит проверить', c: '#b54708', bg: '#fff6ed' },
    verdaechtig: { de: 'Wahrscheinlich Betrug', ru: 'Похоже на мошенничество', c: '#b42318', bg: '#fef3f2' },
  }[check.echtheit];
  const artName: Record<string, [string, string]> = {
    brief: ['Brief', 'Письмо'],
    email: ['E-Mail', 'E-mail'],
    sms: ['SMS', 'SMS'],
    messenger: ['Messenger-Nachricht', 'Сообщение в мессенджере'],
    sonstiges: ['Dokument', 'Документ'],
  };
  const [aDe, aRu] = artName[check.art] || artName.sonstiges;

  return (
    <div>
      <div
        style={{
          ...card,
          background: v.bg,
          borderColor: v.c,
          borderWidth: 2,
          textAlign: 'center',
          padding: '24px 16px',
        }}
      >
        <div
          className="deasy-stamp"
          style={{
            display: 'inline-block',
            border: `3px solid ${v.c}`,
            color: v.c,
            borderRadius: 8,
            padding: '8px 16px',
            fontSize: 22,
            fontWeight: 800,
            transform: 'rotate(-3deg)',
            letterSpacing: 0.3,
          }}
        >
          {de ? v.de : v.ru}
        </div>
        <p style={{ margin: '12px 0 0', color: '#4b4e5c' }}>
          {de ? aDe : aRu}
          {check.absender && ` – ${de ? 'angeblich von' : 'якобы от'} ${check.absender}`}
        </p>
      </div>

      {check.betrugsHinweise.length > 0 && (
        <div style={card}>
          <h3 style={h3}>🚩 {de ? 'Warnzeichen' : 'Тревожные признаки'}</h3>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {check.betrugsHinweise.map((h) => (
              <li key={h} style={{ marginBottom: 4 }}>{h}</li>
            ))}
          </ul>
        </div>
      )}

      {check.entwarnung.length > 0 && (
        <div style={card}>
          <h3 style={h3}>✅ {de ? 'Spricht für Echtheit' : 'Говорит в пользу подлинности'}</h3>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {check.entwarnung.map((h) => (
              <li key={h} style={{ marginBottom: 4 }}>{h}</li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ ...card, background: '#f5f7ff', borderColor: '#c9d4fb' }}>
        <h3 style={h3}>👣 {de ? 'Was jetzt sicher ist' : 'Что безопасно сделать сейчас'}</h3>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          {(check.schritte.length
            ? check.schritte
            : de
            ? ['Absender über die Nummer auf seiner offiziellen Website kontaktieren.', 'Nichts zahlen und keine Daten eingeben, bevor die Echtheit geklärt ist.']
            : ['Свяжитесь с отправителем по номеру с его официального сайта.', 'Ничего не платите и не вводите данные, пока не убедитесь в подлинности.']
          ).map((s) => (
            <li key={s} style={{ marginBottom: 4 }}>{s}</li>
          ))}
        </ul>
      </div>

      {onExplain && (
        <button
          onClick={onExplain}
          disabled={!canExplain}
          style={{ ...btn, width: '100%', padding: '12px 14px', fontSize: 15, marginBottom: 16, opacity: canExplain ? 1 : 0.6 }}
        >
          📄 {de ? 'Dieses Schreiben jetzt auch erklären lassen (1 Brief)' : 'Объяснить это письмо полностью (1 письмо)'}
        </button>
      )}

      <p style={{ fontSize: 12.5, color: '#6b7085', margin: 0 }}>
        {de
          ? 'Automatische KI-Einschätzung ohne Gewähr. Auch ohne Warnzeichen kann ein Dokument gefälscht sein – im Zweifel beim Absender über die offizielle Nummer nachfragen.'
          : 'Автоматическая оценка ИИ без гарантий. Даже без тревожных признаков документ может быть поддельным — если сомневаетесь, позвоните отправителю по официальному номеру.'}
      </p>
    </div>
  );
}
