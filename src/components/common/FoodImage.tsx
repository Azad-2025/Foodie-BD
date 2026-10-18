import React, { useState, useEffect } from 'react';
import { UtensilsCrossed, AlertCircle, ImageOff } from 'lucide-react';
import { useLanguage } from '../../i18n';

interface FoodImageProps {
  src?: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  isAdmin?: boolean;
  showAdminWarning?: boolean;
  loading?: 'lazy' | 'eager';
  imageCaption?: string;
  imageAttribution?: string;
  imageVerified?: boolean;
}

export const FoodImage: React.FC<FoodImageProps> = ({
  src,
  alt,
  className = 'w-full h-full object-cover',
  containerClassName = 'w-full h-full relative overflow-hidden bg-stone-100',
  isAdmin = false,
  showAdminWarning = false,
  loading = 'lazy',
  imageCaption,
  imageAttribution,
  imageVerified,
}) => {
  const { language } = useLanguage();
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Reset state if src changes
  useEffect(() => {
    setHasError(false);
    setIsLoaded(false);
  }, [src]);

  const cleanSrc = typeof src === 'string' ? src.trim() : '';

  if (!cleanSrc || hasError) {
    return (
      <div
        className={`${containerClassName} flex flex-col items-center justify-center p-3 text-center bg-gradient-to-b from-stone-100 to-stone-200/90 text-stone-400 select-none`}
        title={hasError && cleanSrc ? `Failed to load: ${cleanSrc}` : alt}
      >
        <div className="w-10 h-10 rounded-2xl bg-white/80 shadow-2xs border border-stone-200/60 flex items-center justify-center text-stone-500 mb-1.5">
          {hasError ? <ImageOff className="w-5 h-5 text-amber-600/80" /> : <UtensilsCrossed className="w-5 h-5 text-[#155C3A]/70" />}
        </div>
        <p className="text-[11px] font-bold text-stone-600 line-clamp-1 max-w-[90%] font-bengali">
          {alt}
        </p>
        <p className="text-[10px] text-stone-500 font-medium tracking-tight">
          FOODIE BD
        </p>

        {/* Admin warning badge if URL failed to load */}
        {(isAdmin || showAdminWarning) && hasError && cleanSrc && (
          <div className="mt-1 px-2 py-0.5 rounded-md bg-amber-100/95 border border-amber-300 text-amber-800 text-[10px] font-semibold flex items-center gap-1 shadow-2xs font-bengali">
            <AlertCircle className="w-3 h-3 text-amber-700 shrink-0" />
            <span>
              {language === 'bn' ? 'ছবি লোড ব্যর্থ (ইউআরএল যাচাই করুন)' : 'Image URL failed to load'}
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={containerClassName}>
      <img
        src={cleanSrc}
        alt={alt}
        loading={loading}
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-80'} transition-opacity duration-200`}
      />
    </div>
  );
};
