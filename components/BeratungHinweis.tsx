import React from 'react';

/**
 * Где получить настоящую консультацию. Без внешних ссылок — только названия организаций,
 * чтобы не было битых ссылок и передачи данных третьим лицам.
 */

type Lang = 'de' | 'ru';

const GENERAL: Record<Lang, { title: string; intro: string; items: [string, string][]; outro: string }> = {
  de: {
    title: 'Wo bekomme ich verbindliche Hilfe?',
    intro:
      'DEASY hilft beim Verstehen. Eine Beratung zu Ihrem persönlichen Fall – etwa ob sich ein Widerspruch lohnt – dürfen nur Fachleute und anerkannte Beratungsstellen geben. Viele davon sind kostenlos:',
    items: [
      ['Jobcenter, Bürgergeld, Sozialleistungen', 'Sozialberatung (z. B. Caritas, Diakonie, AWO, Paritätischer)'],
      ['Aufenthalt, Ausländerbehörde, Integration', 'Migrationsberatung für Erwachsene (MBE), Jugendmigrationsdienst'],
      ['Miete, Nebenkosten, Kündigung der Wohnung', 'Örtlicher Mieterverein'],
      ['Verträge, Rechnungen, Inkasso', 'Verbraucherzentrale'],
      ['Krankenkasse, Pflege', 'Unabhängige Patientenberatung, Pflegestützpunkt'],
      ['Steuern, Kindergeld', 'Lohnsteuerhilfeverein, Steuerberatung'],
      ['Rechtliche Vertretung', 'Rechtsanwältin oder Rechtsanwalt – bei geringem Einkommen mit Beratungshilfeschein vom Amtsgericht'],
    ],
    outro: 'Achten Sie auf Fristen im Brief und melden Sie sich rechtzeitig.',
  },
  ru: {
    title: 'Где получить настоящую консультацию?',
    intro:
      'DEASY помогает понять письмо. Консультировать по вашей личной ситуации — например, стоит ли подавать Widerspruch — вправе только специалисты и признанные консультационные службы. Многие из них бесплатны:',
    items: [
      ['Jobcenter, Bürgergeld, социальные пособия', 'Sozialberatung (например, Caritas, Diakonie, AWO, Paritätischer)'],
      ['ВНЖ, Ausländerbehörde, интеграция', 'Migrationsberatung für Erwachsene (MBE), Jugendmigrationsdienst'],
      ['Аренда, Nebenkosten, расторжение договора', 'Местный Mieterverein'],
      ['Договоры, счета, коллекторы (Inkasso)', 'Verbraucherzentrale'],
      ['Больничная касса, уход', 'Unabhängige Patientenberatung, Pflegestützpunkt'],
      ['Налоги, Kindergeld', 'Lohnsteuerhilfeverein, Steuerberater'],
      ['Юридическое представительство', 'Адвокат — при низком доходе по Beratungshilfeschein из Amtsgericht'],
    ],
    outro: 'Обратите внимание на сроки в письме и обращайтесь заранее.',
  },
};

const box: React.CSSProperties = {
  marginTop: 20,
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  padding: '12px 16px',
  background: '#fcfcfd',
  fontSize: 14,
  lineHeight: 1.55,
  color: '#3d4257',
};

export function BeratungHinweis({ language }: { language: Lang }) {
  const t = GENERAL[language];
  return (
    <details style={box}>
      <summary style={{ cursor: 'pointer', fontWeight: 700, color: '#1c2340' }}>🧭 {t.title}</summary>
      <p style={{ margin: '10px 0 8px' }}>{t.intro}</p>
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        {t.items.map(([topic, where]) => (
          <li key={topic} style={{ marginBottom: 4 }}>
            <strong>{topic}:</strong> {where}
          </li>
        ))}
      </ul>
      <p style={{ margin: '8px 0 0' }}>{t.outro}</p>
    </details>
  );
}

/** Карточка вместо анализа для налоговых писем (§ 2 StBerG). */
export function SteuerHinweis({ language, absender }: { language: Lang; absender?: string }) {
  const de = language === 'de';
  return (
    <div style={{ ...box, background: '#f8f7ff', borderColor: '#d9d4ff', marginTop: 0 }}>
      <h3 style={{ margin: '0 0 8px', color: '#1c2340' }}>
        {de ? '🧾 Dieses Schreiben betrifft Steuern' : '🧾 Это письмо касается налогов'}
      </h3>
      {absender && (
        <p style={{ margin: '0 0 8px', color: '#6b7085' }}>
          {de ? 'Absender' : 'Отправитель'}: {absender}
        </p>
      )}
      <p style={{ margin: '0 0 8px' }}>
        {de
          ? 'Hilfe in Steuersachen dürfen in Deutschland nur Steuerberaterinnen und Steuerberater, Lohnsteuerhilfevereine und einige weitere Stellen leisten. Damit Sie sich auf die Auskunft verlassen können, erklären wir Steuerschreiben deshalb nicht – auch nicht teilweise.'
          : 'Помогать в налоговых делах в Германии вправе только Steuerberater, Lohnsteuerhilfeverein и некоторые другие организации. Чтобы вы получили надёжный ответ, налоговые письма мы не разбираем — даже частично.'}
      </p>
      <p style={{ margin: '0 0 6px', fontWeight: 600 }}>{de ? 'So bekommen Sie schnell Hilfe:' : 'Где быстро получить помощь:'}</p>
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        <li>
          {de
            ? 'Lohnsteuerhilfeverein – günstig für Arbeitnehmer, Rentner und bei Kindergeld'
            : 'Lohnsteuerhilfeverein — недорого для работников по найму, пенсионеров и по Kindergeld'}
        </li>
        <li>{de ? 'Steuerberatung – z. B. über den Suchdienst der Steuerberaterkammer' : 'Steuerberater — например, через поиск Steuerberaterkammer'}</li>
        <li>
          {de
            ? 'Das Finanzamt bzw. die Familienkasse selbst – die Telefonnummer steht oben im Brief; Fragen zum Schreiben sind dort kostenlos'
            : 'Сам Finanzamt или Familienkasse — телефон указан в шапке письма; вопросы по письму там бесплатны'}
        </li>
        <li>{de ? 'Migrationsberatung – hilft, die passende Stelle zu finden' : 'Migrationsberatung — поможет найти нужную службу'}</li>
      </ul>
      <p style={{ margin: '10px 0 0', fontSize: 13 }}>
        {de
          ? 'Steuerschreiben enthalten oft Fristen. Bitte melden Sie sich zeitnah. Dieses Dokument wurde nicht auf Ihr Kontingent angerechnet.'
          : 'В налоговых письмах часто есть сроки — обратитесь как можно скорее. Этот документ не засчитан в ваш лимит.'}
      </p>
    </div>
  );
}
