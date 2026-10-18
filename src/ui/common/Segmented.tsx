import { useId } from 'react';
import { BodyM, SegmentGroup, SegmentItem, SegmentProvider } from '@salutejs/plasma-web/css';

interface SegmentedProps<T extends string> {
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
}

export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: SegmentedProps<T>) {
  const labelId = useId();
  return (
    <div className="field">
      <BodyM id={labelId}>{label}</BodyM>
      <SegmentProvider
        selected={[value]}
        singleSelectedRequired
        onChangeSelected={(selected) => onChange(selected as T)}
      >
        {/* Plasma's CSS build forwards filledBackground to the DOM: a harmless dev-only React warning. */}
        <SegmentGroup
          size="m"
          view="filled"
          filledBackground
          stretch
          role="group"
          aria-labelledby={labelId}
        >
          {options.map((o) => (
            <SegmentItem
              key={o.value}
              value={o.value}
              label={o.label}
              size="m"
              view="default"
              aria-pressed={o.value === value}
            />
          ))}
        </SegmentGroup>
      </SegmentProvider>
    </div>
  );
}
