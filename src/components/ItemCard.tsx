// miZan — Item Card (Goal / Shock / Debt) with overflow menu
import { useEffect, useRef, useState } from 'react';
import {
  CalendarClock,
  CreditCard,
  MoreHorizontal,
  Pencil,
  Plus,
  Target,
  Trash2,
  Wallet,
} from 'lucide-react';
import { darija } from '../i18n/darija';
import { formatMonthsRemaining, t } from '../i18n/t';
import { formatYearMonth } from '../utils/dates';
import type { ItemProgress, StoredItem } from '../types/finance';
import { ProgressBar } from './ProgressBar';
import { Money } from './ui/Money';

interface ItemCardProps {
  item: StoredItem;
  progress?: ItemProgress;
  onEdit: (item: StoredItem) => void;
  onDelete: (id: string) => void;
  onQuickPayment: (item: StoredItem, amount: number) => void;
  onOpenCustomPayment: (item: StoredItem) => void;
}

export function ItemCard({
  item,
  progress,
  onEdit,
  onDelete,
  onQuickPayment,
  onOpenCustomPayment,
}: ItemCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  const categoryConfig = {
    goal: {
      icon: Target,
      bg: 'bg-brand-50 text-brand-700',
      label: darija.items.categories.goal,
    },
    shock: {
      icon: CalendarClock,
      bg: 'bg-warning-50 text-warning-600',
      label: darija.items.categories.shock,
    },
    debt: {
      icon: CreditCard,
      bg: 'bg-negative-50 text-negative-600',
      label: darija.items.categories.debt,
    },
  };

  const cat = categoryConfig[item.category];
  const CategoryIcon = cat.icon;
  const isCompleted = item.alreadySaved >= item.totalAmount;
  const isOverdue = !isCompleted && Boolean(progress?.isOverdue);
  const monthsRemaining = progress?.monthsRemaining ?? 0;
  const monthlySlice = progress?.monthlySlice ?? 0;
  const remaining = Math.max(0, item.totalAmount - item.alreadySaved);

  return (
    <article className="bg-card rounded-2xl border border-line p-4 shadow-card space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${cat.bg}`}
            aria-hidden="true"
          >
            <CategoryIcon size={20} strokeWidth={1.75} />
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-bold text-ink-900 line-clamp-2 leading-snug">{item.name}</h4>
              {isCompleted ? (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-positive-50 text-positive-600">
                  {darija.items.progress.completed}
                </span>
              ) : null}
              {isOverdue ? (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-negative-50 text-negative-600">
                  {darija.items.progress.overdue}
                </span>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-1.5 text-xs text-ink-600">
              <span className="px-2 py-0.5 rounded-full bg-surface text-ink-600 font-medium">
                {cat.label}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-surface text-ink-600">
                {formatYearMonth(item.targetDate)}
                {!isCompleted ? ` · ${formatMonthsRemaining(monthsRemaining)}` : ''}
              </span>
            </div>
          </div>
        </div>

        <div ref={menuRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setMenuOpen(prev => !prev)}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            aria-label={darija.items.progress.more}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-ink-400 hover:text-ink-900 hover:bg-surface transition-colors"
          >
            <MoreHorizontal size={20} strokeWidth={1.75} aria-hidden="true" />
          </button>

          {menuOpen ? (
            <div
              role="menu"
              className="absolute end-0 top-full mt-1 w-44 bg-card border border-line rounded-xl shadow-raised py-1 z-20 animate-slide-down"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onEdit(item);
                }}
                aria-label={t(darija.a11y.editItem, { name: item.name })}
                className="w-full px-3.5 py-2.5 text-sm text-ink-900 hover:bg-surface flex items-center gap-2.5 min-h-[44px]"
              >
                <Pencil size={16} strokeWidth={1.75} className="text-ink-400" aria-hidden="true" />
                <span>{darija.common.edit}</span>
              </button>

              {!isCompleted ? (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenCustomPayment(item);
                  }}
                  className="w-full px-3.5 py-2.5 text-sm text-ink-900 hover:bg-surface flex items-center gap-2.5 min-h-[44px]"
                >
                  <Wallet size={16} strokeWidth={1.75} className="text-ink-400" aria-hidden="true" />
                  <span>{darija.items.progress.addCustom}</span>
                </button>
              ) : null}

              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onDelete(item.id);
                }}
                aria-label={t(darija.a11y.deleteItem, { name: item.name })}
                className="w-full px-3.5 py-2.5 text-sm text-negative-600 hover:bg-negative-50 flex items-center gap-2.5 min-h-[44px]"
              >
                <Trash2 size={16} strokeWidth={1.75} aria-hidden="true" />
                <span>{darija.common.delete}</span>
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {!isCompleted ? (
        <p className="text-xs text-ink-600">
          {darija.items.progress.monthlySlice}:{' '}
          <Money amount={monthlySlice} className="font-semibold text-ink-900" />
        </p>
      ) : null}

      <ProgressBar
        pct={progress?.progressPct || 0}
        saved={item.alreadySaved}
        total={item.totalAmount}
        itemName={item.name}
      />

      {!isCompleted ? (
        <div className="pt-1">
          <button
            type="button"
            onClick={() => {
              const add = Math.min(remaining, Math.max(1, Math.ceil(monthlySlice || remaining)));
              onQuickPayment(item, add);
            }}
            className="w-full py-2.5 px-4 bg-brand-50 text-brand-700 hover:bg-brand-600 hover:text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 min-h-[44px]"
          >
            <Plus size={16} strokeWidth={1.75} aria-hidden="true" />
            <span>{darija.items.progress.addMonthly}</span>
          </button>
        </div>
      ) : null}
    </article>
  );
}
