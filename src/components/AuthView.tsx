import React, { useState } from 'react';
import { 
  FolderLock, 
  Shield, 
  ArrowRight, 
  CheckCircle2, 
  Lock, 
  Mail, 
  User, 
  Building, 
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  Database
} from 'lucide-react';
import { login, register, loginAsDemoAdmin } from '../api.ts';
import { User as UserType } from '../types.ts';

interface AuthViewProps {
  onAuthSuccess: (user: UserType) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email || !password) {
      setErrorMsg('Please enter both your email address and password.');
      return;
    }

    if (mode === 'register' && !name) {
      setErrorMsg('Please enter your full name to create an account.');
      return;
    }

    try {
      setIsLoading(true);
      if (mode === 'login') {
        const { user } = await login(email, password);
        onAuthSuccess(user);
      } else {
        const { user } = await register(email, password, name, company);
        onAuthSuccess(user);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please verify your details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoSignIn = async () => {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      setEmail('sarah@clientvault.app');
      setPassword('password123');
      const { user } = await login('sarah@clientvault.app', 'password123');
      onAuthSuccess(user);
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not log in to demo account.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminSignIn = async () => {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      setEmail('admin@clientvault.app');
      setPassword('admin123');
      const { user } = await loginAsDemoAdmin();
      onAuthSuccess(user);
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not log in to admin account.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070D1E] text-white flex flex-col justify-between relative overflow-hidden select-none">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Container */}
      <main className="flex-1 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Brand Header */}
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8">
          <div className="inline-flex relative mb-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/40 flex items-center justify-center shadow-lg shadow-blue-500/10 ring-4 ring-blue-500/10">
              <FolderLock className="w-7 h-7 text-blue-400" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[#070D1E] flex items-center justify-center">
              <ShieldCheck className="w-3 h-3 text-white" />
            </div>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-white">ClientVault</h1>
          <p className="mt-1.5 text-xs text-slate-400 font-medium">
            Secure client file portal for designers & freelancers
          </p>
        </div>

        {/* Deep Navy Vault Form Card */}
        <div className="w-full max-w-md">
          <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800/90 shadow-2xl rounded-2xl p-6 sm:p-8 relative">
            {/* Mode Switcher */}
            <div className="flex p-1 mb-6 bg-slate-950/80 rounded-xl border border-slate-800/60">
              <button
                type="button"
                onClick={() => { setMode('login'); setErrorMsg(null); }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                  mode === 'login'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setMode('register'); setErrorMsg(null); }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                  mode === 'register'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Create an Account
              </button>
            </div>

            {errorMsg && (
              <div className="mb-5 p-3 bg-rose-950/50 border border-rose-800/60 rounded-xl flex items-center gap-2.5 text-xs text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Alex Morgan"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full text-xs pl-10 pr-3 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Studio or Brand Name (Optional)
                    </label>
                    <div className="relative">
                      <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="e.g. Studio Craft"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        className="w-full text-xs pl-10 pr-3 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="you@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-xs pl-10 pr-3 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full text-xs pl-10 pr-3 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 mt-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>{mode === 'login' ? 'Sign In to Vault' : 'Create Vault Account'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Sign In Box */}
            <div className="mt-6 pt-5 border-t border-slate-800">
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-center">
                <p className="text-[11px] text-slate-400 mb-2.5 font-medium">
                  Instant Test Sign-In Options:
                </p>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleAdminSignIn}
                    disabled={isLoading}
                    className="w-full py-2 px-3 text-xs font-bold text-rose-300 bg-rose-950/40 hover:bg-rose-900/50 rounded-lg border border-rose-800/80 transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>Sign In as Admin (1z0gjTL5wFcUnv6ibzmp70L7DW63)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDemoSignIn}
                    disabled={isLoading}
                    className="w-full py-2 px-3 text-xs font-semibold text-blue-300 bg-blue-950/40 hover:bg-blue-900/50 rounded-lg border border-blue-800/80 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>Sign In as Demo Freelancer (Sarah Jenkins)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Security Features Badges */}
          <div className="mt-6 flex items-center justify-center gap-4 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-blue-400" />
              <span>256-bit scrypt encryption</span>
            </div>
            <span className="text-slate-700">·</span>
            <div className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>Isolated Firestore storage</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-[11px] text-slate-500 border-t border-slate-900 relative z-10">
        <span>ClientVault · Private & Encrypted Client File Portal</span>
      </footer>
    </div>
  );
};
