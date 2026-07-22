/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Transaction, Budget, SavingsGoal } from '../types.js';
import { ShieldCheck, TrendingUp, AlertTriangle, CheckCircle2, Sparkles, Award, ArrowUpRight, ArrowDownRight, Lightbulb, Zap, Info } from 'lucide-react';

interface FinancialHealthViewProps {
  transactions: Transaction[];
  budgets: Budget[];
  goals: SavingsGoal[];
  onNavigate?: (view: string) => void;
}

export default function FinancialHealthView({
  transactions,
  budgets,
  goals,
  onNavigate
}: FinancialHealthViewProps) {

  const now = new Date();
  const currentMonthStr = now.toISOString().slice(0, 7); // YYYY-MM
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthStr = prevMonth.toISOString().slice(0, 7);

  // --- Calculate Core Sub-scores ---
  // 1. Current Month Cash Flow
  const currentMonthTxs = transactions.filter(t => t.date.startsWith(currentMonthStr));
  const prevMonthTxs = transactions.filter(t => t.date.startsWith(prevMonthStr));

  const monthIncome = currentMonthTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const monthExpense = currentMonthTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const monthSaved = Math.max(0, monthIncome - monthExpense);

  const prevMonthIncome = prevMonthTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const prevMonthExpense = prevMonthTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const prevMonthSaved = Math.max(0, prevMonthIncome - prevMonthExpense);

  // Sub-score 1: Savings Rate (30%)
  const savingsRate = monthIncome > 0 ? (monthSaved / monthIncome) * 100 : 0;
  // Target rate is 20%+ savings for full 30 points
  const savingsRateScore = Math.min(30, Math.round((savingsRate / 20) * 30));

  // Sub-score 2: Budget Discipline (30%)
  const activeBudgets = budgets.filter(b => b.month === currentMonthStr);
  const categoryExpenses = currentMonthTxs
    .filter(t => t.type === 'expense')
    .reduce((acc: Record<string, number>, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});

  let budgetBreaches = 0;
  activeBudgets.forEach(b => {
    const spent = categoryExpenses[b.category] || 0;
    if (spent > b.amount) budgetBreaches++;
  });

  let budgetDisciplineScore = 30;
  if (activeBudgets.length > 0) {
    const breachRatio = budgetBreaches / activeBudgets.length;
    budgetDisciplineScore = Math.max(0, Math.round((1 - breachRatio) * 30));
  }

  // Sub-score 3: Income vs Expense Ratio (25%)
  const expRatio = monthIncome > 0 ? monthExpense / monthIncome : 1;
  let cashFlowScore = 25;
  if (expRatio > 1.0) cashFlowScore = 0;
  else if (expRatio > 0.8) cashFlowScore = 10;
  else if (expRatio > 0.5) cashFlowScore = 20;
  else cashFlowScore = 25;

  // Sub-score 4: Goal Progress (15%)
  let goalProgressScore = 15;
  if (goals.length > 0) {
    const avgCompletion = goals.reduce((sum, g) => {
      const pct = g.targetAmount > 0 ? Math.min(1, g.currentAmount / g.targetAmount) : 0;
      return sum + pct;
    }, 0) / goals.length;
    goalProgressScore = Math.round(avgCompletion * 15);
  }

  // Aggregate Financial Health Score out of 100
  const totalScore = Math.min(100, Math.max(0, savingsRateScore + budgetDisciplineScore + cashFlowScore + goalProgressScore));

  // Status Badge definition
  const getScoreStatus = (score: number) => {
    if (score >= 80) return { label: 'Excellent', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
    if (score >= 65) return { label: 'Good', color: 'text-teal-400 bg-teal-500/10 border-teal-500/30' };
    if (score >= 50) return { label: 'Average', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
    return { label: 'Needs Improvement', color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' };
  };

  const status = getScoreStatus(totalScore);

  // --- MODULE 6: AUTOMATIC SMART INSIGHTS GENERATION ---
  const generatedInsights: Array<{ id: string; type: 'warning' | 'success' | 'info'; title: string; desc: string }> = [];

  // Insight 1: Month-over-Month Category Spend Comparison
  const currentCatSpend: Record<string, number> = {};
  const prevCatSpend: Record<string, number> = {};

  currentMonthTxs.filter(t => t.type === 'expense').forEach(t => {
    currentCatSpend[t.category] = (currentCatSpend[t.category] || 0) + t.amount;
  });

  prevMonthTxs.filter(t => t.type === 'expense').forEach(t => {
    prevCatSpend[t.category] = (prevCatSpend[t.category] || 0) + t.amount;
  });

  Object.keys(currentCatSpend).forEach(cat => {
    const cur = currentCatSpend[cat];
    const prev = prevCatSpend[cat] || 0;
    if (prev > 0) {
      const diffPct = Math.round(((cur - prev) / prev) * 100);
      if (diffPct > 15) {
        generatedInsights.push({
          id: `spend-inc-${cat}`,
          type: 'warning',
          title: `Increased Category Spend on ${cat}`,
          desc: `You spent ${diffPct}% more on ${cat} this month (₹${cur.toLocaleString('en-IN')}) compared to last month (₹${prev.toLocaleString('en-IN')}).`
        });
      } else if (diffPct < -15) {
        generatedInsights.push({
          id: `spend-dec-${cat}`,
          type: 'success',
          title: `Smart Savings in ${cat}`,
          desc: `Great job! You cut ${cat} spending by ${Math.abs(diffPct)}% compared to last month.`
        });
      }
    }
  });

  // Insight 2: Savings Benchmark comparison
  const savingsDiff = monthSaved - prevMonthSaved;
  if (savingsDiff > 0) {
    generatedInsights.push({
      id: 'savings-boost',
      type: 'success',
      title: 'Savings Benchmark Surpassed',
      desc: `You saved ₹${savingsDiff.toLocaleString('en-IN')} more than last month! Total saved this month: ₹${monthSaved.toLocaleString('en-IN')}.`
    });
  } else if (savingsDiff < 0) {
    generatedInsights.push({
      id: 'savings-drop',
      type: 'warning',
      title: 'Savings Pace Slowdown',
      desc: `Your savings dropped by ₹${Math.abs(savingsDiff).toLocaleString('en-IN')} compared to last month.`
    });
  }

  // Insight 3: Budget Breaches
  activeBudgets.forEach(b => {
    const spent = currentCatSpend[b.category] || 0;
    if (spent > b.amount) {
      generatedInsights.push({
        id: `budget-exceeded-${b.category}`,
        type: 'warning',
        title: `Budget Exceeded in ${b.category}`,
        desc: `You exceeded your ₹${b.amount.toLocaleString('en-IN')} cap in ${b.category} by ₹${(spent - b.amount).toLocaleString('en-IN')}.`
      });
    }
  });

  // Fallback insights if list is small
  if (generatedInsights.length < 2) {
    generatedInsights.push({
      id: 'baseline-insight',
      type: 'info',
      title: 'Automated Cash Flow Tracking Active',
      desc: `Vyora continuously analyzes your UPI and ledger entries to produce real-time insights.`
    });
  }

  return (
    <div className="space-y-6">
      {/* MODULE 5: FINANCIAL HEALTH SCORE CARD */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block">Intelligent Diagnostic</span>
              <h1 className="text-2xl font-black text-white">Financial Health Score</h1>
            </div>
          </div>

          <span className={`text-xs font-black uppercase tracking-wider px-4 py-2 rounded-xl border ${status.color}`}>
            {status.label} Status
          </span>
        </div>

        {/* Hero Score Display */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center bg-slate-950/60 p-6 rounded-2xl border border-slate-800/80">
          <div className="flex flex-col items-center justify-center text-center space-y-2">
            <div className="text-5xl font-black text-white tracking-tight">
              {totalScore}<span className="text-xl text-slate-500 font-bold">/100</span>
            </div>
            <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Overall Financial Fitness Score</span>
          </div>

          {/* Sub-score breakdown */}
          <div className="md:col-span-2 space-y-3 border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-6">
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-400">Savings Rate (30% Weight)</span>
                <span className="text-emerald-400">{savingsRateScore} / 30</span>
              </div>
              <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(savingsRateScore / 30) * 100}%` }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-400">Budget Discipline (30% Weight)</span>
                <span className="text-blue-400">{budgetDisciplineScore} / 30</span>
              </div>
              <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(budgetDisciplineScore / 30) * 100}%` }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-400">Income vs Expense (25% Weight)</span>
                <span className="text-amber-400">{cashFlowScore} / 25</span>
              </div>
              <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(cashFlowScore / 25) * 100}%` }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-400">Goal Progress (15% Weight)</span>
                <span className="text-purple-400">{goalProgressScore} / 15</span>
              </div>
              <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full" style={{ width: `${(goalProgressScore / 15) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Actionable Suggestions */}
        <div className="space-y-3">
          <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-amber-400" /> Actionable Improvement Recommendations
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {savingsRate < 20 && (
              <div className="bg-slate-900/60 p-3.5 border border-slate-800 rounded-2xl space-y-1">
                <span className="font-bold text-amber-400 block">Boost Savings Rate</span>
                <p className="text-[11px] text-slate-400">Aim to save at least 20% of your incoming income every month before budgeting for discretionary items.</p>
              </div>
            )}
            {budgetBreaches > 0 && (
              <div className="bg-slate-900/60 p-3.5 border border-slate-800 rounded-2xl space-y-1">
                <span className="font-bold text-rose-400 block">Enforce Budget Caps</span>
                <p className="text-[11px] text-slate-400">You have {budgetBreaches} budget breaches this month. Adjust category limits or pause non-essential spending.</p>
              </div>
            )}
            {goals.length === 0 && (
              <div className="bg-slate-900/60 p-3.5 border border-slate-800 rounded-2xl space-y-1">
                <span className="font-bold text-blue-400 block">Set Savings Goals</span>
                <p className="text-[11px] text-slate-400">Create target goals for emergency reserves or big purchases to maximize your score.</p>
              </div>
            )}
            <div className="bg-slate-900/60 p-3.5 border border-slate-800 rounded-2xl space-y-1">
              <span className="font-bold text-emerald-400 block">Maintain Surplus Buffer</span>
              <p className="text-[11px] text-slate-400">Consistently locking month-end remaining balance into savings history strengthens financial discipline.</p>
            </div>
          </div>
        </div>
      </div>

      {/* MODULE 6: SMART INSIGHTS CARDS */}
      <div className="bg-slate-800/20 border border-slate-700/10 rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">Smart Financial Insights</h2>
            <p className="text-xs text-slate-400">Automated spending trends, category warnings, and savings benchmarks</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {generatedInsights.map((insight) => (
            <div 
              key={insight.id}
              className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 flex items-start gap-3 hover:border-slate-700 transition-colors"
            >
              <div className={`p-2 rounded-xl shrink-0 ${insight.type === 'warning' ? 'bg-rose-500/10 text-rose-400' : insight.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'}`}>
                {insight.type === 'warning' ? <AlertTriangle className="h-5 w-5" /> : insight.type === 'success' ? <Sparkles className="h-5 w-5" /> : <Info className="h-5 w-5" />}
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">{insight.title}</h3>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{insight.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
