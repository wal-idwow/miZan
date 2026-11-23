// miZan — Ergonomic Currency Input (supports clearing, Arabic-Indic numerals, and suffix adornment)
import { useState } from 'react';
import { darija } from '../../i18n/darija';
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
  inputClassName?: string;
  suffix?: string;
  size?: 'md' | 'lg';
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
  inputClassName = '',
  suffix = darija.common.currency,
  size = 'md',
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

  const sizeWrapperClass = size === 'lg' ? 'min-h-[56px] px-4' : 'min-h-[44px] px-3';
  const sizeInputClass = size === 'lg' ? 'text-2xl sm:text-3xl font-bold py-2.5' : 'text-base py-2';
  const alignClass = inputClassName.includes('text-center') ? '' : 'text-end';

  return (
    <div
      className={`flex items-center gap-2 w-full bg-card border border-line rounded-xl focus-within:ring-2 focus-within:ring-brand-600 focus-within:border-transparent transition-shadow ${sizeWrapperClass} ${
        disabled ? 'opacity-60 bg-surface' : ''
      } ${className}`}
    >
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
        className={`flex-1 min-w-0 bg-transparent outline-none tabular-nums text-ink-900 placeholder:text-ink-400 ${sizeInputClass} ${alignClass} ${inputClassName}`}
      />
      {suffix ? (
        <span className="text-xs font-medium text-ink-400 shrink-0 select-none">{suffix}</span>
      ) : null}
    </div>
  );
}
