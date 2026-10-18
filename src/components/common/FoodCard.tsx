import React, { useState } from 'react';
import { Food, District, Division } from '../../types';
import { useJourney } from '../../context/JourneyContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n';
import { MapPin, Check, Bookmark } from 'lucide-react';
import { FoodImage } from './FoodImage';

interface FoodCardProps {
  food: Food;
  district?: District;
  division?: Division;
  onSelect: (foodId: string) => void;
  onDistrictClick?: (districtId: string) => void;
}

export const FoodCard: React.FC<FoodCardProps> = ({
  food,
  district,
  division,
  onSelect,
  onDistrictClick,
}) => {
  const { isFoodTried, isFoodWanted, trackFood, removeFromJourney } = useJourney();
  const { isLoggedIn, isAdmin } = useAuth();
  const { language, t, localizedName } = useLanguage();
  const [isUpdating, setIsUpdating] = useState(false);
  const [authHint, setAuthHint] = useState<string | null>(null);

  const tried = isFoodTried(food.id);
  const wanted = isFoodWanted(food.id);

  const handleToggleTried = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLoggedIn) {
      setAuthHint(language === 'bn' ? 'স্বাদ লগ করতে সাইন ইন করুন!' : 'Sign in to log tasted foods!');
      setTimeout(() => setAuthHint(null), 3000);
      return;
    }

    try {
      setIsUpdating(true);
      if (tried) {
        await removeFromJourney(food.id);
      } else {
        await trackFood(food.id, 'tried', { triedAt: new Date().toISOString() });
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleWanted = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLoggedIn) {
      setAuthHint(language === 'bn' ? 'স্বাদ তালিকায় যোগ করতে সাইন ইন করুন!' : 'Sign in to add to your wishlist!');
      setTimeout(() => setAuthHint(null), 3000);
      return;
    }

    try {
      setIsUpdating(true);
      if (wanted) {
        await removeFromJourney(food.id);
      } else {
        await trackFood(food.id, 'want_to_try');
      }
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div
      onClick={() => onSelect(food.id)}
      className="group bg-white rounded-xl border border-amber-900/10 hover:border-[#155C3A]/40 overflow-hidden shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col h-full"
    >
      {/* Image container */}
      <div className="relative aspect-16/10 w-full overflow-hidden bg-slate-100">
        <FoodImage
          src={food.imageUrl}
          alt={localizedName(food)}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          containerClassName="w-full h-full relative overflow-hidden bg-slate-100"
          isAdmin={isAdmin}
          loading="lazy"
        />

        {/* Floating Quick Action Overlay */}
        <div className="absolute top-2 right-2 flex items-center gap-1.5 z-10">
          <button
            onClick={handleToggleWanted}
            disabled={isUpdating}
            title={wanted ? t('foodCard.wantToTry') : t('foodCard.markWant')}
            className={`p-1.5 rounded-lg backdrop-blur-md transition-colors cursor-pointer ${
              wanted
                ? 'bg-[#F39C3D] text-white shadow-xs'
                : 'bg-black/40 text-white hover:bg-black/60'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${wanted ? 'fill-current' : ''}`} />
          </button>

          <button
            onClick={handleToggleTried}
            disabled={isUpdating}
            title={tried ? t('foodCard.tried') : t('foodCard.markTried')}
            className={`px-2 py-1 rounded-lg backdrop-blur-md text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
              tried
                ? 'bg-[#155C3A] text-white shadow-xs'
                : 'bg-black/40 text-white hover:bg-[#155C3A]'
            }`}
          >
            <Check className="w-3.5 h-3.5" />
            <span className="text-[11px]">{tried ? t('foodCard.tried') : t('foodCard.markTried')}</span>
          </button>
        </div>

        {/* Dietary & GI markers */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1.5 z-10">
          {food.researchStatus === 'gi_certified' && (
            <div className="px-2 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase bg-amber-500/90 backdrop-blur-sm text-white shadow-2xs">
              GI
            </div>
          )}
          {food.dietaryType && (
            <div className="px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase bg-black/60 backdrop-blur-sm text-white">
              {food.dietaryType}
            </div>
          )}
        </div>

        {/* Auth prompt overlay banner */}
        {authHint && (
          <div className="absolute inset-x-2 top-2 z-20 bg-slate-900/90 text-white text-[11px] font-semibold py-1.5 px-2.5 rounded-lg text-center backdrop-blur-xs shadow-md">
            {authHint}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Metadata line */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <span
              onClick={(e) => {
                if (onDistrictClick && food.districtId) {
                  e.stopPropagation();
                  onDistrictClick(food.districtId);
                }
              }}
              className="text-[#155C3A] hover:underline flex items-center gap-0.5 cursor-pointer font-semibold"
            >
              <MapPin className="w-3 h-3 text-[#155C3A]" />
              {district ? localizedName(district) : food.districtId}
            </span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span>{division ? localizedName(division) : food.divisionId}</span>
            {food.approximatePriceBdt ? (
              <>
                <span aria-hidden="true" className="text-slate-300">·</span>
                <span className="text-slate-600 font-semibold">৳{food.approximatePriceBdt}</span>
              </>
            ) : null}
          </div>

          {/* Title */}
          <h3 className="mt-1 font-bold text-base text-slate-900 leading-snug group-hover:text-[#155C3A] transition-colors font-bengali">
            {language === 'en' ? food.nameEn : food.nameBn}
          </h3>

          {/* Subtitle */}
          <p className="text-xs font-medium text-slate-600">
            {language === 'en' ? food.nameBn : food.nameEn}
          </p>

          {/* Short Description */}
          <p className="mt-2 text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {food.shortDescription}
          </p>
        </div>

        {/* Footer info */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span className="capitalize">{food.category.replace('_', ' ')}</span>
          <span className="text-[#155C3A] font-semibold group-hover:underline">
            {t('foodCard.details')} →
          </span>
        </div>
      </div>
    </div>
  );
};
