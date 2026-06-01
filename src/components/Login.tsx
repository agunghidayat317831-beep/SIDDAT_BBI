import React, { useState } from 'react';
import { Fish, Lock, User, AlertCircle, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

interface LoginProps {
  onLoginSuccess: (username: string, role: 'admin' | 'guest') => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Short artificial delay to provide a realistic, polished login experience
    setTimeout(() => {
      const lowerUsername = username.trim().toLowerCase();
      const enteredPassword = password;

      if (lowerUsername === 'admin' && enteredPassword === 'admin123') {
        onLoginSuccess('admin', 'admin');
      } else if (lowerUsername === 'guest' && enteredPassword === 'guest123') {
        onLoginSuccess('guest', 'guest');
      } else {
        setError('Username atau password salah. Periksa kembali kredensial Anda.');
        setLoading(false);
      }
    }, 650);
  };

  return (
    <div id="login-screen-outer" className="min-h-screen flex items-center justify-center bg-slate-50 p-4 relative overflow-hidden select-none">
      {/* Dynamic Background Accents */}
      <div className="absolute top-0 left-0 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl -translate-x-12 -translate-y-12"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl translate-x-20 translate-y-20"></div>

      <motion.div 
        id="login-card-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-slate-200 border border-slate-100 p-8 md:p-10 relative z-10"
      >
        {/* Visual Brand Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
            <Fish className="w-8 h-8 text-white" />
          </div>
          <h1 id="login-app-title" className="text-3xl font-extrabold text-slate-800 tracking-tight">Siddat BBI</h1>
          <p id="login-app-subtitle" className="text-sm font-semibold text-slate-400 mt-1 max-w-xs mx-auto">
            Sistem Pencatatan Logistik Ikan & Kualitas Air Terpadu
          </p>
        </div>

        {/* Credentials Info Badge */}
        <div id="login-help-badge" className="mb-6 p-3 bg-blue-50/50 border border-blue-100 rounded-2xl flex items-start gap-2.5 text-left text-xs text-blue-700 font-medium">
          <ShieldCheck className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-bold">Kredensial Akses:</p>
            <p className="text-[11px] text-blue-600/90 mt-0.5">
              • Admin: <span className="font-mono bg-blue-100/50 px-1 rounded">admin</span> / <span className="font-mono bg-blue-100/50 px-1 rounded">admin123</span>
            </p>
            <p className="text-[11px] text-blue-600/90 mt-0.5">
              • Guest: <span className="font-mono bg-blue-100/50 px-1 rounded">guest</span> / <span className="font-mono bg-blue-100/50 px-1 rounded">guest123</span>
            </p>
          </div>
        </div>

        {/* Login Error Notification */}
        {error && (
          <motion.div 
            id="login-error-alert"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-5 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-700 text-xs font-semibold text-left"
          >
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <p>{error}</p>
          </motion.div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5 text-left">
          {/* Username Input */}
          <div className="space-y-1.5">
            <label htmlFor="login-username" className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
              Username
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </span>
              <input
                id="login-username"
                type="text"
                required
                disabled={loading}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username Anda..."
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-sm placeholder:text-slate-400 text-slate-800"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <label htmlFor="login-password" className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                required
                disabled={loading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password Anda..."
                className="w-full pl-11 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-sm placeholder:text-slate-400 text-slate-800 font-sans"
              />
              <button
                type="button"
                id="login-toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            id="login-submit-btn"
            disabled={loading}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-2xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 text-sm mt-8 cursor-pointer"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Mohon tunggu...</span>
              </>
            ) : (
              <span>Masuk Aplikasi</span>
            )}
          </button>
        </form>

        {/* Elegant Footer Notice */}
        <p id="login-footer-text" className="mt-8 text-[11px] text-slate-400 text-center leading-relaxed font-medium">
          Dinas Perikanan & Kelautan | Balai Benih Ikan (BBI)
        </p>
      </motion.div>
    </div>
  );
}
