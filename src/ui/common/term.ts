import { parseDecimal } from '../../core';

export type TermUnit = 'months' | 'years';

/** Converts the term field to a month count string for validation; "1,5" years → "18". */
export function termToMonths(value: string, unit: TermUnit): string {
  if (unit === 'months') return value;
  const years = parseDecimal(value);
  return years ? years.times(12).toString() : value;
}
