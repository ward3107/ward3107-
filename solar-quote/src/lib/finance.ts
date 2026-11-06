import type { InputKey, QuoteInputs } from './types';
import { validateInputs } from './validation';

export class QuoteValidationError extends Error {
  readonly issues: Partial<Record<InputKey, string>>;
  constructor(issues: Partial<Record<InputKey, string>>) {
    super(`Invalid quote inputs: ${Object.keys(issues).join(', ')}`);
    this.name = 'QuoteValidationError';
    this.issues = issues;
  }
}

export interface PriceBreakdown {
  /** All amounts are whole shekels, and the lines always add up: total = beforeVat + vat. */
  originalIls: number;
  discountIls: number;
  beforeVatIls: number;
  vatIls: number;
  totalIls: number;
}

export interface YearRow {
  year: number;
  efficiencyPercent: number;
  productionKwh: number;
  exportedKwh: number;
  selfConsumedKwh: number;
  exportRevenueIls: number;
  selfSavingsIls: number;
  /** Export revenue plus avoided electricity cost. */
  grossIls: number;
  maintenanceIls: number;
  replacementIls: number;
  netIls: number;
  cumulativeNetIls: number;
  /** Cumulative net minus the investment: negative until the system has paid for itself. */
  positionIls: number;
}

export interface QuoteSummary {
  years: number;
  investmentIls: number;
  lifetimeProductionKwh: number;
  lifetimeGrossIls: number;
  lifetimeMaintenanceIls: number;
  lifetimeReplacementIls: number;
  lifetimeNetIls: number;
  /** Lifetime net minus the investment. */
  profitIls: number;
  firstYearNetIls: number;
  firstYearReturnPercent: number | null;
  paybackYears: number | null;
  discountedPaybackYears: number | null;
  npvIls: number;
  irrPercent: number | null;
  /** Levelised cost of energy over the horizon, discounted at the chosen rate. */
  lcoeIlsPerKwh: number | null;
  co2Tons: number;
}

export interface QuoteResult {
  system: { panelCount: number; dcKwp: number; baseProductionKwh: number };
  price: PriceBreakdown;
  summary: QuoteSummary;
  rows: YearRow[];
}

export interface CalculateOptions {
  /** Scales production, used for sensitivity scenarios. */
  productionFactor?: number;
}

const cents = (value: number) => Math.round(value * 100) / 100;

export function calculatePrice(inputs: Pick<QuoteInputs, 'panelCount' | 'panelWatts' | 'pricePerKwpIls' | 'discountPercent' | 'vatPercent'>): PriceBreakdown {
  const dcKwp = (inputs.panelCount * inputs.panelWatts) / 1000;
  const original = dcKwp * inputs.pricePerKwpIls;
  const originalIls = Math.round(original);
  const discountIls = Math.round(original * (inputs.discountPercent / 100));
  const beforeVatIls = originalIls - discountIls;
  const vatIls = Math.round(beforeVatIls * (inputs.vatPercent / 100));
  return { originalIls, discountIls, beforeVatIls, vatIls, totalIls: beforeVatIls + vatIls };
}

/** Linear interpolation of the moment a cumulative series crosses `target`, in years. */
function crossingYear(opening: number[], closing: number[], target: number): number | null {
  if (target <= 0) return 0;
  for (let index = 0; index < closing.length; index += 1) {
    const before = opening[index] ?? 0;
    const after = closing[index] ?? 0;
    if (after >= target) {
      const step = after - before;
      return index + (step > 0 ? Math.min(1, (target - before) / step) : 1);
    }
  }
  return null;
}

/** Internal rate of return via bisection; null when the cash flows have no sign change. */
export function irr(cashFlows: number[]): number | null {
  const value = (rate: number) =>
    cashFlows.reduce((sum, flow, index) => sum + flow / (1 + rate) ** index, 0);
  let low = -0.95;
  let high = 10;
  let lowValue = value(low);
  const highValue = value(high);
  if (!Number.isFinite(lowValue) || !Number.isFinite(highValue) || lowValue * highValue > 0) return null;
  for (let step = 0; step < 200; step += 1) {
    const mid = (low + high) / 2;
    const midValue = value(mid);
    if (Math.abs(midValue) < 1e-7) return mid;
    if (lowValue * midValue < 0) high = mid;
    else {
      low = mid;
      lowValue = midValue;
    }
  }
  return (low + high) / 2;
}

/**
 * Pure financial model of a grid-connected PV system.
 * With self-consumption, escalation and replacement set to zero it reproduces the original
 * "export everything" calculator.
 */
export function calculateQuote(inputs: QuoteInputs, options: CalculateOptions = {}): QuoteResult {
  const issues = validateInputs(inputs);
  if (Object.keys(issues).length > 0) throw new QuoteValidationError(issues);

  const factor = options.productionFactor ?? 1;
  const dcKwp = (inputs.panelCount * inputs.panelWatts) / 1000;
  const baseProductionKwh = dcKwp * inputs.productionHoursPerKwpPerYear * factor;
  const price = calculatePrice(inputs);
  const investment = price.totalIls;
  const selfShare = inputs.selfConsumptionPercent / 100;
  const rate = inputs.discountRatePercent / 100;

  let cumulative = 0;
  const rows: YearRow[] = [];
  const openings: number[] = [];
  const closings: number[] = [];
  const discountedOpenings: number[] = [];
  const discountedClosings: number[] = [];
  let discountedCumulative = 0;
  let pvEnergy = 0;
  let pvCosts = investment;
  let lifetimeProduction = 0;
  let lifetimeGross = 0;
  let lifetimeMaintenance = 0;
  let lifetimeReplacement = 0;

  for (let year = 1; year <= inputs.years; year += 1) {
    const elapsed = year - 1;
    const efficiency = cents(
      inputs.firstYearPanelEfficiencyPercent - inputs.yearlyPanelDegradationPoints * elapsed,
    );
    const production = baseProductionKwh * (efficiency / 100);
    const selfKwh = production * selfShare;
    const exportKwh = production - selfKwh;
    const feedIn = inputs.feedInTariffIlsPerKwh * (1 + inputs.feedInEscalationPercent / 100) ** elapsed;
    const retail = inputs.retailTariffIlsPerKwh * (1 + inputs.retailEscalationPercent / 100) ** elapsed;
    const exportRevenue = exportKwh * feedIn;
    const selfSavings = selfKwh * retail;
    const gross = exportRevenue + selfSavings;
    const maintenance = inputs.annualMaintenanceIls * (1 + inputs.maintenanceEscalationPercent / 100) ** elapsed;
    const replacement = year === inputs.inverterReplacementYear ? inputs.inverterReplacementCostIls : 0;
    const net = gross - maintenance - replacement;

    openings.push(cumulative);
    cumulative += net;
    closings.push(cumulative);
    const discountFactor = (1 + rate) ** year;
    discountedOpenings.push(discountedCumulative);
    discountedCumulative += net / discountFactor;
    discountedClosings.push(discountedCumulative);
    pvEnergy += production / discountFactor;
    pvCosts += (maintenance + replacement) / discountFactor;
    lifetimeProduction += production;
    lifetimeGross += gross;
    lifetimeMaintenance += maintenance;
    lifetimeReplacement += replacement;

    rows.push({
      year,
      efficiencyPercent: efficiency,
      productionKwh: cents(production),
      exportedKwh: cents(exportKwh),
      selfConsumedKwh: cents(selfKwh),
      exportRevenueIls: cents(exportRevenue),
      selfSavingsIls: cents(selfSavings),
      grossIls: cents(gross),
      maintenanceIls: cents(maintenance),
      replacementIls: cents(replacement),
      netIls: cents(net),
      cumulativeNetIls: cents(cumulative),
      positionIls: cents(cumulative - investment),
    });
  }

  const firstYearNet = rows[0]?.netIls ?? 0;
  const flows = [-investment, ...rows.map((row) => row.netIls)];
  const irrValue = investment > 0 ? irr(flows) : null;

  return {
    system: { panelCount: inputs.panelCount, dcKwp: cents(dcKwp * 1000) / 1000, baseProductionKwh: cents(baseProductionKwh) },
    price,
    summary: {
      years: inputs.years,
      investmentIls: investment,
      lifetimeProductionKwh: cents(lifetimeProduction),
      lifetimeGrossIls: cents(lifetimeGross),
      lifetimeMaintenanceIls: cents(lifetimeMaintenance),
      lifetimeReplacementIls: cents(lifetimeReplacement),
      lifetimeNetIls: cents(cumulative),
      profitIls: cents(cumulative - investment),
      firstYearNetIls: firstYearNet,
      firstYearReturnPercent: investment > 0 ? cents((firstYearNet / investment) * 100) : null,
      paybackYears: roundYears(crossingYear(openings, closings, investment)),
      discountedPaybackYears: roundYears(crossingYear(discountedOpenings, discountedClosings, investment)),
      npvIls: cents(discountedCumulative - investment),
      irrPercent: irrValue === null ? null : cents(irrValue * 100),
      lcoeIlsPerKwh: pvEnergy > 0 ? Math.round((pvCosts / pvEnergy) * 10000) / 10000 : null,
      co2Tons: cents((lifetimeProduction * inputs.gridEmissionKgPerKwh) / 1000),
    },
    rows,
  };
}

function roundYears(value: number | null): number | null {
  return value === null ? null : cents(value);
}

export type ScenarioKey = 'conservative' | 'base' | 'optimistic';

export interface Scenario {
  key: ScenarioKey;
  label: string;
  productionFactor: number;
  paybackYears: number | null;
  npvIls: number;
  profitIls: number;
  firstYearNetIls: number;
}

const scenarioDefinitions: ReadonlyArray<Pick<Scenario, 'key' | 'label' | 'productionFactor'>> = [
  { key: 'conservative', label: 'שמרני · ייצור ‎−10%', productionFactor: 0.9 },
  { key: 'base', label: 'בסיס', productionFactor: 1 },
  { key: 'optimistic', label: 'אופטימי · ייצור ‎+10%', productionFactor: 1.1 },
];

/** Sensitivity of the headline numbers to the production estimate. */
export function calculateScenarios(inputs: QuoteInputs): Scenario[] {
  return scenarioDefinitions.map((definition) => {
    const { summary } = calculateQuote(inputs, { productionFactor: definition.productionFactor });
    return {
      ...definition,
      paybackYears: summary.paybackYears,
      npvIls: summary.npvIls,
      profitIls: summary.profitIls,
      firstYearNetIls: summary.firstYearNetIls,
    };
  });
}
