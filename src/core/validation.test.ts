import { validateDeposit, validateLoan, type DepositInput, type LoanInput } from './validation';

const loan = (overrides: Partial<LoanInput> = {}): LoanInput => ({
  amount: '1 000 000',
  annualRate: '12,5',
  termMonths: '60',
  startDate: '2025-01-15',
  paymentType: 'annuity',
  interestMode: 'monthly',
  earlyRepayments: [],
  ...overrides,
});

const deposit = (overrides: Partial<DepositInput> = {}): DepositInput => ({
  amount: '100000',
  annualRate: '10',
  termMonths: '12',
  startDate: '2025-01-15',
  capitalization: true,
  monthlyTopUp: '',
  ...overrides,
});

function errorsOf<T>(r: { ok: true; value: T } | { ok: false; errors: Record<string, string> }) {
  return r.ok ? {} : r.errors;
}

describe('validateLoan', () => {
  it('accepts valid input with Russian formatting', () => {
    const r = validateLoan(loan());
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.annualRate.toString()).toBe('12.5');
  });

  it.each([
    ['amount', '-5'],
    ['amount', '0'],
    ['amount', 'abc'],
    ['amount', '100.555'],
    ['amount', '2000000000'],
    ['annualRate', '-1'],
    ['annualRate', '101'],
    ['annualRate', ''],
    ['termMonths', '0'],
    ['termMonths', '1000'],
    ['termMonths', '12.5'],
    ['startDate', '2025-02-30'],
  ] as const)('rejects %s = %j', (field, value) => {
    expect(errorsOf(validateLoan(loan({ [field]: value })))).toHaveProperty(field);
  });

  it('accepts zero rate', () => {
    expect(validateLoan(loan({ annualRate: '0' })).ok).toBe(true);
  });

  it('validates early repayments against the term', () => {
    const r = validateLoan(
      loan({
        earlyRepayments: [
          { kind: 'once', month: '61', amount: '1000', strategy: 'reduceTerm' },
          { kind: 'once', month: '5', amount: '-1', strategy: 'reduceTerm' },
          { kind: 'monthly', month: '3', amount: '5000', strategy: 'reducePayment' },
        ],
      }),
    );
    expect(Object.keys(errorsOf(r)).sort()).toEqual(['early.0.month', 'early.1.amount']);
  });

  it('parses valid early repayments', () => {
    const r = validateLoan(
      loan({
        earlyRepayments: [
          { kind: 'monthly', month: '3', amount: '5 000', strategy: 'reducePayment' },
        ],
      }),
    );
    expect(r.ok && r.value.earlyRepayments?.[0]?.amount.toString()).toBe('5000');
  });
});

describe('validateDeposit', () => {
  it('accepts valid input, empty top-up means 0', () => {
    const r = validateDeposit(deposit());
    expect(r.ok && r.value.monthlyTopUp.isZero()).toBe(true);
  });

  it('rejects negative top-up and bad term', () => {
    expect(
      Object.keys(
        errorsOf(validateDeposit(deposit({ monthlyTopUp: '-1', termMonths: '0' }))),
      ).sort(),
    ).toEqual(['monthlyTopUp', 'termMonths']);
  });
});
