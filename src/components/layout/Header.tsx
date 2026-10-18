import React, { useState, useEffect, useRef } from 'react';
import { Logo } from './Logo';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n';
import {
  Globe,
  User,
  Shield,
  Menu,
  X,
  LogOut,
  Compass,
  Check,
  ChevronDown,
} from 'lucide-react';
import { FoodieCardExportModal } from '../export/FoodieCardExportModal';

interface HeaderProps {
  currentRoute: string;
  navigate: (route: string, param?: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentRoute, navigate }) => {
  const { user, isLoggedIn, isAdmin, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [foodieCardModalOpen, setFoodieCardModalOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);
  const mobileLangRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
      if (langRef.current && !langRef.current.contains(event.target as Node) &&
          mobileLangRef.current && !mobileLangRef.current.contains(event.target as Node)) {
        setLangDropdownOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setUserDropdownOpen(false);
        setLangDropdownOpen(false);
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Foodie BD Navigation Items:
  // 1. হোম (Home)
  // 2. ফুডি কার্ড / Foodie Map (Personal Map Page -> route: 'map')
  // 3. খাবার খুঁজুন (Discover Foods -> route: 'discover')
  // 4. আমার যাত্রা (My Journey -> route: 'journey')
  // 5. আমার প্রোফাইল (My Profile -> route: 'profile' / 'login')
  const navItems = [
    {
      id: 'home',
      label: t('nav.home'),
      route: 'home',
      isActive: currentRoute === 'home',
    },
    {
      id: 'foodMap',
      label: t('nav.foodMap'),
      route: 'map',
      isActive: currentRoute === 'map' || currentRoute === 'foodie-card' || currentRoute === 'card',
    },
    {
      id: 'discover',
      label: t('nav.discover'),
      route: 'discover',
      isActive: currentRoute === 'discover',
    },
    {
      id: 'journey',
      label: t('nav.journey'),
      route: 'journey',
      isActive: currentRoute === 'journey',
    },
    {
      id: 'profile',
      label: t('nav.profile'),
      route: isLoggedIn ? 'profile' : 'login',
      isActive: currentRoute === 'profile',
    },
  ];

  const handleNav = (route: string, param?: string) => {
    navigate(route, param);
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  };

  const handleItemClick = (item: typeof navItems[0]) => {
    if (item.route) {
      handleNav(item.route);
    }
  };

  const changeLanguage = (newLang: 'bn' | 'en') => {
    setLanguage(newLang);
    setLangDropdownOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#FAF8F3] border-b border-[#EAE6DF] shadow-xs transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 gap-2 sm:gap-4">
            {/* Far Left: Official Foodie BD Logo */}
            <div className="flex items-center shrink-0">
              <button
                onClick={() => handleNav('home')}
                className="flex items-center text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#155C3A] rounded-xl p-1 transition-opacity hover:opacity-90 cursor-pointer"
                aria-label="Foodie BD Homepage"
              >
                <Logo size="md" />
              </button>
            </div>

            {/* Center: Rounded Pill-shaped Navigation Container */}
            <nav
              aria-label="Main Navigation"
              className="hidden lg:flex items-center bg-[#F1EEE7] rounded-full p-1 xl:p-1.5 shadow-2xs border border-[#E5E1D8]"
            >
              {navItems.map((item) => {
                const active = item.isActive;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={`px-2.5 xl:px-3.5 py-1.5 rounded-full text-xs xl:text-sm font-medium transition-all duration-150 select-none whitespace-nowrap cursor-pointer ${
                      active
                        ? 'bg-white text-stone-900 shadow-xs font-semibold'
                        : 'text-stone-700 hover:text-stone-950 hover:bg-white/60'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>

            {/* Far Right: Language Selector & Sign In Button */}
            <div className="hidden md:flex items-center gap-2.5 shrink-0">
              {/* Language Selector Dropdown */}
              <div className="relative" ref={langRef}>
                <button
                  onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-stone-200/90 text-stone-800 text-xs font-medium hover:bg-stone-50 transition-colors shadow-2xs cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#155C3A]"
                  aria-expanded={langDropdownOpen}
                  aria-haspopup="true"
                  aria-label={t('nav.langSelect')}
                >
                  <Globe className="w-3.5 h-3.5 text-stone-600" />
                  <span className="font-semibold">
                    {language === 'bn' ? 'বাংলা' : 'English'}
                  </span>
                  <ChevronDown className="w-3 h-3 text-stone-400" />
                </button>

                {langDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-36 bg-white rounded-2xl shadow-lg border border-stone-200/90 py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100"
                    role="menu"
                  >
                    <button
                      onClick={() => changeLanguage('bn')}
                      className={`w-full text-left px-3.5 py-2 flex items-center justify-between transition-colors cursor-pointer ${
                        language === 'bn'
                          ? 'bg-[#FAF8F3] text-[#155C3A] font-bold'
                          : 'text-stone-700 hover:bg-stone-50'
                      }`}
                      role="menuitem"
                    >
                      <span>বাংলা</span>
                      {language === 'bn' && <Check className="w-3.5 h-3.5 text-[#155C3A]" />}
                    </button>
                    <button
                      onClick={() => changeLanguage('en')}
                      className={`w-full text-left px-3.5 py-2 flex items-center justify-between transition-colors cursor-pointer ${
                        language === 'en'
                          ? 'bg-[#FAF8F3] text-[#155C3A] font-bold'
                          : 'text-stone-700 hover:bg-stone-50'
                      }`}
                      role="menuitem"
                    >
                      <span>English</span>
                      {language === 'en' && <Check className="w-3.5 h-3.5 text-[#155C3A]" />}
                    </button>
                  </div>
                )}
              </div>

              {/* Login / User Profile Button */}
              {isLoggedIn ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full bg-white border border-stone-200/90 text-stone-800 text-xs font-semibold hover:bg-stone-50 transition-colors shadow-2xs cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#155C3A]"
                  >
                    <img
                      src={user?.avatarUrl || 'https://api.dicebear.com/7.x/initials/svg?seed=Foodie'}
                      alt={user?.name || 'User'}
                      className="w-6 h-6 rounded-full object-cover ring-1 ring-stone-300"
                    />
                    <span className="max-w-[110px] truncate">{user?.name}</span>
                    {isAdmin && (
                      <span className="text-[10px] uppercase font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded-full">
                        Admin
                      </span>
                    )}
                    <ChevronDown className="w-3 h-3 text-stone-400" />
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-stone-200/90 py-2 z-50 text-sm animate-in fade-in zoom-in-95 duration-100">
                      <div className="px-4 py-2.5 border-b border-stone-100">
                        <p className="font-bold text-stone-900 truncate">{user?.name}</p>
                        <p className="text-xs text-stone-500 truncate">{user?.email}</p>
                      </div>

                      <div className="py-1">
                        <button
                          onClick={() => handleNav('journey')}
                          className="w-full text-left px-4 py-2 text-stone-700 hover:bg-[#FAF8F3] hover:text-[#155C3A] flex items-center gap-2.5 text-xs font-medium cursor-pointer"
                        >
                          <Compass className="w-4 h-4 text-[#155C3A]" />
                          <span>{t('nav.journey')}</span>
                        </button>

                        <button
                          onClick={() => handleNav('profile')}
                          className="w-full text-left px-4 py-2 text-stone-700 hover:bg-[#FAF8F3] hover:text-[#155C3A] flex items-center gap-2.5 text-xs font-medium cursor-pointer"
                        >
                          <User className="w-4 h-4 text-stone-500" />
                          <span>{t('nav.profile')}</span>
                        </button>

                        {isAdmin && (
                          <button
                            onClick={() => handleNav('admin')}
                            className="w-full text-left px-4 py-2 text-[#155C3A] font-semibold hover:bg-emerald-50 flex items-center gap-2.5 text-xs cursor-pointer border-t border-stone-100"
                          >
                            <Shield className="w-4 h-4 text-[#155C3A]" />
                            <span>{t('nav.admin')}</span>
                          </button>
                        )}
                      </div>

                      <div className="border-t border-stone-100 pt-1">
                        <button
                          onClick={() => {
                            logout();
                            setUserDropdownOpen(false);
                            handleNav('home');
                          }}
                          className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 flex items-center gap-2.5 text-xs font-semibold cursor-pointer"
                        >
                          <LogOut className="w-4 h-4 text-red-500" />
                          <span>{t('nav.signOut')}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => handleNav('login')}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-stone-200/90 hover:bg-stone-50 text-stone-900 text-xs sm:text-sm font-bold shadow-2xs hover:shadow-xs transition-all active:scale-95 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#155C3A]"
                >
                  <User className="w-4 h-4 text-stone-700" />
                  <span>{t('nav.signIn')}</span>
                </button>
              )}
            </div>

            {/* Mobile menu and Language triggers */}
            <div className="flex lg:hidden items-center gap-2">
              {/* Mobile Language Button & Dropdown */}
              <div className="relative" ref={mobileLangRef}>
                <button
                  onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                  className="px-2.5 py-1.5 rounded-full bg-white border border-stone-200 text-stone-700 text-xs font-semibold flex items-center gap-1 shadow-2xs"
                  aria-label="Language selector"
                >
                  <Globe className="w-3.5 h-3.5 text-stone-600" />
                  <span>{language === 'bn' ? 'বাংলা' : 'English'}</span>
                  <ChevronDown className="w-3 h-3 text-stone-400" />
                </button>

                {langDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-32 bg-white rounded-xl shadow-lg border border-stone-200 py-1 z-50 text-xs">
                    <button
                      onClick={() => changeLanguage('bn')}
                      className={`w-full text-left px-3 py-1.5 flex items-center justify-between ${
                        language === 'bn' ? 'bg-[#FAF8F3] text-[#155C3A] font-bold' : 'text-stone-700'
                      }`}
                    >
                      <span>বাংলা</span>
                      {language === 'bn' && <Check className="w-3.5 h-3.5 text-[#155C3A]" />}
                    </button>
                    <button
                      onClick={() => changeLanguage('en')}
                      className={`w-full text-left px-3 py-1.5 flex items-center justify-between ${
                        language === 'en' ? 'bg-[#FAF8F3] text-[#155C3A] font-bold' : 'text-stone-700'
                      }`}
                    >
                      <span>English</span>
                      {language === 'en' && <Check className="w-3.5 h-3.5 text-[#155C3A]" />}
                    </button>
                  </div>
                )}
              </div>

              {/* Hamburger Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2.5 text-stone-800 hover:text-stone-950 rounded-xl bg-white border border-stone-200 shadow-2xs hover:bg-stone-50 transition-colors"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[#EAE6DF] bg-[#FAF8F3] px-4 pt-3 pb-6 space-y-4 animate-in slide-in-from-top-2 duration-150">
            {/* Navigation Pill Container for Mobile */}
            <div className="bg-[#F1EEE7] p-2 rounded-2xl space-y-1 border border-[#E5E1D8]">
              {navItems.map((item) => {
                const active = item.isActive;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-between cursor-pointer ${
                      active
                        ? 'bg-white text-stone-900 font-bold shadow-2xs'
                        : 'text-stone-700 hover:bg-white/50'
                    }`}
                  >
                    <span>{item.label}</span>
                    {active && <span className="w-2 h-2 rounded-full bg-[#155C3A]" />}
                  </button>
                );
              })}
            </div>

            {/* Mobile User Controls */}
            <div className="pt-2 border-t border-[#EAE6DF]">
              {isLoggedIn ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-stone-200">
                    <div className="flex items-center gap-3">
                      <img
                        src={user?.avatarUrl || 'https://api.dicebear.com/7.x/initials/svg?seed=Foodie'}
                        alt={user?.name || 'User'}
                        className="w-9 h-9 rounded-full object-cover ring-1 ring-stone-300"
                      />
                      <div>
                        <p className="text-sm font-bold text-stone-900">{user?.name}</p>
                        <p className="text-xs text-stone-500">{user?.email}</p>
                      </div>
                    </div>
                    {isAdmin && (
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                        Admin
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleNav('profile')}
                      className="py-2.5 text-xs font-semibold text-stone-800 bg-white rounded-xl border border-stone-200 text-center"
                    >
                      {t('nav.profile')}
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => handleNav('admin')}
                        className="py-2.5 text-xs font-bold text-[#155C3A] bg-emerald-50 rounded-xl border border-emerald-200 text-center"
                      >
                        {t('nav.admin')}
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                      handleNav('home');
                    }}
                    className="w-full py-2.5 text-xs font-bold text-red-600 bg-red-50 border border-red-200 rounded-xl text-center flex items-center justify-center gap-1.5"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{t('nav.signOut')}</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={() => handleNav('login')}
                    className="w-full py-2.5 text-sm font-bold text-stone-900 bg-white border border-stone-200 rounded-xl text-center shadow-2xs flex items-center justify-center gap-2"
                  >
                    <User className="w-4 h-4" />
                    <span>{t('nav.signIn')}</span>
                  </button>
                  <button
                    onClick={() => handleNav('register')}
                    className="w-full py-2.5 text-sm font-bold text-white bg-[#155C3A] hover:bg-[#0e442a] rounded-xl text-center shadow-xs"
                  >
                    {t('nav.joinKhadok')}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Foodie Card Export Modal */}
      {foodieCardModalOpen && (
        <FoodieCardExportModal onClose={() => setFoodieCardModalOpen(false)} />
      )}
    </>
  );
};
