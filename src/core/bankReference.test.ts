import { buildLoanSchedule } from './loan';
import { Dec } from './money';
import type { InterestMode, PaymentType } from './types';

/**
 * Reconciliation with real bank calculators.
 *
 * How to add a case: open a bank's loan calculator, enter the parameters, copy the payment,
 * the total interest and the bank's interest mode (most mortgage contracts accrue by days).
 * Record the URL and the date: bank calculators change.
 *
 * Until this table is filled, the README must not claim "matches banks to the kopeck".
 */
interface BankCase {
  source: string; // bank + URL + date checked
  amount: string;
  annualRate: string;
  termMonths: number;
  startDate: string;
  paymentType: PaymentType;
  interestMode: InterestMode;
  expectedPayment: string;
  expectedTotalInterest?: string;
}

const CASES: BankCase[] = [
  // {
  //   source: 'Bank X, https://…, checked 2026-10-20',
  //   amount: '3000000', annualRate: '16.5', termMonths: 240, startDate: '2026-10-20',
  //   paymentType: 'annuity', interestMode: 'monthly',
  //   expectedPayment: '42867.02', expectedTotalInterest: '7288083.73',
  // },
];

describe('bank calculators reconciliation', () => {
  if (CASES.length === 0) {
    it.todo('fill CASES with 5–10 calculations taken from bank websites');
    return;
  }

  it.each(CASES)('$source', (c) => {
    const s = buildLoanSchedule({
      amount: new Dec(c.amount),
      annualRate: new Dec(c.annualRate),
      termMonths: c.termMonths,
      startDate: c.startDate,
      paymentType: c.paymentType,
      interestMode: c.interestMode,
    });
    expect(s.firstPayment.toFixed(2)).toBe(c.expectedPayment);
    if (c.expectedTotalInterest) expect(s.totalInterest.toFixed(2)).toBe(c.expectedTotalInterest);
  });
});
