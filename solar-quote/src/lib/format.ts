const locale = 'he-IL';

export const integer = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
export const decimal = new Intl.NumberFormat(locale, { maximumFractionDigits: 3 });
const oneDecimal = new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const compactNumber = new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 });
const shekel = new Intl.NumberFormat(locale, { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 });
const shekelCents = new Intl.NumberFormat(locale, { style: 'currency', currency: 'ILS', maximumFractionDigits: 2 });
const tariff = new Intl.NumberFormat(locale, { style: 'currency', currency: 'ILS', minimumFractionDigits: 2, maximumFractionDigits: 4 });

export const formatInteger = (value: number) => integer.format(value);
export const formatDecimal = (value: number) => decimal.format(value);
export const formatIls = (value: number) => shekel.format(Object.is(value, -0) ? 0 : value);
export const formatIlsExact = (value: number) => shekelCents.format(value);
export const formatTariff = (value: number) => tariff.format(value);
export const formatCompact = (value: number) => compactNumber.format(value);
export const formatKwh = (value: number) => `${integer.format(value)} קוט״ש`;
export const formatPercent = (value: number) => `${oneDecimal.format(value)}%`;
export const formatYears = (value: number | null, fallback = 'מעבר לתקופה') =>
  value === null ? fallback : `${oneDecimal.format(value)} שנים`;

const dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeZone: 'UTC' });

/** Formats a YYYY-MM-DD string, or returns '' for anything that is not a real calendar date. */
export function formatIsoDate(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return '';
  const date = new Date(`${value}T00:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) return '';
  return dateFormatter.format(date);
}

/** Adds whole days to a YYYY-MM-DD string; returns '' when the input is invalid. */
export function addDaysIso(value: string, days: number): string {
  if (!formatIsoDate(value) || !Number.isInteger(days)) return '';
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
