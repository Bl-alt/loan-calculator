import type { Dec } from './money';
import type { IsoDate } from './dates';

export type PaymentType = 'annuity' | 'differentiated';

/** monthly: interest = balance × rate / 12; daily: balance × rate × days / (365|366). */
export type InterestMode = 'monthly' | 'daily';

export type EarlyRepaymentStrategy = 'reduceTerm' | 'reducePayment';

export interface EarlyRepayment {
  /** once: paid together with payment #month; monthly: every payment starting from #month. */
  kind: 'once' | 'monthly';
  month: number;
  amount: Dec;
  strategy: EarlyRepaymentStrategy;
}

export interface LoanParams {
  amount: Dec;
  /** Annual rate in percent, e.g. 12.5 */
  annualRate: Dec;
  termMonths: number;
  startDate: IsoDate;
  paymentType: PaymentType;
  interestMode: InterestMode;
  earlyRepayments?: readonly EarlyRepayment[];
}

export interface LoanRow {
  index: number;
  date: IsoDate;
  /** Scheduled payment = interest + principal (early repayment not included). */
  payment: Dec;
  interest: Dec;
  principal: Dec;
  earlyRepayment: Dec;
  /** Debt after this payment. */
  balance: Dec;
}

export interface LoanSchedule {
  rows: LoanRow[];
  totalInterest: Dec;
  totalPrincipal: Dec;
  totalEarly: Dec;
  /** Everything the borrower pays: scheduled payments + early repayments. */
  totalPaid: Dec;
  firstPayment: Dec;
  lastPayment: Dec;
  termMonths: number;
}

export interface EarlyRepaymentEffect {
  base: LoanSchedule;
  withEarly: LoanSchedule;
  interestSaved: Dec;
  monthsSaved: number;
}

export interface DepositParams {
  amount: Dec;
  annualRate: Dec;
  termMonths: number;
  startDate: IsoDate;
  capitalization: boolean;
  /** Added at the end of each month except the last; earns interest from the next month. */
  monthlyTopUp: Dec;
}

export interface DepositRow {
  index: number;
  date: IsoDate;
  interest: Dec;
  topUp: Dec;
  /** Money on the deposit after this month (includes capitalized interest). */
  balance: Dec;
  /** Interest paid out so far (only without capitalization). */
  paidOut: Dec;
}

export interface DepositResult {
  rows: DepositRow[];
  totalInterest: Dec;
  totalContributed: Dec;
  /** balance + paid out interest at the end of the term. */
  finalAmount: Dec;
}
