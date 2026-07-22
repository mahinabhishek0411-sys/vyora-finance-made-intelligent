/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Budget, Transaction, CustomCategory } from '../types.js';
import { Plus, Trash2, Edit3, ShieldCheck, AlertTriangle, CheckCircle, Info, PieChart, AlertCircle, ArrowUpRight } from 'lucide-react';

interface BudgetsViewProps {
  budgets: Budget[];
  transactions: Transaction[];
  customCategories: CustomCategory[];
  onAddBudget: (budget: Omit<Budget, 'id' | 'userId'>) => Promise<void>;
  onEditBudget?: (id: string, budget: Partial<Budget>) => Promise<void>;
  onDeleteBudget: (id: string) => Promise<void>;
}

export default function BudgetsView({
  budgets,
  transactions,
  customCategories,
  onAddBudget,
  onEditBudget,
  onDeleteBudget
}: BudgetsViewProps) {

  const PRESET_CATEGORIES = [
    'Food', 'Travel', 'Shopping', 'Rent', 'Electricity', 'Water Bill', 
    'Internet', 'Medical', 'Education', 'Entertainment', 'Others'
  ];

  const categories = Array.from(new Set([
    ...PRESET_CATEGORIES, 
    ...customCategories.map(c => c.name)
  ]));

  const now = new Date();
  const currentMonthStr = now.toISOString().slice(0, 7); // YYYY-MM

  // States
  const [selectedCategory, setSelectedCategory] = useState(categories[0]);
  const [limitAmount, setLimitAmount] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);

  // Edit / Delete Modals State
  const [editBudget, setEditBudget] = useState<Budget | null>(null);
  const [editLimitVal, setEditLimitVal] = useState('');
  const [deleteConfirmBudget, setDeleteConfirmBudget] = useState<Budget | null>(null);

  // Calculate current month's category expenses
  const categoryExpenses = transactions
    .filter(t => t.type === 'expense' && t.date.startsWith(selectedMonth))
    .reduce((acc: Record<string, number>, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});

  const monthBudgets = budgets.filter(b => b.month === selectedMonth);

  // Total monthly calculations
  const totalBudget = monthBudgets.reduce((sum, b) => sum + b.amount, 0);
  const totalBudgetUsed = monthBudgets.reduce((sum, b) => sum + (categoryExpenses[b.category] || 0), 0);
  const totalRemaining = totalBudget - totalBudgetUsed;
  const totalPctUsed = totalBudget > 0 ? Math.min(100, Math.round((totalBudgetUsed / totalBudget) * 100)) : 0;

  const handleCreateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!limitAmount || Number(limitAmount) <= 0) return;

    await onAddBudget({
      category: selectedCategory,
      amount: Number(limitAmount),
      month: selectedMonth
    });

    setLimitAmount('');
  };

  const handleUpdateBudgetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editBudget || !editLimitVal || Number(editLimitVal) <= 0) return;

    if (onEditBudget) {
      await onEditBudget(editBudget.id, { amount: Number(editLimitVal) });
    } else {
      await onAddBudget({
        category: editBudget.category,
        amount: Number(editLimitVal),
        month: editBudget.month
      });
    }

    setEditBudget(null);
    setEditLimitVal('');
  };

  // Helper to trigger warnings at 50%, 75%, 90%, 100%
  const getBudgetWarningBadge = (pct: number, isExceeded: boolean) => {
    if (isExceeded || pct >= 100) {
      return (
        <span className="flex items-center gap-1 text-[10px] font-black text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/30 animate-pulse">
          <AlertTriangle className="h-3 w-3 text-rose-400" /> 100% Exceeded
        </span>
      );
    }
    if (pct >= 90) {
      return (
        <span className="flex items-center gap-1 text-[10px] font-black text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
          <AlertCircle className="h-3 w-3 text-rose-400" /> 90% Critical Warning
        </span>
      );
    }
    if (pct >= 75) {
      return (
        <span className="flex items-center gap-1 text-[10px] font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
          <AlertCircle className="h-3 w-3 text-amber-400" /> 75% Budget Warning
        </span>
      );
    }
    if (pct >= 50) {
      return (
        <span className="flex items-center gap-1 text-[10px] font-black text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded-full border border-yellow-500/20">
          <Info className="h-3 w-3 text-yellow-400" /> 50% Budget Reached
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
        <CheckCircle className="h-3 w-3 text-emerald-400" /> On Track
      </span>
    );
  };

  return (
    <div className="space-y-6">

      {/* MODULE 1: SUMMARY HEADER CARD (Total Budget, Used, Remaining, % Used, Progress Bar) */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <PieChart className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-widest block">Monthly Budget Overview</span>
              <h1 className="text-xl font-black text-white">Target Month: {selectedMonth}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400 font-bold">Switch Month:</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:border-emerald-500 outline-none"
            />
          </div>
        </div>

        {/* 4 Core Summary Stat Tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
          <div className="bg-slate-950/40 border border-slate-800/80 p-4 rounded-2xl">
            <span className="text-[10px] uppercase font-extrabold text-slate-500 block">Total Budget Cap</span>
            <span className="text-lg font-black text-white">₹{totalBudget.toLocaleString('en-IN')}</span>
          </div>

          <div className="bg-slate-950/40 border border-slate-800/80 p-4 rounded-2xl">
            <span className="text-[10px] uppercase font-extrabold text-slate-500 block">Budget Used</span>
            <span className="text-lg font-black text-amber-400">₹{totalBudgetUsed.toLocaleString('en-IN')}</span>
          </div>

          <div className="bg-slate-950/40 border border-slate-800/80 p-4 rounded-2xl">
            <span className="text-[10px] uppercase font-extrabold text-slate-500 block">Remaining Budget</span>
            <span className={`text-lg font-black ${totalRemaining >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              ₹{totalRemaining.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="bg-slate-950/40 border border-slate-800/80 p-4 rounded-2xl">
            <span className="text-[10px] uppercase font-extrabold text-slate-500 block">Utilization Rate</span>
            <span className="text-lg font-black text-blue-400">{totalPctUsed}%</span>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="space-y-1.5 pt-2">
          <div className="flex justify-between text-xs font-semibold text-slate-400">
            <span>Overall Spending Progress</span>
            <span>{totalPctUsed}% Utilized</span>
          </div>
          <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${totalPctUsed > 90 ? 'bg-rose-500' : totalPctUsed > 75 ? 'bg-amber-500' : 'bg-emerald-500'}`}
              style={{ width: `${totalPctUsed}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Grid: Create form + Category Budgets List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create / Configure Budget Cap */}
        <div className="bg-slate-800/20 border border-slate-700/10 rounded-3xl p-6 lg:col-span-1 space-y-4 h-fit">
          <div>
            <h2 className="text-base font-bold text-white">Configure Category Cap</h2>
            <p className="text-xs text-slate-400">Establish a monthly spending limit for specific categories.</p>
          </div>

          <form onSubmit={handleCreateBudget} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-slate-900/60 border border-slate-700/60 rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Monthly Limit (INR)</label>
              <div className="relative">
                <span className="absolute left-4 top-2.5 text-sm text-slate-500 font-bold">₹</span>
                <input
                  type="number"
                  required
                  placeholder="10000"
                  value={limitAmount}
                  onChange={(e) => setLimitAmount(e.target.value)}
                  className="w-full bg-slate-900/60 border border-slate-700/60 rounded-xl pl-8 pr-4 py-2 text-sm text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Target Month</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full bg-slate-900/60 border border-slate-700/60 rounded-xl px-4 py-2 text-sm text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Enforce Budget Cap
            </button>
          </form>
        </div>

        {/* Budget list & progress bars */}
        <div className="bg-slate-800/10 border border-slate-700/10 rounded-3xl p-6 lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
            <div>
              <h2 className="text-base font-bold text-white">Active Category Budgets ({selectedMonth})</h2>
              <p className="text-xs text-slate-400">Automated warning status generated at 50%, 75%, 90%, and 100% limit</p>
            </div>
          </div>

          {monthBudgets.length === 0 ? (
            <div className="text-center py-20 text-xs text-slate-500 border border-dashed border-slate-700/50 rounded-2xl">
              No custom budget caps configured for {selectedMonth}. Create a budget on the left to start tracking!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {monthBudgets.map((b) => {
                const spent = categoryExpenses[b.category] || 0;
                const remaining = b.amount - spent;
                const pct = b.amount > 0 ? Math.min(100, Math.round((spent / b.amount) * 100)) : 0;
                const exceeded = spent > b.amount;

                return (
                  <div 
                    key={b.id}
                    className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between space-y-3 relative overflow-hidden"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-500">Category Cap</span>
                        <h3 className="text-sm font-black text-white mt-0.5">{b.category}</h3>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditBudget(b);
                            setEditLimitVal(b.amount.toString());
                          }}
                          className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
                          title="Edit Budget"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmBudget(b)}
                          className="p-1 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                          title="Remove Limit"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[11px] font-semibold">
                        <span className="text-slate-400">Spent: ₹{spent.toLocaleString('en-IN')}</span>
                        <span className={exceeded ? 'text-rose-400' : 'text-slate-200'}>
                          Limit: ₹{b.amount.toLocaleString('en-IN')}
                        </span>
                      </div>
                      
                      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${exceeded ? 'bg-rose-500' : pct >= 90 ? 'bg-rose-500' : pct >= 75 ? 'bg-amber-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-emerald-500'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>

                      <div className="flex justify-between items-center text-[10px] pt-1">
                        {getBudgetWarningBadge(pct, exceeded)}
                        {exceeded ? (
                          <span className="text-rose-400 font-bold">
                            Exceeded by ₹{Math.abs(remaining).toLocaleString('en-IN')}
                          </span>
                        ) : (
                          <span className="text-slate-400">
                            ₹{remaining.toLocaleString('en-IN')} left
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Budget Alerts Rules Summary */}
      <div className="bg-slate-800/10 border border-slate-700/10 rounded-3xl p-6 space-y-3">
        <div className="flex items-center gap-2 text-xs font-extrabold text-white uppercase tracking-wider">
          <ShieldCheck className="h-4.5 w-4.5 text-emerald-400" />
          <span>Automated Warning Rules Engine</span>
        </div>
        <p className="text-xs text-slate-400">
          Vyora automatically monitors category spending and produces instant alerts at key thresholds:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-900/40 p-3.5 border border-slate-800 rounded-2xl">
            <span className="font-extrabold text-yellow-400 block mb-1">🟡 50% Threshold</span>
            <p className="text-[11px] text-slate-400">Halfway mark indicator. Keeps spending pace balanced.</p>
          </div>
          <div className="bg-slate-900/40 p-3.5 border border-slate-800 rounded-2xl">
            <span className="font-extrabold text-amber-400 block mb-1">🟠 75% Warning</span>
            <p className="text-[11px] text-slate-400">Triggers an orange warning. Recommends curbing non-essentials.</p>
          </div>
          <div className="bg-slate-900/40 p-3.5 border border-slate-800 rounded-2xl">
            <span className="font-extrabold text-rose-400 block mb-1">🚨 90% Critical Alert</span>
            <p className="text-[11px] text-slate-400">Near-limit notification. High priority alert status.</p>
          </div>
          <div className="bg-slate-900/40 p-3.5 border border-slate-800 rounded-2xl">
            <span className="font-extrabold text-rose-500 block mb-1">🔴 100% Breached</span>
            <p className="text-[11px] text-slate-400">Budget cap exceeded. Highlights overspending in red.</p>
          </div>
        </div>
      </div>

      {/* Edit Budget Modal */}
      {editBudget && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 relative shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Edit Budget Cap</h3>
            <p className="text-xs text-slate-400 mb-4">
              Modify the spending limit for category <span className="text-emerald-400 font-bold">{editBudget.category}</span> ({editBudget.month}).
            </p>

            <form onSubmit={handleUpdateBudgetSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">New Monthly Limit (INR)</label>
                <div className="relative">
                  <span className="absolute left-4 top-2.5 text-sm text-slate-500 font-bold">₹</span>
                  <input
                    type="number"
                    required
                    placeholder="15000"
                    value={editLimitVal}
                    onChange={(e) => setEditLimitVal(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-4 py-2 text-sm text-white focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditBudget(null)}
                  className="flex-1 py-2 px-4 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmBudget && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 relative shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2">Remove Budget Limit?</h3>
            <p className="text-xs text-slate-400 mb-6">
              Are you sure you want to remove the budget cap for <span className="font-bold text-white">{deleteConfirmBudget.category}</span> permanently?
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmBudget(null)}
                className="flex-1 py-2 px-4 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  await onDeleteBudget(deleteConfirmBudget.id);
                  setDeleteConfirmBudget(null);
                }}
                className="flex-1 py-2 px-4 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Remove Limit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
