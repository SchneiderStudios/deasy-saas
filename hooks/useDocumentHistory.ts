import { useState, useCallback, useEffect } from 'react';

/**
 * История писем — только в браузере пользователя (localStorage), без сервера.
 * Сами изображения писем не сохраняем: только результат анализа.
 */

export interface SavedCase {
  id: string;
  date: string; // ISO — когда загружено
  fileName: string;
  language: string;
  absender?: string;
  summary?: string;
  risk?: string;
  deadlines?: string[];
  actions?: string[];
  fristen?: { datum: string; was: string }[];
  aktenzeichen?: string;
  briefdatum?: string;
  telefon?: string;
  unterlagen?: string[];
  echtheit?: string;
  betrugsHinweise?: string[];
  erledigt?: boolean;
}

const KEY = 'deasyCases';
const MAX_CASES = 50;

const read = (): SavedCase[] => {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
};
const write = (list: SavedCase[]) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(-MAX_CASES)));
  } catch (e) {
    console.error('History speichern fehlgeschlagen', e);
  }
};

export function useDocumentHistory() {
  const [cases, setCases] = useState<SavedCase[]>([]);

  useEffect(() => {
    setCases(read());
  }, []);

  const saveCaseToHistory = useCallback((analysis: any, fileName: string): string => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const entry: SavedCase = {
      id,
      date: new Date().toISOString(),
      fileName,
      language: analysis.language || 'de',
      absender: analysis.absender,
      summary: analysis.summary,
      risk: analysis.risk,
      deadlines: analysis.deadlines,
      actions: analysis.actions,
      fristen: analysis.fristen,
      aktenzeichen: analysis.aktenzeichen,
      briefdatum: analysis.briefdatum,
      telefon: analysis.telefon,
      unterlagen: analysis.unterlagen,
      echtheit: analysis.echtheit,
      betrugsHinweise: analysis.betrugsHinweise,
    };
    const next = [...read(), entry];
    write(next);
    setCases(next.slice(-MAX_CASES));
    return id;
  }, []);

  const deleteCaseFromHistory = useCallback((id: string) => {
    const next = read().filter((c) => c.id !== id);
    write(next);
    setCases(next);
  }, []);

  const toggleDone = useCallback((id: string) => {
    const next = read().map((c) => (c.id === id ? { ...c, erledigt: !c.erledigt } : c));
    write(next);
    setCases(next);
  }, []);

  return { cases, saveCaseToHistory, deleteCaseFromHistory, toggleDone };
}
