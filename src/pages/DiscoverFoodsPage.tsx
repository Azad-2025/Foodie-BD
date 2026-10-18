import React, { useState, useMemo, useEffect } from 'react';
import { Food, District, Division, FoodCategory } from '../types';
import { FOOD_CATEGORIES } from '../data/divisionsAndDistricts';
import { FoodCard } from '../components/common/FoodCard';
import { FoodImage } from '../components/common/FoodImage';
import { FoodSubmissionModal } from '../components/food/FoodSubmissionModal';
import { useLanguage } from '../i18n';
import { Search, Filter, RotateCcw, UtensilsCrossed, LayoutGrid, List, X, MapPin, PlusCircle } from 'lucide-react';

interface DiscoverFoodsPageProps {
  foods: Food[];
  districts: District[];
  divisions: Division[];
  initialSearch?: string;
  navigate: (route: string, param?: string) => void;
}

export const DiscoverFoodsPage: React.FC<DiscoverFoodsPageProps> = ({
  foods,
  districts,
  divisions,
  initialSearch = '',
  navigate,
}) => {
  const { language, t, localizedName } = useLanguage();
  const [search, setSearch] = useState(initialSearch);
  const [selectedDivision, setSelectedDivision] = useState('all');
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDietary, setSelectedDietary] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'price_asc' | 'price_desc'>('name');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false);

  useEffect(() => {
    if (initialSearch) {
      setSearch(initialSearch);
    }
  }, [initialSearch]);

  // District options filtered by selected division
  const availableDistricts = useMemo(() => {
    if (selectedDivision === 'all') return districts;
    return districts.filter((d) => d.divisionId === selectedDivision);
  }, [selectedDivision, districts]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    foods.forEach((f) => {
      if (f.isPublished) {
        counts[f.category] = (counts[f.category] || 0) + 1;
      }
    });
    return counts;
  }, [foods]);

  // Reset district if division changes and current district doesn't belong to it
  const handleDivisionChange = (divId: string) => {
    setSelectedDivision(divId);
    if (divId !== 'all') {
      const currentDist = districts.find((d) => d.id === selectedDistrict);
      if (currentDist && currentDist.divisionId !== divId) {
        setSelectedDistrict('all');
      }
    }
  };

  const filteredFoods = useMemo(() => {
    let result = foods.filter((f) => f.isPublished);

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (f) =>
          f.nameEn.toLowerCase().includes(q) ||
          f.nameBn.includes(q) ||
          f.shortDescription.toLowerCase().includes(q) ||
          f.detailedDescription.toLowerCase().includes(q) ||
          (f.originHistory && f.originHistory.toLowerCase().includes(q))
      );
    }

    if (selectedDivision !== 'all') {
      result = result.filter((f) => f.divisionId === selectedDivision);
    }

    if (selectedDistrict !== 'all') {
      result = result.filter((f) => f.districtId === selectedDistrict);
    }

    if (selectedCategory !== 'all') {
      result = result.filter((f) => f.category === selectedCategory);
    }

    if (selectedDietary !== 'all') {
      result = result.filter((f) => f.dietaryType === selectedDietary);
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'price_asc') {
        return (a.approximatePriceBdt || 0) - (b.approximatePriceBdt || 0);
      }
      if (sortBy === 'price_desc') {
        return (b.approximatePriceBdt || 0) - (a.approximatePriceBdt || 0);
      }
      if (language === 'bn') {
        return a.nameBn.localeCompare(b.nameBn, 'bn');
      }
      return a.nameEn.localeCompare(b.nameEn);
    });

    return result;
  }, [foods, search, selectedDivision, selectedDistrict, selectedCategory, selectedDietary, sortBy, language]);

  const handleResetFilters = () => {
    setSearch('');
    setSelectedDivision('all');
    setSelectedDistrict('all');
    setSelectedCategory('all');
    setSelectedDietary('all');
    setSortBy('name');
  };

  const activeFiltersCount =
    (selectedDivision !== 'all' ? 1 : 0) +
    (selectedDistrict !== 'all' ? 1 : 0) +
    (selectedCategory !== 'all' ? 1 : 0) +
    (selectedDietary !== 'all' ? 1 : 0) +
    (search.trim() ? 1 : 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <span>{language === 'bn' ? 'ক্যাটালগ' : 'Catalog'}</span>
            <span aria-hidden="true">·</span>
            <span>{t('discover.title')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-bengali">
            {t('discover.title')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
            {t('discover.subtitle')}
          </p>
        </div>

        {/* Action Controls & View Mode */}
        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setIsSubmissionModalOpen(true)}
            className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-[#155C3A] border border-emerald-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer font-bengali shadow-2xs"
          >
            <PlusCircle className="w-4 h-4 text-[#155C3A]" />
            <span>{language === 'bn' ? 'খাবার যোগ করার অনুরোধ' : 'Suggest a Food'}</span>
          </button>

          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-amber-900/10 shadow-2xs">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-[#155C3A] text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Grid View"
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="hidden sm:inline">{language === 'bn' ? 'গ্রিড' : 'Grid'}</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              viewMode === 'list'
                ? 'bg-[#155C3A] text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            title="List View"
          >
            <List className="w-4 h-4" />
            <span className="hidden sm:inline">{language === 'bn' ? 'তালিকা' : 'List'}</span>
          </button>
        </div>
      </div>
    </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-amber-900/10 p-5 shadow-2xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Query */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t('discover.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#155C3A] text-slate-800"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Division Selector */}
          <div>
            <select
              value={selectedDivision}
              onChange={(e) => handleDivisionChange(e.target.value)}
              aria-label="Filter by division"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#155C3A]"
            >
              <option value="all">{t('discover.allDivisions')}</option>
              {divisions.map((d) => (
                <option key={d.id} value={d.id}>
                  {localizedName(d)}
                </option>
              ))}
            </select>
          </div>

          {/* District Selector */}
          <div>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              aria-label="Filter by district"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#155C3A]"
            >
              <option value="all">{t('discover.allDistricts')}</option>
              {availableDistricts.map((d) => (
                <option key={d.id} value={d.id}>
                  {localizedName(d)}
                </option>
              ))}
            </select>
          </div>

          {/* Category Selector */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              aria-label="Filter by category"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#155C3A]"
            >
              <option value="all">{t('discover.allCategories')}</option>
              {FOOD_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {language === 'bn' ? c.nameBn : c.nameEn} · {categoryCounts[c.id] || 0}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Secondary controls: Segmented Category Buttons + Dietary & Sort */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          {/* Category fast filters */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-[#155C3A] text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {language === 'bn' ? 'সব' : 'All'} ({foods.filter((f) => f.isPublished).length})
            </button>
            {FOOD_CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  selectedCategory === c.id
                    ? 'bg-[#155C3A] text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{language === 'bn' ? c.nameBn : c.nameEn}</span>
                <span className="text-[10px] opacity-75 ml-1">({categoryCounts[c.id] || 0})</span>
              </button>
            ))}
          </div>

          {/* Dietary & Sorting */}
          <div className="flex items-center gap-2">
            <select
              value={selectedDietary}
              onChange={(e) => setSelectedDietary(e.target.value)}
              aria-label="Filter by dietary type"
              className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
            >
              <option value="all">{language === 'bn' ? 'সকল ধরন' : 'Any Dietary'}</option>
              <option value="non-veg">{language === 'bn' ? 'আমিষ' : 'Non-Veg'}</option>
              <option value="veg">{language === 'bn' ? 'নিরামিষ' : 'Vegetarian'}</option>
              <option value="sweet">{language === 'bn' ? 'মিষ্টি / মিষ্টান্ন' : 'Sweet / Mishti'}</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              aria-label="Sort dishes"
              className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
            >
              <option value="name">{t('discover.sortName')}</option>
              <option value="price_asc">{language === 'bn' ? 'মূল্য: কম থেকে বেশি' : 'Price: Low to High'}</option>
              <option value="price_desc">{language === 'bn' ? 'মূল্য: বেশি থেকে কম' : 'Price: High to Low'}</option>
            </select>

            {activeFiltersCount > 0 && (
              <button
                onClick={handleResetFilters}
                title={t('discover.clearFilters')}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Active Filter Indicators */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 text-[11px] font-medium font-bengali">
            {language === 'bn' ? 'সক্রিয় ফিল্টারসমূহ:' : 'Active filters:'}
          </span>
          {search.trim() && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-100 text-amber-900 text-xs">
              {language === 'bn' ? 'অনুসন্ধান: ' : 'Search: '}"{search}"
              <button onClick={() => setSearch('')} className="hover:text-black cursor-pointer">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {selectedDivision !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-100 text-emerald-900 text-xs">
              {language === 'bn' ? 'বিভাগ: ' : 'Division: '}
              {localizedName(divisions.find((d) => d.id === selectedDivision))}
              <button onClick={() => setSelectedDivision('all')} className="hover:text-black cursor-pointer">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {selectedDistrict !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-100 text-emerald-900 text-xs">
              {language === 'bn' ? 'জেলা: ' : 'District: '}
              {localizedName(districts.find((d) => d.id === selectedDistrict))}
              <button onClick={() => setSelectedDistrict('all')} className="hover:text-black cursor-pointer">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {selectedCategory !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-100 text-amber-900 text-xs">
              {language === 'bn' ? 'ক্যাটাগরি: ' : 'Category: '}
              {language === 'bn'
                ? FOOD_CATEGORIES.find((c) => c.id === selectedCategory)?.nameBn
                : FOOD_CATEGORIES.find((c) => c.id === selectedCategory)?.nameEn}
              <button onClick={() => setSelectedCategory('all')} className="hover:text-black cursor-pointer">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {selectedDietary !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-200 text-slate-800 text-xs">
              {language === 'bn' ? 'ধরন: ' : 'Dietary: '}
              {selectedDietary === 'non-veg' ? (language === 'bn' ? 'আমিষ' : 'Non-Veg') :
               selectedDietary === 'veg' ? (language === 'bn' ? 'নিরামিষ' : 'Vegetarian') :
               (language === 'bn' ? 'মিষ্টি' : 'Sweet')}
              <button onClick={() => setSelectedDietary('all')} className="hover:text-black cursor-pointer">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          <button
            onClick={handleResetFilters}
            className="text-[#E74C3C] text-[11px] font-semibold hover:underline ml-1 cursor-pointer font-bengali"
          >
            {t('discover.clearFilters')}
          </button>
        </div>
      )}

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-500 font-medium font-bengali">
        <span>
          {language === 'bn'
            ? `${filteredFoods.length} টি খাঁটি খাবার পাওয়া গেছে`
            : `Showing ${filteredFoods.length} authentic dishes`}
        </span>
      </div>

      {/* Food Cards Grid or List */}
      {filteredFoods.length === 0 ? (
        <div className="bg-white rounded-2xl border border-amber-900/10 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800 text-base font-bengali">{t('discover.noResults')}</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto font-bengali">
            {t('discover.noResultsDesc')}
          </p>
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 bg-[#155C3A] text-white text-xs font-semibold rounded-xl hover:bg-[#0e442a] cursor-pointer"
          >
            {t('discover.clearFilters')}
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFoods.map((food) => {
            const district = districts.find((d) => d.id === food.districtId);
            const division = divisions.find((d) => d.id === food.divisionId);

            return (
              <FoodCard
                key={food.id}
                food={food}
                district={district}
                division={division}
                onSelect={(foodId) => navigate('food', foodId)}
                onDistrictClick={(distId) => navigate('district', distId)}
              />
            );
          })}
        </div>
      ) : (
        /* Compact List View */
        <div className="bg-white rounded-2xl border border-amber-900/10 divide-y divide-slate-100 overflow-hidden shadow-2xs">
          {filteredFoods.map((food) => {
            const district = districts.find((d) => d.id === food.districtId);
            const division = divisions.find((d) => d.id === food.divisionId);
            const categoryObj = FOOD_CATEGORIES.find((c) => c.id === food.category);

            return (
              <div
                key={food.id}
                onClick={() => navigate('food', food.id)}
                className="p-4 hover:bg-slate-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl overflow-hidden ring-1 ring-slate-200 shrink-0">
                    <FoodImage
                      src={food.imageUrl}
                      alt={localizedName(food)}
                      className="w-full h-full object-cover"
                      containerClassName="w-full h-full relative overflow-hidden bg-slate-100"
                      loading="lazy"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                      <span className="text-[#155C3A] font-semibold flex items-center gap-0.5">
                        <MapPin className="w-3 h-3 text-[#155C3A]" />
                        {district ? localizedName(district) : ''}
                      </span>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <span>{division ? localizedName(division) : ''}</span>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <span>
                        {categoryObj
                          ? (language === 'bn' ? categoryObj.nameBn : categoryObj.nameEn)
                          : food.category}
                      </span>
                    </div>

                    <h4 className="font-bold text-base text-slate-900 font-bengali mt-0.5 hover:text-[#155C3A]">
                      {localizedName(food)}
                      <span className="font-sans text-xs text-slate-500 font-normal ml-1.5">
                        ({language === 'bn' ? food.nameEn : food.nameBn})
                      </span>
                    </h4>
                    <p className="text-xs text-slate-500 line-clamp-1 max-w-xl mt-0.5">
                      {food.shortDescription}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  {food.approximatePriceBdt ? (
                    <span className="text-sm font-bold text-[#155C3A]">৳{food.approximatePriceBdt}</span>
                  ) : null}
                  <span className="text-xs font-semibold text-[#155C3A] hover:underline">
                    {language === 'bn' ? 'রেসিপি ও ইতিহাস দেখুন →' : 'View Recipe & History →'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Suggest Food Modal */}
      <FoodSubmissionModal
        isOpen={isSubmissionModalOpen}
        onClose={() => setIsSubmissionModalOpen(false)}
        initialDistrictId={selectedDistrict !== 'all' ? selectedDistrict : undefined}
        districts={districts}
        divisions={divisions}
        navigate={navigate}
      />
    </div>
  );
};
