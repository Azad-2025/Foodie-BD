import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../i18n';
import { Logo } from '../components/layout/Logo';
import { Mail, Lock, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';

interface LoginPageProps {
  navigate: (route: string, param?: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ navigate }) => {
  const { login } = useAuth();
  const { language, t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      setIsLoading(true);
      await login(email, password);
      navigate('home');
    } catch (err: any) {
      setError(err.message || (language === 'bn' ? 'লগইন ব্যর্থ হয়েছে। তথ্য যাচাই করুন।' : 'Login failed. Please check your credentials.'));
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoAdmin = () => {
    setEmail('salahuddinazad01631@gmail.com');
    setPassword('Super@dmin01');
    setError(null);
  };

  const fillDemoUser = () => {
    setEmail('foodie@example.com');
    setPassword('Foodie123!');
    setError(null);
  };

  return (
    <div className="max-w-md mx-auto my-12 px-4 space-y-6">
      <div className="text-center space-y-2">
        <div className="flex justify-center mb-2">
          <Logo size="lg" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 font-bengali">
          {t('auth.loginTitle')}
        </h1>
        <p className="text-xs text-slate-500 font-bengali">
          {t('auth.loginSubtitle')}
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-amber-900/10 p-6 sm:p-8 shadow-xs space-y-6">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-bengali">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 font-bengali">
              {t('auth.email')}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#155C3A]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 font-bengali">
              {t('auth.password')}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#155C3A]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-[#155C3A] hover:bg-[#0e442a] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer font-bengali"
          >
            <span>{isLoading ? (language === 'bn' ? 'সাইন ইন হচ্ছে...' : 'Signing In...') : t('auth.signInBtn')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Demo Fast Fill Buttons for Testing */}
        <div className="pt-4 border-t border-slate-100 space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center font-bengali">
            {t('auth.demoTitle')}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={fillDemoUser}
              className="py-2 px-2.5 rounded-xl border border-slate-200 hover:border-[#155C3A] bg-slate-50 hover:bg-emerald-50 text-[11px] font-semibold text-slate-700 transition-colors flex items-center justify-center gap-1 cursor-pointer font-bengali"
            >
              <UserCheck className="w-3 h-3 text-[#155C3A]" />
              <span>{t('auth.explorer')}</span>
            </button>

            <button
              type="button"
              onClick={fillDemoAdmin}
              className="py-2 px-2.5 rounded-xl border border-emerald-200 hover:border-emerald-500 bg-emerald-50/70 hover:bg-emerald-100 text-[11px] font-semibold text-emerald-900 transition-colors flex items-center justify-center gap-1 cursor-pointer font-bengali"
            >
              <ShieldCheck className="w-3 h-3 text-emerald-700" />
              <span>{t('auth.admin')}</span>
            </button>
          </div>
        </div>

        <div className="text-center text-xs text-slate-500 pt-2 font-bengali">
          <span>{t('auth.noAccount')} </span>
          <button
            onClick={() => navigate('register')}
            className="text-[#155C3A] font-bold hover:underline cursor-pointer"
          >
            {t('auth.registerBtn')}
          </button>
        </div>
      </div>
    </div>
  );
};
