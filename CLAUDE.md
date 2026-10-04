# DEASY — паспорт проекта (читать первым)

KI-ассистент для немецких Behördenbriefe. Пользователь загружает фото/PDF письма → Claude объясняет его (DE/RU) → чат с вопросами → шаблон ответа.

## Стек
Next.js 14 (pages router), React 18, TypeScript, `@anthropic-ai/sdk`. Деплой — Vercel (ветка `main` = продакшн).
Переменная окружения: `ANTHROPIC_API_KEY` (в Vercel). Состояние пользователя — только `localStorage` (БД нет).

## Главный сценарий и контракты (не ломать!)
1. `pages/app.tsx` → `hooks/usePdfUpload.ts` `convertFileToImages(file)`
   → `{ base64Images: string[] }` — JPEG без префикса `data:`, длинная сторона ≤ 1800 px, PDF ≤ 3 стр.
2. `POST /api/analyze-document` тело `{ images: string[], language: 'de'|'ru' }`
   → `{ success: true, analysis: { summary, risk: 'Gering'|'Mittel'|'Kritisch', deadlines: string[], actions: string[], language } }`
   или `{ error }` с кодом 4xx/5xx.
3. Экран анализа → `components/DocumentAssistant.tsx` (вкладки «Вопросы» и «Написать ответ»).
4. `POST /api/chat` тело `{ messages: {role, content}[], analysis, images, language }`
   → `{ success: true, message }` или `{ success: false, error }`. Картинки письма прикрепляются к первому сообщению пользователя.
5. `POST /api/generate-reply` тело `{ replyType, notes, analysis, images, language }`
   (`replyType`: widerspruch | fristverlaengerung | ratenzahlung | unterlagen | rueckfrage | bestaetigung | frei)
   → `{ success: true, reply: { subject, body (немецкий), translation (рус., если language=ru), tips[], placeholders[] } }`.
   Готовые шаблоны без ИИ — `lib/replyTemplates.ts`.

Меняя одну сторону контракта — меняй и другую в том же коммите.

## Ограничения
- Vercel режет тело запроса на **4,5 МБ** → картинки обязательно сжимаются на клиенте.
- HEIC: Safari декодирует сам, остальные браузеры — через `heic2any`.
- PDF: только `pdfjs-dist/legacy/build/pdf.mjs` (совместимость со старыми iPhone), воркер копируется в `public/` при сборке (`prebuild`) — никаких сторонних CDN.
- Модели: анализ и письмо-ответ — `claude-opus-5-5`, чат — `claude-sonnet-5-5`.
- Письмо в ведомство всегда на немецком; русскому пользователю — перевод рядом.

## Юридические правила (Германия) — не ломать!
- Данные владельца и ссылки Stripe — только в `lib/siteConfig.ts`.
- На КАЖДОЙ странице футер `components/LegalLinks.tsx`: Impressum, Datenschutz, AGB, Widerrufsbelehrung, «Verträge hier kündigen» (§312k BGB), «Vertrag widerrufen» (§356a BGB). Подписи кнопок заданы законом.
- `/vertrag` + `/api/vertrag`: кнопки «jetzt kündigen» / «Widerruf bestätigen», подтверждение по e-mail через Resend (env `RESEND_API_KEY`, `MAIL_FROM`, `OWNER_EMAIL`), отмена в Stripe.
- Перед загрузкой — чекбокс согласия (Art. 9/49 DSGVO), ключ `deasyConsent` в localStorage. Не загружать без него.
- ИИ всегда помечен как ИИ (AI Act Art. 50, Anthropic AUP): «KI-Assistent», «KI-generiert». Промпты: общая информация, без индивидуальной правовой оценки и прогноза шансов (RDG/StBerG).
- **Налоговые письма не разбираем (§ 2 StBerG):** Finanzamt, BZSt, Familienkasse (Kindergeld), Hauptzollamt, Gemeindesteuern. `/api/analyze-document` возвращает `analysis.restricted = 'steuer'` (KI-категория + регулярка `TAX_SENDER` по отправителю), UI показывает `SteuerHinweis`, лимит не списывается, `/api/chat` и `/api/generate-reply` отвечают 403. Шаблонов для налоговой нет.
- Под каждым анализом — `BeratungHinweis`: куда обратиться, с проверенными ссылками на официальные сайты ведомств (arbeitsagentur.de, bamf-navi.bamf.de, elster.de, 115.de …). Новые ссылки — только официальные и проверенные.
- Тарифы только Free / Plus / Pro. Тарифа Business/API нет — не возвращать без решения владельца.
- Нельзя обещать на сайте функции, которых нет (UWG). Никаких сторонних скриптов/шрифтов/трекинга без обновления Datenschutz.
- Функции работают в регионе `fra1` (vercel.json).

## Известные долги (не трогать без задачи)
- `prisma`, `next-auth` в зависимостях, но не подключены.
- Лимиты и тариф хранятся в `localStorage` (тариф проверяется через `/api/verify-payment`); без аккаунтов.
- История (`useDocumentHistory`) сохраняется, но экрана «Мои документы» пока нет.

## Правила работы
- Никаких прямых коммитов в `main`: ветка → Pull Request → проверка на Vercel Preview → Merge.
- Перед PR: `npm run build` должен проходить.
- Владелец не пользуется терминалом: все инструкции для него — через веб-интерфейс GitHub/Vercel, на русском.
