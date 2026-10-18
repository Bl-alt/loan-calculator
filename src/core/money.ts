import Decimal from 'decimal.js';

/**
 * Isolated Decimal constructor so the global decimal.js config is never mutated.
 * 40 significant digits keep intermediate results (e.g. (1+i)^-600) exact far beyond kopecks.
 */
export const Dec = Decimal.clone({ precision: 40, rounding: Decimal.ROUND_HALF_UP });
export type Dec = Decimal;

export const ZERO = new Dec(0);

/** Rounds to whole kopecks, half-up — the rule Russian banks use in payment schedules. */
export function roundMoney(value: Decimal): Decimal {
  return value.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

export function sum(values: readonly Decimal[]): Decimal {
  return values.reduce((acc, v) => acc.plus(v), ZERO);
}

const NUMBER_RE = /^-?\d+(\.\d+)?$/;

/** Parses user input like "1 000 000,50". Returns null for anything that is not a plain number. */
export function parseDecimal(input: string): Decimal | null {
  const normalized = input.replace(/[\s\u00a0\u202f]/g, '').replace(',', '.');
  if (!NUMBER_RE.test(normalized)) return null;
  return new Dec(normalized);
}
