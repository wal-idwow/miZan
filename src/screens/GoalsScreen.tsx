// miZan — Goals, Shocks & Debts Tab Screen
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { darija } from '../i18n/darija';
import type { ForecastResult, StoredItem } from '../types/finance';
import { ItemList } from '../components/ItemList';

interface GoalsScreenProps {
  items: StoredItem[];
  forecast: ForecastResult;
  onAdd: (item: StoredItem) => void;
  onUpdate: (item: StoredItem) => void;
  onDelete: (id: string) => void;
  onAddPayment: (id: string, amount: number) => void;
}

export function GoalsScreen({
  items,
  forecast,
  onAdd,
  onUpdate,
  onDelete,
  onAddPayment,
}: GoalsScreenProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StoredItem | null>(null);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item: StoredItem) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingItem(null);
  };

  return (
    <div className="space-y-4">
      <ItemList
        items={items}
        forecast={forecast}
        onAdd={onAdd}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onAddPayment={onAddPayment}
        isFormOpen={isFormOpen}
        editingItem={editingItem}
        onOpenAdd={handleOpenAdd}
        onOpenEdit={handleOpenEdit}
        onCloseForm={handleCloseForm}
      />

      <button
        type="button"
        onClick={handleOpenAdd}
        aria-label={darija.items.addButton}
        className="md:hidden fixed bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] end-4 z-20 w-14 h-14 rounded-full bg-brand-600 text-white shadow-raised hover:bg-brand-700 flex items-center justify-center transition-transform active:scale-95"
      >
        <Plus size={24} strokeWidth={2} aria-hidden="true" />
      </button>
    </div>
  );
}
