import { Dec, parseDecimal, roundMoney, sum } from './money';

describe('roundMoney', () => {
  it.each([
    ['1.005', '1.01'],
    ['1.004999', '1'],
    ['2.675', '2.68'], // classic float trap: 2.675 is 2.67499999… as a double
    ['-1.005', '-1.01'],
  ])('%s → %s', (input, expected) => {
    expect(roundMoney(new Dec(input)).toString()).toBe(expected);
  });

  it('avoids float accumulation errors', () => {
    expect(sum(Array.from({ length: 10 }, () => new Dec('0.1'))).toString()).toBe('1');
  });
});

describe('parseDecimal', () => {
  it.each([
    ['1 000 000', '1000000'],
    ['1 000,50', '1000.5'],
    ['-5', '-5'],
    ['12.5', '12.5'],
  ])('parses %j', (input, expected) => {
    expect(parseDecimal(input)?.toString()).toBe(expected);
  });

  it.each(['', 'abc', '1e5', '1,2,3', '.5', '5.'])('rejects %j', (input) => {
    expect(parseDecimal(input)).toBeNull();
  });
});
