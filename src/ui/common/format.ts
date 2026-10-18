import type { Dec } from '../../core';

const money = new Intl.NumberFormat('ru-RU', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const moneyShort = new Intl.NumberFormat('ru-RU', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

// Values are already rounded to kopecks by the core; toNumber() here is display-only
// and exact for anything below ~10^13 ₽.
export function formatMoney(value: Dec): string {
  return `${money.format(value.toNumber())} ₽`;
}

const percent = new Intl.NumberFormat('ru-RU', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatPercent(value: Dec): string {
  return `${percent.format(value.toDecimalPlaces(2).toNumber())} %`;
}

/** Shown in place of a number while the form is not filled in yet. */
export const EMPTY = '—';

export function formatMoneyOrEmpty(value: Dec | null | undefined): string {
  return value ? formatMoney(value) : EMPTY;
}

export function formatMoneyShort(value: number): string {
  return moneyShort.format(value);
}

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

/** Russian plural: plural(21, ['месяц', 'месяца', 'месяцев']) → '21 месяц'. */
export function plural(n: number, [one, few, many]: readonly [string, string, string]): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} ${one}`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} ${few}`;
  return `${n} ${many}`;
}

export function pluralMonths(n: number): string {
  return plural(n, ['месяц', 'месяца', 'месяцев']);
}

export function todayIso(): string {
  const d = new Date();
  const pad = (x: number) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
