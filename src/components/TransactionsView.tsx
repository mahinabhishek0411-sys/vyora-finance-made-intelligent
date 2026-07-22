/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Transaction, CustomCategory, TransactionType } from '../types.js';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Copy,
  Search, 
  Filter, 
  Tag, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  CheckCircle, 
  X,
  Camera,
  CreditCard,
  Wallet,
  Building,
  DollarSign,
  AlertCircle,
  Eye,
  ArrowUpDown,
  Layers,
  Briefcase,
  GraduationCap,
  HeartPulse,
  Utensils,
  Car,
  ShoppingBag,
  Receipt,
  Tv,
  PiggyBank,
  HelpCircle,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TransactionsViewProps {
  transactions: Transaction[];
  customCategories: CustomCategory[];
  onAddTransaction: (tx: Omit<Transaction, 'id' | 'userId'>) => Promise<boolean | void>;
  onEditTransaction: (id: string, tx: Partial<Transaction>) => Promise<void>;
  onDeleteTransaction: (id: string) => Promise<void>;
  onAddCategory: (category: Omit<CustomCategory, 'id' | 'userId'>) => Promise<void>;
  onEditCategory?: (id: string, category: Partial<CustomCategory>) => Promise<void>;
  onDeleteCategory?: (id: string) => Promise<void>;
}

// 12 Mandatory Default Categories
export const DEFAULT_CATEGORIES = [
  { name: 'Food', type: 'expense', icon: 'Utensils', color: '#EF4444' },
  { name: 'Transport', type: 'expense', icon: 'Car', color: '#F59E0B' },
  { name: 'Shopping', type: 'expense', icon: 'ShoppingBag', color: '#EC4899' },
  { name: 'Bills', type: 'expense', icon: 'Receipt', color: '#8B5CF6' },
  { name: 'Health', type: 'expense', icon: 'HeartPulse', color: '#10B981' },
  { name: 'Education', type: 'expense', icon: 'GraduationCap', color: '#3B82F6' },
  { name: 'Entertainment', type: 'expense', icon: 'Tv', color: '#6366F1' },
  { name: 'Investment', type: 'both', icon: 'PiggyBank', color: '#14B8A6' },
  { name: 'Salary', type: 'income', icon: 'DollarSign', color: '#22C55E' },
  { name: 'Business', type: 'income', icon: 'Briefcase', color: '#0EA5E9' },
  { name: 'Freelance', type: 'income', icon: 'Wallet', color: '#A855F7' },
  { name: 'Other', type: 'both', icon: 'HelpCircle', color: '#64748B' },
];

export const PAYMENT_METHODS = [
  'UPI',
  'Credit Card',
  'Debit Card',
  'Cash',
  'Bank Transfer',
  'Net Banking',
  'Other'
];

export const CATEGORY_ICONS: Record<string, any> = {
  Utensils, Car, ShoppingBag, Receipt, HeartPulse, GraduationCap, Tv,
  PiggyBank, DollarSign, Briefcase, Wallet, HelpCircle, Tag, CreditCard, Building
};

export default function TransactionsView({
  transactions,
  customCategories,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
  onAddCategory,
  onEditCategory,
  onDeleteCategory
}: TransactionsViewProps) {

  // Toast message state
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Combine default & custom categories
  const allCategoryNames = useMemo(() => {
    const defaultNames = DEFAULT_CATEGORIES.map(c => c.name);
    const customNames = customCategories.map(c => c.name);
    return Array.from(new Set([...defaultNames, ...customNames]));
  }, [customCategories]);

  // Modals & Panels State
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [selectedDetailsTx, setSelectedDetailsTx] = useState<Transaction | null>(null);
  const [deleteConfirmTx, setDeleteConfirmTx] = useState<Transaction | null>(null);
  const [modalError, setModalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Category Manager Modal
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CustomCategory | null>(null);
  const [deleteConfirmCat, setDeleteConfirmCat] = useState<CustomCategory | null>(null);
  const [catName, setCatName] = useState('');
  const [catType, setCatType] = useState<TransactionType | 'both'>('expense');
  const [catIcon, setCatIcon] = useState('Tag');
  const [catColor, setCatColor] = useState('#3B82F6');

  // Search, Filter & Sort State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('all');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc' | 'category_asc' | 'category_desc'>('date_desc');

  // Transaction Form state
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState('Food');
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceInterval, setRecurrenceInterval] = useState<'weekly' | 'monthly' | 'none'>('none');
  const [upiRef, setUpiRef] = useState('');

  // Receipt Scanner States
  const [showScanModal, setShowScanModal] = useState(false);
  const [receiptImage, setReceiptImage] = useState('');
  const [receiptMimeType, setReceiptMimeType] = useState('');
  const [scanLoading, setScanLoading] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [scanAmount, setScanAmount] = useState('');
  const [scanMerchant, setScanMerchant] = useState('');
  const [scanDate, setScanDate] = useState('');
  const [scanCategory, setScanCategory] = useState('Other');
  const [scanPaymentMethod, setScanPaymentMethod] = useState('UPI');

  // Open Form Handlers
  const handleOpenAddModal = (defaultType: TransactionType = 'expense') => {
    setEditingTx(null);
    setAmount('');
    setType(defaultType);
    setCategory(defaultType === 'income' ? 'Salary' : 'Food');
    setDescription('');
    setPaymentMethod('UPI');
    setDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setIsRecurring(false);
    setRecurrenceInterval('none');
    setUpiRef('');
    setModalError('');
    setShowAddModal(true);
  };

  const handleOpenEditModal = (tx: Transaction) => {
    setEditingTx(tx);
    setAmount(tx.amount.toString());
    setType(tx.type);
    setCategory(tx.category);
    setDescription(tx.description || '');
    setPaymentMethod(tx.paymentMethod || 'UPI');
    setDate(tx.date);
    setNotes(tx.notes || '');
    setIsRecurring(!!tx.isRecurring);
    setRecurrenceInterval(tx.recurrenceInterval || 'none');
    setUpiRef(tx.upiRef || '');
    setModalError('');
    setSelectedDetailsTx(null);
    setShowAddModal(true);
  };

  const handleDuplicateTransaction = (tx: Transaction) => {
    setEditingTx(null); // Fresh creation
    setAmount(tx.amount.toString());
    setType(tx.type);
    setCategory(tx.category);
    setDescription(`${tx.description} (Copy)`);
    setPaymentMethod(tx.paymentMethod || 'UPI');
    setDate(new Date().toISOString().split('T')[0]);
    setNotes(tx.notes || '');
    setIsRecurring(false);
    setRecurrenceInterval('none');
    setUpiRef('');
    setModalError('');
    setSelectedDetailsTx(null);
    setShowAddModal(true);
    showToast('Transaction duplicated. Adjust details and save.');
  };

  // Submit Transaction
  const handleSubmitTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0 || !category || !date) {
      setModalError('Please enter a valid positive amount, category, and date.');
      return;
    }

    setIsSubmitting(true);
    setModalError('');

    try {
      const payload = {
        amount: Number(amount),
        type,
        category,
        description: description.trim(),
        paymentMethod,
        date,
        notes: notes.trim(),
        isRecurring,
        recurrenceInterval: isRecurring ? recurrenceInterval : 'none',
        upiRef: upiRef.trim()
      };

      if (editingTx) {
        await onEditTransaction(editingTx.id, payload);
        showToast('Transaction updated successfully!');
      } else {
        const success = await onAddTransaction(payload);
        if (success !== false) {
          showToast(`${type === 'income' ? 'Income' : 'Expense'} recorded successfully!`);
        }
      }
      setShowAddModal(false);
    } catch (err: any) {
      setModalError(err.message || 'Failed to save transaction.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm Delete Transaction
  const handleExecuteDeleteTx = async () => {
    if (!deleteConfirmTx) return;
    try {
      await onDeleteTransaction(deleteConfirmTx.id);
      showToast('Transaction deleted successfully!');
      setDeleteConfirmTx(null);
      if (selectedDetailsTx?.id === deleteConfirmTx.id) {
        setSelectedDetailsTx(null);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to delete transaction', 'error');
    }
  };

  // Category Form Handler
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;

    try {
      if (editingCategory && onEditCategory) {
        await onEditCategory(editingCategory.id, {
          name: catName.trim(),
          type: catType,
          icon: catIcon,
          color: catColor
        });
        showToast('Category updated!');
      } else {
        await onAddCategory({
          name: catName.trim(),
          type: catType,
          icon: catIcon,
          color: catColor
        });
        showToast('Category created!');
      }
      setCatName('');
      setEditingCategory(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to save category', 'error');
    }
  };

  const handleExecuteDeleteCat = async () => {
    if (!deleteConfirmCat || !onDeleteCategory) return;
    try {
      await onDeleteCategory(deleteConfirmCat.id);
      showToast('Custom category removed!');
      setDeleteConfirmCat(null);
    } catch (err: any) {
      showToast('Failed to delete category', 'error');
    }
  };

  // Receipt Scanner Upload
  const handleReceiptFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setReceiptMimeType(file.type);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const base64Data = reader.result.split(',')[1];
        setReceiptImage(base64Data);
        setScanResult(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleScanReceipt = async () => {
    if (!receiptImage) return;

    setScanLoading(true);
    try {
      const res = await fetch('/api/ai/scan-receipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          base64Image: receiptImage,
          mimeType: receiptMimeType
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to scan receipt');

      setScanResult(data);
      setScanAmount(data.amount?.toString() || '');
      setScanMerchant(data.merchant || '');
      setScanDate(data.date || new Date().toISOString().split('T')[0]);
      setScanCategory(allCategoryNames.includes(data.category) ? data.category : 'Other');
      setScanPaymentMethod('UPI');
    } catch (err: any) {
      showToast(err.message || 'Scan failed. Please enter manually.', 'error');
    } finally {
      setScanLoading(false);
    }
  };

  const handleConfirmScanSave = async () => {
    if (!scanAmount || Number(scanAmount) <= 0 || !scanCategory || !scanDate) {
      showToast('Please fill out required fields', 'error');
      return;
    }

    await onAddTransaction({
      amount: Number(scanAmount),
      type: 'expense',
      category: scanCategory,
      description: scanMerchant || 'Scanned Receipt',
      paymentMethod: scanPaymentMethod,
      date: scanDate,
      notes: 'Logged via AI Receipt Scanner',
      isRecurring: false,
      recurrenceInterval: 'none'
    });

    setShowScanModal(false);
    setReceiptImage('');
    setScanResult(null);
    showToast('Expense saved from scanned receipt!');
  };

  // Filter & Sort Logic
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = !query || 
        tx.description.toLowerCase().includes(query) ||
        tx.category.toLowerCase().includes(query) ||
        tx.amount.toString().includes(query) ||
        tx.date.includes(query) ||
        (tx.paymentMethod && tx.paymentMethod.toLowerCase().includes(query)) ||
        (tx.notes && tx.notes.toLowerCase().includes(query));

      const matchesType = filterType === 'all' || tx.type === filterType;
      const matchesCategory = filterCategory === 'all' || tx.category === filterCategory;
      const matchesPaymentMethod = filterPaymentMethod === 'all' || tx.paymentMethod === filterPaymentMethod;

      const matchesStartDate = !filterStartDate || new Date(tx.date) >= new Date(filterStartDate);
      const matchesEndDate = !filterEndDate || new Date(tx.date) <= new Date(filterEndDate);

      return matchesSearch && matchesType && matchesCategory && matchesPaymentMethod && matchesStartDate && matchesEndDate;
    }).sort((a, b) => {
      if (sortBy === 'date_desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortBy === 'date_asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortBy === 'amount_desc') return b.amount - a.amount;
      if (sortBy === 'amount_asc') return a.amount - b.amount;
      if (sortBy === 'category_asc') return a.category.localeCompare(b.category);
      if (sortBy === 'category_desc') return b.category.localeCompare(a.category);
      return 0;
    });
  }, [transactions, searchQuery, filterType, filterCategory, filterPaymentMethod, filterStartDate, filterEndDate, sortBy]);

  // Total summary for current filtered view
  const filteredIncomeSum = useMemo(() => {
    return filteredTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  }, [filteredTransactions]);

  const filteredExpenseSum = useMemo(() => {
    return filteredTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  }, [filteredTransactions]);

  const getCategoryDetails = (catName: string) => {
    const custom = customCategories.find(c => c.name.toLowerCase() === catName.toLowerCase());
    if (custom) return { color: custom.color || '#3B82F6', icon: custom.icon || 'Tag' };
    const def = DEFAULT_CATEGORIES.find(c => c.name.toLowerCase() === catName.toLowerCase());
    if (def) return { color: def.color, icon: def.icon };
    return { color: '#64748B', icon: 'HelpCircle' };
  };

  const renderCategoryIcon = (iconName: string, className = "h-4 w-4") => {
    const IconComp = CATEGORY_ICONS[iconName] || Tag;
    return <IconComp className={className} />;
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification Popup */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-2xl border text-xs font-bold flex items-center gap-2 backdrop-blur-md ${
              toastMessage.type === 'success' 
                ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-300' 
                : 'bg-rose-950/90 border-rose-500/40 text-rose-300'
            }`}
          >
            {toastMessage.type === 'success' ? <CheckCircle className="h-4 w-4 text-emerald-400" /> : <AlertCircle className="h-4 w-4 text-rose-400" />}
            <span>{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Bar & Quick Actions */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Layers className="h-6 w-6 text-emerald-400" />
            Transaction Ledger
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time PostgreSQL transaction management, smart filtering, and category customization.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => handleOpenAddModal('income')}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            <ArrowDownLeft className="h-4 w-4" /> Add Income
          </button>
          <button
            onClick={() => handleOpenAddModal('expense')}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            <ArrowUpRight className="h-4 w-4" /> Add Expense
          </button>
          <button
            onClick={() => {
              setReceiptImage('');
              setScanResult(null);
              setShowScanModal(true);
            }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            <Camera className="h-4 w-4 text-amber-400" /> AI Scan
          </button>
          <button
            onClick={() => setShowCategoryManager(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            <Tag className="h-4 w-4 text-blue-400" /> Categories
          </button>
        </div>
      </div>

      {/* Smart Search & Filter Toolbar */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-5 space-y-4">
        {/* Search Bar */}
        <div className="relative w-full">
          <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Smart Search by description, category, amount (e.g. 500), date, payment method, or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl pl-11 pr-10 py-3 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-3.5 text-slate-500 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filters & Sorting Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Flow Type */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Flow Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-emerald-500 outline-none"
            >
              <option value="all">All Flows</option>
              <option value="income">Income (+)</option>
              <option value="expense">Expense (-)</option>
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Category</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-emerald-500 outline-none"
            >
              <option value="all">All Categories</option>
              {allCategoryNames.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Payment Method</label>
            <select
              value={filterPaymentMethod}
              onChange={(e) => setFilterPaymentMethod(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-emerald-500 outline-none"
            >
              <option value="all">All Methods</option>
              {PAYMENT_METHODS.map(method => (
                <option key={method} value={method}>{method}</option>
              ))}
            </select>
          </div>

          {/* From Date */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">From Date</label>
            <input
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-emerald-500 outline-none"
            />
          </div>

          {/* To Date */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">To Date</label>
            <input
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-emerald-500 outline-none"
            />
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Sort Order</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-emerald-500 outline-none"
            >
              <option value="date_desc">Date: Newest First</option>
              <option value="date_asc">Date: Oldest First</option>
              <option value="amount_desc">Amount: High to Low</option>
              <option value="amount_asc">Amount: Low to High</option>
              <option value="category_asc">Category: A to Z</option>
              <option value="category_desc">Category: Z to A</option>
            </select>
          </div>
        </div>

        {/* Filter Summary & Reset Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800 text-xs">
          <div className="flex items-center gap-4 text-slate-400">
            <span>Showing <strong className="text-white">{filteredTransactions.length}</strong> of {transactions.length} entries</span>
            <span className="text-emerald-400 font-bold">+₹{filteredIncomeSum.toLocaleString('en-IN')}</span>
            <span className="text-rose-400 font-bold">-₹{filteredExpenseSum.toLocaleString('en-IN')}</span>
          </div>

          {(searchQuery || filterType !== 'all' || filterCategory !== 'all' || filterPaymentMethod !== 'all' || filterStartDate || filterEndDate) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterType('all');
                setFilterCategory('all');
                setFilterPaymentMethod('all');
                setFilterStartDate('');
                setFilterEndDate('');
                setSortBy('date_desc');
              }}
              className="text-emerald-400 hover:underline font-semibold cursor-pointer text-xs"
            >
              Reset All Filters
            </button>
          )}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <div className="h-12 w-12 rounded-full bg-slate-800 text-slate-500 flex items-center justify-center mx-auto">
              <Search className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-slate-300">No transactions match your search or filters.</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">Try clearing search keywords or selecting a broader date range.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((tx) => {
                  const catDetails = getCategoryDetails(tx.category);
                  return (
                    <tr 
                      key={tx.id}
                      className="border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors group"
                    >
                      <td className="py-3.5 px-4 font-medium whitespace-nowrap text-slate-300">{tx.date}</td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                          tx.type === 'income' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {tx.type === 'income' ? <ArrowDownLeft className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span 
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-white"
                          style={{ backgroundColor: `${catDetails.color}22`, border: `1px solid ${catDetails.color}44`, color: catDetails.color }}
                        >
                          {renderCategoryIcon(catDetails.icon, "h-3.5 w-3.5")}
                          {tx.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs truncate text-slate-300 font-medium">
                        <button 
                          onClick={() => setSelectedDetailsTx(tx)} 
                          className="hover:text-emerald-400 text-left transition-colors cursor-pointer block truncate"
                        >
                          {tx.description || 'No description'}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-400">
                        <span className="bg-slate-800/80 px-2 py-0.5 rounded text-[10px] font-semibold border border-slate-700/50">
                          {tx.paymentMethod || 'UPI'}
                        </span>
                      </td>
                      <td className={`py-3.5 px-4 font-black text-right whitespace-nowrap text-sm ${tx.type === 'income' ? 'text-emerald-400' : 'text-slate-100'}`}>
                        {tx.type === 'income' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-center">
                        <div className="flex justify-center items-center gap-1.5">
                          <button
                            onClick={() => setSelectedDetailsTx(tx)}
                            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-blue-400 transition-colors cursor-pointer"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDuplicateTransaction(tx)}
                            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
                            title="Duplicate"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(tx)}
                            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmTx(tx)}
                            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODULE 5 - Transaction Details Modal */}
      <AnimatePresence>
        {selectedDetailsTx && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <div className={`p-2.5 rounded-2xl ${selectedDetailsTx.type === 'income' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                    {selectedDetailsTx.type === 'income' ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Transaction Details</h3>
                    <p className="text-[10px] text-slate-500 font-mono">ID: {selectedDetailsTx.id}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedDetailsTx(null)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Details Content */}
              <div className="space-y-4 text-xs">
                <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Amount</span>
                    <p className={`text-2xl font-black ${selectedDetailsTx.type === 'income' ? 'text-emerald-400' : 'text-white'}`}>
                      {selectedDetailsTx.type === 'income' ? '+' : '-'}₹{selectedDetailsTx.amount.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full font-extrabold text-xs uppercase ${
                    selectedDetailsTx.type === 'income' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                  }`}>
                    {selectedDetailsTx.type}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Category</span>
                    <p className="text-slate-200 font-bold mt-1">{selectedDetailsTx.category}</p>
                  </div>

                  <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Payment Method</span>
                    <p className="text-slate-200 font-bold mt-1">{selectedDetailsTx.paymentMethod || 'UPI'}</p>
                  </div>

                  <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Transaction Date</span>
                    <p className="text-slate-200 font-bold mt-1">{selectedDetailsTx.date}</p>
                  </div>

                  <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Updated Date</span>
                    <p className="text-slate-200 font-bold mt-1">
                      {selectedDetailsTx.updatedAt ? new Date(selectedDetailsTx.updatedAt).toLocaleDateString() : selectedDetailsTx.date}
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Description</span>
                  <p className="text-slate-200 font-medium mt-1">{selectedDetailsTx.description || 'N/A'}</p>
                </div>

                {selectedDetailsTx.notes && (
                  <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Notes</span>
                    <p className="text-slate-300 font-normal mt-1">{selectedDetailsTx.notes}</p>
                  </div>
                )}
              </div>

              {/* Modal Footer Actions */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  onClick={() => handleDuplicateTransaction(selectedDetailsTx)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl"
                >
                  <Copy className="h-4 w-4" /> Duplicate
                </button>
                <button
                  onClick={() => handleOpenEditModal(selectedDetailsTx)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl"
                >
                  <Edit3 className="h-4 w-4" /> Edit
                </button>
                <button
                  onClick={() => {
                    setDeleteConfirmTx(selectedDetailsTx);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold rounded-xl border border-rose-500/30"
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add / Edit Transaction Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl my-8 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <h3 className="text-base font-bold text-white">
                  {editingTx ? 'Edit Transaction' : 'Record Transaction'}
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {modalError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-medium">
                  {modalError}
                </div>
              )}

              <form onSubmit={handleSubmitTransaction} className="space-y-4">
                {/* Type Selection Tabs */}
                <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-2xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setType('expense')}
                    className={`py-2 rounded-xl text-xs font-extrabold transition-all ${
                      type === 'expense' ? 'bg-rose-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Expense (-)
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('income')}
                    className={`py-2 rounded-xl text-xs font-extrabold transition-all ${
                      type === 'income' ? 'bg-emerald-500 text-slate-950 shadow-lg' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Income (+)
                  </button>
                </div>

                {/* Amount Field */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 1500"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-lg font-black text-white focus:border-emerald-500 outline-none"
                  />
                </div>

                {/* Category Field */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:border-emerald-500 outline-none"
                  >
                    {allCategoryNames.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Payment Method & Date */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Payment Method
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:border-emerald-500 outline-none"
                    >
                      {PAYMENT_METHODS.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Date *
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Grocery shopping at DMart"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:border-emerald-500 outline-none"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Notes
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Additional details or context..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 outline-none"
                  />
                </div>

                {/* Recurrence Toggle */}
                <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-emerald-400" />
                    <span className="text-xs font-medium text-slate-300">Recurring Transaction</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className="h-4 w-4 rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0 cursor-pointer"
                  />
                </div>

                {isRecurring && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Interval
                    </label>
                    <select
                      value={recurrenceInterval}
                      onChange={(e) => setRecurrenceInterval(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 outline-none"
                    >
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl cursor-pointer transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? 'Saving...' : editingTx ? 'Save Changes' : 'Record Item'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODULE 3 - Category Management Modal */}
      <AnimatePresence>
        {showCategoryManager && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-2xl shadow-2xl space-y-6 my-8"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <Tag className="h-5 w-5 text-emerald-400" />
                  <h3 className="text-base font-bold text-white">Category Management</h3>
                </div>
                <button
                  onClick={() => setShowCategoryManager(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Add/Edit Category Form */}
              <form onSubmit={handleSaveCategory} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-4">
                <h4 className="text-xs font-bold text-slate-200">
                  {editingCategory ? 'Edit Custom Category' : 'Create New Category'}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Category Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Subscriptions, Gaming"
                      value={catName}
                      onChange={(e) => setCatName(e.target.value)}
                      required
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Flow Applicability</label>
                    <select
                      value={catType}
                      onChange={(e) => setCatType(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 outline-none"
                    >
                      <option value="expense">Expense Only (-)</option>
                      <option value="income">Income Only (+)</option>
                      <option value="both">Both Income & Expense</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Icon</label>
                    <select
                      value={catIcon}
                      onChange={(e) => setCatIcon(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 outline-none"
                    >
                      {Object.keys(CATEGORY_ICONS).map(icon => (
                        <option key={icon} value={icon}>{icon}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Theme Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={catColor}
                        onChange={(e) => setCatColor(e.target.value)}
                        className="h-8 w-12 rounded bg-transparent border-0 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={catColor}
                        onChange={(e) => setCatColor(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  {editingCategory && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCategory(null);
                        setCatName('');
                      }}
                      className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl"
                    >
                      Cancel Edit
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl"
                  >
                    {editingCategory ? 'Update Category' : 'Add Category'}
                  </button>
                </div>
              </form>

              {/* Categories List */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Default Categories</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {DEFAULT_CATEGORIES.map(c => (
                      <div key={c.name} className="flex items-center justify-between p-2.5 bg-slate-950/60 border border-slate-800/80 rounded-xl">
                        <div className="flex items-center gap-2">
                          <span className="p-1 rounded" style={{ backgroundColor: `${c.color}22`, color: c.color }}>
                            {renderCategoryIcon(c.icon, "h-3.5 w-3.5")}
                          </span>
                          <span className="text-xs font-semibold text-slate-200">{c.name}</span>
                        </div>
                        <span className="text-[9px] font-bold text-slate-500 uppercase">{c.type}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {customCategories.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Your Custom Categories</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {customCategories.map(c => (
                        <div key={c.id} className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-xl">
                          <div className="flex items-center gap-2">
                            <span className="p-1.5 rounded" style={{ backgroundColor: `${c.color || '#3B82F6'}22`, color: c.color || '#3B82F6' }}>
                              {renderCategoryIcon(c.icon || 'Tag', "h-4 w-4")}
                            </span>
                            <div>
                              <p className="text-xs font-bold text-white">{c.name}</p>
                              <span className="text-[9px] text-slate-500 uppercase">{c.type}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCategory(c);
                                setCatName(c.name);
                                setCatType(c.type);
                                setCatIcon(c.icon || 'Tag');
                                setCatColor(c.color || '#3B82F6');
                              }}
                              className="p-1 text-slate-400 hover:text-emerald-400 rounded"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmCat(c)}
                              className="p-1 text-slate-400 hover:text-rose-400 rounded"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal for Transactions */}
      <AnimatePresence>
        {deleteConfirmTx && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3 text-rose-400">
                <AlertCircle className="h-6 w-6" />
                <h3 className="text-base font-bold text-white">Delete Transaction</h3>
              </div>
              <p className="text-xs text-slate-400">
                Are you sure you want to permanently delete this transaction for <strong className="text-white">₹{deleteConfirmTx.amount.toLocaleString('en-IN')} ({deleteConfirmTx.category})</strong>?
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setDeleteConfirmTx(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExecuteDeleteTx}
                  className="px-4 py-2 bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold rounded-xl"
                >
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal for Categories */}
      <AnimatePresence>
        {deleteConfirmCat && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3 text-rose-400">
                <AlertCircle className="h-6 w-6" />
                <h3 className="text-base font-bold text-white">Delete Category</h3>
              </div>
              <p className="text-xs text-slate-400">
                Are you sure you want to remove category <strong className="text-white">"{deleteConfirmCat.name}"</strong>?
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setDeleteConfirmCat(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExecuteDeleteCat}
                  className="px-4 py-2 bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold rounded-xl"
                >
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Receipt Scanner Modal */}
      <AnimatePresence>
        {showScanModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4 my-8"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-amber-400">
                  <Camera className="h-5 w-5" />
                  <h3 className="text-base font-bold text-white">AI Receipt Scanner</h3>
                </div>
                <button
                  onClick={() => setShowScanModal(false)}
                  className="p-1 text-slate-400 hover:text-white rounded"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleReceiptFileChange}
                  className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-white hover:file:bg-slate-700 cursor-pointer"
                />

                {receiptImage && (
                  <div className="relative max-h-48 rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center">
                    <img
                      src={`data:${receiptMimeType};base64,${receiptImage}`}
                      alt="Receipt Preview"
                      className="max-h-48 object-contain"
                    />
                  </div>
                )}

                {receiptImage && !scanResult && (
                  <button
                    onClick={handleScanReceipt}
                    disabled={scanLoading}
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all cursor-pointer disabled:opacity-50"
                  >
                    {scanLoading ? 'Analyzing Receipt via AI...' : 'Analyze Receipt'}
                  </button>
                )}

                {scanResult && (
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 text-xs">
                    <h4 className="font-bold text-emerald-400">Extracted Information</h4>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-[10px] text-slate-500 font-bold uppercase">Amount (₹)</label>
                        <input
                          type="number"
                          value={scanAmount}
                          onChange={(e) => setScanAmount(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500 font-bold uppercase">Merchant / Description</label>
                        <input
                          type="text"
                          value={scanMerchant}
                          onChange={(e) => setScanMerchant(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500 font-bold uppercase">Category</label>
                        <select
                          value={scanCategory}
                          onChange={(e) => setScanCategory(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white"
                        >
                          {allCategoryNames.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500 font-bold uppercase">Date</label>
                        <input
                          type="date"
                          value={scanDate}
                          onChange={(e) => setScanDate(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white"
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleConfirmScanSave}
                      className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl mt-2 cursor-pointer"
                    >
                      Save Extracted Transaction
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
