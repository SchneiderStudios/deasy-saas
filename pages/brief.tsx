import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Head from 'next/head';
import SiteHeader from '@/components/SiteHeader';
import LegalLinks from '@/components/LegalLinks';
import site from '@/styles/Site.module.css';
import styles from '@/styles/Brief.module.css';
import { useLang } from '@/lib/useLang';
import { REPLY_TEMPLATES } from '@/lib/replyTemplates';
import { ABSENDER_KEY, BriefFelder, ENTWURF_KEY, LEER, heute, parseBrief } from '@/lib/briefEntwurf';

/**
 * Бесплатный конструктор письма по DIN 5008 (форма B) для окна конверта DIN lang (DL).
 * Работает только в браузере: введённое не отправляется на сервер и не сохраняется
 * (адрес отправителя — в localStorage, только если пользователь сам поставил галочку).
 * PDF — через «Печать → Сохранить как PDF» браузера.
 */

const T = {
  ru: {
    title: 'Конструктор письма — DEASY',
    desc: 'Бесплатно оформите письмо в ведомство по DIN 5008: с метками сгиба под конверт с окошком. Работает в браузере, данные не отправляются.',
    eyebrow: 'Бесплатно · без регистрации',
    h1: 'Письмо в ведомство — по всем правилам оформления',
    lead: 'Заполните поля — справа сразу видно письмо по немецкому стандарту DIN 5008, с метками сгиба под конверт DIN lang с окошком. Сохраните как PDF или распечатайте.',
    privacy: '🔒 Всё работает только в вашем браузере. Введённое не отправляется на наш сервер и не сохраняется.',
    vorlage: 'Начать с шаблона',
    vorlageNone: '— пустое письмо —',
    absender: 'Отправитель (вы)',
    empfaenger: 'Получатель',
    kopf: 'Дата и тема',
    inhalt: 'Текст письма',
    name: 'Имя и фамилия',
    strasse: 'Улица и дом',
    ort: 'Индекс и город',
    firma: 'Ведомство / организация',
    zHd: 'Отдел или имя (необязательно)',
    ortKurz: 'Город (для даты)',
    datum: 'Дата',
    zeichen: 'Номер дела (Aktenzeichen, BG-Nummer …)',
    betreff: 'Тема (Betreff)',
    text: 'Текст (на немецком)',
    gruss: 'Прощание',
    unterschrift: 'Имя под подписью',
    merken: 'Запомнить мой адрес на этом устройстве',
    pdf: '⬇️ Сохранить PDF / печать',
    pdfHint: 'В окне печати выберите «Сохранить как PDF». Формат A4, поля — «Нет» или «Минимальные».',
    reset: 'Очистить',
    tooLong: '⚠️ Текст не помещается на одну страницу. Сократите его или разбейте на абзацы короче.',
    placeholders: 'Заполните места в [квадратных скобках] — в превью они подсвечены.',
    tipsTitle: 'Как отправить',
    tips: [
      'Сложите лист по меткам слева: адрес получателя окажется в окошке конверта DIN lang.',
      'Подпишите письмо от руки.',
      'Важное отправляйте так, чтобы можно было доказать отправку: Einschreiben, факс или лично с отметкой о получении.',
      'Сохраните копию письма и всех приложений.',
    ],
    fromApp: 'Письмо перенесено из DEASY. Проверьте все поля.',
    sheetLabel: 'Предпросмотр письма',
  },
  de: {
    title: 'Brief-Generator – DEASY',
    desc: 'Kostenlos einen Brief nach DIN 5008 erstellen – mit Falzmarken für den Fensterumschlag. Läuft im Browser, keine Daten werden gesendet.',
    eyebrow: 'Kostenlos · ohne Anmeldung',
    h1: 'Brief an die Behörde – richtig formatiert',
    lead: 'Felder ausfüllen – rechts sehen Sie sofort den Brief nach DIN 5008 mit Falzmarken für den Fensterumschlag DIN lang. Als PDF speichern oder drucken.',
    privacy: '🔒 Alles läuft nur in Ihrem Browser. Ihre Eingaben werden nicht an unseren Server gesendet und nicht gespeichert.',
    vorlage: 'Mit Vorlage starten',
    vorlageNone: '— leerer Brief —',
    absender: 'Absender (Sie)',
    empfaenger: 'Empfänger',
    kopf: 'Datum und Betreff',
    inhalt: 'Brieftext',
    name: 'Vor- und Nachname',
    strasse: 'Straße und Hausnummer',
    ort: 'PLZ und Ort',
    firma: 'Behörde / Organisation',
    zHd: 'Abteilung oder Name (optional)',
    ortKurz: 'Ort (für das Datum)',
    datum: 'Datum',
    zeichen: 'Aktenzeichen, BG-Nummer …',
    betreff: 'Betreff',
    text: 'Text',
    gruss: 'Grußformel',
    unterschrift: 'Name unter der Unterschrift',
    merken: 'Meine Adresse auf diesem Gerät merken',
    pdf: '⬇️ Als PDF speichern / drucken',
    pdfHint: 'Im Druckfenster „Als PDF speichern“ wählen. Format A4, Ränder „Keine“ oder „Minimal“.',
    reset: 'Leeren',
    tooLong: '⚠️ Der Text passt nicht auf eine Seite. Bitte kürzen.',
    placeholders: 'Füllen Sie die Stellen in [eckigen Klammern] aus – in der Vorschau sind sie markiert.',
    tipsTitle: 'So verschicken Sie den Brief',
    tips: [
      'An den Falzmarken links falten: Die Anschrift erscheint im Fenster des Umschlags DIN lang.',
      'Brief handschriftlich unterschreiben.',
      'Wichtiges nachweisbar senden: Einschreiben, Fax oder persönlich mit Eingangsbestätigung.',
      'Eine Kopie des Briefes und aller Anlagen behalten.',
    ],
    fromApp: 'Brief aus DEASY übernommen. Bitte alle Felder prüfen.',
    sheetLabel: 'Briefvorschau',
  },
};

/** Подсветка плейсхолдеров [ … ] в превью */
function Marked({ text }: { text: string }) {
  const parts = text.split(/(\[[^\]\n]+\])/g);
  return (
    <>
      {parts.map((p, i) =>
        /^\[[^\]]+\]$/.test(p) ? (
          <mark key={i} className={styles.ph}>
            {p}
          </mark>
        ) : (
          <React.Fragment key={i}>{p}</React.Fragment>
        )
      )}
    </>
  );
}

export default function BriefGenerator() {
  const [lang, setLang] = useLang();
  const t = T[lang];
  const [f, setF] = useState<BriefFelder>({ ...LEER });
  const [merken, setMerken] = useState(false);
  const [vorlage, setVorlage] = useState('');
  const [fromApp, setFromApp] = useState(false);
  const [overflow, setOverflow] = useState(false);
  const [scale, setScale] = useState(0.5);
  const wrapRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  // Старт: адрес из localStorage (если запомнен) + черновик из DEASY (удаляется сразу после чтения)
  useEffect(() => {
    let next: BriefFelder = { ...LEER, datum: heute() };
    try {
      const abs = JSON.parse(localStorage.getItem(ABSENDER_KEY) || 'null');
      if (abs && typeof abs === 'object') {
        next = { ...next, absenderName: abs.absenderName || '', absenderStrasse: abs.absenderStrasse || '', absenderOrt: abs.absenderOrt || '', ort: abs.ort || '' };
        setMerken(true);
      }
    } catch {}
    try {
      const raw = localStorage.getItem(ENTWURF_KEY);
      if (raw) {
        localStorage.removeItem(ENTWURF_KEY);
        const e = JSON.parse(raw);
        const parsed = parseBrief(String(e.text || ''), { betreff: e.betreff });
        next = mergeKeep(next, parsed);
        setFromApp(true);
      }
    } catch {}
    try {
      const q = new URLSearchParams(window.location.search).get('vorlage');
      const tpl = q && REPLY_TEMPLATES.find((x) => x.id === q);
      if (tpl) {
        next = mergeKeep(next, parseBrief(tpl.body_de));
        setVorlage(tpl.id);
      }
    } catch {}
    setF(next);
  }, []);

  // Адрес запоминаем только с согласия пользователя
  useEffect(() => {
    try {
      if (merken) {
        localStorage.setItem(
          ABSENDER_KEY,
          JSON.stringify({ absenderName: f.absenderName, absenderStrasse: f.absenderStrasse, absenderOrt: f.absenderOrt, ort: f.ort })
        );
      } else localStorage.removeItem(ABSENDER_KEY);
    } catch {}
  }, [merken, f.absenderName, f.absenderStrasse, f.absenderOrt, f.ort]);

  // Масштаб превью под ширину колонки
  useLayoutEffect(() => {
    const el = wrapRef.current;
    const sheet = sheetRef.current;
    if (!el || !sheet) return;
    const update = () => setScale(Math.min(1, el.clientWidth / sheet.offsetWidth));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Проверка, помещается ли текст на страницу
  useEffect(() => {
    const b = bodyRef.current;
    if (b) setOverflow(b.scrollHeight > b.clientHeight + 2);
  }, [f]);

  const set = (k: keyof BriefFelder) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF((prev) => ({ ...prev, [k]: e.target.value }));

  const applyVorlage = (id: string) => {
    setVorlage(id);
    const tpl = REPLY_TEMPLATES.find((x) => x.id === id);
    if (!tpl) {
      setF((prev) => ({ ...prev, betreff: '', text: '', zeichen: '' }));
      return;
    }
    setF((prev) => mergeKeep(prev, parseBrief(tpl.body_de)));
  };

  const reset = () => {
    setVorlage('');
    setFromApp(false);
    setF((prev) => ({
      ...LEER,
      datum: heute(),
      ...(merken ? { absenderName: prev.absenderName, absenderStrasse: prev.absenderStrasse, absenderOrt: prev.absenderOrt, ort: prev.ort } : {}),
    }));
  };

  const hasPh = /\[[^\]]+\]/.test(Object.values(f).join(' '));
  const ruecksende = [f.absenderName, f.absenderStrasse, f.absenderOrt].filter(Boolean).join(' · ');
  const ortDatum = [f.ort, f.datum].filter(Boolean).join(', ');

  return (
    <div className={site.page} lang={lang}>
      <Head>
        <title>{t.title}</title>
        <meta name="description" content={t.desc} />
      </Head>
      <div className={styles.noPrint}>
        <SiteHeader lang={lang} onLang={setLang} />
      </div>

      <main className={`${site.main} ${styles.noPrint}`}>
        <span className={site.eyebrow}>{t.eyebrow}</span>
        <h1>{t.h1}</h1>
        <p className={site.lead}>{t.lead}</p>
        <p className={styles.privacy}>{t.privacy}</p>

        <div className={styles.layout}>
          {/* ---------- Форма ---------- */}
          <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
            {fromApp && <p className={styles.info}>{t.fromApp}</p>}

            <label className={styles.field}>
              <span>{t.vorlage}</span>
              <select value={vorlage} onChange={(e) => applyVorlage(e.target.value)}>
                <option value="">{t.vorlageNone}</option>
                {REPLY_TEMPLATES.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>
                    {lang === 'ru' ? `${tpl.title_ru} (${tpl.title_de})` : tpl.title_de}
                  </option>
                ))}
              </select>
            </label>

            <fieldset>
              <legend>{t.absender}</legend>
              <input aria-label={t.name} placeholder={t.name} value={f.absenderName} onChange={set('absenderName')} autoComplete="name" />
              <input aria-label={t.strasse} placeholder={t.strasse} value={f.absenderStrasse} onChange={set('absenderStrasse')} autoComplete="street-address" />
              <input aria-label={t.ort} placeholder={t.ort} value={f.absenderOrt} onChange={set('absenderOrt')} autoComplete="address-level2" />
              <label className={styles.check}>
                <input type="checkbox" checked={merken} onChange={(e) => setMerken(e.target.checked)} />
                <span>{t.merken}</span>
              </label>
            </fieldset>

            <fieldset>
              <legend>{t.empfaenger}</legend>
              <input aria-label={t.firma} placeholder={t.firma} value={f.empfaengerFirma} onChange={set('empfaengerFirma')} />
              <input aria-label={t.zHd} placeholder={t.zHd} value={f.empfaengerName} onChange={set('empfaengerName')} />
              <input aria-label={t.strasse} placeholder={t.strasse} value={f.empfaengerStrasse} onChange={set('empfaengerStrasse')} />
              <input aria-label={t.ort} placeholder={t.ort} value={f.empfaengerOrt} onChange={set('empfaengerOrt')} />
            </fieldset>

            <fieldset>
              <legend>{t.kopf}</legend>
              <div className={styles.two}>
                <input aria-label={t.ortKurz} placeholder={t.ortKurz} value={f.ort} onChange={set('ort')} />
                <input aria-label={t.datum} placeholder={t.datum} value={f.datum} onChange={set('datum')} />
              </div>
              <input aria-label={t.zeichen} placeholder={t.zeichen} value={f.zeichen} onChange={set('zeichen')} />
              <input aria-label={t.betreff} placeholder={t.betreff} value={f.betreff} onChange={set('betreff')} />
            </fieldset>

            <fieldset>
              <legend>{t.inhalt}</legend>
              <textarea aria-label={t.text} placeholder={'Sehr geehrte Damen und Herren,\n\n…'} rows={10} value={f.text} onChange={set('text')} />
              <div className={styles.two}>
                <input aria-label={t.gruss} placeholder={t.gruss} value={f.gruss} onChange={set('gruss')} />
                <input aria-label={t.unterschrift} placeholder={t.unterschrift} value={f.unterschrift} onChange={set('unterschrift')} />
              </div>
            </fieldset>

            {overflow && <p className={styles.warn}>{t.tooLong}</p>}
            {hasPh && <p className={styles.info}>{t.placeholders}</p>}

            <div className={styles.actions}>
              <button type="button" className={site.btnPrimary} onClick={() => window.print()}>
                {t.pdf}
              </button>
              <button type="button" className={site.btnGhost} onClick={reset}>
                {t.reset}
              </button>
            </div>
            <p className={site.muted}>{t.pdfHint}</p>

            <div className={styles.tips}>
              <h2>{t.tipsTitle}</h2>
              <ul>
                {t.tips.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            </div>
          </form>

          {/* ---------- Превью A4 ---------- */}
          <div className={styles.previewCol}>
            <div ref={wrapRef} className={styles.previewWrap} style={{ height: `calc(297mm * ${scale})` }}>
              <div ref={sheetRef} className={styles.sheet} style={{ transform: `scale(${scale})` }} aria-label={t.sheetLabel}>
                <SheetContent f={f} ruecksende={ruecksende} ortDatum={ortDatum} bodyRef={bodyRef} />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Только для печати — без масштабирования */}
      <div className={styles.printOnly} aria-hidden="true">
        <div className={styles.sheet}>
          <SheetContent f={f} ruecksende={ruecksende} ortDatum={ortDatum} />
        </div>
      </div>

      <div className={styles.noPrint}>
        <LegalLinks />
      </div>
    </div>
  );
}

/** Новые значения заменяют старые, только если не пустые (адрес отправителя не затирается шаблоном). */
function mergeKeep(base: BriefFelder, add: Partial<BriefFelder>): BriefFelder {
  const out = { ...base };
  (Object.keys(add) as (keyof BriefFelder)[]).forEach((k) => {
    const v = add[k];
    if (typeof v === 'string' && v.trim()) out[k] = v;
    else if (k === 'betreff' || k === 'text' || k === 'zeichen') out[k] = (v as string) || '';
  });
  return out;
}

function SheetContent({
  f,
  ruecksende,
  ortDatum,
  bodyRef,
}: {
  f: BriefFelder;
  ruecksende: string;
  ortDatum: string;
  bodyRef?: React.Ref<HTMLDivElement>;
}) {
  return (
    <>
      {/* Falzmarken (105 mm, 210 mm) und Lochmarke (148,5 mm) — DIN 5008 Form B */}
      <span className={styles.falz1} />
      <span className={styles.loch} />
      <span className={styles.falz2} />

      <div className={styles.anschrift}>
        {ruecksende && <div className={styles.ruecksende}>{ruecksende}</div>}
        <div className={styles.empf}>
          {[f.empfaengerFirma, f.empfaengerName, f.empfaengerStrasse, f.empfaengerOrt].filter(Boolean).map((l, i) => (
            <div key={i}>
              <Marked text={l} />
            </div>
          ))}
        </div>
      </div>

      <div className={styles.infoblock}>
        {f.absenderName && <div className={styles.infoName}>{f.absenderName}</div>}
        {f.absenderStrasse && <div>{f.absenderStrasse}</div>}
        {f.absenderOrt && <div>{f.absenderOrt}</div>}
        {f.zeichen && (
          <div className={styles.infoGap}>
            <Marked text={f.zeichen} />
          </div>
        )}
        {ortDatum && (
          <div className={styles.infoGap}>
            <Marked text={ortDatum} />
          </div>
        )}
      </div>

      <div className={styles.body} ref={bodyRef}>
        {f.betreff && (
          <p className={styles.betreff}>
            <Marked text={f.betreff} />
          </p>
        )}
        <div className={styles.text}>
          <Marked text={f.text} />
        </div>
        {(f.gruss || f.unterschrift) && (
          <div className={styles.gruss}>
            <div>{f.gruss}</div>
            <div className={styles.sign}>
              <Marked text={f.unterschrift} />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
