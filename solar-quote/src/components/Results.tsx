'use client';

import { useState, type ReactNode } from 'react';
import type { QuoteResult, Scenario } from '@/lib/finance';
import {
  formatIls, formatInteger, formatKwh, formatPercent, formatTariff, formatYears, formatDecimal,
} from '@/lib/format';
import type { OptionResult } from '@/lib/options';
import { AnnualChart, CashflowChart, CompareChart } from './charts';
import { ComparisonTable } from './OptionTables';

function Kpi({ label, value, note, tone }: { label: string; value: ReactNode; note?: ReactNode; tone?: 'good' | 'warn' }) {
  return (
    <div className="kpi" data-tone={tone}>
      <dt>{label}</dt>
      <dd><bdi>{value}</bdi></dd>
      {note ? <p>{note}</p> : null}
    </div>
  );
}

export function KpiGrid({ result, title }: { result: QuoteResult; title?: string }) {
  const { summary, system, price } = result;
  return (
    <>
    {title ? <h2 className="kpi-title">התוצאות של <bdi>{title}</bdi></h2> : null}
    <dl className="kpi-grid">
      <Kpi label="החזר השקעה" tone={summary.paybackYears === null ? 'warn' : 'good'}
        value={formatYears(summary.paybackYears)}
        note={summary.discountedPaybackYears !== null ? `מהוון: ${formatYears(summary.discountedPaybackYears)}` : 'מהוון: מעבר לתקופה'} />
      <Kpi label="תשואה שנתית (שנה 1)" value={summary.firstYearReturnPercent === null ? '—' : formatPercent(summary.firstYearReturnPercent)}
        note={`${formatIls(summary.firstYearNetIls)} בשנה הראשונה`} />
      <Kpi label={`רווח נקי ל־${summary.years} שנים`} tone={summary.profitIls >= 0 ? 'good' : 'warn'} value={formatIls(summary.profitIls)}
        note={`הכנסות ${formatIls(summary.lifetimeGrossIls)} פחות השקעה`} />
      <Kpi label="NPV" value={formatIls(summary.npvIls)} note="הערך הנוכחי של הרווח" />
      <Kpi label="IRR" value={summary.irrPercent === null ? '—' : formatPercent(summary.irrPercent)} note="תשואה שנתית מהוונת" />
      <Kpi label="עלות אנרגיה (LCOE)" value={summary.lcoeIlsPerKwh === null ? '—' : formatTariff(summary.lcoeIlsPerKwh)}
        note="לקוט״ש, לאורך כל התקופה" />
      <Kpi label="ייצור שנתי (שנה 1)" value={formatKwh(result.rows[0]?.productionKwh ?? 0)}
        note={`${formatDecimal(system.dcKwp)} kWp · ${formatInteger(system.panelCount)} פאנלים`} />
      <Kpi label="CO₂ שנחסך" value={`${formatDecimal(Math.round(summary.co2Tons))} טון`} note="הערכה, לפי מקדם פליטה שניתן לעדכן" />
      <Kpi label="מחיר כולל מע״מ" value={formatIls(price.totalIls)} note={`לפני מע״מ ${formatIls(price.beforeVatIls)}`} />
    </dl>
    </>
  );
}

export function ComparisonPanel({ items, activeIndex }: { items: OptionResult[]; activeIndex: number }) {
  return (
    <section className="card" aria-labelledby="compare-title">
      <h2 id="compare-title">השוואת חלופות</h2>
      <div className="table-scroll" role="region" tabIndex={0} aria-label="טבלת השוואת חלופות">
        <ComparisonTable items={items} variant="app" activeIndex={activeIndex} />
      </div>
    </section>
  );
}

export function ChartPanel({ result, compare }: { result: QuoteResult; compare?: OptionResult[] }) {
  const [tab, setTab] = useState<'cumulative' | 'annual' | 'compare'>('cumulative');
  return (
    <section className="card" aria-labelledby="chart-title">
      <div className="card-head">
        <h2 id="chart-title">תחזית כלכלית</h2>
        <div className="segmented" role="tablist" aria-label="סוג גרף">
          <button role="tab" type="button" aria-selected={tab === 'cumulative'} onClick={() => setTab('cumulative')}>נקודת איזון</button>
          <button role="tab" type="button" aria-selected={tab === 'annual'} onClick={() => setTab('annual')}>תזרים שנתי</button>
          {compare ? <button role="tab" type="button" aria-selected={tab === 'compare'} onClick={() => setTab('compare')}>כל החלופות</button> : null}
        </div>
      </div>
      {tab === 'compare' && compare ? <CompareChart items={compare} /> : tab === 'annual' ? <AnnualChart result={result} /> : <CashflowChart result={result} />}
    </section>
  );
}

export function ScenarioTable({ scenarios }: { scenarios: Scenario[] }) {
  return (
    <section className="card" aria-labelledby="scenario-title">
      <h2 id="scenario-title">רגישות לתפוקה</h2>
      <p className="muted">מה קורה אם המערכת מייצרת קצת פחות או קצת יותר מההערכה.</p>
      <div className="table-scroll" role="region" tabIndex={0} aria-label="טבלת תרחישים">
        <table className="data-table">
          <thead>
            <tr><th scope="col">תרחיש</th><th scope="col">החזר השקעה</th><th scope="col">רווח נקי</th><th scope="col">NPV</th></tr>
          </thead>
          <tbody>
            {scenarios.map((scenario) => (
              <tr key={scenario.key} data-highlight={scenario.key === 'base' ? 'true' : undefined}>
                <th scope="row">{scenario.label}</th>
                <td>{formatYears(scenario.paybackYears)}</td>
                <td>{formatIls(scenario.profitIls)}</td>
                <td>{formatIls(scenario.npvIls)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function AnnualTable({ result }: { result: QuoteResult }) {
  const { rows, summary } = result;
  const hasSelf = rows.some((row) => row.selfSavingsIls > 0);
  return (
    <details className="card disclosure">
      <summary><h2>טבלה שנתית מלאה</h2><span className="muted">{summary.years} שנים</span></summary>
      <div className="table-scroll" role="region" tabIndex={0} aria-label="טבלת תחזית שנתית">
        <table className="data-table sticky-first">
          <thead>
            <tr>
              <th scope="col">שנה</th><th scope="col">יעילות</th><th scope="col">ייצור (קוט״ש)</th>
              <th scope="col">{hasSelf ? 'הכנסה + חיסכון' : 'מכירת חשמל'}</th><th scope="col">עלויות</th>
              <th scope="col">תזרים נקי</th><th scope="col">מצב ההשקעה</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.year}>
                <th scope="row">{row.year}</th>
                <td>{formatPercent(row.efficiencyPercent)}</td>
                <td>{formatInteger(row.productionKwh)}</td>
                <td>{formatIls(row.grossIls)}</td>
                <td>{formatIls(row.maintenanceIls + row.replacementIls)}</td>
                <td>{formatIls(row.netIls)}</td>
                <td data-negative={row.positionIls < 0 ? 'true' : undefined}>{formatIls(row.positionIls)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row" colSpan={2}>סה״כ</th>
              <td>{formatInteger(summary.lifetimeProductionKwh)}</td>
              <td>{formatIls(summary.lifetimeGrossIls)}</td>
              <td>{formatIls(summary.lifetimeMaintenanceIls + summary.lifetimeReplacementIls)}</td>
              <td>{formatIls(summary.lifetimeNetIls)}</td>
              <td>{formatIls(summary.profitIls)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </details>
  );
}
