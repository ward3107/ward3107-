import { describe, expect, it } from 'vitest';
import { calculateQuote, calculateScenarios, irr, QuoteValidationError } from '@/lib/finance';
import { exampleInputs } from '@/lib/defaults';

// Values produced by the original calculator (solar-quote.js v1) for example.json.
describe('golden values of the original calculator', () => {
  const result = calculateQuote(exampleInputs);

  it('matches system size and production', () => {
    expect(result.system.dcKwp).toBe(19.43);
    expect(result.system.baseProductionKwh).toBe(31088);
  });

  it('matches the price breakdown shown to customers', () => {
    expect(result.price).toEqual({
      originalIls: 60155,
      discountIls: 1504,
      beforeVatIls: 58651,
      vatIls: 10557,
      totalIls: 69208,
    });
    expect(result.price.beforeVatIls + result.price.vatIls).toBe(result.price.totalIls);
  });

  it('matches the first and last year of the forecast', () => {
    const first = result.rows[0]!;
    const last = result.rows[24]!;
    expect(first.efficiencyPercent).toBe(99);
    expect(first.productionKwh).toBeCloseTo(30777.12, 2);
    expect(first.grossIls).toBeCloseTo(14773.02, 2);
    expect(last.efficiencyPercent).toBe(90.6);
    expect(last.productionKwh).toBeCloseTo(28165.73, 2);
    expect(last.grossIls).toBeCloseTo(13519.55, 2);
  });

  it('matches lifetime totals', () => {
    expect(result.summary.lifetimeProductionKwh).toBeCloseTo(736785.6, 0);
    expect(result.summary.lifetimeGrossIls).toBeCloseTo(353657.09, 0);
    expect(result.summary.lifetimeNetIls).toBeCloseTo(353657.09, 0);
    expect(result.summary.paybackYears).toBeCloseTo(4.72, 2);
    expect(result.summary.firstYearReturnPercent).toBeCloseTo(21.35, 1);
  });
});

describe('extended model', () => {
  it('counts self-consumed energy at the retail tariff', () => {
    const exportOnly = calculateQuote(exampleInputs).summary.lifetimeGrossIls;
    const withSelf = calculateQuote({ ...exampleInputs, selfConsumptionPercent: 50, retailTariffIlsPerKwh: 0.6 });
    expect(withSelf.summary.lifetimeGrossIls).toBeGreaterThan(exportOnly);
    const first = withSelf.rows[0]!;
    expect(first.selfConsumedKwh + first.exportedKwh).toBeCloseTo(first.productionKwh, 1);
    expect(first.selfConsumedKwh).toBeCloseTo(first.productionKwh / 2, 1);
    expect(first.grossIls).toBeCloseTo(first.exportRevenueIls + first.selfSavingsIls, 1);
  });

  it('applies tariff escalation from the second year on', () => {
    const flat = calculateQuote(exampleInputs);
    const rising = calculateQuote({ ...exampleInputs, feedInEscalationPercent: 2 });
    expect(rising.rows[0]!.grossIls).toBe(flat.rows[0]!.grossIls);
    expect(rising.rows[1]!.grossIls).toBeGreaterThan(flat.rows[1]!.grossIls);
  });

  it('charges the inverter replacement in the chosen year only', () => {
    const result = calculateQuote({ ...exampleInputs, inverterReplacementYear: 12, inverterReplacementCostIls: 9000 });
    expect(result.rows.filter((row) => row.replacementIls > 0).map((row) => row.year)).toEqual([12]);
    expect(result.summary.lifetimeReplacementIls).toBe(9000);
    expect(result.summary.lifetimeNetIls).toBeCloseTo(353657.09 - 9000, 0);
  });

  it('escalates maintenance', () => {
    const result = calculateQuote({ ...exampleInputs, annualMaintenanceIls: 500, maintenanceEscalationPercent: 2 });
    expect(result.rows[0]!.maintenanceIls).toBe(500);
    expect(result.rows[1]!.maintenanceIls).toBe(510);
  });

  it('computes NPV, IRR and LCOE consistently', () => {
    const { summary } = calculateQuote(exampleInputs);
    expect(summary.npvIls).toBeGreaterThan(0);
    expect(summary.npvIls).toBeLessThan(summary.profitIls);
    expect(summary.irrPercent).toBeGreaterThan(15);
    expect(summary.irrPercent).toBeLessThan(25);
    expect(summary.discountedPaybackYears!).toBeGreaterThan(summary.paybackYears!);
    expect(summary.lcoeIlsPerKwh!).toBeGreaterThan(0);
    expect(summary.lcoeIlsPerKwh!).toBeLessThan(exampleInputs.feedInTariffIlsPerKwh);
  });

  it('has NPV equal to profit when the discount rate is zero', () => {
    const { summary } = calculateQuote({ ...exampleInputs, discountRatePercent: 0 });
    expect(summary.npvIls).toBeCloseTo(summary.profitIls, 0);
    expect(summary.discountedPaybackYears).toBeCloseTo(summary.paybackYears!, 1);
  });

  it('estimates avoided CO2', () => {
    const { summary } = calculateQuote(exampleInputs);
    expect(summary.co2Tons).toBeCloseTo((summary.lifetimeProductionKwh * 0.4) / 1000, 1);
  });

  it('reports no payback when the system never earns the investment back', () => {
    const { summary } = calculateQuote({ ...exampleInputs, years: 3 });
    expect(summary.paybackYears).toBeNull();
    expect(summary.profitIls).toBeLessThan(0);
    expect(summary.irrPercent).toBeLessThan(0);
  });

  it('handles a free system', () => {
    const { summary } = calculateQuote({ ...exampleInputs, pricePerKwpIls: 0 });
    expect(summary.investmentIls).toBe(0);
    expect(summary.paybackYears).toBe(0);
    expect(summary.firstYearReturnPercent).toBeNull();
    expect(summary.irrPercent).toBeNull();
  });

  it('keeps the position negative until payback and positive afterwards', () => {
    const { rows, summary } = calculateQuote(exampleInputs);
    const paybackYear = Math.ceil(summary.paybackYears!);
    expect(rows[paybackYear - 2]!.positionIls).toBeLessThan(0);
    expect(rows[paybackYear - 1]!.positionIls).toBeGreaterThanOrEqual(0);
  });
});

describe('scenarios', () => {
  it('orders results from conservative to optimistic', () => {
    const [low, base, high] = calculateScenarios(exampleInputs);
    expect(base!.paybackYears).toBeCloseTo(calculateQuote(exampleInputs).summary.paybackYears!, 5);
    expect(low!.paybackYears!).toBeGreaterThan(base!.paybackYears!);
    expect(high!.paybackYears!).toBeLessThan(base!.paybackYears!);
    expect(low!.npvIls).toBeLessThan(base!.npvIls);
    expect(high!.npvIls).toBeGreaterThan(base!.npvIls);
  });
});

describe('validation', () => {
  it('throws with field-level issues', () => {
    expect(() => calculateQuote({ ...exampleInputs, panelCount: 0 })).toThrow(QuoteValidationError);
    try {
      calculateQuote({ ...exampleInputs, panelCount: 2.5, vatPercent: 120 });
    } catch (error) {
      expect(error).toBeInstanceOf(QuoteValidationError);
      expect(Object.keys((error as QuoteValidationError).issues).sort()).toEqual(['panelCount', 'vatPercent']);
    }
  });

  it('rejects an efficiency curve that drops below zero', () => {
    expect(() => calculateQuote({ ...exampleInputs, yearlyPanelDegradationPoints: 5, years: 30 })).toThrow(
      QuoteValidationError,
    );
  });

  it('rejects NaN and a replacement after the horizon', () => {
    expect(() => calculateQuote({ ...exampleInputs, panelWatts: Number.NaN })).toThrow(QuoteValidationError);
    expect(() => calculateQuote({ ...exampleInputs, inverterReplacementYear: 30 })).toThrow(QuoteValidationError);
  });
});

describe('irr', () => {
  it('finds a known rate', () => {
    expect(irr([-100, 110])).toBeCloseTo(0.1, 6);
    expect(irr([-1000, 300, 400, 500])).toBeCloseTo(0.0889, 3);
  });
  it('returns null without a sign change', () => {
    expect(irr([100, 200])).toBeNull();
    expect(irr([-100, -50])).toBeNull();
  });
});
