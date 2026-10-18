import { addMonths, daysBetween, daysInYear, isValidIsoDate, splitByYear } from './dates';

describe('addMonths', () => {
  it('clamps to the end of a short month', () => {
    expect(addMonths('2025-01-31', 1)).toBe('2025-02-28');
    expect(addMonths('2024-01-31', 1)).toBe('2024-02-29');
  });

  it('counts from the original day, not from the clamped one', () => {
    expect(addMonths('2025-01-31', 2)).toBe('2025-03-31');
  });

  it('crosses year boundaries', () => {
    expect(addMonths('2025-11-15', 3)).toBe('2026-02-15');
    expect(addMonths('2024-02-29', 12)).toBe('2025-02-28');
  });
});

describe('days', () => {
  it('knows leap years', () => {
    expect(daysInYear(2024)).toBe(366);
    expect(daysInYear(2025)).toBe(365);
    expect(daysInYear(1900)).toBe(365);
    expect(daysInYear(2000)).toBe(366);
  });

  it('counts days without DST drift', () => {
    expect(daysBetween('2025-03-01', '2025-04-01')).toBe(31);
    expect(daysBetween('2024-02-01', '2024-03-01')).toBe(29);
  });

  it('splits a period by calendar years', () => {
    expect(splitByYear('2023-12-15', '2024-01-15')).toEqual([
      { days: 16, yearDays: 365 },
      { days: 15, yearDays: 366 },
    ]);
    expect(splitByYear('2025-03-15', '2025-04-15')).toEqual([{ days: 31, yearDays: 365 }]);
  });

  it('validates ISO dates', () => {
    expect(isValidIsoDate('2025-02-28')).toBe(true);
    expect(isValidIsoDate('2025-02-30')).toBe(false);
    expect(isValidIsoDate('15.01.2025')).toBe(false);
  });
});
