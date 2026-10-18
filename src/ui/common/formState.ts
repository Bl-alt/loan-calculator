import type { FieldErrors } from '../../core';

export function isBlank(value: string): boolean {
  return value.trim() === '';
}

/**
 * Drops errors for fields the user has not filled in yet: an empty form should not be red.
 * The calculation still needs those fields, so the caller shows a "fill in" hint instead.
 * Only fields listed in `values` can be hidden; errors of other fields always stay.
 */
export function hideBlankFieldErrors(
  errors: FieldErrors,
  values: Record<string, string>,
): FieldErrors {
  return Object.fromEntries(
    Object.entries(errors).filter(([field]) => {
      const value = values[field];
      return value === undefined || !isBlank(value);
    }),
  );
}

/**
 * Early-repayment errors are keyed by position in the list that was validated ("early.0.amount").
 * When untouched rows are skipped, map those positions back to the rows on screen.
 */
export function remapEarlyErrors(
  errors: FieldErrors,
  screenIndexes: readonly number[],
): FieldErrors {
  return Object.fromEntries(
    Object.entries(errors).map(([field, message]) => {
      const match = /^early\.(\d+)\.(.+)$/.exec(field);
      if (!match) return [field, message];
      const screenIndex = screenIndexes[Number(match[1])];
      return [`early.${screenIndex}.${match[2]}`, message];
    }),
  );
}
