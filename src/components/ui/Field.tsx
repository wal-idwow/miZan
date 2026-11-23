// miZan — Accessible Form Field Wrapper
import { useId, type ReactNode } from 'react';

interface FieldProps {
  label: string;
  hint?: string;
  children: (props: { id: string; ariaDescribedBy?: string }) => ReactNode;
}

export function Field({ label, hint, children }: FieldProps) {
  const inputId = useId();
  const hintId = useId();
  const ariaDescribedBy = hint ? hintId : undefined;

  return (
    <div>
      <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      {children({ id: inputId, ariaDescribedBy })}
      {hint ? (
        <p id={hintId} className="text-xs text-gray-400 mt-1">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
