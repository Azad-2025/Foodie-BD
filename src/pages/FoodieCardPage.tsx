import React, { useRef, useState, useEffect } from 'react';
import { District, Division, Food } from '../types';
import { BangladeshSvgMap } from '../components/map/BangladeshSvgMap';
import { useAuth } from '../context/AuthContext';
import { useJourney } from '../context/JourneyContext';
import { useLanguage } from '../i18n';
import { toPng, toJpeg } from 'html-to-image';
import { jsPDF } from 'jspdf';
import {
  Download,
  Share2,
  Sparkles,
  Camera,
  CheckCircle2,
  Bookmark,
  MapPin,
  Utensils,
  Award,
  ArrowLeft,
  Calendar,
} from 'lucide-react';

interface FoodieCardPageProps {
  districts: District[];
  divisions: Division[];
  foods: Food[];
  navigate: (route: string, param?: string) => void;
}

const THEME_COLORS = [
  { id: 'terracotta', name: 'Terracotta', hex: '#EA580C' },
  { id: 'forest', name: 'Forest Green', hex: '#155C3A' },
  { id: 'navy', name: 'Deep Navy', hex: '#1E3A8A' },
  { id: 'cobalt', name: 'River Cobalt', hex: '#0284C7' },
  { id: 'red', name: 'Ruby Red', hex: '#E74C3C' },
];

const DEFAULT_AVATAR =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><circle cx="24" cy="24" r="24" fill="%23155C3A"/><text x="24" y="28" fill="%23FFF9F0" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle">BD</text></svg>';

export const FoodieCardPage: React.FC<FoodieCardPageProps> = ({
  districts,
  divisions,
  foods,
  navigate,
}) => {
  const { user, isLoggedIn } = useAuth();
  const {
    journey,
    visitedDistrictIds: contextVisitedIds,
    triedFoodIds,
    wantToTryFoodIds,
  } = useJourney();
  const { language, t, localizedName } = useLanguage();

  // Local/Guest visited set fallback
  const [visitedDistricts, setVisitedDistricts] = useState<Set<string>>(() => {
    if (isLoggedIn && contextVisitedIds.size > 0) return contextVisitedIds;
    const saved = localStorage.getItem('foodie_bd_visited_districts');
    if (saved) {
      try {
        return new Set(JSON.parse(saved));
      } catch {}
    }
    return contextVisitedIds;
  });

  useEffect(() => {
    if (contextVisitedIds.size > 0) {
      setVisitedDistricts(contextVisitedIds);
    }
  }, [contextVisitedIds]);

  // Card customization state
  const [selectedThemeHex, setSelectedThemeHex] = useState<string>(THEME_COLORS[0].hex);
  const [customName, setCustomName] = useState<string>(user?.name || '');
  const [showWishlistStat, setShowWishlistStat] = useState<boolean>(true);
  const [customAvatarUrl, setCustomAvatarUrl] = useState<string>(
    user?.avatarUrl || DEFAULT_AVATAR
  );

  // Interactive district names label visibility toggle with localStorage persistence (default: true)
  const [showDistrictNames, setShowDistrictNames] = useState<boolean>(() => {
    const saved = localStorage.getItem('foodie_bd_show_district_names');
    return saved !== null ? saved === 'true' : true;
  });

  useEffect(() => {
    localStorage.setItem('foodie_bd_show_district_names', String(showDistrictNames));
  }, [showDistrictNames]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  useEffect(() => {
    if (user?.name && !customName) {
      setCustomName(user.name);
    }
    if (user?.avatarUrl) {
      setCustomAvatarUrl(user.avatarUrl);
    }
  }, [user]);

  const visitedCount = visitedDistricts.size;
  const triedCount = triedFoodIds.size;
  const wantedCount = wantToTryFoodIds.size;
  const progressPercent = Math.round((visitedCount / 64) * 100);

  // Avatar upload
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCustomAvatarUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Export handlers
  const handleDownload = async (format: 'png' | 'jpeg' | 'pdf') => {
    if (!cardRef.current) return;
    try {
      setIsExporting(true);
      setExportStatus(language === 'bn' ? 'কার্ড প্রস্তুত হচ্ছে...' : 'Generating card...');

      const options = {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: '#FAF7F2',
      };

      if (format === 'png') {
        const dataUrl = await toPng(cardRef.current, options);
        const link = document.createElement('a');
        link.download = `foodie-bd-card-${visitedCount}-of-64.png`;
        link.href = dataUrl;
        link.click();
      } else if (format === 'jpeg') {
        const dataUrl = await toJpeg(cardRef.current, { ...options, quality: 0.95 });
        const link = document.createElement('a');
        link.download = `foodie-bd-card-${visitedCount}-of-64.jpg`;
        link.href = dataUrl;
        link.click();
      } else if (format === 'pdf') {
        const dataUrl = await toJpeg(cardRef.current, { ...options, quality: 0.95 });
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
        });
        const imgProps = pdf.getImageProperties(dataUrl);
        const pdfWidth = pdf.internal.pageSize.getWidth() - 20;
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        pdf.addImage(dataUrl, 'JPEG', 10, 10, pdfWidth, pdfHeight);
        pdf.save(`foodie-bd-card-${visitedCount}-of-64.pdf`);
      }

      setExportStatus(language === 'bn' ? 'ডাউনলোড সফল হয়েছে!' : 'Downloaded successfully!');
      setTimeout(() => setExportStatus(null), 3000);
    } catch (err) {
      console.error('Export error:', err);
      setExportStatus(language === 'bn' ? 'ডাউনলোড ব্যর্থ হয়েছে।' : 'Export failed.');
      setTimeout(() => setExportStatus(null), 3000);
    } finally {
      setIsExporting(false);
    }
  };

  // Find user's home district name
  const homeDistrictObj = districts.find((d) => d.id === user?.homeDistrictId);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-stone-200/90 shadow-2xs">
        <div>
          <button
            onClick={() => navigate('map')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-[#155C3A] mb-2 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? 'খাবারের মানচিত্রে ফিরুন' : 'Back to Food Map'}</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 font-bengali">
            {t('foodieCard.title')}
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 font-bengali mt-1">
            {language === 'bn'
              ? 'আপনার চেখে দেখা ৬৪ জেলার ঐতিহ্যবাহী খাবারের অগ্রগতি ও ব্যক্তিগত বাংলাদেশ খাদক মানচিত্র ডাউনলোড করুন।'
              : 'View and download your personalized food-journey card featuring an authentic map of Bangladesh.'}
          </p>
        </div>

        {/* Action button to explore more */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => navigate('map')}
            className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl transition-colors cursor-pointer font-bengali"
          >
            {language === 'bn' ? 'জেলা চিহ্নিত করুন' : 'Edit Districts'}
          </button>
          <button
            onClick={() => navigate('journey')}
            className="px-4 py-2 bg-[#155C3A] hover:bg-[#0e442a] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer font-bengali shadow-2xs"
          >
            {t('nav.journey')}
          </button>
        </div>
      </div>

      {/* Customization Toolbar */}
      <div className="bg-white rounded-2xl border border-stone-200/90 p-4 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        {/* Theme Swatches */}
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-bold text-stone-700 font-bengali">
            {language === 'bn' ? 'থিম নির্বাচন:' : 'Theme:'}
          </span>
          {THEME_COLORS.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedThemeHex(t.hex)}
              style={{ backgroundColor: t.hex }}
              className={`w-7 h-7 rounded-full transition-all cursor-pointer ${
                selectedThemeHex === t.hex
                  ? 'ring-2 ring-offset-2 ring-stone-900 scale-110 shadow-xs'
                  : 'hover:scale-105 opacity-90'
              }`}
              title={t.name}
            />
          ))}
        </div>

        {/* Profile Customization Options */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleAvatarChange}
            accept="image/*"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-stone-300 text-stone-700 hover:bg-stone-50 font-medium transition-colors cursor-pointer font-bengali shadow-2xs"
          >
            <Camera className="w-3.5 h-3.5 text-stone-500" />
            <span>{language === 'bn' ? 'ছবি পরিবর্তন' : 'Change Photo'}</span>
          </button>

          <input
            type="text"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder={language === 'bn' ? 'আপনার নাম' : 'Your Name'}
            className="px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-full text-stone-800 text-xs focus:outline-none focus:ring-1 focus:ring-[#155C3A] font-bengali w-36 sm:w-44"
          />


          <label className="flex items-center gap-1.5 text-stone-600 cursor-pointer select-none font-bengali font-medium">
            <input
              type="checkbox"
              checked={showWishlistStat}
              onChange={(e) => setShowWishlistStat(e.target.checked)}
              className="rounded text-[#155C3A] focus:ring-[#155C3A] cursor-pointer"
            />
            <span>{language === 'bn' ? 'স্বাদ ইচ্ছা দেখান' : 'Show Wishlist'}</span>
          </label>

          {/* District names checkbox */}
          <label
            htmlFor="foodie-card-toggle-district-names"
            className="flex items-center gap-1.5 text-stone-700 hover:text-stone-900 cursor-pointer select-none font-bengali font-medium bg-stone-100/90 hover:bg-stone-100 px-3 py-1.5 rounded-full border border-stone-300 transition-colors shadow-2xs"
          >
            <input
              type="checkbox"
              id="foodie-card-toggle-district-names"
              checked={showDistrictNames}
              onChange={(e) => setShowDistrictNames(e.target.checked)}
              className="w-3.5 h-3.5 rounded text-[#155C3A] focus:ring-[#155C3A] accent-[#155C3A] cursor-pointer"
            />
            <span>{language === 'bn' ? 'জেলার নাম' : 'District Names'}</span>
          </label>
        </div>
      </div>

      {/* The Printable / Downloadable Foodie Card (Single Complete Polished Design) */}
      <div className="flex justify-center">
        <div
          ref={cardRef}
          className="w-full max-w-2xl bg-[#FAF7F2] rounded-3xl border border-[#E8E2D5] p-6 sm:p-8 shadow-md space-y-6 select-none"
          style={{ fontFamily: "'Plus Jakarta Sans', 'Noto Sans Bengali', sans-serif" }}
        >
          {/* Card Top Header */}
          <div className="flex items-center justify-between border-b border-stone-200/80 pb-4">
            <div className="flex items-center gap-3">
              <img
                src="/foodie-bd-logo.svg"
                alt="Foodie BD"
                className="h-10 sm:h-11 w-auto max-w-[160px] sm:max-w-[200px] object-contain shrink-0"
              />
            </div>

            {/* Verification Badge & Date */}
            <div className="text-right">
              <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full font-bengali">
                <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                <span>{language === 'bn' ? 'প্রত্যয়িত খাদক পাসপোর্ট' : 'Certified Foodie Passport'}</span>
              </span>
              <p className="text-[10px] text-stone-400 mt-0.5 font-sans">
                {new Date().toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>

          {/* User Profile Bar (if enabled) */}
          {customName && (
            <div className="flex items-center justify-between bg-white/90 p-3.5 rounded-2xl border border-stone-200/80 shadow-2xs">
              <div className="flex items-center gap-3">
                <img
                  src={customAvatarUrl}
                  alt={customName}
                  crossOrigin="anonymous"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = DEFAULT_AVATAR;
                  }}
                  className="w-12 h-12 rounded-2xl object-cover ring-2 ring-[#155C3A]/20"
                />
                <div>
                  <h3 className="font-extrabold text-base text-stone-900 font-bengali">
                    {customName}
                  </h3>
                  <p className="text-xs text-stone-500 font-bengali">
                    {language === 'bn' ? 'নিজ জেলা: ' : 'Home District: '}
                    <strong className="text-stone-700 font-semibold">
                      {homeDistrictObj ? localizedName(homeDistrictObj) : 'বাংলাদেশ'}
                    </strong>
                  </p>
                </div>
              </div>

              {/* Big Visited Counter in Theme Color */}
              <div className="text-right">
                <div
                  className="text-3xl font-black tracking-tight leading-none"
                  style={{ color: selectedThemeHex }}
                >
                  {visitedCount}
                  <span className="text-stone-400 text-lg font-normal">/64</span>
                </div>
                <span className="text-[10px] font-bold text-stone-500 font-bengali">
                  {language === 'bn' ? 'জেলা সম্পন্ন' : 'Districts Covered'}
                </span>
              </div>
            </div>
          )}

          {/* Core Metric Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center font-bengali">
            <div className="p-3 rounded-2xl bg-white border border-stone-200/80 shadow-2xs">
              <p className="text-xl font-black" style={{ color: selectedThemeHex }}>
                {visitedCount}
                <span className="text-xs font-normal text-stone-400">/64</span>
              </p>
              <p className="text-[11px] font-bold text-stone-700 mt-0.5">
                {language === 'bn' ? 'জেলা কভারেজ' : 'Districts Visited'}
              </p>
              <p className="text-[9px] text-stone-400">
                {language === 'bn' ? '৬৪ জেলার মধ্যে' : 'Out of 64'}
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-white border border-stone-200/80 shadow-2xs">
              <p className="text-xl font-black text-[#155C3A]">
                {triedCount}
              </p>
              <p className="text-[11px] font-bold text-stone-700 mt-0.5">
                {language === 'bn' ? 'খাবার চেখেছেন' : 'Dishes Tasted'}
              </p>
              <p className="text-[9px] text-stone-400">
                {language === 'bn' ? 'যাচাইকৃত স্বাদ' : 'Distinct Dishes'}
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-white border border-stone-200/80 shadow-2xs">
              <p className="text-xl font-black text-[#E74C3C]">
                {progressPercent}%
              </p>
              <p className="text-[11px] font-bold text-stone-700 mt-0.5">
                {language === 'bn' ? 'জাতীয় অগ্রগতি' : 'Progress'}
              </p>
              <p className="text-[9px] text-stone-400">
                {language === 'bn' ? '৬৪ জেলার অনুপাতে' : 'Denominator: 64'}
              </p>
            </div>

            {showWishlistStat ? (
              <div className="p-3 rounded-2xl bg-white border border-stone-200/80 shadow-2xs">
                <p className="text-xl font-black text-[#F39C3D]">
                  {wantedCount}
                </p>
                <p className="text-[11px] font-bold text-stone-700 mt-0.5">
                  {language === 'bn' ? 'স্বাদ ইচ্ছা' : 'Wishlist'}
                </p>
                <p className="text-[9px] text-stone-400">
                  {language === 'bn' ? 'চেখে দেখার অপেক্ষায়' : 'Want to Try'}
                </p>
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-white border border-stone-200/80 shadow-2xs">
                <p className="text-xl font-black text-stone-800">
                  {64 - visitedCount}
                </p>
                <p className="text-[11px] font-bold text-stone-700 mt-0.5">
                  {language === 'bn' ? 'বাকি জেলা' : 'Remaining'}
                </p>
                <p className="text-[9px] text-stone-400">
                  {language === 'bn' ? 'স্বাদ অন্বেষণ বাকি' : 'Yet to Explore'}
                </p>
              </div>
            )}
          </div>

          {/* Central Verified Geographic Bangladesh Vector Map */}
          <div className="bg-white/80 rounded-2xl border border-stone-200/70 p-4 flex items-center justify-center">
            <BangladeshSvgMap
              districts={districts}
              visitedDistrictIds={visitedDistricts}
              selectedDistrict={null}
              onSelectDistrict={() => {}}
              themeColor={selectedThemeHex}
              showLabels={showDistrictNames}
              showFoodMarkers={false}
              foods={foods}
              interactive={false}
              className="w-full max-w-[480px]"
            />
          </div>

          {/* Card Footer (Progress bar, tagline, attribution) */}
          <div className="pt-3 border-t border-stone-200/80 space-y-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-bold text-stone-600 font-bengali">
                <span>
                  {progressPercent}% {language === 'bn' ? 'বাংলাদেশ স্বাদ পরিক্রমা সম্পূর্ণ' : 'Bangladesh Culinary Journey Complete'}
                </span>
                <span className="text-stone-400">
                  {visitedCount}/64 {language === 'bn' ? 'জেলা' : 'districts'}
                </span>
              </div>
              <div className="w-full h-2.5 bg-stone-200/80 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.max(2, progressPercent)}%`,
                    backgroundColor: selectedThemeHex,
                  }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-stone-500 font-bengali">
              <div className="flex items-center gap-1.5 font-bold text-[#155C3A]">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedThemeHex }} />
                <span>{language === 'bn' ? 'খাদ্যযাত্রায় থাকুন ফুডি বিডি এর সাথে' : 'Foodie BD · Authentic Culinary Map of Bangladesh'}</span>
              </div>
              <span className="text-[10px] text-stone-400 font-sans">
                foodiebd.app
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Download Action Section */}
      <div className="bg-white rounded-3xl border border-stone-200/90 p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-stone-900 font-bengali flex items-center gap-2">
              <Download className="w-4 h-4 text-[#155C3A]" />
              <span>{language === 'bn' ? 'আপনার ফুডি কার্ড ডাউনলোড করুন' : 'Download Your Foodie Card'}</span>
            </h3>
            <p className="text-xs text-stone-500 font-bengali mt-0.5">
              {language === 'bn'
                ? 'মানচিত্র এবং আপনার স্বাদের পরিসংখ্যান সহ পূর্ণাঙ্গ কার্ডটি হাই-রেজোলিউশনে সংরক্ষণ করুন।'
                : 'Save the complete polished card with map and food progress together in high resolution.'}
            </p>
          </div>

          {exportStatus && (
            <span className="text-xs font-bold text-[#155C3A] font-bengali animate-fade-in">
              {exportStatus}
            </span>
          )}
        </div>

        {/* 3 Download Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => handleDownload('png')}
            disabled={isExporting}
            className="py-3 px-4 rounded-2xl border border-stone-200 bg-stone-50 hover:bg-emerald-50 hover:border-[#155C3A] text-stone-800 hover:text-[#155C3A] text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs disabled:opacity-50 font-bengali"
          >
            <Download className="w-4 h-4" />
            <span>{language === 'bn' ? 'PNG ডাউনলোড' : 'Download PNG'}</span>
          </button>

          <button
            onClick={() => handleDownload('jpeg')}
            disabled={isExporting}
            className="py-3 px-4 rounded-2xl border border-stone-200 bg-stone-50 hover:bg-emerald-50 hover:border-[#155C3A] text-stone-800 hover:text-[#155C3A] text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs disabled:opacity-50 font-bengali"
          >
            <Download className="w-4 h-4" />
            <span>{language === 'bn' ? 'JPG ডাউনলোড' : 'Download JPG'}</span>
          </button>

          <button
            onClick={() => handleDownload('pdf')}
            disabled={isExporting}
            className="py-3 px-4 rounded-2xl border border-stone-200 bg-stone-50 hover:bg-emerald-50 hover:border-[#155C3A] text-stone-800 hover:text-[#155C3A] text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs disabled:opacity-50 font-bengali"
          >
            <Download className="w-4 h-4" />
            <span>{language === 'bn' ? 'PDF ডাউনলোড' : 'Download PDF'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
