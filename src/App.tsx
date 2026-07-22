/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  User, 
  Transaction, 
  Budget, 
  SavingsGoal, 
  CustomCategory, 
  Reminder, 
  Challenge, 
  Achievement 
} from './types.js';

import AuthView from './components/AuthView.tsx';
import DashboardView from './components/DashboardView.tsx';
import TransactionsView from './components/TransactionsView.tsx';
import BudgetsView from './components/BudgetsView.tsx';
import GoalsView from './components/GoalsView.tsx';
import CurrentSavingsView from './components/CurrentSavingsView.tsx';
import FinancialHealthView from './components/FinancialHealthView.tsx';
import AnalyticsView from './components/AnalyticsView.tsx';
import RemindersView from './components/RemindersView.tsx';
import AdvisorView from './components/AdvisorView.tsx';
import ReportsView from './components/ReportsView.tsx';
import SettingsView from './components/SettingsView.tsx';
import SmsSyncView from './components/SmsSyncView.tsx';
// @ts-ignore
import logoUrl from './assets/images/vyora_logo_1784370945595.jpg';

import { 
  ShieldCheck, 
  LayoutDashboard, 
  ArrowLeftRight, 
  TrendingDown, 
  PiggyBank, 
  Target,
  BarChart3, 
  BellRing, 
  Sparkles, 
  FileDown, 
  Settings, 
  LogOut,
  Menu,
  X,
  User as UserIcon,
  Sun,
  Moon,
  Info,
  Smartphone,
  ArrowUpRight,
  ArrowDownLeft,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [currentView, setCurrentView] = useState('dashboard');

  // Core Data Arrays
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  // Mobile menu control
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Online/Offline status simulated for client SQLite
  const [isOnline, setIsOnline] = useState(() => {
    return localStorage.getItem('simulate_offline') !== 'true';
  });

  // Background Notification Alert Sync State
  const [activeNotificationToast, setActiveNotificationToast] = useState<{
    id: string;
    text: string;
    timestamp: string;
    parsed?: {
      amount: number;
      type: 'income' | 'expense';
      category: string;
      description: string;
      date: string;
      appName: string;
      upiRef?: string;
    };
  } | null>(null);
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);

  // Inline Toast Edit States
  const [isEditingToast, setIsEditingToast] = useState(false);
  const [toastEditAmount, setToastEditAmount] = useState<number>(0);
  const [toastEditCategory, setToastEditCategory] = useState<string>('');
  const [toastEditDescription, setToastEditDescription] = useState<string>('');
  const [toastEditType, setToastEditType] = useState<'income' | 'expense'>('expense');

  // Sync edit states when active notification updates
  useEffect(() => {
    if (activeNotificationToast && activeNotificationToast.parsed) {
      setToastEditAmount(activeNotificationToast.parsed.amount);
      setToastEditCategory(activeNotificationToast.parsed.category || 'Other');
      setToastEditDescription(activeNotificationToast.parsed.description || '');
      setToastEditType(activeNotificationToast.parsed.type || 'expense');
      setIsEditingToast(false);
    }
  }, [activeNotificationToast]);

  // Body scroll lock on mobile menu toggle
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [mobileMenuOpen]);

  // Poll pending notifications every 6 seconds to trigger global real-time popup
  useEffect(() => {
    if (!token || !isOnline) return;

    const checkPendingAlerts = async () => {
      try {
        const res = await fetch('/api/notifications/pending', {
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => null);

        if (!res) return;

        if (res.status === 401 || res.status === 403) {
          handleLogout();
          return;
        }

        if (res.ok) {
          const contentType = res.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const alerts = await res.json();
            if (Array.isArray(alerts)) {
              if (alerts.length > 0) {
                // Find the most recent alert that we haven't dismissed yet and isn't currently active
                const freshAlert = alerts.find((a: any) => !dismissedAlerts.includes(a.id));
                if (freshAlert) {
                  setActiveNotificationToast(freshAlert);
                }
              } else {
                setActiveNotificationToast(null);
              }
            }
          }
        }
      } catch (err) {
        // Silently swallow fetch network errors during background polling
      }
    };

    checkPendingAlerts();
    const interval = setInterval(checkPendingAlerts, 6000);
    return () => clearInterval(interval);
  }, [token, dismissedAlerts, isOnline]);

  const handleApproveAlertFromToast = async () => {
    if (!activeNotificationToast || !activeNotificationToast.parsed) return;
    const { id, parsed } = activeNotificationToast;
    
    try {
      const success = await handleAddTransaction({
        amount: Number(toastEditAmount),
        type: toastEditType,
        category: toastEditCategory || (toastEditType === 'income' ? 'Income' : 'Other'),
        description: toastEditDescription || `Auto-Sync - ${parsed.appName || 'Notification'}`,
        date: parsed.date || new Date().toISOString().split('T')[0],
        upiRef: parsed.upiRef || ''
      });

      if (!success) {
        return; // Duplicate blocked or other validation failure handled inside handleAddTransaction
      }

      // Clear from pending notifications list
      if (isOnline) {
        await fetch(`/api/notifications/pending/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }

      setDismissedAlerts(prev => [...prev, id]);
      setActiveNotificationToast(null);

      // Audio cue for successful sync
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.08); // E5
        osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.16); // G5
        gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
        osc.start();
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
        osc.stop(audioCtx.currentTime + 0.35);
      } catch (e) {
        // audio context blocked
      }

    } catch (err) {
      console.error('Error settling background alert', err);
    }
  };

  const handleIgnoreAlertFromToast = async () => {
    if (!activeNotificationToast) return;
    const { id } = activeNotificationToast;
    
    try {
      await fetch(`/api/notifications/pending/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      setDismissedAlerts(prev => [...prev, id]);
      setActiveNotificationToast(null);
    } catch (err) {
      console.error('Error ignoring background alert', err);
    }
  };

  // Initialize and load user details on session start
  useEffect(() => {
    const checkSessionAndFetchProfile = async () => {
      if (!token) return;
      try {
        const res = await fetch('/api/auth/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => null);

        if (!res) return;

        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            handleLogout();
          }
          return;
        }
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const freshUser = await res.json();
          setUser(freshUser);
          localStorage.setItem('user', JSON.stringify(freshUser));
        }
      } catch (err) {
        // Silently swallow fetch network errors on profile check
      }
    };

    // Optimistically load cached user profile first
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }
    checkSessionAndFetchProfile();
  }, [token]);

  // Load backend data arrays when authenticated
  const loadUserData = async () => {
    if (!token) return;

    try {
      const headers = { 'Authorization': `Bearer ${token}` };

      const [txRes, budRes, goalRes, catRes, remRes, chalRes, achRes] = await Promise.all([
        fetch('/api/transactions', { headers }).catch(() => null),
        fetch('/api/budgets', { headers }).catch(() => null),
        fetch('/api/goals', { headers }).catch(() => null),
        fetch('/api/categories', { headers }).catch(() => null),
        fetch('/api/reminders', { headers }).catch(() => null),
        fetch('/api/challenges', { headers }).catch(() => null),
        fetch('/api/achievements', { headers }).catch(() => null)
      ]);

      if (txRes && (txRes.status === 401 || txRes.status === 403 || txRes.status === 404)) {
        handleLogout();
        return;
      }

      const safeParseJson = async (res: Response | null) => {
        if (!res || !res.ok) return null;
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          return null;
        }
        try {
          return await res.json();
        } catch (e) {
          return null;
        }
      };

      const [txData, budData, goalData, catData, remData, chalData, achData] = await Promise.all([
        safeParseJson(txRes),
        safeParseJson(budRes),
        safeParseJson(goalRes),
        safeParseJson(catRes),
        safeParseJson(remRes),
        safeParseJson(chalRes),
        safeParseJson(achRes)
      ]);

      if (txData) setTransactions(txData);
      if (budData) setBudgets(budData);
      if (goalData) setGoals(goalData);
      if (catData) setCustomCategories(catData);
      if (remData) setReminders(remData);
      if (chalData) setChallenges(chalData);
      if (achData) setAchievements(achData);

    } catch (err) {
      // Swallowed
    }
  };

  useEffect(() => {
    if (token && user) {
      loadUserData();
    }
  }, [token, user, currentView]); // Reload variables on view shifts or sessions

  const handleAuthSuccess = (newToken: string, newUser: User) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setTransactions([]);
    setBudgets([]);
    setGoals([]);
    setCustomCategories([]);
    setReminders([]);
    setChallenges([]);
    setAchievements([]);
  };

  // Transaction Actions
  const handleAddTransaction = async (txPayload: Omit<Transaction, 'id' | 'userId'>): Promise<boolean> => {
    try {
      // 1. Client-side duplicate check (prevent duplicate entries using transaction reference numbers)
      if (txPayload.upiRef) {
        const isDuplicate = transactions.some(
          t => t.upiRef === txPayload.upiRef
        );
        if (isDuplicate) {
          alert(`Duplicate Blocked: A transaction with reference ID "${txPayload.upiRef}" has already been processed.`);
          return false;
        }
      }

      // 2. Work Offline Strategy (Save to mock SQLite database when offline)
      if (!isOnline) {
        const offlineId = 'offline_tx_' + Math.random().toString(36).substr(2, 9);
        const newTx: Transaction = {
          id: offlineId,
          userId: user?.id || 'offline_user',
          ...txPayload,
          isOffline: true,
          syncStatus: 'pending'
        };

        const offlineQueue = JSON.parse(localStorage.getItem('offline_queue') || '[]');
        offlineQueue.push(newTx);
        localStorage.setItem('offline_queue', JSON.stringify(offlineQueue));

        // Dashboard updates instantly!
        setTransactions(prev => [newTx, ...prev]);
        
        alert(`Offline Mode: Transaction logged locally in SQLite device cache (Status: Pending Sync).`);
        return true;
      }

      // 3. Online mode (save directly to Cloud Firestore)
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(txPayload)
      });

      if (res.status === 409) {
        const errData = await res.json();
        alert(errData.error || 'Duplicate transaction blocked.');
        return false;
      }

      if (!res.ok) throw new Error('Transaction post failed');
      
      const newTx = await res.json();
      setTransactions(prev => [newTx, ...prev]);
      return true;
    } catch (err) {
      console.error(err);
      alert('Network error: Could not log transaction to cloud ledger.');
      return false;
    }
  };

  const handleSyncOfflineTransactions = async () => {
    const offlineQueue = JSON.parse(localStorage.getItem('offline_queue') || '[]');
    if (offlineQueue.length === 0) return;

    let successCount = 0;
    let duplicateCount = 0;
    const remainingQueue: Transaction[] = [];

    for (const tx of offlineQueue) {
      try {
        // Strip out client-side unique fields before sending to DB insertion
        const { id, userId, isOffline, syncStatus, ...payload } = tx;
        const res = await fetch('/api/transactions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });

        if (res.status === 409) {
          duplicateCount++;
          // Skip, treated as successfully processed to avoid double syncing
        } else if (res.ok) {
          successCount++;
        } else {
          remainingQueue.push(tx); // Retain in queue to retry
        }
      } catch (err) {
        remainingQueue.push(tx);
      }
    }

    localStorage.setItem('offline_queue', JSON.stringify(remainingQueue));
    await loadUserData(); // reload all charts and dashboard stats

    if (successCount > 0 || duplicateCount > 0) {
      let msg = `Sync Complete! Synchronized ${successCount} offline transactions from SQLite to Cloud Firestore.`;
      if (duplicateCount > 0) {
        msg += ` Excluded ${duplicateCount} duplicate entries.`;
      }
      alert(msg);
    }
  };

  const handleEditTransaction = async (id: string, txPayload: Partial<Transaction>) => {
    try {
      const res = await fetch(`/api/transactions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(txPayload)
      });
      if (!res.ok) throw new Error('Transaction edit failed');
      const updatedTx = await res.json();
      setTransactions(prev => prev.map(t => t.id === id ? updatedTx : t));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      const res = await fetch(`/api/transactions/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Transaction deletion failed');
      setTransactions(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  // Budget Actions
  const handleAddBudget = async (budPayload: Omit<Budget, 'id' | 'userId'>) => {
    try {
      const res = await fetch('/api/budgets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(budPayload)
      });
      if (!res.ok) throw new Error('Budget post failed');
      const newBud = await res.json();
      setBudgets(prev => {
        const existingIdx = prev.findIndex(b => b.category === newBud.category && b.month === newBud.month);
        if (existingIdx !== -1) {
          return prev.map((b, i) => i === existingIdx ? newBud : b);
        }
        return [...prev, newBud];
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteBudget = async (id: string) => {
    try {
      const res = await fetch(`/api/budgets/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Budget delete failed');
      setBudgets(prev => prev.filter(b => b.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  // Goal Actions
  const handleAddGoal = async (goalPayload: Omit<SavingsGoal, 'id' | 'userId' | 'dateCreated'>) => {
    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(goalPayload)
      });
      if (!res.ok) throw new Error('Goal post failed');
      const newGoal = await res.json();
      setGoals(prev => [...prev, newGoal]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditGoal = async (id: string, goalPayload: Partial<SavingsGoal>) => {
    try {
      const res = await fetch(`/api/goals/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(goalPayload)
      });
      if (!res.ok) throw new Error('Goal edit failed');
      const updatedGoal = await res.json();
      setGoals(prev => prev.map(g => g.id === id ? updatedGoal : g));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    try {
      const res = await fetch(`/api/goals/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Goal deletion failed');
      setGoals(prev => prev.filter(g => g.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  // Category Actions
  const handleAddCategory = async (catPayload: Omit<CustomCategory, 'id' | 'userId'>) => {
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(catPayload)
      });
      if (!res.ok) throw new Error('Category post failed');
      const newCat = await res.json();
      setCustomCategories(prev => [...prev, newCat]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditCategory = async (id: string, catPayload: Partial<CustomCategory>) => {
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(catPayload)
      });
      if (!res.ok) throw new Error('Category edit failed');
      const updatedCat = await res.json();
      setCustomCategories(prev => prev.map(c => c.id === id ? updatedCat : c));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Category delete failed');
      setCustomCategories(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  // Reminder Actions
  const handleAddReminder = async (remPayload: Omit<Reminder, 'id' | 'userId' | 'isPaid'>) => {
    try {
      const res = await fetch('/api/reminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(remPayload)
      });
      if (!res.ok) throw new Error('Reminder creation failed');
      const newRem = await res.json();
      setReminders(prev => [...prev, newRem]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditReminder = async (id: string, remPayload: Partial<Reminder>) => {
    try {
      const res = await fetch(`/api/reminders/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(remPayload)
      });
      if (!res.ok) throw new Error('Reminder edit failed');
      const updatedRem = await res.json();
      setReminders(prev => prev.map(r => r.id === id ? updatedRem : r));
      // Refresh transactions too because paying a bill auto-logs a transaction
      if (remPayload.isPaid === true) {
        const txRes = await fetch('/api/transactions', { headers: { 'Authorization': `Bearer ${token}` } });
        if (txRes.ok) setTransactions(await txRes.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteReminder = async (id: string) => {
    try {
      const res = await fetch(`/api/reminders/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Reminder deletion failed');
      setReminders(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  // Settings Actions
  const handleUpdateProfileFields = async (fields: Partial<User>) => {
    try {
      const res = await fetch('/api/auth/profile/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(fields)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Profile update failed');
      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
    } catch (err: any) {
      throw new Error(err.message);
    }
  };

  const handleUpdateProfile = async (name: string, theme: 'light' | 'dark') => {
    await handleUpdateProfileFields({ name, theme });
  };

  const handleChangePassword = async (currentPassword: string, newPassword: string) => {
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Password update failed');
    } catch (err: any) {
      throw new Error(err.message);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const res = await fetch('/api/auth/profile/delete', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete account');
      handleLogout();
    } catch (err) {
      console.error(err);
    }
  };

  // Nav items sidebar
  const MENU_ITEMS = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transactions Ledger', icon: ArrowLeftRight },
    { id: 'sms_sync', label: 'SMS & GPay Sync', icon: Smartphone },
    { id: 'budget', label: 'Budget Planner', icon: TrendingDown },
    { id: 'savings', label: 'Savings Hub', icon: PiggyBank },
    { id: 'goals', label: 'Savings Goals', icon: Target },
    { id: 'health', label: 'Financial Health', icon: ShieldCheck },
    { id: 'analytics', label: 'Analytics Board', icon: BarChart3 },
    { id: 'reminders', label: 'Alarms & Reminders', icon: BellRing },
    { id: 'advisor', label: 'AI Advisor Pro', icon: Sparkles },
    { id: 'reports', label: 'Export & Statement', icon: FileDown },
    { id: 'settings', label: 'Preferences Settings', icon: Settings },
  ];

  if (!token || !user) {
    return <AuthView onAuthSuccess={handleAuthSuccess} />;
  }

  // Theme Wrapper check
  const themeClass = user.theme === 'light' ? 'bg-slate-50 text-slate-800' : 'bg-slate-950 text-slate-200';
  const cardBgClass = user.theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800';

  return (
    <div className={`min-h-screen flex flex-col md:flex-row font-sans transition-colors duration-300 ${user.theme === 'light' ? 'light' : 'dark'} ${themeClass}`}>
      {/* Sidebar - Desktop Layout */}
      <aside className={`hidden md:flex flex-col w-64 ${user.theme === 'light' ? 'bg-slate-100 border-r border-slate-200' : 'bg-slate-900 border-r border-slate-800'} p-6 shrink-0 justify-between`}>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-md p-1 overflow-hidden">
              <img
                src={logoUrl}
                alt="Vyora Logo"
                className="h-full w-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <span className={`text-sm font-black leading-none block ${user.theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Vyora</span>
              <span className="text-[10px] font-bold text-emerald-400 block tracking-wider uppercase">Finance Intelligent</span>
            </div>
          </div>

          <nav className="space-y-1">
            {MENU_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = currentView === item.id;
              const isLight = user.theme === 'light';
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    active 
                      ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/10' 
                      : isLight 
                        ? 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900' 
                        : 'text-slate-400 hover:bg-slate-800/40 hover:text-white'
                  }`}
                >
                  <Icon className="h-4.5 w-4.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Card & Logout */}
        <div className={`border-t ${user.theme === 'light' ? 'border-slate-200' : 'border-slate-800'} pt-4 space-y-3`}>
          <div className="flex items-center justify-between px-2 gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-9 w-9 rounded-xl bg-slate-800 flex items-center justify-center text-emerald-400 font-extrabold text-sm border border-slate-700/50 shrink-0">
                {user.name.slice(0, 1).toUpperCase()}
              </div>
              <div className="truncate">
                <span className={`text-xs font-black block leading-snug truncate ${user.theme === 'light' ? 'text-slate-800' : 'text-white'}`}>{user.name}</span>
                <span className="text-[10px] text-slate-500 block leading-none truncate">{user.email}</span>
              </div>
            </div>

            <button
              onClick={() => handleUpdateProfile(user.name, user.theme === 'light' ? 'dark' : 'light')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer shrink-0 overflow-hidden relative flex items-center justify-center ${user.theme === 'light' ? 'bg-slate-200/80 text-amber-600 hover:bg-slate-300' : 'bg-slate-850 text-amber-400 hover:bg-slate-800'}`}
              title={user.theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={user.theme}
                  initial={{ y: -15, rotate: -90, opacity: 0, scale: 0.6 }}
                  animate={{ y: 0, rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ y: 15, rotate: 90, opacity: 0, scale: 0.6 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="flex items-center justify-center"
                >
                  {user.theme === 'light' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </motion.div>
              </AnimatePresence>
            </button>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors cursor-pointer"
          >
            <LogOut className="h-4.5 w-4.5" />
            <span>Logout Exit</span>
          </button>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className={`md:hidden sticky top-0 h-16 z-50 flex items-center justify-between px-4 border-b transition-colors duration-300 ${
        user.theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
      } shadow-sm`}>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center p-0.5 overflow-hidden shadow-sm">
            <img
              src={logoUrl}
              alt="Vyora Logo"
              className="h-full w-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <span className={`text-xs font-black tracking-tight ${user.theme === 'light' ? 'text-slate-800' : 'text-white'}`}>Vyora</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleUpdateProfile(user.name, user.theme === 'light' ? 'dark' : 'light')}
            className={`p-2 rounded-xl transition-colors cursor-pointer flex items-center justify-center overflow-hidden relative ${user.theme === 'light' ? 'text-amber-500 hover:bg-slate-100' : 'text-amber-400 hover:bg-slate-800'}`}
            title={user.theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={user.theme}
                initial={{ y: -15, rotate: -90, opacity: 0, scale: 0.6 }}
                animate={{ y: 0, rotate: 0, opacity: 1, scale: 1 }}
                exit={{ y: 15, rotate: 90, opacity: 0, scale: 0.6 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="flex items-center justify-center"
              >
                {user.theme === 'light' ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
              </motion.div>
            </AnimatePresence>
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`p-2 rounded-xl cursor-pointer transition-colors ${
              user.theme === 'light' ? 'text-slate-800 hover:bg-slate-100' : 'text-white hover:bg-slate-800'
            }`}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Dropdown Panel */}
      {mobileMenuOpen && (
        <div className={`fixed top-16 left-0 right-0 bottom-0 z-40 backdrop-blur-md pt-4 pb-6 px-6 flex flex-col md:hidden transition-colors duration-300 overflow-y-auto ${
          user.theme === 'light' ? 'bg-white/98 text-slate-800' : 'bg-slate-950/98 text-slate-200'
        }`}>
          <div className="flex flex-col flex-1 justify-between gap-8 min-h-[calc(100vh-6rem)]">
            <nav className="space-y-2">
              {MENU_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = currentView === item.id;
                const isLight = user.theme === 'light';
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentView(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                      active 
                        ? 'bg-emerald-500 text-slate-950' 
                        : isLight 
                          ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900' 
                          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className={`border-t pt-4 flex justify-between items-center ${
              user.theme === 'light' ? 'border-slate-200' : 'border-slate-800'
            }`}>
              <div className="flex items-center gap-2">
                <div className={`h-9 w-9 rounded-xl font-black flex items-center justify-center ${
                  user.theme === 'light' ? 'bg-slate-100 text-emerald-600' : 'bg-slate-850 text-emerald-400'
                }`}>
                  {user.name.slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <span className={`text-xs font-black block ${user.theme === 'light' ? 'text-slate-800' : 'text-white'}`}>{user.name}</span>
                  <span className="text-[10px] text-slate-500 block">{user.email}</span>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 text-rose-400 text-xs font-bold hover:bg-rose-500/20 transition-colors"
              >
                <LogOut className="h-4 w-4" /> Exit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area Layout Frame */}
      <main className="flex-1 p-4 pb-16 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full space-y-6">
        {/* Render View Dispatcher */}
        {currentView === 'dashboard' && (
          <DashboardView
            transactions={transactions}
            goals={goals}
            budgets={budgets}
            challenges={challenges}
            achievements={achievements}
            reminders={reminders}
            onNavigate={setCurrentView}
          />
        )}

        {currentView === 'transactions' && (
          <TransactionsView
            transactions={transactions}
            customCategories={customCategories}
            onAddTransaction={handleAddTransaction}
            onEditTransaction={handleEditTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            onAddCategory={handleAddCategory}
            onEditCategory={handleEditCategory}
            onDeleteCategory={handleDeleteCategory}
          />
        )}

        {currentView === 'sms_sync' && (
          <SmsSyncView
            onAddTransaction={handleAddTransaction}
            customCategories={customCategories}
            isOnline={isOnline}
            setIsOnline={setIsOnline}
            onSyncOffline={handleSyncOfflineTransactions}
          />
        )}

        {currentView === 'budget' && (
          <BudgetsView
            budgets={budgets}
            transactions={transactions}
            customCategories={customCategories}
            onAddBudget={handleAddBudget}
            onDeleteBudget={handleDeleteBudget}
          />
        )}

        {currentView === 'savings' && (
          <CurrentSavingsView
            transactions={transactions}
            goals={goals}
            token={token || ''}
          />
        )}

        {currentView === 'goals' && (
          <GoalsView
            goals={goals}
            onAddGoal={handleAddGoal}
            onEditGoal={handleEditGoal}
            onDeleteGoal={handleDeleteGoal}
            transactions={transactions}
            user={user}
            onUpdateProfileFields={handleUpdateProfileFields}
          />
        )}

        {currentView === 'health' && (
          <FinancialHealthView
            transactions={transactions}
            budgets={budgets}
            goals={goals}
            onNavigate={setCurrentView}
          />
        )}

        {currentView === 'analytics' && (
          <AnalyticsView
            transactions={transactions}
          />
        )}

        {currentView === 'reminders' && (
          <RemindersView
            reminders={reminders}
            onAddReminder={handleAddReminder}
            onEditReminder={handleEditReminder}
            onDeleteReminder={handleDeleteReminder}
          />
        )}

        {currentView === 'advisor' && (
          <AdvisorView />
        )}

        {currentView === 'reports' && (
          <ReportsView
            transactions={transactions}
            budgets={budgets}
            goals={goals}
            reminders={reminders}
          />
        )}

        {currentView === 'settings' && (
          <SettingsView
            user={user}
            onUpdateProfile={handleUpdateProfile}
            onChangePassword={handleChangePassword}
            onDeleteAccount={handleDeleteAccount}
          />
        )}
      </main>

      {/* Global Interactive Notification Sync Toast popup */}
      <AnimatePresence>
        {activeNotificationToast && activeNotificationToast.parsed && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="fixed bottom-6 right-6 z-50 w-full max-w-sm md:max-w-md bg-slate-950/95 border border-slate-800 rounded-3xl p-5 shadow-2xl backdrop-blur-md space-y-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <h4 className="text-xs font-black text-emerald-400 tracking-wider uppercase flex items-center gap-1.5">
                  <Smartphone className="h-4 w-4" />
                  Live Notification Alert Sync
                </h4>
              </div>
              <button
                onClick={handleIgnoreAlertFromToast}
                className="p-1 text-slate-500 hover:text-white transition-colors cursor-pointer"
                title="Close and ignore notification alert"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Prompt Callout matching the exact user request template */}
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-3.5 rounded-2xl">
              <p className="text-xs font-bold text-slate-100 leading-snug">
                ₹{toastEditAmount} {toastEditType === 'expense' ? 'spent at' : 'received from'} {toastEditDescription || activeNotificationToast.parsed.appName || 'Merchant'}. Would you like to save this transaction?
              </p>
            </div>

            <div className="space-y-3">
              <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800/40 text-[10px] text-slate-400 italic leading-relaxed">
                Raw SMS: "{activeNotificationToast.text}"
              </div>

              {!isEditingToast ? (
                /* Static view mode */
                <div className="grid grid-cols-2 gap-3 text-[11px] bg-slate-900/30 p-3 rounded-2xl border border-slate-900">
                  <div>
                    <span className="block text-slate-500 font-bold uppercase tracking-wider text-[9px] mb-0.5">Settle Amount</span>
                    <span className="text-xs font-black text-white">₹{toastEditAmount}</span>
                  </div>
                  <div>
                    <span className="block text-slate-500 font-bold uppercase tracking-wider text-[9px] mb-0.5">Direction</span>
                    <span className={`text-xs font-black capitalize ${toastEditType === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {toastEditType}
                    </span>
                  </div>
                  <div>
                    <span className="block text-slate-500 font-bold uppercase tracking-wider text-[9px] mb-0.5">Category</span>
                    <span className="text-slate-300 font-black">{toastEditCategory}</span>
                  </div>
                  <div>
                    <span className="block text-slate-500 font-bold uppercase tracking-wider text-[9px] mb-0.5">UPI Ref ID</span>
                    <span className="text-slate-400 font-mono text-[10px] truncate block">{activeNotificationToast.parsed.upiRef || 'Generating...'}</span>
                  </div>
                </div>
              ) : (
                /* Interactive edit mode */
                <div className="space-y-3 p-3 bg-slate-900/40 rounded-2xl border border-slate-900 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Amount (₹)</label>
                      <input 
                        type="number"
                        value={toastEditAmount}
                        onChange={e => setToastEditAmount(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-white font-bold text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Type</label>
                      <select
                        value={toastEditType}
                        onChange={e => setToastEditType(e.target.value as 'income' | 'expense')}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-white text-xs font-bold"
                      >
                        <option value="expense">Expense</option>
                        <option value="income">Income</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Description / Merchant</label>
                    <input 
                      type="text"
                      value={toastEditDescription}
                      onChange={e => setToastEditDescription(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-white text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Category</label>
                    <select
                      value={toastEditCategory}
                      onChange={e => setToastEditCategory(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-white text-xs font-bold"
                    >
                      {['Food', 'Shopping', 'Bills', 'Entertainment', 'Transportation', 'Salary', 'Other'].map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Action buttons mapping Save / Edit / Ignore */}
            {!isEditingToast ? (
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleIgnoreAlertFromToast}
                  className="flex-1 py-2 px-3 bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-rose-400 font-bold text-xs rounded-xl border border-slate-800/80 transition-all cursor-pointer text-center"
                >
                  Ignore
                </button>
                <button
                  onClick={() => setIsEditingToast(true)}
                  className="flex-1 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs rounded-xl border border-slate-800 transition-all cursor-pointer text-center"
                >
                  Edit
                </button>
                <button
                  onClick={handleApproveAlertFromToast}
                  className="flex-1 py-2 px-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/10 transition-all cursor-pointer flex items-center justify-center gap-1"
                >
                  <Check className="h-4 w-4" />
                  Save
                </button>
              </div>
            ) : (
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setIsEditingToast(false)}
                  className="flex-1 py-2 px-3 bg-slate-900 hover:bg-slate-850 text-slate-400 font-bold text-xs rounded-xl border border-slate-800 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApproveAlertFromToast}
                  className="flex-1 py-2 px-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/10 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check className="h-4 w-4" />
                  Save & Settle
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
