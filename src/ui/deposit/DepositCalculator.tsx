import { TextS } from '@salutejs/plasma-web/css';
import { useMemo, useState } from 'react';
import { buildDepositSchedule, validateDeposit } from '../../core';
import { hideBlankFieldErrors } from '../common/formState';
import { Field } from '../common/Field';
import { Segmented } from '../common/Segmented';
import { todayIso } from '../common/format';
import { termToMonths, type TermUnit } from '../common/term';
import { DepositResults } from './DepositResults';

interface DepositFormState {
  amount: string;
  annualRate: string;
  term: string;
  termUnit: TermUnit;
  startDate: string;
  capitalization: boolean;
  monthlyTopUp: string;
}

const INITIAL: DepositFormState = {
  amount: '',
  annualRate: '',
  term: '',
  termUnit: 'months',
  startDate: todayIso(),
  capitalization: true,
  monthlyTopUp: '',
};

export function DepositCalculator() {
  const [form, setForm] = useState<DepositFormState>(INITIAL);
  const set =
    <K extends keyof DepositFormState>(key: K) =>
    (value: DepositFormState[K]) =>
      setForm((f) => ({ ...f, [key]: value }));

  const calc = useMemo(() => {
    const v = validateDeposit({ ...form, termMonths: termToMonths(form.term, form.termUnit) });
    if (v.ok) return { errors: {}, result: buildDepositSchedule(v.value) };
    const errors = hideBlankFieldErrors(v.errors, {
      amount: form.amount,
      annualRate: form.annualRate,
      termMonths: form.term,
      startDate: form.startDate,
    });
    return { errors, result: null };
  }, [form]);
  const errors: Record<string, string | undefined> = calc.errors;

  return (
    <div className="layout">
      <aside className="panel form-panel">
        <h1 className="typo-h2 panel-title">Вклад</h1>
        <div className="form">
          <Field
            label="Сумма вклада"
            value={form.amount}
            onChange={set('amount')}
            error={errors.amount}
            suffix="₽"
          />
          <Field
            label="Ставка"
            value={form.annualRate}
            onChange={set('annualRate')}
            error={errors.annualRate}
            suffix="% год."
          />
          <div className="row-2">
            <Field
              label="Срок"
              value={form.term}
              onChange={set('term')}
              error={errors.termMonths}
            />
            <Segmented
              label="Единицы срока"
              value={form.termUnit}
              onChange={set('termUnit')}
              options={[
                { value: 'months', label: 'мес.' },
                { value: 'years', label: 'лет' },
              ]}
            />
          </div>
          <Field
            label="Дата открытия"
            type="date"
            value={form.startDate}
            onChange={set('startDate')}
            error={errors.startDate}
          />
          <Segmented
            label="Капитализация процентов"
            value={form.capitalization ? 'yes' : 'no'}
            onChange={(v) => set('capitalization')(v === 'yes')}
            options={[
              { value: 'yes', label: 'Ежемесячно' },
              { value: 'no', label: 'Нет' },
            ]}
          />
          <Field
            label="Ежемесячное пополнение"
            value={form.monthlyTopUp}
            onChange={set('monthlyTopUp')}
            error={errors.monthlyTopUp}
            suffix="₽"
          />
          <TextS as="p" className="hint">
            Пополнение вносится в конце месяца и начинает приносить проценты со следующего.
          </TextS>
        </div>
      </aside>
      <section className="results">
        <DepositResults result={calc.result} capitalization={form.capitalization} />
      </section>
    </div>
  );
}
