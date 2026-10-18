import { addMonths, splitByYear, type IsoDate } from './dates';
import { Dec, ZERO, roundMoney, sum } from './money';
import type {
  EarlyRepayment,
  EarlyRepaymentEffect,
  EarlyRepaymentStrategy,
  LoanParams,
  LoanRow,
  LoanSchedule,
  PaymentType,
} from './types';

/** Monthly rate as a fraction: 12 % → 0.01 */
export function monthlyRate(annualRatePercent: Dec): Dec {
  return annualRatePercent.div(1200);
}

/** P = S × i / (1 − (1 + i)^−n), rounded to kopecks. Zero rate is a separate case: P = S / n. */
export function annuityPayment(amount: Dec, annualRatePercent: Dec, months: number): Dec {
  const i = monthlyRate(annualRatePercent);
  if (i.isZero()) return roundMoney(amount.div(months));
  const factor = new Dec(1).minus(i.plus(1).pow(-months));
  return roundMoney(amount.times(i).div(factor));
}

/** Interest by actual days; a period crossing New Year is split so each part uses its own 365/366. */
export function dailyInterest(
  balance: Dec,
  annualRatePercent: Dec,
  from: IsoDate,
  to: IsoDate,
): Dec {
  const rate = annualRatePercent.div(100);
  const raw = sum(
    splitByYear(from, to).map(({ days, yearDays }) =>
      balance.times(rate).times(days).div(yearDays),
    ),
  );
  return roundMoney(raw);
}

/**
 * How many more payments of `payment` are needed to repay `balance`:
 * n = −ln(1 − B·i / P) / ln(1 + i). Used for the "reduce term" strategy.
 */
function remainingTermFor(paymentType: PaymentType, balance: Dec, i: Dec, payment: Dec): number {
  if (paymentType === 'differentiated' || i.isZero()) {
    return ceilWithTolerance(balance.div(payment));
  }
  const ratio = new Dec(1).minus(balance.times(i).div(payment));
  return ceilWithTolerance(ratio.ln().neg().div(i.plus(1).ln()));
}

/** ceil that ignores representation noise like 5.0000000001 → 5 */
function ceilWithTolerance(x: Dec): number {
  const rounded = x.toDecimalPlaces(0, Dec.ROUND_HALF_UP);
  if (x.minus(rounded).abs().lt('1e-9')) return rounded.toNumber();
  return x.ceil().toNumber();
}

function earlyRepaymentsFor(
  repayments: readonly EarlyRepayment[],
  month: number,
): { amount: Dec; strategy: EarlyRepaymentStrategy | null } {
  const due = repayments.filter((r) => (r.kind === 'once' ? r.month === month : month >= r.month));
  if (due.length === 0) return { amount: ZERO, strategy: null };
  // When several repayments fall on one date, "reduce payment" wins if any of them asks for it:
  // it is the more conservative choice for the borrower's monthly budget.
  const strategy = due.some((r) => r.strategy === 'reducePayment') ? 'reducePayment' : 'reduceTerm';
  return { amount: sum(due.map((r) => r.amount)), strategy };
}

export function buildLoanSchedule(params: LoanParams): LoanSchedule {
  const { amount, annualRate, startDate, paymentType, interestMode } = params;
  const repayments = params.earlyRepayments ?? [];
  const i = monthlyRate(annualRate);

  let balance = amount;
  // Month number of the planned final payment; moves when early repayments shorten the loan.
  let lastMonth = params.termMonths;
  let annuity = annuityPayment(amount, annualRate, params.termMonths);
  let diffPrincipal = roundMoney(amount.div(params.termMonths));
  let prevDate = startDate;
  const rows: LoanRow[] = [];

  for (let month = 1; balance.gt(0); month++) {
    const date = addMonths(startDate, month);
    const interest =
      interestMode === 'monthly'
        ? roundMoney(balance.times(i))
        : dailyInterest(balance, annualRate, prevDate, date);

    let principal = paymentType === 'annuity' ? annuity.minus(interest) : diffPrincipal;
    // In daily mode a 31-day month at a very high rate can cost more than the annuity itself.
    // The borrower then pays just the interest; the debt is not allowed to grow.
    if (principal.isNegative()) principal = ZERO;
    // Last-payment correction: the final payment takes whatever is left, so the balance ends at 0.00.
    if (month >= lastMonth || principal.gt(balance)) principal = balance;

    const early = earlyRepaymentsFor(repayments, month);
    const earlyAmount = Dec.min(early.amount, balance.minus(principal));
    balance = balance.minus(principal).minus(earlyAmount);

    rows.push({
      index: month,
      date,
      payment: principal.plus(interest),
      interest,
      principal,
      earlyRepayment: earlyAmount,
      balance,
    });

    if (earlyAmount.gt(0) && balance.gt(0)) {
      if (early.strategy === 'reducePayment') {
        const monthsLeft = lastMonth - month;
        annuity = annuityPayment(balance, annualRate, monthsLeft);
        diffPrincipal = roundMoney(balance.div(monthsLeft));
      } else {
        const perMonth = paymentType === 'annuity' ? annuity : diffPrincipal;
        lastMonth = month + remainingTermFor(paymentType, balance, i, perMonth);
      }
    }
    prevDate = date;
  }

  return summarize(rows);
}

function summarize(rows: LoanRow[]): LoanSchedule {
  const totalInterest = sum(rows.map((r) => r.interest));
  const totalPrincipal = sum(rows.map((r) => r.principal));
  const totalEarly = sum(rows.map((r) => r.earlyRepayment));
  const first = rows[0];
  const last = rows[rows.length - 1];
  if (!first || !last) throw new Error('Schedule is empty: amount must be positive');
  return {
    rows,
    totalInterest,
    totalPrincipal,
    totalEarly,
    totalPaid: totalInterest.plus(totalPrincipal).plus(totalEarly),
    firstPayment: first.payment,
    lastPayment: last.payment,
    termMonths: rows.length,
  };
}

/** Builds the schedule with and without early repayments and reports the difference. */
export function earlyRepaymentEffect(params: LoanParams): EarlyRepaymentEffect {
  const base = buildLoanSchedule({ ...params, earlyRepayments: [] });
  const withEarly = buildLoanSchedule(params);
  return {
    base,
    withEarly,
    interestSaved: base.totalInterest.minus(withEarly.totalInterest),
    monthsSaved: base.termMonths - withEarly.termMonths,
  };
}
