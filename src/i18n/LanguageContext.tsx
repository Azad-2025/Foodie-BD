import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { bn } from './locales/bn';
import { en } from './locales/en';

export type Language = 'bn' | 'en';

type NestedTranslations = typeof bn;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (path: string, params?: Record<string, string | number>) => string;
  localizedName: (item?: { nameEn?: string; nameBn?: string; name?: string } | null) => string;
  localizedDish: (item?: { prominentDishEn?: string; prominentDishBn?: string } | null) => string;
  localizedDesc: (item?: { descriptionEn?: string; descriptionBn?: string; description?: string } | null) => string;
  localizedTitle: (item?: { titleEn?: string; titleBn?: string; title?: string } | null) => string;
}

const STORAGE_KEY = 'foodie_bd_lang';

const translations: Record<Language, NestedTranslations> = {
  bn,
  en,
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Helper to resolve dot notation e.g. "nav.home" or "home.heroTitle"
function getNestedValue(obj: any, path: string): string | undefined {
  const keys = path.split('.');
  let current = obj;
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return undefined;
    }
  }
  return typeof current === 'string' ? current : undefined;
}

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'en' || saved === 'bn') {
        return saved;
      }
    } catch {
      // ignore storage errors
    }
    return 'bn'; // Bengali is default
  });

  const setLanguage = (newLang: Language) => {
    setLanguageState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
    } catch {
      // ignore storage errors
    }
    // Update HTML lang attribute for accessibility
    if (typeof document !== 'undefined') {
      document.documentElement.lang = newLang;
    }
  };

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
    }
  }, [language]);

  const t = (path: string, params?: Record<string, string | number>): string => {
    const currentDict = translations[language];
    let val = getNestedValue(currentDict, path);

    // Fallback to Bengali or English if missing
    if (!val) {
      val = getNestedValue(translations.bn, path) || getNestedValue(translations.en, path) || path;
    }

    if (params) {
      return Object.entries(params).reduce((acc, [k, v]) => {
        return acc.replace(new RegExp(`{${k}}`, 'g'), String(v));
      }, val);
    }

    return val;
  };

  const localizedName = (item?: { nameEn?: string; nameBn?: string; name?: string } | null): string => {
    if (!item) return '';
    if (language === 'en') {
      return item.nameEn || item.name || item.nameBn || '';
    }
    return item.nameBn || item.name || item.nameEn || '';
  };

  const localizedDish = (item?: { prominentDishEn?: string; prominentDishBn?: string } | null): string => {
    if (!item) return '';
    if (language === 'en') {
      return item.prominentDishEn || item.prominentDishBn || '';
    }
    return item.prominentDishBn || item.prominentDishEn || '';
  };

  const localizedDesc = (item?: { descriptionEn?: string; descriptionBn?: string; description?: string } | null): string => {
    if (!item) return '';
    if (language === 'en') {
      return item.descriptionEn || item.description || item.descriptionBn || '';
    }
    return item.descriptionBn || item.description || item.descriptionEn || '';
  };

  const localizedTitle = (item?: { titleEn?: string; titleBn?: string; title?: string } | null): string => {
    if (!item) return '';
    if (language === 'en') {
      return item.titleEn || item.title || item.titleBn || '';
    }
    return item.titleBn || item.title || item.titleEn || '';
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        localizedName,
        localizedDish,
        localizedDesc,
        localizedTitle,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
