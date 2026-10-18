import { Dec, sum } from './money';
import { annuityPayment, buildLoanSchedule, dailyInterest, earlyRepaymentEffect } from './loan';
import type { LoanParams, LoanSchedule } from './types';

const base = (overrides: Partial<LoanParams> = {}): LoanParams => ({
  amount: new Dec(1_000_000),
  annualRate: new Dec(12),
  termMonths: 12,
  startDate: '2025-01-15',
  paymentType: 'annuity',
  interestMode: 'monthly',
  ...overrides,
});

function expectConsistent(s: LoanSchedule, amount: Dec) {
  const last = s.rows[s.rows.length - 1]!;
  expect(last.balance.toString()).toBe('0');
  expect(s.totalPrincipal.plus(s.totalEarly).toString()).toBe(amount.toString());
  for (const row of s.rows) {
    expect(row.payment.equals(row.interest.plus(row.principal))).toBe(true);
    expect(row.principal.isNegative()).toBe(false);
    expect(row.payment.decimalPlaces()).toBeLessThanOrEqual(2);
  }
}

// Expected values come from scripts/crosscheck.py (independent Python Decimal implementation).
describe('annuity', () => {
  it('matches reference: 1 000 000 ₽, 12 %, 12 months', () => {
    const s = buildLoanSchedule(base());
    expect(s.firstPayment.toFixed(2)).toBe('88848.79');
    expect(s.lastPayment.toFixed(2)).toBe('88848.76');
    expect(s.totalInterest.toFixed(2)).toBe('66185.45');
    expectConsistent(s, new Dec(1_000_000));
  });

  it('matches reference: 3 000 000 ₽, 16.5 %, 240 months', () => {
    const s = buildLoanSchedule(
      base({ amount: new Dec(3_000_000), annualRate: new Dec('16.5'), termMonths: 240 }),
    );
    expect(s.firstPayment.toFixed(2)).toBe('42867.02');
    expect(s.lastPayment.toFixed(2)).toBe('42865.95');
    expect(s.totalInterest.toFixed(2)).toBe('7288083.73');
    expect(s.termMonths).toBe(240);
  });

  it('keeps every payment except the last equal', () => {
    const s = buildLoanSchedule(base({ termMonths: 60 }));
    const payments = new Set(s.rows.slice(0, -1).map((r) => r.payment.toString()));
    expect(payments.size).toBe(1);
  });

  it('handles zero rate without dividing by zero', () => {
    const s = buildLoanSchedule(
      base({ amount: new Dec(100_000), annualRate: new Dec(0), termMonths: 7 }),
    );
    expect(s.firstPayment.toFixed(2)).toBe('14285.71');
    expect(s.lastPayment.toFixed(2)).toBe('14285.74');
    expect(s.totalInterest.isZero()).toBe(true);
    expectConsistent(s, new Dec(100_000));
  });

  it('handles a 1-month term', () => {
    const s = buildLoanSchedule(base({ termMonths: 1 }));
    expect(s.rows).toHaveLength(1);
    expect(s.firstPayment.toFixed(2)).toBe('1010000.00');
  });

  it('annuityPayment formula', () => {
    expect(annuityPayment(new Dec(1_000_000), new Dec(12), 12).toFixed(2)).toBe('88848.79');
    expect(annuityPayment(new Dec(1200), new Dec(0), 12).toFixed(2)).toBe('100.00');
  });
});

describe('differentiated', () => {
  it('matches reference: 1 000 000 ₽, 12 %, 12 months', () => {
    const s = buildLoanSchedule(base({ paymentType: 'differentiated' }));
    expect(s.firstPayment.toFixed(2)).toBe('93333.33');
    expect(s.lastPayment.toFixed(2)).toBe('84166.70');
    // closed form: S × i × (n + 1) / 2
    expect(s.totalInterest.toFixed(2)).toBe('65000.00');
    expectConsistent(s, new Dec(1_000_000));
  });

  it('matches reference: 500 000 ₽, 9.9 %, 36 months', () => {
    const s = buildLoanSchedule(
      base({
        amount: new Dec(500_000),
        annualRate: new Dec('9.9'),
        termMonths: 36,
        paymentType: 'differentiated',
      }),
    );
    expect(s.firstPayment.toFixed(2)).toBe('18013.89');
    expect(s.lastPayment.toFixed(2)).toBe('14003.43');
    expect(s.totalInterest.toFixed(2)).toBe('76312.50');
  });

  it('payments decrease monotonically', () => {
    const s = buildLoanSchedule(base({ paymentType: 'differentiated', termMonths: 24 }));
    for (let k = 1; k < s.rows.length - 1; k++) {
      expect(s.rows[k]!.payment.lt(s.rows[k - 1]!.payment)).toBe(true);
    }
  });

  it('costs less interest than annuity for the same loan', () => {
    const a = buildLoanSchedule(base({ termMonths: 120 }));
    const d = buildLoanSchedule(base({ termMonths: 120, paymentType: 'differentiated' }));
    expect(d.totalInterest.lt(a.totalInterest)).toBe(true);
  });
});

describe('daily interest mode', () => {
  it('splits a period crossing into a leap year', () => {
    // 1 000 000 × 12 % × (16/365 + 15/366)
    expect(
      dailyInterest(new Dec(1_000_000), new Dec(12), '2023-12-15', '2024-01-15').toFixed(2),
    ).toBe('10178.31');
  });

  it('uses actual February length', () => {
    expect(
      dailyInterest(new Dec(365_000), new Dec(10), '2025-02-01', '2025-03-01').toFixed(2),
    ).toBe('2800.00');
  });

  it('matches reference schedule', () => {
    const s = buildLoanSchedule(base({ interestMode: 'daily', startDate: '2023-12-15' }));
    expect(s.firstPayment.toFixed(2)).toBe('88848.79');
    expect(s.lastPayment.toFixed(2)).toBe('88895.58');
    expect(s.totalInterest.toFixed(2)).toBe('66232.27');
    expectConsistent(s, new Dec(1_000_000));
  });

  it('never grows the debt when interest exceeds the annuity', () => {
    const s = buildLoanSchedule(
      base({
        annualRate: new Dec(100),
        termMonths: 600,
        interestMode: 'daily',
        startDate: '2025-01-01',
      }),
    );
    expectConsistent(s, new Dec(1_000_000));
    expect(s.rows.some((r) => r.principal.isZero())).toBe(true);
  });
});

describe('early repayment', () => {
  const amount = new Dec(1_000_000);

  it('reduce term: keeps the payment and shortens the loan', () => {
    const fx = earlyRepaymentEffect(
      base({
        termMonths: 60,
        earlyRepayments: [
          { kind: 'once', month: 6, amount: new Dec(300_000), strategy: 'reduceTerm' },
        ],
      }),
    );
    expect(fx.monthsSaved).toBeGreaterThan(0);
    expect(fx.interestSaved.gt(0)).toBe(true);
    const payments = new Set(fx.withEarly.rows.slice(0, -1).map((r) => r.payment.toString()));
    expect(payments.size).toBe(1);
    expectConsistent(fx.withEarly, amount);
  });

  it('reduce term: final payment is not inflated by a mis-estimated term', () => {
    const s = buildLoanSchedule(
      base({
        termMonths: 60,
        earlyRepayments: [
          { kind: 'once', month: 6, amount: new Dec(300_000), strategy: 'reduceTerm' },
        ],
      }),
    );
    expect(s.lastPayment.lte(s.firstPayment)).toBe(true);
  });

  it('reduce payment: keeps the term and lowers the payment', () => {
    const fx = earlyRepaymentEffect(
      base({
        termMonths: 60,
        earlyRepayments: [
          { kind: 'once', month: 6, amount: new Dec(300_000), strategy: 'reducePayment' },
        ],
      }),
    );
    expect(fx.monthsSaved).toBe(0);
    expect(fx.withEarly.rows[6]!.payment.lt(fx.withEarly.rows[5]!.payment)).toBe(true);
    expect(fx.interestSaved.gt(0)).toBe(true);
    expectConsistent(fx.withEarly, amount);
  });

  it('reduce term saves more interest than reduce payment', () => {
    const repay = (strategy: 'reduceTerm' | 'reducePayment') =>
      earlyRepaymentEffect(
        base({
          termMonths: 120,
          earlyRepayments: [{ kind: 'once', month: 12, amount: new Dec(200_000), strategy }],
        }),
      ).interestSaved;
    expect(repay('reduceTerm').gt(repay('reducePayment'))).toBe(true);
  });

  it.each(['reduceTerm', 'reducePayment'] as const)('differentiated + %s', (strategy) => {
    const fx = earlyRepaymentEffect(
      base({
        termMonths: 36,
        paymentType: 'differentiated',
        earlyRepayments: [{ kind: 'once', month: 3, amount: new Dec(250_000), strategy }],
      }),
    );
    expect(fx.interestSaved.gt(0)).toBe(true);
    expect(fx.monthsSaved > 0).toBe(strategy === 'reduceTerm');
    expectConsistent(fx.withEarly, amount);
  });

  it('regular monthly repayments', () => {
    const fx = earlyRepaymentEffect(
      base({
        termMonths: 120,
        earlyRepayments: [
          { kind: 'monthly', month: 1, amount: new Dec(10_000), strategy: 'reduceTerm' },
        ],
      }),
    );
    expect(fx.withEarly.rows.filter((r) => r.earlyRepayment.gt(0)).length).toBeGreaterThan(10);
    expect(fx.monthsSaved).toBeGreaterThan(40);
    expectConsistent(fx.withEarly, amount);
  });

  it('repayment larger than the balance closes the loan', () => {
    const s = buildLoanSchedule(
      base({
        earlyRepayments: [
          { kind: 'once', month: 3, amount: new Dec(5_000_000), strategy: 'reduceTerm' },
        ],
      }),
    );
    expect(s.termMonths).toBe(3);
    expect(s.totalEarly.plus(sum(s.rows.map((r) => r.principal))).toString()).toBe('1000000');
    expectConsistent(s, amount);
  });

  it('repayment in the last month is ignored (nothing left to prepay)', () => {
    const s = buildLoanSchedule(
      base({
        earlyRepayments: [
          { kind: 'once', month: 12, amount: new Dec(1000), strategy: 'reduceTerm' },
        ],
      }),
    );
    expect(s.totalEarly.isZero()).toBe(true);
  });

  it('mixed strategies on one date prefer reduce payment', () => {
    const s = buildLoanSchedule(
      base({
        termMonths: 24,
        earlyRepayments: [
          { kind: 'once', month: 2, amount: new Dec(50_000), strategy: 'reduceTerm' },
          { kind: 'once', month: 2, amount: new Dec(50_000), strategy: 'reducePayment' },
        ],
      }),
    );
    expect(s.termMonths).toBe(24);
    expect(s.rows[1]!.earlyRepayment.toString()).toBe('100000');
  });

  it('zero-rate loan with reduce term', () => {
    const s = buildLoanSchedule(
      base({
        annualRate: new Dec(0),
        termMonths: 10,
        earlyRepayments: [
          { kind: 'once', month: 2, amount: new Dec(300_000), strategy: 'reduceTerm' },
        ],
      }),
    );
    expect(s.termMonths).toBe(7);
    expectConsistent(s, amount);
  });
});

describe('invariants over a parameter grid', () => {
  const amounts = ['1', '999.99', '150000', '7654321.09', '1000000000'];
  const rates = ['0', '0.01', '5.5', '19.99', '100'];
  const terms = [1, 2, 13, 61, 360, 600];

  it('balance always ends at exactly 0.00 and principal sums to the loan', () => {
    for (const a of amounts)
      for (const r of rates)
        for (const n of terms)
          for (const paymentType of ['annuity', 'differentiated'] as const)
            for (const interestMode of ['monthly', 'daily'] as const) {
              const amount = new Dec(a);
              const s = buildLoanSchedule(
                base({ amount, annualRate: new Dec(r), termMonths: n, paymentType, interestMode }),
              );
              expect(s.rows[s.rows.length - 1]!.balance.isZero()).toBe(true);
              expect(s.totalPrincipal.equals(amount)).toBe(true);
              expect(s.termMonths).toBeLessThanOrEqual(n);
            }
  });
});
