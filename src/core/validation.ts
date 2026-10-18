import { isValidIsoDate } from './dates';
import { Dec, parseDecimal } from './money';
import type {
  DepositParams,
  EarlyRepayment,
  EarlyRepaymentStrategy,
  InterestMode,
  LoanParams,
  PaymentType,
} from './types';

export const LIMITS = {
  minAmount: new Dec(1),
  maxAmount: new Dec(1_000_000_000),
  maxRate: new Dec(100),
  maxTermMonths: 600,
} as const;

export type FieldErrors = Record<string, string>;
export type ValidationResult<T> = { ok: true; value: T } | { ok: false; errors: FieldErrors };

/** Raw form state: everything is a string exactly as the user typed it. */
export interface LoanInput {
  amount: string;
  annualRate: string;
  termMonths: string;
  startDate: string;
  paymentType: PaymentType;
  interestMode: InterestMode;
  earlyRepayments: EarlyRepaymentInput[];
}

export interface EarlyRepaymentInput {
  kind: 'once' | 'monthly';
  month: string;
  amount: string;
  strategy: EarlyRepaymentStrategy;
}

export interface DepositInput {
  amount: string;
  annualRate: string;
  termMonths: string;
  startDate: string;
  capitalization: boolean;
  monthlyTopUp: string;
}

function hasAtMostTwoDecimals(value: Dec): boolean {
  return value.decimalPlaces() <= 2;
}

function parseMoney(
  raw: string,
  errors: FieldErrors,
  field: string,
  allowZero = false,
): Dec | null {
  const value = parseDecimal(raw);
  if (value === null) {
    errors[field] = 'Введите число';
    return null;
  }
  if (!hasAtMostTwoDecimals(value)) {
    errors[field] = 'Не больше двух знаков после запятой';
    return null;
  }
  const min = allowZero ? new Dec(0) : LIMITS.minAmount;
  if (value.lt(min) || value.gt(LIMITS.maxAmount)) {
    errors[field] = allowZero ? 'От 0 до 1 000 000 000 ₽' : 'От 1 до 1 000 000 000 ₽';
    return null;
  }
  return value;
}

function parseRate(raw: string, errors: FieldErrors): Dec | null {
  const value = parseDecimal(raw);
  if (value === null) {
    errors.annualRate = 'Введите число';
    return null;
  }
  if (value.isNegative() || value.gt(LIMITS.maxRate)) {
    errors.annualRate = 'Ставка от 0 до 100 %';
    return null;
  }
  return value;
}

function parseMonths(raw: string, errors: FieldErrors, field: string, max: number): number | null {
  const value = parseDecimal(raw);
  if (value === null || !value.isInteger()) {
    errors[field] = 'Введите целое число месяцев';
    return null;
  }
  if (value.lt(1) || value.gt(max)) {
    errors[field] = `От 1 до ${max} мес.`;
    return null;
  }
  return value.toNumber();
}

function checkDate(raw: string, errors: FieldErrors): void {
  if (!isValidIsoDate(raw)) errors.startDate = 'Укажите дату';
}

export function validateLoan(input: LoanInput): ValidationResult<LoanParams> {
  const errors: FieldErrors = {};
  const amount = parseMoney(input.amount, errors, 'amount');
  const annualRate = parseRate(input.annualRate, errors);
  const termMonths = parseMonths(input.termMonths, errors, 'termMonths', LIMITS.maxTermMonths);
  checkDate(input.startDate, errors);

  const earlyRepayments: EarlyRepayment[] = [];
  input.earlyRepayments.forEach((r, idx) => {
    const month = parseMonths(
      r.month,
      errors,
      `early.${idx}.month`,
      termMonths ?? LIMITS.maxTermMonths,
    );
    const value = parseMoney(r.amount, errors, `early.${idx}.amount`);
    if (month !== null && value !== null) {
      earlyRepayments.push({ kind: r.kind, month, amount: value, strategy: r.strategy });
    }
  });

  if (Object.keys(errors).length > 0 || !amount || !annualRate || !termMonths) {
    return { ok: false, errors };
  }
  return {
    ok: true,
    value: {
      amount,
      annualRate,
      termMonths,
      startDate: input.startDate,
      paymentType: input.paymentType,
      interestMode: input.interestMode,
      earlyRepayments,
    },
  };
}

export function validateDeposit(input: DepositInput): ValidationResult<DepositParams> {
  const errors: FieldErrors = {};
  const amount = parseMoney(input.amount, errors, 'amount');
  const annualRate = parseRate(input.annualRate, errors);
  const termMonths = parseMonths(input.termMonths, errors, 'termMonths', LIMITS.maxTermMonths);
  const monthlyTopUp = parseMoney(input.monthlyTopUp || '0', errors, 'monthlyTopUp', true);
  checkDate(input.startDate, errors);

  if (Object.keys(errors).length > 0 || !amount || !annualRate || !termMonths || !monthlyTopUp) {
    return { ok: false, errors };
  }
  return {
    ok: true,
    value: {
      amount,
      annualRate,
      termMonths,
      startDate: input.startDate,
      capitalization: input.capitalization,
      monthlyTopUp,
    },
  };
}
