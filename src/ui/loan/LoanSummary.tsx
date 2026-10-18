import type { EarlyRepaymentEffect, PaymentType } from '../../core';
import { EMPTY, formatMoney, pluralMonths } from '../common/format';
import { Stat } from '../common/Stat';

interface Props {
  /** null while the form is not filled in: the cards stay in place with dashes. */
  effect: EarlyRepaymentEffect | null;
  paymentType: PaymentType;
}

export function LoanSummary({ effect, paymentType }: Props) {
  const s = effect?.withEarly;
  const hasEarly = Boolean(s?.totalEarly.gt(0));
  const singlePayment = paymentType === 'annuity' && !hasEarly;

  let paymentValue = EMPTY;
  if (s) {
    paymentValue = singlePayment
      ? formatMoney(s.firstPayment)
      : `${formatMoney(s.firstPayment)} → ${formatMoney(s.lastPayment)}`;
  }

  return (
    <div className="panel">
      <div className="stats" aria-live="polite">
        <Stat
          accent
          label={singlePayment ? 'Ежемесячный платёж' : 'Платёж: первый → последний'}
          value={paymentValue}
          hint={
            s && singlePayment && !s.lastPayment.equals(s.firstPayment)
              ? `последний: ${formatMoney(s.lastPayment)}`
              : undefined
          }
        />
        <Stat label="Переплата" value={s ? formatMoney(s.totalInterest) : EMPTY} />
        <Stat label="Всего выплат" value={s ? formatMoney(s.totalPaid) : EMPTY} />
        <Stat label="Срок" value={s ? pluralMonths(s.termMonths) : EMPTY} />
      </div>
      {effect && s && hasEarly && (
        <div className="savings">
          <Stat accent label="Экономия на процентах" value={formatMoney(effect.interestSaved)} />
          <Stat
            label="Срок сократился на"
            value={effect.monthsSaved > 0 ? pluralMonths(effect.monthsSaved) : 'не изменился'}
          />
          <Stat label="Внесено досрочно" value={formatMoney(s.totalEarly)} />
          <Stat label="Переплата без досрочных" value={formatMoney(effect.base.totalInterest)} />
        </div>
      )}
    </div>
  );
}
