// miZan — Bidi-safe Monetary Display Component
import { darija } from '../../i18n/darija';
import { formatNumber, formatSignedNumber } from '../../utils/format';

interface MoneyProps {
  amount: number;
  signed?: boolean;
  showCurrency?: boolean;
  className?: string;
}

export function Money({
  amount,
  signed = false,
  showCurrency = true,
  className = '',
}: MoneyProps) {
  const formatted = signed ? formatSignedNumber(amount) : formatNumber(amount);

  return (
    <span className={`inline-flex items-baseline gap-1 tabular-nums ${className}`}>
      <bdi dir="ltr">{formatted}</bdi>
      {showCurrency ? <span>{darija.common.currency}</span> : null}
    </span>
  );
}
