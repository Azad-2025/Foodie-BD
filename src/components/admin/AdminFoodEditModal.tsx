import React, { useState, useEffect, useMemo } from 'react';
import { Food, District, Division, FoodCategory } from '../../types';
import { FOOD_CATEGORIES } from '../../data/divisionsAndDistricts';
import { api } from '../../lib/api';
import { useLanguage } from '../../i18n';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Image as ImageIcon,
  ShieldCheck,
  Save,
  RotateCcw,
  ExternalLink,
  AlertCircle,
  Link2,
} from 'lucide-react';
import { analyzeImageUrl, normalizeImageUrl, isValidFoodImageReference } from '../../lib/imageUrlHelper';
import { FoodImageUpload } from '../common/FoodImageUpload';

interface AdminFoodEditModalProps {
  isOpen: boolean;
  food: Food | null;
  districts: District[];
  divisions: Division[];
  onClose: () => void;
  onSaved: (updatedFood: Food) => void;
  onNavigateToCatalog?: (foodId: string) => void;
}

export const AdminFoodEditModal: React.FC<AdminFoodEditModalProps> = ({
  isOpen,
  food,
  districts,
  divisions,
  onClose,
  onSaved,
  onNavigateToCatalog,
}) => {
  const { language, t } = useLanguage();

  const [nameBn, setNameBn] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [districtId, setDistrictId] = useState('');
  const [category, setCategory] = useState<FoodCategory>('traditional');
  const [dietaryType, setDietaryType] = useState<'non-veg' | 'veg' | 'sweet'>('non-veg');
  const [approximatePriceBdt, setApproximatePriceBdt] = useState<string>('0');
  const [imageUrl, setImageUrl] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [detailedDescription, setDetailedDescription] = useState('');
  const [originHistory, setOriginHistory] = useState('');
  const [originSource, setOriginSource] = useState('');
  const [isPublished, setIsPublished] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showDiscardPrompt, setShowDiscardPrompt] = useState(false);
  const [imageLoadStatus, setImageLoadStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const imageAnalysis = useMemo(() => analyzeImageUrl(imageUrl), [imageUrl]);

  useEffect(() => {
    const trimmed = imageUrl.trim();
    if (!trimmed) {
      setImageLoadStatus('idle');
      return;
    }

    if (!isValidFoodImageReference(trimmed)) {
      setImageLoadStatus('error');
      return;
    }

    setImageLoadStatus('loading');
    const img = new Image();
    img.onload = () => setImageLoadStatus('success');
    img.onerror = () => setImageLoadStatus('error');
    img.src = trimmed;
  }, [imageUrl]);

  // Sync state whenever selected food changes
  useEffect(() => {
    if (food) {
      setNameBn(food.nameBn || '');
      setNameEn(food.nameEn || '');
      setDistrictId(food.districtId || '');
      setCategory(food.category || 'traditional');
      setDietaryType(food.dietaryType || 'non-veg');
      setApproximatePriceBdt(String(food.approximatePriceBdt ?? 0));
      setImageUrl(food.imageUrl || '');
      setShortDescription(food.shortDescription || '');
      setDetailedDescription(food.detailedDescription || '');
      setOriginHistory(food.originHistory || '');
      setOriginSource(food.originSource || '');
      setIsPublished(Boolean(food.isPublished));
      setErrorMessage(null);
      setSuccessMessage(null);
      setShowDiscardPrompt(false);
    }
  }, [food, isOpen]);

  // Track if changes have been made
  const isDirty = useMemo(() => {
    if (!food) return false;
    return (
      nameBn !== (food.nameBn || '') ||
      nameEn !== (food.nameEn || '') ||
      districtId !== (food.districtId || '') ||
      category !== (food.category || 'traditional') ||
      dietaryType !== (food.dietaryType || 'non-veg') ||
      approximatePriceBdt !== String(food.approximatePriceBdt ?? 0) ||
      imageUrl !== (food.imageUrl || '') ||
      shortDescription !== (food.shortDescription || '') ||
      detailedDescription !== (food.detailedDescription || '') ||
      originHistory !== (food.originHistory || '') ||
      originSource !== (food.originSource || '') ||
      isPublished !== Boolean(food.isPublished)
    );
  }, [
    food,
    nameBn,
    nameEn,
    districtId,
    category,
    dietaryType,
    approximatePriceBdt,
    imageUrl,
    shortDescription,
    detailedDescription,
    originHistory,
    originSource,
    isPublished,
  ]);

  const activeDivision = useMemo(() => {
    const d = districts.find((x) => x.id === districtId);
    return divisions.find((div) => div.id === d?.divisionId);
  }, [districtId, districts, divisions]);

  if (!isOpen || !food) return null;

  const handleAttemptClose = () => {
    if (isDirty) {
      setShowDiscardPrompt(true);
    } else {
      onClose();
    }
  };

  const handleConfirmDiscard = () => {
    setShowDiscardPrompt(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validation 1: Required fields
    if (!nameBn.trim()) {
      setErrorMessage(
        language === 'bn' ? 'খাবারের বাংলা নাম আবশ্যক।' : 'Bengali food name (বাংলা নাম) is required.'
      );
      return;
    }
    if (!nameEn.trim()) {
      setErrorMessage(
        language === 'bn' ? 'খাবারের ইংরেজি নাম আবশ্যক।' : 'English food name is required.'
      );
      return;
    }
    if (!districtId) {
      setErrorMessage(language === 'bn' ? 'জেলা নির্বাচন করুন।' : 'Please select a district.');
      return;
    }

    // Validation 2: Image URL format
    const cleanImageUrl = normalizeImageUrl(imageUrl);
    if (cleanImageUrl) {
      const analysis = analyzeImageUrl(cleanImageUrl);
      if (!analysis.isValid) {
        setErrorMessage(
          analysis.error ||
            (language === 'bn' ? 'ছবির লিংকটি অবৈধ।' : 'Invalid food image URL.')
        );
        return;
      }
    }

    const payload: Partial<Food> = {
      nameBn: nameBn.trim(),
      nameEn: nameEn.trim(),
      districtId,
      divisionId: activeDivision?.id || food.divisionId,
      category,
      dietaryType,
      approximatePriceBdt: Math.max(0, Number(approximatePriceBdt) || 0),
      imageUrl: cleanImageUrl || food.imageUrl,
      shortDescription: shortDescription.trim(),
      detailedDescription: detailedDescription.trim() || shortDescription.trim(),
      originHistory: originHistory.trim(),
      originSource: originSource.trim(),
      isPublished,
    };

    try {
      setIsSubmitting(true);
      const updated = await api.updateFood(food.id, payload);
      setSuccessMessage(
        language === 'bn'
          ? 'খাবারের তথ্য সফলভাবে হালনাগাদ করা হয়েছে।'
          : 'Food details updated successfully in the catalog.'
      );
      setTimeout(() => {
        onSaved(updated);
        onClose();
      }, 900);
    } catch (err: any) {
      setErrorMessage(
        err.message ||
          (language === 'bn' ? 'খাবার আপডেট করতে ব্যর্থ হয়েছে।' : 'Failed to update food record.')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-amber-900/10 overflow-hidden my-auto">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-900 via-[#155C3A] to-emerald-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md">
              <ShieldCheck className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold font-bengali">
                  {language === 'bn' ? 'খাবার সম্পাদনা করুন (Admin Edit)' : 'Admin Edit Food Delicacy'}
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/20 text-emerald-100">
                  {food.id}
                </span>
              </div>
              <p className="text-xs text-emerald-200/90 font-medium">
                {language === 'bn'
                  ? 'ক্যাটালগের সকল তথ্য সম্পাদনা ও তাৎক্ষণিক সংরক্ষণ'
                  : 'Modify official catalog fields with server-side validation'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleAttemptClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Feedback banners */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2.5 text-xs text-red-700 font-medium font-bengali">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mx-6 mt-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-800 font-medium font-bengali">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Row 1: Bengali & English Names */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 font-bengali">
                {language === 'bn' ? 'খাবারের নাম (বাংলা) *' : 'Food Name (Bengali) *'}
              </label>
              <input
                type="text"
                required
                value={nameBn}
                onChange={(e) => setNameBn(e.target.value)}
                placeholder="যেমন: বগুড়ার দই"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#155C3A] font-bengali outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {language === 'bn' ? 'খাবারের নাম (ইংরেজি) *' : 'Food Name (English) *'}
              </label>
              <input
                type="text"
                required
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                placeholder="e.g. Bogura Doi"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#155C3A] outline-none"
              />
            </div>
          </div>

          {/* Row 2: District & Division */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 font-bengali">
                {language === 'bn' ? 'জেলা (District) *' : 'District *'}
              </label>
              <select
                value={districtId}
                onChange={(e) => setDistrictId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#155C3A] outline-none"
              >
                {districts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {language === 'bn' ? `${d.nameBn} (${d.nameEn})` : `${d.nameEn} (${d.nameBn})`} ·{' '}
                    {d.divisionId.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 font-bengali">
                {language === 'bn' ? 'বিভাগ (Division - অটো)' : 'Division (Auto-assigned)'}
              </label>
              <div className="w-full px-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-xl text-slate-700 font-semibold flex items-center">
                {activeDivision
                  ? language === 'bn'
                    ? `${activeDivision.nameBn} বিভাগ (${activeDivision.nameEn})`
                    : `${activeDivision.nameEn} Division`
                  : 'Auto'}
              </div>
            </div>
          </div>

          {/* Row 3: Category, Dietary, Price */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 font-bengali">
                {language === 'bn' ? 'ক্যাটাগরি (ধরন)' : 'Food Category'}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as FoodCategory)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#155C3A] outline-none font-bengali"
              >
                {FOOD_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {language === 'bn' ? `${c.nameBn} (${c.nameEn})` : `${c.nameEn} (${c.nameBn})`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 font-bengali">
                {language === 'bn' ? 'আহারের ধরন (Dietary)' : 'Dietary Preference'}
              </label>
              <select
                value={dietaryType}
                onChange={(e) => setDietaryType(e.target.value as 'non-veg' | 'veg' | 'sweet')}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#155C3A] outline-none"
              >
                <option value="non-veg">Non-Veg (আমিষ)</option>
                <option value="veg">Vegetarian (নিরামিষ)</option>
                <option value="sweet">Sweet / Mishti (মিষ্টি)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 font-bengali">
                {language === 'bn' ? 'আনুমানিক দাম (টাকা ৳)' : 'Price in BDT (৳)'}
              </label>
              <input
                type="number"
                min="0"
                value={approximatePriceBdt}
                onChange={(e) => setApproximatePriceBdt(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#155C3A] outline-none"
              />
            </div>
          </div>

          {/* Row 4: Food Image Direct Upload */}
          <FoodImageUpload
            value={imageUrl}
            onChange={setImageUrl}
            context="food"
            targetId={food?.id}
            label={language === 'bn' ? 'খাবারের ছবি (ছবি আপলোড করুন)' : 'Food Image (Direct Upload)'}
          />

          {/* Row 5: Short Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 font-bengali">
              {language === 'bn' ? 'সংক্ষিপ্ত বিবরণ (Short Description)' : 'Short Description'}
            </label>
            <textarea
              rows={2}
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder={
                language === 'bn'
                  ? 'খাবারটির সংক্ষিপ্ত স্বাদ ও বিশেষত্ব...'
                  : 'Brief culinary summary of this authentic dish...'
              }
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#155C3A] font-bengali outline-none"
            />
          </div>

          {/* Row 6: Detailed Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 font-bengali">
              {language === 'bn' ? 'বিস্তারিত বিবরণ ও প্রস্তুতপ্রণালী' : 'Detailed Description & Sensory Notes'}
            </label>
            <textarea
              rows={3}
              value={detailedDescription}
              onChange={(e) => setDetailedDescription(e.target.value)}
              placeholder={
                language === 'bn'
                  ? 'ঐতিহ্যবাহী রন্ধনপ্রণালী ও স্বাদ পরিচিতি...'
                  : 'Authentic preparation, serving tradition, and tasting details...'
              }
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#155C3A] font-bengali outline-none"
            />
          </div>

          {/* Row 7: Historical origin & Source citations */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 font-bengali">
                {language === 'bn' ? 'ঐতিহাসিক পটভূমি ও রন্ধনগাথা' : 'Historical Origin & Lore'}
              </label>
              <textarea
                rows={2}
                value={originHistory}
                onChange={(e) => setOriginHistory(e.target.value)}
                placeholder={
                  language === 'bn'
                    ? 'খাবারটির উৎপত্তির শতবর্ষী ইতিহাস...'
                    : 'Historical origin and legacy of this heritage dish...'
                }
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#155C3A] font-bengali outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 font-bengali">
                {language === 'bn' ? 'তথ্যসূত্র ও উৎস (Source Citation)' : 'Origin Source Citation'}
              </label>
              <textarea
                rows={2}
                value={originSource}
                onChange={(e) => setOriginSource(e.target.value)}
                placeholder={
                  language === 'bn'
                    ? 'যেমন: বাংলা একাডেমি লোকজ সংস্কৃতি সংগ্রহ...'
                    : 'e.g. Bangladesh Folk Heritage Archive, District Gazetteer...'
                }
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#155C3A] font-bengali outline-none"
              />
            </div>
          </div>

          {/* Row 8: Publication Status toggle */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <input
                id="modal-food-is-published"
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="w-4 h-4 rounded text-[#155C3A] focus:ring-[#155C3A] cursor-pointer"
              />
              <label htmlFor="modal-food-is-published" className="cursor-pointer">
                <span className="block text-xs font-bold text-slate-900 font-bengali">
                  {language === 'bn'
                    ? 'সর্বসাধারণের জন্য প্রকাশিত (Published Catalog Item)'
                    : 'Publicly Visible (Published Catalog Item)'}
                </span>
                <span className="block text-[11px] text-slate-500 font-medium font-bengali">
                  {language === 'bn'
                    ? 'আনচেক করলে খাবারটি ড্রাফট হিসেবে সাধারণ ব্যবহারকারীদের থেকে লুকানো থাকবে।'
                    : 'When unchecked, this item remains a draft hidden from regular public discovery.'}
                </span>
              </label>
            </div>
            <span
              className={`px-2.5 py-1 rounded-lg text-xs font-bold self-start sm:self-center font-bengali ${
                isPublished
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-amber-100 text-amber-800 border border-amber-200'
              }`}
            >
              {isPublished
                ? language === 'bn'
                  ? 'প্রকাশিত'
                  : 'Published'
                : language === 'bn'
                ? 'ড্রাফট (অপ্রকাশিত)'
                : 'Draft (Hidden)'}
            </span>
          </div>

          {/* Row 9: Actions (Cancel, Save Changes, Manage in Catalog) */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {onNavigateToCatalog ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateToCatalog(food.id);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#155C3A] transition-colors cursor-pointer font-bengali"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>
                  {language === 'bn'
                    ? 'অ্যাডমিন ড্যাশবোর্ডে সম্পূর্ণ তালিকা খুলুন'
                    : 'Manage in Admin Catalog View'}
                </span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={handleAttemptClose}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer font-bengali"
              >
                {language === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-[#155C3A] hover:bg-[#0e442a] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-2 font-bengali disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>{language === 'bn' ? 'সংরক্ষণ হচ্ছে...' : 'Saving Changes...'}</span>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{language === 'bn' ? 'পরিবর্তন সংরক্ষণ করুন' : 'Save Changes'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Unsaved Changes Confirmation Modal */}
        {showDiscardPrompt && (
          <div className="absolute inset-0 z-60 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl border border-amber-900/10 space-y-4">
              <div className="flex items-center gap-3 text-amber-600">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <h4 className="text-sm font-bold text-slate-900 font-bengali">
                  {language === 'bn' ? 'অসংরক্ষিত পরিবর্তন রয়েছে' : 'Unsaved Changes'}
                </h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-bengali">
                {language === 'bn'
                  ? 'আপনার কিছু পরিবর্তন এখনো সংরক্ষিত হয়নি। আপনি কি নিশ্চিত যে পরিবর্তনগুলো বাতিল করে বন্ধ করতে চান?'
                  : 'You have unsaved changes in this food record. Are you sure you want to discard them?'}
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDiscardPrompt(false)}
                  className="px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer font-bengali"
                >
                  {language === 'bn' ? 'সম্পাদনায় ফিরে যান' : 'Keep Editing'}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDiscard}
                  className="px-3.5 py-1.5 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg cursor-pointer font-bengali"
                >
                  {language === 'bn' ? 'বাতিল করুন' : 'Discard Changes'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
