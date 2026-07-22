/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Info, 
  TrendingUp, 
  AlertTriangle, 
  HelpCircle, 
  ShieldAlert, 
  Send, 
  Bot, 
  User as UserIcon,
  Lightbulb,
  Coins
} from 'lucide-react';

interface AIResponse {
  analytics: string[];
  savingsAdvice: string[];
  futureSavingsPrediction: string;
  overspendingAlerts: string[];
  quickTips: string[];
}

interface ChatMessage {
  sender: 'ai' | 'user';
  text: string;
}

export default function AdvisorView() {
  const [loading, setLoading] = useState(false);
  const [advisorData, setAdvisorData] = useState<AIResponse | null>(null);
  const [error, setError] = useState('');

  // Interactive custom chat bubble states
  const [chatLog, setChatLog] = useState<ChatMessage[]>([
    { sender: 'ai', text: 'Hello! I am Vyora AI, your certified financial intelligence advisor. Click "Generate Assessment" to evaluate your cash flow, or ask me any custom finance questions here!' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Fetch AI Advisor analysis on mount or on demand
  const handleFetchAssessment = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/ai/advise', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to retrieve assessment');
      setAdvisorData(data);
    } catch (err: any) {
      setError('AI Advisor is currently drafting new plans. Let us utilize default safety structures.');
      // Keep default fallback
      setAdvisorData({
        analytics: [
          "Your current ledger is active. We are waiting for more transactions to identify categories.",
          "Check category targets to keep on track."
        ],
        savingsAdvice: [
          "Maintain a 50/30/20 budget partition: 50% obligations, 30% lifestyle, 20% future wealth.",
          "Check budget configurations before adding entertainment expenses."
        ],
        futureSavingsPrediction: "Accumulate capital regularly inside active savings targets for compounding returns.",
        overspendingAlerts: ["No major overspends identified on active category limits."],
        quickTips: [
          "Formulate an emergency fund that accommodates 3-6 months of essential utilities.",
          "Deploy high-yield cash targets to outpace general inflation metrics."
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput;
    const historyToSend = [...chatLog];

    setChatLog(prev => [...prev, { sender: 'user', text: userText }]);
    setChatInput('');
    setChatLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          message: userText,
          history: historyToSend
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to get response');

      setChatLog(prev => [...prev, { sender: 'ai', text: data.text }]);
    } catch (err) {
      setChatLog(prev => [...prev, { sender: 'ai', text: 'I am currently having trouble connecting. Let us check your connection and try again!' }]);
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    handleFetchAssessment();
  }, []);

  return (
    <div className="space-y-6">
      {/* Assessment Action Callout */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700/40 rounded-3xl p-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
            <Sparkles className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Advanced AI Advisor</h2>
            <p className="text-xs text-slate-400">Server-side Gemini 3.5 Flash processes your income, expenditures, and bill alerts to optimize your liquid cash flow.</p>
          </div>
        </div>

        <button
          onClick={handleFetchAssessment}
          disabled={loading}
          className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-xl transition-all cursor-pointer"
        >
          <Sparkles className="h-4 w-4" />
          {loading ? 'Analyzing Ledger...' : 'Generate New Assessment'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: AI Recommendations Board */}
        <div className="lg:col-span-2 space-y-6">
          {loading ? (
            <div className="bg-slate-800/10 border border-slate-700/10 rounded-3xl p-12 text-center space-y-3">
              <div className="h-10 w-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-400">Gemini is auditing category spendings, analyzing budget deviations, and calculating next 12-month net projections...</p>
            </div>
          ) : advisorData ? (
            <div className="space-y-6">
              {/* Overspending Warnings */}
              {advisorData.overspendingAlerts && advisorData.overspendingAlerts.length > 0 && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-3xl p-5 flex items-start gap-3">
                  <ShieldAlert className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-xs font-bold text-rose-300 uppercase tracking-widest">System Guardrail Warnings</h3>
                    <div className="space-y-1.5 mt-2">
                      {advisorData.overspendingAlerts.map((alt, i) => (
                        <p key={i} className="text-xs text-slate-400 font-medium">{alt}</p>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Analysis & Breakdown Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Spending Analysis */}
                <div className="bg-slate-800/20 border border-slate-700/10 rounded-3xl p-6 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                    <TrendingUp className="h-4.5 w-4.5 text-emerald-400" />
                    <span>Cash Allocation Assessment</span>
                  </div>
                  <div className="space-y-3 pt-2">
                    {advisorData.analytics.map((val, i) => (
                      <div key={i} className="bg-slate-950/20 p-3 rounded-2xl border border-slate-800/40 text-xs text-slate-400 font-medium leading-relaxed">
                        {val}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Savings Advice */}
                <div className="bg-slate-800/20 border border-slate-700/10 rounded-3xl p-6 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                    <Coins className="h-4.5 w-4.5 text-amber-400" />
                    <span>Opportunities for Savings</span>
                  </div>
                  <div className="space-y-3 pt-2">
                    {advisorData.savingsAdvice.map((val, i) => (
                      <div key={i} className="bg-slate-950/20 p-3 rounded-2xl border border-slate-800/40 text-xs text-slate-400 font-medium leading-relaxed">
                        {val}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Net Worth Forecast */}
              <div className="bg-gradient-to-br from-emerald-500/5 to-slate-800/20 border border-emerald-500/10 rounded-3xl p-6">
                <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-widest block mb-1">Financial Forecast Projections</span>
                <h3 className="text-sm font-black text-white">Estimated 12-Month Net Accumulation</h3>
                <p className="text-xs text-slate-400 mt-2 font-medium leading-relaxed">
                  {advisorData.futureSavingsPrediction}
                </p>
              </div>

              {/* General Tips */}
              <div className="bg-slate-800/10 border border-slate-700/10 rounded-3xl p-6 space-y-4">
                <h3 className="text-sm font-black text-white">Smart Actionable Financial Guidelines</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {advisorData.quickTips.map((tip, i) => (
                    <div key={i} className="bg-slate-900/40 border border-slate-800 p-4 rounded-2xl flex gap-3">
                      <Lightbulb className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-slate-400 leading-relaxed font-medium">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-xs text-slate-500 border border-dashed border-slate-700/50 rounded-3xl bg-slate-800/5">
              Launch Assessment to compile customized advisor metrics.
            </div>
          )}
        </div>

        {/* Right Column: Custom AI Assistant chat bubble */}
        <div className="bg-slate-800/20 border border-slate-700/10 rounded-3xl p-6 flex flex-col justify-between h-[400px] md:h-[560px]">
          <div className="space-y-1.5 mb-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white uppercase tracking-wider">
              <Bot className="h-4.5 w-4.5 text-emerald-400" />
              <span>Ask Custom Advisor</span>
            </div>
            <p className="text-[10px] text-slate-500">Ask about emergency savings, fixed deposits, or stock indices.</p>
          </div>

          {/* Chat Messages Log */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 py-1 text-xs">
            {chatLog.map((msg, i) => (
              <div key={i} className={`flex gap-2.5 items-start ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.sender === 'ai' && (
                  <div className="h-7 w-7 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4" />
                  </div>
                )}
                <div className={`p-3 rounded-2xl max-w-[85%] font-medium leading-relaxed ${msg.sender === 'user' ? 'bg-emerald-500 text-slate-950 rounded-tr-none' : 'bg-slate-900/80 text-slate-300 rounded-tl-none border border-slate-800'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex gap-2 items-center justify-start text-[10px] text-slate-500 font-medium">
                <Bot className="h-4 w-4 animate-bounce text-emerald-400" /> typing...
              </div>
            )}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSendChat} className="mt-4 flex gap-2 relative">
            <input
              type="text"
              required
              disabled={chatLoading}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask me: 'Should I invest in fixed deposits?'..."
              className="flex-1 bg-slate-950/60 border border-slate-700/60 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none pr-10"
            />
            <button
              type="submit"
              disabled={chatLoading}
              className="absolute right-1.5 top-1.5 h-8 w-8 bg-emerald-500 hover:bg-emerald-400 rounded-lg text-slate-950 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
