/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Reminder, ReminderType } from '../types.js';
import { Plus, Trash2, Calendar, DollarSign, CreditCard, Receipt, CheckCircle, X, CheckCircle2 } from 'lucide-react';

interface RemindersViewProps {
  reminders: Reminder[];
  onAddReminder: (reminder: Omit<Reminder, 'id' | 'userId' | 'isPaid'>) => Promise<void>;
  onEditReminder: (id: string, reminder: Partial<Reminder>) => Promise<void>;
  onDeleteReminder: (id: string) => Promise<void>;
}

export default function RemindersView({
  reminders,
  onAddReminder,
  onEditReminder,
  onDeleteReminder
}: RemindersViewProps) {

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteConfirmReminder, setDeleteConfirmReminder] = useState<Reminder | null>(null);
  const [payConfirmReminder, setPayConfirmReminder] = useState<Reminder | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<ReminderType>('bill');
  const [isRecurring, setIsRecurring] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount || Number(amount) <= 0 || !dueDate) return;

    await onAddReminder({
      title,
      amount: Number(amount),
      dueDate,
      type,
      isRecurring
    });

    // Reset Form
    setTitle('');
    setAmount('');
    setDueDate(new Date().toISOString().split('T')[0]);
    setType('bill');
    setIsRecurring(false);
    setShowAddModal(false);
  };

  const getIcon = (remType: ReminderType) => {
    switch (remType) {
      case 'salary':
        return <DollarSign className="h-5 w-5 text-emerald-400" />;
      case 'emi':
        return <CreditCard className="h-5 w-5 text-rose-400" />;
      case 'bill':
      default:
        return <Receipt className="h-5 w-5 text-amber-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-800/10 border border-slate-700/10 rounded-3xl p-6">
        <div>
          <h2 className="text-base font-bold text-white">Salary, Bills & EMI Reminders Hub</h2>
          <p className="text-xs text-slate-400">Keep tabs on upcoming bill deadlines, monthly EMIs, or expected salary dates.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Configure Reminder Alert
        </button>
      </div>

      {/* Grid listing reminders */}
      {reminders.length === 0 ? (
        <div className="text-center py-20 text-xs text-slate-500 border border-dashed border-slate-700/50 rounded-2xl bg-slate-800/5">
          No reminders configured. Set reminders for rent, credit cards, or expected salary dates.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reminders.map((rem) => {
            const isDueSoon = new Date(rem.dueDate).getTime() - new Date().getTime() < 3 * 24 * 60 * 60 * 1000 && !rem.isPaid;

            return (
              <div 
                key={rem.id}
                className={`bg-slate-800/20 border transition-all rounded-3xl p-6 flex flex-col justify-between space-y-4 relative overflow-hidden ${rem.isPaid ? 'border-emerald-500/10 opacity-70' : isDueSoon ? 'border-rose-500/30' : 'border-slate-700/10'}`}
              >
                {isDueSoon && (
                  <div className="absolute top-0 right-0 bg-rose-500 text-slate-950 font-black text-[8px] uppercase tracking-wider px-3 py-1 rounded-bl-xl">
                    Due Soon
                  </div>
                )}

                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 bg-slate-950/60`}>
                      {getIcon(rem.type)}
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white">{rem.title}</h3>
                      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">{rem.type}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setDeleteConfirmReminder(rem)}
                    className="p-1 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-400">Scheduled Amount:</span>
                    <span className="text-white font-bold">₹{rem.amount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-400">Due Date:</span>
                    <span className="text-slate-300 font-mono">{rem.dueDate}</span>
                  </div>
                  {rem.isRecurring && (
                    <div className="text-[10px] text-teal-400 font-bold mt-1">
                      Cycle: Monthly Auto-Renewal
                    </div>
                  )}
                </div>

                {rem.isPaid ? (
                  <div className="flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl bg-emerald-500/10 text-emerald-400 text-xs font-black border border-emerald-500/20">
                    <CheckCircle2 className="h-4.5 w-4.5" /> Settled & Paid
                  </div>
                ) : (
                  <button
                    onClick={() => setPayConfirmReminder(rem)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl bg-slate-900/40 hover:bg-slate-900 text-xs text-white font-bold border border-slate-700/60 hover:border-emerald-500/40 transition-all cursor-pointer"
                  >
                    Mark as Paid / Settle
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Reminder Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 relative shadow-2xl">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute right-4 top-4 text-slate-500 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-base font-bold text-white mb-4">
              Add Scheduled Reminder Alert
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Reminder Title / description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rent Payment, Car loan, Internet Bill"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-700/60 rounded-xl px-4 py-2 text-sm text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Reminder Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as ReminderType)}
                  className="w-full bg-slate-950/60 border border-slate-700/60 rounded-xl px-4 py-2 text-sm text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                >
                  <option value="bill">Utility Bill Payment</option>
                  <option value="emi">EMI / Installment</option>
                  <option value="salary">Salary / Income Reminder</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Target Amount (INR)</label>
                <div className="relative">
                  <span className="absolute left-4 top-2 text-sm text-slate-500 font-bold">₹</span>
                  <input
                    type="number"
                    required
                    placeholder="15000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-700/60 rounded-xl pl-8 pr-4 py-2 text-sm text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Due Date</label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-700/60 rounded-xl px-4 py-2 text-sm text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-between bg-slate-950/40 p-3 rounded-xl border border-slate-800">
                <label className="text-xs font-bold text-slate-300">Monthly Recurring Schedule</label>
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="h-4.5 w-4.5 text-emerald-500 bg-slate-950 border-slate-700 rounded focus:ring-emerald-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Set Scheduled Reminder
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmReminder && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 relative shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2">Delete Reminder Alert?</h3>
            <p className="text-xs text-slate-400 mb-6">
              Are you sure you want to remove the reminder alert for <span className="font-bold text-white">"{deleteConfirmReminder.title}"</span> permanently?
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmReminder(null)}
                className="flex-1 py-2 px-4 bg-slate-850 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  await onDeleteReminder(deleteConfirmReminder.id);
                  setDeleteConfirmReminder(null);
                }}
                className="flex-1 py-2 px-4 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pay Confirmation Modal */}
      {payConfirmReminder && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 relative shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2">Confirm Payment?</h3>
            <p className="text-xs text-slate-400 mb-6">
              Confirm payment of <span className="font-bold text-white">₹{payConfirmReminder.amount.toLocaleString('en-IN')}</span> for <span className="font-bold text-white">"{payConfirmReminder.title}"</span>? This will auto-post a corresponding transaction ledger entry.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setPayConfirmReminder(null)}
                className="flex-1 py-2 px-4 bg-slate-850 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  await onEditReminder(payConfirmReminder.id, { isPaid: true });
                  setPayConfirmReminder(null);
                }}
                className="flex-1 py-2 px-4 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
