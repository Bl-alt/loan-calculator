import { TextField } from '@salutejs/plasma-web/css';

interface FieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  suffix?: string;
  inputMode?: 'decimal' | 'numeric';
  type?: 'text' | 'date';
  placeholder?: string;
}

/** Plasma TextField that keeps the raw string; parsing and validation happen in core/validation. */
export function Field({
  label,
  value,
  onChange,
  error,
  suffix,
  inputMode = 'decimal',
  type = 'text',
  placeholder,
}: FieldProps) {
  return (
    <TextField
      size="m"
      labelPlacement="outer"
      label={label}
      type={type}
      inputMode={type === 'text' ? inputMode : undefined}
      value={value}
      placeholder={placeholder}
      textAfter={suffix}
      status={error ? 'error' : undefined}
      helperText={error}
      aria-invalid={Boolean(error)}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
    />
  );
}
