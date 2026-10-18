import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useJourney } from '../context/JourneyContext';
import { useLanguage } from '../i18n';
import { District, Division } from '../types';
import { FoodieCardExportModal } from '../components/export/FoodieCardExportModal';
import { FoodImage } from '../components/common/FoodImage';
import {
  Compass,
  CheckCircle2,
  Bookmark,
  MapPin,
  Calendar,
  Star,
  Award,
  Download,
  Trash2,
  ArrowRight,
  Search,
  Filter,
} from 'lucide-react';

interface MyJourneyPageProps {
  districts: District[];
  divisions: Division[];
  navigate: (route: string, param?: string) => void;
}

export const MyJourneyPage: React.FC<MyJourneyPageProps> = ({
  districts,
  divisions,
  navigate,
}) => {
  const { user, isLoggedIn } = useAuth();
  const { language, t, localizedName, localizedTitle, localizedDesc } = useLanguage();
  const {
    journey,
    achievements,
    triedFoodIds,
    wantToTryFoodIds,
    visitedDistrictIds,
    visitedDivisionIds,
    removeFromJourney,
  } = useJourney();

  const [activeTab, setActiveTab] = useState<'tried' | 'wishlist' | 'divisions' | 'achievements'>('tried');
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');

  if (!isLoggedIn) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl border border-amber-900/10 text-center space-y-4 shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#155C3A] flex items-center justify-center mx-auto">
          <Compass className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 font-bengali">
          {t('journey.title')}
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed font-bengali">
          {t('journey.notLoggedIn')}
        </p>
        <div className="flex gap-2 pt-2">
          <button
            onClick={() => navigate('login')}
            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl cursor-pointer"
          >
            {t('nav.signIn')}
          </button>
          <button
            onClick={() => navigate('register')}
            className="flex-1 py-2.5 bg-[#155C3A] hover:bg-[#0e442a] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
          >
            {t('nav.joinKhadok')}
          </button>
        </div>
      </div>
    );
  }

  const triedItems = useMemo(() => {
    let items = journey.filter((j) => j.status === 'tried');
    if (filterQuery.trim()) {
      const q = filterQuery.toLowerCase();
      items = items.filter(
        (i) =>
          i.food?.nameEn.toLowerCase().includes(q) ||
          i.food?.nameBn.includes(q) ||
          i.district?.nameEn.toLowerCase().includes(q) ||
          i.district?.nameBn.includes(q) ||
          (i.notes && i.notes.toLowerCase().includes(q))
      );
    }
    return items;
  }, [journey, filterQuery]);

  const wantedItems = useMemo(() => {
    let items = journey.filter((j) => j.status === 'want_to_try');
    if (filterQuery.trim()) {
      const q = filterQuery.toLowerCase();
      items = items.filter(
        (i) =>
          i.food?.nameEn.toLowerCase().includes(q) ||
          i.food?.nameBn.includes(q) ||
          i.district?.nameEn.toLowerCase().includes(q)
      );
    }
    return items;
  }, [journey, filterQuery]);

  const coveragePercent = Math.round((visitedDistrictIds.size / 64) * 100);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header with Foodie Stats & Passport Export Button */}
      <div className="bg-white rounded-3xl border border-amber-900/10 p-6 sm:p-8 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={user?.avatarUrl || 'https://api.dicebear.com/7.x/initials/svg?seed=Foodie'}
              alt={user?.name}
              className="w-16 h-16 rounded-2xl object-cover ring-2 ring-[#155C3A]/30"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-bengali">
                  {language === 'bn' ? `${user?.name} এর খাদ্য ভ্রমণ` : `${user?.name}'s Food Journey`}
                </h1>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded font-bengali">
                  {language === 'bn' ? 'খাদক অভিযাত্রী' : 'Foodie Explorer'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-bengali">
                {language === 'bn' ? 'নিজ জেলা: ' : 'Home District: '}
                <strong className="text-slate-700 capitalize">
                  {localizedName(districts.find((d) => d.id === user?.homeDistrictId)) || user?.homeDistrictId || 'Dhaka'}
                </strong>
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsExportOpen(true)}
            className="px-4 py-2.5 bg-[#155C3A] hover:bg-[#0e442a] text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-colors self-start sm:self-auto shadow-2xs cursor-pointer font-bengali"
          >
            <Download className="w-4 h-4" />
            <span>{t('journey.exportCardBtn')}</span>
          </button>
        </div>

        {/* Matrix Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-bengali">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
            <p className="text-2xl font-black text-[#155C3A]">
              {visitedDistrictIds.size}<span className="text-sm font-normal text-slate-400">/64</span>
            </p>
            <p className="text-xs font-bold text-slate-700 mt-0.5">{t('journey.districtsExplored')}</p>
            <p className="text-[10px] text-slate-400">{t('journey.districtsOf64')}</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
            <p className="text-2xl font-black text-[#E74C3C]">
              {visitedDivisionIds.size}<span className="text-sm font-normal text-slate-400">/8</span>
            </p>
            <p className="text-xs font-bold text-slate-700 mt-0.5">{language === 'bn' ? 'বিভাগ অন্বেষণ' : 'Divisions Explored'}</p>
            <p className="text-[10px] text-slate-400">{language === 'bn' ? '৮ বিভাগের মধ্যে' : 'Out of 8'}</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
            <p className="text-2xl font-black text-[#F39C3D]">{triedFoodIds.size}</p>
            <p className="text-xs font-bold text-slate-700 mt-0.5">{t('journey.foodsTasted')}</p>
            <p className="text-[10px] text-slate-400">{t('journey.foodsCount')}</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
            <p className="text-2xl font-black text-slate-800">{wantToTryFoodIds.size}</p>
            <p className="text-xs font-bold text-slate-700 mt-0.5">{t('journey.wishlist')}</p>
            <p className="text-[10px] text-slate-400">{t('journey.wishlistCount')}</p>
          </div>
        </div>

        {/* Exploration Bar */}
        <div className="space-y-1.5 pt-2">
          <div className="flex justify-between text-xs font-semibold text-slate-600 font-bengali">
            <span>{t('journey.progress')}</span>
            <span className="text-[#155C3A]">{coveragePercent}% {t('journey.progressPercentage')}</span>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-[#155C3A] via-[#E74C3C] to-[#F39C3D] rounded-full transition-all duration-500"
              style={{ width: `${Math.max(3, coveragePercent)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Segmented Tab Controls & Quick Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-900/10 pb-3 font-bengali">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('tried')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'tried'
                ? 'bg-[#155C3A] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{t('journey.triedTab')} ({triedFoodIds.size})</span>
          </button>

          <button
            onClick={() => setActiveTab('wishlist')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'wishlist'
                ? 'bg-[#155C3A] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>{t('journey.wantTab')} ({wantToTryFoodIds.size})</span>
          </button>

          <button
            onClick={() => setActiveTab('divisions')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'divisions'
                ? 'bg-[#155C3A] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>{t('journey.statsTab')} ({visitedDivisionIds.size}/8)</span>
          </button>

          <button
            onClick={() => setActiveTab('achievements')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'achievements'
                ? 'bg-[#155C3A] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>{t('journey.achievementsTab')} ({achievements.filter((a) => a.isUnlocked).length})</span>
          </button>
        </div>

        {/* Filter input */}
        {(activeTab === 'tried' || activeTab === 'wishlist') && (
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={language === 'bn' ? 'খাবার খুঁজুন...' : 'Filter logged dishes...'}
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#155C3A]"
            />
          </div>
        )}
      </div>

      {/* Tab: Tasted Foods */}
      {activeTab === 'tried' && (
        <div className="space-y-4">
          {triedItems.length === 0 ? (
            <div className="bg-white rounded-2xl border border-amber-900/10 p-12 text-center space-y-3 font-bengali">
              <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-800 text-sm">
                {filterQuery
                  ? (language === 'bn' ? 'কোনো খাবার খুঁজে পাওয়া যায়নি' : 'No matching tasted dishes found')
                  : t('journey.emptyTried')}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {filterQuery
                  ? (language === 'bn' ? 'অন্য শব্দ দিয়ে চেষ্টা করুন।' : 'Try a different filter query.')
                  : (language === 'bn' ? 'মানচিত্র বা খাবার ক্যাটালগ ঘুরে নতুন খাবার চেখে দেখুন এবং এখানে লগ করুন!' : 'Explore the food map or catalog and mark the regional foods you have experienced!')}
              </p>
              <button
                onClick={() => navigate('map')}
                className="px-4 py-2 bg-[#155C3A] text-white text-xs font-bold rounded-xl hover:bg-[#0e442a] cursor-pointer"
              >
                {t('journey.startExploring')}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {triedItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-amber-900/10 p-4 shadow-2xs flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 ring-1 ring-slate-200">
                      <FoodImage
                        src={item.food?.imageUrl}
                        alt={localizedName(item.food)}
                        className="w-full h-full object-cover"
                        containerClassName="w-full h-full relative overflow-hidden bg-slate-100"
                        loading="lazy"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                        <MapPin className="w-3 h-3 text-[#155C3A]" />
                        <span>{localizedName(item.district)}</span>
                        <span>·</span>
                        <span>{localizedName(item.division)}</span>
                      </div>
                      <h4
                        onClick={() => item.food && navigate('food', item.food.id)}
                        className="font-bold text-sm text-slate-900 hover:text-[#155C3A] cursor-pointer truncate font-bengali"
                      >
                        {localizedName(item.food)}
                      </h4>
                      <p className="text-xs text-slate-600 truncate">
                        {language === 'bn' ? item.food?.nameEn : item.food?.nameBn}
                      </p>

                      {/* Rating stars */}
                      {item.rating && (
                        <div className="flex items-center gap-1 mt-1 text-amber-500">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3 h-3 ${
                                s <= item.rating! ? 'fill-current text-amber-400' : 'text-slate-200'
                              }`}
                            />
                          ))}
                          <span className="text-[10px] text-slate-400 ml-1">({item.rating}/5)</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Notes / memory */}
                  {item.notes && (
                    <div className="text-xs text-slate-600 bg-amber-50/60 p-2.5 rounded-xl border border-amber-200/50 italic">
                      "{item.notes}"
                    </div>
                  )}

                  {/* Footer details */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-bengali">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {language === 'bn' ? 'চেখে দেখেছেন: ' : 'Tasted on: '}
                      {item.triedAt ? new Date(item.triedAt).toLocaleDateString() : 'Recorded'}
                    </span>
                    <button
                      onClick={() => removeFromJourney(item.foodId)}
                      className="text-red-500 hover:text-red-700 flex items-center gap-1 text-[10px] cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>{t('journey.remove')}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Wishlist */}
      {activeTab === 'wishlist' && (
        <div className="space-y-4">
          {wantedItems.length === 0 ? (
            <div className="bg-white rounded-2xl border border-amber-900/10 p-12 text-center space-y-3 font-bengali">
              <Bookmark className="w-8 h-8 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-800 text-sm">
                {filterQuery
                  ? (language === 'bn' ? 'কোনো খাবার খুঁজে পাওয়া যায়নি' : 'No matching wishlist dishes found')
                  : t('journey.emptyWant')}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {language === 'bn'
                  ? 'বাংলাদেশের ৬৪ জেলার বিখ্যাত খাবার ব্রাউজ করুন এবং আপনার স্বাদ ইচ্ছা তালিকায় যোগ করুন!'
                  : 'Bookmark iconic dishes from all 64 districts that you dream of trying on your next trip!'}
              </p>
              <button
                onClick={() => navigate('discover')}
                className="px-4 py-2 bg-[#155C3A] text-white text-xs font-bold rounded-xl hover:bg-[#0e442a] cursor-pointer"
              >
                {t('journey.startExploring')}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {wantedItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-amber-900/10 p-4 shadow-2xs flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-xl overflow-hidden ring-1 ring-slate-200 shrink-0">
                      <FoodImage
                        src={item.food?.imageUrl}
                        alt={localizedName(item.food)}
                        className="w-full h-full object-cover"
                        containerClassName="w-full h-full relative overflow-hidden bg-slate-100"
                        loading="lazy"
                      />
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-500">
                        {localizedName(item.district)} · {localizedName(item.division)}
                      </div>
                      <h4
                        onClick={() => item.food && navigate('food', item.food.id)}
                        className="font-bold text-sm text-slate-900 hover:text-[#155C3A] cursor-pointer font-bengali"
                      >
                        {localizedName(item.food)}
                      </h4>
                      <p className="text-xs text-slate-600">
                        {language === 'bn' ? item.food?.nameEn : item.food?.nameBn}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 font-bengali">
                    <button
                      onClick={() => item.food && navigate('food', item.food.id)}
                      className="px-3 py-1.5 bg-[#155C3A] text-white text-xs font-bold rounded-lg hover:bg-[#0e442a] cursor-pointer"
                    >
                      {language === 'bn' ? 'স্বাদ রেকর্ড করুন' : 'Log Tasting'}
                    </button>
                    <button
                      onClick={() => removeFromJourney(item.foodId)}
                      className="text-[10px] text-slate-400 hover:text-red-500 cursor-pointer"
                    >
                      {t('journey.remove')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Division Conquest */}
      {activeTab === 'divisions' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {divisions.map((div) => {
            const isConquered = visitedDivisionIds.has(div.id);
            const divDistricts = districts.filter((d) => d.divisionId === div.id);
            const visitedCount = divDistricts.filter((d) => visitedDistrictIds.has(d.id)).length;

            return (
              <div
                key={div.id}
                className={`p-5 rounded-2xl border transition-all ${
                  isConquered
                    ? 'bg-white border-emerald-300 shadow-xs'
                    : 'bg-white/60 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`w-3 h-3 rounded-full ${
                      isConquered ? 'bg-[#155C3A]' : 'bg-slate-300'
                    }`}
                  />
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded font-bengali ${
                      isConquered
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {isConquered
                      ? (language === 'bn' ? 'পরিভ্রমণ সম্পন্ন' : 'Explored')
                      : (language === 'bn' ? 'বাকি আছে' : 'Undiscovered')}
                  </span>
                </div>

                <div className="mt-3">
                  <h4 className="font-extrabold text-base text-slate-900 font-bengali">{localizedName(div)}</h4>
                  <p className="font-bengali text-xs font-bold text-amber-900/70">
                    {language === 'bn' ? `${div.nameEn} Division` : `${div.nameBn} বিভাগ`}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-bengali">
                  <span>{language === 'bn' ? 'চেখে দেখা জেলা:' : 'Districts tasted:'}</span>
                  <strong className="text-slate-800">
                    {visitedCount}/{divDistricts.length}
                  </strong>
                </div>

                <button
                  onClick={() => navigate('map', div.id)}
                  className="w-full mt-3 py-1.5 rounded-lg bg-slate-50 hover:bg-emerald-50 text-[11px] font-semibold text-[#155C3A] border border-slate-200 hover:border-emerald-200 text-center transition-colors cursor-pointer font-bengali"
                >
                  {language === 'bn' ? 'বিভাগের মানচিত্র দেখুন →' : 'Explore Division on Map →'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab: Achievements */}
      {activeTab === 'achievements' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((ach) => (
            <div
              key={ach.id}
              className={`p-5 rounded-2xl border transition-all ${
                ach.isUnlocked
                  ? 'bg-white border-emerald-300 shadow-sm'
                  : 'bg-slate-50/70 border-slate-200 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                    ach.isUnlocked
                      ? 'bg-emerald-100 text-[#155C3A]'
                      : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  <Award className="w-5 h-5" />
                </div>
                {ach.isUnlocked && (
                  <span className="text-[10px] uppercase font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded font-bengali">
                    {t('journey.unlocked')}
                  </span>
                )}
              </div>

              <div className="mt-3">
                <h4 className="font-bold text-sm text-slate-900 font-bengali">
                  {localizedTitle(ach)}
                </h4>
                <p className="text-xs text-slate-500 mt-1 font-bengali">
                  {localizedDesc(ach)}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="flex justify-between text-[11px] font-semibold text-slate-500 mb-1 font-bengali">
                  <span>{language === 'bn' ? 'অগ্রগতি' : 'Progress'}</span>
                  <span>{ach.progress || 0}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#155C3A] rounded-full"
                    style={{ width: `${ach.progress || 0}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Export modal */}
      <FoodieCardExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        currentTheme="journey"
      />
    </div>
  );
};
