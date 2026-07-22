/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface WealthStructure {
  savingsAccount: number;
  fixedDeposit: number;
  recurringDeposit: number;
  sip: number;
  mutualFunds: number;
  gold: number;
  emergencyFund: number;
}

export interface MonthlySavingsLog {
  month: string;
  amount: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  securityQuestion: string;
  securityAnswer: string;
  theme: 'light' | 'dark';
  financialScore: number;
  wealth?: WealthStructure;
  monthlySavingsHistory?: MonthlySavingsLog[];
}

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  type: TransactionType;
  category: string;
  description: string;
  paymentMethod?: string;
  date: string; // YYYY-MM-DD
  notes?: string;
  isRecurring?: boolean;
  recurrenceInterval?: 'weekly' | 'monthly' | 'none';
  upiRef?: string;
  isOffline?: boolean;
  syncStatus?: 'synced' | 'pending';
  createdAt?: string;
  updatedAt?: string;
}

export interface Budget {
  id: string;
  userId: string;
  category: string;
  amount: number; // monthly cap
  month: string; // YYYY-MM
}

export interface SavingsGoal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  dateCreated: string;
  targetDate?: string;
}

export interface CustomCategory {
  id: string;
  userId: string;
  name: string;
  type: TransactionType | 'both';
  icon?: string;
  color?: string;
  createdAt?: string;
}

export type ReminderType = 'salary' | 'emi' | 'bill';

export interface Reminder {
  id: string;
  userId: string;
  title: string;
  amount: number;
  dueDate: string; // YYYY-MM-DD
  type: ReminderType;
  isPaid: boolean;
  isRecurring?: boolean;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  rewardPoints: number;
  targetValue: number;
  currentValue: number;
  isCompleted: boolean;
  type: 'expense_cap' | 'savings_add' | 'no_spend_day';
}

export interface Achievement {
  id: string;
  userId: string;
  title: string;
  description: string;
  icon: string;
  dateEarned: string;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpense: number;
  currentBalance: number;
  totalSavings: number;
  totalBudget: number;
  financialScore: number;
}
