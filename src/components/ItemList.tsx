// miZan — Goals, Shocks & Debts List with Progress Bars
import { useState } from 'react';
import { darija } from '../i18n/darija';
import { formatDH } from '../utils/format';
import type { FinanceItem, ForecastResult } from '../types/finance';
import { ProgressBar } from './ProgressBar';
import { CustomPaymentModal } from './CustomPaymentModal';
import { ConfirmDialog } from './ConfirmDialog';

interface ItemListProps {
  items: FinanceItem[];
  onAdd: (item: FinanceItem) => void;
  onUpdate: (item: FinanceItem) => void;
  onDelete: (id: string) => void;
  onAddPayment: (id: string, amount: number) => void;
  forecast: ForecastResult;
}

export function ItemList({ items, onAdd, onUpdate, onDelete, onAddPayment, forecast }: ItemListProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<FinanceItem>>({ name: '', category: 'goal', totalAmount: 0, alreadySaved: 0, targetMonth: 1 });
  const [paymentItem, setPaymentItem] = useState<FinanceItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      const item = items.find(i => i.id === editingId);
      onUpdate({ ...form, id: editingId, createdAt: item!.createdAt } as FinanceItem);
    } else {
      onAdd({ ...form, id: crypto.randomUUID(), createdAt: Date.now() } as FinanceItem);
    }
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (item: FinanceItem) => {
    setForm({ name: item.name, category: item.category, totalAmount: item.totalAmount, alreadySaved: item.alreadySaved, targetMonth: item.targetMonth });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleAddPaymentClick = (item: FinanceItem) => {
    setPaymentItem(item);
  };

  const handlePaymentConfirm = (amount: number) => {
    if (paymentItem) {
      onAddPayment(paymentItem.id, amount);
      setPaymentItem(null);
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteConfirm(id);
  };

  const handleDeleteConfirm = (id: string) => {
    onDelete(id);
    setDeleteConfirm(null);
  };

  if (items.length === 0 && !showForm) {
    return (
      <section className="bg-white rounded-2xl border p-6" aria-labelledby="items-title">
        <div className="flex items-center justify-between mb-4">
          <h3 id="items-title" className="text-lg font-bold text-gray-900">{darija.items.title}</h3>
          <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 min-h-[44px]">{darija.items.addButton}</button>
        </div>
        <p className="text-center text-gray-500 py-8">{darija.items.emptyState}</p>
      </section>
    );
  }

  return (
    <section className="bg-white rounded-2xl border p-6" aria-labelledby="items-title">
      <div className="flex items-center justify-between mb-4">
        <h3 id="items-title" className="text-lg font-bold text-gray-900">{darija.items.title}</h3>
        {!showForm && !editingId && (
          <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 min-h-[44px]">{darija.items.addButton}</button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 rounded-xl border space-y-3 animate-slide-down">
          <h4 className="font-medium text-gray-800">{editingId ? darija.items.form.editTitle : darija.items.form.title}</h4>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{darija.items.form.name}</label>
            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 min-h-[44px]" placeholder={darija.items.form.namePlaceholder} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{darija.items.form.category}</label>
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value as FinanceItem['category'] })} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 min-h-[44px]">
              <option value="goal">{darija.items.categories.goal}</option>
              <option value="shock">{darija.items.categories.shock}</option>
              <option value="debt">{darija.items.categories.debt}</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{darija.items.form.totalAmount}</label>
              <input type="number" inputMode="decimal" value={form.totalAmount} onChange={e => setForm({ ...form, totalAmount: Number(e.target.value) || 0 })} required min="0" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 min-h-[44px]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{darija.items.form.alreadySaved}</label>
              <input type="number" inputMode="decimal" value={form.alreadySaved} onChange={e => setForm({ ...form, alreadySaved: Number(e.target.value) || 0 })} min="0" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 min-h-[44px]" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{darija.items.form.targetMonth} <span className="text-xs text-gray-400">({darija.items.form.targetMonthHint})</span></label>
            <input type="number" inputMode="decimal" value={form.targetMonth} onChange={e => setForm({ ...form, targetMonth: Math.max(1, Number(e.target.value) || 1) })} required min="1" max="24" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 min-h-[44px]" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 min-h-[44px]">{darija.common.cancel}</button>
            <button type="submit" className="flex-1 py-2 px-4 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 min-h-[44px]">{darija.common.save}</button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {items.map(item => {
          const progress = forecast.itemProgress.find((p: typeof forecast.itemProgress[0]) => p.item.id === item.id);
          const isCompleted = item.alreadySaved >= item.totalAmount;
          const monthsRemaining = progress?.monthsRemaining ?? item.targetMonth;
          const isOverdue = !isCompleted && monthsRemaining <= 0;
          return (
            <article key={item.id} className="p-4 border border-gray-200 rounded-xl bg-white hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg" aria-hidden="true">{item.category === 'goal' ? '🎯' : item.category === 'debt' ? '💳' : '⚡'}</span>
                    <h4 className="font-semibold text-gray-900 truncate">{item.name}</h4>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 whitespace-nowrap">
                      {item.category === 'goal' ? darija.items.categories.goal : item.category === 'debt' ? darija.items.categories.debt : darija.items.categories.shock}
                    </span>
                    {isCompleted && <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">{darija.items.progress.completed}</span>}
                    {isOverdue && <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">{darija.items.progress.overdue}</span>}
                  </div>
                  <p className="text-sm text-gray-500">{darija.items.progress.monthlySlice}: {formatDH(progress?.monthlySlice || 0)} | {darija.items.progress.monthsLeft}: {progress?.monthsRemaining}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => handleEdit(item)} className="p-2 text-gray-400 hover:text-gray-600 min-h-[44px] min-w-[44px] flex items-center justify-center" aria-label={`تعديل ${item.name}`}>✏️</button>
                  <button onClick={() => handleDeleteClick(item.id)} className="p-2 text-gray-400 hover:text-red-600 min-h-[44px] min-w-[44px] flex items-center justify-center" aria-label={`حذف ${item.name}`}>🗑️</button>
                </div>
              </div>

              <ProgressBar pct={progress?.progressPct || 0} saved={item.alreadySaved} total={item.totalAmount} monthlySlice={progress?.monthlySlice || 0} label={`${item.name}: ${Math.round(progress?.progressPct || 0)}%`} />

              <div className="flex gap-3 mt-3 pt-3 border-t border-gray-100">
                <button onClick={() => { const add = Math.ceil((item.totalAmount - item.alreadySaved) / Math.max(1, item.targetMonth)); onAddPayment(item.id, add); }} className="flex-1 py-2 px-3 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-100 flex items-center justify-center gap-1 min-h-[44px]">
                  {darija.items.progress.addPayment}
                </button>
                <button onClick={() => handleAddPaymentClick(item)} className="flex-1 py-2 px-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 min-h-[44px]">
                  {darija.common.add} {darija.common.currencyShort}
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
        remainingAmount={paymentItem ? paymentItem.totalAmount - paymentItem.alreadySaved : 0}
        monthlySlice={paymentItem ? (forecast.itemProgress.find(p => p.item.id === paymentItem.id)?.monthlySlice || 0) : 0}
      />

      <ConfirmDialog
        isOpen={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => handleDeleteConfirm(deleteConfirm!)}
        title={darija.items.form.delete}
        message={darija.items.form.deleteConfirm}
        confirmText={darija.items.form.delete}
        cancelText={darija.common.cancel}
        variant="destructive"
      />
    </section>
  );
}