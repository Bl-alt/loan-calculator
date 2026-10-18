import { EMPTY } from './format';

/** One row of dashes so an empty table keeps its shape. */
export function EmptyRow({ columns }: { columns: number }) {
  return (
    <tr className="empty-row">
      {Array.from({ length: columns }, (_, i) => (
        <td key={i}>{EMPTY}</td>
      ))}
    </tr>
  );
}
