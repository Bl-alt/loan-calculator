import { useId } from 'react';
import { BodyM, Radiobox } from '@salutejs/plasma-web/css';

interface RadioChoiceProps<T extends string> {
  label: string;
  value: T;
  options: readonly { value: T; label: string; description: string }[];
  onChange: (value: T) => void;
}

/** Radio list for options whose names are too long for a segmented control. */
export function RadioChoice<T extends string>({
  label,
  value,
  options,
  onChange,
}: RadioChoiceProps<T>) {
  const id = useId();
  return (
    <div className="field" role="radiogroup" aria-labelledby={`${id}-label`}>
      <BodyM id={`${id}-label`}>{label}</BodyM>
      <div className="radio-list">
        {options.map((o) => (
          <Radiobox
            key={o.value}
            name={id}
            value={o.value}
            size="m"
            label={o.label}
            description={o.description}
            checked={o.value === value}
            onChange={() => onChange(o.value)}
          />
        ))}
      </div>
    </div>
  );
}
