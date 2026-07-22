/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Transaction } from '../types.js';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  AreaChart, 
  Area 
} from 'recharts';
import { Info, AlertCircle, ArrowUpRight, ArrowDownLeft, Calendar } from 'lucide-react';

interface AnalyticsViewProps {
  transactions: Transaction[];
}

// Aesthetic palette for categories
const COLORS = [
  '#10B981', '#3B82F6', '#EF4444', '#F59E0B', '#8B5CF6', 
  '#EC4899', '#06B6D4', '#14B8A6', '#84CC16', '#10B981', '#64748B'
];

export default function AnalyticsView({ transactions }: AnalyticsViewProps) {

  // Aggregate computations
  const expenseTxs = transactions.filter(t => t.type === 'expense');
  const incomeTxs = transactions.filter(t => t.type === 'income');

  const totalExpense = expenseTxs.reduce((sum, t) => sum + t.amount, 0);
  const totalIncome = incomeTxs.reduce((sum, t) => sum + t.amount, 0);

  // Highest single expense
  const highestExpense = expenseTxs.reduce((max, t) => t.amount > max ? t.amount : max, 0);

  // Group by category for Pie Chart
  const categoryMap: Record<string, number> = {};
  expenseTxs.forEach(t => {
    categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
  });

  const pieData = Object.entries(categoryMap).map(([name, value]) => ({
    name,
    value
  })).sort((a, b) => b.value - a.value);

  // Top spending category
  const topCategory = pieData.length > 0 ? pieData[0].name : 'None';

  // Group by date for line graph / trends (last 7 entries or grouped days)
  const dailyMap: Record<string, { income: number; expense: number }> = {};
  transactions.forEach(t => {
    const day = t.date; // YYYY-MM-DD
    if (!dailyMap[day]) {
      dailyMap[day] = { income: 0, expense: 0 };
    }
    if (t.type === 'income') {
      dailyMap[day].income += t.amount;
    } else {
      dailyMap[day].expense += t.amount;
    }
  });

  const dailyTrendData = Object.entries(dailyMap).map(([date, val]) => ({
    date,
    income: val.income,
    expense: val.expense,
    balance: val.income - val.expense
  })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(-10); // last 10 days

  // Monthly trends (group by YYYY-MM)
  const monthlyMap: Record<string, { income: number; expense: number }> = {};
  transactions.forEach(t => {
    const month = t.date.slice(0, 7); // YYYY-MM
    if (!monthlyMap[month]) {
      monthlyMap[month] = { income: 0, expense: 0 };
    }
    if (t.type === 'income') {
      monthlyMap[month].income += t.amount;
    } else {
      monthlyMap[month].expense += t.amount;
    }
  });

  const monthlyTrendData = Object.entries(monthlyMap).map(([month, val]) => ({
    month,
    income: val.income,
    expense: val.expense
  })).sort((a, b) => a.month.localeCompare(b.month));

  // Compute daily average spending for the month
  const spentThisMonth = expenseTxs
    .filter(t => t.date.startsWith(new Date().toISOString().slice(0, 7)))
    .reduce((sum, t) => sum + t.amount, 0);
  const daysPassed = new Date().getDate();
  const averageDailySpend = daysPassed > 0 ? Math.round(spentThisMonth / daysPassed) : 0;

  return (
    <div className="space-y-6">
      {/* Quick Statistics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Highest Single Expense */}
        <div className="bg-slate-800/40 border border-slate-700/20 rounded-3xl p-5">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Highest Expense Single</span>
          <h3 className="text-xl font-extrabold text-white mt-1">₹{highestExpense.toLocaleString('en-IN')}</h3>
          <p className="text-[10px] text-rose-400 mt-1">Single maximum transaction</p>
        </div>

        {/* Top Spending Category */}
        <div className="bg-slate-800/40 border border-slate-700/20 rounded-3xl p-5">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Top Spending Category</span>
          <h3 className="text-xl font-extrabold text-white mt-1 truncate">{topCategory}</h3>
          <p className="text-[10px] text-amber-400 mt-1">Most utilized category cap</p>
        </div>

        {/* Average Daily Expense */}
        <div className="bg-slate-800/40 border border-slate-700/20 rounded-3xl p-5">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Average Daily Expense</span>
          <h3 className="text-xl font-extrabold text-white mt-1">₹{averageDailySpend.toLocaleString('en-IN')}</h3>
          <p className="text-[10px] text-emerald-400 mt-1">This month average</p>
        </div>

        {/* Total Ratio */}
        <div className="bg-slate-800/40 border border-slate-700/20 rounded-3xl p-5">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Spending Ratio</span>
          <h3 className="text-xl font-extrabold text-white mt-1">
            {totalIncome > 0 ? Math.round((totalExpense / totalIncome) * 100) : 0}%
          </h3>
          <p className="text-[10px] text-slate-500 mt-1">Percentage of income spent</p>
        </div>
      </div>

      {transactions.length === 0 ? (
        <div className="text-center py-24 text-xs text-slate-500 border border-dashed border-slate-700/50 rounded-3xl bg-slate-800/5">
          No data available for analytical visualization. Post standard transactions to view live metrics!
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart: Expense Breakdown */}
          <div className="bg-slate-800/20 border border-slate-700/10 rounded-3xl p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-black text-white">Expense Distribution</h3>
              <p className="text-xs text-slate-400 mb-4">Percentage allocation by category</p>
            </div>

            {pieData.length === 0 ? (
              <p className="text-center py-12 text-xs text-slate-500">No expense records logged.</p>
            ) : (
              <div className="h-72 w-full flex flex-col sm:flex-row items-center justify-center">
                <div className="h-56 w-56 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px' }}
                        itemStyle={{ color: '#F8FAFC', fontSize: '11px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1.5 sm:flex-col justify-center sm:items-start ml-0 sm:ml-6 mt-4 sm:mt-0 text-[10px]">
                  {pieData.slice(0, 5).map((d, index) => (
                    <div key={d.name} className="flex items-center gap-1.5 font-semibold">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="text-slate-300">{d.name}:</span>
                      <span className="text-slate-500 font-bold font-mono">
                        ₹{d.value.toLocaleString('en-IN')} ({totalExpense > 0 ? Math.round((d.value / totalExpense) * 100) : 0}%)
                      </span>
                    </div>
                  ))}
                  {pieData.length > 5 && (
                    <span className="text-[10px] text-slate-500 italic font-medium">And {pieData.length - 5} more categories</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Income vs Expense Bar Graph */}
          <div className="bg-slate-800/20 border border-slate-700/10 rounded-3xl p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-black text-white">Monthly Cash Flow Trend</h3>
              <p className="text-xs text-slate-400 mb-4">Comparing incoming salary vs spending limits</p>
            </div>

            <div className="h-72 w-full">
              {monthlyTrendData.length === 0 ? (
                <p className="text-center py-20 text-xs text-slate-500">No monthly trends calculated.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                    <XAxis dataKey="month" stroke="#64748B" fontSize={10} />
                    <YAxis stroke="#64748B" fontSize={10} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px' }}
                      itemStyle={{ color: '#F8FAFC', fontSize: '11px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                    <Bar dataKey="income" name="Income (+)" fill="#10B981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" name="Expense (-)" fill="#EF4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Area Chart: Cumulative daily trend */}
          <div className="bg-slate-800/20 border border-slate-700/10 rounded-3xl p-6 lg:col-span-2 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-black text-white">Daily Spending Ledger Curve</h3>
              <p className="text-xs text-slate-400 mb-4">Latest 10 transactional dates activity profile</p>
            </div>

            <div className="h-64 w-full">
              {dailyTrendData.length === 0 ? (
                <p className="text-center py-16 text-xs text-slate-500">No daily transactional data yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyTrendData}>
                    <defs>
                      <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                    <XAxis dataKey="date" stroke="#64748B" fontSize={10} />
                    <YAxis stroke="#64748B" fontSize={10} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px' }}
                      itemStyle={{ color: '#F8FAFC', fontSize: '11px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                    <Area type="monotone" dataKey="income" name="Daily Income" stroke="#10B981" fillOpacity={1} fill="url(#colorIncome)" />
                    <Area type="monotone" dataKey="expense" name="Daily Expense" stroke="#EF4444" fillOpacity={1} fill="url(#colorExpense)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
