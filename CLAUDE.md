# DEASY — паспорт проекта (читать первым)

KI-ассистент для немецких Behördenbriefe. Пользователь загружает фото/PDF письма → Claude объясняет его (DE/RU) → чат с вопросами → шаблон ответа.

## Стек
Next.js 14 (pages router), React 18, TypeScript, `@anthropic-ai/sdk`. Деплой — Vercel (ветка `main` = продакшн).
Переменная окружения: `ANTHROPIC_API_KEY` (в Vercel). Состояние пользователя — только `localStorage` (БД нет).

## Главный сценарий и контракты (не ломать!)
1. `pages/app.tsx` → `hooks/usePdfUpload.ts` `convertFileToImages(file)`
   → `{ base64Images: string[] }` — JPEG без префикса `data:`, длинная сторона ≤ 1800 px, PDF ≤ 3 стр.
2. `POST /api/analyze-document` тело `{ images: string[], language: 'de'|'ru' }`
   → `{ success: true, analysis: { summary, risk: 'Gering'|'Mittel'|'Kritisch', deadlines: string[], actions: string[], language,
      absender, aktenzeichen, briefdatum, telefon, fristen: {datum:'YYYY-MM-DD', was}[], unterlagen: string[], echtheit: 'unauffaellig'|'pruefen', betrugsHinweise: string[] } }`
   UI: `components/LetterTools.tsx` (сроки + .ics, Echtheits-Check, подготовка к звонку), `components/HistoryView.tsx` («Мои письма»).
   или `{ error }` с кодом 4xx/5xx.
3. Экран анализа → `components/DocumentAssistant.tsx` (вкладки «Вопросы» и «Написать ответ»).
4. `POST /api/chat` тело `{ messages: {role, content}[], analysis, images, language }`
   → `{ success: true, message, guarded? }` или `{ success: false, error }`. Картинки письма прикрепляются к первому сообщению пользователя.
   RDG-фильтр: перед ответом `claude-haiku-4-5-20251001` классифицирует вопрос (VERSTEHEN / BEWERTUNG); на просьбу о правовой оценке — готовый отказ со ссылками на консультации (`guarded: true`). Письма в чате не пишутся.
   Поле `risk` в UI — «что требует письмо» (пересказ, не оценка).
5. `POST /api/generate-reply` тело `{ replyType, notes, analysis, images, language }`
   (`replyType`: fristverlaengerung | ratenzahlung | unterlagen | rueckfrage | bestaetigung — **без Widerspruch/Einspruch/Klage, без «frei»**; иначе 400, при просьбе о Widerspruch — 422)
   RDG: текст письма — только из шаблонов `lib/replyBuilder.ts`; ИИ лишь извлекает факты из письма и дословно переводит слова пользователя.
   → `{ success: true, reply: { subject, body (немецкий), translation (рус., если language=ru), tips[], placeholders[] } }`.
   Готовые шаблоны без ИИ — `lib/replyTemplates.ts`.

Меняя одну сторону контракта — меняй и другую в том же коммите.

6. `POST /api/check-fraud` `{ images, language }` → `{ success, check: { art, absender, echtheit: 'unauffaellig'|'pruefen'|'verdaechtig', betrugsHinweise[], entwarnung[], schritte[] } }` — отдельный бесплатный режим «Проверить на обман» (`/app?modus=betrug`), модель Sonnet, работает и для налоговых писем.

## Дизайн
- Главная `pages/index.tsx` + `styles/Landing.module.css`: главный образ — письмо из ведомства, размечаемое маркером, с пометками на полях. Одна анимация при загрузке, `prefers-reduced-motion` уважается.
- Токены цвета в `styles/globals.css`: ink #1d2433, paper #fbfbf8, marker #ffe45c, pen #2b4fd8, alarm #c8321f. Шрифт Golos Text (self-hosted через @fontsource, без Google Fonts).

## Ограничения
- Vercel режет тело запроса на **4,5 МБ** → картинки обязательно сжимаются на клиенте.
- HEIC: Safari декодирует сам, остальные браузеры — через `heic2any`.
- PDF: только `pdfjs-dist/legacy/build/pdf.mjs` (совместимость со старыми iPhone), воркер копируется в `public/` при сборке (`prebuild`) — никаких сторонних CDN.
- Модели: анализ и письмо-ответ — `claude-opus-5-5`, чат — `claude-sonnet-5-5`.
- Письмо в ведомство всегда на немецком; русскому пользователю — перевод рядом.

## Юридические правила (Германия) — не ломать!
- **Продукт = перевод + сроки + куда идти.** Никаких писем-возражений (Widerspruch/Einspruch/Klage), никакой правовой оценки. Простые письма (продление срока, досылка документов, вопрос) — можно.
- Данные владельца и ссылки Stripe — только в `lib/siteConfig.ts`.
- На КАЖДОЙ странице футер `components/LegalLinks.tsx`: Impressum, Datenschutz, AGB, Widerrufsbelehrung, «Verträge hier kündigen» (§312k BGB), «Vertrag widerrufen» (§356a BGB). Подписи кнопок заданы законом.
- `/vertrag` + `/api/vertrag`: кнопка «Widerruf bestätigen» (поток «jetzt kündigen» скрыт, вернуть при подписках), подтверждение по e-mail через `lib/mail.ts`: Gmail (env `GMAIL_USER`, `GMAIL_APP_PASSWORD`) или Resend (`RESEND_API_KEY`, `MAIL_FROM`); `OWNER_EMAIL` необязателен. Возврат за пакет — вручную в Stripe, минус использованные письма (цена пакета ÷ кол-во писем).
- Перед покупкой — обязательная галочка согласия на начало услуги (§ 356 Abs. 4 BGB) в окне покупки `/app?kaufen=1`, фиксируется в Stripe как `client_reference_id=verzicht_<ms>`; `/api/verify-payment` шлёт покупателю Vertragsbestätigung (§ 312f BGB).
- Перед загрузкой — чекбокс согласия (Art. 9/49 DSGVO), ключ `deasyConsent` в localStorage. Не загружать без него.
- ИИ всегда помечен как ИИ (AI Act Art. 50, Anthropic AUP): «KI-Assistent», «KI-generiert». Промпты: общая информация, без индивидуальной правовой оценки и прогноза шансов (RDG/StBerG).
- **Налоговые письма не разбираем (§ 2 StBerG):** Finanzamt, BZSt, Familienkasse (Kindergeld), Hauptzollamt, Gemeindesteuern. `/api/analyze-document` возвращает `analysis.restricted = 'steuer'` (KI-категория + регулярка `TAX_SENDER` по отправителю), UI показывает `SteuerHinweis`, лимит не списывается, `/api/chat` и `/api/generate-reply` отвечают 403. Шаблонов для налоговой нет.
- Под каждым анализом — `BeratungHinweis`: куда обратиться, с проверенными ссылками на официальные сайты ведомств (arbeitsagentur.de, bamf-navi.bamf.de, elster.de, 115.de …). Новые ссылки — только официальные и проверенные.
- **Оплата — только разовые пакеты, без подписок:** бесплатно 2 письма/мес + 5 проверок на мошенничество/мес; пакеты Plus (5 разборов) 4,99 € и Pro (15 разборов) 9,99 €; единица на сайте — «разбор» / „Erklärung“, действуют 12 мес. Логика — `hooks/usePricingTiers.ts` (баланс в localStorage `deasyBalance`), проверка — `/api/verify-payment` (сумма → кол-во писем; повторная активация блокируется metadata `deasy_redeemed` на PaymentIntent). Ссылки — `STRIPE_LINKS.paket5/paket15`. Тарифов Business/API и подписок нет — не возвращать без решения владельца.
- Без подписок кнопка «Verträge hier kündigen» (§312k) не нужна; «Vertrag widerrufen» (§356a) — обязательна. Если вернутся подписки — вернуть кнопку в `LegalLinks`.
- Нельзя обещать на сайте функции, которых нет (UWG). Никаких сторонних скриптов/шрифтов/трекинга без обновления Datenschutz.
- Функции работают в регионе `fra1` (vercel.json).

## Известные долги (не трогать без задачи)
- `prisma`, `next-auth` в зависимостях, но не подключены.
- Баланс писем хранится в `localStorage`; без аккаунтов. Перенос на другое устройство — вручную через поддержку.

## Правила работы
- Никаких прямых коммитов в `main`: ветка → Pull Request → проверка на Vercel Preview → Merge.
- Перед PR: `npm run build` должен проходить.
- Владелец не пользуется терминалом: все инструкции для него — через веб-интерфейс GitHub/Vercel, на русском.
