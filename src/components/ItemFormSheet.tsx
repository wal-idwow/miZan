// miZan — Item Create / Edit Sheet with Category Cards & Month Chips
import { useState } from 'react';
import { CalendarClock, CreditCard, Target } from 'lucide-react';
import { darija } from '../i18n/darija';
import { addMonthsToYearMonth, buildTargetMonthOptions } from '../utils/dates';
import { generateId } from '../utils/ids';
import type { ItemCategory, StoredItem } from '../types/finance';
import { Field } from './ui/Field';
import { MoneyInput } from './ui/MoneyInput';
import { Sheet } from './ui/Sheet';

interface ItemFormSheetProps {
  isOpen: boolean;
  onClose: () => void;
  editingItem: StoredItem | null;
  onSave: (item: StoredItem, isEdit: boolean) => void;
}

interface ItemDraft {
  name: string;
  category: ItemCategory;
  totalAmount: number;
  alreadySaved: number;
  targetDate: string;
}

function ItemFormContent({
  onClose,
  editingItem,
  onSave,
}: Omit<ItemFormSheetProps, 'isOpen'>) {
  const [referenceDate] = useState(() => new Date());
  const [draft, setDraft] = useState<ItemDraft>(() =>
    editingItem
      ? {
          name: editingItem.name,
          category: editingItem.category,
          totalAmount: editingItem.totalAmount,
          alreadySaved: editingItem.alreadySaved,
          targetDate: editingItem.targetDate,
        }
      : {
          name: '',
          category: 'goal',
          totalAmount: 0,
          alreadySaved: 0,
          targetDate: addMonthsToYearMonth(referenceDate, 3),
        }
  );
  const [error, setError] = useState<string | null>(null);

  const monthOptions = buildTargetMonthOptions(
    referenceDate,
    24,
    editingItem?.targetDate
  );

  const categories: {
    id: ItemCategory;
    label: string;
    hint: string;
    icon: typeof Target;
  }[] = [
    {
      id: 'goal',
      label: darija.items.categories.goal,
      hint: darija.items.categoryHints.goal,
      icon: Target,
    },
    {
      id: 'shock',
      label: darija.items.categories.shock,
      hint: darija.items.categoryHints.shock,
      icon: CalendarClock,
    },
    {
      id: 'debt',
      label: darija.items.categories.debt,
      hint: darija.items.categoryHints.debt,
      icon: CreditCard,
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = draft.name.trim();
    if (!trimmedName) {
      setError(darija.items.form.errors.nameRequired);
      return;
    }
    if (draft.totalAmount <= 0) {
      setError(darija.items.form.errors.amountPositive);
      return;
    }
    if (draft.alreadySaved > draft.totalAmount) {
      setError(darija.items.form.errors.savedTooHigh);
      return;
    }

    const savedItem: StoredItem = editingItem
      ? {
          id: editingItem.id,
          name: trimmedName,
          category: draft.category,
          totalAmount: draft.totalAmount,
          alreadySaved: draft.alreadySaved,
          targetDate: draft.targetDate,
          createdAt: editingItem.createdAt,
        }
      : {
          id: generateId(),
          name: trimmedName,
          category: draft.category,
          totalAmount: draft.totalAmount,
          alreadySaved: draft.alreadySaved,
          targetDate: draft.targetDate,
          createdAt: Date.now(),
        };

    onSave(savedItem, editingItem !== null);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label={darija.items.form.name}>
        {({ id }) => (
          <input
            id={id}
            type="text"
            value={draft.name}
            onChange={e => {
              setError(null);
              setDraft(prev => ({ ...prev, name: e.target.value }));
            }}
            maxLength={80}
            autoFocus
            className="w-full p-3 bg-card border border-line rounded-xl focus:ring-2 focus:ring-brand-600 focus:border-transparent min-h-[44px] text-ink-900 placeholder:text-ink-400"
            placeholder={darija.items.form.namePlaceholder}
          />
        )}
      </Field>

      <div className="space-y-1.5">
        <span className="block text-sm font-medium text-ink-900">{darija.items.form.category}</span>
        <div className="grid grid-cols-3 gap-2">
          {categories.map(cat => {
            const Icon = cat.icon;
            const selected = draft.category === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setDraft(prev => ({ ...prev, category: cat.id }))}
                aria-pressed={selected}
                className={`p-2.5 rounded-xl border text-center flex flex-col items-center gap-1 min-h-[44px] transition-colors ${
                  selected
                    ? 'bg-brand-50 border-brand-600 text-brand-700'
                    : 'bg-card border-line text-ink-600 hover:bg-surface'
                }`}
              >
                <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
                <span className="text-xs font-semibold">{cat.label}</span>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-ink-400">
          {categories.find(c => c.id === draft.category)?.hint}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label={darija.items.form.totalAmount}>
          {({ id }) => (
            <MoneyInput
              id={id}
              value={draft.totalAmount}
              onChange={totalAmount => {
                setError(null);
                setDraft(prev => ({ ...prev, totalAmount }));
              }}
              min={0}
            />
          )}
        </Field>
        <Field label={darija.items.form.alreadySaved}>
          {({ id }) => (
            <MoneyInput
              id={id}
              value={draft.alreadySaved}
              onChange={alreadySaved => {
                setError(null);
                setDraft(prev => ({ ...prev, alreadySaved }));
              }}
              min={0}
            />
          )}
        </Field>
      </div>

      <div className="space-y-1.5">
        <span className="block text-sm font-medium text-ink-900">
          {darija.items.form.targetMonth}
        </span>
        <div className="flex overflow-x-auto gap-2 pb-1 no-scrollbar">
          {monthOptions.map(opt => {
            const selected = draft.targetDate === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setDraft(prev => ({ ...prev, targetDate: opt.value }))}
                aria-pressed={selected}
                className={`px-3.5 py-2 rounded-full text-xs font-medium whitespace-nowrap min-h-[44px] transition-colors shrink-0 border ${
                  selected
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-surface text-ink-600 border-line hover:text-ink-900'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {error ? (
        <p role="alert" className="text-xs font-medium text-negative-600 bg-negative-50 px-3 py-2 rounded-lg">
          {error}
        </p>
      ) : null}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-3 px-4 border border-line rounded-xl text-ink-600 font-medium hover:bg-surface min-h-[44px]"
        >
          {darija.items.form.cancel}
        </button>
        <button
          type="submit"
          className="flex-1 py-3 px-4 bg-brand-600 text-white rounded-xl font-semibold hover:bg-brand-700 min-h-[44px]"
        >
          {darija.items.form.save}
        </button>
      </div>
    </form>
  );
}

export function ItemFormSheet({
  isOpen,
  onClose,
  editingItem,
  onSave,
}: ItemFormSheetProps) {
  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title={editingItem ? darija.items.form.editTitle : darija.items.form.title}
      variant="sheet"
      closeOnBackdrop={false}
    >
      <ItemFormContent
        onClose={onClose}
        editingItem={editingItem}
        onSave={onSave}
      />
    </Sheet>
  );
}
