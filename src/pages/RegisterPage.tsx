import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../i18n';
import { District } from '../types';
import { Logo } from '../components/layout/Logo';
import { User, Mail, Lock, MapPin, ArrowRight } from 'lucide-react';

interface RegisterPageProps {
  districts: District[];
  navigate: (route: string, param?: string) => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ districts, navigate }) => {
  const { register } = useAuth();
  const { language, t, localizedName } = useLanguage();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [homeDistrictId, setHomeDistrictId] = useState('dhaka');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError(t('auth.passwordMinLength'));
      return;
    }

    try {
      setIsLoading(true);
      await register(name, email, password, homeDistrictId);
      navigate('home');
    } catch (err: any) {
      setError(err.message || (language === 'bn' ? 'নিবন্ধন সম্পন্ন করা যায়নি।' : 'Registration failed.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 px-4 space-y-6">
      <div className="text-center space-y-2">
        <div className="flex justify-center mb-2">
          <Logo size="lg" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 font-bengali">
          {t('auth.registerTitle')}
        </h1>
        <p className="text-xs text-slate-500 font-bengali">
          {t('auth.registerSubtitle')}
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-amber-900/10 p-6 sm:p-8 shadow-xs space-y-5">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-bengali">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 font-bengali">
              {t('auth.name')}
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Tanvir Hossain"
                className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#155C3A]"
              />
            </div>
          </div>

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
              {t('auth.password')} ({language === 'bn' ? 'ন্যূনতম ৬ অক্ষর' : 'minimum 6 characters'})
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#155C3A]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 font-bengali">
              {t('profile.homeDistrict')}
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={homeDistrictId}
                onChange={(e) => setHomeDistrictId(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#155C3A]"
              >
                {districts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {localizedName(d)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-[#155C3A] hover:bg-[#0e442a] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer font-bengali"
          >
            <span>{isLoading ? (language === 'bn' ? 'অ্যাকাউন্ট তৈরি হচ্ছে...' : 'Creating Account...') : t('auth.registerBtn')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100 font-bengali">
          <span>{t('auth.haveAccount')} </span>
          <button
            onClick={() => navigate('login')}
            className="text-[#155C3A] font-bold hover:underline cursor-pointer"
          >
            {t('auth.signInBtn')}
          </button>
        </div>
      </div>
    </div>
  );
};
