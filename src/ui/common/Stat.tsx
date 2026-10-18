import type { ReactNode } from 'react';
import { TextS, TextXS } from '@salutejs/plasma-web/css';
import { EMPTY } from './format';

interface StatProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  accent?: boolean;
}

export function Stat({ label, value, hint, accent }: StatProps) {
  return (
    <div className="stat">
      <TextS color="var(--text-secondary)">{label}</TextS>
      {/* A value, not a heading: plain div styled with Plasma heading tokens. */}
      <div className={valueClass(Boolean(accent), value === EMPTY)}>{value}</div>
      {hint && <TextXS color="var(--text-tertiary)">{hint}</TextXS>}
    </div>
  );
}

function valueClass(accent: boolean, empty: boolean): string {
  if (!accent) return 'stat-value typo-h4';
  // A dash is not a result, so it stays neutral instead of accent green.
  return empty ? 'stat-value typo-h3' : 'stat-value typo-h3 stat-value-accent';
}
