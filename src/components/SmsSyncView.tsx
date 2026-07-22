import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Transaction, CustomCategory } from '../types.js';
import { 
  Smartphone, 
  MessageSquare, 
  Check, 
  X, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Send, 
  Info, 
  HelpCircle, 
  RefreshCw, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Copy,
  AlertCircle,
  Wifi,
  WifiOff,
  ShieldAlert,
  Database,
  Sliders,
  CloudLightning
} from 'lucide-react';

interface SmsSyncViewProps {
  onAddTransaction: (txPayload: Omit<Transaction, 'id' | 'userId'>) => Promise<boolean>;
  customCategories: CustomCategory[];
  isOnline: boolean;
  setIsOnline: (val: boolean) => void;
  onSyncOffline: () => Promise<void>;
}

interface PendingNotification {
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
  };
}

export default function SmsSyncView({ 
  onAddTransaction, 
  customCategories, 
  isOnline, 
  setIsOnline, 
  onSyncOffline 
}: SmsSyncViewProps) {
  const [pendingAlerts, setPendingAlerts] = useState<PendingNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');

  // Native simulation states
  const [hasNotificationPermission, setHasNotificationPermission] = useState(() => {
    return localStorage.getItem('android_notification_permission') !== 'false';
  });
  const [syncingOfflineQueue, setSyncingOfflineQueue] = useState(false);
  const [offlineQueueLength, setOfflineQueueLength] = useState(() => {
    return JSON.parse(localStorage.getItem('offline_queue') || '[]').length;
  });

  // Track offline queue length changes
  const refreshOfflineQueueLength = () => {
    setOfflineQueueLength(JSON.parse(localStorage.getItem('offline_queue') || '[]').length);
  };

  useEffect(() => {
    localStorage.setItem('android_notification_permission', String(hasNotificationPermission));
  }, [hasNotificationPermission]);
  
  // Custom manual paste state
  const [pastedSms, setPastedSms] = useState('');
  const [manualParseResult, setManualParseResult] = useState<any | null>(null);
  const [parsingError, setParsingError] = useState('');
  const [parsingLoading, setParsingLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Simulator State
  const [simNotification, setSimNotification] = useState<{
    appName: string;
    title: string;
    body: string;
    rawText: string;
  } | null>(null);
  const [notificationToastVisible, setNotificationToastVisible] = useState(false);

  // Guide state
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Fetch pending alerts on mount
  const fetchPendingAlerts = async () => {
    setLoading(true);
    setFetchError('');
    try {
      const res = await fetch('/api/notifications/pending', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error('Failed to load pending notifications');
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned invalid data format instead of JSON');
      }
      const data = await res.json();
      setPendingAlerts(data);
    } catch (err: any) {
      setFetchError(err.message || 'Error loading pending alerts inbox.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingAlerts();
  }, []);

  // Handle parsing manual text
  const handleManualParse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pastedSms.trim()) return;

    setParsingLoading(true);
    setParsingError('');
    setManualParseResult(null);
    setSuccessMsg('');

    try {
      const res = await fetch('/api/ai/parse-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ text: pastedSms })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to parse notification');
      setManualParseResult(data.parsed);
    } catch (err: any) {
      setParsingError(err.message || 'Could not parse text. Try a clearer format.');
    } finally {
      setParsingLoading(false);
    }
  };

  // Settle / Post a parsed alert to live transactions
  const handleConfirmPost = async (parsedData: any, notificationIdToClear?: string) => {
    try {
      const success = await onAddTransaction({
        amount: Number(parsedData.amount),
        type: parsedData.type,
        category: parsedData.category || (parsedData.type === 'income' ? 'Income' : 'Other'),
        description: parsedData.description || `SMS Sync - ${parsedData.appName || 'Alert'}`,
        date: parsedData.date || new Date().toISOString().split('T')[0],
        upiRef: parsedData.upiRef || ''
      });

      if (!success) {
        return; // Duplicate blocked or other validation failure handled inside onAddTransaction
      }

      if (notificationIdToClear) {
        // Remove from database inbox
        await fetch(`/api/notifications/pending/${notificationIdToClear}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        setPendingAlerts(prev => prev.filter(a => a.id !== notificationIdToClear));
      } else {
        setManualParseResult(null);
        setPastedSms('');
      }

      setSuccessMsg('Successfully synchronized to your transaction ledger!');
      refreshOfflineQueueLength();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert('Failed to post synchronized transaction.');
    }
  };

  // Discard/Ignore a pending notification alert
  const handleIgnoreAlert = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/pending/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        setPendingAlerts(prev => prev.filter(a => a.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Simulate Webhook trigger (simulate receiving from phone)
  const triggerSimulation = async (text: string, appName: string, title: string) => {
    if (!hasNotificationPermission) {
      alert("Permission Denied: Vyora is blocked from reading notifications. Please toggle 'Notification Listener Access' to GRANTED in the panel above first.");
      return;
    }

    setSimNotification({
      appName,
      title,
      body: text,
      rawText: text
    });
    setNotificationToastVisible(true);

    // Audio cue (synthesized subtle beep for a gorgeous premium touch)
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // high note
      gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
      osc.stop(audioCtx.currentTime + 0.3);
    } catch (e) {
      // AudioContext failed to auto-play or is blocked, ignore gracefully
    }

    // Post to simulated webhook endpoint on our real database so it becomes a "Pending Alert" candidates inbox item
    try {
      const res = await fetch('/api/notifications/pending', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ text })
      });
      if (res.ok) {
        fetchPendingAlerts();
      }
    } catch (err) {
      console.error('Error adding simulated alert to database inbox', err);
    }
  };

  const copyToClipboard = (text: string, type: 'token' | 'url') => {
    navigator.clipboard.writeText(text);
    if (type === 'token') {
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    } else {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  const webhookUrl = `${window.location.origin}/api/notifications/pending`;
  const userToken = localStorage.getItem('token') || '';

  return (
    <div className="space-y-6">
      {/* Header and Explanation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Smartphone className="h-6 w-6 text-emerald-400" />
            Smart Notification Auto-Sync
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Settle, credit, and debit transactions dynamically when notifications trigger on your phone. Vyora parses banking alerts in real-time, extracts ledger information, and posts updates in a single click.
          </p>
        </div>
        <button
          onClick={fetchPendingAlerts}
          disabled={loading}
          className="flex items-center gap-1.5 py-2 px-3 bg-slate-900 hover:bg-slate-850 text-slate-300 font-bold text-xs rounded-xl border border-slate-800 hover:border-slate-700 transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          Reload Inbox
        </button>
      </div>

      {/* Android Notification Service & Database Sync Control Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 rounded-3xl">
        {/* Permission Switch */}
        <div className="flex flex-col justify-between p-4 bg-slate-950/40 border border-slate-850 rounded-2xl space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-xs font-black text-white flex items-center gap-1.5 uppercase tracking-wider">
                <Sliders className="h-4 w-4 text-emerald-400" />
                Notification Listener
              </h4>
              <p className="text-[10px] text-slate-400 mt-1">
                Grant or revoke permission to intercept device banking alerts.
              </p>
            </div>
            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${hasNotificationPermission ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
              {hasNotificationPermission ? 'Granted' : 'Revoked'}
            </span>
          </div>
          <button
            onClick={() => setHasNotificationPermission(!hasNotificationPermission)}
            className={`w-full py-2 px-3 rounded-xl font-bold text-xs cursor-pointer transition-all ${
              hasNotificationPermission 
                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20' 
                : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
            }`}
          >
            {hasNotificationPermission ? 'Revoke System Permission' : 'Grant Notification Access'}
          </button>
        </div>

        {/* Network Connection Status */}
        <div className="flex flex-col justify-between p-4 bg-slate-950/40 border border-slate-850 rounded-2xl space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-xs font-black text-white flex items-center gap-1.5 uppercase tracking-wider">
                {isOnline ? <Wifi className="h-4 w-4 text-emerald-400" /> : <WifiOff className="h-4 w-4 text-amber-400" />}
                Connection Status
              </h4>
              <p className="text-[10px] text-slate-400 mt-1">
                Toggle connection to simulate client SQLite storage.
              </p>
            </div>
            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${isOnline ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
              {isOnline ? 'Online (Cloud)' : 'Offline (SQLite)'}
            </span>
          </div>
          <button
            onClick={() => {
              const nextState = !isOnline;
              setIsOnline(nextState);
              localStorage.setItem('simulate_offline', nextState ? 'false' : 'true');
            }}
            className={`w-full py-2 px-3 rounded-xl font-bold text-xs cursor-pointer transition-all ${
              isOnline 
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20' 
                : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
            }`}
          >
            {isOnline ? 'Simulate Going Offline' : 'Simulate Going Online'}
          </button>
        </div>

        {/* Local SQLite offline queue */}
        <div className="flex flex-col justify-between p-4 bg-slate-950/40 border border-slate-850 rounded-2xl space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-xs font-black text-white flex items-center gap-1.5 uppercase tracking-wider">
                <Database className="h-4 w-4 text-emerald-400" />
                SQLite Cache Queue
              </h4>
              <p className="text-[10px] text-slate-400 mt-1">
                Local transactions waiting to sync with Cloud Firestore.
              </p>
            </div>
            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${offlineQueueLength > 0 ? 'bg-amber-500/10 text-amber-400 animate-pulse' : 'bg-slate-800 text-slate-500'}`}>
              {offlineQueueLength} Unsynced
            </span>
          </div>
          <button
            disabled={offlineQueueLength === 0 || syncingOfflineQueue || !isOnline}
            onClick={async () => {
              setSyncingOfflineQueue(true);
              await onSyncOffline();
              setSyncingOfflineQueue(false);
              refreshOfflineQueueLength();
            }}
            className="w-full py-2 px-3 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-black text-xs rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5"
          >
            <CloudLightning className={`h-3.5 w-3.5 ${syncingOfflineQueue ? 'animate-bounce' : ''}`} />
            {syncingOfflineQueue ? 'Syncing...' : !isOnline ? 'Go Online to Sync' : 'Synchronize SQLite with Cloud'}
          </button>
        </div>
      </div>

      {/* Floating simulated push notification banner */}
      <AnimatePresence>
        {notificationToastVisible && simNotification && (
          <motion.div 
            initial={{ opacity: 0, y: 100, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 100, x: "-50%" }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="fixed bottom-6 left-1/2 z-50 bg-slate-950/95 border border-slate-800 w-full max-w-sm rounded-2xl p-4 shadow-2xl"
          >
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                {simNotification.appName.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-white">{simNotification.appName}</span>
                  <span className="text-[10px] text-slate-500 font-bold">Just Now</span>
                </div>
                <p className="text-[11px] font-bold text-emerald-400 mt-0.5">{simNotification.title}</p>
                <p className="text-[10px] text-slate-400 mt-1 truncate">{simNotification.body}</p>
              </div>
              <button 
                onClick={() => setNotificationToastVisible(false)}
                className="p-1 text-slate-500 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-900 flex justify-end gap-2">
              <button 
                onClick={() => {
                  setNotificationToastVisible(false);
                  setPastedSms(simNotification.rawText);
                  // Trigger parse right away
                  const mockEvent = { preventDefault: () => {} };
                  setPastedSms(simNotification.rawText);
                  setTimeout(() => {
                    const submitBtn = document.getElementById('manual-parse-submit');
                    if (submitBtn) submitBtn.click();
                  }, 50);
                }}
                className="py-1 px-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-[10px] rounded-lg transition-colors cursor-pointer"
              >
                Parse Immediately
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Notification Status Banner */}
      {successMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          {successMsg}
        </div>
      )}

      {/* Primary Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Manual Paste & Parse Engine (4 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5">
          <div>
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <MessageSquare className="h-4.5 w-4.5 text-emerald-400" />
              Manual Message Parser
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Paste the text of any SMS, Google Pay, UPI, or Bank notification alert to analyze instantly.
            </p>
          </div>

          <form onSubmit={handleManualParse} className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">SMS / Notification Content</label>
              <textarea
                value={pastedSms}
                onChange={(e) => setPastedSms(e.target.value)}
                placeholder="Example: UPI: Paid ₹450 to Starbucks Coffee. UPI Ref: 231499... or RS. 1,200.00 debited from HDFC a/c xx21."
                className="w-full h-24 bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-slate-200 text-xs p-3 rounded-xl resize-none outline-none transition-all placeholder:text-slate-600"
              />
            </div>

            <button
              id="manual-parse-submit"
              type="submit"
              disabled={parsingLoading || !pastedSms.trim()}
              className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-black text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              {parsingLoading ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Analyzing Text Payload...
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  Extract & Preview Details
                </>
              )}
            </button>
          </form>

          {parsingError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[11px] rounded-xl font-bold flex items-start gap-1.5">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{parsingError}</span>
            </div>
          )}

          {/* Extracted Parse Result Candidate */}
          {manualParseResult && (
            <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4 space-y-3 animate-fade-in">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-emerald-400 tracking-wider uppercase bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                  Extracted Sync Candidate
                </span>
                <span className="text-[10px] text-slate-500 font-bold">{manualParseResult.appName || 'Auto-Detected'}</span>
              </div>

              <div className="space-y-2.5">
                <div className="flex justify-between border-b border-slate-900 pb-2">
                  <span className="text-[11px] text-slate-400 font-bold">Transaction Type</span>
                  <span className={`text-[11px] font-black flex items-center gap-1 ${manualParseResult.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {manualParseResult.type === 'income' ? (
                      <>
                        <ArrowDownLeft className="h-3 w-3" /> Credited (Income)
                      </>
                    ) : (
                      <>
                        <ArrowUpRight className="h-3 w-3" /> Debited (Expense)
                      </>
                    )}
                  </span>
                </div>

                <div className="flex justify-between border-b border-slate-900 pb-2">
                  <span className="text-[11px] text-slate-400 font-bold">Settle Amount</span>
                  <span className="text-xs font-black text-white">₹{manualParseResult.amount.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex justify-between border-b border-slate-900 pb-2">
                  <span className="text-[11px] text-slate-400 font-bold">Suggested Category</span>
                  <span className="text-[11px] text-slate-300 font-bold">{manualParseResult.category}</span>
                </div>

                <div className="flex justify-between border-b border-slate-900 pb-2">
                  <span className="text-[11px] text-slate-400 font-bold">Extracted Narration</span>
                  <span className="text-[11px] text-slate-300 font-medium truncate max-w-[200px]" title={manualParseResult.description}>
                    {manualParseResult.description}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setManualParseResult(null)}
                  className="flex-1 py-1.5 px-3 bg-slate-900 hover:bg-slate-850 text-slate-300 font-black text-[10px] rounded-xl transition-colors cursor-pointer border border-slate-800"
                >
                  Discard
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirmPost(manualParseResult)}
                  className="flex-1 py-1.5 px-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-[10px] rounded-xl transition-colors cursor-pointer"
                >
                  Approve & Post Ledger
                </button>
              </div>
            </div>
          )}
        </div>

        {/* MIDDLE COLUMN: Simulated Smartphone Notifications Receiver (3 cols) */}
        <div className="lg:col-span-3 flex flex-col items-center">
          <div className="w-full bg-slate-900 border border-slate-850 rounded-3xl p-5 space-y-4 flex flex-col justify-between h-full">
            <div className="space-y-1">
              <h3 className="text-xs font-black text-white uppercase tracking-wider">SMS Simulator</h3>
              <p className="text-[10px] text-slate-400">
                Trigger real mock notification alerts inside the dashboard to experience our fully functional background synchronization mechanism.
              </p>
            </div>

            {/* Simulated Phone Screen */}
            <div className="bg-slate-950 border-4 border-slate-800 rounded-3xl p-3 flex flex-col space-y-2 relative shadow-inner w-full max-w-[210px] mx-auto h-72 overflow-hidden justify-between">
              {/* Speaker & camera slot */}
              <div className="flex justify-center w-full absolute top-1 left-0 z-10">
                <div className="w-16 h-2.5 bg-slate-800 rounded-full flex items-center justify-around px-2">
                  <div className="w-1 h-1 bg-slate-900 rounded-full" />
                  <div className="w-8 h-1 bg-slate-900 rounded-full" />
                </div>
              </div>

              {/* Status bar */}
              <div className="flex justify-between items-center text-[8px] text-slate-500 font-bold px-1 pt-1.5">
                <span>9:41 AM</span>
                <div className="flex gap-1 items-center">
                  <span>LTE</span>
                  <div className="w-2.5 h-1.5 bg-slate-500 rounded-xs" />
                </div>
              </div>

              {/* Central Phone Screen Area */}
              <div className="flex-1 flex flex-col justify-center items-center text-center space-y-1 px-1">
                <Smartphone className="h-6 w-6 text-slate-700 animate-pulse" />
                <span className="text-[10px] text-slate-400 font-extrabold">Device Online</span>
                <p className="text-[8px] text-slate-600 font-medium">Click one of the triggers below to send a bank notification to this phone</p>
              </div>

              {/* Notification Banner on screen mockup (if any) */}
              {simNotification && (
                <div className="p-1.5 bg-slate-900/95 border border-slate-800 rounded-lg absolute inset-x-2 bottom-3 text-left animate-fade-in z-20">
                  <div className="flex justify-between items-center text-[7px] font-black text-white">
                    <span>💬 {simNotification.appName}</span>
                    <span className="text-slate-500">1s ago</span>
                  </div>
                  <p className="text-[7px] text-slate-400 font-medium mt-0.5 line-clamp-2 leading-tight">
                    {simNotification.body}
                  </p>
                </div>
              )}
            </div>

            {/* Quick Simulation Action Triggers */}
            <div className="space-y-1.5 w-full">
              <button
                onClick={() => triggerSimulation("UPI: Paid ₹450 to Starbucks on GPay. Ref: 1042... Thanks!", "Google Pay", "Payment Outflow Successful")}
                className="w-full text-left py-1.5 px-2 bg-slate-950 hover:bg-slate-850 rounded-lg text-[9px] font-bold text-slate-300 border border-slate-850 hover:border-slate-800 transition-colors flex items-center justify-between"
              >
                <span>Google Pay ₹450 (Food)</span>
                <Plus className="h-2.5 w-2.5 text-emerald-400" />
              </button>
              <button
                onClick={() => triggerSimulation("Your HDFC bank a/c XX12 has been debited with Rs. 1,200.00 towards Electricity bill on 16-Jul.", "HDFC Bank", "Account Debited Alert")}
                className="w-full text-left py-1.5 px-2 bg-slate-950 hover:bg-slate-850 rounded-lg text-[9px] font-bold text-slate-300 border border-slate-850 hover:border-slate-800 transition-colors flex items-center justify-between"
              >
                <span>HDFC Debit Rs. 1,200 (Bills)</span>
                <Plus className="h-2.5 w-2.5 text-emerald-400" />
              </button>
              <button
                onClick={() => triggerSimulation("SBI Card: Spun Rs. 3,450.00 at AMZN IN on 16/07/26. Keep limit under cap.", "SBI Bank", "Credit Card Charge")}
                className="w-full text-left py-1.5 px-2 bg-slate-950 hover:bg-slate-850 rounded-lg text-[9px] font-bold text-slate-300 border border-slate-850 hover:border-slate-800 transition-colors flex items-center justify-between"
              >
                <span>SBI Credit Rs. 3,450 (Shopping)</span>
                <Plus className="h-2.5 w-2.5 text-emerald-400" />
              </button>
              <button
                onClick={() => triggerSimulation("Paytm: Rs. 25,000.00 credited to your Bank Account Ref: STIPEND. Happy day!", "Paytm", "Account Credited Deposit")}
                className="w-full text-left py-1.5 px-2 bg-slate-950 hover:bg-slate-850 rounded-lg text-[9px] font-bold text-slate-300 border border-slate-850 hover:border-slate-800 transition-colors flex items-center justify-between"
              >
                <span>Paytm Credited ₹25k (Income)</span>
                <Plus className="h-2.5 w-2.5 text-emerald-400" />
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Setup Guide / Copy Webhook (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div>
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <HelpCircle className="h-4.5 w-4.5 text-emerald-400" />
              Real Android Notification Automation Guide
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Set up full end-to-end automation to fetch live notifications from your phone *as they happen*.
            </p>
          </div>

          <div className="bg-slate-950 border border-slate-850 p-4 rounded-2xl space-y-3.5">
            <p className="text-[11px] text-slate-300 leading-relaxed font-semibold">
              Using a free tool like <span className="text-white">MacroDroid</span> or <span className="text-white">Tasker</span> on your Android phone, you can forward GPay, Paytm, HDFC, or any banking SMS alerts to Vyora immediately:
            </p>

            <ol className="text-[10px] text-slate-400 space-y-2 list-decimal list-inside leading-relaxed">
              <li>
                <strong className="text-slate-200">Set Trigger:</strong> Notification Received → Select Google Pay, PhonePe, and your banking Apps.
              </li>
              <li>
                <strong className="text-slate-200">Set Action:</strong> HTTP POST (Webhook Request).
              </li>
              <li>
                <strong className="text-slate-200">Define Target Webhook URL:</strong> Use your custom personal API endpoint URL below.
              </li>
              <li>
                <strong className="text-slate-200">Include Headers:</strong> Add <code className="bg-slate-900 text-emerald-400 px-1 py-0.5 rounded text-[9px]">Authorization: Bearer [Your Token]</code>
              </li>
              <li>
                <strong className="text-slate-200">JSON Payload:</strong> Pass the alert message: <code className="bg-slate-900 text-emerald-400 px-1 py-0.5 rounded text-[9px]">{"{ \"text\": \"[notification_text]\" }"}</code>
              </li>
            </ol>
          </div>

          {/* Webhook & JWT Credentials copying widget */}
          <div className="space-y-2">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Your Personal Webhook Endpoint</span>
                <span className="block text-[10px] text-slate-300 font-mono truncate">{webhookUrl}</span>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(webhookUrl, 'url')}
                className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer shrink-0"
                title="Copy Webhook Endpoint"
              >
                {copiedUrl ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Your Authentication Token</span>
                <span className="block text-[10px] text-slate-300 font-mono truncate">{userToken.slice(0, 30)}...</span>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(userToken, 'token')}
                className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer shrink-0"
                title="Copy Auth JWT"
              >
                {copiedToken ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* BOTTOM SECTION: Synced Alerts Pending Inbox (12 cols) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
        <div>
          <h3 className="text-sm font-black text-white flex items-center gap-2">
            <Smartphone className="h-4.5 w-4.5 text-emerald-400" />
            Background Synced Alerts Inbox ({pendingAlerts.length})
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            This is where banking notifications posted via real or simulated webhooks arrive. Review, verify, and settle them directly into your transaction history.
          </p>
        </div>

        {loading ? (
          <div className="py-8 text-center flex flex-col items-center justify-center space-y-2">
            <RefreshCw className="h-5 w-5 animate-spin text-emerald-400" />
            <span className="text-[11px] text-slate-500">Loading your synced alerts...</span>
          </div>
        ) : fetchError ? (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-2xl">
            {fetchError}
          </div>
        ) : pendingAlerts.length === 0 ? (
          <div className="border border-dashed border-slate-800 rounded-2xl p-8 text-center flex flex-col items-center justify-center space-y-2 bg-slate-950/20">
            <Smartphone className="h-8 w-8 text-slate-700" />
            <p className="text-xs font-black text-slate-400">Your synced notification inbox is empty</p>
            <p className="text-[10px] text-slate-500 max-w-sm">
              Use the SMS Simulator on the left or send an automated POST request from your device to see alerts populate in this inbox live!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingAlerts.map((alert) => {
              const hasParsed = !!alert.parsed;
              const p = alert.parsed || { amount: 0, type: 'expense', category: 'Other', description: 'Pending alert', date: '', appName: 'Banking' };
              
              return (
                <div 
                  key={alert.id} 
                  className="bg-slate-950 border border-slate-850 hover:border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all"
                >
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="text-[10px] font-black text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
                        {p.appName || 'Auto Sync'}
                      </span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded flex items-center gap-1 ${p.type === 'income' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                        {p.type === 'income' ? 'Credited / Income' : 'Debited / Expense'}
                      </span>
                      <span className="text-[9px] text-slate-500 font-bold">
                        Captured: {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-black text-white italic">
                        "{alert.text}"
                      </p>
                      {hasParsed && (
                        <div className="flex flex-wrap gap-x-4 text-[10px] text-slate-400">
                          <span>Amount: <strong className="text-white">₹{p.amount.toLocaleString('en-IN')}</strong></span>
                          <span>Category: <strong className="text-slate-300">{p.category}</strong></span>
                          <span>Narration: <strong className="text-slate-300">{p.description}</strong></span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 w-full md:w-auto shrink-0 border-t md:border-t-0 border-slate-900 pt-3 md:pt-0">
                    <button
                      onClick={() => handleIgnoreAlert(alert.id)}
                      className="flex-1 md:flex-initial py-1.5 px-3 bg-slate-900 hover:bg-slate-850 text-rose-400 font-bold text-[10px] rounded-xl transition-all cursor-pointer border border-slate-850 hover:border-slate-800 flex items-center justify-center gap-1"
                    >
                      <Trash2 className="h-3 w-3" />
                      Ignore Alert
                    </button>
                    <button
                      onClick={() => handleConfirmPost(p, alert.id)}
                      className="flex-1 md:flex-initial py-1.5 px-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-[10px] rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Check className="h-3 w-3" />
                      Approve & Post
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
