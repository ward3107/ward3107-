'use client';

import { useId, useState, type PointerEvent } from 'react';
import type { QuoteResult } from '@/lib/finance';
import { formatIls, formatInteger } from '@/lib/format';

const axisFormat = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });
const W = 640;
const H = 250;
const M = { left: 54, right: 14, top: 14, bottom: 30 };
const plotW = W - M.left - M.right;
const plotH = H - M.top - M.bottom;

function niceStep(range: number, count: number): number {
  const raw = range / count;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const normalised = raw / magnitude;
  const factor = normalised < 1.5 ? 1 : normalised < 3 ? 2 : normalised < 7 ? 5 : 10;
  return factor * magnitude;
}

function scale(minValue: number, maxValue: number) {
  const low = Math.min(0, minValue);
  const high = Math.max(0, maxValue);
  const span = high - low || 1;
  const step = niceStep(span, 4);
  const min = Math.floor(low / step) * step;
  const max = Math.ceil(high / step) * step || step;
  const ticks: number[] = [];
  for (let tick = min; tick <= max + step / 2; tick += step) ticks.push(Math.round(tick * 100) / 100);
  const y = (value: number) => M.top + plotH - ((value - min) / (max - min)) * plotH;
  return { ticks, y, zero: y(0) };
}

function Axis({ ticks, y }: { ticks: number[]; y: (value: number) => number }) {
  return (
    <g className="chart-axis">
      {ticks.map((tick) => (
        <g key={tick}>
          <line x1={M.left} x2={W - M.right} y1={y(tick)} y2={y(tick)} className={tick === 0 ? 'zero' : 'gridline'} />
          <text x={M.left - 8} y={y(tick) + 4} textAnchor="end">{axisFormat.format(tick)}</text>
        </g>
      ))}
    </g>
  );
}

function useHover(count: number, offset: number) {
  const [index, setIndex] = useState<number | null>(null);
  const onMove = (event: PointerEvent<SVGSVGElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - box.left) / box.width) * W;
    const ratio = Math.min(1, Math.max(0, (x - M.left) / plotW));
    setIndex(Math.min(count - 1, Math.max(0, Math.round(ratio * (count - 1 + offset) - offset / 2))));
  };
  return { index, onMove, onLeave: () => setIndex(null) };
}

/** Cumulative position over time: negative until the investment has been earned back. */
export function CashflowChart({ result }: { result: QuoteResult }) {
  const uid = useId().replace(/:/g, '');
  const { rows, summary } = result;
  const values = [-summary.investmentIls, ...rows.map((row) => row.positionIls)];
  const { ticks, y, zero } = scale(Math.min(...values), Math.max(...values));
  const x = (year: number) => M.left + (year / summary.years) * plotW;
  const line = values.map((value, year) => `${x(year).toFixed(1)},${y(value).toFixed(1)}`).join(' ');
  const area = `${x(0)},${zero} ${line} ${x(summary.years)},${zero}`;
  const hover = useHover(values.length, 0);
  const shown = hover.index ?? values.length - 1;
  const labelYears = [...new Set([0, Math.round(summary.years / 4), Math.round(summary.years / 2), Math.round((summary.years * 3) / 4), summary.years])];

  return (
    <figure className="chart">
      <figcaption className="chart-readout" aria-live="off">
        <span>{shown === 0 ? 'עם התקנה' : `שנה ${formatInteger(shown)}`}</span>
        <strong data-negative={(values[shown] ?? 0) < 0 ? 'true' : undefined}>{formatIls(values[shown] ?? 0)}</strong>
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" direction="ltr" onPointerMove={hover.onMove} onPointerLeave={hover.onLeave}
        aria-label={`תזרים מצטבר: מתחיל ב־${formatIls(-summary.investmentIls)} ומסתיים ב־${formatIls(values.at(-1) ?? 0)} לאחר ${summary.years} שנים`}>
        <defs>
          <clipPath id={`${uid}-up`}><rect x={M.left} y={0} width={plotW} height={zero} /></clipPath>
          <clipPath id={`${uid}-down`}><rect x={M.left} y={zero} width={plotW} height={H - zero} /></clipPath>
        </defs>
        <Axis ticks={ticks} y={y} />
        <polygon points={area} className="area-positive" clipPath={`url(#${uid}-up)`} />
        <polygon points={area} className="area-negative" clipPath={`url(#${uid}-down)`} />
        <polyline points={line} className="line" />
        {summary.paybackYears !== null && summary.paybackYears > 0 ? (
          <g className="marker">
            <line x1={x(summary.paybackYears)} x2={x(summary.paybackYears)} y1={M.top} y2={H - M.bottom} />
            <circle cx={x(summary.paybackYears)} cy={zero} r={5} />
          </g>
        ) : null}
        {hover.index !== null ? (
          <g className="hover">
            <line x1={x(shown)} x2={x(shown)} y1={M.top} y2={H - M.bottom} />
            <circle cx={x(shown)} cy={y(values[shown] ?? 0)} r={4.5} />
          </g>
        ) : null}
        <g className="chart-axis">
          {labelYears.map((year) => <text key={year} x={x(year)} y={H - 8} textAnchor="middle">{year}</text>)}
        </g>
      </svg>
      <p className="chart-legend">
        <span><i className="swatch swatch-marker" /> נקודת איזון{summary.paybackYears !== null ? ` · שנה ${summary.paybackYears.toFixed(1)}` : ' · מחוץ לתקופה'}</span>
        <span><i className="swatch swatch-negative" /> עדיין לא החזיר את ההשקעה</span>
        <span><i className="swatch swatch-positive" /> רווח</span>
      </p>
    </figure>
  );
}

/** Net cash flow of each year; the inverter replacement shows up as a dip. */
export function AnnualChart({ result }: { result: QuoteResult }) {
  const { rows, summary } = result;
  const nets = rows.map((row) => row.netIls);
  const { ticks, y, zero } = scale(Math.min(...nets), Math.max(...nets));
  const slot = plotW / rows.length;
  const barWidth = Math.max(2, slot * 0.68);
  const hover = useHover(rows.length, 0);
  const shown = hover.index ?? rows.length - 1;
  const row = rows[shown];

  return (
    <figure className="chart">
      <figcaption className="chart-readout" aria-live="off">
        <span>{`שנה ${formatInteger(shown + 1)} · ייצור ${formatInteger(row?.productionKwh ?? 0)} קוט״ש`}</span>
        <strong data-negative={(row?.netIls ?? 0) < 0 ? 'true' : undefined}>{formatIls(row?.netIls ?? 0)}</strong>
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" direction="ltr" onPointerMove={hover.onMove} onPointerLeave={hover.onLeave}
        aria-label={`תזרים נקי שנתי לאורך ${summary.years} שנים`}>
        <Axis ticks={ticks} y={y} />
        {rows.map((item, index) => {
          const top = y(Math.max(item.netIls, 0));
          const bottom = y(Math.min(item.netIls, 0));
          return (
            <rect key={item.year} x={M.left + index * slot + (slot - barWidth) / 2} y={top} width={barWidth}
              height={Math.max(1, bottom - top)} rx={Math.min(3, barWidth / 3)}
              className={item.netIls < 0 ? 'bar bar-negative' : index === shown && hover.index !== null ? 'bar bar-active' : 'bar'} />
          );
        })}
        <line x1={M.left} x2={W - M.right} y1={zero} y2={zero} className="chart-axis zero" />
        <g className="chart-axis">
          {[1, Math.round(rows.length / 2), rows.length].filter((year, i, all) => all.indexOf(year) === i).map((year) => (
            <text key={year} x={M.left + (year - 0.5) * slot} y={H - 8} textAnchor="middle">{year}</text>
          ))}
        </g>
      </svg>
      <p className="chart-legend">
        <span><i className="swatch swatch-bar" /> תזרים נקי לשנה (ירידה הדרגתית בגלל התיישנות הפאנלים)</span>
      </p>
    </figure>
  );
}
