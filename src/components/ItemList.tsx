// miZan — Goals, Shocks & Debts List
import { useState } from 'react';
import { darija } from '../i18n/darija';
import { formatMonthsRemaining, t } from '../i18n/t';
import { addMonthsToYearMonth, buildTargetMonthOptions } from '../utils/dates';
import { generateId } from '../utils/ids';
import type { ForecastResult, ItemCategory, StoredItem } from '../types/finance';
import { ProgressBar } from './ProgressBar';
import { CustomPaymentModal } from './CustomPaymentModal';
import { ConfirmDialog } from './ConfirmDialog';
import { Field } from './ui/Field';
import { Money } from './ui/Money';
import { MoneyInput } from './ui/MoneyInput';

interface ItemListProps {
  items: StoredItem[];
  onAdd: (item: StoredItem) => void;
  onUpdate: (item: StoredItem) => void;
  onDelete: (id: string) => void;
  onAddPayment: (id: string, amount: number) => void;
  forecast: ForecastResult;
}

interface ItemFormDraft {
  name: string;
  category: ItemCategory;
  totalAmount: number;
  alreadySaved: number;
  targetDate: string;
}

function createEmptyDraft(): ItemFormDraft {
  return {
    name: '',
    category: 'goal',
    totalAmount: 0,
    alreadySaved: 0,
    targetDate: addMonthsToYearMonth(new Date(), 1),
  };
}

export function ItemList({
  items,
  onAdd,
  onUpdate,
  onDelete,
  onAddPayment,
  forecast,
}: ItemListProps) {
  const [referenceDate] = useState(() => new Date());
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ItemFormDraft>(() => createEmptyDraft());
  const [paymentItem, setPaymentItem] = useState<StoredItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const monthOptions = buildTargetMonthOptions(
    referenceDate,
    24,
    editingId ? form.targetDate : undefined
  );

  const openAddForm = () => {
    setEditingId(null);
    setForm(createEmptyDraft());
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = form.name.trim();
    if (!trimmedName) return;

    if (editingId) {
      const existing = items.find(i => i.id === editingId);
      if (existing) {
        onUpdate({
          id: editingId,
          name: trimmedName,
          category: form.category,
          totalAmount: Math.max(0, form.totalAmount),
          alreadySaved: Math.max(0, form.alreadySaved),
          targetDate: form.targetDate,
          createdAt: existing.createdAt,
        });
      }
    } else {
      onAdd({
        id: generateId(),
        name: trimmedName,
        category: form.category,
        totalAmount: Math.max(0, form.totalAmount),
        alreadySaved: Math.max(0, form.alreadySaved),
        targetDate: form.targetDate,
        createdAt: Date.now(),
      });
    }

    setShowForm(false);
    setEditingId(null);
    setForm(createEmptyDraft());
  };

  const handleEdit = (item: StoredItem) => {
    setForm({
      name: item.name,
      category: item.category,
      totalAmount: item.totalAmount,
      alreadySaved: item.alreadySaved,
      targetDate: item.targetDate,
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handlePaymentConfirm = (amount: number) => {
    if (paymentItem) {
      onAddPayment(paymentItem.id, amount);
      setPaymentItem(null);
    }
  };

  const handleDeleteConfirm = (id: string) => {
    onDelete(id);
    setDeleteConfirmId(null);
  };

  const selectedProgress = paymentItem
    ? forecast.itemProgress.find(p => p.item.id === paymentItem.id)
    : undefined;
  const deleteTarget = deleteConfirmId
    ? items.find(i => i.id === deleteConfirmId)
    : undefined;

  return (
    <section className="bg-white rounded-2xl border p-6" aria-labelledby="items-title">
      <div className="flex items-center justify-between mb-4">
        <h3 id="items-title" className="text-lg font-bold text-gray-900">
          {darija.items.title}
        </h3>
        {!showForm && !editingId ? (
          <button
            type="button"
            onClick={openAddForm}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 min-h-[44px]"
          >
            {darija.items.addButton}
          </button>
        ) : null}
      </div>

      {showForm ? (
        <form
          onSubmit={handleSubmit}
          className="mb-6 p-4 bg-gray-50 rounded-xl border space-y-3 animate-slide-down"
        >
          <h4 className="font-medium text-gray-800">
            {editingId ? darija.items.form.editTitle : darija.items.form.title}
          </h4>

          <Field label={darija.items.form.name}>
            {({ id }) => (
              <input
                id={id}
                type="text"
                value={form.name}
                onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                required
                maxLength={80}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
                placeholder={darija.items.form.namePlaceholder}
              />
            )}
          </Field>

          <Field label={darija.items.form.category}>
            {({ id }) => (
              <select
                id={id}
                value={form.category}
                onChange={e =>
                  setForm(prev => ({ ...prev, category: e.target.value as ItemCategory }))
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
              >
                <option value="goal">{darija.items.categories.goal}</option>
                <option value="shock">{darija.items.categories.shock}</option>
                <option value="debt">{darija.items.categories.debt}</option>
              </select>
            )}
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label={darija.items.form.totalAmount}>
              {({ id }) => (
                <MoneyInput
                  id={id}
                  value={form.totalAmount}
                  onChange={totalAmount => setForm(prev => ({ ...prev, totalAmount }))}
                  min={0}
                  required
                />
              )}
            </Field>
            <Field label={darija.items.form.alreadySaved}>
              {({ id }) => (
                <MoneyInput
                  id={id}
                  value={form.alreadySaved}
                  onChange={alreadySaved => setForm(prev => ({ ...prev, alreadySaved }))}
                  min={0}
                />
              )}
            </Field>
          </div>

          <Field label={darija.items.form.targetMonth} hint={darija.items.form.targetMonthHint}>
            {({ id, ariaDescribedBy }) => (
              <select
                id={id}
                aria-describedby={ariaDescribedBy}
                value={form.targetDate}
                onChange={e => setForm(prev => ({ ...prev, targetDate: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
              >
                {monthOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            )}
          </Field>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 min-h-[44px]"
            >
              {darija.common.cancel}
            </button>
            <button
              type="submit"
              className="flex-1 py-2 px-4 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 min-h-[44px]"
            >
              {darija.common.save}
            </button>
          </div>
        </form>
      ) : null}

      {items.length === 0 && !showForm ? (
        <p className="text-center text-gray-500 py-8">{darija.items.emptyState}</p>
      ) : null}

      <div className="space-y-4">
        {items.map(item => {
          const progress = forecast.itemProgress.find(p => p.item.id === item.id);
          const isCompleted = item.alreadySaved >= item.totalAmount;
          const isOverdue = !isCompleted && Boolean(progress?.isOverdue);
          const monthsRemaining = progress?.monthsRemaining ?? 0;
          const monthlySlice = progress?.monthlySlice ?? 0;
          const remaining = Math.max(0, item.totalAmount - item.alreadySaved);

          return (
            <article
              key={item.id}
              className="p-4 border border-gray-200 rounded-xl bg-white hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h4 className="font-semibold text-gray-900 truncate">{item.name}</h4>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 whitespace-nowrap">
                      {item.category === 'goal'
                        ? darija.items.categories.goal
                        : item.category === 'debt'
                          ? darija.items.categories.debt
                          : darija.items.categories.shock}
                    </span>
                    {isCompleted ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                        {darija.items.progress.completed}
                      </span>
                    ) : null}
                    {isOverdue ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                        {darija.items.progress.overdue}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm text-gray-500 flex flex-wrap items-center gap-2">
                    <span>
                      {darija.items.progress.monthlySlice}: <Money amount={monthlySlice} />
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{isCompleted ? darija.items.progress.completed : formatMonthsRemaining(monthsRemaining)}</span>
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => handleEdit(item)}
                    className="px-2.5 py-2 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg min-h-[44px]"
                    aria-label={t(darija.a11y.editItem, { name: item.name })}
                  >
                    {darija.common.edit}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmId(item.id)}
                    className="px-2.5 py-2 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg min-h-[44px]"
                    aria-label={t(darija.a11y.deleteItem, { name: item.name })}
                  >
                    {darija.common.delete}
                  </button>
                </div>
              </div>

              <ProgressBar
                pct={progress?.progressPct || 0}
                saved={item.alreadySaved}
                total={item.totalAmount}
                monthlySlice={monthlySlice}
                itemName={item.name}
              />

              <div className="flex gap-3 mt-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  disabled={remaining <= 0}
                  onClick={() => {
                    const add = Math.min(remaining, Math.max(1, Math.ceil(monthlySlice || remaining)));
                    onAddPayment(item.id, add);
                  }}
                  className="flex-1 py-2 px-3 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 min-h-[44px]"
                >
                  {darija.items.progress.addMonthly}
                </button>
                <button
                  type="button"
                  disabled={remaining <= 0}
                  onClick={() => setPaymentItem(item)}
                  className="flex-1 py-2 px-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                >
                  {darija.items.progress.addCustom}
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <CustomPaymentModal
        isOpen={paymentItem !== null}
        onClose={() => setPaymentItem(null)}
        onConfirm={handlePaymentConfirm}
        itemName={paymentItem?.name || ''}
        remainingAmount={
          paymentItem ? Math.max(0, paymentItem.totalAmount - paymentItem.alreadySaved) : 0
        }
        monthlySlice={selectedProgress?.monthlySlice || 0}
      />

      <ConfirmDialog
        isOpen={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => {
          if (deleteConfirmId) handleDeleteConfirm(deleteConfirmId);
        }}
        title={darija.items.form.deleteTitle}
        message={t(darija.items.form.deleteConfirm, { name: deleteTarget?.name ?? '' })}
        confirmText={darija.items.form.delete}
        cancelText={darija.common.cancel}
        variant="destructive"
      />
    </section>
  );
}
