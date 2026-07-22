/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User } from '../types.js';
import { KeyRound, ShieldAlert, UserCheck, Sun, Moon } from 'lucide-react';

interface SettingsViewProps {
  user: User;
  onUpdateProfile: (name: string, theme: 'light' | 'dark') => Promise<void>;
  onChangePassword: (current: string, next: string) => Promise<void>;
  onDeleteAccount: () => Promise<void>;
}

export default function SettingsView({
  user,
  onUpdateProfile,
  onChangePassword,
  onDeleteAccount
}: SettingsViewProps) {

  const [name, setName] = useState(user.name);
  const [theme, setTheme] = useState<'light' | 'dark'>(user.theme || 'dark');

  // Reactively sync states if user details or theme are updated from outside (like quick-toggle sidebar)
  React.useEffect(() => {
    setName(user.name);
    setTheme(user.theme || 'dark');
  }, [user]);

  // Change Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [profileSuccess, setProfileSuccess] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [error, setError] = useState('');

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess('');
    setError('');
    try {
      await onUpdateProfile(name, theme);
      setProfileSuccess('Profile preferences updated successfully.');
    } catch (err: any) {
      setError(err.message || 'Profile save failed.');
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess('');
    setError('');
    try {
      await onChangePassword(currentPassword, newPassword);
      setPasswordSuccess('Your password has been changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      setError(err.message || 'Failed to update password.');
    }
  };

  const handleDeleteAccountSubmit = () => {
    setShowDeleteConfirm(true);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Profile and Preferences Card */}
        <div className="bg-slate-800/20 border border-slate-700/10 rounded-3xl p-6 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <UserCheck className="h-4.5 w-4.5 text-emerald-400" />
              <span>User Profile Preferences</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">Configure your personal presentation options and theme variables.</p>
          </div>

          {profileSuccess && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl p-3">
              {profileSuccess}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-900/60 border border-slate-700/60 rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Application Theme</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold border transition-all cursor-pointer ${theme === 'light' ? 'bg-amber-500/10 text-amber-400 border-amber-500/40' : 'bg-slate-950/40 text-slate-400 border-slate-800'}`}
                >
                  <Sun className="h-4 w-4" /> Light Mode
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold border transition-all cursor-pointer ${theme === 'dark' ? 'bg-blue-500/10 text-blue-400 border-blue-500/40' : 'bg-slate-950/40 text-slate-400 border-slate-800'}`}
                >
                  <Moon className="h-4 w-4" /> Dark Mode
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Save Preferences
            </button>
          </form>
        </div>

        {/* Change Password Card */}
        <div className="bg-slate-800/20 border border-slate-700/10 rounded-3xl p-6 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <KeyRound className="h-4.5 w-4.5 text-emerald-400" />
              <span>Modify Password security</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">Keep your personal financial ledger shielded with strong password phrases.</p>
          </div>

          {passwordSuccess && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl p-3">
              {passwordSuccess}
            </div>
          )}

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl p-3">
              {error}
            </div>
          )}

          <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Current Password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-slate-900/60 border border-slate-700/60 rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-slate-900/60 border border-slate-700/60 rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Update Password
            </button>
          </form>
        </div>

      </div>

      {/* About Vyora Card */}
      <div className="bg-slate-800/10 border border-slate-700/10 rounded-3xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <span className="text-sm font-black">V</span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">About Vyora</h3>
            <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Finance Made Intelligent</p>
          </div>
        </div>
        <div className="text-xs text-slate-300 space-y-3 leading-relaxed">
          <p>
            Vyora is a next-generation AI-powered personal finance platform that combines budgeting, savings, wealth management, and intelligent financial insights into one secure and user-friendly application.
          </p>
          <p>
            Our mission is to simplify financial management and empower users to make smarter financial decisions through automation, analytics, and artificial intelligence.
          </p>
        </div>
      </div>

      {/* Account Deletion and Red Alert Card */}
      <div className="bg-rose-500/5 border border-rose-500/20 rounded-3xl p-6 space-y-4">
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-rose-400">Danger Zone: Permanent Account Deletion</h3>
            <p className="text-xs text-slate-400 mt-1">
              Deleting your account is irreversible. All transactions ledger posts, active budgets, savings goals milestones, and scheduled bill alarms will be purged from our SQLite-powered persistence storage.
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleDeleteAccountSubmit}
            className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Permanently Purge My Account
          </button>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 relative shadow-2xl">
            <h3 className="text-base font-bold text-rose-400 mb-2">Delete Vyora Account?</h3>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              CRITICAL WARNING: This operation will permanently delete your Vyora account and ALL corresponding transactions, savings goals, category budgets, and reminder alerts. This cannot be undone. Do you wish to continue?
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2 px-4 bg-slate-850 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  setShowDeleteConfirm(false);
                  await onDeleteAccount();
                }}
                className="flex-1 py-2 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Delete Account Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
