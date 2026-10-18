import { addMonths } from './dates';
import { ZERO, roundMoney } from './money';
import type { DepositParams, DepositResult, DepositRow } from './types';

/**
 * Monthly accrual: interest = balance × r / 12.
 * With capitalization the interest joins the balance (compound: S × (1 + r/12)^m);
 * without it the interest is paid out and only deposited money earns.
 */
export function buildDepositSchedule(params: DepositParams): DepositResult {
  const { amount, annualRate, termMonths, startDate, capitalization, monthlyTopUp } = params;
  const i = annualRate.div(1200);

  let balance = amount;
  let paidOut = ZERO;
  let contributed = amount;
  const rows: DepositRow[] = [];

  for (let month = 1; month <= termMonths; month++) {
    const interest = roundMoney(balance.times(i));
    if (capitalization) balance = balance.plus(interest);
    else paidOut = paidOut.plus(interest);

    const topUp = month < termMonths ? monthlyTopUp : ZERO;
    balance = balance.plus(topUp);
    contributed = contributed.plus(topUp);

    rows.push({
      index: month,
      date: addMonths(startDate, month),
      interest,
      topUp,
      balance,
      paidOut,
    });
  }

  const finalAmount = balance.plus(paidOut);
  return {
    rows,
    totalInterest: finalAmount.minus(contributed),
    totalContributed: contributed,
    finalAmount,
  };
}
