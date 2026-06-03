/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { dbService, isSupabaseConfigured, SUPABASE_SQL_SCHEMA } from '../dbService';
import { Shield, Sparkles, AlertCircle, Database, Lock, Mail, User, CheckCircle2, Copy, Eye, EyeOff } from 'lucide-react';

interface AuthScreenProps {
  onAuthSuccess: (user: { id: string; email: string; fullName: string }, mode: 'supabase' | 'sandbox') => void;
}

export default function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [isForgotPassword, setIsForgotPassword] = useState<boolean>(false);
  
  // Fields
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  
  // UI states
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [showSqlDoc, setShowSqlDoc] = useState<boolean>(false);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setInfoMsg(null);

    const safeEmail = email.trim();

    try {
      if (isForgotPassword) {
        if (!safeEmail) {
          throw new Error('Please enter your email address.');
        }
        const result = await dbService.resetPassword(safeEmail);
        setInfoMsg(result.message);
        setIsForgotPassword(false);
      } else if (isLogin) {
        if (!safeEmail || !password) {
          throw new Error('Please fill in all credentials.');
        }
        const result = await dbService.signIn(safeEmail, password);
        if (result.success) {
          // Fetch authenticated session status from service
          const session = await dbService.getAuthenticatedUser();
          if (session.user) {
            onAuthSuccess(session.user as any, session.sessionMode);
          }
        }
      } else {
        if (!fullName.trim() || !safeEmail || !password) {
          throw new Error('Please complete all signup fields.');
        }
        if (password.length < 6) {
          throw new Error('Security policy: Password must be at least 6 characters.');
        }
        const result = await dbService.signUp(safeEmail, password, fullName.trim());
        if (result.success) {
          setInfoMsg(result.message || 'Account successfully compiled!');
          // In sandbox, it auto-signs them in. In Supabase, it might require confirm or auto-works.
          const session = await dbService.getAuthenticatedUser();
          if (session.user) {
            onAuthSuccess(session.user as any, session.sessionMode);
          } else {
            setIsLogin(true);
          }
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected authentication error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-8 px-4 font-sans selection:bg-brand-500 selection:text-white">
      
      {/* Container Card */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 p-6 sm:p-8 transition-all relative overflow-hidden">
        
        {/* Background Accent Gradients resembling African warm dusk & green wellness */}
        <div className="absolute top-0 left-0 w-full h-[6px] bg-gradient-to-r from-brand-500 via-accent-amber to-accent-sunset"></div>
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-50 rounded-full blur-3xl opacity-70"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-accent-amber/10 rounded-full blur-3xl opacity-75"></div>

        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8 relative z-10 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-brand-500 to-brand-800 rounded-2xl flex items-center justify-center text-white mb-3 shadow-md shadow-brand-500/20">
            <Shield className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            SickleCell Community Africa
          </h1>
          <p className="text-sm font-medium text-brand-700 mt-1 max-w-xs">
            Empowering, tracking, & protecting sickle cell warriors everyday.
          </p>
        </div>

        {/* Database Status Pill */}
        <div className="mb-6 p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Database className={`w-4 h-4 ${isSupabaseConfigured ? 'text-brand-500' : 'text-slate-400'}`} />
            <span>DB Status:</span>
          </div>
          {isSupabaseConfigured ? (
            <span className="font-semibold text-brand-600 bg-brand-50 px-2 py-1 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse"></span>
              Supabase Connected
            </span>
          ) : (
            <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-1 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
              Demo Sandbox Mode
            </span>
          )}
        </div>

        {/* Status Alerts */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-orange-50 border border-orange-200 text-orange-900 text-sm flex gap-2 items-start" id="auth-error-msg">
            <AlertCircle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
            <span className="font-medium">{errorMsg}</span>
          </div>
        )}

        {infoMsg && (
          <div className="mb-4 p-3 rounded-xl bg-brand-50 border border-brand-150 text-brand-900 text-sm flex gap-2 items-start" id="auth-info-msg">
            <CheckCircle2 className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
            <span className="font-medium">{infoMsg}</span>
          </div>
        )}

        {/* Form Action */}
        <form onSubmit={handleAuthAction} className="space-y-4">
          
          {/* Email Password Auth views */}
          {!isLogin && !isForgotPassword && (
            <div className="space-y-1">
              <label htmlFor="reg-name" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Warrior / Patient Full Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <User className="w-4 h-4" />
                </span>
                <input
                  id="reg-name"
                  type="text"
                  required
                  placeholder="Kofi Mensah"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition"
                />
              </div>
            </div>
          )}

          {!isForgotPassword && (
            <div className="space-y-1">
              <label htmlFor="auth-email" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  id="auth-email"
                  type="email"
                  required
                  placeholder="enter.your.email@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition"
                />
              </div>
            </div>
          )}

          {isForgotPassword && (
            <div className="space-y-1">
              <label htmlFor="reset-email" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Reset Account Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  id="reset-email"
                  type="email"
                  required
                  placeholder="enter.your.email@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition"
                />
              </div>
            </div>
          )}

          {!isForgotPassword && (
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label htmlFor="auth-password" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                {isLogin && (
                  <button
                    type="button"
                    onClick={() => setIsForgotPassword(true)}
                    className="text-xs text-brand-600 hover:underline transition font-medium"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  id="auth-password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Prompt warning of preset passwords in sandbox */}
          {isLogin && !isSupabaseConfigured && (
            <div className="p-2 bg-amber-50 rounded-lg text-[11px] text-amber-800 border border-amber-100">
              <strong className="underline font-bold">Try quick demo sandbox account</strong>:<br />
              Email: <code className="bg-amber-100/50 px-1 rounded">samuelxofficial256@gmail.com</code> | Pass: <code className="bg-amber-100/50 px-1 rounded">password123</code>
            </div>
          )}

          {/* Actions */}
          <button
            id="auth-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 text-white font-semibold text-sm rounded-xl transition shadow-lg shadow-brand-500/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : isForgotPassword ? (
              'Send Password Reset Instructions'
            ) : isLogin ? (
              'Sign In to Dashboard'
            ) : (
              'Register as a Patient Warrior'
            )}
          </button>
        </form>

        {/* Auth Toggle footer */}
        <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
          {isForgotPassword ? (
            <button
              onClick={() => {
                setIsForgotPassword(false);
                setErrorMsg(null);
                setInfoMsg(null);
              }}
              className="font-medium text-brand-600 hover:underline transition"
            >
              Back to Sign In
            </button>
          ) : isLogin ? (
            <p>
              New to the community?{' '}
              <button
                onClick={() => {
                  setIsLogin(false);
                  setErrorMsg(null);
                  setInfoMsg(null);
                }}
                className="font-semibold text-brand-600 hover:underline transition"
                id="toggle-signup-view"
              >
                Sign Up Now
              </button>
            </p>
          ) : (
            <p>
              Already registered?{' '}
              <button
                onClick={() => {
                  setIsLogin(true);
                  setErrorMsg(null);
                  setInfoMsg(null);
                }}
                className="font-semibold text-brand-600 hover:underline transition"
                id="toggle-login-view"
              >
                Sign In Here
              </button>
            </p>
          )}
        </div>

      </div>

      {/* Database connection guides shown in sandbox mode for developers */}
      {!isSupabaseConfigured && (
        <div className="w-full max-w-md mt-6 bg-slate-900 text-slate-300 rounded-3xl p-5 shadow-lg border border-slate-800 text-xs">
          <div className="flex items-center justify-between mb-3 text-slate-100">
            <h3 className="font-bold flex items-center gap-2">
              <Lock className="w-4 h-4 text-brand-500" />
              Developer/Host Setup Checklist
            </h3>
            <button
              onClick={() => setShowSqlDoc(!showSqlDoc)}
              className="text-brand-400 hover:underline text-[11px] font-medium transition"
            >
              {showSqlDoc ? 'Hide SQL' : 'Show Postgres SQL Code'}
            </button>
          </div>
          <p className="leading-relaxed mb-4 text-slate-400">
            This app is built to connect perfectly to your private cloud database. To connect real Supabase, add 
            <code className="mx-1 text-white bg-slate-800 px-1 py-0.5 rounded text-[10px] b">VITE_SUPABASE_URL</code> and 
            <code className="text-white bg-slate-800 px-1 py-0.5 rounded text-[10px] b">VITE_SUPABASE_ANON_KEY</code> to the app's Secrets or <code className="bg-slate-800 px-1 py-0.5 rounded text-[10px]">.env</code> file.
          </p>

          {showSqlDoc && (
            <div className="mt-3 relative">
              <div className="absolute right-2 top-2 z-10">
                <button
                  onClick={handleCopySql}
                  type="button"
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-1.5 rounded border border-slate-700 transition flex items-center gap-1 text-[10px] cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copiedSql ? 'Copied!' : 'Copy Schema'}
                </button>
              </div>
              <div className="max-h-48 overflow-y-auto bg-slate-950 p-3 rounded-xl border border-slate-800 text-[10px] font-mono whitespace-pre text-emerald-400">
                {SUPABASE_SQL_SCHEMA}
              </div>
              <p className="text-[10px] text-slate-400 italic mt-2">
                Paste this into your Supabase SQL Editor and click Run to create the tables instantly with correct policies!
              </p>
            </div>
          )}
        </div>
      )}

      {/* Healthcare Disclaimer */}
      <footer className="w-full max-w-md mt-8 text-center text-[11px] text-slate-400 px-4 leading-relaxed">
        <p className="flex items-center justify-center gap-1 text-slate-500 font-medium mb-1">
          <Sparkles className="w-3.5 h-3.5 text-brand-500" />
          Africa's Resilient Sickle Cell Network
        </p>
        Disclaimer: This patient journal and tool acts as a logging helper. It does not replace emergency medical triage or official clinical diagnoses.
      </footer>

    </div>
  );
}
