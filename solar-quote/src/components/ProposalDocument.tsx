import type { OptionResult } from '@/lib/options';
import {
  addDaysIso, formatDecimal, formatIls, formatInteger, formatIsoDate, formatKwh, formatPercent,
  formatTariff, formatYears,
} from '@/lib/format';
import { asset } from '@/lib/paths';
import { AnnualChart, CashflowChart, CompareChart } from './charts';
import { ComparisonTable } from './OptionTables';
import { OptionPrices, OptionSpecs } from './ProposalOptions';

function lines(text: string): string[] {
  return text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

function phoneHref(value: string): string {
  const normalized = value.replace(/[\s().-]/g, '');
  return /^\+?\d{7,15}$/.test(normalized) ? `tel:${normalized}` : '';
}

function emailHref(value: string): string {
  const email = value.trim();
  return /^[a-z\d._+-]+@[a-z\d.-]+\.[a-z]{2,63}$/i.test(email) ? `mailto:${email}` : '';
}

function ContactLink({ value, href }: { value: string; href: string }) {
  return href ? <a href={href}><bdi>{value}</bdi></a> : <span><bdi>{value}</bdi></span>;
}

function Section({ number, eyebrow, title, id, long, children }: { number: string; eyebrow: string; title: string; id: string; long?: boolean; children: React.ReactNode }) {
  return (
    <section className={long ? 'p-section p-long' : 'p-section'} aria-labelledby={id}>
      <header className="p-heading">
        <p className="eyebrow"><span aria-hidden="true">{number}</span> {eyebrow}</p>
        <h2 id={id}>{title}</h2>
      </header>
      {children}
    </section>
  );
}

function List({ items, tone }: { items: string[]; tone?: 'minus' }) {
  return (
    <ul className="p-list" data-tone={tone}>
      {items.map((item) => <li key={item} dir="auto">{item}</li>)}
    </ul>
  );
}

interface Props {
  /** One entry per option (1–3). */
  items: OptionResult[];
  sample: boolean;
  reference?: string;
}

export function ProposalDocument({ items, sample, reference }: Props) {
  const multi = items.length > 1;
  // Detailed tables follow the recommended option, or the first one when none is marked.
  const focus = items.find((item) => item.option.recommended) ?? items[0]!;
  const { inputs, details } = focus.option;
  const { result, scenarios } = focus;
  const { price, summary, system, rows } = result;
  let counter = 0;
  const next = () => String(++counter).padStart(2, '0');
  const title = details.projectName.trim() || 'הצעה למערכת סולארית';
  const company = details.companyName.trim() || 'Solar Quote';
  const date = formatIsoDate(details.proposalDate);
  const validUntil = formatIsoDate(addDaysIso(details.proposalDate, Number(details.validityDays)));
  const included = lines(details.scopeIncluded);
  const excluded = lines(details.scopeExcluded);
  const payments = lines(details.paymentTerms);
  const hasSelf = inputs.selfConsumptionPercent > 0;
  const firstYear = rows[0];

  const specs: Array<[string, string]> = [
    ['הספק מותקן', `${formatDecimal(system.dcKwp)} kWp`],
    ['פאנלים', `${formatInteger(inputs.panelCount)} יח׳ · ${formatDecimal(inputs.panelWatts)} W לפאנל`],
    ['דגם פאנל', details.panelModel.trim()],
    ['ממיר', details.inverter.trim()],
    ['אגירה', details.storage.trim()],
    ['קונסטרוקציה', details.mounting.trim()],
    ['אחריות פאנלים', details.panelWarranty.trim()],
    ['אחריות ממיר', details.inverterWarranty.trim()],
    ['זמן התקנה', details.installationTime.trim()],
  ];

  const assumptions = [
    `ייצור שנתי של ${formatDecimal(inputs.productionHoursPerKwpPerYear)} קוט״ש לכל kWp (${formatKwh(system.baseProductionKwh)} בסיס, ${formatKwh(firstYear?.productionKwh ?? 0)} בשנה הראשונה).`,
    `נצילות פאנלים של ${formatDecimal(inputs.firstYearPanelEfficiencyPercent)}% בשנה הראשונה וירידה של ${formatDecimal(inputs.yearlyPanelDegradationPoints)} נקודות אחוז בכל שנה.`,
    `תעריף מכירה לרשת: ${formatTariff(inputs.feedInTariffIlsPerKwh)} לקוט״ש${inputs.feedInEscalationPercent ? `, בשינוי שנתי של ${formatDecimal(inputs.feedInEscalationPercent)}%` : ', ללא שינוי לאורך התקופה'}.`,
    ...(hasSelf ? [`צריכה עצמית של ${formatDecimal(inputs.selfConsumptionPercent)}% מהייצור, בתעריף חשמל של ${formatTariff(inputs.retailTariffIlsPerKwh)} לקוט״ש${inputs.retailEscalationPercent ? ` ושינוי שנתי של ${formatDecimal(inputs.retailEscalationPercent)}%` : ''}.`] : []),
    ...(inputs.annualMaintenanceIls > 0 ? [`תחזוקה שנתית של ${formatIls(inputs.annualMaintenanceIls)}${inputs.maintenanceEscalationPercent ? `, בשינוי שנתי של ${formatDecimal(inputs.maintenanceEscalationPercent)}%` : ''}.`] : []),
    ...(inputs.inverterReplacementYear > 0 ? [`החלפת ממיר בשנה ${inputs.inverterReplacementYear} בעלות של ${formatIls(inputs.inverterReplacementCostIls)}.`] : []),
    `שיעור היוון של ${formatDecimal(inputs.discountRatePercent)}% לחישוב NPV, החזר מהוון ו־LCOE.`,
    `מקדם פליטה של ${formatDecimal(inputs.gridEmissionKgPerKwh)} ק״ג CO₂ לקוט״ש (הערכה).`,
  ];
  const optionAssumptions = multi
    ? items.map(({ option }) => `${option.name}: ${formatInteger(option.inputs.panelCount)} פאנלים של ${formatDecimal(option.inputs.panelWatts)}W` +
      `${option.inputs.selfConsumptionPercent > 0 ? `, צריכה עצמית ${formatDecimal(option.inputs.selfConsumptionPercent)}%` : ''}` +
      `${option.inputs.annualMaintenanceIls > 0 ? `, תחזוקה ${formatIls(option.inputs.annualMaintenanceIls)} לשנה` : ''}` +
      `${option.inputs.inverterReplacementYear > 0 ? `, החלפת ממיר בשנה ${option.inputs.inverterReplacementYear}` : ''}.`)
    : [];

  return (
    <article className="paper" aria-labelledby="proposal-title">
      <section className="p-cover">
        <div className="p-cover-copy">
          <div className="p-brand">
            {details.logo
              // eslint-disable-next-line @next/next/no-img-element
              ? <img className="p-logo" src={details.logo} alt={`לוגו ${company}`} />
              : null}
            <span dir="auto">{company}</span>
            {sample ? <span className="badge">דוגמה</span> : null}
          </div>
          <p className="eyebrow">הצעת מחיר למערכת סולארית</p>
          <h1 id="proposal-title" dir="auto">{title}</h1>
          {details.customerName.trim() ? <p className="p-customer">עבור <bdi>{details.customerName.trim()}</bdi></p> : null}
          {details.customerAddress.trim() ? <p className="p-address"><bdi>{details.customerAddress.trim()}</bdi></p> : null}
          {multi ? <p className="p-options-line">{items.length} חלופות להשוואה: {items.map(({ option }) => option.name).join(' · ')}</p> : null}
          <dl className="p-meta">
            {date ? <div><dt>תאריך</dt><dd>{date}</dd></div> : null}
            {validUntil ? <div><dt>בתוקף עד</dt><dd>{validUntil}</dd></div> : null}
            {reference ? <div><dt>מס׳ הצעה</dt><dd><bdi>{reference}</bdi></dd></div> : null}
          </dl>
        </div>
        <figure className="p-cover-visual">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={details.rendering || asset('/solar-roof.webp')} alt={details.rendering ? 'הדמיית המערכת' : ''} width={1440} height={960} />
          <figcaption>{details.rendering ? 'הדמיית המערכת' : 'מערכת סולארית · להמחשה'}</figcaption>
        </figure>
      </section>

      {!multi ? <dl className="p-highlights">
        <div><dt>הספק מותקן</dt><dd><bdi>{formatDecimal(system.dcKwp)} kWp</bdi></dd></div>
        <div><dt>ייצור שנתי</dt><dd><bdi>{formatKwh(firstYear?.productionKwh ?? 0)}</bdi></dd></div>
        <div><dt>החזר השקעה</dt><dd><bdi>{formatYears(summary.paybackYears)}</bdi></dd></div>
        <div><dt>רווח נקי ל־{summary.years} שנים</dt><dd><bdi>{formatIls(summary.profitIls)}</bdi></dd></div>
      </dl> : null}

      {multi ? (
        <Section number={next()} eyebrow="השוואה" title="איזו חלופה מתאימה לכם?" id="p-compare">
          <div className="p-table-wrap" role="region" tabIndex={0} aria-label="השוואת חלופות">
            <ComparisonTable items={items} variant="paper" />
          </div>
        </Section>
      ) : null}

      <Section number={next()} eyebrow="הצעת המחיר" title={multi ? 'מחיר לכל חלופה' : 'סיכום העסקה'} id="p-price">
        {multi ? <OptionPrices items={items} /> : <div className="p-price-grid">
          <dl className="p-price">
            <div><dt>מחיר המערכת</dt><dd><bdi>{formatIls(price.originalIls)}</bdi></dd></div>
            {price.discountIls > 0 ? <div><dt>הנחה · {formatDecimal(inputs.discountPercent)}%</dt><dd><bdi>{formatIls(-price.discountIls)}</bdi></dd></div> : null}
            <div><dt>מחיר לפני מע״מ</dt><dd><bdi>{formatIls(price.beforeVatIls)}</bdi></dd></div>
            <div><dt>מע״מ · {formatDecimal(inputs.vatPercent)}%</dt><dd><bdi>{formatIls(price.vatIls)}</bdi></dd></div>
          </dl>
          <div className="p-total">
            <p>סה״כ כולל מע״מ</p>
            <strong><bdi>{formatIls(price.totalIls)}</bdi></strong>
            <small>המחירים בשקלים שלמים</small>
          </div>
        </div>}
        {included.length || excluded.length ? (
          <div className="p-scope">
            {included.length ? <div><h3>מה כלול</h3><List items={included} /></div> : null}
            {excluded.length ? <div><h3>מה מחוץ להצעה</h3><List items={excluded} tone="minus" /></div> : null}
          </div>
        ) : null}
      </Section>

      <Section number={next()} eyebrow="תכנון המערכת" title="מפרט טכני" id="p-specs">
        {multi ? <OptionSpecs items={items} /> : (
          <dl className="p-specs">
            {specs.filter(([, value]) => value).map(([label, value]) => (
              <div key={label}><dt>{label}</dt><dd><bdi>{value}</bdi></dd></div>
            ))}
          </dl>
        )}
      </Section>

      {payments.length ? (
        <Section number={next()} eyebrow="אבני דרך" title="תנאי תשלום" id="p-payment">
          <ol className="p-payments">{payments.map((item) => <li key={item} dir="auto">{item}</li>)}</ol>
        </Section>
      ) : null}

      <Section number={next()} eyebrow="תחזית כלכלית" title="תוכנית עסקית" id="p-forecast" long>
        <p className="p-lead">
          תחזית ל־{summary.years} שנים{hasSelf ? ', הכוללת מכירת עודפים לרשת וחיסכון מצריכה עצמית' : ', על בסיס מכירת חשמל לרשת'}.
          {multi ? ` הפירוט השנתי והרגישות מוצגים עבור ${focus.option.name}${focus.option.recommended ? ' (המומלצת)' : ''}.` : ''}
        </p>
        <dl className="p-metrics">
          <div><dt>השקעה</dt><dd><bdi>{formatIls(summary.investmentIls)}</bdi></dd></div>
          <div><dt>{hasSelf ? 'הכנסה וחיסכון' : 'הכנסות ממכירת חשמל'}</dt><dd><bdi>{formatIls(summary.lifetimeGrossIls)}</bdi></dd></div>
          <div><dt>החזר השקעה</dt><dd><bdi>{formatYears(summary.paybackYears)}</bdi></dd></div>
          <div><dt>תשואה בשנה הראשונה</dt><dd><bdi>{summary.firstYearReturnPercent === null ? '—' : formatPercent(summary.firstYearReturnPercent)}</bdi></dd></div>
          <div><dt>IRR</dt><dd><bdi>{summary.irrPercent === null ? '—' : formatPercent(summary.irrPercent)}</bdi></dd></div>
          <div><dt>NPV</dt><dd><bdi>{formatIls(summary.npvIls)}</bdi></dd></div>
          <div><dt>עלות אנרגיה (LCOE)</dt><dd><bdi>{summary.lcoeIlsPerKwh === null ? '—' : formatTariff(summary.lcoeIlsPerKwh)}</bdi></dd></div>
          <div><dt>CO₂ שנחסך</dt><dd><bdi>{formatDecimal(Math.round(summary.co2Tons))} טון</bdi></dd></div>
        </dl>
        <div className="p-charts">
          <div>
            <h3>מצב ההשקעה לאורך זמן{multi ? ' · כל החלופות' : ''}</h3>
            {multi ? <CompareChart items={items} /> : <CashflowChart result={result} />}
          </div>
          <div><h3>תזרים נקי שנתי{multi ? ` · ${focus.option.name}` : ''}</h3><AnnualChart result={result} /></div>
        </div>

        <h3>רגישות לתפוקה</h3>
        <table className="p-table">
          <thead><tr><th scope="col">תרחיש</th><th scope="col">החזר השקעה</th><th scope="col">רווח נקי</th><th scope="col">NPV</th></tr></thead>
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

        <h3>תחזית שנתית</h3>
        <div className="p-table-wrap" role="region" tabIndex={0} aria-label="תחזית שנתית">
          <table className="p-table p-table-dense">
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
      </Section>

      <Section number={next()} eyebrow="שקיפות" title="הנחות היסוד" id="p-assumptions">
        <List items={assumptions} />
        {multi ? <><h3>ההבדלים בין החלופות</h3><List items={optionAssumptions} /></> : null}
        <p className="p-disclaimer">
          התחזית מבוססת על הנחות ואינה התחייבות לתוצאות בפועל. הייצור בפועל תלוי בתנאי האתר, בהצללה, במזג האוויר ובתקינות המערכת,
          ותעריפי החשמל ותנאי הרגולציה עשויים להשתנות. הסכומים מחושבים לפני מיסוי על ההכנסות, אלא אם צוין אחרת.
        </p>
      </Section>

      {details.notes.trim() ? (
        <section className="p-section" aria-labelledby="p-notes">
          <header className="p-heading"><h2 id="p-notes">הערות להצעה</h2></header>
          <p className="p-notes" dir="auto">{details.notes.trim()}</p>
        </section>
      ) : null}

      <section className="p-section p-accept" aria-labelledby="p-accept">
        <header className="p-heading"><h2 id="p-accept">אישור ההצעה</h2>
          <p className="p-lead">{validUntil ? `ההצעה בתוקף עד ${validUntil}. ` : ''}אישור הלקוח מהווה הסכמה למחיר ולמפרט שלעיל.</p>
        </header>
        {multi ? (
          <fieldset className="p-choose">
            <legend>החלופה שנבחרה</legend>
            {items.map(({ option }) => (
              <span key={option.index} className="p-choice"><i className="p-box" aria-hidden="true" /><bdi>{option.name}</bdi>{option.recommended ? ' ★' : ''}</span>
            ))}
          </fieldset>
        ) : null}
        <div className="p-signatures">
          <div><span className="line" /><p>שם הלקוח{details.customerName.trim() ? `: ${details.customerName.trim()}` : ''}</p></div>
          <div><span className="line" /><p>חתימה</p></div>
          <div><span className="line" /><p>תאריך</p></div>
        </div>
      </section>

      {details.contactName.trim() || details.contactPhone.trim() || details.contactEmail.trim() ? (
        <footer className="p-footer">
          <div><p className="eyebrow">יצירת קשר</p><h2 dir="auto">{details.contactName.trim() || company}</h2></div>
          <address>
            {details.contactPhone.trim() ? <ContactLink value={details.contactPhone.trim()} href={phoneHref(details.contactPhone)} /> : null}
            {details.contactEmail.trim() ? <ContactLink value={details.contactEmail.trim()} href={emailHref(details.contactEmail)} /> : null}
          </address>
        </footer>
      ) : null}
    </article>
  );
}
