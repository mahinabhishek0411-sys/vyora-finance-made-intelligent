/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Transaction, SavingsGoal, Budget, Challenge, Achievement, Reminder } from '../types.js';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  PiggyBank, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Award, 
  Target, 
  AlertTriangle,
  Flame,
  CheckCircle2,
  Hourglass
} from 'lucide-react';
import { motion } from 'motion/react';
// @ts-ignore
import logoUrl from '../assets/images/vyora_logo_1784370945595.jpg';

interface DashboardViewProps {
  transactions: Transaction[];
  goals: SavingsGoal[];
  budgets: Budget[];
  challenges: Challenge[];
  achievements: Achievement[];
  reminders: Reminder[];
  onNavigate: (view: string) => void;
}

export default function DashboardView({ 
  transactions, 
  goals, 
  budgets, 
  challenges, 
  achievements, 
  reminders,
  onNavigate 
}: DashboardViewProps) {

  // Current Month/Year calculations
  const now = new Date();
  const currentMonthStr = now.toISOString().slice(0, 7); // YYYY-MM

  // Calculate high level summaries
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const currentBalance = totalIncome - totalExpense;

  const totalSavings = goals.reduce((sum, g) => sum + g.currentAmount, 0);

  // Budgets for current month
  const activeBudgets = budgets.filter(b => b.month === currentMonthStr);
  const totalBudgetLimit = activeBudgets.reduce((sum, b) => sum + b.amount, 0);

  // Total spent in budgeted categories for current month
  const categoryExpenses = transactions
    .filter(t => t.type === 'expense' && t.date.startsWith(currentMonthStr))
    .reduce((acc: Record<string, number>, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});

  const totalBudgetSpent = activeBudgets.reduce((sum, b) => {
    const spent = categoryExpenses[b.category] || 0;
    return sum + spent;
  }, 0);

  // Filter recent transactions (last 5)
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  // Next upcoming pending reminder
  const nextReminder = reminders
    .filter(r => !r.isPaid)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];

  // Calculate dynamic financial score
  const hasTransactions = transactions.length > 0;
  const savingsRatio = totalIncome > 0 ? (totalSavings / totalIncome) : 0;
  const expenseRatio = totalIncome > 0 ? (totalExpense / totalIncome) : 0;
  
  let financialScore = 650; // default base
  if (hasTransactions) {
    if (expenseRatio < 0.5) financialScore += 100;
    else if (expenseRatio > 0.9) financialScore -= 80;
    
    if (savingsRatio > 0.2) financialScore += 80;
    
    // Add points for budget compliance
    const violatedBudgets = activeBudgets.filter(b => (categoryExpenses[b.category] || 0) > b.amount).length;
    if (activeBudgets.length > 0 && violatedBudgets === 0) {
      financialScore += 50;
    } else {
      financialScore -= violatedBudgets * 20;
    }
  }
  financialScore = Math.min(850, Math.max(300, financialScore));

  const getScoreColor = (score: number) => {
    if (score >= 750) return 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5';
    if (score >= 650) return 'text-amber-400 border-amber-500/20 bg-amber-500/5';
    return 'text-rose-400 border-rose-500/20 bg-rose-500/5';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 750) return 'Excellent';
    if (score >= 650) return 'Good';
    return 'Needs Attention';
  };

  return (
    <div className="space-y-6">
      {/* Welcome banner & Score Index */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div 
          whileHover={{ y: -4, scale: 1.01, boxShadow: "0 12px 30px -10px rgba(16,185,129,0.15)" }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="lg:col-span-2 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/40 rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 h-44 w-44">
            <img
              src={logoUrl}
              alt="Vyora Logo watermark"
              className="h-full w-full object-contain filter grayscale brightness-125"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="space-y-2 relative z-10">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-400 tracking-wider uppercase bg-emerald-500/10 px-3 py-1 rounded-full flex items-center gap-1.5">
                <img
                  src={logoUrl}
                  alt=""
                  className="h-3 w-3 object-contain rounded"
                  referrerPolicy="no-referrer"
                />
                Intelligence Engine Active
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Master Your Money Mindset
            </h1>
            <p className="text-sm text-slate-400 max-w-md">
              Welcome back to Vyora — Finance Made Intelligent. Your financial portfolio is live. Analyze your expenses, commit to savings goals, and unlock challenges.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-4 relative z-10">
            <button 
              onClick={() => onNavigate('transactions')}
              className="flex items-center gap-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-semibold rounded-xl transition-all cursor-pointer"
            >
              <ArrowUpRight className="h-4 w-4" /> Add Income / Expense
            </button>
            <button 
              onClick={() => onNavigate('advisor')}
              className="flex items-center gap-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
            >
              <Flame className="h-4 w-4 text-amber-400 animate-pulse" /> Consult AI Advisor
            </button>
          </div>
        </motion.div>

        {/* Financial Score Card */}
        <motion.div 
          whileHover={{ y: -4, scale: 1.02, boxShadow: "0 12px 30px -10px rgba(0,0,0,0.5)" }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="bg-slate-800/60 border border-slate-700/30 rounded-3xl p-6 flex flex-col items-center justify-center text-center cursor-pointer"
        >
          <div className="relative flex items-center justify-center">
            <svg className="w-28 h-28 transform -rotate-90">
              <circle
                cx="56"
                cy="56"
                r="48"
                stroke="currentColor"
                strokeWidth="6"
                className="text-slate-700"
                fill="transparent"
              />
              <circle
                cx="56"
                cy="56"
                r="48"
                stroke="currentColor"
                strokeWidth="8"
                className="text-emerald-500"
                fill="transparent"
                strokeDasharray={301.6}
                strokeDashoffset={301.6 - (301.6 * (financialScore - 300)) / 550}
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-2xl font-black text-white">{financialScore}</span>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Max 850</span>
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-bold text-slate-200">Financial Fitness Index</h3>
            <span className={`inline-block text-xs font-semibold mt-1 px-3 py-0.5 rounded-full border ${getScoreColor(financialScore)}`}>
              {getScoreLabel(financialScore)}
            </span>
          </div>
        </motion.div>
      </div>

      {/* MODULE 7: MAIN METRIC CARDS (Budget, Savings, Goals, Health, Monthly Savings) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* 1. Net Balance */}
        <motion.div 
          onClick={() => onNavigate('transactions')}
          whileHover={{ y: -6, scale: 1.03, boxShadow: "0 12px 25px -10px rgba(59,130,246,0.2)" }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className="bg-slate-800/40 border border-slate-700/20 hover:border-blue-500/20 transition-all rounded-3xl p-5 flex flex-col justify-between cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Net Balance</span>
            <div className="h-8 w-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className={`text-xl md:text-2xl font-black ${currentBalance >= 0 ? 'text-white' : 'text-rose-400'}`}>
              ₹{currentBalance.toLocaleString('en-IN')}
            </span>
            <p className="text-[10px] text-slate-500 mt-1">Available Ledger Cash</p>
          </div>
        </motion.div>

        {/* 2. Budget Card */}
        <motion.div 
          onClick={() => onNavigate('budget')}
          whileHover={{ y: -6, scale: 1.03, boxShadow: "0 12px 25px -10px rgba(20,184,166,0.2)" }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className="bg-slate-800/40 border border-slate-700/20 hover:border-teal-500/20 transition-all rounded-3xl p-5 flex flex-col justify-between cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Monthly Budget</span>
            <div className="h-8 w-8 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-xl md:text-2xl font-black text-white">₹{totalBudgetLimit.toLocaleString('en-IN')}</span>
            <p className="text-[10px] text-slate-500 mt-1">
              Spent: ₹{totalBudgetSpent.toLocaleString('en-IN')} ({totalBudgetLimit > 0 ? Math.round((totalBudgetSpent / totalBudgetLimit) * 100) : 0}%)
            </p>
          </div>
        </motion.div>

        {/* 3. Savings Card */}
        <motion.div 
          onClick={() => onNavigate('savings')}
          whileHover={{ y: -6, scale: 1.03, boxShadow: "0 12px 25px -10px rgba(16,185,129,0.2)" }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className="bg-slate-800/40 border border-slate-700/20 hover:border-emerald-500/20 transition-all rounded-3xl p-5 flex flex-col justify-between cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Current Savings</span>
            <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <PiggyBank className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-xl md:text-2xl font-black text-emerald-400">₹{(Math.max(0, currentBalance) + totalSavings).toLocaleString('en-IN')}</span>
            <p className="text-[10px] text-slate-500 mt-1">Total Accumulated Savings</p>
          </div>
        </motion.div>

        {/* 4. Goals Card */}
        <motion.div 
          onClick={() => onNavigate('goals')}
          whileHover={{ y: -6, scale: 1.03, boxShadow: "0 12px 25px -10px rgba(245,158,11,0.2)" }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className="bg-slate-800/40 border border-slate-700/20 hover:border-amber-500/20 transition-all rounded-3xl p-5 flex flex-col justify-between cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Active Goals</span>
            <div className="h-8 w-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Target className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-xl md:text-2xl font-black text-white">{goals.length} Goals</span>
            <p className="text-[10px] text-slate-500 mt-1">Target: ₹{totalSavings.toLocaleString('en-IN')} saved</p>
          </div>
        </motion.div>

        {/* 5. Health Score Card */}
        <motion.div 
          onClick={() => onNavigate('health')}
          whileHover={{ y: -6, scale: 1.03, boxShadow: "0 12px 25px -10px rgba(168,85,247,0.2)" }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className="bg-slate-800/40 border border-slate-700/20 hover:border-purple-500/20 transition-all rounded-3xl p-5 flex flex-col justify-between cursor-pointer col-span-2 lg:col-span-1"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Financial Health</span>
            <div className="h-8 w-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-xl md:text-2xl font-black text-purple-400">{Math.round((financialScore / 850) * 100)}/100</span>
            <p className="text-[10px] text-slate-500 mt-1">{getScoreLabel(financialScore)} Rating</p>
          </div>
        </motion.div>
      </div>

      {/* Progress & Quick Stats / Active Reminders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Budget Progress Bars */}
        <motion.div 
          whileHover={{ y: -4, scale: 1.01, boxShadow: "0 12px 30px -10px rgba(0,0,0,0.4)" }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="lg:col-span-2 bg-slate-800/20 border border-slate-700/10 rounded-3xl p-6 space-y-4"
        >
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-base font-bold text-white">Monthly Budget Caps</h2>
              <p className="text-xs text-slate-400">Current spending limits set for budgeted categories</p>
            </div>
            <button 
              onClick={() => onNavigate('budget')}
              className="text-xs text-emerald-400 hover:underline"
            >
              Plan Budgets
            </button>
          </div>

          {activeBudgets.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500 border border-dashed border-slate-700/50 rounded-2xl">
              No active category budget caps set for {currentMonthStr}.
            </div>
          ) : (
            <div className="space-y-4">
              {activeBudgets.slice(0, 3).map((b) => {
                const spent = categoryExpenses[b.category] || 0;
                const pct = b.amount > 0 ? Math.min(100, Math.round((spent / b.amount) * 100)) : 0;
                const isOver = spent > b.amount;

                return (
                  <div key={b.id} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-300">{b.category}</span>
                      <span className={isOver ? 'text-rose-400' : 'text-slate-400'}>
                        ₹{spent.toLocaleString('en-IN')} / ₹{b.amount.toLocaleString('en-IN')} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${isOver ? 'bg-rose-500' : pct > 85 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    {isOver && (
                      <div className="flex items-center gap-1 text-[10px] text-rose-400 font-medium">
                        <AlertTriangle className="h-3.5 w-3.5" /> Budget exceeded by ₹{(spent - b.amount).toLocaleString('en-IN')}!
                      </div>
                    )}
                  </div>
                );
              })}
              {activeBudgets.length > 3 && (
                <div className="text-center">
                  <button 
                    onClick={() => onNavigate('budget')}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    View other {activeBudgets.length - 3} categories
                  </button>
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Right Column: Next Reminder & Fast Alerts */}
        <motion.div 
          whileHover={{ y: -4, scale: 1.01, boxShadow: "0 12px 30px -10px rgba(0,0,0,0.4)" }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="bg-slate-800/20 border border-slate-700/10 rounded-3xl p-6 flex flex-col justify-between space-y-4"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white">Upcoming Bill Alerts</h3>
              <button 
                onClick={() => onNavigate('reminders')}
                className="text-[10px] text-emerald-400 hover:underline"
              >
                View Hub
              </button>
            </div>

            {nextReminder ? (
              <div className="bg-slate-900/60 border border-slate-700/40 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className={`text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded ${nextReminder.type === 'emi' ? 'bg-rose-500/10 text-rose-400' : nextReminder.type === 'bill' ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                      {nextReminder.type}
                    </span>
                    <h4 className="text-xs font-bold text-white mt-1.5">{nextReminder.title}</h4>
                    <span className="text-[10px] text-slate-500">Due: {nextReminder.dueDate}</span>
                  </div>
                  <span className="text-sm font-extrabold text-white">₹{nextReminder.amount.toLocaleString('en-IN')}</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-slate-500 border border-dashed border-slate-700/50 rounded-2xl">
                All bills and salaries settled! No pending reminders.
              </div>
            )}
          </div>

          <div className="border-t border-slate-800/60 pt-4 space-y-2">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quick Metrics</h4>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-slate-950/20 rounded-xl p-2.5">
                <span className="block text-[10px] text-slate-500">Highest Expense</span>
                <span className="text-xs font-extrabold text-white">
                  ₹{transactions.filter(t => t.type === 'expense').reduce((max, t) => t.amount > max ? t.amount : max, 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="bg-slate-950/20 rounded-xl p-2.5">
                <span className="block text-[10px] text-slate-500">Reminders Hub</span>
                <span className="text-xs font-extrabold text-white">
                  {reminders.filter(r => !r.isPaid).length} Pending
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Challenges & Achievements & Recent Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Recent Transactions */}
        <motion.div 
          whileHover={{ y: -4, scale: 1.01, boxShadow: "0 12px 30px -10px rgba(0,0,0,0.4)" }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="lg:col-span-2 bg-slate-800/20 border border-slate-700/10 rounded-3xl p-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Recent Transactions</h2>
              <p className="text-xs text-slate-400">Latest income or expense posts</p>
            </div>
            <button 
              onClick={() => onNavigate('transactions')}
              className="text-xs text-emerald-400 hover:underline"
            >
              See Ledger
            </button>
          </div>

          {recentTransactions.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-500 border border-dashed border-slate-700/50 rounded-2xl">
              No transactions recorded yet. Go to Transactions tab to log cash flow.
            </div>
          ) : (
            <div className="space-y-2">
              {recentTransactions.map((tx) => (
                <div 
                  key={tx.id} 
                  className="flex items-center justify-between p-3 bg-slate-800/30 border border-slate-700/10 rounded-2xl hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${tx.type === 'income' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                      {tx.type === 'income' ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">{tx.description || tx.category}</h4>
                      <div className="flex gap-2 text-[10px] text-slate-500 mt-0.5">
                        <span>{tx.category}</span>
                        <span>•</span>
                        <span>{tx.date}</span>
                      </div>
                    </div>
                  </div>
                  <span className={`text-xs font-extrabold ${tx.type === 'income' ? 'text-emerald-400' : 'text-slate-300'}`}>
                    {tx.type === 'income' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Right Column: Gamified Gameweek (Challenges & Achievements) */}
        <motion.div 
          whileHover={{ y: -4, scale: 1.01, boxShadow: "0 12px 30px -10px rgba(0,0,0,0.4)" }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="bg-slate-800/20 border border-slate-700/10 rounded-3xl p-6 space-y-5"
        >
          {/* Active Challenges */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white">Monthly Challenges</h3>
              <div className="h-5 w-5 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Flame className="h-3.5 w-3.5" />
              </div>
            </div>
            
            <div className="space-y-3">
              {challenges.slice(0, 2).map((ch) => {
                const pct = ch.type === 'expense_cap'
                  ? Math.max(0, Math.min(100, Math.round(((ch.targetValue - ch.currentValue) / ch.targetValue) * 100)))
                  : Math.min(100, Math.round((ch.currentValue / ch.targetValue) * 100));

                const failed = ch.type === 'expense_cap' && ch.currentValue > ch.targetValue;

                return (
                  <div key={ch.id} className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-3 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xs font-extrabold text-white">{ch.title}</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">{ch.description}</p>
                      </div>
                      <span className="text-[10px] font-black text-amber-400 bg-amber-400/5 px-2 py-0.5 rounded shrink-0">
                        +{ch.rewardPoints} XP
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${failed ? 'bg-rose-500' : ch.isCompleted ? 'bg-emerald-500' : 'bg-amber-500'}`}
                          style={{ width: `${failed ? 100 : pct}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[9px] text-slate-500 font-medium">
                        <span>{failed ? 'Failed' : ch.isCompleted ? 'Completed' : 'In Progress'}</span>
                        <span>
                          {failed 
                            ? `Overspent (₹${ch.currentValue})` 
                            : `₹${Math.round(ch.currentValue)} / ₹${ch.targetValue}`}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Achievements */}
          <div className="border-t border-slate-800/60 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white">Achievements</h3>
              <div className="h-5 w-5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Award className="h-3.5 w-3.5" />
              </div>
            </div>

            {achievements.length === 0 ? (
              <p className="text-center py-4 text-xs text-slate-500">No medals unlocked yet.</p>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {achievements.slice(0, 2).map((ach) => (
                  <div key={ach.id} className="flex items-center gap-3 bg-slate-900/20 border border-slate-800/30 rounded-2xl p-2.5">
                    <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                      <Award className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white leading-tight">{ach.title}</h4>
                      <p className="text-[10px] text-slate-400 leading-tight mt-0.5">{ach.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
