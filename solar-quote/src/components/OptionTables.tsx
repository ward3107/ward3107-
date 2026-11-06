import { formatDecimal, formatIls, formatKwh, formatPercent, formatYears } from '@/lib/format';
import type { OptionResult } from '@/lib/options';

interface Props {
  items: OptionResult[];
  /** `app` for the editor, `paper` for the customer proposal. */
  variant: 'app' | 'paper';
  activeIndex?: number;
}

/** Side-by-side headline numbers of all options. */
export function ComparisonTable({ items, variant, activeIndex }: Props) {
  const years = items[0]?.result.summary.years ?? 0;
  const rows: Array<[string, (item: OptionResult) => string]> = [
    ['הספק מותקן', ({ result }) => `${formatDecimal(result.system.dcKwp)} kWp`],
    ['ייצור שנתי (שנה 1)', ({ result }) => formatKwh(result.rows[0]?.productionKwh ?? 0)],
    ['מחיר לפני מע״מ', ({ result }) => formatIls(result.price.beforeVatIls)],
    ['מחיר כולל מע״מ', ({ result }) => formatIls(result.price.totalIls)],
    ['החזר השקעה', ({ result }) => formatYears(result.summary.paybackYears)],
    [`רווח נקי ל־${years} שנים`, ({ result }) => formatIls(result.summary.profitIls)],
    ['NPV', ({ result }) => formatIls(result.summary.npvIls)],
    ['IRR', ({ result }) => (result.summary.irrPercent === null ? '—' : formatPercent(result.summary.irrPercent))],
  ];
  const table = variant === 'app' ? 'data-table' : 'p-table';
  return (
    <table className={`${table} compare-table`} data-variant={variant}>
      <thead>
        <tr>
          <td />
          {items.map(({ option }) => (
            <th key={option.index} scope="col" data-recommended={option.recommended ? 'true' : undefined}
              data-active={option.index === activeIndex ? 'true' : undefined}>
              <span dir="auto">{option.name}</span>
              {option.recommended ? <span className="badge badge-star">★ מומלצת</span> : null}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map(([label, value]) => (
          <tr key={label}>
            <th scope="row">{label}</th>
            {items.map((item) => (
              <td key={item.option.index} data-recommended={item.option.recommended ? 'true' : undefined}
                data-active={item.option.index === activeIndex ? 'true' : undefined}><bdi>{value(item)}</bdi></td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
