// miZan — RTL-safe formatting utilities
// All amounts in MAD (DH)

export function formatDH(amount: number): string {
  return new Intl.NumberFormat('ar-MA', {
    style: 'currency',
    currency: 'MAD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatSignedNumber(amount: number): string {
  const abs = Math.abs(Math.round(amount));
  const formatted = new Intl.NumberFormat('ar-MA').format(abs);
  if (amount > 0) return `+${formatted}`;
  if (amount < 0) return `-${formatted}`;
  return formatted;
}

export function formatPlainNumber(amount: number): string {
  return new Intl.NumberFormat('ar-MA').format(Math.abs(Math.round(amount)));
}