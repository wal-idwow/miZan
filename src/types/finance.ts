// miZan — Core Finance Types
// All amounts in MAD (DH). Months are 0-indexed from "current month".

export type ItemCategory = 'goal' | 'shock' | 'debt';

export interface FinanceItem {
  id: string;
  name: string;
  category: ItemCategory;
  totalAmount: number;        // Total target amount (DH)
  alreadySaved: number;       // Amount already saved/paid (DH)
  targetMonth: number;        // 0 = current month, 1 = next month, ..., 11 = month 11, 12+ = beyond horizon
  createdAt: number;          // Unix ms
}

export interface FixedBills {
  rent: number;
  utilities: number;
  subscriptions: number;
  other: number;
}

export interface VariableBuckets {
  groceries: number;
  transport: number;
  leisure: number;
  other: number;
}

export interface BaselineInput {
  fixedSalary: number;           // Monthly fixed salary (DH)
  sideIncome: number;            // Optional irregular/side income (monthly average)
  fixedBills: FixedBills;
  variableBuckets: VariableBuckets;
  currentBalance: number;        // Real cash/bank balance right now
}

export interface WhatIfScenario {
  // Temporary adjustments for simulation only
  extraMonthlySaving?: number;     // e.g., +500 DH/month saved
  extraMonthlyExpense?: number;    // e.g., -3000 DH risk/expense
  variableSpendingCutPct?: number; // e.g., 10% cut on variable buckets
}

export interface MonthlyProjection {
  monthIndex: number;              // 0 = current month
  label: string;                   // e.g., "يناير 2025"
  startingBalance: number;
  salary: number;
  sideIncome: number;
  fixedBillsTotal: number;
  variableTotal: number;
  reservedForItems: number;        // Sum of monthly slices for goals/shocks/debts
  freeCashflow: number;            // Net after all deductions
  endingBalance: number;
  // Milestone markers
  isMilestone4?: boolean;
  isMilestone8?: boolean;
  isMilestone12?: boolean;
  // Item settlements this month
  itemSettlements: ItemSettlement[];
}

export interface ItemSettlement {
  itemId: string;
  itemName: string;
  category: ItemCategory;
  amount: number;                  // Full amount due/paid this month
  wasReserved: boolean;            // True if covered by prior reservations
}

export interface MilestoneCard {
  month: 4 | 8 | 12;
  label: string;
  projectedBalance: number;
  status: 'surplus' | 'deficit' | 'break-even';
  keyDrivers: string[];            // Human-readable summary for UI
}

export interface ItemProgress {
  item: FinanceItem;
  monthsRemaining: number;
  monthlySlice: number;
  progressPct: number;             // 0-100 (alreadySaved / totalAmount)
  savedAmount: number;
  remainingAmount: number;
}

export interface ForecastResult {
  baseline: BaselineInput;
  whatIf: WhatIfScenario;
  monthly: MonthlyProjection[];
  milestones: MilestoneCard[];
  itemProgress: ItemProgress[];
  // Summary
  totalMonthlyReserved: number;
  averageFreeCashflow: number;
  finalBalanceMonth12: number;
}

export interface StoredData {
  schemaVersion: number;
  baseline: BaselineInput;
  items: FinanceItem[];
  whatIf: WhatIfScenario;
  updatedAt: number;
}

export const EMPTY_BASELINE: BaselineInput = {
  fixedSalary: 0,
  sideIncome: 0,
  currentBalance: 0,
  fixedBills: { rent: 0, utilities: 0, subscriptions: 0, other: 0 },
  variableBuckets: { groceries: 0, transport: 0, leisure: 0, other: 0 },
};

export const EMPTY_WHAT_IF: WhatIfScenario = {};

export const STORAGE_KEY = 'mizan-data';
export const CURRENT_SCHEMA_VERSION = 1;