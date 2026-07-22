/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { SavingsGoal, Transaction, User, WealthStructure, MonthlySavingsLog } from '../types.js';
import { 
  Plus, 
  Trash2, 
  PiggyBank, 
  Target, 
  Award, 
  ArrowUpRight, 
  X, 
  TrendingUp, 
  Briefcase, 
  Coins, 
  Lock, 
  Settings, 
  AlertCircle, 
  Calendar, 
  Sparkles,
  Info,
  ChevronRight,
  HelpCircle
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid,
  BarChart,
  Bar
} from 'recharts';

interface GoalsViewProps {
  goals: SavingsGoal[];
  onAddGoal: (goal: Omit<SavingsGoal, 'id' | 'userId' | 'dateCreated'> & { targetDate?: string }) => Promise<void>;
  onEditGoal: (id: string, goal: Partial<SavingsGoal>) => Promise<void>;
  onDeleteGoal: (id: string) => Promise<void>;
  transactions: Transaction[];
  user: User | null;
  onUpdateProfileFields: (fields: Partial<User>) => Promise<void>;
}

export default function GoalsView({
  goals,
  onAddGoal,
  onEditGoal,
  onDeleteGoal,
  transactions,
  user,
  onUpdateProfileFields
}: GoalsViewProps) {

  // Active Tab
  const [activeTab, setActiveTab] = useState<'milestones' | 'wealth' | 'savings' | 'calculators'>('milestones');

  // Modals
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  const [showContributeModal, setShowContributeModal] = useState<SavingsGoal | null>(null);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [deleteConfirmGoal, setDeleteConfirmGoal] = useState<SavingsGoal | null>(null);

  // Goal Form State
  const [goalName, setGoalName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [initialAmount, setInitialAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');

  // Contribution State
  const [contributeVal, setContributeVal] = useState('');

  // --- Calculate Live Cash Flow ---
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const currentLiveSavings = Math.max(0, totalIncome - totalExpense);
  const savingsPercentage = totalIncome > 0 ? Math.round((currentLiveSavings / totalIncome) * 100) : 0;

  // Monthly average surplus estimation
  const avgMonthlySurplus = currentLiveSavings || 15000; // Default fallback to 15k if no transactions exist

  // --- Wealth Section States & Allocations ---
  const defaultWealth: WealthStructure = {
    savingsAccount: 25000,
    fixedDeposit: 50000,
    recurringDeposit: 15000,
    sip: 12000,
    mutualFunds: 35000,
    gold: 20000,
    emergencyFund: 30000
  };

  const currentWealth = user?.wealth || defaultWealth;
  const netWorth = Object.values(currentWealth).reduce((sum, val) => sum + (Number(val) || 0), 0);

  const [wealthEditMode, setWealthEditMode] = useState(false);
  const [editSavingsAccount, setEditSavingsAccount] = useState(currentWealth.savingsAccount.toString());
  const [editFixedDeposit, setEditFixedDeposit] = useState(currentWealth.fixedDeposit.toString());
  const [editRecurringDeposit, setEditRecurringDeposit] = useState(currentWealth.recurringDeposit.toString());
  const [editSip, setEditSip] = useState(currentWealth.sip.toString());
  const [editMutualFunds, setEditMutualFunds] = useState(currentWealth.mutualFunds.toString());
  const [editGold, setEditGold] = useState(currentWealth.gold.toString());
  const [editEmergencyFund, setEditEmergencyFund] = useState(currentWealth.emergencyFund.toString());

  const handleSaveWealth = async () => {
    const updatedWealth: WealthStructure = {
      savingsAccount: Number(editSavingsAccount) || 0,
      fixedDeposit: Number(editFixedDeposit) || 0,
      recurringDeposit: Number(editRecurringDeposit) || 0,
      sip: Number(editSip) || 0,
      mutualFunds: Number(editMutualFunds) || 0,
      gold: Number(editGold) || 0,
      emergencyFund: Number(editEmergencyFund) || 0
    };

    await onUpdateProfileFields({ wealth: updatedWealth });
    setWealthEditMode(false);
  };

  // --- Savings Module B History Lock ---
  const defaultHistory: MonthlySavingsLog[] = [
    { month: '2026-03', amount: 8000 },
    { month: '2026-04', amount: 11000 },
    { month: '2026-05', amount: 14500 },
    { month: '2026-06', amount: 18000 }
  ];
  const savingsHistory = user?.monthlySavingsHistory || defaultHistory;

  const [lockMonth, setLockMonth] = useState(new Date().toISOString().substring(0, 7)); // YYYY-MM
  const [lockAmountVal, setLockAmountVal] = useState(currentLiveSavings.toString());

  const handleLockSavings = async () => {
    const amount = Number(lockAmountVal);
    if (!lockMonth || amount <= 0) return;

    // Check if month already logged
    const existingIndex = savingsHistory.findIndex(h => h.month === lockMonth);
    let newHistory = [...savingsHistory];

    if (existingIndex > -1) {
      newHistory[existingIndex] = { month: lockMonth, amount };
    } else {
      newHistory.push({ month: lockMonth, amount });
    }

    // Sort chronologically
    newHistory.sort((a, b) => a.month.localeCompare(b.month));

    await onUpdateProfileFields({ monthlySavingsHistory: newHistory });
    alert(`Savings of ₹${amount.toLocaleString('en-IN')} locked for ${lockMonth}!`);
  };

  // --- Calculators Section States ---
  const [calcType, setCalcType] = useState<'sip' | 'fd' | 'rd'>('sip');
  const [calcBank, setCalcBank] = useState('HDFC Bank');
  const [monthlyInvest, setMonthlyInvest] = useState(5000);
  const [interestRate, setInterestRate] = useState(7.1); // % per annum
  const [durationYears, setDurationYears] = useState(5);

  // Interest Rates Presets by Banks
  const presets = {
    'State Bank of India': { fd: 6.8, rd: 6.8, sip: 12.0 },
    'HDFC Bank': { fd: 7.1, rd: 7.0, sip: 12.0 },
    'ICICI Bank': { fd: 7.0, rd: 6.9, sip: 12.0 },
    'Axis Bank': { fd: 7.2, rd: 7.1, sip: 12.0 },
    'Kotak Mahindra': { fd: 7.25, rd: 7.15, sip: 12.0 },
    'Nifty 50 Index Mutual Fund': { fd: 6.5, rd: 6.5, sip: 13.5 }
  };

  const handlePresetChange = (bank: string) => {
    setCalcBank(bank);
    const p = presets[bank as keyof typeof presets];
    if (p) {
      if (calcType === 'fd') setInterestRate(p.fd);
      else if (calcType === 'rd') setInterestRate(p.rd);
      else setInterestRate(p.sip);
    }
  };

  // Projections calculations
  const calculateProjections = () => {
    const P = monthlyInvest;
    const r = interestRate / 100;
    const n = 12; // Compounded monthly
    const t = durationYears;
    const totalMonths = t * 12;

    let chartData = [];
    let totalInvested = 0;
    let currentWealthAccum = 0;

    for (let month = 1; month <= totalMonths; month++) {
      const year = (month / 12).toFixed(1);
      
      if (calcType === 'sip') {
        // SIP formula: M = P * [ ( (1 + i)^n - 1 ) / i ] * (1 + i)
        const i = r / 12;
        totalInvested += P;
        currentWealthAccum = P * (((Math.pow(1 + i, month) - 1) / i) * (1 + i));
      } else if (calcType === 'rd') {
        // Recurring Deposit (Quarterly or Monthly compounding approximation)
        const i = r / 12;
        totalInvested += P;
        currentWealthAccum = P * ((Math.pow(1 + i, month) - 1) / i);
      } else {
        // FD: Lump-sum deposited at start
        if (month === 1) {
          totalInvested = P * 10; // For FD, we simulate a 10x lump sum deposit
          currentWealthAccum = totalInvested;
        }
        const i = r / 12;
        currentWealthAccum = totalInvested * Math.pow(1 + i, month);
      }

      // Record key data points periodically
      if (month % 6 === 0 || month === totalMonths) {
        chartData.push({
          period: `Yr ${year}`,
          Invested: Math.round(totalInvested),
          FutureValue: Math.round(currentWealthAccum),
          Returns: Math.round(Math.max(0, currentWealthAccum - totalInvested))
        });
      }
    }

    return chartData;
  };

  const chartData = calculateProjections();
  const finalProj = chartData[chartData.length - 1] || { Invested: 0, FutureValue: 0, Returns: 0 };

  const handleSubmitGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalName || !targetAmount || Number(targetAmount) <= 0) return;

    await onAddGoal({
      name: goalName,
      targetAmount: Number(targetAmount),
      currentAmount: Number(initialAmount || 0),
      targetDate: targetDate || undefined
    });

    setGoalName('');
    setTargetAmount('');
    setInitialAmount('');
    setTargetDate('');
    setShowAddGoalModal(false);
  };

  const handleContribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showContributeModal || !contributeVal || Number(contributeVal) <= 0) return;

    const newAmt = showContributeModal.currentAmount + Number(contributeVal);
    await onEditGoal(showContributeModal.id, {
      currentAmount: newAmt
    });

    setContributeVal('');
    setShowContributeModal(null);
  };

  // Helper: calculate months left to target date
  const getMonthsLeft = (dateStr?: string) => {
    if (!dateStr) return null;
    const today = new Date();
    const target = new Date(dateStr);
    const yearsDiff = target.getFullYear() - today.getFullYear();
    const monthsDiff = target.getMonth() - today.getMonth();
    const totalMonths = (yearsDiff * 12) + monthsDiff;
    return totalMonths > 0 ? totalMonths : 1;
  };

  return (
    <div className="space-y-6">
      
      {/* Sub-Navigation Hub Tabs */}
      <div className="flex bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800 gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('milestones')}
          className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${activeTab === 'milestones' ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/10' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
        >
          <Target className="h-4 w-4" />
          Goal Planner
        </button>
        <button
          onClick={() => {
            setActiveTab('wealth');
            // Populate edit fields
            setEditSavingsAccount(currentWealth.savingsAccount.toString());
            setEditFixedDeposit(currentWealth.fixedDeposit.toString());
            setEditRecurringDeposit(currentWealth.recurringDeposit.toString());
            setEditSip(currentWealth.sip.toString());
            setEditMutualFunds(currentWealth.mutualFunds.toString());
            setEditGold(currentWealth.gold.toString());
            setEditEmergencyFund(currentWealth.emergencyFund.toString());
          }}
          className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${activeTab === 'wealth' ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/10' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
        >
          <Briefcase className="h-4 w-4" />
          Wealth Portfolio
        </button>
        <button
          onClick={() => setActiveTab('savings')}
          className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${activeTab === 'savings' ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/10' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
        >
          <PiggyBank className="h-4 w-4" />
          Savings Tracker
        </button>
        <button
          onClick={() => setActiveTab('calculators')}
          className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${activeTab === 'calculators' ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/10' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
        >
          <TrendingUp className="h-4 w-4" />
          calculators Pro
        </button>
      </div>

      {/* ========================================== */}
      {/* TAB 1: SAVINGS & MILESTONE GOAL PLANNER    */}
      {/* ========================================== */}
      {activeTab === 'milestones' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-800/10 border border-slate-700/10 rounded-3xl p-6">
            <div>
              <h2 className="text-base font-black text-white">Savings & Milestone Goals</h2>
              <p className="text-xs text-slate-400">Lock targets for cars, gold, trips, or emergency buffers. Gemini AI tracks feasibility.</p>
            </div>
            <button
              onClick={() => setShowAddGoalModal(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" /> Create Goal Planner
            </button>
          </div>

          {/* AI Goal Feasibility Warning & Recommendations */}
          {goals.length > 0 && (
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-3xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="h-4 w-4" />
                <span>Gemini Personal Wealth Advisor Plan</span>
              </div>
              <div className="text-xs text-slate-300 leading-relaxed">
                {(() => {
                  let totalRequiredMonthly = 0;
                  let hasTargetDate = false;

                  goals.forEach(goal => {
                    const monthsLeft = getMonthsLeft(goal.targetDate);
                    if (monthsLeft !== null) {
                      hasTargetDate = true;
                      const needed = Math.max(0, goal.targetAmount - goal.currentAmount);
                      totalRequiredMonthly += Math.round(needed / monthsLeft);
                    }
                  });

                  if (!hasTargetDate) {
                    return "Configure a Target Date on your milestones to unlock automated required savings simulations. We will cross-reference this against your monthly cash flow surplus.";
                  }

                  const isExceeded = totalRequiredMonthly > avgMonthlySurplus;

                  return (
                    <div className="space-y-2">
                      <p>
                        To complete all milestone targets on time, you must accumulate a minimum of{' '}
                        <span className="font-bold text-white">₹{totalRequiredMonthly.toLocaleString('en-IN')}/month</span>. 
                        Your live ledger indicates an active monthly surplus of{' '}
                        <span className="font-bold text-emerald-400">₹{avgMonthlySurplus.toLocaleString('en-IN')}</span>.
                      </p>
                      {isExceeded ? (
                        <div className="flex items-start gap-2 text-amber-400 bg-amber-500/5 p-3 rounded-xl border border-amber-500/10 mt-1">
                          <AlertCircle className="h-5 w-5 shrink-0" />
                          <p className="text-[11px] leading-relaxed">
                            <span className="font-black">Budget Warning:</span> Your aggregate milestone targets exceed your live monthly cash flow surplus! We highly recommend extending your goal deadlines or utilizing the 50/30/20 rules to trim entertainment expenses.
                          </p>
                        </div>
                      ) : (
                        <div className="flex items-start gap-2 text-emerald-400 bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/10 mt-1">
                          <Award className="h-5 w-5 shrink-0" />
                          <p className="text-[11px] leading-relaxed">
                            <span className="font-black">Budget Clear:</span> Exceptional work! Your surplus completely accommodates your savings pace. Continue monitoring UPI banking notifications to avoid miscellaneous leakages.
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Grid List of Goals */}
          {goals.length === 0 ? (
            <div className="text-center py-20 text-xs text-slate-500 border border-dashed border-slate-700/50 rounded-2xl bg-slate-800/5">
              No savings targets configured. Plan for a Bike, a Trip, a Laptop, or emergency reserves!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {goals.map((goal) => {
                const pct = goal.targetAmount > 0 ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100)) : 0;
                const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
                const completed = goal.currentAmount >= goal.targetAmount;
                const monthsLeft = getMonthsLeft(goal.targetDate);
                const monthlyRequired = monthsLeft ? Math.round(remaining / monthsLeft) : null;

                // Status Badge
                const getGoalStatusBadge = () => {
                  if (completed) {
                    return <span className="text-[9px] font-black uppercase text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">🟢 Completed</span>;
                  }
                  if (pct >= 80) {
                    return <span className="text-[9px] font-black uppercase text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">🟡 Near Completion</span>;
                  }
                  return <span className="text-[9px] font-black uppercase text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">🔵 In Progress</span>;
                };

                return (
                  <div 
                    key={goal.id}
                    className="bg-slate-850/40 border border-slate-800 hover:border-emerald-500/15 transition-all rounded-3xl p-6 flex flex-col justify-between space-y-4"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${completed ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                          {completed ? <Award className="h-5 w-5" /> : <PiggyBank className="h-5 w-5" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-black text-white">{goal.name}</h3>
                            {getGoalStatusBadge()}
                          </div>
                          <span className="text-[10px] text-slate-500">Created {goal.dateCreated}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditingGoal(goal)}
                          className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
                          title="Edit Goal"
                        >
                          <Settings className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmGoal(goal)}
                          className="p-1 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                          title="Delete Goal"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-400">Current Saved:</span>
                        <span className="text-slate-200">₹{goal.currentAmount.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-400">Target Goal:</span>
                        <span className="text-emerald-400 font-bold">₹{goal.targetAmount.toLocaleString('en-IN')}</span>
                      </div>

                      {goal.targetDate && (
                        <div className="flex justify-between text-xs font-semibold border-t border-slate-800/50 pt-1">
                          <span className="text-slate-400">Target Date:</span>
                          <span className="text-amber-400 font-bold">{goal.targetDate}</span>
                        </div>
                      )}

                      {monthsLeft && !completed && (
                        <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/60 mt-2">
                          <div className="flex justify-between text-[10px]">
                            <span className="text-slate-400">Required Savings:</span>
                            <span className="text-emerald-400 font-bold">₹{monthlyRequired?.toLocaleString('en-IN')}/mo</span>
                          </div>
                          <div className="flex justify-between text-[9px] text-slate-500">
                            <span>Time Left:</span>
                            <span>{monthsLeft} months</span>
                          </div>
                        </div>
                      )}

                      <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden mt-1">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${completed ? 'bg-emerald-500' : 'bg-amber-500'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>

                      <div className="flex justify-between text-[10px] pt-1">
                        <span className="text-slate-500 font-bold font-mono">{pct}% saved</span>
                        {completed ? (
                          <span className="text-emerald-400 font-bold uppercase tracking-wider">Milestone Unlocked!</span>
                        ) : (
                          <span className="text-slate-400">₹{remaining.toLocaleString('en-IN')} remaining</span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setShowContributeModal(goal)}
                        className="flex items-center justify-center gap-1 py-2 px-3 rounded-xl bg-slate-900/40 hover:bg-slate-900 text-xs text-white font-bold border border-slate-700/60 hover:border-emerald-500/40 transition-colors cursor-pointer"
                      >
                        <ArrowUpRight className="h-3.5 w-3.5 text-emerald-400" /> Contribute
                      </button>

                      {!completed && (
                        <button
                          onClick={async () => {
                            await onEditGoal(goal.id, { currentAmount: goal.targetAmount });
                          }}
                          className="flex items-center justify-center gap-1 py-2 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-xs text-emerald-400 font-bold border border-emerald-500/30 transition-colors cursor-pointer"
                        >
                          <Award className="h-3.5 w-3.5" /> Complete
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 2: WEALTH & ASSETS PORTFOLIO DASHBOARD */}
      {/* ========================================== */}
      {activeTab === 'wealth' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-800/10 border border-slate-700/10 rounded-3xl p-6">
            <div>
              <h2 className="text-base font-black text-white">Wealth Allocation Hub</h2>
              <p className="text-xs text-slate-400">Consolidate balances in Savings, Fixed Deposits, Gold, Mutual Funds, and Emergency Fund.</p>
            </div>
            {!wealthEditMode ? (
              <button
                onClick={() => setWealthEditMode(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                <Settings className="h-4 w-4" /> Manage Portfolio
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setWealthEditMode(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveWealth}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Save Allocation
                </button>
              </div>
            )}
          </div>

          {/* Core Balance & Net Worth Hero */}
          <div className="bg-slate-900/50 rounded-3xl border border-slate-800 p-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Aggregate Family Net Worth</span>
              <div className="text-3xl font-black text-white tracking-tight">
                ₹{netWorth.toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-slate-500">Includes all liquid capital, fixed deposits, gold values, and systematic mutual portfolios.</p>
            </div>

            {/* Emergency Fund status indicator */}
            <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800 max-w-sm w-full space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                <AlertCircle className="h-4 w-4" />
                <span>Emergency Fund Status</span>
              </div>
              <p className="text-[11px] text-slate-300">
                Current emergency reserves: <span className="text-white font-bold">₹{(Number(currentWealth.emergencyFund) || 0).toLocaleString('en-IN')}</span>. 
                Our advisors recommend a minimum buffer of ₹50,000 to cover 3 months of living expenses.
              </p>
            </div>
          </div>

          {/* Grid of Portfolio Assets */}
          {!wealthEditMode ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Savings Account */}
              <div className="bg-slate-850/30 border border-slate-800 p-5 rounded-2xl space-y-2">
                <div className="flex justify-between items-center text-slate-400">
                  <span className="text-xs font-bold">Savings Account</span>
                  <Coins className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="text-lg font-black text-white">₹{Number(currentWealth.savingsAccount).toLocaleString('en-IN')}</div>
                <p className="text-[10px] text-slate-500">Liquid bank account balance</p>
              </div>

              {/* Fixed Deposits */}
              <div className="bg-slate-850/30 border border-slate-800 p-5 rounded-2xl space-y-2">
                <div className="flex justify-between items-center text-slate-400">
                  <span className="text-xs font-bold">Fixed Deposits (FD)</span>
                  <Lock className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="text-lg font-black text-white">₹{Number(currentWealth.fixedDeposit).toLocaleString('en-IN')}</div>
                <p className="text-[10px] text-slate-500">Safe compounding wealth blocks</p>
              </div>

              {/* Recurring Deposits */}
              <div className="bg-slate-850/30 border border-slate-800 p-5 rounded-2xl space-y-2">
                <div className="flex justify-between items-center text-slate-400">
                  <span className="text-xs font-bold">Recurring Deposit (RD)</span>
                  <Calendar className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="text-lg font-black text-white">₹{Number(currentWealth.recurringDeposit).toLocaleString('en-IN')}</div>
                <p className="text-[10px] text-slate-500">Targeted monthly bank savings</p>
              </div>

              {/* Gold Value */}
              <div className="bg-slate-850/30 border border-slate-800 p-5 rounded-2xl space-y-2">
                <div className="flex justify-between items-center text-slate-400">
                  <span className="text-xs font-bold">Sovereign Gold / Physical</span>
                  <Award className="h-4 w-4 text-yellow-500" />
                </div>
                <div className="text-lg font-black text-white">₹{Number(currentWealth.gold).toLocaleString('en-IN')}</div>
                <p className="text-[10px] text-slate-500">Inflation-hedged physical reserves</p>
              </div>

              {/* SIP Allocations */}
              <div className="bg-slate-850/30 border border-slate-800 p-5 rounded-2xl space-y-2">
                <div className="flex justify-between items-center text-slate-400">
                  <span className="text-xs font-bold">SIP Investments</span>
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="text-lg font-black text-white">₹{Number(currentWealth.sip).toLocaleString('en-IN')}</div>
                <p className="text-[10px] text-slate-500">Compounding systematic plans</p>
              </div>

              {/* Mutual Funds */}
              <div className="bg-slate-850/30 border border-slate-800 p-5 rounded-2xl space-y-2">
                <div className="flex justify-between items-center text-slate-400">
                  <span className="text-xs font-bold">Mutual Funds & Equity</span>
                  <Sparkles className="h-4 w-4 text-purple-400" />
                </div>
                <div className="text-lg font-black text-white">₹{Number(currentWealth.mutualFunds).toLocaleString('en-IN')}</div>
                <p className="text-[10px] text-slate-500">Indices and corporate funds</p>
              </div>

              {/* Emergency Reserve */}
              <div className="bg-slate-850/30 border border-slate-800 p-5 rounded-2xl space-y-2 col-span-1 sm:col-span-2">
                <div className="flex justify-between items-center text-slate-400">
                  <span className="text-xs font-bold">Emergency Liquid Buffer</span>
                  <AlertCircle className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="text-lg font-black text-white">₹{Number(currentWealth.emergencyFund).toLocaleString('en-IN')}</div>
                <p className="text-[10px] text-slate-500">Reserved safely for absolute emergencies</p>
              </div>

            </div>
          ) : (
            // Edit forms for wealth
            <div className="bg-slate-900/40 p-6 border border-slate-800 rounded-3xl space-y-4 max-w-2xl mx-auto">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
                <Settings className="h-4 w-4 text-emerald-400" /> Modify Current Asset Balances
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Savings Account (₹)</label>
                  <input
                    type="number"
                    value={editSavingsAccount}
                    onChange={(e) => setEditSavingsAccount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Fixed Deposit (₹)</label>
                  <input
                    type="number"
                    value={editFixedDeposit}
                    onChange={(e) => setEditFixedDeposit(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Recurring Deposit (₹)</label>
                  <input
                    type="number"
                    value={editRecurringDeposit}
                    onChange={(e) => setEditRecurringDeposit(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Sovereign Gold (₹)</label>
                  <input
                    type="number"
                    value={editGold}
                    onChange={(e) => setEditGold(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">SIP Holdings (₹)</label>
                  <input
                    type="number"
                    value={editSip}
                    onChange={(e) => setEditSip(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Mutual Funds (₹)</label>
                  <input
                    type="number"
                    value={editMutualFunds}
                    onChange={(e) => setEditMutualFunds(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:border-emerald-500 outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Emergency reserves (₹)</label>
                  <input
                    type="number"
                    value={editEmergencyFund}
                    onChange={(e) => setEditEmergencyFund(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <button
                onClick={handleSaveWealth}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-xl cursor-pointer"
              >
                Confirm Portfolio Update
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 3: SAVINGS TRACKER (A/B)               */}
      {/* ========================================== */}
      {activeTab === 'savings' && (
        <div className="space-y-6">
          <div className="bg-slate-800/10 border border-slate-700/10 rounded-3xl p-6">
            <h2 className="text-base font-black text-white">Interactive Savings Tracker</h2>
            <p className="text-xs text-slate-400">Lock and transfer monthly savings surpluses. Build a persistent historic log of wealth growth.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Live Metrics Calculator (Module A) */}
            <div className="bg-slate-850/40 border border-slate-800 rounded-3xl p-6 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Live Ledger Flow Calculator</span>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
                    <span className="text-xs text-slate-400">Total Income flow:</span>
                    <span className="text-xs text-emerald-400 font-bold">+₹{totalIncome.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
                    <span className="text-xs text-slate-400">Total Expenses flow:</span>
                    <span className="text-xs text-rose-400 font-bold">-₹{totalExpense.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center py-2.5 border-b border-slate-800">
                    <span className="text-xs font-bold text-white">Current Cash Savings:</span>
                    <span className="text-sm text-white font-extrabold">₹{currentLiveSavings.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between text-xs font-bold mb-1">
                    <span className="text-slate-300">Savings Ratio (% of income)</span>
                    <span className="text-emerald-400">{savingsPercentage}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{ width: `${savingsPercentage}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Lock Savings to History form (Module B) */}
              <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800 space-y-3 mt-4">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                  <Lock className="h-4 w-4" />
                  <span>Settle Savings to Log</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] text-slate-500 uppercase tracking-wider mb-1">Target Month</label>
                    <input
                      type="month"
                      value={lockMonth}
                      onChange={(e) => setLockMonth(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-[10px] text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-500 uppercase tracking-wider mb-1">Savings Amount (₹)</label>
                    <input
                      type="number"
                      value={lockAmountVal}
                      onChange={(e) => setLockAmountVal(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-[10px] text-white outline-none"
                    />
                  </div>
                </div>

                <button
                  onClick={handleLockSavings}
                  className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-lg cursor-pointer"
                >
                  Settle to History
                </button>
              </div>

            </div>

            {/* Savings History Log List & Projections chart */}
            <div className="bg-slate-850/40 border border-slate-800 rounded-3xl p-6 lg:col-span-2 space-y-6">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Historical Savings Graph</span>
                <p className="text-xs text-slate-500">Track how your month-on-month capital storage performs. Maintain records persistently.</p>
              </div>

              {/* History Bar Chart */}
              <div className="h-48 w-full bg-slate-900/20 rounded-2xl p-2 border border-slate-800/40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={savingsHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                    <XAxis dataKey="month" stroke="#64748B" fontSize={9} />
                    <YAxis stroke="#64748B" fontSize={9} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px' }} 
                      labelStyle={{ color: '#94A3B8', fontSize: '10px' }}
                      itemStyle={{ color: '#10B981', fontSize: '11px' }}
                    />
                    <Bar dataKey="amount" fill="#10B981" radius={[4, 4, 0, 0]} name="Saved (INR)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* History Table */}
              <div className="border border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900/40 text-[10px] font-bold uppercase text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-4">Locked Month</th>
                      <th className="py-2.5 px-4 text-right">Locked Capital</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {savingsHistory.map((h, i) => (
                      <tr key={i} className="hover:bg-slate-800/10 transition-colors">
                        <td className="py-2.5 px-4 font-mono font-bold text-slate-200">{h.month}</td>
                        <td className="py-2.5 px-4 text-right text-emerald-400 font-bold">₹{h.amount.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 4: CALCULATORS & PROJECTIONS          */}
      {/* ========================================== */}
      {activeTab === 'calculators' && (
        <div className="space-y-6">
          <div className="bg-slate-800/10 border border-slate-700/10 rounded-3xl p-6">
            <h2 className="text-base font-black text-white">Investment growth calculators</h2>
            <p className="text-xs text-slate-400">Simulate potential outcomes for Mutual Funds, Systematic SIPs, Fixed deposits, and RD.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Calculator controls */}
            <div className="bg-slate-850/40 border border-slate-800 rounded-3xl p-6 space-y-5">
              
              {/* Type Switcher */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Simulation Category</label>
                <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                  <button
                    onClick={() => { setCalcType('sip'); handlePresetChange(calcBank); }}
                    className={`py-1 px-2 text-[10px] font-bold rounded-lg cursor-pointer ${calcType === 'sip' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
                  >
                    SIP
                  </button>
                  <button
                    onClick={() => { setCalcType('fd'); handlePresetChange(calcBank); }}
                    className={`py-1 px-2 text-[10px] font-bold rounded-lg cursor-pointer ${calcType === 'fd' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
                  >
                    FD
                  </button>
                  <button
                    onClick={() => { setCalcType('rd'); handlePresetChange(calcBank); }}
                    className={`py-1 px-2 text-[10px] font-bold rounded-lg cursor-pointer ${calcType === 'rd' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
                  >
                    RD
                  </button>
                </div>
              </div>

              {/* Presets by Banks */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Institution Preset</label>
                <select
                  value={calcBank}
                  onChange={(e) => handlePresetChange(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 outline-none"
                >
                  {Object.keys(presets).map((bank) => (
                    <option key={bank} value={bank}>{bank}</option>
                  ))}
                </select>
              </div>

              {/* Monthly Investment Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-400">{calcType === 'fd' ? 'Lump Sum Deposit' : 'Monthly Contribution'}</span>
                  <span className="text-white">₹{monthlyInvest.toLocaleString('en-IN')}</span>
                </div>
                <input
                  type="range"
                  min="500"
                  max={calcType === 'fd' ? "200000" : "50000"}
                  step="500"
                  value={monthlyInvest}
                  onChange={(e) => setMonthlyInvest(Number(e.target.value))}
                  className="w-full h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              {/* Interest Rate Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-400">Interest / Return Rate</span>
                  <span className="text-white">{interestRate}% p.a.</span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="18"
                  step="0.05"
                  value={interestRate}
                  onChange={(e) => setInterestRate(Number(e.target.value))}
                  className="w-full h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              {/* Duration Years Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-400">Time Duration</span>
                  <span className="text-white">{durationYears} Years</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="30"
                  step="1"
                  value={durationYears}
                  onChange={(e) => setDurationYears(Number(e.target.value))}
                  className="w-full h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

            </div>

            {/* Projection Chart & Outcomes */}
            <div className="bg-slate-850/40 border border-slate-800 rounded-3xl p-6 lg:col-span-2 space-y-6 flex flex-col justify-between">
              
              <div className="space-y-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Projected Growth Forecast</span>
                
                {/* Metrics Breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Capital Invested</span>
                    <span className="text-sm font-black text-white">₹{finalProj.Invested.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Est. Returns</span>
                    <span className="text-sm font-black text-emerald-400">₹{finalProj.Returns.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Aggregate Wealth</span>
                    <span className="text-sm font-black text-white">₹{finalProj.FutureValue.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Growth Area Chart */}
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                      <XAxis dataKey="period" stroke="#64748B" fontSize={9} />
                      <YAxis stroke="#64748B" fontSize={9} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px' }}
                        labelStyle={{ color: '#94A3B8', fontSize: '10px' }}
                        itemStyle={{ fontSize: '11px' }}
                      />
                      <Area type="monotone" dataKey="Invested" stroke="#334155" fill="#334155" fillOpacity={0.1} name="Invested" />
                      <Area type="monotone" dataKey="FutureValue" stroke="#10B981" fill="#10B981" fillOpacity={0.2} name="Wealth Value" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Disclosure */}
              <div className="text-[10px] text-slate-500 italic bg-slate-900/40 p-3 rounded-xl border border-slate-800/40 flex items-start gap-2">
                <Info className="h-4 w-4 shrink-0 text-slate-400 mt-0.5" />
                <span>Regulatory Disclaimer: These investment calculations are for simulation purposes only and approximate compounding cycles. Mutual Fund / Equity growth values never offer guaranteed profits. Please evaluate market parameters prior to locking capital.</span>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODALS SECTION                             */}
      {/* ========================================== */}

      {/* Add Savings Goal Modal */}
      {showAddGoalModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 relative shadow-2xl">
            <button
              onClick={() => setShowAddGoalModal(false)}
              className="absolute right-4 top-4 text-slate-500 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-base font-bold text-white mb-4">
              Add Savings Goal Target
            </h3>

            <form onSubmit={handleSubmitGoal} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Goal name / Target item</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Electric Bike, Gold Sovereign, MacBook, Emergency Buffer"
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-700/60 rounded-xl px-4 py-2 text-sm text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Target savings (INR)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-2 text-sm text-slate-500 font-bold">₹</span>
                    <input
                      type="number"
                      required
                      placeholder="80000"
                      value={targetAmount}
                      onChange={(e) => setTargetAmount(e.target.value)}
                      className="w-full bg-slate-950/60 border border-slate-700/60 rounded-xl pl-8 pr-4 py-2 text-sm text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Initial Saved (INR)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-2 text-sm text-slate-500 font-bold">₹</span>
                    <input
                      type="number"
                      placeholder="0"
                      value={initialAmount}
                      onChange={(e) => setInitialAmount(e.target.value)}
                      className="w-full bg-slate-950/60 border border-slate-700/60 rounded-xl pl-8 pr-4 py-2 text-sm text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Target Date (Unlock AI Planner)</label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-700/60 rounded-xl px-4 py-2 text-sm text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Launch Savings Goal
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Contribute Funds Modal */}
      {showContributeModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 relative shadow-2xl">
            <button
              onClick={() => setShowContributeModal(null)}
              className="absolute right-4 top-4 text-slate-500 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-base font-bold text-white mb-1">
              Contribute Savings Funds
            </h3>
            <p className="text-xs text-slate-400 mb-4">Adding capital to your target savings for {showContributeModal.name}.</p>

            <form onSubmit={handleContribute} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Contribution Amount (INR)</label>
                <div className="relative">
                  <span className="absolute left-4 top-2 text-sm text-slate-500 font-bold">₹</span>
                  <input
                    type="number"
                    required
                    placeholder="5000"
                    value={contributeVal}
                    onChange={(e) => setContributeVal(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-700/60 rounded-xl pl-8 pr-4 py-2 text-sm text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Deposit Funds
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmGoal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 relative shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2">Delete Savings Goal?</h3>
            <p className="text-xs text-slate-400 mb-6">
              Are you sure you want to delete the savings goal <span className="font-bold text-white">"{deleteConfirmGoal.name}"</span> permanently? Any saved progress tracking will be removed.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmGoal(null)}
                className="flex-1 py-2 px-4 bg-slate-850 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  await onDeleteGoal(deleteConfirmGoal.id);
                  setDeleteConfirmGoal(null);
                }}
                className="flex-1 py-2 px-4 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Delete Goal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
