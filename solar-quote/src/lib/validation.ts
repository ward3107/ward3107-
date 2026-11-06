import type { InputKey, QuoteInputs } from './types';

export type InputIssues = Partial<Record<InputKey, string>>;

interface Rule {
  min: number;
  max: number;
  integer?: boolean;
  /** Message shown when the value is outside the range. */
  hint: string;
}

const rules: Record<InputKey, Rule> = {
  panelCount: { min: 1, max: 20000, integer: true, hint: 'מספר שלם בין 1 ל־20,000' },
  panelWatts: { min: 50, max: 1500, hint: 'בין 50 ל־1,500 וואט' },
  productionHoursPerKwpPerYear: { min: 100, max: 3000, hint: 'בין 100 ל־3,000 שעות בשנה' },
  pricePerKwpIls: { min: 0, max: 100000, hint: 'בין 0 ל־100,000 ₪' },
  discountPercent: { min: 0, max: 100, hint: 'בין 0 ל־100 אחוז' },
  vatPercent: { min: 0, max: 100, hint: 'בין 0 ל־100 אחוז' },
  feedInTariffIlsPerKwh: { min: 0, max: 10, hint: 'בין 0 ל־10 ₪ לקוט״ש' },
  years: { min: 1, max: 40, integer: true, hint: 'מספר שלם בין 1 ל־40 שנים' },
  firstYearPanelEfficiencyPercent: { min: 1, max: 100, hint: 'בין 1 ל־100 אחוז' },
  yearlyPanelDegradationPoints: { min: 0, max: 20, hint: 'בין 0 ל־20 נקודות אחוז' },
  annualMaintenanceIls: { min: 0, max: 10_000_000, hint: 'ערך חיובי' },
  selfConsumptionPercent: { min: 0, max: 100, hint: 'בין 0 ל־100 אחוז' },
  retailTariffIlsPerKwh: { min: 0, max: 10, hint: 'בין 0 ל־10 ₪ לקוט״ש' },
  feedInEscalationPercent: { min: -20, max: 50, hint: 'בין ‎−20 ל־50 אחוז' },
  retailEscalationPercent: { min: -20, max: 50, hint: 'בין ‎−20 ל־50 אחוז' },
  maintenanceEscalationPercent: { min: -20, max: 50, hint: 'בין ‎−20 ל־50 אחוז' },
  inverterReplacementYear: { min: 0, max: 40, integer: true, hint: 'שנה שלמה, או 0 ללא החלפה' },
  inverterReplacementCostIls: { min: 0, max: 10_000_000, hint: 'ערך חיובי' },
  discountRatePercent: { min: 0, max: 30, hint: 'בין 0 ל־30 אחוז' },
  gridEmissionKgPerKwh: { min: 0, max: 2, hint: 'בין 0 ל־2 ק״ג לקוט״ש' },
};

/** Returns an error message per invalid field; an empty object means the inputs are usable. */
export function validateInputs(inputs: QuoteInputs): InputIssues {
  const issues: InputIssues = {};
  for (const key of Object.keys(rules) as InputKey[]) {
    const rule = rules[key];
    const value = inputs[key];
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      issues[key] = 'יש להזין מספר';
    } else if (value < rule.min || value > rule.max || (rule.integer && !Number.isInteger(value))) {
      issues[key] = rule.hint;
    }
  }

  if (!issues.years && !issues.firstYearPanelEfficiencyPercent && !issues.yearlyPanelDegradationPoints) {
    const lastYear = inputs.firstYearPanelEfficiencyPercent -
      inputs.yearlyPanelDegradationPoints * (inputs.years - 1);
    if (lastYear < 0) {
      issues.yearlyPanelDegradationPoints = 'העקומה יורדת מתחת ל־0% בתקופת התחזית. הקטינו את הירידה או את מספר השנים';
    }
  }
  if (!issues.inverterReplacementYear && !issues.years && inputs.inverterReplacementYear > inputs.years) {
    issues.inverterReplacementYear = 'שנת ההחלפה חורגת מתקופת התחזית';
  }
  return issues;
}

/** Non-blocking sanity checks: the model still runs, but the user should double-check. */
export function getWarnings(inputs: QuoteInputs): string[] {
  const warnings: string[] = [];
  const hours = inputs.productionHoursPerKwpPerYear;
  if (hours < 1300 || hours > 2100) {
    warnings.push('שעות הייצור השקולות נראות חריגות. בישראל מקובל בדרך כלל טווח של כ־1,500 עד 1,900.');
  }
  if (inputs.selfConsumptionPercent > 0 && inputs.retailTariffIlsPerKwh <= inputs.feedInTariffIlsPerKwh) {
    warnings.push('תעריף הצריכה נמוך או שווה לתעריף המכירה לרשת, ולכן צריכה עצמית לא משפרת את התוצאה.');
  }
  if (inputs.discountRatePercent === 0) {
    warnings.push('שיעור היוון של 0% הופך את ה־NPV לסכום פשוט של תזרימים.');
  }
  return warnings;
}
