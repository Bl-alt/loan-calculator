import { hideBlankFieldErrors, isBlank, remapEarlyErrors } from './formState';

describe('formState', () => {
  it('treats whitespace as blank', () => {
    expect(isBlank('  ')).toBe(true);
    expect(isBlank('0')).toBe(false);
  });

  it('hides errors only for blank fields', () => {
    const errors = { amount: 'Введите число', annualRate: 'Ставка от 0 до 100 %' };
    expect(hideBlankFieldErrors(errors, { amount: '', annualRate: '150' })).toEqual({
      annualRate: 'Ставка от 0 до 100 %',
    });
  });

  it('never hides errors of fields that were not passed', () => {
    expect(hideBlankFieldErrors({ monthlyTopUp: 'От 0 до 1 000 000 000 ₽' }, {})).toEqual({
      monthlyTopUp: 'От 0 до 1 000 000 000 ₽',
    });
  });

  it('maps early-repayment errors back to on-screen rows', () => {
    const errors = { amount: 'x', 'early.0.amount': 'a', 'early.1.month': 'b' };
    expect(remapEarlyErrors(errors, [1, 3])).toEqual({
      amount: 'x',
      'early.1.amount': 'a',
      'early.3.month': 'b',
    });
  });
});
