/** Chart area with grid lines only, shown until there is data to plot. */
export function EmptyChart({ label }: { label: string }) {
  return <div className="chart chart-empty" role="img" aria-label={`${label}: нет данных`} />;
}
