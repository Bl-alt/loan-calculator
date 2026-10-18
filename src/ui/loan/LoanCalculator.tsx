import { useMemo, useState } from 'react';
import {
  buildLoanSchedule,
  earlyRepaymentEffect,
  validateLoan,
  type EarlyRepaymentInput,
  type InterestMode,
  type PaymentType,
} from '../../core';

import { todayIso } from '../common/format';
import { hideBlankFieldErrors, isBlank, remapEarlyErrors } from '../common/formState';
import { termToMonths, type TermUnit } from '../common/term';
import { LoanForm } from './LoanForm';
import { LoanSummary } from './LoanSummary';
import { Comparison } from './Comparison';
import { ScheduleTable } from './ScheduleTable';
import { EarlyRepaymentsEditor } from './EarlyRepaymentsEditor';

export interface LoanFormState {
  amount: string;
  annualRate: string;
  term: string;
  termUnit: TermUnit;
  startDate: string;
  paymentType: PaymentType;
  interestMode: InterestMode;
  earlyRepayments: EarlyRepaymentInput[];
}

const INITIAL: LoanFormState = {
  amount: '',
  annualRate: '',
  term: '',
  termUnit: 'years',
  startDate: todayIso(),
  paymentType: 'annuity',
  interestMode: 'monthly',
  earlyRepayments: [],
};

export function LoanCalculator() {
  const [form, setForm] = useState<LoanFormState>(INITIAL);

  const calc = useMemo(() => {
    // Rows the user added but has not started filling are not part of the calculation yet.
    const started = form.earlyRepayments
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => !isBlank(item.month) || !isBlank(item.amount));
    const validation = validateLoan({
      ...form,
      termMonths: termToMonths(form.term, form.termUnit),
      earlyRepayments: started.map(({ item }) => item),
    });
    if (!validation.ok) {
      const errors = hideBlankFieldErrors(
        remapEarlyErrors(
          validation.errors,
          started.map(({ index }) => index),
        ),
        rawValues(form),
      );
      return { errors, result: null };
    }
    const params = validation.value;
    const noEarly = { ...params, earlyRepayments: [] };
    return {
      errors: {},
      result: {
        effect: earlyRepaymentEffect(params),
        annuity: buildLoanSchedule({ ...noEarly, paymentType: 'annuity' }),
        differentiated: buildLoanSchedule({ ...noEarly, paymentType: 'differentiated' }),
        paymentType: params.paymentType,
      },
    };
  }, [form]);

  const { errors, result } = calc;

  return (
    <div className="layout">
      <aside className="panel form-panel">
        <h1 className="typo-h2 panel-title">Кредит</h1>
        <LoanForm form={form} errors={errors} onChange={setForm} />
        <EarlyRepaymentsEditor
          items={form.earlyRepayments}
          errors={errors}
          onChange={(earlyRepayments) => setForm((f) => ({ ...f, earlyRepayments }))}
        />
      </aside>
      <section className="results">
        <LoanSummary effect={result?.effect ?? null} paymentType={form.paymentType} />
        <Comparison
          annuity={result?.annuity ?? null}
          differentiated={result?.differentiated ?? null}
        />
        <ScheduleTable schedule={result?.effect.withEarly ?? null} />
      </section>
    </div>
  );
}

/** Raw field values keyed like validation errors, to tell "not filled yet" from "wrong". */
function rawValues(form: LoanFormState): Record<string, string> {
  const values: Record<string, string> = {
    amount: form.amount,
    annualRate: form.annualRate,
    termMonths: form.term,
    startDate: form.startDate,
  };
  form.earlyRepayments.forEach((item, i) => {
    values[`early.${i}.month`] = item.month;
    values[`early.${i}.amount`] = item.amount;
  });
  return values;
}
