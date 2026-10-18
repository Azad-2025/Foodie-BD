import React from 'react';
import { District, Division, Food } from '../../types';
import { useJourney } from '../../context/JourneyContext';
import { useLanguage } from '../../i18n';
import { MapPin, CheckCircle2, Bookmark, ArrowRight, X } from 'lucide-react';
import { FoodImage } from '../common/FoodImage';

interface DistrictPanelProps {
  district: District | null;
  division?: Division;
  foods: Food[];
  onClose: () => void;
  onSelectFood: (foodId: string) => void;
  onViewDistrictDetails: (districtId: string) => void;
}

export const DistrictPanel: React.FC<DistrictPanelProps> = ({
  district,
  division,
  foods,
  onClose,
  onSelectFood,
  onViewDistrictDetails,
}) => {
  const { isFoodTried, isFoodWanted } = useJourney();
  const { language, t, localizedName, localizedDish } = useLanguage();

  if (!district) {
    return (
      <div className="h-full bg-white rounded-2xl border border-amber-900/10 p-6 flex flex-col items-center justify-center text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-emerald-50 text-[#155C3A] flex items-center justify-center">
          <MapPin className="w-6 h-6" />
        </div>
        <h4 className="font-bold text-slate-800 text-sm">
          {language === 'bn' ? 'মানচিত্রে একটি জেলা নির্বাচন করুন' : 'Select a District on the Map'}
        </h4>
        <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
          {language === 'bn'
            ? 'ম্যাপের যেকোনো জেলায় ক্লিক করুন অথবা উপরের সার্চ বক্সে জেলার নাম লিখে বিখ্যাত খাবার আবিষ্কার করুন।'
            : 'Click any district on the map or type its name in the search bar to explore regional food heritage.'}
        </p>
      </div>
    );
  }

  const districtFoods = foods.filter((f) => f.districtId === district.id && f.isPublished);
  const triedCount = districtFoods.filter((f) => isFoodTried(f.id)).length;
  const wantCount = districtFoods.filter((f) => isFoodWanted(f.id)).length;

  return (
    <div className="h-full bg-white rounded-2xl border border-amber-900/10 p-4 sm:p-5 flex flex-col justify-between shadow-2xs overflow-y-auto">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <span>{division ? localizedName(division) : district.divisionId}</span>
              <span aria-hidden="true">·</span>
              <span className="font-bengali">{t('foodCard.division')}</span>
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 mt-0.5">
              {localizedName(district)}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
            aria-label="Close panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* District Brief */}
        <div className="space-y-2">
          <div className="bg-amber-50/70 border border-amber-200/60 rounded-xl p-3">
            <p className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">
              {t('map.prominentDish')}
            </p>
            <p className="text-sm font-bold text-[#155C3A] mt-0.5 font-bengali">
              {localizedDish(district)}
            </p>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            {district.description}
          </p>
        </div>

        {/* User Progress for this district */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-100 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#155C3A]" />
            <div>
              <p className="text-[11px] text-emerald-800 font-semibold">{triedCount} {t('foodCard.tried')}</p>
              <p className="text-[10px] text-emerald-600">{language === 'bn' ? 'চেখে দেখেছেন' : 'Tasted'}</p>
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-100 flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-[#F39C3D]" />
            <div>
              <p className="text-[11px] text-amber-800 font-semibold">{wantCount} {t('foodCard.wantToTry')}</p>
              <p className="text-[10px] text-amber-600">{language === 'bn' ? 'চেখে দেখতে চান' : 'Saved to try'}</p>
            </div>
          </div>
        </div>

        {/* Regional Dishes list */}
        <div className="space-y-2 pt-1">
          <p className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
            <span>{t('map.districtFoods')}</span>
            <span className="text-[11px] font-semibold text-slate-400">({districtFoods.length})</span>
          </p>

          {districtFoods.length > 0 ? (
            <div className="space-y-2">
              {districtFoods.map((f) => {
                const isTried = isFoodTried(f.id);
                const isWanted = isFoodWanted(f.id);

                return (
                  <div
                    key={f.id}
                    onClick={() => onSelectFood(f.id)}
                    className="p-2.5 rounded-xl border border-slate-200/80 hover:border-[#155C3A]/50 bg-slate-50/50 hover:bg-white transition-all cursor-pointer flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-lg overflow-hidden ring-1 ring-slate-200 shrink-0">
                        <FoodImage
                          src={f.imageUrl}
                          alt={localizedName(f)}
                          className="w-full h-full object-cover"
                          containerClassName="w-full h-full relative overflow-hidden bg-slate-100"
                          loading="lazy"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 group-hover:text-[#155C3A] truncate font-bengali">
                          {localizedName(f)}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate">
                          {f.shortDescription}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {isTried && (
                        <span className="w-2 h-2 rounded-full bg-[#155C3A]" title="Tried" />
                      )}
                      {isWanted && (
                        <span className="w-2 h-2 rounded-full bg-[#F39C3D]" title="Wishlist" />
                      )}
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#155C3A] group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic py-3 text-center">
              {t('map.noFoodsFound')}
            </p>
          )}
        </div>
      </div>

      {/* Footer CTA */}
      <div className="pt-3 border-t border-slate-100">
        <button
          onClick={() => onViewDistrictDetails(district.id)}
          className="w-full py-2.5 px-3 rounded-xl bg-[#155C3A] hover:bg-[#0e442a] text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
        >
          <span>{t('map.exploreDistrict')}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
