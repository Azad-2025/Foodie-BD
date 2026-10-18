import React, { useState, useMemo } from 'react';
import { District, Division, Food } from '../types';
import { useLanguage } from '../i18n';
import { MapPin, Compass, Search, Utensils, ArrowRight } from 'lucide-react';

interface DistrictListPageProps {
  districts: District[];
  divisions: Division[];
  foods: Food[];
  navigate: (route: string, param?: string) => void;
}

export const DistrictListPage: React.FC<DistrictListPageProps> = ({
  districts,
  divisions,
  foods,
  navigate,
}) => {
  const { language, t, localizedName, localizedDish } = useLanguage();
  const [selectedDivisionId, setSelectedDivisionId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Map foods count per district
  const foodCountByDistrict = useMemo(() => {
    const map = new Map<string, number>();
    for (const food of foods) {
      map.set(food.districtId, (map.get(food.districtId) || 0) + 1);
    }
    return map;
  }, [foods]);

  // Division map for quick lookup
  const divisionMap = useMemo(() => {
    const map = new Map<string, Division>();
    for (const div of divisions) {
      map.set(div.id, div);
    }
    return map;
  }, [divisions]);

  // Filter districts
  const filteredDistricts = useMemo(() => {
    return districts.filter((district) => {
      if (selectedDivisionId !== 'all' && district.divisionId !== selectedDivisionId) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchBn = district.nameBn.toLowerCase().includes(q);
        const matchEn = district.nameEn.toLowerCase().includes(q);
        const matchDishBn = district.prominentDishBn.toLowerCase().includes(q);
        const matchDishEn = district.prominentDishEn.toLowerCase().includes(q);
        return matchBn || matchEn || matchDishBn || matchDishEn;
      }
      return true;
    });
  }, [districts, selectedDivisionId, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-amber-900/10 p-6 sm:p-8 shadow-2xs">
        <div className="max-w-3xl space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#155C3A]">
            <Utensils className="w-4 h-4" />
            <span className="font-bengali">
              {language === 'bn' ? 'বাংলাদেশের ৬৪ জেলার রন্ধন সম্ভার' : 'Culinary Directory of 64 Districts'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-bengali tracking-tight">
            {t('nav.districtFoods')} — {language === 'bn' ? 'সকল জেলার ঐতিহ্যবাহী খাবার' : 'Culinary Heritage by District'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-bengali">
            {language === 'bn'
              ? 'বাংলাদেশের ৮টি বিভাগ এবং ৬৪টি জেলার প্রতিটি অঞ্চলের শতাব্দীপ্রাচীন বিখ্যাত খাবার, সুস্বাদু মিষ্টান্ন ও ঐতিহ্যবাহী রন্ধনশিল্পের তালিকা অন্বেষণ করুন।'
              : 'Explore the century-old iconic culinary heritage, authentic sweets, and legendary regional dishes across all 64 districts of Bangladesh.'}
          </p>
        </div>

        {/* Search Bar */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                language === 'bn'
                  ? 'জেলা বা খাবারের নাম দিয়ে খুঁজুন (যেমন: বগুড়া, দই, মেজবানি)...'
                  : 'Search by district or food name (e.g. Bogura, Doi, Mezbani)...'
              }
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#155C3A] focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Division Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
        <button
          onClick={() => setSelectedDivisionId('all')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors cursor-pointer ${
            selectedDivisionId === 'all'
              ? 'bg-[#155C3A] text-white shadow-2xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-amber-900/10'
          }`}
        >
          {t('map.allDivisions')}
        </button>

        {divisions.map((div) => {
          const isActive = selectedDivisionId === div.id;
          return (
            <button
              key={div.id}
              onClick={() => setSelectedDivisionId(div.id)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors cursor-pointer ${
                isActive
                  ? 'bg-[#155C3A] text-white shadow-2xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-amber-900/10'
              }`}
            >
              <span>{localizedName(div)}</span>
            </button>
          );
        })}
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
        <span>
          {language === 'bn'
            ? `${filteredDistricts.length}টি জেলা প্রদর্শিত হচ্ছে`
            : `Showing ${filteredDistricts.length} of 64 districts`}
        </span>
      </div>

      {/* Districts Grid */}
      {filteredDistricts.length === 0 ? (
        <div className="bg-white rounded-3xl border border-amber-900/10 p-12 text-center space-y-3">
          <Utensils className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-sm font-bold text-slate-800 font-bengali">
            {language === 'bn' ? 'কোনো জেলা পাওয়া যায়নি' : 'No Districts Found'}
          </p>
          <p className="text-xs text-slate-500">
            {language === 'bn'
              ? 'অনুসন্ধান শব্দটি পরিবর্তন করে আবার চেষ্টা করুন।'
              : 'Try a different search keyword or clear filters.'}
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedDivisionId('all');
            }}
            className="px-4 py-2 bg-[#155C3A] text-white text-xs font-bold rounded-xl cursor-pointer"
          >
            {t('discover.clearFilters')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredDistricts.map((district) => {
            const div = divisionMap.get(district.divisionId);
            const foodCount = foodCountByDistrict.get(district.id) || 0;

            return (
              <div
                key={district.id}
                className="bg-white rounded-2xl border border-amber-900/10 p-4 shadow-2xs hover:shadow-md hover:border-[#155C3A]/30 transition-all flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  {/* Top Badge: Division */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                      {div ? localizedName(div) : ''}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                      <Utensils className="w-3 h-3 text-[#E74C3C]" />
                      <span>{foodCount > 0 ? `${foodCount} ${language === 'bn' ? 'খাবার' : 'foods'}` : ''}</span>
                    </span>
                  </div>

                  {/* District Name */}
                  <div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-[#155C3A] transition-colors font-bengali flex items-baseline gap-1.5">
                      <span>{localizedName(district)}</span>
                      <span className="text-xs text-slate-400 font-normal">
                        ({language === 'bn' ? district.nameEn : district.nameBn})
                      </span>
                    </h3>
                  </div>

                  {/* Prominent Dish Highlight */}
                  <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/60">
                    <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wide block">
                      {language === 'bn' ? 'বিখ্যাত ঐতিহ্য:' : 'Iconic Dish:'}
                    </span>
                    <span className="text-xs font-bold text-[#155C3A] font-bengali block mt-0.5">
                      {localizedDish(district)}
                    </span>
                    <span className="text-[11px] text-slate-600 block line-clamp-1 mt-0.5">
                      {language === 'bn' ? district.prominentDishEn : district.prominentDishBn}
                    </span>
                  </div>

                  {/* Short Description */}
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {district.description}
                  </p>
                </div>

                {/* Actions */}
                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => navigate('map', district.id)}
                    className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    title={language === 'bn' ? 'মানচিত্রে অবস্থান দেখুন' : 'View on Map'}
                  >
                    <Compass className="w-3.5 h-3.5 text-slate-600" />
                    <span>{language === 'bn' ? 'ম্যাপ' : 'Map'}</span>
                  </button>

                  <button
                    onClick={() => navigate('district', district.id)}
                    className="flex-1 py-1.5 px-2 bg-[#155C3A] hover:bg-[#0e442a] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>{language === 'bn' ? 'খাবার দেখুন' : 'Foods'}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
