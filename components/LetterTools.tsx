import React, { useState } from 'react';
import { downloadIcs, fmtDate, daysLeft, Frist } from '@/lib/ics';
import s from '@/styles/Sheet.module.css';
import { IconCalendar, IconClock, IconShield, IconPhone, IconFlag, IconCheck, IconSteps, IconDoc } from '@/components/icons';

type Lang = 'de' | 'ru';

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
  const leer = list.length === 0 && deadlines.length === 0;

  return (
    <div className={`${s.note} ${leer ? '' : s.noteFrist}`}>
      <p className={s.noteHead}>
        <IconClock /> {de ? 'Frist' : 'Срок'}
      </p>

      {leer && <p>{de ? 'Im Brief steht keine konkrete Frist.' : 'В письме нет конкретного срока.'}</p>}

      {list.length > 0 ? (
        <>
          {list.map((f) => {
            const d = daysLeft(f.datum);
            const cls = d < 0 ? s.statusBad : d <= 7 ? s.statusWarn : s.statusOk;
            const txt =
              d < 0 ? (de ? 'abgelaufen' : 'срок прошёл') : de ? `noch ${d} Tage` : `осталось ${d} дн.`;
            return (
              <div key={f.datum + f.was} className={s.fristRow}>
                <div className={s.fristDate}>{fmtDate(f.datum)}</div>
                <div className={`${s.fristLeft} ${cls}`}>{txt}</div>
                <p style={{ marginTop: 4 }}>{f.was}</p>
                <button type="button" className={`${s.btn} ${s.btnFull}`} onClick={() => downloadIcs([f], absender || '', aktenzeichen)}>
                  <IconCalendar /> {de ? 'In Kalender' : 'В календарь'}
                </button>
              </div>
            );
          })}
          {list.length > 1 && (
            <button
              type="button"
              className={`${s.btn} ${s.btnFull}`}
              style={{ marginTop: 10 }}
              onClick={() => downloadIcs(list, absender || '', aktenzeichen)}
            >
              <IconCalendar /> {de ? 'Alle Fristen' : 'Все сроки'}
            </button>
          )}
          <p className={s.hint}>
            {de
              ? 'Mit Erinnerung 3 Tage und 1 Tag vorher. Bitte das Datum mit dem Brief abgleichen.'
              : 'С напоминанием за 3 дня и за 1 день. Сверьте дату с письмом.'}
          </p>
        </>
      ) : (
        deadlines.length > 0 && (
          <ul>
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
    <div className={`${s.note} ${verdacht ? s.noteMarker : ''}`}>
      <p className={s.noteHead}>
        <IconShield /> {de ? 'Echtheits-Check' : 'Проверка на обман'}
      </p>
      <p className={verdacht ? s.statusWarn : s.statusOk}>
        {verdacht
          ? de
            ? 'Bitte prüfen'
            : 'Стоит проверить'
          : de
          ? 'Keine Auffälligkeiten erkannt'
          : 'Подозрительного не найдено'}
      </p>

      {verdacht && hinweise && hinweise.length > 0 && (
        <ul style={{ margin: '8px 0' }}>
          {hinweise.map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ul>
      )}

      <details style={{ marginTop: 8 }}>
        <summary className={s.linkish} style={{ cursor: 'pointer' }}>
          {de ? 'So prüfen Sie einen Brief selbst' : 'Как проверить письмо самому'}
        </summary>
        <ul style={{ marginTop: 8 }}>
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
            <li key={t}>{t}</li>
          ))}
        </ul>
      </details>

      <p className={s.hint}>
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
    <details className={s.fold}>
      <summary>
        <IconPhone /> {de ? 'Anruf oder Termin vorbereiten' : 'Подготовка к звонку или визиту'}
      </summary>

      <div className={s.foldBody}>
        {(absender || telefon) && (
          <p>
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
          <p className={s.statusWarn}>
            {de
              ? 'Wegen der Warnzeichen: Nummer nur von der offiziellen Website der Behörde verwenden.'
              : 'Из-за признаков мошенничества берите номер только с официального сайта ведомства.'}
          </p>
        )}

        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, margin: '10px 0 8px' }}>
          {de ? 'Ihr Name (wird in die Sätze eingesetzt, nicht gespeichert)' : 'Ваше имя (подставится во фразы, не сохраняется)'}
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              display: 'block',
              width: '100%',
              boxSizing: 'border-box',
              marginTop: 4,
              padding: '10px 12px',
              borderRadius: 10,
              border: '1px solid var(--line)',
              fontSize: 16,
            }}
          />
        </label>

        <p style={{ fontWeight: 600, margin: '0 0 6px' }}>{de ? 'Sätze für das Gespräch' : 'Фразы для разговора'}</p>
        <ol style={{ margin: 0, paddingLeft: 20 }}>
          {phrases.map(([d, r]) => (
            <li key={d} style={{ marginBottom: 8 }}>
              <div style={{ fontWeight: 600 }}>{d}</div>
              {!de && <div style={{ color: 'var(--muted)', fontSize: 13.5 }}>{r}</div>}
            </li>
          ))}
        </ol>
        <button type="button" className={s.btn} style={{ marginTop: 10 }} onClick={copyAll}>
          {copied ? (
            <>
              <IconCheck /> {de ? 'Kopiert' : 'Скопировано'}
            </>
          ) : (
            <>
              <IconDoc /> {de ? 'Sätze kopieren' : 'Скопировать фразы'}
            </>
          )}
        </button>

        <p style={{ margin: '16px 0 6px', fontWeight: 600 }}>{de ? 'Mitnehmen bzw. bereithalten' : 'Взять с собой / держать под рукой'}</p>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          <li>{de ? 'Diesen Brief (alle Seiten)' : 'Это письмо (все страницы)'}</li>
          <li>{de ? 'Ausweis oder Aufenthaltstitel' : 'Паспорт или ВНЖ (Aufenthaltstitel)'}</li>
          {(unterlagen || []).map((u) => (
            <li key={u}>{u}</li>
          ))}
          <li>{de ? 'Stift und Papier: Datum, Uhrzeit und Namen der Ansprechperson notieren' : 'Ручку и бумагу: записать дату, время и имя сотрудника'}</li>
        </ul>
        <p className={s.hint}>
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
    unauffaellig: { de: 'Keine Warnzeichen gefunden', ru: 'Признаков мошенничества не найдено', c: '#1f7a4d', bg: '#f2faf5' },
    pruefen: { de: 'Bitte genauer prüfen', ru: 'Стоит проверить', c: '#b54708', bg: '#fffaf2' },
    verdaechtig: { de: 'Wahrscheinlich Betrug', ru: 'Похоже на мошенничество', c: '#c8321f', bg: '#fdf5f3' },
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
        className={s.sheet}
        style={{ background: v.bg, borderColor: v.c, textAlign: 'center' }}
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
        <p style={{ margin: '12px 0 0', color: 'var(--muted)' }}>
          {de ? aDe : aRu}
          {check.absender && ` – ${de ? 'angeblich von' : 'якобы от'} ${check.absender}`}
        </p>
      </div>

      {check.betrugsHinweise.length > 0 && (
        <div className={`${s.note} ${s.noteFrist}`} style={{ marginBottom: 14 }}>
          <p className={s.noteHead}>
            <IconFlag /> {de ? 'Warnzeichen' : 'Тревожные признаки'}
          </p>
          <ul>
            {check.betrugsHinweise.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        </div>
      )}

      {check.entwarnung.length > 0 && (
        <div className={s.note} style={{ marginBottom: 14 }}>
          <p className={s.noteHead}>
            <IconCheck /> {de ? 'Spricht für Echtheit' : 'Говорит в пользу подлинности'}
          </p>
          <ul>
            {check.entwarnung.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        </div>
      )}

      <div className={`${s.note} ${s.notePen}`} style={{ marginBottom: 14 }}>
        <p className={s.noteHead}>
          <IconSteps /> {de ? 'Was jetzt sicher ist' : 'Что безопасно сделать сейчас'}
        </p>
        <ul>
          {(check.schritte.length
            ? check.schritte
            : de
            ? ['Absender über die Nummer auf seiner offiziellen Website kontaktieren.', 'Nichts zahlen und keine Daten eingeben, bevor die Echtheit geklärt ist.']
            : ['Свяжитесь с отправителем по номеру с его официального сайта.', 'Ничего не платите и не вводите данные, пока не убедитесь в подлинности.']
          ).map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </div>

      {onExplain && (
        <button
          type="button"
          onClick={onExplain}
          disabled={!canExplain}
          className={`${s.btn} ${s.btnFull} ${s.btnSolid}`}
          style={{ padding: '12px 14px', fontSize: 15, marginBottom: 16, opacity: canExplain ? 1 : 0.6 }}
        >
          <IconDoc /> {de ? 'Dieses Schreiben jetzt auch erklären lassen (1 Brief)' : 'Объяснить это письмо полностью (1 разбор)'}
        </button>
      )}

      <p className={s.hint} style={{ marginTop: 0 }}>
        {de
          ? 'Automatische KI-Einschätzung ohne Gewähr. Auch ohne Warnzeichen kann ein Dokument gefälscht sein – im Zweifel beim Absender über die offizielle Nummer nachfragen.'
          : 'Автоматическая оценка ИИ без гарантий. Даже без тревожных признаков документ может быть поддельным — если сомневаетесь, позвоните отправителю по официальному номеру.'}
      </p>
    </div>
  );
}
