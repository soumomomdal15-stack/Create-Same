import React, { useState, useEffect } from 'react';
import { CampaignStore } from '../utils/store';
import { Award, ShieldAlert, AlertCircle, CheckCircle2, Lock } from 'lucide-react';
import appLogo from '../assets/images/earnos_app_logo_1779768057177.png';

interface LoginPageProps {
  theme: 'light' | 'dark';
  onLoginSuccess: (panel: 'user' | 'admin') => void;
  toggleTheme: () => void;
}

export default function LoginPage({ theme, onLoginSuccess, toggleTheme }: LoginPageProps) {
  const [activeTab, setActiveTab] = useState<'user' | 'admin'>('user');

  const [userAuthMode, setUserAuthMode] = useState<'login' | 'signup'>('login');
  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [referralInput, setReferralInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  const [captchaNum1, setCaptchaNum1] = useState(0);
  const [captchaNum2, setCaptchaNum2] = useState(0);
  const [captchaAnswer, setCaptchaAnswer] = useState('');

  const [adminPin, setAdminPin] = useState('');
  const [adminError, setAdminError] = useState('');

  const genCaptcha = () => {
    setCaptchaNum1(Math.floor(Math.random() * 8) + 1);
    setCaptchaNum2(Math.floor(Math.random() * 9) + 1);
    setCaptchaAnswer('');
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code') || params.get('ref');
    if (code) {
      setReferralInput(code);
      setUserAuthMode('signup');
    }
  }, []);

  useEffect(() => {
    genCaptcha();
  }, [activeTab, userAuthMode]);

  const handleUserAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    if (!emailInput) {
      setAuthError('Please enter a valid Gmail address.');
      return;
    }

    if (!userPassword || userPassword.length < 4) {
      setAuthError('Password must be at least 4 characters long.');
      return;
    }

    const expected = captchaNum1 + captchaNum2;
    if (parseInt(captchaAnswer) !== expected) {
      setAuthError('Security verification math CAPTCHA failed.');
      genCaptcha();
      return;
    }

    if (emailInput.toLowerCase().trim() === 'admin@gmail.com') {
      if (userPassword === '82503346') {
        setAuthSuccess('Administrator authenticated successfully! Opening Control Desk...');
        CampaignStore.adminLogin('82503346');
        setTimeout(() => { onLoginSuccess('admin'); }, 600);
        return;
      } else {
        setAuthError('Incorrect password entered for administrative account.');
        return;
      }
    }

    const loginResult = CampaignStore.registerOrLoginUser(
      emailInput,
      userAuthMode === 'signup' ? nameInput : '',
      userPassword,
      userAuthMode === 'signup' ? referralInput : undefined,
      userAuthMode === 'signup'
    );

    if (!loginResult.success) {
      setAuthError(loginResult.message);
      genCaptcha();
    } else {
      setAuthSuccess(userAuthMode === 'signup' ? 'Account registered and secured!' : 'Authenticated securely!');
      setTimeout(() => { onLoginSuccess('user'); }, 600);
    }
  };

  const handleAdminAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');
    const success = CampaignStore.adminLogin(adminPin);
    if (success) {
      onLoginSuccess('admin');
    } else {
      setAdminError('Incorrect administrator passcode. Please try 82503346');
    }
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 md:p-6 transition-colors duration-200 ${
      theme === 'dark' ? 'bg-zinc-950 text-slate-100' : 'bg-slate-50 text-zinc-900'
    }`}>
      <div className="absolute top-4 right-4 z-50">
        <button
          onClick={toggleTheme}
          className={`p-2.5 rounded-2xl border shadow-lg transition-all active:scale-95 cursor-pointer ${
            theme === 'dark'
              ? 'bg-zinc-900 border-zinc-800 text-slate-200 hover:bg-zinc-800'
              : 'bg-white border-slate-200 text-zinc-800 hover:bg-slate-100'
          }`}
          title="Toggle Light/Dark Theme"
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </div>

      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-20 h-20 rounded-[32px] bg-zinc-900 overflow-hidden flex items-center justify-center shadow-2xl border-2 border-zinc-800">
            <img src={appLogo} alt="EarnOS App Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-indigo-500 dark:from-white dark:to-zinc-300">
              EarnOS
            </h1>
            <p className="text-xs text-zinc-400 mt-1 font-medium px-4">
              Premium Earning Simulator & Interactive Campaign Desk
            </p>
          </div>
        </div>

        {/* Tab selector */}
        <div className={`flex rounded-2xl p-1 gap-1 border ${
          theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-slate-100 border-slate-200'
        }`}>
          <button
            onClick={() => { setActiveTab('user'); setAuthError(''); setAdminError(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'user'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-slate-300'
            }`}
          >
            📱 User Portal
          </button>
          <button
            onClick={() => { setActiveTab('admin'); setAuthError(''); setAdminError(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'admin'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-slate-300'
            }`}
          >
            🛡️ Admin Desk
          </button>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 rounded-[32px] overflow-hidden shadow-2xl transition-all duration-300">
          <div className="p-6 md:p-8">
            {activeTab === 'user' ? (
              <div className="space-y-4">
                <div className="text-center md:text-left">
                  <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2 justify-center md:justify-start">
                    <Award className="w-5 h-5 text-zinc-500" />
                    <span>Task Earner Portal</span>
                  </h2>
                  <p className="text-xs text-zinc-400 mt-1">
                    {userAuthMode === 'login' ? 'Sign in to access your task simulator.' : 'Create a simulator profile to start earning.'}
                  </p>
                </div>

                <div className="flex bg-slate-100 dark:bg-zinc-800/60 p-1 rounded-xl gap-1 border border-slate-200/50 dark:border-zinc-700/50">
                  <button
                    type="button"
                    onClick={() => { setUserAuthMode('login'); setAuthError(''); setAuthSuccess(''); }}
                    className={`flex-1 text-center py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      userAuthMode === 'login'
                        ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-slate-300'
                    }`}
                  >
                    🔑 Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => { setUserAuthMode('signup'); setAuthError(''); setAuthSuccess(''); }}
                    className={`flex-1 text-center py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      userAuthMode === 'signup'
                        ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-slate-300'
                    }`}
                  >
                    📝 Create Account
                  </button>
                </div>

                <form onSubmit={handleUserAuthSubmit} className="space-y-4 pt-1">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Gmail Address</label>
                    <input
                      type="email"
                      placeholder="name@gmail.com"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-brand-500 text-zinc-850 dark:text-zinc-100"
                    />
                  </div>

                  {userAuthMode === 'signup' && (
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">User Nickname (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. Rahul Sharma"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-brand-500 text-zinc-850 dark:text-zinc-100"
                      />
                    </div>
                  )}

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Password</label>
                      {userAuthMode === 'login' && (
                        <span className="text-[9px] text-zinc-400 font-medium">(First login claims password if not set)</span>
                      )}
                    </div>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={userPassword}
                      onChange={(e) => setUserPassword(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-brand-500 text-zinc-850 dark:text-zinc-100"
                    />
                  </div>

                  {userAuthMode === 'signup' && (
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Referral Code (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. Enter Referral Code"
                        value={referralInput}
                        onChange={(e) => setReferralInput(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-brand-500 text-zinc-850 dark:text-zinc-100"
                      />
                    </div>
                  )}

                  <div className="bg-slate-50 dark:bg-zinc-800/40 p-3.5 rounded-2xl border border-slate-100 dark:border-zinc-800 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-brand-500 shrink-0" />
                      <span className="text-xs font-bold text-zinc-400">Captcha:</span>
                      <span className="font-mono text-sm font-black bg-slate-200 dark:bg-zinc-700 px-2 py-0.5 rounded text-zinc-850 dark:text-zinc-100">
                        {captchaNum1} + {captchaNum2}
                      </span>
                    </div>
                    <input
                      type="number"
                      placeholder="Sum"
                      value={captchaAnswer}
                      onChange={(e) => setCaptchaAnswer(e.target.value)}
                      required
                      className="w-16 px-2 py-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg text-center text-xs text-zinc-850 dark:text-zinc-100 focus:outline-none"
                    />
                  </div>

                  {authError && (
                    <div className="text-xs text-red-500 bg-red-500/5 p-3 rounded-xl border border-red-500/15 flex items-start gap-1.5 leading-relaxed">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500 mt-0.5" />
                      <span>{authError}</span>
                    </div>
                  )}

                  {authSuccess && (
                    <div className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/15 flex items-start gap-1.5 leading-relaxed">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-500 mt-0.5" />
                      <span>{authSuccess}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-brand-600 hover:bg-brand-500 active:scale-[0.99] text-white font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg cursor-pointer"
                  >
                    {userAuthMode === 'login' ? 'Log In Securely' : 'Create & Register Account'}
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center md:text-left">
                  <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2 justify-center md:justify-start">
                    <Lock className="w-5 h-5 text-zinc-500" />
                    <span>Admin Control Desk</span>
                  </h2>
                  <p className="text-xs text-zinc-400 mt-1">
                    Enter the administration passcode to manage tasks, verify uploads, and approve payouts.
                  </p>
                </div>

                <form onSubmit={handleAdminAuthSubmit} className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                      Admin PASSCODE
                    </label>
                    <input
                      type="password"
                      placeholder="Enter Password Code"
                      value={adminPin}
                      onChange={(e) => setAdminPin(e.target.value)}
                      required
                      className="w-full px-4 py-3 rounded-xl text-center text-sm font-mono tracking-widest bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-zinc-850 dark:text-zinc-100"
                    />
                  </div>

                  {adminError && (
                    <div className="text-xs text-red-500 bg-red-500/5 p-3 rounded-xl border border-red-500/15 flex items-start gap-1.5 leading-relaxed">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500 mt-0.5" />
                      <span>{adminError}</span>
                    </div>
                  )}

                  <div className="bg-indigo-500/5 border border-indigo-500/10 p-3.5 rounded-2xl">
                    <span className="block text-[10px] text-indigo-500 font-bold font-mono text-center">
                      🔑 Administrator Passcode: 82503346
                    </span>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-slate-950 hover:bg-slate-900 active:scale-[0.99] dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg cursor-pointer"
                  >
                    Secure Log In
                  </button>
                </form>

                <div className="pt-2 text-center">
                  <span className="text-[10px] text-zinc-500">
                    Dual role simulation testing enabled. Secure sandbox offline storage.
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
