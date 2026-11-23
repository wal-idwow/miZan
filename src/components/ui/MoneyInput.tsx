// miZan — Ergonomic Currency Input (supports clearing and Arabic-Indic numerals)
import { useState } from 'react';
import { parseMoneyInput } from '../../utils/format';

interface MoneyInputProps {
  id?: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  allowNegative?: boolean;
  placeholder?: string;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  className?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  required?: boolean;
}

export function MoneyInput({
  id,
  value,
  onChange,
  min,
  max,
  allowNegative = false,
  placeholder,
  ariaLabel,
  ariaDescribedBy,
  className = '',
  autoFocus = false,
  disabled = false,
  required = false,
}: MoneyInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [draft, setDraft] = useState('');

  const fallbackMin = min ?? (allowNegative ? -1_000_000_000 : 0);
  const displayValue = isFocused ? draft : String(value);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    setDraft(value === 0 ? '' : String(value));
    const el = e.currentTarget;
    requestAnimationFrame(() => {
      if (document.activeElement === el) {
        el.select();
      }
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setDraft(raw);
    const parsed = parseMoneyInput(raw, { min, max, allowNegative });
    if (parsed !== null) {
      onChange(parsed);
    } else if (raw.trim() === '') {
      onChange(Math.max(fallbackMin, 0));
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    const parsed = parseMoneyInput(draft, { min, max, allowNegative });
    if (parsed !== null) {
      onChange(parsed);
    } else {
      onChange(Math.max(fallbackMin, 0));
    }
  };

  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      enterKeyHint="done"
      dir="ltr"
      value={displayValue}
      onFocus={handleFocus}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      autoFocus={autoFocus}
      disabled={disabled}
      required={required}
      className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent min-h-[44px] text-start ${className}`}
    />
  );
}
