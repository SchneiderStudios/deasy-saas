/**
 * Steuersachen analysieren wir nicht (§§ 2–4 StBerG): Finanzamt, BZSt, Familienkasse (Kindergeld nach EStG),
 * Hauptzollamt, Gemeindesteuern. Zusätzlich zur Einstufung durch die KI prüfen wir den Absender per Muster.
 */
export const TAX_SENDER =
  /finanzamt|finanzverwaltung|bundeszentralamt\s+f(ü|ue)r\s+steuern|\bbzst\b|hauptzollamt|familienkasse|steueramt|steuerverwaltung|kasse\s*\/\s*steuern|elster/i;
