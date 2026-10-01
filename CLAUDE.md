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
- PDF: только `pdfjs-dist/legacy/build/pdf.mjs` (совместимость со старыми iPhone), воркер — с unpkg той же версии.
- Модели: анализ и письмо-ответ — `claude-opus-5-5`, чат — `claude-sonnet-5-5`.
- Письмо в ведомство всегда на немецком; русскому пользователю — перевод рядом.

## Известные долги (не трогать без задачи)
- `pages/api/analyze.ts` — старый, не используется страницей.
- `prisma`, `next-auth` в зависимостях, но не подключены.
- Ссылки Stripe в `hooks/usePricingTiers.ts` — заглушки; лимиты считаются в `localStorage` (обходятся очисткой браузера).
- История (`useDocumentHistory`) сохраняется, но экрана «Мои документы» пока нет.

## Правила работы
- Никаких прямых коммитов в `main`: ветка → Pull Request → проверка на Vercel Preview → Merge.
- Перед PR: `npm run build` должен проходить.
- Владелец не пользуется терминалом: все инструкции для него — через веб-интерфейс GitHub/Vercel, на русском.
