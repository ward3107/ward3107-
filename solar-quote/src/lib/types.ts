/** Numeric inputs of the financial model. Money is ILS, energy is kWh, percentages are 0–100. */
export interface QuoteInputs {
  panelCount: number;
  panelWatts: number;
  productionHoursPerKwpPerYear: number;
  pricePerKwpIls: number;
  discountPercent: number;
  vatPercent: number;
  /** Price paid per exported kWh. */
  feedInTariffIlsPerKwh: number;
  years: number;
  firstYearPanelEfficiencyPercent: number;
  /** Annual loss in percentage points. */
  yearlyPanelDegradationPoints: number;
  annualMaintenanceIls: number;
  /** Share of production consumed on-site instead of exported (0 = export everything). */
  selfConsumptionPercent: number;
  /** Retail price per kWh that on-site consumption avoids. */
  retailTariffIlsPerKwh: number;
  feedInEscalationPercent: number;
  retailEscalationPercent: number;
  maintenanceEscalationPercent: number;
  /** Year in which the inverter is replaced; 0 means never. */
  inverterReplacementYear: number;
  inverterReplacementCostIls: number;
  /** Used for NPV, discounted payback and LCOE. */
  discountRatePercent: number;
  /** Grid emission factor used for the CO₂ estimate. */
  gridEmissionKgPerKwh: number;
}

export type InputKey = keyof QuoteInputs;

/** Free-text and branding details of a proposal. */
export interface QuoteDetails {
  /** Name of the first option. Only shown when the proposal has several options. */
  optionName: string;
  projectName: string;
  customerName: string;
  customerAddress: string;
  companyName: string;
  proposalDate: string; // YYYY-MM-DD
  validityDays: string;
  panelModel: string;
  inverter: string;
  storage: string;
  mounting: string;
  panelWarranty: string;
  inverterWarranty: string;
  installationTime: string;
  scopeIncluded: string;
  scopeExcluded: string;
  paymentTerms: string;
  notes: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  /** Data URLs (already downscaled) or empty. */
  logo: string;
  rendering: string;
}

export type DetailKey = keyof QuoteDetails;

export interface QuoteDraft {
  inputs: QuoteInputs;
  details: QuoteDetails;
  /**
   * Additional options (at most two). The draft's own `inputs`/`details` are the first option, so
   * proposals without options keep working unchanged.
   */
  variants?: QuoteVariant[];
  /** Index (0–2) of the option to highlight as recommended. */
  recommended?: number | null;
}

/** The fields that differ between options; everything else is shared by the whole proposal. */
export type VariantInputKey =
  | 'panelCount' | 'panelWatts' | 'pricePerKwpIls' | 'discountPercent' | 'annualMaintenanceIls'
  | 'selfConsumptionPercent' | 'inverterReplacementYear' | 'inverterReplacementCostIls';

export type VariantDetailKey =
  | 'panelModel' | 'inverter' | 'storage' | 'mounting' | 'panelWarranty' | 'inverterWarranty'
  | 'installationTime';

export interface QuoteVariant {
  name: string;
  inputs: Pick<QuoteInputs, VariantInputKey>;
  details: Pick<QuoteDetails, VariantDetailKey>;
}

export interface SavedQuote extends QuoteDraft {
  id: string;
  createdAt: string;
  updatedAt: string;
}
