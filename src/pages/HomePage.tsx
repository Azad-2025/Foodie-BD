import React, { useState } from 'react';
import { Food, District, Division, PlatformStats } from '../types';
import { FoodCard } from '../components/common/FoodCard';
import { useAuth } from '../context/AuthContext';
import { useJourney } from '../context/JourneyContext';
import { useLanguage } from '../i18n';
import {
  MapPin,
  UtensilsCrossed,
  ArrowRight,
  Compass,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Search,
} from 'lucide-react';

interface HomePageProps {
  navigate: (route: string, param?: string) => void;
  foods: Food[];
  districts: District[];
  divisions: Division[];
  stats: PlatformStats | null;
}

export const HomePage: React.FC<HomePageProps> = ({
  navigate,
  foods,
  districts,
  divisions,
  stats,
}) => {
  const { user, isLoggedIn } = useAuth();
  const { triedFoodIds, visitedDistrictIds } = useJourney();
  const { language, t, localizedName } = useLanguage();
  const [heroSearch, setHeroSearch] = useState('');

  // Popular regional spotlight foods
  const spotlightFoods = foods.slice(0, 6);

  const handleHeroSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (heroSearch.trim()) {
      navigate('discover', heroSearch.trim());
    }
  };

  return (
    <div className="space-y-16 pb-12">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 sm:mt-6">
        <div className="relative rounded-[28px] sm:rounded-3xl overflow-hidden shadow-2xl min-h-[500px] lg:min-h-[560px] flex items-center justify-center border border-amber-950/20 bg-stone-900">
          {/* Authentic Foodie BD Hero Image Asset */}
          <img
            src="/hero-foodie-bg.jpg"
            alt="Foodie BD Bangladeshi Feast"
            className="absolute inset-0 w-full h-full object-cover object-center transform scale-102 hover:scale-105 transition-transform duration-1000 ease-out"
            loading="eager"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=1600&q=80';
            }}
          />

          {/* Dark Forest-Green Cinematic Gradient Overlays for optimal contrast */}
          <div className="absolute inset-0 bg-linear-to-t from-stone-950/95 via-stone-950/75 to-stone-900/60" />
          <div className="absolute inset-0 bg-radial from-[#155C3A]/30 via-transparent to-stone-950/80 mix-blend-multiply" />

          {/* Centered Content Container */}
          <div className="relative z-10 max-w-4xl mx-auto px-6 py-14 sm:py-18 lg:py-20 text-center flex flex-col items-center space-y-6">
            {/* Small Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-xs font-semibold text-emerald-200 tracking-wide shadow-xs font-bengali">
              <Sparkles className="w-3.5 h-3.5 text-[#F39C3D]" />
              <span>{t('home.heroBadge')}</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white font-bengali leading-[1.18] drop-shadow-md">
              {t('home.heroTitle')}
            </h1>

            {/* Supporting Text */}
            <p className="text-sm sm:text-base lg:text-lg text-stone-200/95 max-w-2xl mx-auto font-normal leading-relaxed drop-shadow-xs font-bengali">
              {t('home.heroSubtitle')}
            </p>

            {/* Quick Search Bar */}
            <form
              onSubmit={handleHeroSearchSubmit}
              className="w-full max-w-xl mx-auto flex items-center bg-white/95 backdrop-blur-md rounded-2xl p-1.5 shadow-2xl border border-white/30 focus-within:ring-2 focus-within:ring-[#155C3A] transition-all"
            >
              <div className="flex-1 flex items-center pl-3">
                <Search className="w-4 h-4 text-[#155C3A] shrink-0" />
                <input
                  type="text"
                  value={heroSearch}
                  onChange={(e) => setHeroSearch(e.target.value)}
                  placeholder={t('home.searchPlaceholder')}
                  className="w-full pl-2.5 pr-3 py-2 text-xs sm:text-sm text-stone-800 placeholder-stone-400 focus:outline-none bg-transparent font-bengali"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#E74C3C] hover:bg-[#cf3c2d] text-white text-xs sm:text-sm font-bold rounded-xl transition-colors shadow-xs shrink-0 cursor-pointer font-bengali"
              >
                {t('home.searchBtn')}
              </button>
            </form>

            {/* Division Quick Jump Chips */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
              <span className="text-[11px] text-stone-300 font-medium mr-1 font-bengali">
                {t('home.popularSearches')}
              </span>
              {divisions.map((div) => (
                <button
                  key={div.id}
                  onClick={() => navigate('map', div.id)}
                  className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-stone-200 hover:text-white text-[11px] font-medium border border-white/15 backdrop-blur-xs transition-colors cursor-pointer font-bengali"
                >
                  {localizedName(div)}
                </button>
              ))}
            </div>

            {/* Call To Action Buttons (Rounded Pill Style Matching Reference) */}
            <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2">
              <button
                onClick={() => navigate('discover')}
                className="px-7 py-3.5 rounded-full bg-[#155C3A] hover:bg-[#0e442a] text-white font-bold text-xs sm:text-sm shadow-xl transition-all flex items-center gap-2 cursor-pointer border border-emerald-400/30 hover:scale-[1.02] active:scale-[0.98] font-bengali"
              >
                <UtensilsCrossed className="w-4 h-4 text-emerald-200" />
                <span>{t('home.heroPrimaryCta') || t('home.viewAllFoods')}</span>
              </button>

              <button
                onClick={() => navigate('map')}
                className="px-7 py-3.5 rounded-full bg-white/15 hover:bg-white/25 text-white font-bold text-xs sm:text-sm border border-white/30 backdrop-blur-md shadow-lg transition-all flex items-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98] font-bengali"
              >
                <Compass className="w-4 h-4 text-[#F39C3D]" />
                <span>{t('home.heroSecondaryCta') || t('home.viewMap')}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* User Progress Bar Preview if Logged In */}
      {isLoggedIn && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl border border-amber-900/10 p-5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <img
                src={user?.avatarUrl || 'https://api.dicebear.com/7.x/initials/svg?seed=Foodie'}
                alt={user?.name}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-[#155C3A]/30"
              />
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  {language === 'bn' ? `শুভ স্বাগতম, ${user?.name}!` : `Welcome back, ${user?.name}!`}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {language === 'bn' ? (
                    <>
                      আপনি ইতিমধ্যে <span className="font-bold text-[#155C3A]">{visitedDistrictIds.size}</span> টি জেলার{' '}
                      <span className="font-bold text-[#E74C3C]">{triedFoodIds.size}</span> টি ঐতিহ্যবাহী খাবার চেখে দেখেছেন।
                    </>
                  ) : (
                    <>
                      You have tasted <span className="font-bold text-[#E74C3C]">{triedFoodIds.size}</span> regional delicacies across{' '}
                      <span className="font-bold text-[#155C3A]">{visitedDistrictIds.size}</span> districts.
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="text-right hidden sm:block">
                <span className="text-xs font-bold text-slate-700">
                  {Math.round((visitedDistrictIds.size / 64) * 100)}% {language === 'bn' ? 'বাংলাদেশ কভারেজ' : 'of Bangladesh'}
                </span>
                <p className="text-[10px] text-slate-400">{t('foodieCard.districtsCoverage')}</p>
              </div>
              <button
                onClick={() => navigate('journey')}
                className="px-4 py-2 bg-[#155C3A] hover:bg-[#0e442a] text-white text-xs font-bold rounded-xl transition-colors shrink-0 shadow-2xs flex items-center gap-1.5 cursor-pointer"
              >
                <span>{t('nav.journey')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Real Platform Statistics */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-amber-900/10 shadow-2xs text-center space-y-1">
            <p className="text-3xl font-black text-[#155C3A]">{stats?.totalDistricts || 64}</p>
            <p className="text-xs font-bold text-slate-800">{t('home.statsDistricts')}</p>
            <p className="text-[11px] text-slate-500">{t('home.statsDistrictsSub')}</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-amber-900/10 shadow-2xs text-center space-y-1">
            <p className="text-3xl font-black text-[#E74C3C]">{stats?.totalDivisions || 8}</p>
            <p className="text-xs font-bold text-slate-800">{t('home.statsDivisions')}</p>
            <p className="text-[11px] text-slate-500">{t('home.statsDivisionsSub')}</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-amber-900/10 shadow-2xs text-center space-y-1">
            <p className="text-3xl font-black text-[#F39C3D]">{stats?.totalFoods || foods.length}</p>
            <p className="text-xs font-bold text-slate-800">{t('home.statsFoods')}</p>
            <p className="text-[11px] text-slate-500">{t('home.statsFoodsSub')}</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-amber-900/10 shadow-2xs text-center space-y-1">
            <p className="text-3xl font-black text-slate-800">{stats?.totalTriedByUsers || 0}+</p>
            <p className="text-xs font-bold text-slate-800">{t('home.statsExplorers')}</p>
            <p className="text-[11px] text-slate-500">{t('home.statsExplorersSub')}</p>
          </div>
        </div>
      </section>

      {/* 3-Step How Foodie BD Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold text-[#155C3A] uppercase tracking-wider">
            {t('home.whyFoodieBd')}
          </span>
          <h2 className="text-2xl font-black text-slate-900 font-bengali">
            {language === 'bn' ? 'কীভাবে খাদক ম্যাপ ব্যবহার করবেন' : 'How Foodie BD Works'}
          </h2>
          <p className="text-xs text-slate-500">
            {language === 'bn'
              ? 'তিনটি সহজ ধাপে বাংলাদেশের রন্ধন ঐতিহ্য অন্বেষণ করুন এবং স্বাদস্মৃতি রেকর্ড করুন।'
              : 'Three simple steps to explore Bangladesh’s heritage flavors and record your culinary memories.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-amber-900/10 shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#155C3A] flex items-center justify-center font-bold text-sm">
              ১
            </div>
            <h3 className="font-bold text-base text-slate-900">
              {t('home.whyReason1Title')}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {t('home.whyReason1Desc')}
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-amber-900/10 shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-[#F39C3D] flex items-center justify-center font-bold text-sm">
              ২
            </div>
            <h3 className="font-bold text-base text-slate-900">
              {t('home.whyReason2Title')}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {t('home.whyReason2Desc')}
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-amber-900/10 shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 text-[#E74C3C] flex items-center justify-center font-bold text-sm">
              ৩
            </div>
            <h3 className="font-bold text-base text-slate-900">
              {t('home.whyReason3Title')}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {t('home.whyReason3Desc')}
            </p>
          </div>
        </div>
      </section>

      {/* Explore by All 8 Divisions */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <span className="text-xs font-bold text-[#155C3A] uppercase tracking-wider">
              {language === 'bn' ? 'আঞ্চলিক ভূগোল' : 'Regional Geography'}
            </span>
            <h2 className="text-2xl font-black text-slate-900 mt-1 font-bengali">
              {t('home.divisionsSectionTitle')}
            </h2>
          </div>
          <p className="text-xs text-slate-500 max-w-md">
            {t('home.divisionsSectionSubtitle')}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          {divisions.map((div) => {
            const divDistricts = districts.filter((d) => d.divisionId === div.id);
            const divFoods = foods.filter((f) => f.divisionId === div.id);

            return (
              <div
                key={div.id}
                onClick={() => navigate('map', div.id)}
                className="group p-4 bg-white rounded-2xl border border-amber-900/10 hover:border-[#155C3A] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{divDistricts.length} {language === 'bn' ? 'জেলা' : 'Districts'}</span>
                    <span className="group-hover:translate-x-0.5 transition-transform text-[#155C3A]">
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                  <h3 className="font-extrabold text-base text-slate-900 group-hover:text-[#155C3A] mt-1">
                    {localizedName(div)}
                  </h3>
                  <p className="font-bengali text-xs font-semibold text-amber-900/70">
                    {language === 'bn' ? `${div.nameEn} Division` : `${div.nameBn} বিভাগ`}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
                  {divFoods.length} {language === 'bn' ? 'টি নথিভুক্ত খাবার' : 'authentic dishes cataloged'}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Spotlight Regional Foods */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-[#155C3A] uppercase tracking-wider">
              {language === 'bn' ? 'ঐতিহ্যবাহী স্বাদের তালিকা' : 'Iconic Delicacies'}
            </span>
            <h2 className="text-2xl font-black text-slate-900 mt-1 font-bengali">
              {t('home.featuredFoodsTitle')}
            </h2>
          </div>
          <button
            onClick={() => navigate('discover')}
            className="text-xs font-bold text-[#155C3A] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>{t('home.viewAllFoods')} ({foods.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {spotlightFoods.map((food) => {
            const district = districts.find((d) => d.id === food.districtId);
            const division = divisions.find((d) => d.id === food.divisionId);

            return (
              <FoodCard
                key={food.id}
                food={food}
                district={district}
                division={division}
                onSelect={(foodId) => navigate('food', foodId)}
                onDistrictClick={(districtId) => navigate('district', districtId)}
              />
            );
          })}
        </div>
      </section>

      {/* Cultural Heritage Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#FFF9F0] border-2 border-dashed border-[#155C3A]/30 rounded-3xl p-8 sm:p-10 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-[#155C3A] flex items-center justify-center mx-auto">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 font-bengali">
            {language === 'bn' ? 'খাবারের শেকড় সংরক্ষণ ও তথ্যসূত্র' : 'Preserving Culinary Roots & Heritage'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
            {language === 'bn'
              ? 'Foodie BD (খাদক ম্যাপ) এ প্রতিটি খাবারের ইতিহাস, উপাদান ও জেলা সম্পর্ক বাংলা একাডেমির লোকজ ঐতিহ্য এবং জেলা প্রসাশনের প্রামাণ্য দলিলের সাথে যাচাইকৃত।'
              : 'At Foodie BD, every recorded recipe, origin lore, and district tie is cross-checked with authentic administrative documents and folk cultural registries of Bangladesh.'}
          </p>
          <div className="pt-2">
            <button
              onClick={() => navigate('about')}
              className="px-5 py-2.5 rounded-xl bg-[#155C3A] hover:bg-[#0e442a] text-white text-xs font-bold transition-colors cursor-pointer"
            >
              {language === 'bn' ? 'আমাদের লক্ষ্য ও কার্যক্রম জানুন →' : 'Learn About Our Heritage Mission →'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
