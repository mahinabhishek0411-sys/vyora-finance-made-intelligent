/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User } from '../types.js';
import { ShieldCheck, LogIn, UserPlus, KeyRound, CheckCircle, Info, Eye, EyeOff } from 'lucide-react';
// @ts-ignore
import logoUrl from '../assets/images/vyora_logo_1784370945595.jpg';

interface AuthViewProps {
  onAuthSuccess: (token: string, user: User) => void;
}

export default function AuthView({ onAuthSuccess }: AuthViewProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgot, setIsForgot] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('What was your first pet\'s name?');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Google Sandbox Modal state
  const [showSandboxModal, setShowSandboxModal] = useState(false);
  const [sandboxEmail, setSandboxEmail] = useState('kohulprabha@gmail.com');
  const [sandboxName, setSandboxName] = useState('Kohul Prabha');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const redirectUri = `${window.location.origin}/api/auth/google/callback`;
      const res = await fetch(`/api/auth/google/url?redirect_uri=${encodeURIComponent(redirectUri)}`);
      if (!res.ok) throw new Error('Failed to fetch Google Auth URL');
      const data = await res.json();

      if (data.isSandbox) {
        setLoading(false);
        setShowSandboxModal(true);
        return;
      }

      if (data.url) {
        const authWindow = window.open(
          data.url,
          'google_oauth_popup',
          'width=550,height=650,status=no,toolbar=no,menubar=no,location=yes'
        );

        if (!authWindow) {
          throw new Error('Popup blocked! Please allow popups for this site to sign in with Google.');
        }
      } else {
        throw new Error('Could not retrieve authorization URL.');
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleSandboxGoogleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!sandboxEmail) {
      setError('Please enter a valid Google email address.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/google/sandbox-direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: sandboxEmail, name: sandboxName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Google authentication failed');
      setShowSandboxModal(false);
      onAuthSuccess(data.token, data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleOAuthMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (
        !origin.endsWith('.run.app') &&
        !origin.includes('localhost') &&
        !origin.includes('127.0.0.1') &&
        origin !== window.location.origin
      ) {
        return;
      }

      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        const { token, user } = event.data;
        if (token && user) {
          onAuthSuccess(token, user);
        } else {
          setError('Google authentication failed: missing credentials');
          setLoading(false);
        }
      } else if (event.data?.type === 'OAUTH_AUTH_ERROR') {
        setError(event.data.error || 'Google authentication failed');
        setLoading(false);
      }
    };

    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, [onAuthSuccess]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide your email and password.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      onAuthSuccess(data.token, data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name || !securityAnswer) {
      setError('Please fill in all registration fields.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, securityQuestion, securityAnswer }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      onAuthSuccess(data.token, data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !securityAnswer || !newPassword) {
      setError('Please fill in all password recovery fields.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, securityAnswer, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Password reset failed');
      setSuccess('Your password has been successfully reset. You can now login.');
      setIsForgot(false);
      setIsLogin(true);
      setPassword('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl overflow-hidden shadow-xl shadow-emerald-500/10 mb-4 bg-white p-1">
          <img
            src={logoUrl}
            alt="Vyora Logo"
            className="h-full w-full object-contain"
            referrerPolicy="no-referrer"
          />
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          Vyora
        </h2>
        <p className="mt-1 text-xs text-emerald-400 font-bold uppercase tracking-widest">
          Finance Made Intelligent
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-800/80 backdrop-blur-md py-8 px-4 shadow-2xl border border-slate-700/50 sm:rounded-3xl sm:px-10">
          {error && (
            <div className="mb-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl p-3 flex items-start gap-2">
              <Info className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl p-3 flex items-start gap-2">
              <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {isForgot ? (
            <form onSubmit={handleForgot} className="space-y-4">
              <div className="text-sm text-slate-300 mb-2 font-medium">
                Recover Password
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Email address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-xl bg-slate-950/60 border border-slate-700/60 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                  placeholder="name@example.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Security Question
                </label>
                <select
                  value={securityQuestion}
                  onChange={(e) => setSecurityQuestion(e.target.value)}
                  className="block w-full rounded-xl bg-slate-950/60 border border-slate-700/60 px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                >
                  <option value="What was your first pet's name?">What was your first pet's name?</option>
                  <option value="What is your mother's maiden name?">What is your mother's maiden name?</option>
                  <option value="What city were you born in?">What city were you born in?</option>
                  <option value="What was the name of your first school?">What was the name of your first school?</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Your Answer
                </label>
                <input
                  type="text"
                  required
                  value={securityAnswer}
                  onChange={(e) => setSecurityAnswer(e.target.value)}
                  className="block w-full rounded-xl bg-slate-950/60 border border-slate-700/60 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                  placeholder="Secret answer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="block w-full rounded-xl bg-slate-950/60 border border-slate-700/60 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-500 text-sm font-semibold text-slate-950 hover:bg-emerald-400 transition-colors cursor-pointer focus:outline-none"
              >
                <KeyRound className="h-4 w-4" />
                {loading ? 'Updating Password...' : 'Reset Password'}
              </button>

              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => { setIsForgot(false); setIsLogin(true); setError(''); }}
                  className="text-xs text-emerald-400 hover:underline"
                >
                  Return to Login
                </button>
              </div>
            </form>
          ) : isLogin ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Email address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-xl bg-slate-950/60 border border-slate-700/60 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                  placeholder="name@example.com"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-semibold text-slate-400">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => { setIsForgot(true); setError(''); }}
                    className="text-[10px] text-emerald-400 hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-xl bg-slate-950/60 border border-slate-700/60 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-500 text-sm font-semibold text-slate-950 hover:bg-emerald-400 transition-colors cursor-pointer focus:outline-none"
              >
                <LogIn className="h-4 w-4" />
                {loading ? 'Accessing Account...' : 'Log In'}
              </button>

              <div className="relative my-4 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-800"></div>
                </div>
                <span className="relative bg-slate-900/90 px-3 text-xs uppercase text-slate-500 font-semibold tracking-wider">
                  or
                </span>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 text-sm font-semibold text-white transition-colors cursor-pointer focus:outline-none"
              >
                <svg className="h-4 w-4 mr-1" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                  <g transform="matrix(1, 0, 0, 1, 0, 0)">
                    <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1v2.6h3.3c1.93,-1.78 3.04,-4.4 3.04,-7.4c0,-0.6 -0.05,-1.18 -0.15,-1.62z" fill="#4285F4" />
                    <path d="M12,20.6c2.43,0 4.47,-0.8 5.96,-2.2l-3.3,-2.6c-0.9,0.6 -2.07,0.98 -3.3,0.98 -2.34,0 -4.33,-1.58 -5.04,-3.7H2.9v2.7C4.38,18.7 7.97,20.6 12,20.6z" fill="#34A853" />
                    <path d="M6.96,13.08a5.1,5.1 0 0 1 0,-3.16V7.22H2.9a8.62,8.62 0 0 0 0,8.56l4.06,-2.7z" fill="#FBBC05" />
                    <path d="M12,6.38c1.32,0 2.5,0.45 3.44,1.35l2.58,-2.58C16.46,3.68 14.43,3.1 12,3.1 7.97,3.1 4.38,5 2.9,7.22l4.06,2.7C7.67,7.96 9.66,6.38 12,6.38z" fill="#EA4335" />
                  </g>
                </svg>
                {loading ? 'Connecting...' : 'Continue with Google'}
              </button>

              <div className="text-center mt-4">
                <span className="text-xs text-slate-400">Don't have an account? </span>
                <button
                  type="button"
                  onClick={() => { setIsLogin(false); setError(''); }}
                  className="text-xs text-emerald-400 hover:underline font-semibold"
                >
                  Register Now
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full rounded-xl bg-slate-950/60 border border-slate-700/60 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Email address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-xl bg-slate-950/60 border border-slate-700/60 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                  placeholder="name@example.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-xl bg-slate-950/60 border border-slate-700/60 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Security Question (For Password Recovery)
                </label>
                <select
                  value={securityQuestion}
                  onChange={(e) => setSecurityQuestion(e.target.value)}
                  className="block w-full rounded-xl bg-slate-950/60 border border-slate-700/60 px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                >
                  <option value="What was your first pet's name?">What was your first pet's name?</option>
                  <option value="What is your mother's maiden name?">What is your mother's maiden name?</option>
                  <option value="What city were you born in?">What city were you born in?</option>
                  <option value="What was the name of your first school?">What was the name of your first school?</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Security Answer
                </label>
                <input
                  type="text"
                  required
                  value={securityAnswer}
                  onChange={(e) => setSecurityAnswer(e.target.value)}
                  className="block w-full rounded-xl bg-slate-950/60 border border-slate-700/60 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                  placeholder="Your answer"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-500 text-sm font-semibold text-slate-950 hover:bg-emerald-400 transition-colors cursor-pointer focus:outline-none"
              >
                <UserPlus className="h-4 w-4" />
                {loading ? 'Creating Account...' : 'Register Account'}
              </button>

              <div className="relative my-4 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-800"></div>
                </div>
                <span className="relative bg-slate-900/90 px-3 text-xs uppercase text-slate-500 font-semibold tracking-wider">
                  or
                </span>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 text-sm font-semibold text-white transition-colors cursor-pointer focus:outline-none"
              >
                <svg className="h-4 w-4 mr-1" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                  <g transform="matrix(1, 0, 0, 1, 0, 0)">
                    <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1v2.6h3.3c1.93,-1.78 3.04,-4.4 3.04,-7.4c0,-0.6 -0.05,-1.18 -0.15,-1.62z" fill="#4285F4" />
                    <path d="M12,20.6c2.43,0 4.47,-0.8 5.96,-2.2l-3.3,-2.6c-0.9,0.6 -2.07,0.98 -3.3,0.98 -2.34,0 -4.33,-1.58 -5.04,-3.7H2.9v2.7C4.38,18.7 7.97,20.6 12,20.6z" fill="#34A853" />
                    <path d="M6.96,13.08a5.1,5.1 0 0 1 0,-3.16V7.22H2.9a8.62,8.62 0 0 0 0,8.56l4.06,-2.7z" fill="#FBBC05" />
                    <path d="M12,6.38c1.32,0 2.5,0.45 3.44,1.35l2.58,-2.58C16.46,3.68 14.43,3.1 12,3.1 7.97,3.1 4.38,5 2.9,7.22l4.06,2.7C7.67,7.96 9.66,6.38 12,6.38z" fill="#EA4335" />
                  </g>
                </svg>
                {loading ? 'Connecting...' : 'Continue with Google'}
              </button>

              <div className="text-center mt-4">
                <span className="text-xs text-slate-400">Already have an account? </span>
                <button
                  type="button"
                  onClick={() => { setIsLogin(true); setError(''); }}
                  className="text-xs text-emerald-400 hover:underline font-semibold"
                >
                  Login Instead
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Google Sign In Account Chooser Modal (Sandbox & Fast Auth) */}
      {showSandboxModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-slate-900 relative overflow-hidden">
            <div className="flex flex-col items-center text-center">
              {/* Google Brand Logo */}
              <div className="h-12 w-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shadow-sm mb-3">
                <svg className="h-6 w-6" viewBox="0 0 24 24">
                  <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1v2.6h3.3c1.93,-1.78 3.04,-4.4 3.04,-7.4c0,-0.6 -0.05,-1.18 -0.15,-1.62z" fill="#4285F4" />
                  <path d="M12,20.6c2.43,0 4.47,-0.8 5.96,-2.2l-3.3,-2.6c-0.9,0.6 -2.07,0.98 -3.3,0.98 -2.34,0 -4.33,-1.58 -5.04,-3.7H2.9v2.7C4.38,18.7 7.97,20.6 12,20.6z" fill="#34A853" />
                  <path d="M6.96,13.08a5.1,5.1 0 0 1 0,-3.16V7.22H2.9a8.62,8.62 0 0 0 0,8.56l4.06,-2.7z" fill="#FBBC05" />
                  <path d="M12,6.38c1.32,0 2.5,0.45 3.44,1.35l2.58,-2.58C16.46,3.68 14.43,3.1 12,3.1 7.97,3.1 4.38,5 2.9,7.22l4.06,2.7C7.67,7.96 9.66,6.38 12,6.38z" fill="#EA4335" />
                </svg>
              </div>

              <h3 className="text-xl font-bold text-slate-900 tracking-tight">Choose a Google Account</h3>
              <p className="text-xs text-slate-500 mt-1">to continue to <span className="font-semibold text-emerald-600">Vyora Intelligent Finance</span></p>
            </div>

            <form onSubmit={handleSandboxGoogleLogin} className="mt-6 space-y-4">
              {/* Account Card Selection */}
              <div 
                onClick={() => {
                  setSandboxEmail('kohulprabha@gmail.com');
                  setSandboxName('Kohul Prabha');
                }}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-3.5 ${
                  sandboxEmail === 'kohulprabha@gmail.com' 
                    ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20' 
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="h-10 w-10 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-sm shadow-md shadow-emerald-600/20">
                  KP
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="text-sm font-bold text-slate-900 truncate">Kohul Prabha</div>
                  <div className="text-xs text-slate-500 truncate">kohulprabha@gmail.com</div>
                </div>
                <div className="h-4 w-4 rounded-full border border-emerald-500 flex items-center justify-center p-0.5">
                  {sandboxEmail === 'kohulprabha@gmail.com' && (
                    <div className="h-full w-full rounded-full bg-emerald-500" />
                  )}
                </div>
              </div>

              {/* Custom Google Account Option */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Or enter another Google account
                </label>
                <div className="space-y-2">
                  <input
                    type="email"
                    required
                    value={sandboxEmail}
                    onChange={(e) => setSandboxEmail(e.target.value)}
                    placeholder="google.user@gmail.com"
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-slate-900"
                  />
                  <input
                    type="text"
                    value={sandboxName}
                    onChange={(e) => setSandboxName(e.target.value)}
                    placeholder="Full Name (Optional)"
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-slate-900"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowSandboxModal(false)}
                  className="flex-1 py-2.5 px-4 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 px-4 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-lg shadow-slate-900/10 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? 'Authenticating...' : 'Sign In as ' + (sandboxName || 'User')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
