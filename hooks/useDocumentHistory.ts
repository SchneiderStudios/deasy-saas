import { useState, useCallback } from 'react';

export interface SavedCase {
  id: string;
  date: string;
  fileName: string;
  language: string;
  summary?: string;
  risk?: string;
  deadlines?: string[];
  nextSteps?: string[];
  actionSuggestions?: string[];
}

export function useDocumentHistory() {
  const saveCaseToHistory = useCallback((analysis: any, fileName: string) => {
    try {
      const cases = JSON.parse(localStorage.getItem('deasyCases') || '[]');

      const newCase: SavedCase = {
        id: Date.now().toString(),
        date: new Date().toLocaleDateString('de-DE'),
        fileName: fileName,
        language: analysis.language || 'de',
        summary: analysis.summary,
        risk: analysis.risk,
        deadlines: analysis.deadlines,
        nextSteps: analysis.nextSteps,
        actionSuggestions: analysis.actionSuggestions,
      };

      cases.push(newCase);

      // Keep only last 50 cases
      const trimmedCases = cases.slice(-50);
      localStorage.setItem('deasyCases', JSON.stringify(trimmedCases));
    } catch (error) {
      console.error('Error saving case to history:', error);
    }
  }, []);

  const getCaseHistory = useCallback((): SavedCase[] => {
    try {
      return JSON.parse(localStorage.getItem('deasyCases') || '[]');
    } catch (error) {
      console.error('Error retrieving case history:', error);
      return [];
    }
  }, []);

  const deleteCaseFromHistory = useCallback((caseId: string) => {
    try {
      const cases = JSON.parse(localStorage.getItem('deasyCases') || '[]');
      const filtered = cases.filter((c: SavedCase) => c.id !== caseId);
      localStorage.setItem('deasyCases', JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting case from history:', error);
    }
  }, []);

  return { saveCaseToHistory, getCaseHistory, deleteCaseFromHistory };
}
