import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { LoanSchedule } from '../../core';
import { formatMoney, formatMoneyOrEmpty, formatMoneyShort } from '../common/format';
import { EmptyChart } from '../common/EmptyChart';
import { legendText } from '../common/chart';

interface Props {
  /** null while the form is not filled in: the table shows dashes and the chart is empty. */
  annuity: LoanSchedule | null;
  differentiated: LoanSchedule | null;
}

const moneyTooltip = new Intl.NumberFormat('ru-RU', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function Comparison({ annuity, differentiated }: Props) {
  // Chart points are display-only, so converting to number here is safe.
  const data =
    annuity?.rows.map((row, idx) => ({
      month: row.index,
      annuity: row.payment.toNumber(),
      differentiated: differentiated?.rows[idx]?.payment.toNumber(),
    })) ?? [];
  const diff =
    annuity && differentiated ? annuity.totalInterest.minus(differentiated.totalInterest) : null;
  const chartLabel = 'График ежемесячного платежа по месяцам для двух схем';

  return (
    <div className="panel">
      <h2 className="typo-h4 panel-heading">Аннуитет или дифференцированный</h2>
      <div className="table-scroll">
        <table className="compare">
          <thead>
            <tr>
              <th scope="col"></th>
              <th scope="col">
                <span className="swatch" style={{ background: 'var(--series-1)' }} /> Аннуитетный
              </th>
              <th scope="col">
                <span className="swatch" style={{ background: 'var(--series-2)' }} />{' '}
                Дифференцированный
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Первый платёж</th>
              <td>{formatMoneyOrEmpty(annuity?.firstPayment)}</td>
              <td>{formatMoneyOrEmpty(differentiated?.firstPayment)}</td>
            </tr>
            <tr>
              <th scope="row">Последний платёж</th>
              <td>{formatMoneyOrEmpty(annuity?.lastPayment)}</td>
              <td>{formatMoneyOrEmpty(differentiated?.lastPayment)}</td>
            </tr>
            <tr>
              <th scope="row">Переплата</th>
              <td>{formatMoneyOrEmpty(annuity?.totalInterest)}</td>
              <td>{formatMoneyOrEmpty(differentiated?.totalInterest)}</td>
            </tr>
            <tr>
              <th scope="row">Всего выплат</th>
              <td>{formatMoneyOrEmpty(annuity?.totalPaid)}</td>
              <td>{formatMoneyOrEmpty(differentiated?.totalPaid)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      {diff && (
        <p className="compare-note">
          {diff.gt(0) ? (
            <>
              Дифференцированная схема дешевле на <strong>{formatMoney(diff)}</strong>, но первые
              платежи выше.
            </>
          ) : (
            <>При нулевой ставке переплаты нет ни в одной схеме.</>
          )}
        </p>
      )}
      {data.length === 0 ? (
        <EmptyChart label={chartLabel} />
      ) : (
        <div className="chart" role="img" aria-label={chartLabel}>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
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
                domain={['auto', 'auto']}
              />
              <Tooltip
                formatter={(value: number, name: string) => [
                  `${moneyTooltip.format(value)} ₽`,
                  name,
                ]}
                labelFormatter={(m) => `Платёж № ${m}`}
                contentStyle={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  color: 'var(--text)',
                }}
              />
              <Legend wrapperStyle={{ fontSize: 13 }} formatter={legendText} />
              <Line
                type="monotone"
                dataKey="annuity"
                name="Аннуитетный"
                stroke="var(--series-1)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="differentiated"
                name="Дифференцированный"
                stroke="var(--series-2)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
