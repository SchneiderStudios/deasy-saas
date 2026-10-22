/**
 * Гайды (/ratgeber) — ОБЩАЯ информация для всех, без оценки конкретного случая (RDG).
 * Налоговые темы (Finanzamt, Familienkasse/Kindergeld) сюда не добавлять (§ 2 StBerG).
 * Ссылки — только официальные и проверенные сайты.
 */

export type GuideLang = 'ru' | 'de';

export interface GuideSection {
  h: string;
  p?: string;
  list?: string[];
}

export interface GuideText {
  title: string;
  lead: string;
  sections: GuideSection[];
  links: { label: string; url: string }[];
}

export interface Guide {
  slug: string;
  icon: string;
  updated: string;
  ru: GuideText;
  de: GuideText;
}

export const GUIDES: Guide[] = [
  {
    slug: 'brief-vom-jobcenter',
    icon: '🏢',
    updated: 'Oktober 2026',
    ru: {
      title: 'Письмо из Jobcenter: какие бывают и что с ними делать',
      lead: 'Jobcenter пишет часто, и почти в каждом письме есть срок. Разберём, какие письма приходят чаще всего и на что смотреть в первую очередь.',
      sections: [
        {
          h: 'Самые частые письма',
          list: [
            'Einladung — приглашение на встречу (Meldetermin). В письме указаны дата, время и что взять с собой.',
            'Aufforderung zur Mitwirkung — просьба прислать документы до определённой даты (выписки, справки о доходах, договор аренды).',
            'Bescheid — решение о выплатах: назначение (Bewilligung), изменение (Änderung) или отмена (Aufhebung).',
            'Anhörung — вас просят высказаться до того, как Jobcenter примет решение.',
          ],
        },
        {
          h: 'На что смотреть в первую очередь',
          list: [
            'Дата и срок: до какого числа нужно что-то сделать или прийти.',
            'Что именно просят: список документов обычно стоит отдельным пунктом.',
            'Что будет, если ничего не делать: это прямо написано в письме, часто со ссылкой на закон (например, § 66 SGB I).',
            'Ваш номер (BG-Nummer или Kundennummer) — его указывают в любом ответе и при звонке.',
          ],
        },
        {
          h: 'Если не успеваете',
          p: 'Сообщите Jobcenter до истечения срока: позвоните по номеру из письма или напишите. Можно попросить продлить срок — в DEASY для этого есть простой шаблон. Отправляйте так, чтобы можно было доказать отправку: лично с отметкой о получении, через онлайн-портал jobcenter.digital или заказным письмом.',
        },
        {
          h: 'Если вы не согласны с решением',
          p: 'В конце каждого Bescheid есть Rechtsbehelfsbelehrung — там написано, как и до какого срока можно возразить. Подавать ли возражение, решайте вместе с консультацией: DEASY не оценивает шансы и не составляет возражения.',
        },
      ],
      links: [
        { label: 'Bürgergeld и Jobcenter — официальная информация', url: 'https://www.arbeitsagentur.de/grundsicherung' },
        { label: 'Бесплатные консультации рядом с вами (BAMF-NAvI)', url: 'https://bamf-navi.bamf.de' },
        { label: 'Единый номер ведомств 115', url: 'https://www.115.de' },
      ],
    },
    de: {
      title: 'Brief vom Jobcenter: welche es gibt und was zu tun ist',
      lead: 'Das Jobcenter schreibt oft, und fast jeder Brief enthält eine Frist. Hier die häufigsten Schreiben und worauf Sie zuerst achten sollten.',
      sections: [
        {
          h: 'Die häufigsten Schreiben',
          list: [
            'Einladung – Termin beim Jobcenter (Meldetermin) mit Datum, Uhrzeit und was Sie mitbringen sollen.',
            'Aufforderung zur Mitwirkung – Sie sollen bis zu einem Datum Unterlagen schicken (Kontoauszüge, Einkommensnachweise, Mietvertrag).',
            'Bescheid – Entscheidung über Leistungen: Bewilligung, Änderung oder Aufhebung.',
            'Anhörung – Sie können sich äußern, bevor das Jobcenter entscheidet.',
          ],
        },
        {
          h: 'Worauf Sie zuerst achten',
          list: [
            'Datum und Frist: bis wann Sie etwas tun oder erscheinen sollen.',
            'Was genau verlangt wird: Unterlagen stehen meist als eigene Liste im Brief.',
            'Was passiert, wenn Sie nichts tun: Das steht im Brief, oft mit Paragraf (z. B. § 66 SGB I).',
            'Ihre Nummer (BG-Nummer oder Kundennummer) – geben Sie sie bei jeder Antwort und jedem Anruf an.',
          ],
        },
        {
          h: 'Wenn Sie es nicht schaffen',
          p: 'Melden Sie sich vor Ablauf der Frist beim Jobcenter – telefonisch unter der Nummer im Brief oder schriftlich. Sie können um Fristverlängerung bitten; DEASY hat dafür eine einfache Vorlage. Senden Sie so, dass Sie den Versand nachweisen können: persönlich mit Eingangsbestätigung, über jobcenter.digital oder per Einschreiben.',
        },
        {
          h: 'Wenn Sie mit einer Entscheidung nicht einverstanden sind',
          p: 'Am Ende jedes Bescheids steht die Rechtsbehelfsbelehrung: wie und bis wann Sie widersprechen können. Ob ein Widerspruch sinnvoll ist, klären Sie mit einer Beratungsstelle – DEASY bewertet keine Erfolgsaussichten und schreibt keine Widersprüche.',
        },
      ],
      links: [
        { label: 'Bürgergeld und Jobcenter – offizielle Informationen', url: 'https://www.arbeitsagentur.de/grundsicherung' },
        { label: 'Kostenlose Beratung in Ihrer Nähe (BAMF-NAvI)', url: 'https://bamf-navi.bamf.de' },
        { label: 'Behördennummer 115', url: 'https://www.115.de' },
      ],
    },
  },
  {
    slug: 'aufforderung-zur-mitwirkung',
    icon: '📄',
    updated: 'Oktober 2026',
    ru: {
      title: 'Aufforderung zur Mitwirkung из Jobcenter: что делать',
      lead: 'Jobcenter просит прислать документы до определённой даты. Это не наказание, а просьба помочь проверить ваше право на выплаты.',
      sections: [
        {
          h: 'Что делать',
          list: [
            'Найдите в письме срок и список документов.',
            'Отправьте документы до срока: через jobcenter.digital (подойдут фото с телефона), по почте или лично. Сохраните подтверждение.',
            'Не успеваете или чего-то нет? До срока сообщите Jobcenter, отправьте то, что есть, и попросите продлить срок.',
          ],
        },
        {
          h: 'Если ничего не сделать',
          p: 'Выплаты могут остановить полностью или частично, пока вы не пришлёте документы (§ 66 SGB I).',
        },
      ],
      links: [
        { label: 'Jobcenter — официальная информация', url: 'https://www.arbeitsagentur.de/grundsicherung' },
        { label: 'Бесплатные консультации рядом с вами (BAMF-NAvI)', url: 'https://bamf-navi.bamf.de' },
      ],
    },
    de: {
      title: 'Aufforderung zur Mitwirkung vom Jobcenter: Was tun?',
      lead: 'Das Jobcenter bittet Sie, bis zu einem bestimmten Datum Unterlagen zu schicken. Das ist keine Strafe, sondern eine Bitte, bei der Prüfung Ihres Anspruchs mitzuhelfen.',
      sections: [
        {
          h: 'Was tun',
          list: [
            'Frist und Liste der Unterlagen im Brief suchen.',
            'Unterlagen vor Fristende schicken: über jobcenter.digital (Handyfotos reichen), per Post oder persönlich. Nachweis aufbewahren.',
            'Schaffen Sie es nicht oder fehlt etwas? Vor Fristende beim Jobcenter melden, das Vorhandene schicken und um Fristverlängerung bitten.',
          ],
        },
        {
          h: 'Wenn Sie nichts tun',
          p: 'Die Leistungen können ganz oder teilweise gestoppt werden, bis Sie die Unterlagen nachreichen (§ 66 SGB I).',
        },
      ],
      links: [
        { label: 'Jobcenter – offizielle Informationen', url: 'https://www.arbeitsagentur.de/grundsicherung' },
        { label: 'Kostenlose Beratung in Ihrer Nähe (BAMF-NAvI)', url: 'https://bamf-navi.bamf.de' },
      ],
    },
  },
  {
    slug: 'einladung-meldetermin',
    icon: '📅',
    updated: 'Oktober 2026',
    ru: {
      title: 'Einladung zum Meldetermin из Jobcenter: что делать',
      lead: 'Jobcenter приглашает вас на встречу. Обычно это разговор о работе, учёбе или ваших документах. Бояться не нужно, главное — прийти вовремя.',
      sections: [
        {
          h: 'Что делать',
          list: [
            'Найдите в письме дату, время, адрес и что взять с собой (паспорт, письмо, документы).',
            'Сразу внесите встречу в календарь и придите немного заранее.',
            'Не можете прийти — заболели или что-то срочное? Сообщите Jobcenter до встречи и пришлите подтверждение, например справку от врача.',
          ],
        },
        {
          h: 'Если не прийти без уважительной причины',
          p: 'Выплаты могут уменьшить. С июля 2026 первый пропуск обходится без последствий, со второго выплату снижают на 30 % на месяц. Уважительная причина, например болезнь, проверяется.',
        },
      ],
      links: [
        { label: 'Jobcenter — официальная информация', url: 'https://www.arbeitsagentur.de/grundsicherung' },
        { label: 'Бесплатные консультации рядом с вами (BAMF-NAvI)', url: 'https://bamf-navi.bamf.de' },
      ],
    },
    de: {
      title: 'Einladung zum Meldetermin vom Jobcenter: Was tun?',
      lead: 'Das Jobcenter lädt Sie zu einem Gespräch ein. Meist geht es um Arbeit, Ausbildung oder Ihre Unterlagen. Kein Grund zur Sorge – wichtig ist, pünktlich zu kommen.',
      sections: [
        {
          h: 'Was tun',
          list: [
            'Datum, Uhrzeit, Adresse und mitzubringende Unterlagen im Brief suchen (Ausweis, Einladung, Dokumente).',
            'Termin sofort in den Kalender eintragen und etwas früher da sein.',
            'Können Sie nicht kommen, etwa wegen Krankheit oder eines Notfalls? Vor dem Termin beim Jobcenter melden und einen Nachweis schicken, z. B. ein ärztliches Attest.',
          ],
        },
        {
          h: 'Wenn Sie ohne wichtigen Grund fehlen',
          p: 'Die Leistungen können gemindert werden. Seit Juli 2026 hat das erste Versäumnis keine Folgen, ab dem zweiten wird der Regelbedarf für einen Monat um 30 % gemindert. Ein wichtiger Grund wie Krankheit wird geprüft.',
        },
      ],
      links: [
        { label: 'Jobcenter – offizielle Informationen', url: 'https://www.arbeitsagentur.de/grundsicherung' },
        { label: 'Kostenlose Beratung in Ihrer Nähe (BAMF-NAvI)', url: 'https://bamf-navi.bamf.de' },
      ],
    },
  },
  {
    slug: 'fristen-verstehen',
    icon: '⏰',
    updated: 'Oktober 2026',
    ru: {
      title: 'Сроки в немецких письмах: как их читать',
      lead: 'Срок — самое важное в письме из ведомства. Иногда он указан датой, иногда только словами. Вот общие правила, которые помогают не ошибиться.',
      sections: [
        {
          h: 'Срок указан датой',
          p: '«Bis zum 20.10.2026» — значит, документы или ответ должны поступить в ведомство до этого дня включительно. Важна дата получения ведомством, а не дата, когда вы отправили письмо.',
        },
        {
          h: 'Срок указан словами',
          p: '«Innerhalb eines Monats nach Bekanntgabe» — в течение месяца после того, как письмо считается доставленным. С 2025 года письмо, отправленное обычной почтой, по общему правилу считается полученным на четвёртый день после отправки (раньше — на третий). Дата отправки часто стоит в шапке письма.',
        },
        {
          h: 'Выходные и праздники',
          p: 'Если последний день срока выпадает на субботу, воскресенье или праздник, по общему правилу срок переносится на следующий рабочий день.',
        },
        {
          h: 'Как не пропустить',
          list: [
            'Отправляйте заранее, а не в последний день.',
            'Сохраняйте доказательство: отметку о получении, квитанцию Einschreiben, отчёт факса или подтверждение онлайн-портала.',
            'Если не успеваете — сообщите отправителю до конца срока и попросите продлить его.',
            'Не уверены, как считать срок в вашем случае, — спросите у отправителя или в консультации.',
          ],
        },
        {
          h: 'Что делает DEASY',
          p: 'DEASY показывает только те даты, которые прямо написаны в письме, и добавляет их в календарь. Сроки, указанные словами, DEASY не пересчитывает — их он выводит текстом, чтобы вы уточнили дату.',
        },
      ],
      links: [
        { label: 'Единый номер ведомств 115', url: 'https://www.115.de' },
        { label: 'Бесплатные консультации рядом с вами (BAMF-NAvI)', url: 'https://bamf-navi.bamf.de' },
      ],
    },
    de: {
      title: 'Fristen in Behördenbriefen verstehen',
      lead: 'Die Frist ist das Wichtigste im Brief. Manchmal steht sie als Datum da, manchmal nur in Worten. Diese allgemeinen Regeln helfen, sie richtig zu lesen.',
      sections: [
        {
          h: 'Frist mit Datum',
          p: '„Bis zum 20.10.2026“ heißt: Unterlagen oder Antwort müssen bis einschließlich zu diesem Tag bei der Behörde eingehen. Entscheidend ist der Eingang, nicht das Absendedatum.',
        },
        {
          h: 'Frist in Worten',
          p: '„Innerhalb eines Monats nach Bekanntgabe“ – innerhalb eines Monats, nachdem der Brief als zugestellt gilt. Seit 2025 gilt ein einfacher Brief in der Regel am vierten Tag nach der Aufgabe zur Post als bekannt gegeben (vorher am dritten). Das Absendedatum steht oft im Briefkopf.',
        },
        {
          h: 'Wochenenden und Feiertage',
          p: 'Fällt das Fristende auf einen Samstag, Sonntag oder Feiertag, endet die Frist in der Regel am nächsten Werktag.',
        },
        {
          h: 'So verpassen Sie keine Frist',
          list: [
            'Früh senden, nicht am letzten Tag.',
            'Nachweis aufheben: Eingangsstempel, Einschreiben-Beleg, Faxprotokoll oder Bestätigung des Online-Portals.',
            'Wenn es knapp wird: vor Fristende beim Absender melden und um Verlängerung bitten.',
            'Unsicher, wie die Frist in Ihrem Fall läuft? Fragen Sie den Absender oder eine Beratungsstelle.',
          ],
        },
        {
          h: 'Was DEASY macht',
          p: 'DEASY zeigt nur Daten, die ausdrücklich im Brief stehen, und trägt sie in den Kalender ein. Fristen in Worten rechnet DEASY nicht um – sie erscheinen als Text, damit Sie das Datum klären.',
        },
      ],
      links: [
        { label: 'Behördennummer 115', url: 'https://www.115.de' },
        { label: 'Kostenlose Beratung in Ihrer Nähe (BAMF-NAvI)', url: 'https://bamf-navi.bamf.de' },
      ],
    },
  },
  {
    slug: 'betrug-erkennen',
    icon: '🛡️',
    updated: 'Oktober 2026',
    ru: {
      title: 'Как распознать мошенническое письмо, e-mail или SMS «от ведомства»',
      lead: 'Мошенники копируют стиль Finanzamt, Jobcenter, банков и Inkasso-бюро. Несколько признаков помогают заметить подделку до того, как вы заплатите или введёте данные.',
      sections: [
        {
          h: 'Тревожные признаки',
          list: [
            'Деньги просят перевести на частный или иностранный счёт, подарочными картами или криптовалютой.',
            'Очень короткий срок и угрозы: «в течение 24 часов», «иначе арест счёта».',
            'Ссылка ведёт не на официальный сайт (например, вместо elster.de — похожий адрес).',
            'Нет номера дела (Aktenzeichen) или он не совпадает с вашими прошлыми письмами.',
            'Связь только через WhatsApp, мессенджер или адрес Gmail/Outlook.',
            'Ведомство просит по SMS или e-mail пароль, PIN или данные карты.',
          ],
        },
        {
          h: 'Что сделать',
          list: [
            'Не платите и не переходите по ссылкам, пока не проверите.',
            'Найдите номер отправителя на его официальном сайте (не в самом письме) и позвоните.',
            'Сравните Aktenzeichen и адрес с прошлыми письмами.',
            'Если уже заплатили или ввели данные — сразу позвоните в банк и обратитесь в полицию.',
          ],
        },
        {
          h: 'Бесплатная проверка в DEASY',
          p: 'Загрузите фото письма или скриншот SMS — DEASY поищет типичные признаки обмана. Это подсказка, а не гарантия: при сомнениях всегда уточняйте у отправителя по официальному номеру.',
        },
      ],
      links: [
        { label: 'Verbraucherzentrale — предупреждения о фишинге', url: 'https://www.verbraucherzentrale.de' },
        { label: 'Полиция: советы по защите от мошенников', url: 'https://www.polizei-beratung.de' },
      ],
    },
    de: {
      title: 'Betrug erkennen: falsche Briefe, E-Mails und SMS „vom Amt“',
      lead: 'Betrüger kopieren den Stil von Finanzamt, Jobcenter, Banken und Inkassobüros. Einige Merkmale helfen, Fälschungen zu erkennen, bevor Sie zahlen oder Daten eingeben.',
      sections: [
        {
          h: 'Warnzeichen',
          list: [
            'Zahlung auf ein privates oder ausländisches Konto, per Gutscheinkarte oder Krypto.',
            'Sehr kurze Frist und Drohungen: „innerhalb von 24 Stunden“, „sonst Kontopfändung“.',
            'Link führt nicht zur offiziellen Website (z. B. ähnliche Adresse statt elster.de).',
            'Kein Aktenzeichen oder eines, das nicht zu früheren Briefen passt.',
            'Kontakt nur über WhatsApp, Messenger oder eine Gmail-/Outlook-Adresse.',
            'Eine „Behörde“ fragt per SMS oder E-Mail nach Passwort, PIN oder Kartendaten.',
          ],
        },
        {
          h: 'Was Sie tun können',
          list: [
            'Nicht zahlen und keine Links öffnen, bevor Sie geprüft haben.',
            'Telefonnummer des Absenders auf dessen offizieller Website suchen (nicht im Brief) und anrufen.',
            'Aktenzeichen und Adresse mit früheren Briefen vergleichen.',
            'Schon gezahlt oder Daten eingegeben? Sofort die Bank anrufen und Anzeige bei der Polizei erstatten.',
          ],
        },
        {
          h: 'Kostenloser Check in DEASY',
          p: 'Laden Sie ein Foto des Briefes oder einen Screenshot der SMS hoch – DEASY sucht typische Betrugsmerkmale. Das ist ein Hinweis, keine Garantie: Fragen Sie im Zweifel beim Absender unter der offiziellen Nummer nach.',
        },
      ],
      links: [
        { label: 'Verbraucherzentrale – Phishing-Warnungen', url: 'https://www.verbraucherzentrale.de' },
        { label: 'Polizeiliche Kriminalprävention', url: 'https://www.polizei-beratung.de' },
      ],
    },
  },
  {
    slug: 'brief-von-der-krankenkasse',
    icon: '🩺',
    updated: 'Oktober 2026',
    ru: {
      title: 'Письмо из больничной кассы (Krankenkasse)',
      lead: 'Krankenkasse пишет о взносах, документах и выплатах. Большинство писем просят что-то прислать или заплатить до определённой даты.',
      sections: [
        {
          h: 'Частые письма',
          list: [
            'Fragebogen — анкета, например для семейного страхования (Familienversicherung) или о доходах.',
            'Beitragsbescheid или Beitragsrechnung — сколько и до какого числа нужно заплатить (чаще у добровольно застрахованных и самозанятых).',
            'Zahlungserinnerung или Mahnung — напоминание о неоплаченных взносах.',
            'Письма о Krankengeld — какие справки нужны и за какой период.',
            'Mitgliedsbescheinigung — подтверждение страхования, его часто просит работодатель.',
          ],
        },
        {
          h: 'На что смотреть',
          list: [
            'Срок и что нужно прислать.',
            'Ваш номер застрахованного (Versichertennummer) — его указывают в ответе.',
            'Сумму и реквизиты: при оплате сверяйте IBAN с официальным сайтом своей кассы.',
          ],
        },
        {
          h: 'Если не можете заплатить',
          p: 'Свяжитесь с кассой до срока по телефону из письма. Можно спросить о рассрочке — в DEASY есть простой шаблон такой просьбы. Решение принимает касса.',
        },
      ],
      links: [
        { label: 'Независимая консультация пациентов (UPD)', url: 'https://www.patientenberatung.de' },
        { label: 'Verbraucherzentrale', url: 'https://www.verbraucherzentrale.de' },
        { label: 'Единый номер ведомств 115', url: 'https://www.115.de' },
      ],
    },
    de: {
      title: 'Brief von der Krankenkasse',
      lead: 'Die Krankenkasse schreibt zu Beiträgen, Unterlagen und Leistungen. Meist sollen Sie bis zu einem Datum etwas schicken oder zahlen.',
      sections: [
        {
          h: 'Häufige Schreiben',
          list: [
            'Fragebogen – z. B. zur Familienversicherung oder zum Einkommen.',
            'Beitragsbescheid oder Beitragsrechnung – wie viel bis wann zu zahlen ist (häufig bei freiwillig Versicherten und Selbstständigen).',
            'Zahlungserinnerung oder Mahnung – offene Beiträge.',
            'Schreiben zum Krankengeld – welche Nachweise für welchen Zeitraum nötig sind.',
            'Mitgliedsbescheinigung – Nachweis der Versicherung, oft für den Arbeitgeber.',
          ],
        },
        {
          h: 'Worauf Sie achten',
          list: [
            'Frist und was verlangt wird.',
            'Ihre Versichertennummer – geben Sie sie in jeder Antwort an.',
            'Betrag und Bankverbindung: Gleichen Sie die IBAN mit der offiziellen Website Ihrer Kasse ab.',
          ],
        },
        {
          h: 'Wenn Sie nicht zahlen können',
          p: 'Melden Sie sich vor Fristende telefonisch unter der Nummer im Brief. Sie können nach Ratenzahlung fragen – DEASY hat dafür eine einfache Vorlage. Entscheiden wird die Kasse.',
        },
      ],
      links: [
        { label: 'Unabhängige Patientenberatung (UPD)', url: 'https://www.patientenberatung.de' },
        { label: 'Verbraucherzentrale', url: 'https://www.verbraucherzentrale.de' },
        { label: 'Behördennummer 115', url: 'https://www.115.de' },
      ],
    },
  },
  {
    slug: 'brief-von-der-auslaenderbehoerde',
    icon: '🪪',
    updated: 'Oktober 2026',
    ru: {
      title: 'Письмо из Ausländerbehörde',
      lead: 'Ausländerbehörde пишет о приёме, документах и решениях по виду на жительство. Здесь сроки особенно важны — разберитесь с письмом сразу.',
      sections: [
        {
          h: 'Частые письма',
          list: [
            'Terminbestätigung или Einladung — дата приёма и список документов.',
            'Aufforderung zur Vorlage von Unterlagen — какие документы прислать и до какого числа.',
            'Anhörung — вас просят высказаться до принятия решения.',
            'Fiktionsbescheinigung — временный документ, если решение по продлению ещё не принято. В нём указано, до какой даты он действует.',
            'Bescheid — решение по вашему заявлению.',
          ],
        },
        {
          h: 'Что сделать сразу',
          list: [
            'Найдите срок и дату приёма, добавьте в календарь.',
            'Соберите документы по списку из письма; копии храните у себя.',
            'Если не можете прийти — сообщите ведомству заранее по контактам из письма.',
            'Проверьте срок действия текущего документа (Aufenthaltstitel или Fiktionsbescheinigung).',
          ],
        },
        {
          h: 'Где получить помощь',
          p: 'По вопросам вида на жительство бесплатно консультирует Migrationsberatung für erwachsene Zuwanderer (MBE), для молодёжи до 27 лет — Jugendmigrationsdienste. Ближайшую консультацию найдёте в BAMF-NAvI. DEASY объясняет письмо, но не даёт советов по вашему статусу.',
        },
      ],
      links: [
        { label: 'Консультации по миграции рядом с вами (BAMF-NAvI)', url: 'https://bamf-navi.bamf.de' },
        { label: 'Единый номер ведомств 115', url: 'https://www.115.de' },
      ],
    },
    de: {
      title: 'Brief von der Ausländerbehörde',
      lead: 'Die Ausländerbehörde schreibt zu Terminen, Unterlagen und Entscheidungen über den Aufenthalt. Fristen sind hier besonders wichtig – kümmern Sie sich sofort darum.',
      sections: [
        {
          h: 'Häufige Schreiben',
          list: [
            'Terminbestätigung oder Einladung – Termin und Liste der Unterlagen.',
            'Aufforderung zur Vorlage von Unterlagen – was bis wann einzureichen ist.',
            'Anhörung – Sie können sich vor der Entscheidung äußern.',
            'Fiktionsbescheinigung – vorläufiges Dokument, solange über die Verlängerung noch nicht entschieden ist. Darauf steht, bis wann es gilt.',
            'Bescheid – Entscheidung über Ihren Antrag.',
          ],
        },
        {
          h: 'Was Sie sofort tun können',
          list: [
            'Frist und Termin finden und in den Kalender eintragen.',
            'Unterlagen nach der Liste im Brief sammeln; Kopien selbst aufbewahren.',
            'Termin nicht wahrnehmbar? Rechtzeitig über die Kontaktdaten im Brief Bescheid geben.',
            'Gültigkeit des aktuellen Dokuments prüfen (Aufenthaltstitel oder Fiktionsbescheinigung).',
          ],
        },
        {
          h: 'Wo Sie Hilfe bekommen',
          p: 'Zu Aufenthaltsfragen berät kostenlos die Migrationsberatung für erwachsene Zuwanderer (MBE), unter 27 Jahren die Jugendmigrationsdienste. Die nächste Beratungsstelle finden Sie im BAMF-NAvI. DEASY erklärt den Brief, berät aber nicht zu Ihrem Aufenthaltsstatus.',
        },
      ],
      links: [
        { label: 'Migrationsberatung in Ihrer Nähe (BAMF-NAvI)', url: 'https://bamf-navi.bamf.de' },
        { label: 'Behördennummer 115', url: 'https://www.115.de' },
      ],
    },
  },
  {
    slug: 'rundfunkbeitrag',
    icon: '📺',
    updated: 'Oktober 2026',
    ru: {
      title: 'Rundfunkbeitrag: что это за письмо',
      lead: 'Rundfunkbeitrag — обязательный взнос за общественное телевидение и радио. Письма от «ARD ZDF Deutschlandradio Beitragsservice» получает почти каждый, кто переехал.',
      sections: [
        {
          h: 'Главное',
          list: [
            'Взнос платится за квартиру (Wohnung), а не за человека и не за количество устройств.',
            'В общей квартире (WG) платит один человек; остальные сообщают его номер взносов (Beitragsnummer).',
            'Получатели некоторых социальных выплат (например, Bürgergeld или BAföG) могут подать заявление на освобождение — само оно не наступает.',
            'Актуальную сумму смотрите на rundfunkbeitrag.de.',
          ],
        },
        {
          h: 'Частые письма',
          list: [
            'Anschreiben после переезда — просьба зарегистрироваться или сообщить, кто уже платит за квартиру.',
            'Zahlungsaufforderung — счёт за период.',
            'Festsetzungsbescheid — официальное решение о долге, часто с дополнительной суммой.',
            'Mahnung — напоминание о долге.',
          ],
        },
        {
          h: 'Осторожно, подделки',
          p: 'Мошенники рассылают e-mail «от Beitragsservice» со ссылкой на оплату. Номера и формы берите только на rundfunkbeitrag.de, а при сомнениях проверьте письмо в DEASY бесплатно.',
        },
      ],
      links: [
        { label: 'Официальный сайт Rundfunkbeitrag', url: 'https://www.rundfunkbeitrag.de' },
        { label: 'Verbraucherzentrale', url: 'https://www.verbraucherzentrale.de' },
      ],
    },
    de: {
      title: 'Rundfunkbeitrag: Was steht in dem Brief?',
      lead: 'Der Rundfunkbeitrag finanziert öffentlich-rechtliches Fernsehen und Radio. Post vom „ARD ZDF Deutschlandradio Beitragsservice“ bekommt fast jeder nach einem Umzug.',
      sections: [
        {
          h: 'Das Wichtigste',
          list: [
            'Bezahlt wird pro Wohnung – nicht pro Person und nicht pro Gerät.',
            'In einer WG zahlt eine Person; die anderen geben deren Beitragsnummer an.',
            'Wer bestimmte Sozialleistungen bekommt (z. B. Bürgergeld oder BAföG), kann eine Befreiung beantragen – sie gilt nicht automatisch.',
            'Den aktuellen Betrag finden Sie auf rundfunkbeitrag.de.',
          ],
        },
        {
          h: 'Häufige Schreiben',
          list: [
            'Anschreiben nach dem Umzug – Anmeldung oder Mitteilung, wer für die Wohnung zahlt.',
            'Zahlungsaufforderung – Rechnung für einen Zeitraum.',
            'Festsetzungsbescheid – offizielle Festsetzung offener Beiträge, oft mit Säumniszuschlag.',
            'Mahnung – Erinnerung an offene Beträge.',
          ],
        },
        {
          h: 'Vorsicht, Fälschungen',
          p: 'Betrüger verschicken E-Mails „vom Beitragsservice“ mit Zahlungslink. Nummern und Formulare nur von rundfunkbeitrag.de nehmen – und im Zweifel den Brief kostenlos in DEASY prüfen.',
        },
      ],
      links: [
        { label: 'Offizielle Website Rundfunkbeitrag', url: 'https://www.rundfunkbeitrag.de' },
        { label: 'Verbraucherzentrale', url: 'https://www.verbraucherzentrale.de' },
      ],
    },
  },
];

export const getGuide = (slug: string) => GUIDES.find((g) => g.slug === slug);
