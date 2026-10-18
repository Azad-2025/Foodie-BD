import React, { useState, useEffect } from 'react';
import { District, Division, Food } from '../types';
import { api } from '../lib/api';
import { FoodCard } from '../components/common/FoodCard';
import { FoodSubmissionModal } from '../components/food/FoodSubmissionModal';
import { useLanguage } from '../i18n';
import { MapPin, ArrowLeft, Compass, Info, PlusCircle } from 'lucide-react';

interface DistrictDetailsPageProps {
  districtId: string;
  allDistricts: District[];
  navigate: (route: string, param?: string) => void;
  allDivisions?: Division[];
}

export const DistrictDetailsPage: React.FC<DistrictDetailsPageProps> = ({
  districtId,
  allDistricts,
  navigate,
  allDivisions: propsDivisions,
}) => {
  const { language, t, localizedName, localizedDish } = useLanguage();
  const [district, setDistrict] = useState<District | null>(null);
  const [division, setDivision] = useState<Division | null>(null);
  const [allDivisions, setAllDivisions] = useState<Division[]>(propsDivisions || []);
  const [foods, setFoods] = useState<Food[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    api.getDistrictById(districtId)
      .then((res) => {
        setDistrict(res.district);
        setDivision(res.division);
        setFoods(res.foods || []);
      })
      .catch((err) => {
        console.error('Failed to load district details:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [districtId]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-8 h-8 border-3 border-[#155C3A] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500 font-bengali">{t('map.loadingMap')}</p>
      </div>
    );
  }

  if (!district) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <p className="text-base font-bold text-slate-800 font-bengali">
          {language === 'bn' ? 'জেলা পাওয়া যায়নি' : 'District Not Found'}
        </p>
        <button
          onClick={() => navigate('map')}
          className="px-4 py-2 bg-[#155C3A] text-white text-xs font-semibold rounded-xl cursor-pointer"
        >
          {t('districtDetails.backToMap')}
        </button>
      </div>
    );
  }

  const siblingDistricts = allDistricts.filter(
    (d) => d.divisionId === district.divisionId && d.id !== district.id
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back button */}
      <button
        onClick={() => navigate('map')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#155C3A] transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{t('districtDetails.backToMap')}</span>
      </button>

      {/* District Header Hero */}
      <div className="bg-white rounded-3xl border border-amber-900/10 p-6 sm:p-8 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <span>{division ? localizedName(division) : ''}</span>
              <span aria-hidden="true">·</span>
              <span className="font-bengali">{t('districtDetails.division')}</span>
              <span aria-hidden="true">·</span>
              <span>GPS: {district.lat.toFixed(2)}° N, {district.lng.toFixed(2)}° E</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-1 font-bengali">
              {localizedName(district)} {language === 'bn' ? 'জেলা' : 'District'}
              <span className="text-stone-400 font-normal text-xl ml-2 font-sans">
                ({language === 'bn' ? district.nameEn : district.nameBn})
              </span>
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setIsSubmissionModalOpen(true)}
              className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-[#155C3A] border border-emerald-300 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer font-bengali"
            >
              <PlusCircle className="w-4 h-4 text-[#155C3A]" />
              <span>{language === 'bn' ? 'খাবার যোগ করার অনুরোধ' : 'Suggest a Food'}</span>
            </button>

            <button
              onClick={() => navigate('map', district.id)}
              className="px-4 py-2.5 bg-[#155C3A] hover:bg-[#0e442a] text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-colors shrink-0 shadow-2xs cursor-pointer font-bengali"
            >
              <Compass className="w-4 h-4" />
              <span>{language === 'bn' ? 'ম্যাপে দেখুন' : 'Open on Map'}</span>
            </button>
          </div>
        </div>

        {/* Prominent dish banner */}
        <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold text-amber-900 uppercase tracking-wider font-bengali">
              {t('districtDetails.prominentDelicacy')}
            </p>
            <p className="text-base font-bold text-[#155C3A] font-bengali mt-0.5">
              {localizedDish(district)}
            </p>
            <p className="text-xs text-slate-600">
              {language === 'bn' ? district.prominentDishEn : district.prominentDishBn}
            </p>
          </div>
          <div className="text-xs text-slate-600 max-w-md leading-relaxed">
            {district.description}
          </div>
        </div>
      </div>

      {/* District Foods Catalog */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 font-bengali">
              {t('districtDetails.famousFoods')} ({foods.length})
            </h2>
            <p className="text-xs text-slate-500 font-bengali">
              {language === 'bn'
                ? `${localizedName(district)} জেলার যাচাইকৃত খাঁটি ঐতিহ্যবাহী খাবারের তালিকা`
                : `Verified authentic local culinary heritage dishes from ${district.nameEn}`}
            </p>
          </div>
        </div>

        {foods.length === 0 ? (
          <div className="bg-white rounded-2xl border border-amber-900/10 p-10 text-center space-y-2">
            <Info className="w-6 h-6 text-slate-400 mx-auto" />
            <p className="text-xs text-slate-500 font-bengali">
              {t('districtDetails.noFoodsYet')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {foods.map((food) => (
              <FoodCard
                key={food.id}
                food={food}
                district={district}
                division={division || undefined}
                onSelect={(foodId) => navigate('food', foodId)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Other Districts in Same Division */}
      {siblingDistricts.length > 0 && (
        <div className="bg-white rounded-2xl border border-amber-900/10 p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-800 font-bengali">
            {language === 'bn'
              ? `${division ? localizedName(division) : ''} বিভাগের অন্যান্য জেলা (${siblingDistricts.length})`
              : `More Districts in ${division?.nameEn} Division (${siblingDistricts.length})`}
          </h3>
          <div className="flex flex-wrap gap-2">
            {siblingDistricts.map((sib) => (
              <button
                key={sib.id}
                onClick={() => navigate('district', sib.id)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 hover:border-[#155C3A] hover:text-[#155C3A] bg-slate-50 hover:bg-emerald-50/50 transition-colors cursor-pointer"
              >
                <span>{localizedName(sib)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Suggest Food Modal for this District */}
      <FoodSubmissionModal
        isOpen={isSubmissionModalOpen}
        onClose={() => setIsSubmissionModalOpen(false)}
        initialDistrictId={district.id}
        districts={allDistricts}
        divisions={allDivisions}
        navigate={navigate}
      />
    </div>
  );
};
