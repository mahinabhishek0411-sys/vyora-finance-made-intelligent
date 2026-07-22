/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Transaction, Budget, SavingsGoal, Reminder } from '../types.js';
import { Download, Upload, FileSpreadsheet, FileText, Printer, CheckCircle, Info, PieChart, BarChart3, Target, PiggyBank } from 'lucide-react';

interface ReportsViewProps {
  transactions: Transaction[];
  budgets: Budget[];
  goals: SavingsGoal[];
  reminders: Reminder[];
}

export default function ReportsView({
  transactions,
  budgets,
  goals,
  reminders
}: ReportsViewProps) {

  const [activeReportTab, setActiveReportTab] = useState<'monthly' | 'savings' | 'budget' | 'goal'>('monthly');
  const [importText, setImportText] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Filter Date Range
  const [reportMonth, setReportMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

  // Generate CSV data and download
  const handleExportCSV = () => {
    let csvRows: any[][] = [];

    if (activeReportTab === 'monthly') {
      csvRows = [
        ['ID', 'Date', 'Type', 'Category', 'Description', 'Amount (INR)'],
        ...transactions.map(tx => [tx.id, tx.date, tx.type.toUpperCase(), tx.category, tx.description || '', tx.amount])
      ];
    } else if (activeReportTab === 'budget') {
      csvRows = [
        ['Category', 'Month', 'Budget Limit (INR)', 'Spent (INR)', 'Variance (INR)', 'Status'],
        ...budgets.map(b => {
          const spent = transactions
            .filter(t => t.type === 'expense' && t.category === b.category && t.date.startsWith(b.month))
            .reduce((sum, t) => sum + t.amount, 0);
          const variance = b.amount - spent;
          return [b.category, b.month, b.amount, spent, variance, variance >= 0 ? 'Within Budget' : 'Exceeded'];
        })
      ];
    } else if (activeReportTab === 'goal') {
      csvRows = [
        ['Goal Name', 'Target Amount (INR)', 'Saved (INR)', 'Progress (%)', 'Target Date', 'Status'],
        ...goals.map(g => {
          const pct = g.targetAmount > 0 ? Math.round((g.currentAmount / g.targetAmount) * 100) : 0;
          return [g.name, g.targetAmount, g.currentAmount, `${pct}%`, g.targetDate || 'N/A', g.currentAmount >= g.targetAmount ? 'Completed' : 'In Progress'];
        })
      ];
    } else {
      // Savings
      csvRows = [
        ['ID', 'Date', 'Type', 'Category', 'Amount (INR)'],
        ...transactions.filter(t => t.type === 'income').map(tx => [tx.id, tx.date, tx.type.toUpperCase(), tx.category, tx.amount])
      ];
    }

    const csvContent = "data:text/csv;charset=utf-8," 
      + csvRows.map(e => e.map(val => `"${val.toString().replace(/"/g, '""')}"`).join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Vyora_${activeReportTab.toUpperCase()}_Report_${reportMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export JSON backup and download
  const handleExportJSON = () => {
    const backup = { transactions, budgets, goals, reminders };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backup, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", dataStr);
    link.setAttribute("download", `Vyora_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Import JSON configuration
  const handleImportJSON = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importText.trim()) return;

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const parsed = JSON.parse(importText);
      const res = await fetch('/api/reports/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(parsed)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import failed');

      setSuccess('Financial ledger metrics successfully imported. Refresh dashboard to see updated data.');
      setImportText('');
    } catch (err: any) {
      setError(err.message || 'Invalid backup payload format.');
    } finally {
      setLoading(false);
    }
  };

  // Print Statement Handler
  const handlePrintStatement = () => {
    window.print();
  };

  // Monthly Report calculations
  const monthTxs = transactions.filter(t => t.date.startsWith(reportMonth));
  const monthIncome = monthTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const monthExpense = monthTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const netSavings = monthIncome - monthExpense;

  // Budget Report calculations
  const activeBudgets = budgets.filter(b => b.month === reportMonth);
  const totalBudgeted = activeBudgets.reduce((sum, b) => sum + b.amount, 0);

  return (
    <div className="space-y-6">
      {/* Report Type Selector Tabs */}
      <div className="flex flex-wrap gap-2 bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800">
        <button
          onClick={() => setActiveReportTab('monthly')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeReportTab === 'monthly' ? 'bg-emerald-500 text-slate-950 shadow-lg' : 'text-slate-400 hover:text-white'}`}
        >
          <BarChart3 className="h-4 w-4" /> Monthly Report
        </button>
        <button
          onClick={() => setActiveReportTab('savings')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeReportTab === 'savings' ? 'bg-emerald-500 text-slate-950 shadow-lg' : 'text-slate-400 hover:text-white'}`}
        >
          <PiggyBank className="h-4 w-4" /> Savings Report
        </button>
        <button
          onClick={() => setActiveReportTab('budget')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeReportTab === 'budget' ? 'bg-emerald-500 text-slate-950 shadow-lg' : 'text-slate-400 hover:text-white'}`}
        >
          <PieChart className="h-4 w-4" /> Budget Report
        </button>
        <button
          onClick={() => setActiveReportTab('goal')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeReportTab === 'goal' ? 'bg-emerald-500 text-slate-950 shadow-lg' : 'text-slate-400 hover:text-white'}`}
        >
          <Target className="h-4 w-4" /> Goal Progress Report
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Printable Statement Frame */}
        <div className="lg:col-span-2 bg-slate-800/20 border border-slate-700/10 rounded-3xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
            <div>
              <h2 className="text-base font-bold text-white capitalize">{activeReportTab} Statement Audit</h2>
              <p className="text-xs text-slate-400 font-medium">Verify structured ledger records or export to PDF/CSV.</p>
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="month"
                value={reportMonth}
                onChange={(e) => setReportMonth(e.target.value)}
                className="bg-slate-900/60 border border-slate-700/60 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
              />
              <button
                onClick={handlePrintStatement}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                <Printer className="h-4 w-4" /> Print PDF
              </button>
            </div>
          </div>

          {/* Printable visual statement frame */}
          <div id="printable-statement" className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-6 text-slate-300 space-y-6 font-sans">
            {/* Invoice Header */}
            <div className="flex justify-between items-start border-b border-slate-800/80 pb-4">
              <div>
                <span className="text-[10px] uppercase font-black text-emerald-400 tracking-widest">Vyora Official Report</span>
                <h3 className="text-sm font-bold text-white mt-1 capitalize">{activeReportTab} Financial Audit</h3>
                <span className="text-[10px] text-slate-500 font-mono">Month: {reportMonth}</span>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-white block">Audit Date</span>
                <span className="text-[10px] text-slate-500 font-mono">{new Date().toISOString().split('T')[0]}</span>
              </div>
            </div>

            {/* TAB 1: MONTHLY REPORT */}
            {activeReportTab === 'monthly' && (
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-800">
                    <span className="block text-[9px] font-bold text-slate-500 uppercase">Incoming Cash</span>
                    <span className="text-xs font-black text-emerald-400">₹{monthIncome.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-800">
                    <span className="block text-[9px] font-bold text-slate-500 uppercase">Total Outflow</span>
                    <span className="text-xs font-black text-rose-400 font-mono">₹{monthExpense.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-800">
                    <span className="block text-[9px] font-bold text-slate-500 uppercase">Net Monthly Savings</span>
                    <span className={`text-xs font-black ${netSavings >= 0 ? 'text-white' : 'text-rose-400'}`}>
                      ₹{netSavings.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Transactions Ledger ({monthTxs.length})</h4>
                  {monthTxs.length === 0 ? (
                    <p className="text-center py-6 text-xs text-slate-600">No transactions recorded for {reportMonth}.</p>
                  ) : (
                    monthTxs.map(tx => (
                      <div key={tx.id} className="flex justify-between items-center text-xs border-b border-slate-900 pb-2">
                        <div>
                          <span className="font-semibold text-white block">{tx.description || tx.category}</span>
                          <span className="text-[9px] text-slate-500">{tx.category} • {tx.date}</span>
                        </div>
                        <span className={`font-mono font-bold ${tx.type === 'income' ? 'text-emerald-400' : 'text-slate-300'}`}>
                          {tx.type === 'income' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: SAVINGS REPORT */}
            {activeReportTab === 'savings' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-800">
                    <span className="block text-[9px] font-bold text-slate-500 uppercase">Monthly Savings</span>
                    <span className="text-xs font-black text-emerald-400">₹{Math.max(0, netSavings).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-800">
                    <span className="block text-[9px] font-bold text-slate-500 uppercase">Savings Rate</span>
                    <span className="text-xs font-black text-blue-400">
                      {monthIncome > 0 ? Math.round((Math.max(0, netSavings) / monthIncome) * 100) : 0}%
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Goal Savings Allocated</h4>
                  {goals.map(g => (
                    <div key={g.id} className="flex justify-between items-center text-xs border-b border-slate-900 pb-2">
                      <span className="text-white font-semibold">{g.name}</span>
                      <span className="text-emerald-400 font-bold">₹{g.currentAmount.toLocaleString('en-IN')} / ₹{g.targetAmount.toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: BUDGET REPORT */}
            {activeReportTab === 'budget' && (
              <div className="space-y-6">
                <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-800 text-center">
                  <span className="block text-[9px] font-bold text-slate-500 uppercase">Total Budget Cap ({reportMonth})</span>
                  <span className="text-xs font-black text-teal-400">₹{totalBudgeted.toLocaleString('en-IN')}</span>
                </div>

                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Category Budgets vs Spending Variance</h4>
                  {activeBudgets.length === 0 ? (
                    <p className="text-center py-6 text-xs text-slate-600">No active budgets for {reportMonth}.</p>
                  ) : (
                    activeBudgets.map(b => {
                      const spent = monthTxs.filter(t => t.type === 'expense' && t.category === b.category).reduce((sum, t) => sum + t.amount, 0);
                      const variance = b.amount - spent;
                      return (
                        <div key={b.id} className="flex justify-between items-center text-xs border-b border-slate-900 pb-2">
                          <div>
                            <span className="font-semibold text-white block">{b.category}</span>
                            <span className="text-[9px] text-slate-500">Cap: ₹{b.amount.toLocaleString('en-IN')} • Spent: ₹{spent.toLocaleString('en-IN')}</span>
                          </div>
                          <span className={`font-mono font-bold ${variance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {variance >= 0 ? `+₹${variance.toLocaleString('en-IN')} Under` : `-₹${Math.abs(variance).toLocaleString('en-IN')} Exceeded`}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: GOAL REPORT */}
            {activeReportTab === 'goal' && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Goals Completion Status</h4>
                  {goals.map(g => {
                    const pct = g.targetAmount > 0 ? Math.round((g.currentAmount / g.targetAmount) * 100) : 0;
                    return (
                      <div key={g.id} className="p-3 bg-slate-900/40 rounded-xl border border-slate-800 space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-white font-bold">{g.name}</span>
                          <span className="text-emerald-400 font-bold">{pct}% Completed</span>
                        </div>
                        <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <p className="text-[9px] text-slate-600 text-center border-t border-slate-900 pt-4">
              Consolidated by Vyora — Finance Made Intelligent.
            </p>
          </div>
        </div>

        {/* Right Column: Export/Import Tools */}
        <div className="space-y-6">
          <div className="bg-slate-800/20 border border-slate-700/10 rounded-3xl p-6 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white">Export Dataset</h3>
              <p className="text-xs text-slate-400">Download formatted files for external accounting.</p>
            </div>

            <div className="space-y-2.5">
              <button
                onClick={handleExportCSV}
                className="w-full flex items-center justify-between p-3.5 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/20 rounded-2xl transition-all cursor-pointer text-xs font-bold text-white"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="h-4.5 w-4.5" />
                  </div>
                  <span>Download CSV ({activeReportTab})</span>
                </div>
                <Download className="h-4 w-4 text-slate-500" />
              </button>

              <button
                onClick={handleExportJSON}
                className="w-full flex items-center justify-between p-3.5 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/20 rounded-2xl transition-all cursor-pointer text-xs font-bold text-white"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                    <FileText className="h-4.5 w-4.5" />
                  </div>
                  <span>Export Complete JSON Backup</span>
                </div>
                <Download className="h-4 w-4 text-slate-500" />
              </button>
            </div>
          </div>

          <div className="bg-slate-800/20 border border-slate-700/10 rounded-3xl p-6 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white">Restore JSON Backup</h3>
              <p className="text-xs text-slate-400">Paste backup payload to consolidate database entries.</p>
            </div>

            {success && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[10px] rounded-xl p-3 flex items-start gap-2">
                <CheckCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                <span>{success}</span>
              </div>
            )}

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[10px] rounded-xl p-3 flex items-start gap-2">
                <Info className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleImportJSON} className="space-y-3">
              <textarea
                required
                rows={5}
                placeholder='Paste JSON backup code here...'
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-700/60 rounded-xl px-3 py-2 text-xs text-slate-300 placeholder-slate-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none font-mono"
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                <Upload className="h-4 w-4 text-emerald-400" /> {loading ? 'Importing...' : 'Upload & Restore'}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
