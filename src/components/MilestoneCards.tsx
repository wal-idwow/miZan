// miZan — Milestone Cards (4/8/12 Month Vision)
import { darija } from '../i18n/darija';
import { formatDH } from '../utils/format';
import type { MilestoneCard } from '../types/finance';

interface MilestoneCardProps {
  month: 4 | 8 | 12;
  label: string;
  balance: number;
  status: 'surplus' | 'deficit' | 'break-even';
  drivers: string[];
}

function MilestoneCardComponent({ month, label, balance, status, drivers }: MilestoneCardProps) {
  const isSurplus = balance >= 0;
  const statusConfig = {
    surplus: { bg: 'bg-green-50 border-green-200', border: 'border-green-200', icon: '✅', text: 'فائض', driverColor: 'text-green-700' },
    deficit: { bg: 'bg-red-50 border-red-200', border: 'border-red-200', icon: '⚠️', text: 'عجز', driverColor: 'text-red-700' },
    'break-even': { bg: 'bg-yellow-50 border-yellow-200', border: 'border-yellow-200', icon: '➖', text: 'متوازن', driverColor: 'text-yellow-700' },
  };
  const cfg = statusConfig[status];

  return (
    <article className={`p-4 rounded-xl border-2 ${cfg.bg} ${cfg.border} flex flex-col gap-3`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900">{label} <span className="text-sm font-normal text-gray-500">({month} {darija.common.month})</span></h3>
        <span className="text-2xl" aria-label={`${cfg.text} ${formatDH(balance)}`}>{cfg.icon}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-gray-900">{formatDH(balance)}</span>
        <span className={`text-sm font-medium px-2 py-1 rounded-full ${isSurplus ? 'bg-green-100 text-green-700' : balance < 0 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
          {cfg.text}
        </span>
      </div>
      <div className="pt-2 border-t border-current/20">
        <p className="text-xs text-gray-500 mb-1">{darija.vision.keyDriversLabel}</p>
        <ul className="space-y-1">
          {drivers.map((d, i) => (
            <li key={i} className="text-xs text-gray-600 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-current/40" />
              {d}
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

interface MilestoneCardsProps {
  milestones: MilestoneCard[];
}

export function MilestoneCards({ milestones }: MilestoneCardsProps) {
  return (
    <section aria-labelledby="milestones-title">
      <h2 id="milestones-title" className="sr-only">{darija.vision.title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {milestones.map(ms => (
          <MilestoneCardComponent key={ms.month} month={ms.month} label={ms.label} balance={ms.projectedBalance} status={ms.status} drivers={ms.keyDrivers} />
        ))}
      </div>
    </section>
  );
}