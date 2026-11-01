import React, { useState, useEffect, useRef, useMemo } from 'react';
import { District, Division, Food, MapTheme } from '../types';
import { DISTRICTS, DIVISIONS } from '../data/divisionsAndDistricts';
import { SEED_FOODS } from '../data/seedFoods';
import { BangladeshSvgMap } from '../components/map/BangladeshSvgMap';
import { BangladeshMap } from '../components/map/BangladeshMap';
import { FoodImage } from '../components/common/FoodImage';
import { FoodSubmissionModal } from '../components/food/FoodSubmissionModal';
import { useJourney } from '../context/JourneyContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../i18n';
import { toPng, toJpeg } from 'html-to-image';
import { jsPDF } from 'jspdf';
import {
  Search,
  Download,
  Check,
  MapPin,
  Utensils,
  ChevronRight,
  X,
  Layers,
  Sparkles,
  Camera,
  Share2,
  Bookmark,
  CheckCircle2,
  Info,
  PlusCircle,
} from 'lucide-react';

interface FoodMapPageProps {
  districts: District[];
  divisions: Division[];
  foods: Food[];
  initialDivisionId?: string;
  initialDistrictId?: string;
  navigate: (route: string, param?: string) => void;
}

const THEME_COLORS: { id: string; name: string; hex: string }[] = [
  { id: 'terracotta', name: 'Terracotta', hex: '#EA580C' },
  { id: 'forest', name: 'Forest Green', hex: '#155C3A' },
  { id: 'navy', name: 'Deep Navy', hex: '#1E3A8A' },
  { id: 'cobalt', name: 'River Cobalt', hex: '#0284C7' },
  { id: 'red', name: 'Ruby Red', hex: '#E74C3C' },
];

export const FoodMapPage: React.FC<FoodMapPageProps> = ({
  districts: rawDistricts,
  divisions: rawDivisions,
  foods: rawFoods,
  initialDivisionId,
  initialDistrictId,
  navigate,
}) => {
  // Guaranteed non-empty fallback datasets for 0ms first-paint and offline/cold-start resilience
  const districts = useMemo(() => {
    return rawDistricts && rawDistricts.length > 0 ? rawDistricts : DISTRICTS;
  }, [rawDistricts]);

  const divisions = useMemo(() => {
    return rawDivisions && rawDivisions.length > 0 ? rawDivisions : DIVISIONS;
  }, [rawDivisions]);

  const foods = useMemo(() => {
    return rawFoods && rawFoods.length > 0 ? rawFoods : SEED_FOODS;
  }, [rawFoods]);

  const { user, isLoggedIn } = useAuth();
  const {
    journey,
    visitedDistrictIds: contextVisitedIds,
    triedFoodIds,
    wantToTryFoodIds,
    trackFood,
    removeFromJourney,
    refreshJourney,
  } = useJourney();
  const { language, t, localizedName, localizedDish } = useLanguage();

  // Local/Guest visited set for interactive toggling
  const [localVisitedDistricts, setLocalVisitedDistricts] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('foodie_bd_visited_districts');
    if (saved) {
      try {
        return new Set(JSON.parse(saved));
      } catch {}
    }
    return new Set<string>();
  });

  // Merge context visited IDs when logged in
  useEffect(() => {
    if (isLoggedIn && contextVisitedIds.size > 0) {
      setLocalVisitedDistricts((prev) => {
        const merged = new Set(prev);
        contextVisitedIds.forEach((id) => merged.add(id));
        return merged;
      });
    }
  }, [isLoggedIn, contextVisitedIds]);

  // Save local state to localStorage
  useEffect(() => {
    localStorage.setItem(
      'foodie_bd_visited_districts',
      JSON.stringify(Array.from(localVisitedDistricts))
    );
  }, [localVisitedDistricts]);

  // Selected theme color
  const [selectedThemeHex, setSelectedThemeHex] = useState<string>(THEME_COLORS[0].hex);

  // Profile customization state for map card
  const [customName, setCustomName] = useState<string>(user?.name || '');
  const [customAvatarUrl, setCustomAvatarUrl] = useState<string>(
    user?.avatarUrl || 'https://api.dicebear.com/7.x/initials/svg?seed=FoodieBD'
  );

  // Interactive district names label visibility toggle with localStorage persistence (default: true)
  const [showDistrictNames, setShowDistrictNames] = useState<boolean>(() => {
    const saved = localStorage.getItem('foodie_bd_show_district_names');
    return saved !== null ? saved === 'true' : true;
  });

  useEffect(() => {
    localStorage.setItem('foodie_bd_show_district_names', String(showDistrictNames));
  }, [showDistrictNames]);

  // Search filter for districts sidebar
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected district for details drawer
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);

  // Map view mode: 'card' (SVG vector card, like reference) or 'leaflet' (Full interactive Leaflet)
  const [viewMode, setViewMode] = useState<'card' | 'leaflet'>('card');

  // Export card ref
  const cardExportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);

  // File upload input ref for avatar
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState<boolean>(false);

  // Initialize selected district from props
  useEffect(() => {
    if (initialDistrictId) {
      const match = districts.find((d) => d.id === initialDistrictId);
      if (match) setSelectedDistrict(match);
    }
  }, [initialDistrictId, districts]);

  // Update user name if auth changes
  useEffect(() => {
    if (user?.name && !customName) {
      setCustomName(user.name);
    }
    if (user?.avatarUrl) {
      setCustomAvatarUrl(user.avatarUrl);
    }
  }, [user]);

  // Total visited count
  const visitedCount = localVisitedDistricts.size;
  const progressPercent = Math.round((visitedCount / 64) * 100);

  // Filter districts based on search
  const filteredDistrictsByDivision = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const map = new Map<string, District[]>();

    divisions.forEach((div) => {
      const divDistricts = districts.filter((d) => {
        if (d.divisionId !== div.id) return false;
        if (!q) return true;
        return (
          d.nameBn.toLowerCase().includes(q) ||
          d.nameEn.toLowerCase().includes(q) ||
          d.prominentDishBn.toLowerCase().includes(q) ||
          d.prominentDishEn.toLowerCase().includes(q)
        );
      });
      if (divDistricts.length > 0) {
        map.set(div.id, divDistricts);
      }
    });

    return map;
  }, [districts, divisions, searchQuery]);

  // Toggle district visited status
  const handleToggleDistrict = async (district: District) => {
    const isCurrentlyVisited = localVisitedDistricts.has(district.id);
    const updated = new Set(localVisitedDistricts);

    if (isCurrentlyVisited) {
      updated.delete(district.id);
      setLocalVisitedDistricts(updated);

      // If logged in, remove tried status from foods in this district
      if (isLoggedIn) {
        const districtFoods = foods.filter((f) => f.districtId === district.id);
        for (const food of districtFoods) {
          if (triedFoodIds.has(food.id)) {
            await removeFromJourney(food.id);
          }
        }
      }
    } else {
      updated.add(district.id);
      setLocalVisitedDistricts(updated);

      // If logged in, mark first food in this district as tried
      if (isLoggedIn) {
        const districtFoods = foods.filter((f) => f.districtId === district.id);
        if (districtFoods.length > 0) {
          await trackFood(districtFoods[0].id, 'tried', {
            triedAt: new Date().toISOString(),
          });
        }
      }
    }
  };

  // Select all districts in a division
  const handleSelectAllInDivision = (divId: string) => {
    const divDistricts = districts.filter((d) => d.divisionId === divId);
    setLocalVisitedDistricts((prev) => {
      const updated = new Set(prev);
      divDistricts.forEach((d) => updated.add(d.id));
      return updated;
    });
  };

  // Select all 64 districts
  const handleSelectAll = () => {
    setLocalVisitedDistricts(new Set(districts.map((d) => d.id)));
  };

  // Clear all
  const handleClearAll = () => {
    setLocalVisitedDistricts(new Set());
  };

  // Avatar file upload handler
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

  // Export functions (PNG, JPG, PDF)
  const handleDownload = async (format: 'png' | 'jpeg' | 'pdf') => {
    if (!cardExportRef.current) return;
    try {
      setIsExporting(true);
      setExportFeedback(language === 'bn' ? 'প্রস্তুত হচ্ছে...' : 'Generating...');

      // Options for html-to-image
      const options = {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: '#FAF7F2',
      };

      if (format === 'png') {
        const dataUrl = await toPng(cardExportRef.current, options);
        const link = document.createElement('a');
        link.download = `foodie-bd-map-${visitedCount}-of-64.png`;
        link.href = dataUrl;
        link.click();
      } else if (format === 'jpeg') {
        const dataUrl = await toJpeg(cardExportRef.current, { ...options, quality: 0.95 });
        const link = document.createElement('a');
        link.download = `foodie-bd-map-${visitedCount}-of-64.jpg`;
        link.href = dataUrl;
        link.click();
      } else if (format === 'pdf') {
        const dataUrl = await toJpeg(cardExportRef.current, { ...options, quality: 0.95 });
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
        });
        const imgProps = pdf.getImageProperties(dataUrl);
        const pdfWidth = pdf.internal.pageSize.getWidth() - 20;
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        pdf.addImage(dataUrl, 'JPEG', 10, 10, pdfWidth, pdfHeight);
        pdf.save(`foodie-bd-map-${visitedCount}-of-64.pdf`);
      }

      setExportFeedback(language === 'bn' ? 'ডাউনলোড সম্পন্ন!' : 'Downloaded successfully!');
      setTimeout(() => setExportFeedback(null), 3000);
    } catch (err) {
      console.error('Export error:', err);
      setExportFeedback(language === 'bn' ? 'ডাউনলোড ব্যর্থ হয়েছে।' : 'Export failed.');
      setTimeout(() => setExportFeedback(null), 3000);
    } finally {
      setIsExporting(false);
    }
  };

  // Selected district foods
  const selectedDistrictFoods = useMemo(() => {
    if (!selectedDistrict) return [];
    return foods.filter((f) => f.districtId === selectedDistrict.id);
  }, [selectedDistrict, foods]);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 space-y-4">
      {/* Top compact subheader */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white px-4 py-2.5 rounded-2xl border border-stone-200/90 shadow-2xs">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#155C3A] text-white flex items-center justify-center shadow-xs">
            <Utensils className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-extrabold text-stone-900 font-bengali leading-tight">
              {language === 'bn' ? 'আমার খাদক মানচিত্র' : 'My Foodie BD Map'}
            </h1>
            <p className="text-[11px] text-stone-500 font-bengali">
              {language === 'bn'
                ? '৬৪ জেলার মধ্যে যেসব অঞ্চলের ঐতিহ্যবাহী খাবার আপনি চেখে দেখেছেন চিহ্নিত করুন'
                : 'Highlight the districts where you have experienced traditional Bangladeshi delicacies'}
            </p>
          </div>
        </div>

        {/* Controls: Suggest Food & View mode toggle */}
        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setIsSubmissionModalOpen(true)}
            className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#155C3A] border border-emerald-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer font-bengali shadow-2xs"
          >
            <PlusCircle className="w-3.5 h-3.5 text-[#155C3A]" />
            <span>{language === 'bn' ? 'খাবার যোগ করার অনুরোধ' : 'Suggest a Food'}</span>
          </button>

          <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl text-xs">
            <button
              onClick={() => setViewMode('card')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer font-bengali ${
                viewMode === 'card'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {language === 'bn' ? 'খাদক কার্ড ভিউ' : 'Foodie Card View'}
            </button>
            <button
              onClick={() => setViewMode('leaflet')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer font-bengali ${
                viewMode === 'leaflet'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {language === 'bn' ? 'স্যাটেলাইট ভিউ' : 'Satellite Map'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout (Matching User Reference) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: District Checklist Sidebar (Col 4 / 12) */}
        <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-3xl border border-stone-200/90 p-4 sm:p-5 shadow-2xs space-y-4">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <h2 className="text-base font-bold text-stone-900 font-bengali flex items-center gap-2">
              <span>{language === 'bn' ? 'যেসব জেলায় খেয়েছি' : 'Districts Explored'}</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 font-sans">
              {visitedCount}/64
            </span>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'bn' ? 'জেলা খুঁজুন...' : 'Search districts...'}
              className="w-full pl-9 pr-8 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#155C3A] focus:bg-white transition-all font-bengali"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Global Quick Actions */}
          <div className="flex items-center gap-3 text-xs font-semibold text-stone-500 font-bengali">
            <button
              onClick={handleSelectAll}
              className="hover:text-[#155C3A] underline decoration-stone-300 underline-offset-2 transition-colors cursor-pointer"
            >
              {language === 'bn' ? 'সব বাছাই করুন' : 'Select All'}
            </button>
            <span>·</span>
            <button
              onClick={handleClearAll}
              className="hover:text-[#E74C3C] underline decoration-stone-300 underline-offset-2 transition-colors cursor-pointer"
            >
              {language === 'bn' ? 'সব মুছুন' : 'Clear All'}
            </button>
          </div>

          {/* Divisions and District Pills Container */}
          <div className="space-y-4 max-h-[620px] overflow-y-auto pr-1">
            {divisions.map((div) => {
              const divDistricts = filteredDistrictsByDivision.get(div.id) || [];
              if (divDistricts.length === 0) return null;

              const visitedInDiv = divDistricts.filter((d) =>
                localVisitedDistricts.has(d.id)
              ).length;

              return (
                <div key={div.id} className="space-y-2">
                  {/* Division Header with Visited Count and [সব বাছাই] */}
                  <div className="flex items-center justify-between text-xs font-bold text-stone-800 font-bengali">
                    <div className="flex items-center gap-1.5">
                      <span>{localizedName(div)} বিভাগ</span>
                      <span className="text-stone-400 font-sans font-normal text-[11px]">
                        {visitedInDiv}/{divDistricts.length}
                      </span>
                    </div>

                    <button
                      onClick={() => handleSelectAllInDivision(div.id)}
                      className="text-[11px] font-semibold text-stone-500 hover:text-[#155C3A] cursor-pointer"
                    >
                      {language === 'bn' ? 'সব বাছাই' : 'Select all'}
                    </button>
                  </div>

                  {/* District Pills Grid (Matching Reference Screenshot) */}
                  <div className="flex flex-wrap gap-1.5">
                    {divDistricts.map((district) => {
                      const isVisited = localVisitedDistricts.has(district.id);
                      const isSelected = selectedDistrict?.id === district.id;

                      return (
                        <button
                          key={district.id}
                          onClick={() => handleToggleDistrict(district)}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            setSelectedDistrict(district);
                          }}
                          style={{
                            backgroundColor: isVisited ? selectedThemeHex : undefined,
                          }}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 cursor-pointer select-none font-bengali flex items-center gap-1 shadow-2xs ${
                            isVisited
                              ? 'text-white font-bold'
                              : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                          } ${isSelected ? 'ring-2 ring-[#E74C3C] ring-offset-1' : ''}`}
                          title={`${localizedName(district)} (${localizedDish(district)})`}
                        >
                          {isVisited && <Check className="w-3 h-3 stroke-[3]" />}
                          <span>{localizedName(district)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Customization + The Map Card + Downloads (Col 7-8 / 12) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          {viewMode === 'card' ? (
            <>
              {/* Top Customization Bar (Color Swatches & Profile Options) */}
              <div className="bg-white rounded-2xl border border-stone-200/90 p-3 shadow-2xs flex flex-wrap items-center justify-between gap-3">
                {/* 5 Theme Color Circles */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-stone-600 font-bengali mr-1">
                    {language === 'bn' ? 'থিম রঙ:' : 'Theme:'}
                  </span>
                  {THEME_COLORS.map((t) => {
                    const isSelected = selectedThemeHex === t.hex;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setSelectedThemeHex(t.hex)}
                        style={{ backgroundColor: t.hex }}
                        className={`w-6 h-6 rounded-full transition-all cursor-pointer ${
                          isSelected
                            ? 'ring-2 ring-offset-2 ring-stone-900 scale-110 shadow-xs'
                            : 'hover:scale-105 opacity-90'
                        }`}
                        title={t.name}
                        aria-label={`Select ${t.name} color`}
                      />
                    );
                  })}
                </div>

                {/* Profile Controls */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {/* Photo upload trigger */}
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
                    <span>{language === 'bn' ? 'আপনার ছবি যোগ করুন' : 'Add Photo'}</span>
                  </button>

                  {/* Name input */}
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder={language === 'bn' ? 'আপনার নাম (ঐচ্ছিক)' : 'Your Name'}
                    className="px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-full text-stone-800 text-xs focus:outline-none focus:ring-1 focus:ring-[#155C3A] font-bengali w-36 sm:w-44"
                  />


                  {/* District names checkbox */}
                  <label
                    htmlFor="toggle-district-names"
                    className="flex items-center gap-1.5 text-stone-700 hover:text-stone-900 cursor-pointer select-none font-bengali font-medium bg-stone-100/90 hover:bg-stone-100 px-3 py-1.5 rounded-full border border-stone-300 transition-colors shadow-2xs"
                  >
                    <input
                      type="checkbox"
                      id="toggle-district-names"
                      checked={showDistrictNames}
                      onChange={(e) => setShowDistrictNames(e.target.checked)}
                      className="w-3.5 h-3.5 rounded text-[#155C3A] focus:ring-[#155C3A] accent-[#155C3A] cursor-pointer"
                    />
                    <span>{language === 'bn' ? 'জেলার নাম' : 'District Names'}</span>
                  </label>
                </div>
              </div>

              {/* The Map Card (Visual Centerpiece matching reference screenshot) */}
              <div
                ref={cardExportRef}
                className="bg-[#FAF7F2] rounded-3xl border border-[#E8E2D5] p-6 sm:p-8 shadow-xs flex flex-col justify-between relative overflow-hidden select-none"
                style={{ minHeight: '620px' }}
              >
                {/* Card Header */}
                <div className="flex items-start justify-between gap-4 pb-2 z-10">
                  <div>
                    {/* Official Foodie BD Brand Logo */}
                    <div className="flex items-center gap-2 mb-1.5">
                      <img
                        src="/foodie-bd-logo.svg"
                        alt="Foodie BD"
                        className="h-7 sm:h-8 md:h-9 w-auto max-w-[140px] sm:max-w-[180px] object-contain shrink-0"
                      />
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-black text-stone-900 font-bengali tracking-tight mt-0.5">
                      {language === 'bn' ? 'আমার বাংলাদেশ' : 'My Bangladesh'}
                    </h2>

                    {/* Optional User Attribution */}
                    {customName && (
                      <div className="flex items-center gap-2 mt-1.5">
                        <img
                          src={customAvatarUrl}
                          alt={customName}
                          className="w-5 h-5 rounded-full object-cover ring-1 ring-stone-300"
                        />
                        <span className="text-xs font-bold text-stone-700 font-bengali">
                          {customName}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Big Counter on right (Theme Colored) */}
                  <div className="text-right">
                    <div
                      className="text-3xl sm:text-4xl font-black tracking-tight font-sans leading-none"
                      style={{ color: selectedThemeHex }}
                    >
                      {visitedCount}
                      <span className="text-stone-400 text-lg sm:text-xl font-normal">/64</span>
                    </div>
                    <span className="text-[10px] sm:text-xs font-bold text-stone-500 font-bengali">
                      {language === 'bn' ? 'জেলা সম্পন্ন' : 'Districts Tasted'}
                    </span>
                  </div>
                </div>

                {/* Central Accurate Vector Map */}
                <div className="w-full my-auto py-2 flex items-center justify-center">
                  <BangladeshSvgMap
                    districts={districts}
                    visitedDistrictIds={localVisitedDistricts}
                    selectedDistrict={selectedDistrict}
                    onSelectDistrict={(d) => setSelectedDistrict(d)}
                    themeColor={selectedThemeHex}
                    showLabels={showDistrictNames}
                    showFoodMarkers={true}
                    foods={foods}
                    interactive={true}
                    className="w-full max-w-[560px]"
                  />
                </div>

                {/* Card Footer (Progress bar, tagline, instructions) */}
                <div className="pt-4 border-t border-stone-200/60 space-y-3 z-10">
                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-bold text-stone-600 font-bengali">
                      <span>{progressPercent}% {language === 'bn' ? 'সম্পূর্ণ হয়েছে' : 'Completed'}</span>
                      <span className="text-stone-400">
                        {64 - visitedCount} {language === 'bn' ? 'জেলা বাকি' : 'remaining'}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-stone-200/80 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.max(2, progressPercent)}%`,
                          backgroundColor: selectedThemeHex,
                        }}
                      />
                    </div>
                  </div>

                  {/* Tagline with Foodie BD branding */}
                  <div className="flex items-center justify-between text-xs text-stone-500 font-bengali pt-1">
                    <div className="flex items-center gap-1.5 font-bold text-[#155C3A]">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedThemeHex }} />
                      <span>{language === 'bn' ? 'খাদ্যযাত্রায় থাকুন ফুডি বিডি এর সাথে' : 'Food journey with Foodie BD'}</span>
                    </div>
                    <span className="text-[10px] text-stone-400 hidden sm:inline">
                      {language === 'bn'
                        ? 'ম্যাপের জেলায় ক্লিক করে স্থানীয় খাবার তালিকা ও রেসিপি দেখুন'
                        : 'Click any district to view authentic regional foods'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Download Section (Matching Reference Buttons) */}
              <div className="bg-white rounded-2xl border border-stone-200/90 p-4 sm:p-5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-stone-900 font-bengali flex items-center gap-2">
                    <Download className="w-4 h-4 text-[#155C3A]" />
                    <span>{language === 'bn' ? 'আপনার ম্যাপ ডাউনলোড করুন' : 'Download Your Map'}</span>
                  </h3>
                  {exportFeedback && (
                    <span className="text-xs font-semibold text-[#155C3A] animate-fade-in font-bengali">
                      {exportFeedback}
                    </span>
                  )}
                </div>

                {/* 3 Download Pill Buttons: PNG, JPG, PDF */}
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => handleDownload('png')}
                    disabled={isExporting}
                    className="py-2.5 px-4 rounded-xl border border-stone-200 text-stone-800 hover:border-[#155C3A] hover:bg-emerald-50/50 hover:text-[#155C3A] text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer disabled:opacity-50"
                  >
                    <span>↓ PNG</span>
                  </button>

                  <button
                    onClick={() => handleDownload('jpeg')}
                    disabled={isExporting}
                    className="py-2.5 px-4 rounded-xl border border-stone-200 text-stone-800 hover:border-[#155C3A] hover:bg-emerald-50/50 hover:text-[#155C3A] text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer disabled:opacity-50"
                  >
                    <span>↓ JPG</span>
                  </button>

                  <button
                    onClick={() => handleDownload('pdf')}
                    disabled={isExporting}
                    className="py-2.5 px-4 rounded-xl border border-stone-200 text-stone-800 hover:border-[#155C3A] hover:bg-emerald-50/50 hover:text-[#155C3A] text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer disabled:opacity-50"
                  >
                    <span>↓ PDF</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* Alternate Leaflet Interactive Map View */
            <div className="bg-white rounded-3xl border border-stone-200/90 p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                <span className="text-xs font-bold text-stone-800 font-bengali">
                  {language === 'bn' ? 'সম্পূর্ণ ইন্টারঅ্যাক্টিভ স্যাটেলাইট মানচিত্র' : 'Interactive Satellite Map'}
                </span>
                <button
                  onClick={() => setViewMode('card')}
                  className="text-xs font-bold text-[#155C3A] hover:underline cursor-pointer font-bengali"
                >
                  ← {language === 'bn' ? 'কার্ড ভিউতে ফিরে যান' : 'Back to Card View'}
                </button>
              </div>

              <div className="h-[640px] w-full rounded-2xl overflow-hidden">
                <BangladeshMap
                  districts={districts}
                  divisions={divisions}
                  foods={foods}
                  selectedDistrict={selectedDistrict}
                  selectedDivisionId="all"
                  theme="light"
                  showDistrictNames={showDistrictNames}
                  onSelectDistrict={(d) => setSelectedDistrict(d)}
                  onSelectFood={(foodId) => navigate('food', foodId)}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Selected District Details Modal / Sliding Bottom Sheet */}
      {selectedDistrict && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-stone-200 space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 pb-3 border-b border-stone-100">
              <div>
                <div className="flex items-center gap-2 text-xs text-stone-500 font-medium">
                  <span className="text-[#155C3A] font-bold uppercase tracking-wider">
                    {divisions.find((d) => d.id === selectedDistrict.divisionId)?.nameEn || selectedDistrict.divisionId}
                  </span>
                  <span>·</span>
                  <span>GPS: {selectedDistrict.lat.toFixed(2)}° N, {selectedDistrict.lng.toFixed(2)}° E</span>
                </div>
                <h3 className="text-2xl font-black text-stone-900 font-bengali mt-0.5">
                  {localizedName(selectedDistrict)} {language === 'bn' ? 'জেলা' : 'District'}
                </h3>
              </div>

              <button
                onClick={() => setSelectedDistrict(null)}
                className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Prominent Dish Highlight Banner */}
            <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/70 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold text-amber-900 uppercase tracking-wider font-bengali">
                  {language === 'bn' ? 'ঐতিহ্যবাহী বিখ্যাত খাবার' : 'Iconic Delicacy'}
                </p>
                <p className="text-base font-bold text-[#155C3A] font-bengali mt-0.5">
                  {localizedDish(selectedDistrict)}
                </p>
                <p className="text-xs text-stone-600 line-clamp-1">
                  {language === 'bn' ? selectedDistrict.prominentDishEn : selectedDistrict.prominentDishBn}
                </p>
              </div>

              {/* Toggle Visited Button */}
              <button
                onClick={() => handleToggleDistrict(selectedDistrict)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer font-bengali shrink-0 ${
                  localVisitedDistricts.has(selectedDistrict.id)
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white border border-stone-300 text-stone-700 hover:bg-stone-50'
                }`}
              >
                {localVisitedDistricts.has(selectedDistrict.id)
                  ? (language === 'bn' ? '✓ চেখে দেখেছি' : '✓ Tasted')
                  : (language === 'bn' ? '+ স্বাদ গ্রহণ করেছি' : '+ Mark as Tasted')}
              </button>
            </div>

            {/* District Foods List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-stone-900 font-bengali">
                  {language === 'bn' ? 'এই জেলার খাঁটি ঐতিহ্যবাহী খাবার' : 'Authentic District Dishes'} ({selectedDistrictFoods.length})
                </h4>
                <button
                  onClick={() => navigate('district', selectedDistrict.id)}
                  className="text-xs font-bold text-[#155C3A] hover:underline cursor-pointer font-bengali"
                >
                  {language === 'bn' ? 'পূর্ণাঙ্গ পাতা দেখুন →' : 'View Full Page →'}
                </button>
              </div>

              {selectedDistrictFoods.length === 0 ? (
                <div className="p-6 text-center text-xs text-stone-500 bg-stone-50 rounded-2xl border border-stone-100 font-bengali">
                  {language === 'bn'
                    ? 'এই জেলার খাবার তালিকা শীঘ্রই আপডেট করা হবে।'
                    : 'Food catalog for this district is being updated.'}
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedDistrictFoods.map((food) => {
                    const tried = triedFoodIds.has(food.id);
                    const wanted = wantToTryFoodIds.has(food.id);

                    return (
                      <div
                        key={food.id}
                        className="p-3 rounded-2xl border border-stone-200 hover:border-stone-300 bg-white flex items-center justify-between gap-3 transition-colors shadow-2xs"
                      >
                        <div
                          onClick={() => navigate('food', food.id)}
                          className="flex items-center gap-3 cursor-pointer flex-1"
                        >
                          <div className="w-12 h-12 rounded-xl overflow-hidden ring-1 ring-stone-200 shrink-0">
                            <FoodImage
                              src={food.imageUrl}
                              alt={localizedName(food)}
                              className="w-full h-full object-cover"
                              containerClassName="w-full h-full relative overflow-hidden bg-stone-100"
                              loading="lazy"
                            />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-stone-900 font-bengali hover:text-[#155C3A] transition-colors">
                              {localizedName(food)}
                            </p>
                            <p className="text-[11px] text-stone-500 line-clamp-1">
                              {food.shortDescription}
                            </p>
                            {food.approximatePriceBdt ? (
                              <p className="text-[10px] text-stone-400 mt-0.5">
                                ৳{food.approximatePriceBdt}
                              </p>
                            ) : null}
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={async () => {
                              if (!isLoggedIn) {
                                navigate('login');
                                return;
                              }
                              if (wanted) {
                                await removeFromJourney(food.id);
                              } else {
                                await trackFood(food.id, 'want_to_try');
                              }
                            }}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              wanted
                                ? 'bg-amber-100 border-amber-300 text-amber-800'
                                : 'border-stone-200 text-stone-500 hover:bg-stone-50'
                            }`}
                            title={wanted ? 'In Wishlist' : 'Add to Wishlist'}
                          >
                            <Bookmark className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={async () => {
                              if (!isLoggedIn) {
                                navigate('login');
                                return;
                              }
                              if (tried) {
                                await removeFromJourney(food.id);
                              } else {
                                await trackFood(food.id, 'tried', {
                                  triedAt: new Date().toISOString(),
                                });
                              }
                            }}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer font-bengali ${
                              tried
                                ? 'bg-[#155C3A] text-white shadow-2xs'
                                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                            }`}
                          >
                            {tried ? (language === 'bn' ? '✓ চেখেছি' : '✓ Tried') : (language === 'bn' ? 'চেখেছি' : 'Tried')}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedDistrict(null)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl cursor-pointer font-bengali"
              >
                {language === 'bn' ? 'বন্ধ করুন' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suggest Food Modal */}
      <FoodSubmissionModal
        isOpen={isSubmissionModalOpen}
        onClose={() => setIsSubmissionModalOpen(false)}
        initialDistrictId={selectedDistrict?.id}
        districts={districts}
        divisions={divisions}
        navigate={navigate}
      />
    </div>
  );
};
