import type { EarlyRepaymentInput, FieldErrors } from '../../core';
import { Button, IconButton, TextM, TextS } from '@salutejs/plasma-web/css';
import { IconPlus, IconTrashOutline } from '@salutejs/plasma-icons/24';
import { Field } from '../common/Field';
import { Segmented } from '../common/Segmented';

interface Props {
  items: EarlyRepaymentInput[];
  errors: FieldErrors;
  onChange: (items: EarlyRepaymentInput[]) => void;
}

const NEW_ITEM: EarlyRepaymentInput = {
  kind: 'once',
  month: '',
  amount: '',
  strategy: 'reduceTerm',
};

export function EarlyRepaymentsEditor({ items, errors, onChange }: Props) {
  const update = (idx: number, patch: Partial<EarlyRepaymentInput>) =>
    onChange(items.map((item, i) => (i === idx ? { ...item, ...patch } : item)));

  return (
    <div className="early">
      <h2 className="typo-h5">Досрочные погашения</h2>
      {items.length === 0 && (
        <TextS color="var(--text-secondary)">
          Добавьте разовый или ежемесячный платёж сверх графика и посмотрите, сколько сэкономите.
        </TextS>
      )}
      {items.map((item, idx) => (
        <fieldset className="early-item" key={idx}>
          <legend className="early-item-head">
            <TextM bold>Погашение {idx + 1}</TextM>
          </legend>
          <IconButton
            className="early-item-remove"
            view="clear"
            size="s"
            aria-label={`Удалить погашение ${idx + 1}`}
            onClick={() => onChange(items.filter((_, i) => i !== idx))}
          >
            <IconTrashOutline color="inherit" size="xs" />
          </IconButton>
          <Segmented
            label="Периодичность"
            value={item.kind}
            onChange={(kind) => update(idx, { kind })}
            options={[
              { value: 'once', label: 'Разово' },
              { value: 'monthly', label: 'Ежемесячно' },
            ]}
          />
          <div className="row-2 row-2-equal">
            <Field
              label={item.kind === 'once' ? 'В платёж №' : 'С платежа №'}
              inputMode="numeric"
              value={item.month}
              onChange={(month) => update(idx, { month })}
              error={errors[`early.${idx}.month`]}
            />
            <Field
              label="Сумма"
              value={item.amount}
              onChange={(amount) => update(idx, { amount })}
              error={errors[`early.${idx}.amount`]}
              suffix="₽"
            />
          </div>
          <Segmented
            label="Что уменьшить"
            value={item.strategy}
            onChange={(strategy) => update(idx, { strategy })}
            options={[
              { value: 'reduceTerm', label: 'Срок' },
              { value: 'reducePayment', label: 'Платёж' },
            ]}
          />
        </fieldset>
      ))}
      <Button
        view="secondary"
        size="m"
        stretch
        contentLeft={<IconPlus color="inherit" size="xs" />}
        text="Добавить досрочное погашение"
        onClick={() => onChange([...items, NEW_ITEM])}
      />
    </div>
  );
}
