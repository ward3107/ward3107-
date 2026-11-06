import { formatDecimal, formatIls, formatInteger } from '@/lib/format';
import type { OptionResult } from '@/lib/options';

/** One price card per option, so the customer can compare totals at a glance. */
export function OptionPrices({ items }: { items: OptionResult[] }) {
  return (
    <div className="p-option-prices">
      {items.map(({ option, result }) => (
        <article key={option.index} className="p-option-price" data-recommended={option.recommended ? 'true' : undefined}>
          <header>
            <h3 dir="auto">{option.name}</h3>
            {option.recommended ? <span className="badge badge-star">★ מומלצת</span> : null}
          </header>
          <p className="p-option-size"><bdi>{formatDecimal(result.system.dcKwp)} kWp</bdi> · {formatInteger(result.system.panelCount)} פאנלים</p>
          <strong className="p-option-total"><bdi>{formatIls(result.price.totalIls)}</bdi></strong>
          <small>כולל מע״מ</small>
          <dl>
            <div><dt>מחיר המערכת</dt><dd><bdi>{formatIls(result.price.originalIls)}</bdi></dd></div>
            {result.price.discountIls > 0 ? <div><dt>הנחה</dt><dd><bdi>{formatIls(-result.price.discountIls)}</bdi></dd></div> : null}
            <div><dt>לפני מע״מ</dt><dd><bdi>{formatIls(result.price.beforeVatIls)}</bdi></dd></div>
            <div><dt>מע״מ</dt><dd><bdi>{formatIls(result.price.vatIls)}</bdi></dd></div>
          </dl>
        </article>
      ))}
    </div>
  );
}

/** Technical specification with one column per option; rows nobody filled in are skipped. */
export function OptionSpecs({ items }: { items: OptionResult[] }) {
  const rows: Array<[string, (item: OptionResult) => string]> = [
    ['הספק מותקן', ({ result }) => `${formatDecimal(result.system.dcKwp)} kWp`],
    ['פאנלים', ({ option }) => `${formatInteger(option.inputs.panelCount)} יח׳ · ${formatDecimal(option.inputs.panelWatts)} W`],
    ['דגם פאנל', ({ option }) => option.details.panelModel.trim()],
    ['ממיר', ({ option }) => option.details.inverter.trim()],
    ['אגירה', ({ option }) => option.details.storage.trim()],
    ['קונסטרוקציה', ({ option }) => option.details.mounting.trim()],
    ['אחריות פאנלים', ({ option }) => option.details.panelWarranty.trim()],
    ['אחריות ממיר', ({ option }) => option.details.inverterWarranty.trim()],
    ['זמן התקנה', ({ option }) => option.details.installationTime.trim()],
    ['צריכה עצמית', ({ option }) => (option.inputs.selfConsumptionPercent > 0 ? `${formatDecimal(option.inputs.selfConsumptionPercent)}%` : '')],
  ];
  const visible = rows.filter(([, value]) => items.some((item) => value(item)));
  return (
    <div className="p-table-wrap" role="region" tabIndex={0} aria-label="מפרט טכני לפי חלופה">
      <table className="p-table compare-table" data-variant="paper">
        <thead>
          <tr>
            <td />
            {items.map(({ option }) => (
              <th key={option.index} scope="col" data-recommended={option.recommended ? 'true' : undefined}>
                <span dir="auto">{option.name}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visible.map(([label, value]) => (
            <tr key={label}>
              <th scope="row">{label}</th>
              {items.map((item) => (
                <td key={item.option.index} data-recommended={item.option.recommended ? 'true' : undefined}>
                  <bdi>{value(item) || '—'}</bdi>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
