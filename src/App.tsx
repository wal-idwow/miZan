import { useState, useCallback, useMemo } from 'react';
import type { BaselineInput, FinanceItem, WhatIfScenario, StoredData, ForecastResult } from './types/finance';
import { computeForecast, computeWhatIfDelta } from './engine/forecast';
import { darija } from './i18n/darija';
import { STORAGE_KEY, CURRENT_SCHEMA_VERSION } from './types/finance';

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

const DEMO_BASELINE: BaselineInput = {
  fixedSalary: 12000,
  sideIncome: 1500,
  currentBalance: 15000,
  fixedBills: { rent: 4000, utilities: 800, subscriptions: 300, other: 200 },
  variableBuckets: { groceries: 2500, transport: 800, leisure: 600, other: 300 },
};

const DEMO_ITEMS: FinanceItem[] = [
  { id: '1', name: 'صندوق الطوارئ', category: 'goal', totalAmount: 24000, alreadySaved: 6000, targetMonth: 6, createdAt: Date.now() - 86400000 * 30 },
  { id: '2', name: 'قرض السيارة', category: 'debt', totalAmount: 30000, alreadySaved: 12000, targetMonth: 10, createdAt: Date.now() - 86400000 * 60 },
  { id: '3', name: 'مصاريف العيد', category: 'shock', totalAmount: 8000, alreadySaved: 2000, targetMonth: 3, createdAt: Date.now() - 86400000 * 15 },
];

const EMPTY_BASELINE: BaselineInput = {
  fixedSalary: 0,
  sideIncome: 0,
  currentBalance: 0,
  fixedBills: { rent: 0, utilities: 0, subscriptions: 0, other: 0 },
  variableBuckets: { groceries: 0, transport: 0, leisure: 0, other: 0 },
};

const EMPTY_WHAT_IF: WhatIfScenario = {};

// ============================================================================
// HOOKS
// ============================================================================

function useLocalStorage() {
  const load = useCallback((): { baseline: BaselineInput; items: FinanceItem[]; whatIf: WhatIfScenario } => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: StoredData = JSON.parse(raw);
        if (parsed.schemaVersion === CURRENT_SCHEMA_VERSION) {
          return { baseline: parsed.baseline, items: parsed.items, whatIf: parsed.whatIf };
        }
      }
    } catch (e) {
      console.warn('Failed to load data:', e);
    }
    return { baseline: EMPTY_BASELINE, items: [], whatIf: EMPTY_WHAT_IF };
  }, []);

  const save = useCallback((baseline: BaselineInput, items: FinanceItem[], whatIf: WhatIfScenario) => {
    try {
      const data: StoredData = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        baseline,
        items,
        whatIf,
        updatedAt: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save data:', e);
    }
  }, []);

  return { load, save };
}

function useForecast(baseline: BaselineInput, items: FinanceItem[], whatIf: WhatIfScenario): ForecastResult {
  return useMemo(() => computeForecast(baseline, items, whatIf), [baseline, items, whatIf]);
}

function useWhatIfDelta(baseline: BaselineInput, items: FinanceItem[], whatIf: WhatIfScenario) {
  return useMemo(() => {
    if (Object.keys(whatIf).length === 0) return null;
    return computeWhatIfDelta(baseline, items, whatIf);
  }, [baseline, items, whatIf]);
}

// ============================================================================
// COMPONENTS
// ============================================================================

function formatDH(amount: number): string {
  return new Intl.NumberFormat('ar-MA', { style: 'currency', currency: 'MAD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
}

function formatSignedNumber(amount: number): string {
  const abs = Math.abs(Math.round(amount));
  const formatted = new Intl.NumberFormat('ar-MA').format(abs);
  if (amount > 0) return `+${formatted}`;
  if (amount < 0) return `-${formatted}`;
  return formatted;
}

function ProgressBar({ pct, saved, total, monthlySlice, label }: { pct: number; saved: number; total: number; monthlySlice: number; label?: string }) {
  const clampedPct = Math.min(100, Math.max(0, pct));
  return (
    <div className="w-full" role="progressbar" aria-valuenow={Math.round(clampedPct)} aria-valuemin={0} aria-valuemax={100} aria-label={label || `Progress ${Math.round(clampedPct)}%`}>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-green-700">{darija.items.progress.saved}: {formatDH(saved)}</span>
        <span className="text-red-700">{darija.items.progress.remaining}: {formatDH(total - saved)}</span>
      </div>
      <div className="h-3 bg-gray-200 rounded-full overflow-hidden relative">
        <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${clampedPct}%` }} />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500/20 to-transparent pointer-events-none" style={{ width: `${100 - clampedPct}%`, left: `${clampedPct}%` }} />
      </div>
      <div className="flex justify-between text-xs mt-1">
        <span>{darija.items.progress.monthlySlice}: {formatDH(monthlySlice)}</span>
        <span className="font-medium">{Math.round(clampedPct)}%</span>
      </div>
    </div>
  );
}

function MilestoneCard({ month, label, balance, status, drivers }: { month: 4 | 8 | 12; label: string; balance: number; status: 'surplus' | 'deficit' | 'break-even'; drivers: string[] }) {
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

function TimelineChart({ monthly, currentBalance }: { monthly: ForecastResult['monthly']; currentBalance: number }) {
  const maxBalance = Math.max(...monthly.map(m => m.endingBalance), currentBalance, 0);
  const minBalance = Math.min(...monthly.map(m => m.endingBalance), currentBalance, 0);
  const range = maxBalance - minBalance || 1;
  const viewBoxWidth = 600;
  const viewBoxHeight = 160;
  const paddingX = 30;
  const paddingY = 20;
  const chartWidth = viewBoxWidth - 2 * paddingX;
  const chartHeight = viewBoxHeight - 2 * paddingY;

  const getX = (i: number) => paddingX + (i / 11) * chartWidth;
  const getY = (balance: number) => paddingY + (1 - (balance - minBalance) / range) * chartHeight;
  const zeroY = getY(0);

  return (
    <div className="bg-white rounded-xl border p-4" role="img" aria-label={darija.vision.timelineAriaLabel}>
      <h4 className="text-sm font-medium text-gray-700 mb-3 text-center">{darija.vision.timelineTitle}</h4>
      <div className="relative" style={{ width: '100%', height: viewBoxHeight }}>
        <svg viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polyline
            fill="url(#areaGradient)"
            stroke="#10b981"
            strokeWidth="1.5"
            points={monthly.map((m: ForecastResult['monthly'][0], i: number) => {
              return `${getX(i).toFixed(1)},${getY(m.endingBalance).toFixed(1)}`;
            }).join(' ')}
          />
          <line x1={paddingX} y1={zeroY} x2={viewBoxWidth - paddingX} y2={zeroY} stroke="#ef4444" strokeWidth="0.8" strokeDasharray="4,4" />
          {monthly.map((m: ForecastResult['monthly'][0], i: number) => {
            const x = getX(i);
            const y = getY(m.endingBalance);
            const isMilestone = m.isMilestone4 || m.isMilestone8 || m.isMilestone12;
            return (
              <g key={i}>
                <circle cx={x.toFixed(1)} cy={y.toFixed(1)} r={isMilestone ? 5 : 3.5} fill={isMilestone ? '#f59e0b' : '#10b981'} />
                {isMilestone && (
                  <text x={x.toFixed(1)} y={y - 10} textAnchor="middle" fontSize="10" fill="#f59e0b" fontWeight="bold" fontFamily="system-ui, sans-serif">
                    {m.isMilestone4 ? 'M4' : m.isMilestone8 ? 'M8' : 'M12'}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[10px] text-gray-400 px-1" style={{ bottom: '4px' }}>
          {monthly.filter((_: ForecastResult['monthly'][0], i: number) => i % 3 === 0 || i === 11).map((m: ForecastResult['monthly'][0], idx: number) => (
            <span key={idx} className="text-center w-[25%]">{m.label.split(' ')[0]}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function QuickCheckinModal({ isOpen, onClose, baseline, onSave }: { isOpen: boolean; onClose: () => void; baseline: BaselineInput; onSave: (b: BaselineInput) => void }) {
  if (!isOpen) return null;

  const handleSave = () => {
    onSave(baseline);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="checkin-title">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 rtl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 id="checkin-title" className="text-xl font-bold text-gray-900">{darija.checkin.title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none" aria-label={darija.a11y.closeModal}>×</button>
        </div>
        <p className="text-sm text-gray-500 mb-6">{darija.checkin.subtitle}</p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{darija.checkin.currentBalance}</label>
            <input type="number" value={baseline.currentBalance} onChange={e => onSave({ ...baseline, currentBalance: Number(e.target.value) || 0 })} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" placeholder={darija.checkin.currentBalanceHint} aria-label={darija.checkin.currentBalance} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{darija.checkin.fixedSalary}</label>
            <input type="number" value={baseline.fixedSalary} onChange={e => onSave({ ...baseline, fixedSalary: Number(e.target.value) || 0 })} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" placeholder={darija.checkin.fixedSalaryHint} aria-label={darija.checkin.fixedSalary} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{darija.checkin.sideIncome}</label>
            <input type="number" value={baseline.sideIncome} onChange={e => onSave({ ...baseline, sideIncome: Number(e.target.value) || 0 })} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" placeholder={darija.checkin.sideIncomeHint} aria-label={darija.checkin.sideIncome} />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50">{darija.common.cancel}</button>
          <button onClick={handleSave} className="flex-1 py-3 px-4 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700">{darija.common.save}</button>
        </div>
      </div>
    </div>
  );
}

function WhatIfPanel({ whatIf, onChange, onReset, onApply, delta, isOpen, onToggle }: { whatIf: WhatIfScenario; onChange: (w: WhatIfScenario) => void; onReset: () => void; onApply: () => void; delta: ReturnType<typeof computeWhatIfDelta> | null; isOpen: boolean; onToggle: () => void }) {
  const handleChange = (field: keyof WhatIfScenario, value: number) => {
    onChange({ ...whatIf, [field]: value });
  };

  return (
    <section className="bg-white rounded-2xl border p-6" aria-labelledby="whatif-title">
      <div className="flex items-center justify-between mb-4">
        <h3 id="whatif-title" className="text-lg font-bold text-gray-900 flex items-center gap-2">
          {darija.whatIf.title}
          <span className="text-sm text-gray-500">{darija.whatIf.subtitle}</span>
        </h3>
        <button onClick={onToggle} className="text-sm text-emerald-600 hover:underline" aria-label={isOpen ? 'طمس محاكي السيناريو' : 'إظهار محاكي السيناريو'}>
          {isOpen ? 'طمس' : 'إظهار'} {darija.whatIf.livePreview}
        </button>
      </div>

      {isOpen && (
        <div className="space-y-4 animate-slide-down">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{darija.whatIf.extraSaving} <span className="text-xs text-gray-400">({darija.common.perMonth})</span></label>
            <input type="number" value={whatIf.extraMonthlySaving || 0} onChange={e => handleChange('extraMonthlySaving', Number(e.target.value) || 0)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" placeholder={darija.whatIf.extraSavingHint} aria-label={darija.whatIf.extraSaving} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{darija.whatIf.extraExpense} <span className="text-xs text-gray-400">({darija.common.perMonth})</span></label>
            <input type="number" value={whatIf.extraMonthlyExpense || 0} onChange={e => handleChange('extraMonthlyExpense', Number(e.target.value) || 0)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent" placeholder={darija.whatIf.extraExpenseHint} aria-label={darija.whatIf.extraExpense} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{darija.whatIf.variableCut} <span className="text-xs text-gray-400">({darija.common.percent})</span></label>
            <input type="number" value={whatIf.variableSpendingCutPct || 0} onChange={e => handleChange('variableSpendingCutPct', Number(e.target.value) || 0)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent" placeholder={darija.whatIf.variableCutHint} aria-label={darija.whatIf.variableCut} max="100" min="0" />
          </div>

          {delta && (
            <div className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-200">
              <h4 className="font-medium text-gray-800 flex items-center gap-2">{darija.whatIf.livePreview}</h4>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-white rounded-lg border">
                  <div className="text-xs text-gray-500">{darija.whatIf.month4Impact}</div>
                  <div className={`text-xl font-bold ${delta.deltas.month4 >= 0 ? 'text-green-600' : 'text-red-600'} inline-block`} dir="ltr">
                    {formatSignedNumber(delta.deltas.month4)}
                  </div>
                </div>
                <div className="p-3 bg-white rounded-lg border">
                  <div className="text-xs text-gray-500">{darija.whatIf.month8Impact}</div>
                  <div className={`text-xl font-bold ${delta.deltas.month8 >= 0 ? 'text-green-600' : 'text-red-600'} inline-block`} dir="ltr">
                    {formatSignedNumber(delta.deltas.month8)}
                  </div>
                </div>
                <div className="p-3 bg-white rounded-lg border">
                  <div className="text-xs text-gray-500">{darija.whatIf.month12Impact}</div>
                  <div className={`text-xl font-bold ${delta.deltas.month12 >= 0 ? 'text-green-600' : 'text-red-600'} inline-block`} dir="ltr">
                    {formatSignedNumber(delta.deltas.month12)}
                  </div>
                </div>
              </div>
              <div className="pt-2 border-t border-gray-200">
                <div className="text-xs text-gray-500">{darija.whatIf.goalsImpact}</div>
                <div className="flex gap-4 text-sm mt-1">
                  {delta.deltas.goalCompletionChanges.map((g: { itemId: string; baselinePct: number; scenarioPct: number }) => (
                    <span key={g.itemId} className="text-gray-600">
                      {g.baselinePct}% → {g.scenarioPct}%
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button onClick={onReset} className="flex-1 py-3 px-4 border border-red-300 text-red-600 rounded-lg font-medium hover:bg-red-50">{darija.whatIf.reset}</button>
            <button onClick={onApply} className="flex-1 py-3 px-4 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700">{darija.whatIf.apply}</button>
          </div>
        </div>
      )}
    </section>
  );
}

function ItemList({ items, onAdd, onUpdate, onDelete, onAddPayment, forecast }: { items: FinanceItem[]; onAdd: (item: FinanceItem) => void; onUpdate: (item: FinanceItem) => void; onDelete: (id: string) => void; onAddPayment: (id: string, amount: number) => void; forecast: ForecastResult }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<FinanceItem>>({ name: '', category: 'goal', totalAmount: 0, alreadySaved: 0, targetMonth: 1 });

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

  if (items.length === 0 && !showForm) {
    return (
      <section className="bg-white rounded-2xl border p-6" aria-labelledby="items-title">
        <div className="flex items-center justify-between mb-4">
          <h3 id="items-title" className="text-lg font-bold text-gray-900">{darija.items.title}</h3>
          <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700">{darija.items.addButton}</button>
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
          <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700">{darija.items.addButton}</button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 rounded-xl border space-y-3 animate-slide-down">
          <h4 className="font-medium text-gray-800">{editingId ? darija.items.form.editTitle : darija.items.form.title}</h4>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{darija.items.form.name}</label>
            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" placeholder={darija.items.form.namePlaceholder} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{darija.items.form.category}</label>
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value as FinanceItem['category'] })} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500">
              <option value="goal">{darija.items.categories.goal}</option>
              <option value="shock">{darija.items.categories.shock}</option>
              <option value="debt">{darija.items.categories.debt}</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{darija.items.form.totalAmount}</label>
              <input type="number" value={form.totalAmount} onChange={e => setForm({ ...form, totalAmount: Number(e.target.value) || 0 })} required min="0" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{darija.items.form.alreadySaved}</label>
              <input type="number" value={form.alreadySaved} onChange={e => setForm({ ...form, alreadySaved: Number(e.target.value) || 0 })} min="0" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{darija.items.form.targetMonth} <span className="text-xs text-gray-400">({darija.items.form.targetMonthHint})</span></label>
            <input type="number" value={form.targetMonth} onChange={e => setForm({ ...form, targetMonth: Math.max(1, Number(e.target.value) || 1) })} required min="1" max="24" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50">{darija.common.cancel}</button>
            <button type="submit" className="flex-1 py-2 px-4 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700">{darija.common.save}</button>
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
                    <span className="text-lg">{item.category === 'goal' ? '🎯' : item.category === 'debt' ? '💳' : '⚡'}</span>
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
                  <button onClick={() => handleEdit(item)} className="p-2 text-gray-400 hover:text-gray-600" aria-label={`تعديل ${item.name}`}>✏️</button>
                  <button onClick={() => { if (confirm(darija.items.form.deleteConfirm)) onDelete(item.id); }} className="p-2 text-gray-400 hover:text-red-600" aria-label={`حذف ${item.name}`}>🗑️</button>
                </div>
              </div>

              <ProgressBar pct={progress?.progressPct || 0} saved={item.alreadySaved} total={item.totalAmount} monthlySlice={progress?.monthlySlice || 0} label={`${item.name}: ${Math.round(progress?.progressPct || 0)}%`} />

              <div className="flex gap-3 mt-3 pt-3 border-t border-gray-100">
                <button onClick={() => { const add = Math.ceil((item.totalAmount - item.alreadySaved) / Math.max(1, item.targetMonth)); onAddPayment(item.id, add); }} className="flex-1 py-2 px-3 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-100 flex items-center justify-center gap-1">
                  {darija.items.progress.addPayment}
                </button>
                <button onClick={() => { const amount = Number(prompt(darija.items.progress.addPaymentHint)); if (!isNaN(amount)) onAddPayment(item.id, amount); }} className="flex-1 py-2 px-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                  {darija.common.add} {darija.common.currencyShort}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function BillsSection({ bills, onChange }: { bills: BaselineInput['fixedBills']; onChange: (b: BaselineInput['fixedBills']) => void }) {
  return (
    <section className="bg-white rounded-2xl border p-6" aria-labelledby="bills-title">
      <h3 id="bills-title" className="text-lg font-bold text-gray-900 mb-1">{darija.bills.title}</h3>
      <p className="text-sm text-gray-500 mb-4">{darija.bills.subtitle}</p>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{darija.bills.rent}</label>
          <input type="number" value={bills.rent} onChange={e => onChange({ ...bills, rent: Number(e.target.value) || 0 })} min="0" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{darija.bills.utilities}</label>
          <input type="number" value={bills.utilities} onChange={e => onChange({ ...bills, utilities: Number(e.target.value) || 0 })} min="0" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{darija.bills.subscriptions}</label>
          <input type="number" value={bills.subscriptions} onChange={e => onChange({ ...bills, subscriptions: Number(e.target.value) || 0 })} min="0" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{darija.bills.other}</label>
          <input type="number" value={bills.other} onChange={e => onChange({ ...bills, other: Number(e.target.value) || 0 })} min="0" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" />
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
        <span className="text-gray-600">{darija.bills.total}</span>
        <span className="text-xl font-bold text-gray-900">{formatDH(bills.rent + bills.utilities + bills.subscriptions + bills.other)}</span>
      </div>
    </section>
  );
}

function BucketsSection({ buckets, onChange }: { buckets: BaselineInput['variableBuckets']; onChange: (b: BaselineInput['variableBuckets']) => void }) {
  return (
    <section className="bg-white rounded-2xl border p-6" aria-labelledby="buckets-title">
      <h3 id="buckets-title" className="text-lg font-bold text-gray-900 mb-1">{darija.buckets.title}</h3>
      <p className="text-sm text-gray-500 mb-4">{darija.buckets.subtitle}</p>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{darija.buckets.groceries}</label>
          <input type="number" value={buckets.groceries} onChange={e => onChange({ ...buckets, groceries: Number(e.target.value) || 0 })} min="0" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{darija.buckets.transport}</label>
          <input type="number" value={buckets.transport} onChange={e => onChange({ ...buckets, transport: Number(e.target.value) || 0 })} min="0" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{darija.buckets.leisure}</label>
          <input type="number" value={buckets.leisure} onChange={e => onChange({ ...buckets, leisure: Number(e.target.value) || 0 })} min="0" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{darija.buckets.other}</label>
          <input type="number" value={buckets.other} onChange={e => onChange({ ...buckets, other: Number(e.target.value) || 0 })} min="0" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" />
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
        <span className="text-gray-600">{darija.buckets.total}</span>
        <span className="text-xl font-bold text-gray-900">{formatDH(buckets.groceries + buckets.transport + buckets.leisure + buckets.other)}</span>
      </div>
    </section>
  );
}

function DataPersistence({ onExport, onImport, onLoadDemo }: { onExport: () => void; onImport: (file: File) => void; onLoadDemo: () => void }) {
  return (
    <section className="bg-white rounded-2xl border p-6 space-y-4" aria-labelledby="data-title">
      <h3 id="data-title" className="text-lg font-bold text-gray-900">{darija.data.exportTitle}</h3>
      <p className="text-sm text-gray-500">{darija.data.exportDesc}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button onClick={onExport} className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-right">
          <div className="font-medium text-gray-900">{darija.data.exportButton}</div>
          <div className="text-sm text-gray-500">JSON backup</div>
        </button>

        <div className="relative">
          <input type="file" accept=".json" onChange={e => { if (e.target.files?.[0]) onImport(e.target.files[0]); }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
          <label className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-right cursor-pointer">
            <div className="font-medium text-gray-900">{darija.data.importButton}</div>
            <div className="text-sm text-gray-500">{darija.data.importDesc}</div>
          </label>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-100">
        <p className="text-sm text-gray-500 mb-3">{darija.data.demoDesc}</p>
        <button onClick={onLoadDemo} className="w-full py-3 px-4 border border-emerald-200 bg-emerald-50 text-emerald-700 rounded-xl font-medium hover:bg-emerald-100 transition-colors">
          {darija.data.demoButton}
        </button>
      </div>

      <div className="pt-4 border-t border-gray-100 text-center">
        <button onClick={() => { if (confirm(darija.data.clearConfirm)) { localStorage.removeItem(STORAGE_KEY); window.location.reload(); } }} className="text-sm text-red-500 hover:underline">{darija.data.clearAll}</button>
      </div>
    </section>
  );
}

// ============================================================================
// MAIN APP
// ============================================================================

export default function App() {
  const { load, save } = useLocalStorage();
  const [baseline, setBaseline] = useState<BaselineInput>(() => {
    const { baseline: b } = load();
    return b;
  });
  const [items, setItems] = useState<FinanceItem[]>(() => {
    const { items: i } = load();
    return i;
  });
  const [whatIf, setWhatIf] = useState<WhatIfScenario>(() => {
    const { whatIf: w } = load();
    return w;
  });
  const [showCheckin, setShowCheckin] = useState(false);
  const [showWhatIf, setShowWhatIf] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [isLoaded] = useState(true);

  const forecast = useForecast(baseline, items, whatIf);
  const delta = useWhatIfDelta(baseline, items, whatIf);

  const persist = useCallback((newBaseline?: BaselineInput, newItems?: FinanceItem[], newWhatIf?: WhatIfScenario) => {
    save(newBaseline ?? baseline, newItems ?? items, newWhatIf ?? whatIf);
  }, [baseline, items, whatIf, save]);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const handleCheckinSave = (newBaseline: BaselineInput) => {
    setBaseline(newBaseline);
    persist(newBaseline);
    showToast(darija.checkin.savedToast);
  };

  const handleAddItem = (item: FinanceItem) => { setItems((prev: FinanceItem[]) => [...prev, item]); persist(baseline, [...items, item]); };
  const handleUpdateItem = (item: FinanceItem) => { setItems((prev: FinanceItem[]) => prev.map(i => i.id === item.id ? item : i)); persist(baseline, items.map(i => i.id === item.id ? item : i)); };
  const handleDeleteItem = (id: string) => { setItems((prev: FinanceItem[]) => prev.filter(i => i.id !== id)); persist(baseline, items.filter(i => i.id !== id)); };
  const handleAddPayment = (id: string, amount: number) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    const updated = { ...item, alreadySaved: Math.min(item.totalAmount, item.alreadySaved + amount) };
    handleUpdateItem(updated);
  };

  const handleBillsChange = (bills: BaselineInput['fixedBills']) => { setBaseline(prev => ({ ...prev, fixedBills: bills })); persist({ ...baseline, fixedBills: bills }); };
  const handleBucketsChange = (buckets: BaselineInput['variableBuckets']) => { setBaseline(prev => ({ ...prev, variableBuckets: buckets })); persist({ ...baseline, variableBuckets: buckets }); };

  const handleWhatIfChange = (w: WhatIfScenario) => { setWhatIf(w); persist(baseline, items, w); };
  const handleWhatIfReset = () => { setWhatIf(EMPTY_WHAT_IF); persist(baseline, items, EMPTY_WHAT_IF); showToast(darija.whatIf.resetToast); };
  const handleWhatIfApply = () => {
    const adjusted = { ...baseline };
    if (whatIf.extraMonthlySaving) adjusted.sideIncome = (adjusted.sideIncome || 0) + whatIf.extraMonthlySaving;
    if (whatIf.extraMonthlyExpense) adjusted.fixedBills = { ...adjusted.fixedBills, other: adjusted.fixedBills.other + whatIf.extraMonthlyExpense };
    if (whatIf.variableSpendingCutPct && whatIf.variableSpendingCutPct > 0) {
      const cut = 1 - whatIf.variableSpendingCutPct / 100;
      adjusted.variableBuckets = {
        groceries: Math.round(adjusted.variableBuckets.groceries * cut),
        transport: Math.round(adjusted.variableBuckets.transport * cut),
        leisure: Math.round(adjusted.variableBuckets.leisure * cut),
        other: Math.round(adjusted.variableBuckets.other * cut),
      };
    }
    setBaseline(adjusted);
    setWhatIf(EMPTY_WHAT_IF);
    persist(adjusted, items, EMPTY_WHAT_IF);
    showToast(darija.whatIf.appliedToast);
  };

  const handleExport = () => {
    const data: StoredData = { schemaVersion: CURRENT_SCHEMA_VERSION, baseline, items, whatIf, updatedAt: Date.now() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mizan-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const parsed: StoredData = JSON.parse(e.target?.result as string);
        if (parsed.schemaVersion === CURRENT_SCHEMA_VERSION) {
          setBaseline(parsed.baseline);
          setItems(parsed.items);
          setWhatIf(parsed.whatIf);
          persist(parsed.baseline, parsed.items, parsed.whatIf);
          showToast(darija.data.importSuccess);
        } else throw new Error('Invalid schema');
      } catch { showToast(darija.data.importError); }
    };
    reader.readAsText(file);
  };

  const handleLoadDemo = () => {
    setBaseline(DEMO_BASELINE);
    setItems(DEMO_ITEMS);
    setWhatIf(EMPTY_WHAT_IF);
    persist(DEMO_BASELINE, DEMO_ITEMS, EMPTY_WHAT_IF);
    showToast(darija.data.demoLoaded);
  };

  if (!isLoaded) return <div className="min-h-screen flex items-center justify-center">{darija.common.loading}</div>;

  const freeCashflow = baseline.fixedSalary + (baseline.sideIncome || 0) - (baseline.fixedBills.rent + baseline.fixedBills.utilities + baseline.fixedBills.subscriptions + baseline.fixedBills.other) - (baseline.variableBuckets.groceries + baseline.variableBuckets.transport + baseline.variableBuckets.leisure + baseline.variableBuckets.other) - forecast.totalMonthlyReserved;

  return (
    <div className="min-h-screen bg-gray-50 rtl">
      <style>{`
        @keyframes slide-down { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-slide-down { animation: slide-down 0.2s ease-out; }
      `}</style>

      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚖️</span>
            <h1 className="text-xl font-bold text-gray-900">{darija.app.name}</h1>
          </div>
          <p className="text-sm text-gray-500 hidden sm:block">{darija.app.tagline}</p>
        </div>
        <div className="border-t px-4 py-2 flex flex-wrap gap-2 text-sm">
          <button onClick={() => setShowCheckin(true)} className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg font-medium hover:bg-emerald-200">{darija.nav.quickCheckin}</button>
          <button onClick={() => setShowWhatIf(!showWhatIf)} className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg font-medium hover:bg-amber-200">{darija.nav.whatIf}</button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6 pb-24">
        {/* Top Summary */}
        <section className="bg-white rounded-2xl border p-6" aria-labelledby="summary-title">
          <h2 id="summary-title" className="text-lg font-bold text-gray-900 mb-4">{darija.vision.title}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-gray-50 border">
              <p className="text-sm text-gray-500">{darija.checkin.currentBalance}</p>
              <p className="text-2xl font-bold text-gray-900">{formatDH(baseline.currentBalance)}</p>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 border">
              <p className="text-sm text-gray-500">{darija.checkin.monthlyFreeCashflow}</p>
              <p className={`text-2xl font-bold ${freeCashflow >= 0 ? 'text-green-600' : 'text-red-600'} inline-block`} dir="ltr">
                {formatSignedNumber(freeCashflow)}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 border">
              <p className="text-sm text-gray-500">{darija.items.title}</p>
              <p className="text-2xl font-bold text-gray-900">{items.length}</p>
            </div>
          </div>
        </section>

        {/* Milestone Cards */}
        <section aria-labelledby="milestones-title">
          <h2 id="milestones-title" className="sr-only">{darija.vision.title}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {forecast.milestones.map((ms: ForecastResult['milestones'][0]) => (
              <MilestoneCard key={ms.month} month={ms.month} label={ms.label} balance={ms.projectedBalance} status={ms.status} drivers={ms.keyDrivers} />
            ))}
          </div>
        </section>

        {/* Timeline Chart */}
        <TimelineChart monthly={forecast.monthly} currentBalance={baseline.currentBalance} />

        {/* What-If Panel */}
        <WhatIfPanel whatIf={whatIf} onChange={handleWhatIfChange} onReset={handleWhatIfReset} onApply={handleWhatIfApply} delta={delta} isOpen={showWhatIf} onToggle={() => setShowWhatIf(!showWhatIf)} />

        {/* Items List */}
        <ItemList items={items} onAdd={handleAddItem} onUpdate={handleUpdateItem} onDelete={handleDeleteItem} onAddPayment={handleAddPayment} forecast={forecast} />

        {/* Bills & Buckets */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BillsSection bills={baseline.fixedBills} onChange={handleBillsChange} />
          <BucketsSection buckets={baseline.variableBuckets} onChange={handleBucketsChange} />
        </div>

        {/* Data Persistence */}
        <DataPersistence onExport={handleExport} onImport={handleImport} onLoadDemo={handleLoadDemo} />
      </main>

      <QuickCheckinModal isOpen={showCheckin} onClose={() => setShowCheckin(false)} baseline={baseline} onSave={handleCheckinSave} />

      {toast && (
        <div className="fixed bottom-4 left-4 right-4 sm:bottom-4 sm:left-auto sm:right-4 sm:w-80 z-50 animate-slide-down" role="alert" aria-live="polite">
          <div className="bg-gray-900 text-white px-4 py-3 rounded-xl shadow-lg">{toast}</div>
        </div>
      )}
    </div>
  );
}
