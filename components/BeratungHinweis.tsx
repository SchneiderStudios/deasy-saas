import React from 'react';

/**
 * Где получить настоящую консультацию — с официальными сайтами ведомств.
 * Все ссылки проверены 04.10.2026. Внешние ссылки открываются только по клику (без передачи данных заранее).
 */

type Lang = 'de' | 'ru';

interface Link {
  label: string;
  href: string;
}
interface Topic {
  topic: string;
  official?: Link[];
  beratung: string;
  beratungLinks?: Link[];
}

const L = {
  behoerde115: { label: '115.de – Behördennummer', href: 'https://www.115.de' },
  jobcenter: { label: 'arbeitsagentur.de/grundsicherung', href: 'https://www.arbeitsagentur.de/grundsicherung' },
  familienkasse: { label: 'Familienkasse (arbeitsagentur.de)', href: 'https://www.arbeitsagentur.de/familie-und-kinder' },
  bamfNavi: { label: 'BAMF-NAvI (Beratungsstellen-Suche)', href: 'https://bamf-navi.bamf.de' },
  elster: { label: 'elster.de', href: 'https://www.elster.de' },
  stbk: { label: 'Bundessteuerberaterkammer', href: 'https://www.bstbk.de' },
  upd: { label: 'patientenberatung.de', href: 'https://www.patientenberatung.de' },
  vz: { label: 'verbraucherzentrale.de', href: 'https://www.verbraucherzentrale.de' },
  dmb: { label: 'mieterbund.de', href: 'https://www.mieterbund.de' },
};

const TEXT: Record<Lang, { title: string; intro: string; officialLabel: string; beratungLabel: string; topics: Topic[]; general: string; outro: string }> = {
  de: {
    title: 'Wo bekomme ich verbindliche Hilfe?',
    intro:
      'DEASY hilft beim Verstehen. Verbindliche Auskünfte zu Ihrem Fall geben die Behörde selbst und anerkannte Beratungsstellen – viele davon kostenlos. Die erste Anlaufstelle ist immer der Absender: Telefonnummer und Ansprechperson stehen oben im Brief.',
    officialLabel: 'Offiziell',
    beratungLabel: 'Beratung',
    topics: [
      { topic: 'Jobcenter, Grundsicherung (früher Bürgergeld)', official: [L.jobcenter], beratung: 'Sozialberatung, z. B. Caritas, Diakonie, AWO' },
      { topic: 'Aufenthalt, Ausländerbehörde, Integration', official: [L.bamfNavi], beratung: 'Migrationsberatung für Erwachsene (MBE), Jugendmigrationsdienst – über BAMF-NAvI zu finden; die Ausländerbehörde finden Sie auf der Website Ihrer Stadt' },
      { topic: 'Kindergeld, Kinderzuschlag', official: [L.familienkasse], beratung: 'Familienkasse direkt oder Lohnsteuerhilfeverein' },
      { topic: 'Steuern, Finanzamt', official: [L.elster], beratung: 'Lohnsteuerhilfeverein oder Steuerberatung', beratungLinks: [L.stbk] },
      { topic: 'Krankenkasse, Pflege', beratung: 'Unabhängige Patientenberatung, Pflegestützpunkt', beratungLinks: [L.upd] },
      { topic: 'Miete, Nebenkosten, Wohnung', beratung: 'Örtlicher Mieterverein', beratungLinks: [L.dmb] },
      { topic: 'Verträge, Rechnungen, Inkasso', beratung: 'Verbraucherzentrale', beratungLinks: [L.vz] },
      { topic: 'Anwaltliche Vertretung', beratung: 'Rechtsanwältin oder Rechtsanwalt – bei geringem Einkommen mit Beratungshilfeschein vom Amtsgericht Ihres Wohnorts' },
    ],
    general: 'Sie wissen nicht, welche Behörde zuständig ist? Die Behördennummer 115 hilft weiter:',
    outro: 'Bitte achten Sie auf Fristen im Brief und melden Sie sich rechtzeitig.',
  },
  ru: {
    title: 'Где получить надёжную консультацию?',
    intro:
      'DEASY помогает понять письмо. Точный ответ по вашей ситуации дают само ведомство и признанные консультационные службы — многие бесплатно. Первым делом стоит обратиться к отправителю: телефон и контактное лицо указаны в шапке письма.',
    officialLabel: 'Официально',
    beratungLabel: 'Консультация',
    topics: [
      { topic: 'Jobcenter, Grundsicherung (раньше Bürgergeld)', official: [L.jobcenter], beratung: 'Sozialberatung, например Caritas, Diakonie, AWO' },
      { topic: 'ВНЖ, Ausländerbehörde, интеграция', official: [L.bamfNavi], beratung: 'Migrationsberatung für Erwachsene (MBE), Jugendmigrationsdienst — ищите через BAMF-NAvI; Ausländerbehörde — на сайте вашего города' },
      { topic: 'Kindergeld, Kinderzuschlag', official: [L.familienkasse], beratung: 'Сама Familienkasse или Lohnsteuerhilfeverein' },
      { topic: 'Налоги, Finanzamt', official: [L.elster], beratung: 'Lohnsteuerhilfeverein или Steuerberater', beratungLinks: [L.stbk] },
      { topic: 'Больничная касса, уход', beratung: 'Unabhängige Patientenberatung, Pflegestützpunkt', beratungLinks: [L.upd] },
      { topic: 'Аренда, Nebenkosten, жильё', beratung: 'Местный Mieterverein', beratungLinks: [L.dmb] },
      { topic: 'Договоры, счета, Inkasso', beratung: 'Verbraucherzentrale', beratungLinks: [L.vz] },
      { topic: 'Помощь адвоката', beratung: 'Адвокат — при низком доходе по Beratungshilfeschein из Amtsgericht по месту жительства' },
    ],
    general: 'Не знаете, какое ведомство отвечает за ваш вопрос? Поможет единый номер ведомств 115:',
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

const Ext = ({ link }: { link: Link }) => (
  <a href={link.href} target="_blank" rel="noopener noreferrer" style={{ color: '#4338ca' }}>
    {link.label} ↗
  </a>
);

export function BeratungHinweis({ language, open = false }: { language: Lang; open?: boolean }) {
  const t = TEXT[language];
  return (
    <details style={box} open={open}>
      <summary style={{ cursor: 'pointer', fontWeight: 700, color: '#1c2340' }}>🧭 {t.title}</summary>
      <p style={{ margin: '10px 0 8px' }}>{t.intro}</p>
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        {t.topics.map((x) => (
          <li key={x.topic} style={{ marginBottom: 8 }}>
            <strong>{x.topic}</strong>
            {x.official && (
              <div>
                {t.officialLabel}:{' '}
                {x.official.map((l, i) => (
                  <React.Fragment key={l.href}>
                    {i > 0 && ', '}
                    <Ext link={l} />
                  </React.Fragment>
                ))}
              </div>
            )}
            <div>
              {t.beratungLabel}: {x.beratung}
              {x.beratungLinks?.map((l) => (
                <React.Fragment key={l.href}>
                  {' – '}
                  <Ext link={l} />
                </React.Fragment>
              ))}
            </div>
          </li>
        ))}
      </ul>
      <p style={{ margin: '8px 0 0' }}>
        {t.general} <Ext link={L.behoerde115} />
      </p>
      <p style={{ margin: '6px 0 0' }}>{t.outro}</p>
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
          ? 'Hilfe in Steuersachen dürfen in Deutschland nur Steuerberaterinnen und Steuerberater, Lohnsteuerhilfevereine und einige weitere Stellen leisten. Damit Sie sich auf die Auskunft verlassen können, erklären wir Steuerschreiben nicht – auch nicht teilweise.'
          : 'Помогать в налоговых делах в Германии вправе только Steuerberater, Lohnsteuerhilfeverein и некоторые другие организации. Чтобы вы получили надёжный ответ, налоговые письма мы не разбираем — даже частично.'}
      </p>
      <p style={{ margin: '0 0 6px', fontWeight: 600 }}>{de ? 'So bekommen Sie schnell Hilfe:' : 'Где быстро получить помощь:'}</p>
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        <li style={{ marginBottom: 4 }}>
          {de
            ? 'Beim Absender selbst – Telefonnummer und Ansprechperson stehen oben im Brief; Fragen zum Schreiben sind kostenlos.'
            : 'У самого отправителя — телефон и контактное лицо указаны в шапке письма; вопросы по письму бесплатны.'}
        </li>
        <li style={{ marginBottom: 4 }}>
          {de ? 'Offizielles Steuerportal der Finanzverwaltung: ' : 'Официальный налоговый портал: '}
          <Ext link={L.elster} />
        </li>
        <li style={{ marginBottom: 4 }}>
          {de ? 'Kindergeld: ' : 'Kindergeld: '}
          <Ext link={L.familienkasse} />
        </li>
        <li style={{ marginBottom: 4 }}>
          {de
            ? 'Lohnsteuerhilfeverein (günstig für Arbeitnehmer und Rentner) oder Steuerberatung – Verzeichnis über die '
            : 'Lohnsteuerhilfeverein (недорого для работников и пенсионеров) или Steuerberater — реестр у '}
          <Ext link={L.stbk} />
        </li>
        <li>
          {de ? 'Zuständige Stelle unklar? ' : 'Не знаете, куда обращаться? '}
          <Ext link={L.behoerde115} />
        </li>
      </ul>
      <p style={{ margin: '10px 0 0', fontSize: 13 }}>
        {de
          ? 'Steuerschreiben enthalten oft Fristen. Bitte melden Sie sich zeitnah. Dieses Dokument wurde nicht auf Ihr Kontingent angerechnet.'
          : 'В налоговых письмах часто есть сроки — обратитесь как можно скорее. Этот документ не засчитан в ваш лимит.'}
      </p>
    </div>
  );
}
