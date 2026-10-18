import { Button } from '@salutejs/plasma-web/css';
import { useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { sum, type DepositResult } from '../../core';
import { EmptyChart } from '../common/EmptyChart';
import { EmptyRow } from '../common/EmptyRow';
import {
  EMPTY,
  formatDate,
  formatMoney,
  formatMoneyOrEmpty,
  pluralMonths,
  formatMoneyShort,
  formatPercent,
} from '../common/format';
import { legendText } from '../common/chart';
import { Stat } from '../common/Stat';

const PREVIEW_ROWS = 12;
const moneyTooltip = new Intl.NumberFormat('ru-RU', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function DepositResults({
  result,
  capitalization,
}: {
  /** null while the form is not filled in: blocks stay in place with dashes. */
  result: DepositResult | null;
  capitalization: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const allRows = result?.rows ?? [];
  const rows = expanded ? allRows : allRows.slice(0, PREVIEW_ROWS);
  const chartLabel = 'График роста вклада: внесённые деньги и начисленные проценты';

  const data = growthData(result);

  return (
    <>
      <div className="panel">
        <div className="stats" aria-live="polite">
          <Stat accent label="В конце срока" value={formatMoneyOrEmpty(result?.finalAmount)} />
          <Stat label="Доход" value={formatMoneyOrEmpty(result?.totalInterest)} />
          <Stat label="Внесено" value={formatMoneyOrEmpty(result?.totalContributed)} />
          <Stat
            label="Доходность"
            value={
              result
                ? formatPercent(result.totalInterest.div(result.totalContributed).times(100))
                : EMPTY
            }
            hint="доход / внесено"
          />
        </div>
      </div>
      <div className="panel">
        <h2 className="typo-h4 panel-heading">Рост вклада</h2>
        {data.length === 0 ? (
          <EmptyChart label={chartLabel} />
        ) : (
          <div className="chart" role="img" aria-label={chartLabel}>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
                <CartesianGrid stroke="var(--grid)" vertical={false} />
                <XAxis
                  dataKey="month"
                  stroke="var(--text-muted)"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  minTickGap={24}
                />
                <YAxis
                  stroke="var(--text-muted)"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  width={68}
                  tickFormatter={formatMoneyShort}
                />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    `${moneyTooltip.format(value)} ₽`,
                    name,
                  ]}
                  labelFormatter={(m) => `Месяц ${m}`}
                  contentStyle={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    color: 'var(--text)',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 13 }} formatter={legendText} />
                <Area
                  type="monotone"
                  dataKey="contributed"
                  name="Внесено"
                  stackId="1"
                  stroke="var(--series-1)"
                  fill="var(--series-1)"
                  fillOpacity={0.25}
                  strokeWidth={2}
                  isAnimationActive={false}
                />
                <Area
                  type="monotone"
                  dataKey="interest"
                  name="Проценты"
                  stackId="1"
                  stroke="var(--series-2)"
                  fill="var(--series-2)"
                  fillOpacity={0.25}
                  strokeWidth={2}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
      <div className="panel">
        <h2 className="typo-h4 panel-heading">Начисления по месяцам</h2>
        <div className="table-scroll">
          <table className="schedule">
            <thead>
              <tr>
                <th scope="col">№</th>
                <th scope="col">Дата</th>
                <th scope="col">Проценты</th>
                <th scope="col">Пополнение</th>
                <th scope="col">На вкладе</th>
                {!capitalization && <th scope="col">Выплачено процентов</th>}
              </tr>
            </thead>
            <tbody>
              {!result && <EmptyRow columns={capitalization ? 5 : 6} />}
              {rows.map((r) => (
                <tr key={r.index}>
                  <td>{r.index}</td>
                  <td>{formatDate(r.date)}</td>
                  <td>{formatMoney(r.interest)}</td>
                  <td>{r.topUp.gt(0) ? formatMoney(r.topUp) : '—'}</td>
                  <td>{formatMoney(r.balance)}</td>
                  {!capitalization && <td>{formatMoney(r.paidOut)}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {allRows.length > PREVIEW_ROWS && (
          <Button
            className="more-button"
            view="secondary"
            size="s"
            text={expanded ? 'Свернуть' : `Показать все: ${pluralMonths(allRows.length)}`}
            onClick={() => setExpanded((v) => !v)}
          />
        )}
      </div>
    </>
  );
}

/** Display-only chart points: money deposited so far vs interest earned so far. */
function growthData(result: DepositResult | null) {
  if (!result) return [];
  let contributed = result.totalContributed.minus(sum(result.rows.map((r) => r.topUp)));
  return result.rows.map((r) => {
    contributed = contributed.plus(r.topUp);
    const total = r.balance.plus(r.paidOut);
    return {
      month: r.index,
      contributed: contributed.toNumber(),
      interest: total.minus(contributed).toNumber(),
    };
  });
}
