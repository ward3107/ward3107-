import type { DetailKey, QuoteDetails, QuoteDraft, QuoteInputs } from './types';

/** The example of the original calculator, so existing numbers stay reproducible. */
export const exampleInputs: QuoteInputs = {
  panelCount: 29,
  panelWatts: 670,
  productionHoursPerKwpPerYear: 1600,
  pricePerKwpIls: 3096,
  discountPercent: 2.5,
  vatPercent: 18,
  feedInTariffIlsPerKwh: 0.48,
  years: 25,
  firstYearPanelEfficiencyPercent: 99,
  yearlyPanelDegradationPoints: 0.35,
  annualMaintenanceIls: 0,
  selfConsumptionPercent: 0,
  retailTariffIlsPerKwh: 0.6,
  feedInEscalationPercent: 0,
  retailEscalationPercent: 0,
  maintenanceEscalationPercent: 0,
  inverterReplacementYear: 0,
  inverterReplacementCostIls: 0,
  discountRatePercent: 4,
  gridEmissionKgPerKwh: 0.4,
};

export const emptyDetails: QuoteDetails = {
  projectName: '',
  customerName: '',
  customerAddress: '',
  companyName: '',
  proposalDate: '',
  validityDays: '14',
  panelModel: '',
  inverter: '',
  storage: '',
  mounting: '',
  panelWarranty: '',
  inverterWarranty: '',
  installationTime: '',
  scopeIncluded: '',
  scopeExcluded: '',
  paymentTerms: '',
  notes: '',
  contactName: '',
  contactPhone: '',
  contactEmail: '',
  logo: '',
  rendering: '',
};

export const exampleDetails: QuoteDetails = {
  ...emptyDetails,
  projectName: 'הצעה לדוגמה',
  customerName: 'משפחת לוי',
  customerAddress: 'הגליל העליון',
  companyName: 'Solar Quote',
  validityDays: '14',
  panelModel: 'פאנלים דו־צדדיים מונוקריסטלינים, 670W',
  inverter: 'ממיר רשת תלת־פאזי',
  mounting: 'מערכת עיגון מאלומיניום מותאמת לסוג הגג',
  panelWarranty: '25 שנה על ביצועי הפאנל',
  inverterWarranty: '12 שנה',
  installationTime: 'כ־6 שבועות מאישור ההצעה',
  scopeIncluded:
    'מערך פאנלים לפי הכמות וההספק שבמפרט הטכני.\nממיר ומערכת עיגון לפי מפרט הפרויקט.\nהתקנה, חיווט וחיבור לרשת.',
  scopeExcluded: 'ציוד אגירה.\nעבודות תשתית נוספות שייקבעו לאחר בדיקת האתר.',
  paymentTerms:
    'מקדמה של 30% לאחר אישור ההצעה.\n40% עם אספקת הציוד לאתר.\n30% בחיבור המערכת לרשת.',
};

export function createExampleDraft(today = todayIso()): QuoteDraft {
  return {
    inputs: { ...exampleInputs },
    details: { ...exampleDetails, proposalDate: today },
  };
}

export function createBlankDraft(company?: Partial<QuoteDetails>, today = todayIso()): QuoteDraft {
  return {
    inputs: { ...exampleInputs },
    details: { ...emptyDetails, ...company, proposalDate: today },
  };
}

/** Details that describe the business rather than a single project; remembered between quotes. */
export const companyDetailKeys = [
  'companyName', 'contactName', 'contactPhone', 'contactEmail', 'logo', 'paymentTerms',
  'scopeExcluded', 'panelWarranty', 'inverterWarranty',
] as const satisfies readonly DetailKey[];

export function todayIso(now = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}
