// miZan — Milestone Cards (4/8/12 Month Vision)
import { darija } from '../i18n/darija';
import { t } from '../i18n/t';
import { formatCurrencyText } from '../utils/format';
import type { KeyDriverFact, MilestoneCard } from '../types/finance';
import { Money } from './ui/Money';

function getMilestoneHorizonLabel(month: 4 | 8 | 12): string {
  if (month === 4) return darija.vision.month4;
  if (month === 8) return darija.vision.month8;
  return darija.vision.month12;
}

function renderDriverFact(fact: KeyDriverFact) {
  switch (fact.kind) {
    case 'surplus':
    case 'deficit':
    case 'reserved': {
      const template = darija.vision.drivers[fact.kind];
      const [before, after] = template.split('{amount}');
      return (
        <>
          {before}
          <Money amount={fact.amount} className="font-medium text-gray-800" />
          {after}
        </>
      );
    }
    case 'settling':
      return t(darija.vision.drivers.settling, {
        names: fact.names.join(darija.common.listSeparator),
      });
    case 'stable':
      return darija.vision.drivers.stable;
    case 'noData':
      return darija.vision.drivers.noData;
  }
}

interface MilestoneCardProps {
  month: 4 | 8 | 12;
  label: string;
  balance: number;
  status: 'surplus' | 'deficit' | 'break-even';
  driverFacts?: KeyDriverFact[];
}

function MilestoneCardComponent({
  month,
  label,
  balance,
  status,
  driverFacts,
}: MilestoneCardProps) {
  const isSurplus = balance >= 0;
  const statusConfig = {
    surplus: {
      bg: 'bg-green-50 border-green-200',
      dot: 'bg-green-500',
      text: darija.vision.status.surplus,
    },
    deficit: {
      bg: 'bg-red-50 border-red-200',
      dot: 'bg-red-500',
      text: darija.vision.status.deficit,
    },
    'break-even': {
      bg: 'bg-yellow-50 border-yellow-200',
      dot: 'bg-yellow-500',
      text: darija.vision.status.breakEven,
    },
  };
  const cfg = statusConfig[status];
  const facts: KeyDriverFact[] =
    driverFacts && driverFacts.length > 0 ? driverFacts : [{ kind: 'noData' }];

  return (
    <article
      className={`p-4 rounded-xl border-2 ${cfg.bg} flex flex-col gap-3`}
      aria-label={t(darija.a11y.milestoneCard, {
        month,
        balance: formatCurrencyText(balance),
        status: cfg.text,
      })}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-lg font-bold text-gray-900">
          {label}{' '}
          <span className="text-sm font-normal text-gray-500">
            ({getMilestoneHorizonLabel(month)})
          </span>
        </h3>
        <span className={`w-3 h-3 rounded-full shrink-0 ${cfg.dot}`} aria-hidden="true" />
      </div>
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="text-3xl font-bold text-gray-900">
          <Money amount={balance} />
        </span>
        <span
          className={`text-sm font-medium px-2 py-1 rounded-full ${
            isSurplus
              ? 'bg-green-100 text-green-700'
              : balance < 0
                ? 'bg-red-100 text-red-700'
                : 'bg-yellow-100 text-yellow-700'
          }`}
        >
          {cfg.text}
        </span>
      </div>
      <div className="pt-2 border-t border-current/20">
        <p className="text-xs text-gray-500 mb-1">{darija.vision.keyDriversLabel}</p>
        <ul className="space-y-1">
          {facts.map((fact, idx) => (
            <li key={idx} className="text-xs text-gray-600 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-current/40 shrink-0" aria-hidden="true" />
              <span>{renderDriverFact(fact)}</span>
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
      <h2 id="milestones-title" className="sr-only">
        {darija.vision.title}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {milestones.map(ms => (
          <MilestoneCardComponent
            key={ms.month}
            month={ms.month}
            label={ms.label}
            balance={ms.projectedBalance}
            status={ms.status}
            driverFacts={ms.driverFacts}
          />
        ))}
      </div>
    </section>
  );
}
