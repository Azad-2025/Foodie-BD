import React, { useState, useEffect, useMemo } from 'react';
import { FoodSubmission, District, Division, FoodCategory } from '../../types';
import { FOOD_CATEGORIES } from '../../data/divisionsAndDistricts';
import { api } from '../../lib/api';
import { useLanguage } from '../../i18n';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Image as ImageIcon,
  Send,
  ExternalLink,
  AlertCircle,
  Link2,
  LogIn,
  UserPlus,
  Sparkles,
  Check,
} from 'lucide-react';
import { analyzeImageUrl, normalizeImageUrl, isValidFoodImageReference } from '../../lib/imageUrlHelper';
import { FoodImageUpload } from '../common/FoodImageUpload';

export interface FoodSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDistrictId?: string;
  districts: District[];
  divisions: Division[];
  onSuccess?: (submission: FoodSubmission) => void;
  navigate: (route: string, param?: string) => void;
}

export const FoodSubmissionModal: React.FC<FoodSubmissionModalProps> = ({
  isOpen,
  onClose,
  initialDistrictId,
  districts,
  divisions,
  onSuccess,
  navigate,
}) => {
  const { language, localizedName } = useLanguage();
  const { isLoggedIn, user } = useAuth();

  const [nameBn, setNameBn] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [districtId, setDistrictId] = useState(initialDistrictId || 'dhaka');
  const [category, setCategory] = useState<FoodCategory>('traditional');
  const [dietaryType, setDietaryType] = useState<'non-veg' | 'veg' | 'sweet'>('non-veg');
  const [approximatePriceBdt, setApproximatePriceBdt] = useState<string>('150');
  const [imageUrl, setImageUrl] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [detailedDescription, setDetailedDescription] = useState('');
  const [originHistory, setOriginHistory] = useState('');
  const [originSource, setOriginSource] = useState('');
  const [accurateInfoConfirmed, setAccurateInfoConfirmed] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<{
    message: string;
    existingCatalogId?: string;
    existingPendingId?: string;
  } | null>(null);
  const [submissionSuccess, setSubmissionSuccess] = useState<FoodSubmission | null>(null);
  const [imageLoadStatus, setImageLoadStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  // Reset or initialize when opened
  useEffect(() => {
    if (isOpen) {
      if (initialDistrictId && districts.some((d) => d.id === initialDistrictId)) {
        setDistrictId(initialDistrictId);
      } else if (!districtId && districts.length > 0) {
        setDistrictId(districts[0].id);
      }
      setErrorMessage(null);
      setDuplicateWarning(null);
      setSubmissionSuccess(null);
    }
  }, [isOpen, initialDistrictId, districts]);

  // Image load preview
  const imageAnalysis = useMemo(() => analyzeImageUrl(imageUrl), [imageUrl]);

  useEffect(() => {
    const trimmed = normalizeImageUrl(imageUrl);
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

  if (!isOpen) return null;

  const currentDistrict = districts.find((d) => d.id === districtId);
  const currentDivision = currentDistrict
    ? divisions.find((div) => div.id === currentDistrict.divisionId)
    : null;

  // Guest view - prompt to login / register
  if (!isLoggedIn) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 text-center space-y-5 shadow-2xl border border-amber-900/10">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#155C3A] flex items-center justify-center mx-auto shadow-inner">
            <Sparkles className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-black text-slate-900 font-bengali">
              {language === 'bn' ? 'খাবার যোগ করার অনুরোধ' : 'Suggest a Regional Food'}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed font-bengali">
              {language === 'bn'
                ? 'বাংলাদেশের ঐতিহ্যবাহী আঞ্চলিক খাবারের তালিকা সমৃদ্ধ করতে এবং পর্যালোচনার জন্য জমা দিতে অনুগ্রহ করে লগইন করুন অথবা নতুন অ্যাকাউন্ট তৈরি করুন।'
                : 'To suggest authentic regional foods for verification and inclusion in Foodie BD, please log in or create a free account.'}
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate('login');
              }}
              className="flex-1 py-2.5 px-4 bg-[#155C3A] hover:bg-[#10482d] text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>{language === 'bn' ? 'লগইন করুন' : 'Sign In'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate('register');
              }}
              className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>{language === 'bn' ? 'নিবন্ধন করুন' : 'Register'}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-slate-600 font-medium transition-colors pt-2"
          >
            {language === 'bn' ? 'বাতিল' : 'Cancel'}
          </button>
        </div>
      </div>
    );
  }

  // Submission success state
  if (submissionSuccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-emerald-500/20 text-center">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto ring-8 ring-emerald-50">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200/60 uppercase">
              {language === 'bn' ? 'পর্যালোচনার অপেক্ষায় (Pending Review)' : 'Status: Pending Review'}
            </span>
            <h3 className="text-xl font-black text-slate-900 font-bengali">
              {language === 'bn' ? 'আপনার অনুরোধ সফলভাবে জমা হয়েছে!' : 'Food Suggestion Submitted!'}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed font-bengali max-w-md mx-auto">
              {language === 'bn'
                ? `ধন্যবাদ ${user?.name || ''}! "${submissionSuccess.nameBn}" খাবারটির তথ্য সফলভাবে সংরক্ষিত হয়েছে। ফুডি বিডি অ্যাডমিন টিম তথ্যটি যাচাই করে ক্যাটালগে যুক্ত করবেন।`
                : `Thank you ${user?.name || ''}! "${submissionSuccess.nameEn}" has been submitted for verification. An administrator will review your notes and sources before publishing.`}
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl text-left space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-500">
              <span>{language === 'bn' ? 'রেফারেন্স আইডি:' : 'Reference ID:'}</span>
              <span className="font-mono font-bold text-slate-800">{submissionSuccess.id}</span>
            </div>
            <div className="flex justify-between items-center text-slate-500">
              <span>{language === 'bn' ? 'জেলা ও বিভাগ:' : 'District & Division:'}</span>
              <span className="font-semibold text-slate-800">
                {currentDistrict ? localizedName(currentDistrict) : submissionSuccess.districtId} (
                {currentDivision ? localizedName(currentDivision) : submissionSuccess.divisionId})
              </span>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate('profile');
              }}
              className="flex-1 py-2.5 px-4 bg-[#155C3A] hover:bg-[#10482d] text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <span>{language === 'bn' ? 'আমার অনুরোধসমূহ দেখুন' : 'View My Contributions'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
            >
              {language === 'bn' ? 'বন্ধ করুন' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent, overrideDuplicate = false) => {
    e.preventDefault();
    setErrorMessage(null);
    setDuplicateWarning(null);

    // Validation
    const cleanBn = nameBn.trim();
    const cleanEn = nameEn.trim();
    if (!cleanBn) {
      setErrorMessage(language === 'bn' ? 'বাংলা নাম অবশ্যই দিতে হবে।' : 'Bengali food name is required.');
      return;
    }
    if (!cleanEn) {
      setErrorMessage(language === 'bn' ? 'ইংরেজি নাম অবশ্যই দিতে হবে।' : 'English food name is required.');
      return;
    }
    if (!districtId) {
      setErrorMessage(language === 'bn' ? 'জেলা নির্বাচন করুন।' : 'Please select a district.');
      return;
    }
    if (!shortDescription.trim()) {
      setErrorMessage(language === 'bn' ? 'সংক্ষিপ্ত বিবরণ আবশ্যক।' : 'Short description is required.');
      return;
    }
    if (!accurateInfoConfirmed) {
      setErrorMessage(
        language === 'bn'
          ? 'অনুগ্রহ করে নিশ্চিত করুন যে প্রদত্ত তথ্য আপনার জ্ঞানমতে নির্ভুল।'
          : 'Please check the box confirming information accuracy.'
      );
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.submitFood({
        nameBn: cleanBn,
        nameEn: cleanEn,
        districtId,
        category,
        dietaryType,
        approximatePriceBdt: Number(approximatePriceBdt) || 0,
        imageUrl: normalizeImageUrl(imageUrl),
        shortDescription: shortDescription.trim(),
        detailedDescription: detailedDescription.trim(),
        originHistory: originHistory.trim(),
        originSource: originSource.trim(),
        accurateInfoConfirmed: true,
        confirmDuplicateOverride: overrideDuplicate,
      });

      setSubmissionSuccess(res.submission);
      if (onSuccess) {
        onSuccess(res.submission);
      }
    } catch (err: any) {
      // Check for 409 duplicate warning from server
      const msg = err.message || 'Failed to submit food.';
      if (msg.includes('already exists') || msg.includes('duplicate')) {
        setDuplicateWarning({
          message: msg,
        });
      } else {
        setErrorMessage(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full my-6 shadow-2xl border border-amber-900/10 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-800 to-[#155C3A] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base font-bold font-bengali">
                {language === 'bn' ? 'খাবার যোগ করার অনুরোধ' : 'Suggest a Regional Food'}
              </h2>
              <p className="text-[11px] text-emerald-100 font-bengali">
                {language === 'bn'
                  ? 'আপনার এলাকার ঐতিহ্যবাহী খাবারের তথ্য ফুডি বিডি ক্যাটালগে যুক্ত করুন'
                  : 'Submit authentic regional culinary heritage for admin review & publishing'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={(e) => handleSubmit(e, false)} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Duplicate warning banner */}
          {duplicateWarning && (
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl space-y-3 animate-in fade-in">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs text-amber-900">
                  <p className="font-bold font-bengali">
                    {language === 'bn' ? 'সম্ভাব্য অনুরূপ খাবার পাওয়া গেছে' : 'Potential Duplicate Food Detected'}
                  </p>
                  <p className="leading-relaxed">{duplicateWarning.message}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1 border-t border-amber-200">
                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, true)}
                  disabled={isSubmitting}
                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors"
                >
                  {isSubmitting
                    ? 'জমা হচ্ছে...'
                    : language === 'bn'
                    ? 'তবুও জমা দিন (Submit Anyway)'
                    : 'Submit Anyway'}
                </button>
                <button
                  type="button"
                  onClick={() => setDuplicateWarning(null)}
                  className="px-3 py-1.5 bg-white border border-amber-300 text-amber-800 rounded-lg text-xs font-medium hover:bg-amber-50 transition-colors"
                >
                  {language === 'bn' ? 'নাম সংশোধন করুন' : 'Edit Names'}
                </button>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Names */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1 font-bengali">
                {language === 'bn' ? 'খাবারের বাংলা নাম' : 'Bengali Food Name'} *
              </label>
              <input
                type="text"
                required
                value={nameBn}
                onChange={(e) => setNameBn(e.target.value)}
                placeholder="যেমন: বগুড়ার দই, কাচ্চি বিরিয়ানি"
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#155C3A] font-bengali"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1 font-bengali">
                {language === 'bn' ? 'ইংরেজি নাম' : 'English Food Name'} *
              </label>
              <input
                type="text"
                required
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                placeholder="e.g. Bogura Doi, Kacchi Biryani"
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#155C3A]"
              />
            </div>
          </div>

          {/* District & Division */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1 font-bengali">
                {language === 'bn' ? 'উৎপত্তিস্থল জেলা' : 'Origin District'} *
              </label>
              <select
                value={districtId}
                onChange={(e) => setDistrictId(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#155C3A] font-bengali"
              >
                {districts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {localizedName(d)} ({d.nameEn})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1 font-bengali">
                {language === 'bn' ? 'বিভাগ (স্বয়ংক্রিয়)' : 'Division (Auto-assigned)'}
              </label>
              <div className="px-3.5 py-2 text-xs bg-slate-100 border border-slate-200 rounded-xl text-slate-700 font-semibold font-bengali flex items-center justify-between">
                <span>{currentDivision ? localizedName(currentDivision) : '—'}</span>
                <span className="text-[10px] text-slate-500 uppercase">{currentDivision?.id}</span>
              </div>
            </div>
          </div>

          {/* Category, Dietary & Price */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1 font-bengali">
                {language === 'bn' ? 'খাবারের ধরন' : 'Category'} *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as FoodCategory)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#155C3A] font-bengali"
              >
                {FOOD_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {localizedName(cat)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1 font-bengali">
                {language === 'bn' ? 'খাদ্য স্বভাব' : 'Dietary Preference'}
              </label>
              <select
                value={dietaryType}
                onChange={(e) => setDietaryType(e.target.value as any)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#155C3A]"
              >
                <option value="non-veg">Non-Veg / আমিষ (Halal)</option>
                <option value="veg">Vegetarian / নিরামিষ</option>
                <option value="sweet">Sweet & Dessert / মিষ্টি</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1 font-bengali">
                {language === 'bn' ? 'আনুমানিক মূল্য (৳)' : 'Approx. Price (BDT)'}
              </label>
              <input
                type="number"
                min="0"
                value={approximatePriceBdt}
                onChange={(e) => setApproximatePriceBdt(e.target.value)}
                placeholder="200"
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#155C3A]"
              />
            </div>
          </div>

          {/* Short Description */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1 font-bengali">
              {language === 'bn' ? 'সংক্ষিপ্ত বিবরণ' : 'Short Description'} *
            </label>
            <textarea
              required
              rows={2}
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder={
                language === 'bn'
                  ? 'খাবারটি সম্পর্কে ১-২ লাইনের সংক্ষেপ পরিচিতি...'
                  : 'A brief 1-2 sentence highlight of this regional delicacy...'
              }
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#155C3A] font-bengali"
            />
          </div>

          {/* Detailed Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1 font-bengali">
              {language === 'bn' ? 'বিস্তারিত স্বাদ ও প্রস্তুত প্রণালী (ঐচ্ছিক)' : 'Detailed Tasting & Preparation Notes (Optional)'}
            </label>
            <textarea
              rows={3}
              value={detailedDescription}
              onChange={(e) => setDetailedDescription(e.target.value)}
              placeholder={
                language === 'bn'
                  ? 'খাবারের স্বাদ, বিশেষ মশলা, এবং পরিবেশন পদ্ধতি...'
                  : 'Describe unique flavors, cooking methods, textures, or key ingredients...'
              }
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#155C3A] font-bengali"
            />
          </div>

          {/* Historical Origin & Cultural Significance */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1 font-bengali">
              {language === 'bn' ? 'ঐতিহাসিক পটভূমি ও গল্প (ঐচ্ছিক)' : 'Historical Origin & Cultural Lore (Optional)'}
            </label>
            <textarea
              rows={2}
              value={originHistory}
              onChange={(e) => setOriginHistory(e.target.value)}
              placeholder={
                language === 'bn'
                  ? 'খাবারটির উৎপত্তি, প্রাচীন কারিগর বা ঐতিহ্যবাহী পটভূমি...'
                  : 'Historical heritage, royal patronage, or cultural significance in this district...'
              }
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#155C3A] font-bengali"
            />
          </div>

          {/* Food Image Direct Upload */}
          <FoodImageUpload
            value={imageUrl}
            onChange={setImageUrl}
            context="submission"
            label={language === 'bn' ? 'খাবারের ছবি (ছবি আপলোড করুন)' : 'Food Image (Direct Upload)'}
          />

          {/* Information Sources & References */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1 font-bengali flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5 text-slate-500" />
              <span>{language === 'bn' ? 'তথ্যসূত্র ও রেফারেন্স (প্রস্তাবিত)' : 'Information Sources & References (Recommended)'}</span>
            </label>
            <input
              type="text"
              value={originSource}
              onChange={(e) => setOriginSource(e.target.value)}
              placeholder="e.g. Bangladesh National Encyclopedia (Banglapedia), Prothom Alo, Daily Star, District Gazette"
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#155C3A]"
            />
          </div>

          {/* Accuracy Confirmation Checkbox */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                required
                checked={accurateInfoConfirmed}
                onChange={(e) => setAccurateInfoConfirmed(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-[#155C3A] focus:ring-[#155C3A] border-slate-300"
              />
              <span className="text-xs text-slate-800 font-bengali leading-relaxed font-medium">
                {language === 'bn'
                  ? 'আমি নিশ্চিত করছি যে প্রদত্ত তথ্য আমার জ্ঞানমতে সত্য ও নির্ভুল, এবং এটি ফুডি বিডি-র কমিউনিটি গাইডের সাথে সংগতিপূর্ণ।'
                  : 'I confirm that the submitted food information and references are authentic and accurate to the best of my knowledge.'}
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
            >
              {language === 'bn' ? 'বাতিল' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-[#155C3A] hover:bg-[#10482d] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? language === 'bn'
                    ? 'জমা হচ্ছে...'
                    : 'Submitting...'
                  : language === 'bn'
                  ? 'অনুরোধ জমা দিন'
                  : 'Submit Food Suggestion'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
