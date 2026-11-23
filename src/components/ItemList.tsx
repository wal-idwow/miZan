// miZan — Goals, Shocks & Debts List with Category Filter & Completed Drawer
import { useState } from 'react';
import { ChevronDown, ChevronUp, Plus, Target } from 'lucide-react';
import { darija } from '../i18n/darija';
import { t } from '../i18n/t';
import type { ForecastResult, ItemCategory, StoredItem } from '../types/finance';
import { ConfirmDialog } from './ConfirmDialog';
import { CustomPaymentModal } from './CustomPaymentModal';
import { ItemCard } from './ItemCard';
import { ItemFormSheet } from './ItemFormSheet';

type FilterType = 'all' | ItemCategory;

interface ItemListProps {
  items: StoredItem[];
  onAdd: (item: StoredItem) => void;
  onUpdate: (item: StoredItem) => void;
  onDelete: (id: string) => void;
  onAddPayment: (id: string, amount: number) => void;
  forecast: ForecastResult;
  isFormOpen: boolean;
  editingItem: StoredItem | null;
  onOpenAdd: () => void;
  onOpenEdit: (item: StoredItem) => void;
  onCloseForm: () => void;
}

export function ItemList({
  items,
  onAdd,
  onUpdate,
  onDelete,
  onAddPayment,
  forecast,
  isFormOpen,
  editingItem,
  onOpenAdd,
  onOpenEdit,
  onCloseForm,
}: ItemListProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [showCompleted, setShowCompleted] = useState(false);
  const [paymentItem, setPaymentItem] = useState<StoredItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const filters: { id: FilterType; label: string }[] = [
    { id: 'all', label: darija.items.filterAll },
    { id: 'goal', label: darija.items.categories.goal },
    { id: 'shock', label: darija.items.categories.shock },
    { id: 'debt', label: darija.items.categories.debt },
  ];

  const filteredItems =
    filter === 'all' ? items : items.filter(item => item.category === filter);
  const activeItems = filteredItems.filter(item => item.alreadySaved < item.totalAmount);
  const completedItems = filteredItems.filter(item => item.alreadySaved >= item.totalAmount);

  const selectedProgress = paymentItem
    ? forecast.itemProgress.find(p => p.item.id === paymentItem.id)
    : undefined;
  const deleteTarget = deleteConfirmId
    ? items.find(i => i.id === deleteConfirmId)
    : undefined;

  return (
    <section className="space-y-4" aria-labelledby="items-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="items-title" className="text-lg font-bold text-ink-900">
            {darija.items.title}
          </h2>
          <p className="text-xs text-ink-600">{darija.items.subtitle}</p>
        </div>
        <button
          type="button"
          onClick={onOpenAdd}
          className="hidden md:inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 min-h-[44px] transition-colors"
        >
          <Plus size={18} strokeWidth={1.75} aria-hidden="true" />
          <span>{darija.items.addButton}</span>
        </button>
      </div>

      {items.length > 0 ? (
        <div className="flex overflow-x-auto gap-2 pb-1 no-scrollbar">
          {filters.map(f => {
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                aria-pressed={active}
                className={`px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap min-h-[44px] transition-colors shrink-0 border ${
                  active
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-card text-ink-600 border-line hover:text-ink-900'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      ) : null}

      {items.length === 0 ? (
        <div className="bg-card rounded-2xl border border-line p-8 text-center shadow-card space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto">
            <Target size={24} strokeWidth={1.75} aria-hidden="true" />
          </div>
          <p className="text-sm text-ink-600">{darija.items.emptyState}</p>
          <button
            type="button"
            onClick={onOpenAdd}
            className="px-5 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 min-h-[44px]"
          >
            {darija.items.addButton}
          </button>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-card rounded-2xl border border-line p-6 text-center shadow-card">
          <p className="text-sm text-ink-600">{darija.items.filterEmpty}</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeItems.map(item => (
              <ItemCard
                key={item.id}
                item={item}
                progress={forecast.itemProgress.find(p => p.item.id === item.id)}
                onEdit={onOpenEdit}
                onDelete={setDeleteConfirmId}
                onQuickPayment={(target, amt) => onAddPayment(target.id, amt)}
                onOpenCustomPayment={setPaymentItem}
              />
            ))}
          </div>

          {completedItems.length > 0 ? (
            <div className="bg-card rounded-2xl border border-line shadow-card overflow-hidden">
              <button
                type="button"
                onClick={() => setShowCompleted(prev => !prev)}
                aria-expanded={showCompleted}
                className="w-full px-4 py-3 flex items-center justify-between text-sm font-semibold text-ink-600 hover:bg-surface min-h-[44px]"
              >
                <span>
                  {t(darija.items.progress.completedGroup, { n: completedItems.length })}
                </span>
                {showCompleted ? (
                  <ChevronUp size={18} strokeWidth={1.75} aria-hidden="true" />
                ) : (
                  <ChevronDown size={18} strokeWidth={1.75} aria-hidden="true" />
                )}
              </button>

              {showCompleted ? (
                <div className="p-4 pt-0 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {completedItems.map(item => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      progress={forecast.itemProgress.find(p => p.item.id === item.id)}
                      onEdit={onOpenEdit}
                      onDelete={setDeleteConfirmId}
                      onQuickPayment={(target, amt) => onAddPayment(target.id, amt)}
                      onOpenCustomPayment={setPaymentItem}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      )}

      <ItemFormSheet
        isOpen={isFormOpen}
        onClose={onCloseForm}
        editingItem={editingItem}
        onSave={(saved, isEdit) => {
          if (isEdit) {
            onUpdate(saved);
          } else {
            onAdd(saved);
          }
        }}
      />

      <CustomPaymentModal
        isOpen={paymentItem !== null}
        onClose={() => setPaymentItem(null)}
        onConfirm={amount => {
          if (paymentItem) {
            onAddPayment(paymentItem.id, amount);
            setPaymentItem(null);
          }
        }}
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
          if (deleteConfirmId) {
            onDelete(deleteConfirmId);
            setDeleteConfirmId(null);
          }
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
