import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import styles from '@/styles/Landing.module.css';
import LegalLinks from '@/components/LegalLinks';
import { STRIPE_LINKS } from '@/lib/siteConfig';
import ContactForm from '@/components/ContactForm';
import { GUIDES } from '@/lib/guides';

type Lang = 'ru' | 'de';

const COPY = {
  ru: {
    title: 'DEASY — немецкие письма понятным языком',
    desc: 'Сфотографируйте письмо из ведомства: DEASY переведёт его простыми словами, найдёт сроки, подскажет, куда обратиться, и проверит на мошенничество.',
    nav: { how: 'Как работает', fraud: 'Проверка на обман', prices: 'Цены', guides: 'Гайды', faq: 'Вопросы', open: 'Открыть DEASY' },
    h1: 'Немецкие письма — понятным языком',
    lead: 'Сфотографируйте письмо. DEASY переведёт его простыми словами, найдёт сроки и подскажет, куда обратиться. И проверит, не мошенники ли это.',
    cta: 'Сфотографировать письмо',
    ctaFraud: 'Проверить на обман бесплатно',
    facts: ['2 письма в месяц бесплатно', 'Без подписки', 'Письма не храним на сервере'],
    notes: ['Срок: прислать до 20 октября', 'Нужны выписки со счёта за 3 месяца', 'Если не прислать — выплаты могут остановить'],
    notesTitle: 'Что DEASY отметил в письме',
    whatTitle: 'Три вещи, которые нужны от любого письма',
    what: [
      { h: 'Что здесь написано', p: 'Перевод простыми словами: кто пишет, чего хочет и что будет, если ничего не делать.' },
      { h: 'До какого числа', p: 'Все сроки с отсчётом дней — и одной кнопкой в календарь телефона с напоминанием.' },
      { h: 'Куда обратиться', p: 'Официальные сайты ведомств и бесплатные консультации по теме письма, плюс готовые фразы для звонка.' },
    ],
    widgetSummary: 'Jobcenter просит выписки со счёта и справку о доходах.',
    widgetLeft: 'осталось 15 дней',
    widgetCal: 'В календарь',
    widgetWhere: 'Sozialberatung, arbeitsagentur.de, номер 115',
    fraudTitle: 'Мошенники тоже пишут «от ведомства»',
    fraudText:
      'Поддельные SMS «от Finanzamt», письма от несуществующих Inkasso-бюро, угрозы штрафом за 24 часа. DEASY ищет типичные признаки обмана в письмах, e-mail и SMS — до того, как вы заплатите или введёте данные.',
    fraudList: ['Чужой или иностранный счёт для оплаты', 'Давление и угрозы с коротким сроком', 'Ссылки на поддельные сайты', 'Нет номера дела и настоящего отправителя'],
    fraudCta: 'Проверить письмо или SMS',
    demo: '▶ Посмотреть пример разбора — без загрузки',
    fraudFree: '5 проверок в месяц бесплатно',
    sms: 'Finanzamt: Ihre Steuererstattung von 412,30 EUR ist bereit. Bestätigen Sie Ihre Bankdaten innerhalb von 24 Std.: finanzamt-erstattung.co/de',
    stamp: 'Похоже на мошенничество',
    flags: ['Ведомства не пишут о деньгах в SMS', 'Чужой сайт вместо elster.de', 'Срок 24 часа — давление'],
    howTitle: 'Как это работает',
    how: [
      { h: 'Сфотографируйте письмо', p: 'Телефоном или загрузите PDF. Можно несколько страниц.' },
      { h: 'Прочитайте объяснение', p: 'Через 10–20 секунд — что в письме, сроки, документы и куда идти. Можно задать вопрос.' },
      { h: 'Не пропустите срок', p: 'Добавьте срок в календарь и сохраните письмо в «Мои письма».' },
    ],
    pricesTitle: 'Платите за разборы, а не за подписку',
    pricesLead: 'Письма приходят когда угодно — поэтому без ежемесячных платежей. Купленные разборы действуют 12 месяцев.',
    plans: [
      { name: 'Бесплатно', price: '0 €', note: 'каждый месяц', items: ['2 разбора писем', '5 проверок на мошенничество', 'Конструктор письма — без лимита', '«Мои письма» и сроки в календарь'], cta: 'Начать', href: '/app', link: '' },
      { name: 'Plus', price: '4,99 €', note: '5 разборов · около 1 € за разбор', items: ['5 полных разборов: объяснение, чат и сроки', 'Шаблоны простых ответов', 'Действует 12 месяцев'], cta: 'Выбрать Plus', href: '', link: 'paket5' },
      { name: 'Pro', price: '9,99 €', note: '15 разборов · 0,67 € за разбор', items: ['Всё как в Plus, но 15 разборов', 'Выгоднее для семьи', 'Действует 12 месяцев'], cta: 'Выбрать Pro', href: '', link: 'paket15' },
    ],
    soon: 'Скоро',
    priceNote: 'Окончательные цены, без НДС по § 19 UStG. Разовый платёж, отмена не нужна.',
    agb: 'Условия (AGB)',
    widerruf: 'Право отзыва',
    limitsTitle: 'Честно о границах',
    limits: [
      { h: 'Не юридическая консультация', p: 'DEASY объясняет и помогает не пропустить срок. Решения — например, подавать ли Widerspruch — принимайте со специалистом.' },
      { h: 'Налоговые письма не разбираем', p: 'По закону помогать с налогами могут только Steuerberater и Lohnsteuerhilfeverein. Для писем из Finanzamt подскажем, куда обратиться.' },
      { h: 'ИИ может ошибаться', p: 'Разбор делает искусственный интеллект. Даты и суммы всегда сверяйте с самим письмом, а при сомнениях звоните отправителю.' },
    ],
    statsTitle: 'Вы не одни',
    stats: [
      { n: '16,4 млн', p: 'человек в Германии переехали из-за границы — почти каждый пятый житель.', src: 'Destatis, Mikrozensus 2025', url: 'https://www.destatis.de/DE/Presse/Pressemitteilungen/2026/04/PD26_128_125.html' },
      { n: '3 из 4', p: 'жителей Германии перегружены языком ведомств, 69 % перечитывают письма по несколько раз.', src: 'Taxfix-Studie 2024, 2.039 опрошенных', url: 'https://taxfix.de/pm-behoerdensprache/' },
    ],
    privacyTitle: 'Ваши данные — под вашим контролем',
    privacyLead: 'В письмах из ведомств — имя, адрес, номера дел, иногда данные о здоровье. Поэтому DEASY устроен так:',
    privacy: [
      { h: 'Без согласия ничего не уходит', p: 'Письмо отправляется на анализ ИИ только после того, как вы поставите галочку согласия. Галочку можно снять в любой момент.' },
      { h: 'Лишнее закрашиваете вы', p: 'Перед отправкой проведите пальцем по номеру счёта или имени — данные закрашиваются ещё на телефоне. В чате номера счетов и e-mail скрываются автоматически.' },
      { h: 'Мы не храним письма', p: 'На нашем сервере письмо не сохраняется. Anthropic (Claude) не обучает на нём ИИ и удаляет данные через ограниченный срок.' },
      { h: 'История — только у вас', p: 'Разборы и сроки лежат в браузере вашего телефона. Без аккаунта, cookies, трекинга и рекламы.' },
    ],
    privacyMore: 'Подробно — в Datenschutzerklärung',
    guidesTitle: 'Гайды на русском',
    guidesLead: 'Коротко и по делу: что за письмо пришло, какие бывают сроки и куда обратиться.',
    guidesAll: 'Все гайды →',
    testerTitle: 'Помогите сделать DEASY лучше',
    testerText: 'Ищем людей, которым приходят письма от ведомств. Короткий разговор на 15–20 минут по телефону или в видео — расскажете, как справляетесь с письмами сейчас. Тестеры первыми получают новые функции.',
    partnerLine: 'Вы консультант, школа или организация, которая помогает людям в Германии?',
    partnerLink: 'Станьте партнёром →',
    faqTitle: 'Частые вопросы',
    faq: [
      ['Чем это лучше, чем спросить ChatGPT?', 'Чат-бот отвечает, только если вы знаете, что спросить, и не следит за сроками. DEASY сам показывает сроки и добавляет их в календарь, проверяет письмо на мошенничество, готовит фразы для звонка и собирает все письма в одном месте.'],
      ['Почему не просто Google Translate?', 'Переводчик даёт слова, но не объясняет, что они значат для вас: что от вас хотят, до какого числа и куда обратиться. DEASY показывает именно это — и, если нужно, перевод по абзацам рядом с оригиналом.'],
      ['Я и так храню письма в папке на телефоне. Зачем DEASY?', 'Папка не напомнит о сроке и не подскажет, что делать. В «Моих письмах» видно, где срок ближе всего, письма сгруппированы по отправителю, а по тексту разборов работает поиск.'],
      ['Это юридическая консультация?', 'Нет. DEASY объясняет, что написано в письме, и помогает найти сроки и следующие шаги. Он не заменяет консультацию юриста, налогового консультанта или специалиста. Важное всегда уточняйте у отправителя письма или в бесплатной консультации (Beratungsstelle).'],
      ['Можно закрыть личные данные перед отправкой?', 'Да. После выбора фото DEASY покажет его — проведите пальцем или мышкой по номеру счёта, имени или другим данным, и они будут закрашены ещё на вашем телефоне. На анализ уйдёт уже закрашенное фото.'],
      ['Какие письма можно загружать?', 'Письма от Jobcenter, Ausländerbehörde, больничной кассы, арендодателя, Inkasso, Rundfunkbeitrag и других. Фото с телефона (включая HEIC с iPhone) или PDF до 3 страниц.'],
      ['Помогаете с письмами из Finanzamt?', 'Разбирать их по закону мы не можем. DEASY распознает налоговое письмо, не спишет за него лимит и подскажет, куда обратиться. Проверка на мошенничество для них работает.'],
      ['Нужна ли подписка?', 'Нет. Каждый месяц 2 разбора бесплатно, а дальше — разовые пакеты Plus (5 разборов) или Pro (15 разборов). Никаких автоматических списаний.'],
      ['Где хранятся мои письма?', 'Мы не храним их на сервере. Результаты разборов сохраняются только в браузере вашего телефона, и вы можете удалить их в любой момент.'],
    ],
    finalTitle: 'Письмо лежит на столе?',
    finalText: 'Сфотографируйте его — через минуту будет понятно, что делать.',
  },
  de: {
    title: 'DEASY – Behördenbriefe verständlich erklärt',
    desc: 'Fotografieren Sie Ihren Brief: DEASY erklärt ihn in einfachen Worten, findet Fristen, zeigt, wer weiterhilft, und prüft, ob er echt ist.',
    nav: { how: 'So geht’s', fraud: 'Betrugs-Check', prices: 'Preise', guides: 'Ratgeber', faq: 'Fragen', open: 'DEASY öffnen' },
    h1: 'Behördenbriefe in einfachen Worten',
    lead: 'Fotografieren Sie den Brief. DEASY erklärt ihn verständlich, findet die Fristen und zeigt, wer Ihnen weiterhilft. Und prüft, ob er echt ist.',
    cta: 'Brief fotografieren',
    ctaFraud: 'Kostenlos auf Betrug prüfen',
    facts: ['2 Briefe pro Monat kostenlos', 'Kein Abo', 'Keine Speicherung auf dem Server'],
    notes: ['Frist: bis 20. Oktober einreichen', 'Kontoauszüge der letzten 3 Monate', 'Sonst können Leistungen entfallen'],
    notesTitle: 'Was DEASY im Brief markiert hat',
    whatTitle: 'Drei Dinge, die man von jedem Brief wissen muss',
    what: [
      { h: 'Was drinsteht', p: 'In einfachen Worten: wer schreibt, was verlangt wird und was passiert, wenn man nichts tut.' },
      { h: 'Bis wann', p: 'Alle Fristen mit Tage-Countdown – und mit einem Tipp im Handy-Kalender, inklusive Erinnerung.' },
      { h: 'Wer hilft', p: 'Offizielle Websites der Behörden, kostenlose Beratungsstellen zum Thema und fertige Sätze für den Anruf.' },
    ],
    widgetSummary: 'Das Jobcenter braucht Kontoauszüge und einen Einkommensnachweis.',
    widgetLeft: 'noch 15 Tage',
    widgetCal: 'In Kalender',
    widgetWhere: 'Sozialberatung, arbeitsagentur.de, Nummer 115',
    fraudTitle: 'Auch Betrüger schreiben „vom Amt“',
    fraudText:
      'Gefälschte SMS „vom Finanzamt“, Briefe von erfundenen Inkassobüros, Drohungen mit 24-Stunden-Frist. DEASY sucht typische Betrugsmerkmale in Briefen, E-Mails und SMS – bevor Sie zahlen oder Daten eingeben.',
    fraudList: ['Fremdes oder ausländisches Konto', 'Druck und Drohungen mit kurzer Frist', 'Links auf gefälschte Websites', 'Kein Aktenzeichen, kein echter Absender'],
    fraudCta: 'Brief oder SMS prüfen',
    demo: '▶ Beispiel ansehen – ohne Upload',
    fraudFree: '5 Checks pro Monat kostenlos',
    sms: 'Finanzamt: Ihre Steuererstattung von 412,30 EUR ist bereit. Bestätigen Sie Ihre Bankdaten innerhalb von 24 Std.: finanzamt-erstattung.co/de',
    stamp: 'Wahrscheinlich Betrug',
    flags: ['Behörden schreiben über Geld nicht per SMS', 'Fremde Website statt elster.de', '24 Stunden Frist – Druck'],
    howTitle: 'So funktioniert es',
    how: [
      { h: 'Brief fotografieren', p: 'Mit dem Handy oder als PDF hochladen. Auch mehrere Seiten.' },
      { h: 'Erklärung lesen', p: 'Nach 10–20 Sekunden: Inhalt, Fristen, Unterlagen und wer hilft. Rückfragen im Chat möglich.' },
      { h: 'Frist nicht verpassen', p: 'Frist in den Kalender übernehmen und den Brief unter „Meine Briefe“ ablegen.' },
    ],
    pricesTitle: 'Sie zahlen pro Erklärung, nicht im Abo',
    pricesLead: 'Post kommt unregelmäßig – deshalb keine monatlichen Kosten. Gekaufte Erklärungen gelten 12 Monate.',
    plans: [
      { name: 'Kostenlos', price: '0 €', note: 'jeden Monat', items: ['2 Brief-Erklärungen', '5 Betrugs-Checks', 'Brief-Generator – unbegrenzt', '„Meine Briefe“ und Fristen im Kalender'], cta: 'Loslegen', href: '/app', link: '' },
      { name: 'Plus', price: '4,99 €', note: '5 Erklärungen · ca. 1 € pro Brief', items: ['5 vollständige Erklärungen mit Chat und Fristen', 'Vorlagen für einfache Antworten', '12 Monate gültig'], cta: 'Plus wählen', href: '', link: 'paket5' },
      { name: 'Pro', price: '9,99 €', note: '15 Erklärungen · 0,67 € pro Brief', items: ['Wie Plus, aber 15 Erklärungen', 'Günstiger für die ganze Familie', '12 Monate gültig'], cta: 'Pro wählen', href: '', link: 'paket15' },
    ],
    soon: 'Bald verfügbar',
    priceNote: 'Endpreise, gem. § 19 UStG ohne Umsatzsteuer. Einmalige Zahlung, keine Kündigung nötig.',
    agb: 'AGB',
    widerruf: 'Widerrufsbelehrung',
    limitsTitle: 'Ehrlich gesagt: unsere Grenzen',
    limits: [
      { h: 'Keine Rechtsberatung', p: 'DEASY erklärt und hilft, keine Frist zu verpassen. Entscheidungen – etwa über einen Widerspruch – treffen Sie mit einer Fachperson.' },
      { h: 'Keine Steuerbriefe', p: 'Hilfe in Steuersachen dürfen nur Steuerberatungen und Lohnsteuerhilfevereine leisten. Bei Post vom Finanzamt zeigen wir, wohin Sie sich wenden.' },
      { h: 'KI kann sich irren', p: 'Die Erklärung erstellt eine künstliche Intelligenz. Prüfen Sie Daten und Beträge immer im Brief selbst und fragen Sie im Zweifel beim Absender nach.' },
    ],
    statsTitle: 'Sie sind nicht allein',
    stats: [
      { n: '16,4 Mio.', p: 'Menschen in Deutschland sind aus dem Ausland eingewandert – fast jede fünfte Person.', src: 'Destatis, Mikrozensus 2025', url: 'https://www.destatis.de/DE/Presse/Pressemitteilungen/2026/04/PD26_128_125.html' },
      { n: '3 von 4', p: 'Menschen in Deutschland fühlen sich von Behördendeutsch überfordert, 69 % lesen Briefe mehrmals.', src: 'Taxfix-Studie 2024, 2.039 Befragte', url: 'https://taxfix.de/pm-behoerdensprache/' },
    ],
    privacyTitle: 'Ihre Daten bleiben unter Ihrer Kontrolle',
    privacyLead: 'Behördenbriefe enthalten Namen, Adressen, Aktenzeichen, manchmal Gesundheitsdaten. Deshalb funktioniert DEASY so:',
    privacy: [
      { h: 'Ohne Einwilligung geht nichts raus', p: 'Ein Brief wird erst zur KI-Analyse gesendet, wenn Sie das Häkchen zur Einwilligung setzen. Sie können es jederzeit entfernen.' },
      { h: 'Unnötiges schwärzen Sie selbst', p: 'Vor dem Senden fahren Sie über Kontonummer oder Namen – die Angaben werden auf Ihrem Gerät geschwärzt. Im Chat werden IBAN und E-Mail-Adressen automatisch verdeckt.' },
      { h: 'Wir speichern keine Briefe', p: 'Auf unserem Server wird der Brief nicht gespeichert. Anthropic (Claude) trainiert damit keine KI und löscht die Daten nach einer begrenzten Frist.' },
      { h: 'Der Verlauf bleibt bei Ihnen', p: 'Erklärungen und Fristen liegen im Browser Ihres Geräts. Kein Konto, keine Cookies, kein Tracking, keine Werbung.' },
    ],
    privacyMore: 'Details in der Datenschutzerklärung',
    guidesTitle: 'Ratgeber',
    guidesLead: 'Kurz und verständlich: welcher Brief gekommen ist, welche Fristen es gibt und wer hilft.',
    guidesAll: 'Alle Ratgeber →',
    testerTitle: 'Helfen Sie, DEASY besser zu machen',
    testerText: 'Wir suchen Menschen, die Post von Behörden bekommen. Ein kurzes Gespräch, 15–20 Minuten per Telefon oder Video: Sie erzählen, wie Sie heute mit Briefen umgehen. Tester bekommen neue Funktionen zuerst.',
    partnerLine: 'Sie beraten, unterrichten oder unterstützen Menschen in Deutschland?',
    partnerLink: 'Partner werden →',
    faqTitle: 'Häufige Fragen',
    faq: [
      ['Was ist besser als ChatGPT zu fragen?', 'Ein Chatbot antwortet nur, wenn Sie wissen, was Sie fragen sollen – und behält keine Fristen im Blick. DEASY zeigt die Fristen von selbst und trägt sie in den Kalender ein, prüft auf Betrug, bereitet Sätze für den Anruf vor und sammelt alle Briefe an einem Ort.'],
      ['Warum nicht einfach Google Übersetzer?', 'Eine Übersetzung liefert die Wörter, aber nicht, was sie für Sie bedeuten: was verlangt wird, bis wann und wer hilft. Genau das zeigt DEASY – auf Wunsch zusätzlich Absatz für Absatz neben dem Original.'],
      ['Ich habe meine Briefe doch schon in einem Ordner. Wozu DEASY?', 'Ein Ordner erinnert an keine Frist und sagt nicht, was zu tun ist. Unter „Meine Briefe“ sehen Sie, wo die Frist am nächsten ist, die Briefe sind nach Absender gruppiert und die Erklärungen durchsuchbar.'],
      ['Ist das eine Rechtsberatung?', 'Nein. DEASY erklärt den Inhalt von Briefen und hilft, Fristen und nächste Schritte zu erkennen. Es ersetzt keine rechtliche, steuerliche oder sonstige fachliche Beratung. Prüfen Sie Wichtiges immer beim Absender oder in einer kostenlosen Beratungsstelle.'],
      ['Kann ich persönliche Daten vor dem Senden schwärzen?', 'Ja. Nach der Auswahl zeigt DEASY das Foto an – fahren Sie mit Finger oder Maus über Kontonummer, Namen oder andere Angaben, und sie werden noch auf Ihrem Gerät geschwärzt. Zur Analyse geht nur das geschwärzte Bild.'],
      ['Welche Briefe kann ich hochladen?', 'Post vom Jobcenter, von der Ausländerbehörde, Krankenkasse, Vermieter, Inkasso, Rundfunkbeitrag und mehr. Handyfotos (auch HEIC vom iPhone) oder PDF bis 3 Seiten.'],
      ['Helfen Sie bei Briefen vom Finanzamt?', 'Erklären dürfen wir sie nicht. DEASY erkennt Steuerbriefe, rechnet sie nicht an und zeigt, wer hilft. Der Betrugs-Check funktioniert trotzdem.'],
      ['Brauche ich ein Abo?', 'Nein. Jeden Monat 2 Erklärungen kostenlos, danach einmalige Pakete: Plus (5 Erklärungen) oder Pro (15 Erklärungen). Keine automatischen Abbuchungen.'],
      ['Wo werden meine Briefe gespeichert?', 'Nicht auf unseren Servern. Die Ergebnisse liegen nur im Browser Ihres Geräts und lassen sich jederzeit löschen.'],
    ],
    finalTitle: 'Liegt ein Brief auf dem Tisch?',
    finalText: 'Fotografieren Sie ihn – in einer Minute wissen Sie, was zu tun ist.',
  },
};

export default function Home() {
  const [lang, setLang] = useState<Lang>('ru');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('deasyLanguage');
      if (saved === 'de' || saved === 'ru') setLang(saved);
    } catch {}
  }, []);

  const switchLang = (l: Lang) => {
    setLang(l);
    try {
      localStorage.setItem('deasyLanguage', l);
    } catch {}
  };

  const t = COPY[lang];

  return (
    <div className={styles.page} lang={lang}>
      <Head>
        <title>{t.title}</title>
        <meta name="description" content={t.desc} />
      </Head>

      <header className={styles.nav}>
        <div className={styles.navInner}>
          <a href="/" className={styles.logo} aria-label="DEASY">
            D<span>EASY</span>
          </a>
          <nav className={styles.navLinks} aria-label={lang === 'ru' ? 'Разделы' : 'Bereiche'}>
            <a href="#how">{t.nav.how}</a>
            <a href="#fraud">{t.nav.fraud}</a>
            <a href="#prices">{t.nav.prices}</a>
            <a href="/ratgeber">{t.nav.guides}</a>
            <a href="#faq">{t.nav.faq}</a>
          </nav>
          <div className={styles.navRight}>
            <div className={styles.lang} role="group" aria-label="Sprache / Язык">
              <button aria-pressed={lang === 'ru'} onClick={() => switchLang('ru')}>RU</button>
              <button aria-pressed={lang === 'de'} onClick={() => switchLang('de')}>DE</button>
            </div>
            <Link href="/app" className={styles.navCta}>
              {t.nav.open}
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* ---------- Hero: письмо, которое размечается ---------- */}
        <section className={styles.hero}>
          <div className={styles.heroText}>
            <h1>{t.h1}</h1>
            <p className={styles.lead}>{t.lead}</p>
            <div className={styles.ctas}>
              <Link href="/app" className={styles.btnPrimary}>
                {t.cta}
              </Link>
              <Link href="/app?modus=betrug" className={styles.btnGhost}>
                {t.ctaFraud}
              </Link>
            </div>
            <Link href="/app?demo=1" className={styles.demoLink}>
              {t.demo}
            </Link>
            <ul className={styles.facts}>
              {t.facts.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>

          <div className={styles.letterWrap} aria-label={t.notesTitle}>
            <article className={styles.letter} aria-hidden="true">
              <div className={styles.letterHead}>
                <strong>Jobcenter Berlin Mitte</strong>
                <span>Storkower Str. 133, 10407 Berlin</span>
              </div>
              <div className={styles.letterMeta}>
                <span>Herrn Max Muster</span>
                <span>BG-Nummer: 96201BG0012345</span>
                <span>Datum: 28.09.2026</span>
              </div>
              <p className={styles.letterSubject}>Aufforderung zur Mitwirkung</p>
              <p>Sehr geehrter Herr Muster,</p>
              <p>
                zur Prüfung Ihres Anspruchs benötigen wir folgende Unterlagen:{' '}
                <mark className={styles.hl} style={{ ['--d' as any]: '0.9s' }}>
                  Kontoauszüge der letzten drei Monate<sup>2</sup>
                </mark>{' '}
                sowie einen aktuellen Einkommensnachweis.
              </p>
              <p>
                Bitte reichen Sie die Unterlagen{' '}
                <mark className={styles.hl} style={{ ['--d' as any]: '0.3s' }}>
                  bis zum 20.10.2026<sup>1</sup>
                </mark>{' '}
                ein. Kommen Sie dieser Aufforderung nicht nach, können die{' '}
                <mark className={styles.hl} style={{ ['--d' as any]: '1.5s' }}>
                  Leistungen ganz oder teilweise versagt<sup>3</sup>
                </mark>{' '}
                werden (§ 66 SGB I).
              </p>
              <p>Mit freundlichen Grüßen</p>
            </article>

            <ol className={styles.notes}>
              {t.notes.map((n, i) => (
                <li key={n} style={{ ['--d' as any]: `${0.6 + i * 0.6}s` }}>
                  {n}
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ---------- Цифры с источниками ---------- */}
        <section className={styles.stats} aria-label={t.statsTitle}>
          <div className={styles.statsGrid}>
            {t.stats.map((st) => (
              <div key={st.n} className={styles.stat}>
                <strong>{st.n}</strong>
                <p>{st.p}</p>
                <a href={st.url} target="_blank" rel="noopener noreferrer">
                  {st.src}
                </a>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- Что вы получаете ---------- */}
        <section className={styles.what}>
          <h2>{t.whatTitle}</h2>
          <div className={styles.whatGrid}>
            <div className={styles.whatItem}>
              <h3>{t.what[0].h}</h3>
              <p>{t.what[0].p}</p>
              <div className={styles.widget}>
                <span className={styles.widgetBubble}>{t.widgetSummary}</span>
              </div>
            </div>
            <div className={styles.whatItem}>
              <h3>{t.what[1].h}</h3>
              <p>{t.what[1].p}</p>
              <div className={styles.widget}>
                <div className={styles.widgetRow}>
                  <div>
                    <strong>20.10.2026</strong>
                    <small>{t.widgetLeft}</small>
                  </div>
                  <span className={styles.widgetBtn}>📅 {t.widgetCal}</span>
                </div>
              </div>
            </div>
            <div className={styles.whatItem}>
              <h3>{t.what[2].h}</h3>
              <p>{t.what[2].p}</p>
              <div className={styles.widget}>
                <span className={styles.widgetWhere}>{t.widgetWhere}</span>
              </div>
            </div>
          </div>
        </section>

        {/* ---------- Проверка на мошенничество ---------- */}
        <section id="fraud" className={styles.fraud}>
          <div className={styles.fraudInner}>
            <div className={styles.phone} aria-hidden="true">
              <div className={styles.phoneTop}>+44 7700 900123</div>
              <div className={styles.sms}>{t.sms}</div>
              <div className={styles.stamp}>{t.stamp}</div>
              <ul className={styles.flags}>
                {t.flags.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </div>
            <div className={styles.fraudText}>
              <h2>{t.fraudTitle}</h2>
              <p>{t.fraudText}</p>
              <ul className={styles.checkList}>
                {t.fraudList.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <Link href="/app?modus=betrug" className={styles.btnAlarm}>
                {t.fraudCta}
              </Link>
              <p className={styles.small}>{t.fraudFree}</p>
            </div>
          </div>
        </section>

        {/* ---------- Как работает (реальная последовательность) ---------- */}
        <section id="how" className={styles.how}>
          <h2>{t.howTitle}</h2>
          <ol className={styles.steps}>
            {t.how.map((s) => (
              <li key={s.h}>
                <h3>{s.h}</h3>
                <p>{s.p}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* ---------- Данные под контролем ---------- */}
        <section id="daten" className={styles.privacy}>
          <h2>{t.privacyTitle}</h2>
          <p className={styles.sectionLead}>{t.privacyLead}</p>
          <div className={styles.privacyGrid}>
            {t.privacy.map((pr, i) => (
              <div key={pr.h} className={styles.privacyItem}>
                <span className={styles.privacyNum}>{i + 1}</span>
                <h3>{pr.h}</h3>
                <p>{pr.p}</p>
              </div>
            ))}
          </div>
          <p className={styles.small}>
            <a href="/datenschutz">{t.privacyMore}</a>
          </p>
        </section>

        {/* ---------- Цены ---------- */}
        <section id="prices" className={styles.prices}>
          <h2>{t.pricesTitle}</h2>
          <p className={styles.sectionLead}>{t.pricesLead}</p>
          <div className={styles.plans}>
            {t.plans.map((p, i) => {
              const href = p.href || (p.link && STRIPE_LINKS[p.link as 'paket5' | 'paket15'] ? '/app?kaufen=1' : '');
              return (
                <div key={p.name} className={`${styles.plan} ${i === 2 ? styles.planBest : ''}`}>
                  <h3>{p.name}</h3>
                  <div className={styles.planPrice}>{p.price}</div>
                  <div className={styles.planNote}>{p.note}</div>
                  <ul>
                    {p.items.map((it) => (
                      <li key={it}>{it}</li>
                    ))}
                  </ul>
                  {href ? (
                    <a href={href} className={i === 0 ? styles.btnGhost : styles.btnPrimary}>
                      {p.cta}
                    </a>
                  ) : (
                    <span className={styles.btnDisabled}>{t.soon}</span>
                  )}
                </div>
              );
            })}
          </div>
          <p className={styles.small}>
            {t.priceNote} <a href="/agb">{t.agb}</a>, <a href="/widerruf">{t.widerruf}</a>.
          </p>
        </section>

        {/* ---------- Границы ---------- */}
        <section className={styles.limits}>
          <h2>{t.limitsTitle}</h2>
          <div className={styles.limitsGrid}>
            {t.limits.map((l) => (
              <div key={l.h}>
                <h3>{l.h}</h3>
                <p>{l.p}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- Гайды ---------- */}
        <section className={styles.guides}>
          <h2>{t.guidesTitle}</h2>
          <p className={styles.sectionLead}>{t.guidesLead}</p>
          <div className={styles.guideGrid}>
            {GUIDES.slice(0, 3).map((g) => (
              <a key={g.slug} href={`/ratgeber/${g.slug}`} className={styles.guideCard}>
                <span aria-hidden="true">{g.icon}</span>
                <h3>{g[lang].title}</h3>
                <p>{g[lang].lead}</p>
              </a>
            ))}
          </div>
          <p>
            <a href="/ratgeber" className={styles.demoLink}>
              {t.guidesAll}
            </a>
          </p>
        </section>

        {/* ---------- Тестеры ---------- */}
        <section id="tester" className={styles.tester}>
          <div className={styles.testerInner}>
            <div>
              <h2>{t.testerTitle}</h2>
              <p className={styles.sectionLead}>{t.testerText}</p>
              <p className={styles.small}>
                {t.partnerLine} <a href="/partner">{t.partnerLink}</a>
              </p>
            </div>
            <ContactForm art="tester" language={lang} />
          </div>
        </section>

        {/* ---------- FAQ ---------- */}
        <section id="faq" className={styles.faq}>
          <h2>{t.faqTitle}</h2>
          {t.faq.map(([q, a]) => (
            <details key={q}>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </section>

        <section className={styles.final}>
          <h2>{t.finalTitle}</h2>
          <p>{t.finalText}</p>
          <Link href="/app" className={styles.btnPrimary}>
            {t.cta}
          </Link>
        </section>
      </main>

      <LegalLinks />
    </div>
  );
}
