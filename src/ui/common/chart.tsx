/** Legend labels use the text color; the colored marker next to them carries series identity. */
export function legendText(value: string) {
  return <span style={{ color: 'var(--text-secondary)' }}>{value}</span>;
}
