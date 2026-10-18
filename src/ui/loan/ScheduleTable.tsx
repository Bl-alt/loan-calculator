import { Button } from '@salutejs/plasma-web/css';
import { useState } from 'react';
import type { LoanSchedule } from '../../core';
import { EmptyRow } from '../common/EmptyRow';
import { formatDate, formatMoney, formatMoneyOrEmpty, plural } from '../common/format';

const PREVIEW_ROWS = 12;

/** schedule is null while the form is not filled in: the table keeps its columns with dashes. */
export function ScheduleTable({ schedule }: { schedule: LoanSchedule | null }) {
  const [expanded, setExpanded] = useState(false);
  const hasEarly = Boolean(schedule?.totalEarly.gt(0));
  const allRows = schedule?.rows ?? [];
  const rows = expanded ? allRows : allRows.slice(0, PREVIEW_ROWS);
  const columns = hasEarly ? 7 : 6;

  return (
    <div className="panel">
      <h2 className="typo-h4 panel-heading">График платежей</h2>
      <div className="table-scroll">
        <table className="schedule">
          <thead>
            <tr>
              <th scope="col">№</th>
              <th scope="col">Дата</th>
              <th scope="col">Платёж</th>
              <th scope="col">Проценты</th>
              <th scope="col">Основной долг</th>
              {hasEarly && <th scope="col">Досрочно</th>}
              <th scope="col">Остаток</th>
            </tr>
          </thead>
          <tbody>
            {!schedule && <EmptyRow columns={columns} />}
            {rows.map((r) => (
              <tr key={r.index}>
                <td>{r.index}</td>
                <td>{formatDate(r.date)}</td>
                <td>{formatMoney(r.payment)}</td>
                <td>{formatMoney(r.interest)}</td>
                <td>{formatMoney(r.principal)}</td>
                {hasEarly && (
                  <td>{r.earlyRepayment.gt(0) ? formatMoney(r.earlyRepayment) : '—'}</td>
                )}
                <td>{formatMoney(r.balance)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row" colSpan={2}>
                Итого
              </th>
              <td>{formatMoneyOrEmpty(schedule?.totalInterest.plus(schedule.totalPrincipal))}</td>
              <td>{formatMoneyOrEmpty(schedule?.totalInterest)}</td>
              <td>{formatMoneyOrEmpty(schedule?.totalPrincipal)}</td>
              {hasEarly && <td>{formatMoneyOrEmpty(schedule?.totalEarly)}</td>}
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
      {allRows.length > PREVIEW_ROWS && (
        <Button
          className="more-button"
          view="secondary"
          size="s"
          text={
            expanded
              ? 'Свернуть'
              : `Показать все: ${plural(allRows.length, ['платёж', 'платежа', 'платежей'])}`
          }
          onClick={() => setExpanded((v) => !v)}
        />
      )}
    </div>
  );
}
