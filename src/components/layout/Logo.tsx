import React, { useState } from 'react';
import { useLanguage } from '../../i18n';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', showTagline = false, className = '' }) => {
  const [imageError, setImageError] = useState(false);
  const { language, t } = useLanguage();

  // Height configurations that keep the header clean and single-row
  const heightClass = size === 'sm' ? 'h-8' : size === 'lg' ? 'h-12' : 'h-10';

  return (
    <div className={`flex items-center gap-3 select-none transition-transform hover:opacity-95 ${className}`}>
      {/* Primary Brand Logo Image with object-fit: contain and preserved aspect ratio */}
      {!imageError ? (
        <img
          src="/foodie-bd-logo.svg"
          alt="Foodie BD"
          onError={() => setImageError(true)}
          className={`${heightClass} w-auto max-w-[210px] object-contain shrink-0`}
        />
      ) : (
        /* Fallback SVG in case image file is missing or blocked */
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-[#155C3A] text-white flex items-center justify-center shadow-xs ring-1 ring-emerald-800/20 relative">
            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current text-white/95" aria-hidden="true">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" fill="#E74C3C" />
              <path d="M11 6.5h2v4h-2zM12 11a1 1 0 001-1V6.5a1 1 0 10-2 0V10a1 1 0 001 1z" fill="#FAF8F3" />
            </svg>
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#E74C3C] ring-2 ring-[#FAF8F3]" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-black text-xl tracking-tight text-[#155C3A]">
              Foodie <span className="text-[#E74C3C]">BD</span>
            </span>
            <span className="text-xs font-bold text-amber-950/80 font-bengali">
              {language === 'bn' ? '(খাদক ম্যাপ)' : '(Food Map)'}
            </span>
          </div>
        </div>
      )}

      {showTagline && (
        <span className="hidden xl:inline text-xs font-medium text-stone-500 pl-2 border-l border-stone-300">
          {t('nav.tagline')}
        </span>
      )}
    </div>
  );
};
