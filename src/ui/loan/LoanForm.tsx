import type { Dispatch, SetStateAction } from 'react';
import { TextS } from '@salutejs/plasma-web/css';
import type { FieldErrors } from '../../core';
import { Field } from '../common/Field';
import { RadioChoice } from '../common/RadioChoice';
import { Segmented } from '../common/Segmented';
import type { LoanFormState } from './LoanCalculator';

interface Props {
  form: LoanFormState;
  errors: FieldErrors;
  onChange: Dispatch<SetStateAction<LoanFormState>>;
}

export function LoanForm({ form, errors, onChange }: Props) {
  const set =
    <K extends keyof LoanFormState>(key: K) =>
    (value: LoanFormState[K]) =>
      onChange((f) => ({ ...f, [key]: value }));

  return (
    <div className="form">
      <Field
        label="Сумма кредита"
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
        <Field label="Срок" value={form.term} onChange={set('term')} error={errors.termMonths} />
        <Segmented
          label="Единицы срока"
          value={form.termUnit}
          onChange={set('termUnit')}
          options={[
            { value: 'years', label: 'лет' },
            { value: 'months', label: 'мес.' },
          ]}
        />
      </div>
      <Field
        label="Дата выдачи"
        type="date"
        value={form.startDate}
        onChange={set('startDate')}
        error={errors.startDate}
      />
      <RadioChoice
        label="Тип платежа"
        value={form.paymentType}
        onChange={set('paymentType')}
        options={[
          { value: 'annuity', label: 'Аннуитетный', description: 'Платёж одинаковый каждый месяц' },
          {
            value: 'differentiated',
            label: 'Дифференцированный',
            description: 'Платёж уменьшается, переплата меньше',
          },
        ]}
      />
      <Segmented
        label="Начисление процентов"
        value={form.interestMode}
        onChange={set('interestMode')}
        options={[
          { value: 'monthly', label: 'По месяцам' },
          { value: 'daily', label: 'По дням' },
        ]}
      />
      <TextS as="p" className="hint">
        {form.interestMode === 'daily'
          ? 'Проценты = остаток × ставка × дни / 365 (366 в високосный год), как в договорах банков.'
          : 'Проценты = остаток × ставка / 12: упрощённый режим, каждый месяц одинаковой длины.'}
      </TextS>
    </div>
  );
}
