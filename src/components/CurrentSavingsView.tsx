/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Transaction, SavingsGoal } from '../types.js';
import { PiggyBank, Wallet, TrendingUp, Calendar, Zap, Award, ArrowUpRight, ArrowDownRight, Percent, RefreshCw } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from 'recharts';

interface CurrentSavingsViewProps {
  transactions: Transaction[];
  goals: SavingsGoal[];
  token: string;
}

interface MonthlySavingsRecord {
  month: string;
  amount: number;
}

export default function CurrentSavingsView({
  transactions,
  goals,
  token
}: CurrentSavingsViewProps) {
  const [monthlyHistory, setMonthlyHistory] = useState<MonthlySavingsRecord[]>([]);
  const [isSettling, setIsSettling] = useState(false);
  const [settleSuccess, setSettleSuccess] = useState('');

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const currentMonthStr = now.toISOString().slice(0, 7); // YYYY-MM
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const currentDayOfMonth = Math.max(1, now.getDate());

  // Fetch monthly savings history from PostgreSQL
  const fetchMonthlyHistory = async () => {
    try {
      const res = await fetch('/api/monthly-savings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMonthlyHistory(data || []);
      }
    } catch (err) {
      console.error('Failed to load monthly savings history', err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchMonthlyHistory();
    }
  }, [token]);

  // High level calculations
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  // Current Net Balance
  const currentBalance = totalIncome - totalExpense;

  // Goals Accumulated Savings
  const goalsSavings = goals.reduce((sum, g) => sum + g.currentAmount, 0);

  // Total Current Savings (Accumulated Goals + Cash Balance)
  const currentSavings = Math.max(0, currentBalance) + goalsSavings;

  // Today's Savings
  const todayIncome = transactions
    .filter(t => t.type === 'income' && t.date === todayStr)
    .reduce((sum, t) => sum + t.amount, 0);

  const todayExpense = transactions
    .filter(t => t.type === 'expense' && t.date === todayStr)
    .reduce((sum, t) => sum + t.amount, 0);

  const todaySavings = todayIncome - todayExpense;

  // Weekly Savings (Last 7 Days)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const weeklyIncome = transactions
    .filter(t => t.type === 'income' && t.date >= sevenDaysAgo && t.date <= todayStr)
    .reduce((sum, t) => sum + t.amount, 0);

  const weeklyExpense = transactions
    .filter(t => t.type === 'expense' && t.date >= sevenDaysAgo && t.date <= todayStr)
    .reduce((sum, t) => sum + t.amount, 0);

  const weeklySavings = weeklyIncome - weeklyExpense;

  // Monthly Savings (Current Month)
  const monthlyIncome = transactions
    .filter(t => t.type === 'income' && t.date.startsWith(currentMonthStr))
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyExpense = transactions
    .filter(t => t.type === 'expense' && t.date.startsWith(currentMonthStr))
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlySavings = monthlyIncome - monthlyExpense;

  // Savings Rate
  const savingsRate = monthlyIncome > 0 ? Math.max(0, Math.round((monthlySavings / monthlyIncome) * 100)) : 0;

  // Average Daily Savings
  const avgDailySavings = Math.round(monthlySavings / currentDayOfMonth);

  // Auto-settle remaining balance to history
  const handleSettleMonthlyBalance = async () => {
    setIsSettling(true);
    setSettleSuccess('');
    try {
      const remainingBalance = Math.max(0, monthlySavings);
      const res = await fetch('/api/monthly-savings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          month: currentMonthStr,
          amount: remainingBalance
        })
      });

      if (res.ok) {
        const updated = await res.json();
        setMonthlyHistory(updated);
        setSettleSuccess(`Successfully settled ₹${remainingBalance.toLocaleString('en-IN')} for ${currentMonthStr} into PostgreSQL history.`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSettling(false);
    }
  };

  // Prepare Daily Savings Chart Data (Last 14 days)
  const chartDays = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date(now.getTime() - (13 - i) * 24 * 60 * 60 * 1000);
    const dStr = d.toISOString().split('T')[0];
    const dLabel = `${d.getMonth() + 1}/${d.getDate()}`;

    const dIncome = transactions
      .filter(t => t.type === 'income' && t.date === dStr)
      .reduce((sum, t) => sum + t.amount, 0);

    const dExpense = transactions
      .filter(t => t.type === 'expense' && t.date === dStr)
      .reduce((sum, t) => sum + t.amount, 0);

    const dSaved = dIncome - dExpense;

    return {
      date: dLabel,
      fullDate: dStr,
      Income: dIncome,
      Expense: dExpense,
      Saved: dSaved
    };
  });

  // Calculate Monthly Savings Growth & Interest
  const decoratedHistory = monthlyHistory.map((item, idx) => {
    const prevItem = idx > 0 ? monthlyHistory[idx - 1] : null;
    let growthPct = 0;
    if (prevItem && prevItem.amount > 0) {
      growthPct = Math.round(((item.amount - prevItem.amount) / prevItem.amount) * 100);
    } else if (prevItem && prevItem.amount === 0) {
      growthPct = item.amount > 0 ? 100 : 0;
    }

    // Estimated annual interest yield at 7% p.a. (~0.58% per month)
    const estimatedInterest = Math.round(item.amount * (0.07 / 12));

    return {
      ...item,
      growthPct,
      estimatedInterest
    };
  });

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 border border-emerald-500/20 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0">
              <PiggyBank className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block">Savings Intelligence Center</span>
              <h1 className="text-2xl font-black text-white">Current & Monthly Savings</h1>
            </div>
          </div>

          <button
            onClick={handleSettleMonthlyBalance}
            disabled={isSettling}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isSettling ? 'animate-spin' : ''}`} />
            {isSettling ? 'Settling...' : `Settle ${currentMonthStr} Remaining Balance`}
          </button>
        </div>

        {settleSuccess && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl p-3">
            {settleSuccess}
          </div>
        )}
      </div>

      {/* MODULE 2: 7 CORE SAVINGS METRICS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* 1. Current Balance */}
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Current Balance</span>
          <span className={`text-base font-black ${currentBalance >= 0 ? 'text-white' : 'text-rose-400'}`}>
            ₹{currentBalance.toLocaleString('en-IN')}
          </span>
        </div>

        {/* 2. Current Savings */}
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl space-y-1">
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Current Savings</span>
          <span className="text-base font-black text-emerald-400">
            ₹{currentSavings.toLocaleString('en-IN')}
          </span>
        </div>

        {/* 3. Today's Savings */}
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Today's Savings</span>
          <span className={`text-base font-black ${todaySavings >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            ₹{todaySavings.toLocaleString('en-IN')}
          </span>
        </div>

        {/* 4. Weekly Savings */}
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Weekly Savings</span>
          <span className={`text-base font-black ${weeklySavings >= 0 ? 'text-blue-400' : 'text-rose-400'}`}>
            ₹{weeklySavings.toLocaleString('en-IN')}
          </span>
        </div>

        {/* 5. Monthly Savings */}
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Monthly Savings</span>
          <span className={`text-base font-black ${monthlySavings >= 0 ? 'text-amber-400' : 'text-rose-400'}`}>
            ₹{monthlySavings.toLocaleString('en-IN')}
          </span>
        </div>

        {/* 6. Savings Rate */}
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Savings Rate</span>
          <span className="text-base font-black text-emerald-400">{savingsRate}%</span>
        </div>

        {/* 7. Avg Daily Savings */}
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Avg Daily Savings</span>
          <span className="text-base font-black text-purple-400">
            ₹{avgDailySavings.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* SAVINGS GRAPH CHART (Daily / Weekly Breakdown) */}
      <div className="bg-slate-800/20 border border-slate-700/10 rounded-3xl p-6 space-y-4">
        <div>
          <h2 className="text-base font-bold text-white">Daily Savings & Cash Surplus Curve</h2>
          <p className="text-xs text-slate-400">Net daily savings performance over the past 14 days</p>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartDays}>
              <defs>
                <linearGradient id="savedColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} tickFormatter={(val) => `₹${val}`} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Amount']}
              />
              <Area type="monotone" dataKey="Saved" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#savedColor)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* MODULE 3: MONTHLY SAVINGS HISTORY & INTEREST COMPRESSION */}
      <div className="bg-slate-800/20 border border-slate-700/10 rounded-3xl p-6 space-y-6">
        <div>
          <h2 className="text-base font-bold text-white">Monthly Savings Ledger & Interest Yield</h2>
          <p className="text-xs text-slate-400">End-of-month balance settlements, month-over-month growth rate, and estimated annual interest yield</p>
        </div>

        {decoratedHistory.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-700/50 rounded-2xl text-slate-500 text-xs">
            No historical month-end savings locked yet. Click "Settle Remaining Balance" above to lock the current month's savings!
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Table list */}
            <div className="lg:col-span-2 space-y-3">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="p-3">Month</th>
                      <th className="p-3">Amount Saved</th>
                      <th className="p-3">MoM Growth</th>
                      <th className="p-3">Est. Annual Yield (7%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {decoratedHistory.map((item) => (
                      <tr key={item.month} className="hover:bg-slate-800/30 transition-colors">
                        <td className="p-3 font-bold text-white font-mono">{item.month}</td>
                        <td className="p-3 font-black text-emerald-400">₹{item.amount.toLocaleString('en-IN')}</td>
                        <td className="p-3 font-bold">
                          {item.growthPct >= 0 ? (
                            <span className="text-emerald-400 flex items-center gap-1">
                              <ArrowUpRight className="h-3.5 w-3.5" /> +{item.growthPct}%
                            </span>
                          ) : (
                            <span className="text-rose-400 flex items-center gap-1">
                              <ArrowDownRight className="h-3.5 w-3.5" /> {item.growthPct}%
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-amber-400 font-semibold">+₹{item.estimatedInterest.toLocaleString('en-IN')}/mo</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Historical Bar Chart */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-2">
              <h3 className="text-xs font-bold text-white">Historical Savings Bar Chart</h3>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={decoratedHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="month" stroke="#64748b" fontSize={10} />
                    <YAxis stroke="#64748b" fontSize={10} tickFormatter={(val) => `₹${val}`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                      formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Saved']}
                    />
                    <Bar dataKey="amount" fill="#10b981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
