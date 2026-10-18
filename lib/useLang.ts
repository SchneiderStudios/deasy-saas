import { useEffect, useState } from 'react';

export type Lang = 'ru' | 'de';

/** Язык сайта: общий ключ localStorage `deasyLanguage` (как на главной и в приложении). По умолчанию — русский. */
export function useLang(initial: Lang = 'ru') {
  const [lang, setLang] = useState<Lang>(initial);

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

  return [lang, switchLang] as const;
}
