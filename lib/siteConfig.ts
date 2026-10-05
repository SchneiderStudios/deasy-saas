/**
 * ЕДИНСТВЕННОЕ место с данными владельца и ссылками на оплату.
 * Чтобы поменять ссылку Stripe или адрес в Impressum — правьте только этот файл.
 */

export const SITE_URL = 'https://deasy-saas.vercel.app';

/** Владелец сайта — используется в Impressum, Datenschutz и футере. Пустое поле = не показывать. */
export const COMPANY = {
  /** Для Einzelunternehmer в Impressum обязательно полное имя владельца */
  name: 'Ilja Schneider – Schneider Studios',
  brand: 'DEASY',
  street: 'Newtonstraße [Hausnummer]',
  zipCity: '12489 Berlin',
  country: 'Deutschland',
  email: 'info@deasy.de',
  phone: '',
  /** Kleinunternehmer nach § 19 UStG — USt-IdNr. не требуется */
  kleinunternehmer: true,
  vatId: '',
};

/**
 * Stripe Payment Links для РАЗОВЫХ пакетов (Payment Links → тип «Products or subscriptions», цена One-time).
 * Пустая строка = кнопка показывает «скоро доступно».
 * В настройках каждой ссылки: «After payment» → «Don't show confirmation page» →
 * redirect на  https://deasy-saas.vercel.app/app?checkout={CHECKOUT_SESSION_ID}
 * Суммы должны быть ровно 4,99 € и 9,99 € — по ним сервер определяет пакет.
 */
export const STRIPE_LINKS = {
  paket5: '',
  paket15: '',
};


export const LEGAL_UPDATED = 'Oktober 2026';

/** Проверка: заполнены ли обязательные поля Impressum. */
export const companyComplete = () =>
  Boolean(COMPANY.name && COMPANY.street && COMPANY.zipCity && COMPANY.email) && !/\[/.test(COMPANY.street + COMPANY.email);
