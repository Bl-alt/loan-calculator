/** Calendar dates as ISO strings (YYYY-MM-DD). All arithmetic is done in UTC to avoid DST shifts. */
export type IsoDate = string;

const MS_PER_DAY = 86_400_000;
const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

function toUtc(date: IsoDate): Date {
  const m = ISO_RE.exec(date);
  if (!m) throw new Error(`Invalid ISO date: ${date}`);
  const [, y, mo, d] = m;
  const result = new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d)));
  if (result.getUTCDate() !== Number(d)) throw new Error(`Invalid ISO date: ${date}`);
  return result;
}

function fromUtc(date: Date): IsoDate {
  return date.toISOString().slice(0, 10);
}

export function isValidIsoDate(date: string): boolean {
  try {
    toUtc(date);
    return true;
  } catch {
    return false;
  }
}

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function daysInYear(year: number): number {
  return isLeapYear(year) ? 366 : 365;
}

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

/**
 * Adds months counting from the original day and clamping to the month end:
 * 31.01 + 1 → 28/29.02, 31.01 + 2 → 31.03 (not 28.03).
 */
export function addMonths(date: IsoDate, months: number): IsoDate {
  const base = toUtc(date);
  const totalMonths = base.getUTCFullYear() * 12 + base.getUTCMonth() + months;
  const year = Math.floor(totalMonths / 12);
  const monthIndex = totalMonths % 12;
  const day = Math.min(base.getUTCDate(), daysInMonth(year, monthIndex));
  return fromUtc(new Date(Date.UTC(year, monthIndex, day)));
}

export function daysBetween(from: IsoDate, to: IsoDate): number {
  return Math.round((toUtc(to).getTime() - toUtc(from).getTime()) / MS_PER_DAY);
}

export interface YearSlice {
  days: number;
  yearDays: number;
}

/**
 * Splits the interval (from, to] by calendar years, so interest for each part can be
 * divided by that year's length (365 or 366).
 */
export function splitByYear(from: IsoDate, to: IsoDate): YearSlice[] {
  const slices: YearSlice[] = [];
  let cursor = from;
  const endYear = toUtc(to).getUTCFullYear();
  for (let year = toUtc(from).getUTCFullYear(); year <= endYear; year++) {
    const yearEnd = year === endYear ? to : `${year}-12-31`;
    const days = daysBetween(cursor, yearEnd);
    if (days > 0) slices.push({ days, yearDays: daysInYear(year) });
    cursor = yearEnd;
  }
  return slices;
}
