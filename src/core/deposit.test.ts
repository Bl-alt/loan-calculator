import { buildDepositSchedule } from './deposit';
import { Dec, roundMoney } from './money';
import type { DepositParams } from './types';

const base = (overrides: Partial<DepositParams> = {}): DepositParams => ({
  amount: new Dec(100_000),
  annualRate: new Dec(10),
  termMonths: 12,
  startDate: '2025-01-15',
  capitalization: true,
  monthlyTopUp: new Dec(0),
  ...overrides,
});

describe('deposit', () => {
  it('with capitalization matches reference and the compound formula within monthly rounding', () => {
    const r = buildDepositSchedule(base());
    expect(r.finalAmount.toFixed(2)).toBe('110471.32');
    const formula = roundMoney(
      new Dec(100_000).times(new Dec(1).plus(new Dec(10).div(1200)).pow(12)),
    );
    expect(r.finalAmount.minus(formula).abs().lte(new Dec('0.01').times(12))).toBe(true);
  });

  it('without capitalization accrues on the deposited amount only', () => {
    const r = buildDepositSchedule(base({ capitalization: false }));
    // 833.33 per month, each rounded to kopecks: 12 × 833.33, not 10 000.00
    expect(r.totalInterest.toFixed(2)).toBe('9999.96');
    expect(r.rows[11]!.balance.toString()).toBe('100000');
    expect(r.rows[11]!.paidOut.toFixed(2)).toBe('9999.96');
  });

  it('top-ups earn from the next month and are not added in the last month', () => {
    const r = buildDepositSchedule(base({ capitalization: false, monthlyTopUp: new Dec(5000) }));
    expect(r.totalContributed.toString()).toBe('155000');
    expect(r.totalInterest.toFixed(2)).toBe('12750.00');
    expect(r.finalAmount.toFixed(2)).toBe('167750.00');
    expect(r.rows[11]!.topUp.isZero()).toBe(true);
  });

  it('capitalization beats simple interest', () => {
    const cap = buildDepositSchedule(base({ termMonths: 36 }));
    const simple = buildDepositSchedule(base({ termMonths: 36, capitalization: false }));
    expect(cap.totalInterest.gt(simple.totalInterest)).toBe(true);
  });

  it('zero rate', () => {
    const r = buildDepositSchedule(base({ annualRate: new Dec(0), monthlyTopUp: new Dec(1000) }));
    expect(r.totalInterest.isZero()).toBe(true);
    expect(r.finalAmount.toString()).toBe('111000');
  });
});
