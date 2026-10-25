import React, { useState, useEffect } from 'react';
import { Food, District, Division, FoodReview } from '../types';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useJourney } from '../context/JourneyContext';
import { useLanguage } from '../i18n';
import { AdminFoodEditModal } from '../components/admin/AdminFoodEditModal';
import { FoodSubmissionModal } from '../components/food/FoodSubmissionModal';
import { FoodImage } from '../components/common/FoodImage';
import { FoodImageUpload } from '../components/common/FoodImageUpload';
import {
  MapPin,
  CheckCircle2,
  Bookmark,
  Star,
  Calendar,
  Share2,
  ArrowLeft,
  ShieldCheck,
  Send,
  MessageSquare,
  Sparkles,
  Camera,
  Edit,
  UtensilsCrossed,
  User,
  Link2,
  Check,
  PlusCircle,
} from 'lucide-react';

interface FoodDetailsPageProps {
  foodId: string;
  navigate: (route: string, param?: string) => void;
  districts?: District[];
  divisions?: Division[];
  onRefreshFoods?: () => Promise<void>;
}

export const FoodDetailsPage: React.FC<FoodDetailsPageProps> = ({
  foodId,
  navigate,
  districts: propsDistricts,
  divisions: propsDivisions,
  onRefreshFoods,
}) => {
  const { user, isLoggedIn, isAdmin } = useAuth();
  const { isFoodTried, isFoodWanted, getFoodTracking, trackFood, removeFromJourney } = useJourney();
  const { language, t, localizedName } = useLanguage();

  const [food, setFood] = useState<Food | null>(null);
  const [district, setDistrict] = useState<District | null>(null);
  const [division, setDivision] = useState<Division | null>(null);
  const [reviews, setReviews] = useState<FoodReview[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Tasting tracker inputs
  const currentTracking = getFoodTracking(foodId);
  const [tastingDate, setTastingDate] = useState<string>(
    currentTracking?.triedAt ? currentTracking.triedAt.slice(0, 10) : new Date().toISOString().slice(0, 10)
  );
  const [rating, setRating] = useState<number>(currentTracking?.rating || 5);
  const [notes, setNotes] = useState<string>(currentTracking?.notes || '');
  const [photoUrl, setPhotoUrl] = useState<string>(currentTracking?.photoUrl || '');
  const [isSavingTracking, setIsSavingTracking] = useState<boolean>(false);
  const [trackingSuccessMsg, setTrackingSuccessMsg] = useState<string | null>(null);
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const [showConfirmRemove, setShowConfirmRemove] = useState<boolean>(false);

  // Community review form
  const [newReviewComment, setNewReviewComment] = useState<string>('');
  const [newReviewRating, setNewReviewRating] = useState<number>(5);
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState<string | null>(null);

  // Admin Edit Modal & Catalog State
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isSuggestModalOpen, setIsSuggestModalOpen] = useState<boolean>(false);
  const [internalDistricts, setInternalDistricts] = useState<District[]>([]);
  const [internalDivisions, setInternalDivisions] = useState<Division[]>([]);
  const [adminFeedback, setAdminFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!propsDistricts || propsDistricts.length === 0) {
      api.getDistricts().then(setInternalDistricts).catch(() => {});
    }
    if (!propsDivisions || propsDivisions.length === 0) {
      api.getDivisions().then(setInternalDivisions).catch(() => {});
    }
  }, [propsDistricts, propsDivisions]);

  const allDistricts = propsDistricts && propsDistricts.length > 0 ? propsDistricts : internalDistricts;
  const allDivisions = propsDivisions && propsDivisions.length > 0 ? propsDivisions : internalDivisions;

  const handleFoodSaved = async (updatedFood: Food) => {
    setFood(updatedFood);
    const d = allDistricts.find((x) => x.id === updatedFood.districtId);
    if (d) setDistrict(d);
    const dv = allDivisions.find((x) => x.id === (d?.divisionId || updatedFood.divisionId));
    if (dv) setDivision(dv);

    if (onRefreshFoods) {
      await onRefreshFoods();
    }

    setAdminFeedback({
      type: 'success',
      text:
        language === 'bn'
          ? 'খাবারের তথ্য সফলভাবে হালনাগাদ করা হয়েছে।'
          : 'Food details updated successfully.',
    });
    setTimeout(() => setAdminFeedback(null), 4000);
  };

  useEffect(() => {
    setIsLoading(true);
    api.getFoodById(foodId)
      .then((res) => {
        setFood(res.food);
        setDistrict(res.district);
        setDivision(res.division);
        setReviews(res.reviews || []);
      })
      .catch((err) => {
        setError(err.message || 'Could not load food profile.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [foodId]);

  useEffect(() => {
    if (currentTracking) {
      if (currentTracking.triedAt) setTastingDate(currentTracking.triedAt.slice(0, 10));
      if (currentTracking.rating) setRating(currentTracking.rating);
      if (currentTracking.notes) setNotes(currentTracking.notes);
      if (currentTracking.photoUrl) setPhotoUrl(currentTracking.photoUrl);
    }
  }, [currentTracking]);

  const handleSaveTasting = async (status: 'tried' | 'want_to_try') => {
    if (!isLoggedIn) {
      setTrackingError('Please sign in to track your food journey.');
      setTimeout(() => setTrackingError(null), 3500);
      return;
    }

    try {
      setIsSavingTracking(true);
      setTrackingError(null);
      await trackFood(foodId, status, {
        triedAt: status === 'tried' ? new Date(tastingDate).toISOString() : undefined,
        rating: status === 'tried' ? rating : undefined,
        notes: status === 'tried' ? notes : undefined,
        photoUrl: status === 'tried' ? photoUrl : undefined,
      });
      setTrackingSuccessMsg(status === 'tried' ? 'Tasting experience saved to your Food Journey!' : 'Added to your Wishlist!');
      setTimeout(() => setTrackingSuccessMsg(null), 3500);
    } catch (err: any) {
      setTrackingError(err.message || 'Failed to update tracking');
    } finally {
      setIsSavingTracking(false);
    }
  };

  const handleConfirmRemoveTracking = async () => {
    try {
      setIsSavingTracking(true);
      setTrackingError(null);
      await removeFromJourney(foodId);
      setShowConfirmRemove(false);
      setTrackingSuccessMsg('Removed from your journey.');
      setTimeout(() => setTrackingSuccessMsg(null), 3000);
    } catch (err: any) {
      setTrackingError(err.message || 'Failed to remove from journey');
    } finally {
      setIsSavingTracking(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      setReviewError('Please sign in to submit a review.');
      setTimeout(() => setReviewError(null), 3500);
      return;
    }
    if (!newReviewComment.trim()) return;

    try {
      setIsSubmittingReview(true);
      setReviewError(null);
      const created = await api.submitReview(foodId, newReviewRating, newReviewComment.trim());
      setReviews([created, ...reviews]);
      setNewReviewComment('');
      setNewReviewRating(5);
      setReviewSuccessMsg('Your review has been published!');
      setTimeout(() => setReviewSuccessMsg(null), 3500);
    } catch (err: any) {
      setReviewError(err.message || 'Could not submit review.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-8 h-8 border-3 border-[#155C3A] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500">Loading authentic food profile...</p>
      </div>
    );
  }

  if (error || !food) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <p className="text-base font-bold text-slate-800">Food Delicacy Not Found</p>
        <p className="text-xs text-slate-500">{error || 'The requested dish is not currently listed.'}</p>
        <button
          onClick={() => navigate('discover')}
          className="px-4 py-2 bg-[#155C3A] text-white text-xs font-semibold rounded-xl"
        >
          Return to Food Catalog
        </button>
      </div>
    );
  }

  const isTried = isFoodTried(food.id);
  const isWanted = isFoodWanted(food.id);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back button */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => navigate('discover')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#155C3A] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('foodDetails.backToDiscover')}</span>
        </button>

        <button
          type="button"
          onClick={() => setIsSuggestModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#155C3A] text-xs font-bold rounded-xl border border-emerald-200 transition-colors cursor-pointer font-bengali shadow-2xs"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>{language === 'bn' ? 'খাবার যোগ করার অনুরোধ' : 'Suggest a Food'}</span>
        </button>
      </div>

      {/* Admin Feedback Notification */}
      {adminFeedback && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold font-bengali flex items-center justify-between gap-3 animate-in fade-in ${
            adminFeedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{adminFeedback.text}</span>
          </div>
          <button
            onClick={() => setAdminFeedback(null)}
            className="text-slate-400 hover:text-slate-600 text-xs font-semibold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Admin Controls Banner (Visible ONLY to authenticated administrators) */}
      {isLoggedIn && isAdmin && (
        <div className="bg-gradient-to-r from-emerald-950 via-[#155C3A] to-emerald-900 text-white p-4 sm:p-5 rounded-3xl border border-emerald-500/30 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-emerald-300 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold font-bengali">
                  {language === 'bn' ? 'অ্যাডমিন নিয়ন্ত্রণ প্যানেল' : 'Admin Controls'}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-bengali ${
                    food.isPublished
                      ? 'bg-emerald-400/20 text-emerald-200 border border-emerald-400/30'
                      : 'bg-amber-400/20 text-amber-200 border border-amber-400/30'
                  }`}
                >
                  {food.isPublished
                    ? language === 'bn'
                      ? 'প্রকাশিত'
                      : 'Published'
                    : language === 'bn'
                    ? 'ড্রাফট (অপ্রকাশিত)'
                    : 'Draft (Unpublished)'}
                </span>
              </div>
              <p className="text-xs text-emerald-200/90 font-medium font-bengali">
                {language === 'bn'
                  ? 'এই খাবারের তথ্য সম্পাদনা করুন বা সেন্ট্রাল ক্যাটালগে পরিচালনা করুন।'
                  : 'Edit this food item or manage it in the central catalog.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end shrink-0">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="px-4 py-2.5 bg-white text-[#155C3A] hover:bg-emerald-50 text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-2 font-bengali"
            >
              <Edit className="w-4 h-4 text-[#155C3A]" />
              <span>{language === 'bn' ? 'খাবার সম্পাদনা করুন' : 'Edit Food'}</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('admin', food.id)}
              className="px-3.5 py-2.5 bg-white/15 hover:bg-white/25 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-2 font-bengali"
            >
              <UtensilsCrossed className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'ক্যাটালগ পরিচালনা' : 'Manage Food'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Hero Card */}
      <div className="bg-white rounded-3xl border border-amber-900/10 overflow-hidden shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Image */}
          <div className="relative aspect-4/3 md:aspect-auto h-full min-h-[340px] bg-slate-100 overflow-hidden">
            <FoodImage
              src={food.imageUrl}
              alt={localizedName(food)}
              className="w-full h-full object-cover"
              containerClassName="w-full h-full relative overflow-hidden bg-slate-100"
              isAdmin={isAdmin}
              showAdminWarning={true}
              loading="eager"
            />
            {food.dietaryType && (
              <span className="absolute top-4 left-4 z-10 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white text-[11px] font-bold uppercase tracking-wider">
                {food.dietaryType}
              </span>
            )}
            {food.imageAttribution && (
              <div className="absolute bottom-3 left-3 right-3 z-10 px-2.5 py-1.5 rounded-xl bg-slate-950/75 backdrop-blur-xs text-[11px] text-white/95 flex items-center justify-between gap-2 border border-white/10 shadow-xs">
                <span className="truncate flex items-center gap-1.5">
                  <span className="opacity-75">📷</span>
                  <span className="truncate">{food.imageAttribution}</span>
                </span>
                {food.imageVerified && (
                  <span className="shrink-0 text-emerald-400 font-semibold flex items-center gap-0.5 text-[10px]">
                    <CheckCircle2 className="w-3 h-3" />
                    Verified
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Core Info */}
          <div className="p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              {/* Geolocation metadata */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-medium">
                <button
                  onClick={() => district && navigate('district', district.id)}
                  className="text-[#155C3A] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  {district ? localizedName(district) : ''}
                </button>
                <span aria-hidden="true" className="text-slate-300">·</span>
                <span>{division ? localizedName(division) : ''}</span>
                <span aria-hidden="true" className="text-slate-300">·</span>
                <span className="capitalize">{food.category.replace('_', ' ')}</span>
              </div>

              {/* Title & Admin Quick Edit */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-bengali leading-snug">
                    {localizedName(food)}
                  </h1>
                  <p className="text-base font-semibold text-slate-700 mt-0.5">
                    {language === 'bn' ? food.nameEn : food.nameBn}
                  </p>
                </div>
                {isLoggedIn && isAdmin && (
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(true)}
                    className="shrink-0 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#155C3A] text-xs font-bold rounded-xl border border-emerald-200 transition-colors cursor-pointer flex items-center gap-1.5 font-bengali"
                    title={language === 'bn' ? 'খাবার সম্পাদনা করুন' : 'Edit Food'}
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>{language === 'bn' ? 'সম্পাদনা' : 'Edit Food'}</span>
                  </button>
                )}
              </div>

              {/* Approximate Price */}
              {food.approximatePriceBdt ? (
                <div className="inline-flex items-baseline gap-1 text-[#155C3A]">
                  <span className="text-sm font-bold">{t('foodCard.priceApprox')}:</span>
                  <span className="text-xl font-black">৳{food.approximatePriceBdt}</span>
                  <span className="text-xs text-slate-400 font-normal">{language === 'bn' ? '/ পরিবেশন' : '/ serving'}</span>
                </div>
              ) : null}

              {/* Short summary */}
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {food.shortDescription}
              </p>
            </div>

            {/* Quick Actions (Tried / Wishlist / View on Map) */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-3">
              <button
                onClick={() => handleSaveTasting('tried')}
                className={`flex-1 min-w-[140px] px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                  isTried
                    ? 'bg-[#155C3A] text-white shadow-xs'
                    : 'bg-emerald-50 text-[#155C3A] hover:bg-emerald-100'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isTried ? t('foodCard.tried') : t('foodCard.markTried')}</span>
              </button>

              <button
                onClick={() => handleSaveTasting('want_to_try')}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                  isWanted
                    ? 'bg-[#F39C3D] text-white shadow-xs'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                }`}
              >
                <Bookmark className="w-4 h-4" />
                <span>{isWanted ? t('foodCard.wantToTry') : t('foodCard.markWant')}</span>
              </button>

              <button
                onClick={() => district && navigate('map', district.divisionId)}
                className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                title={t('home.viewMap')}
              >
                <MapPin className="w-3.5 h-3.5 text-[#155C3A]" />
                <span>{language === 'bn' ? 'মানচিত্রে দেখুন' : 'View on Map'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tasting Diary / Food Experience Panel (Personal tracker) */}
      {isLoggedIn && (
        <div className="bg-white rounded-2xl border border-amber-900/10 p-6 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#F39C3D]" />
              <h3 className="font-bold text-sm text-slate-900">
                Personal Food Journey Record (আমার ব্যক্তিগত খাবারের ডায়েরি)
              </h3>
            </div>
            {isTried && (
              <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Logged in your journey
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Date Tried */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Date Tasted (চেখে দেখার তারিখ)
              </label>
              <input
                type="date"
                value={tastingDate}
                onChange={(e) => setTastingDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
              />
            </div>

            {/* Rating Stars */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Personal Rating (আপনার রেটিং)
              </label>
              <div className="flex items-center gap-1 pt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 focus:outline-none"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        star <= rating
                          ? 'text-amber-400 fill-current'
                          : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs text-slate-500 font-medium ml-2">{rating}/5 Stars</span>
              </div>
            </div>

            {/* Notes */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tasting Notes & Memories (স্বাদ, রেস্তোরাঁ ও স্মৃতি)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Where did you taste it? How was the texture, aroma, or local ambiance?"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
              />
            </div>

            {/* Optional Personal Photo Upload */}
            <div className="sm:col-span-2">
              <FoodImageUpload
                value={photoUrl}
                onChange={setPhotoUrl}
                context="submission"
                label={
                  language === 'bn'
                    ? 'ব্যক্তিগত খাবারের ছবি (সরাসরি আপলোড করুন)'
                    : 'Personal Food Photo (Direct Upload)'
                }
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            {isTried || isWanted ? (
              showConfirmRemove ? (
                <div className="flex items-center gap-2 bg-red-50 p-1.5 rounded-lg border border-red-200">
                  <span className="text-xs font-semibold text-red-800">Remove from journey?</span>
                  <button
                    type="button"
                    onClick={handleConfirmRemoveTracking}
                    className="text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-0.5 rounded font-bold transition-colors"
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowConfirmRemove(false)}
                    className="text-xs text-slate-600 hover:text-slate-900 px-1.5 py-0.5"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowConfirmRemove(true)}
                  className="text-xs text-red-600 hover:underline font-medium"
                >
                  Remove from my records
                </button>
              )
            ) : <span />}

            <button
              onClick={() => handleSaveTasting('tried')}
              disabled={isSavingTracking}
              className="px-5 py-2 bg-[#155C3A] hover:bg-[#0e442a] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              {isSavingTracking ? 'Saving...' : 'Save Food Experience'}
            </button>
          </div>

          {trackingError && (
            <p className="text-xs text-red-700 bg-red-50 p-2.5 rounded-xl border border-red-200 text-center font-medium">
              {trackingError}
            </p>
          )}

          {trackingSuccessMsg && (
            <p className="text-xs text-emerald-800 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 text-center font-medium">
              ✓ {trackingSuccessMsg}
            </p>
          )}
        </div>
      )}

      {/* Origin, History & Authentic Ingredients */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Origin & Historical Context */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-amber-900/10 p-6 space-y-4 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#155C3A]">
            <ShieldCheck className="w-4 h-4" />
            <span>ইতিহাস ও উৎপত্তি (Origin & History)</span>
          </div>

          {/* Verification Status & GI Badge */}
          {food.researchStatus === 'gi_certified' && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold font-bengali">
              <span className="px-1.5 py-0.5 rounded bg-amber-600 text-white text-[10px] uppercase tracking-wider font-sans">
                GI CERTIFIED
              </span>
              <span>ভৌগোলিক নির্দেশক (GI) সনদপ্রাপ্ত ঐতিহ্যবাহী খাদ্য</span>
            </div>
          )}

          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-sans">
            {food.detailedDescription}
          </p>

          {food.originHistory && (
            <div className="bg-[#FFF9F0] border-l-3 border-[#155C3A] p-4 rounded-r-xl space-y-2">
              <p className="text-xs font-bold text-slate-800">Historical Background & Cultural Roots</p>
              <p className="text-xs text-slate-600 leading-relaxed">{food.originHistory}</p>
              
              {food.originSource && (
                <div className="pt-2 border-t border-amber-900/10 text-[11px] text-amber-950/80 font-medium space-y-1">
                  <p className="font-semibold text-slate-700">Primary Source / Authority:</p>
                  <p className="italic">{food.originSource}</p>
                </div>
              )}

              {food.citationSources && food.citationSources.length > 0 && (
                <div className="pt-2 border-t border-amber-900/10 text-[11px] text-slate-600 space-y-1">
                  <p className="font-bold text-slate-700">Research & Factual Citations:</p>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-600">
                    {food.citationSources.map((c, i) => (
                      <li key={i} className="text-[11px]">{c}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Ingredients & Key Components */}
        <div className="bg-white rounded-2xl border border-amber-900/10 p-6 space-y-4 shadow-2xs">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-800">
            উপাদান ও রন্ধনশৈলী (Key Ingredients)
          </p>

          {food.ingredients && food.ingredients.length > 0 ? (
            <ul className="space-y-2 text-xs text-slate-600">
              {food.ingredients.map((ing, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#155C3A]" />
                  <span>{ing}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-400">Traditional family recipe blend.</p>
          )}

          <div className="pt-4 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-800 mb-1">Geographic Origin</p>
            <p className="text-xs text-slate-600">
              Authentic to <strong className="text-slate-800">{district?.nameEn}</strong>, {division?.nameEn} Division.
            </p>
          </div>
        </div>
      </div>

      {/* Community Contribution & Verification Section */}
      <div className="bg-white rounded-2xl border border-amber-900/10 p-6 space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#155C3A] flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4 text-[#155C3A]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-bengali">
                {language === 'bn' ? 'কমিউনিটি অবদান ও যাচাই' : 'Community Contribution & Verification'}
              </h3>
              <p className="text-[11px] text-slate-500 font-bengali">
                {language === 'bn'
                  ? 'ঐতিহাসিক তথ্যের নির্ভুলতা ও ক্যাটালগ যাচাইকরণ ইতিহাস'
                  : 'Culinary heritage verification and community attribution'}
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              {food.submittedByUserName
                ? language === 'bn' ? 'কমিউনিটি যাচাইকৃত' : 'Community Verified'
                : language === 'bn' ? 'অফিসিয়াল রেকর্ড' : 'Official Record'}
            </span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          {/* Submitter */}
          <div className="p-3 bg-slate-50 rounded-xl space-y-1">
            <p className="text-[11px] font-semibold text-slate-400 font-bengali uppercase">
              {language === 'bn' ? 'প্রস্তাব করেছেন' : 'Suggested by'}
            </p>
            <p className="font-bold text-slate-800 flex items-center gap-1.5 truncate">
              <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="truncate">
                {food.submittedByUserName || (language === 'bn' ? 'ফুডি বিডি অ্যাডমিন টিম' : 'Foodie BD Editorial Team')}
              </span>
            </p>
          </div>

          {/* Approver */}
          <div className="p-3 bg-slate-50 rounded-xl space-y-1">
            <p className="text-[11px] font-semibold text-slate-400 font-bengali uppercase">
              {language === 'bn' ? 'অনুমোদন করেছেন' : 'Approved by'}
            </p>
            <p className="font-bold text-slate-800 flex items-center gap-1.5 truncate">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span className="truncate">
                {food.approvedByUserName || (language === 'bn' ? 'ফুডি বিডি কিউরেটর' : 'Foodie BD Curator')}
              </span>
            </p>
          </div>

          {/* Approval Date */}
          <div className="p-3 bg-slate-50 rounded-xl space-y-1">
            <p className="text-[11px] font-semibold text-slate-400 font-bengali uppercase">
              {language === 'bn' ? 'অনুমোদনের তারিখ' : 'Approved on'}
            </p>
            <p className="font-bold text-slate-800 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>
                {new Date(food.approvedAt || food.createdAt).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </p>
          </div>

          {/* Verification Status */}
          <div className="p-3 bg-slate-50 rounded-xl space-y-1">
            <p className="text-[11px] font-semibold text-slate-400 font-bengali uppercase">
              {language === 'bn' ? 'যাচাইকরণের অবস্থা' : 'Verification Status'}
            </p>
            <p className="font-bold text-emerald-800 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">
                {food.submittedByUserName
                  ? language === 'bn' ? 'কমিউনিটি প্রস্তাবিত ও যাচাইকৃত' : 'Community Suggested & Verified'
                  : language === 'bn' ? 'অ্যাডমিন সংকলিত ঐতিহ্যবাহী খাবার' : 'Curated Official Heritage'}
              </span>
            </p>
          </div>
        </div>

        {/* Source Reference Links */}
        {food.originSource && (
          <div className="p-3.5 bg-amber-50/60 border border-amber-200/60 rounded-xl text-xs space-y-1">
            <span className="font-bold text-amber-900 flex items-center gap-1.5 font-bengali">
              <Link2 className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span>{language === 'bn' ? 'যাচাইকৃত তথ্যসূত্র ও উদ্ধৃতি:' : 'Verified Sources & Citations:'}</span>
            </span>
            <p className="text-slate-700 leading-relaxed pl-5 font-sans">
              {food.originSource}
            </p>
          </div>
        )}
      </div>

      {/* Community Reviews Section */}
      <div className="bg-white rounded-2xl border border-amber-900/10 p-6 sm:p-8 space-y-6 shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#155C3A]" />
            <h3 className="font-bold text-base text-slate-900 font-bengali">
              খাদ্যরসিকদের মতামত (Community Reviews) ({reviews.length})
            </h3>
          </div>
        </div>

        {/* Submit Review Form */}
        <form onSubmit={handleReviewSubmit} className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <p className="text-xs font-bold text-slate-800">Write a Review for {food.nameEn}</p>

          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span>Rating:</span>
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setNewReviewRating(s)}
                className="p-0.5 focus:outline-none"
              >
                <Star
                  className={`w-4 h-4 ${
                    s <= newReviewRating ? 'text-amber-400 fill-current' : 'text-slate-300'
                  }`}
                />
              </button>
            ))}
          </div>

          <textarea
            rows={2}
            value={newReviewComment}
            onChange={(e) => setNewReviewComment(e.target.value)}
            placeholder={
              isLoggedIn
                ? 'Share your thoughts, authentic taste notes, or restaurant recommendations...'
                : 'Log in to share your culinary experience...'
            }
            disabled={!isLoggedIn}
            className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#155C3A]"
          />

          {reviewError && (
            <p className="text-xs text-red-700 bg-red-50 p-2 rounded-lg border border-red-200">
              {reviewError}
            </p>
          )}

          {reviewSuccessMsg && (
            <p className="text-xs text-emerald-800 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
              ✓ {reviewSuccessMsg}
            </p>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!isLoggedIn || isSubmittingReview || !newReviewComment.trim()}
              className="px-4 py-2 bg-[#155C3A] hover:bg-[#0e442a] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Post Review</span>
            </button>
          </div>
        </form>

        {/* Existing Reviews List */}
        <div className="space-y-4">
          {reviews.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6 italic">
              Be the first foodie to review {food.nameEn}!
            </p>
          ) : (
            reviews.map((rev) => (
              <div key={rev.id} className="p-4 rounded-xl border border-slate-100 bg-white space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img
                      src={rev.userAvatar || 'https://api.dicebear.com/7.x/initials/svg?seed=Foodie'}
                      alt={rev.userName}
                      className="w-7 h-7 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900">{rev.userName}</p>
                      <p className="text-[10px] text-slate-400">
                        {new Date(rev.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${
                          s <= rev.rating ? 'text-amber-400 fill-current' : 'text-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{rev.comment}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Admin Food Edit Modal */}
      {isLoggedIn && isAdmin && (
        <AdminFoodEditModal
          isOpen={isEditModalOpen}
          food={food}
          districts={allDistricts}
          divisions={allDivisions}
          onClose={() => setIsEditModalOpen(false)}
          onSaved={handleFoodSaved}
          onNavigateToCatalog={(id) => navigate('admin', id)}
        />
      )}

      {/* Community Food Submission Modal */}
      <FoodSubmissionModal
        isOpen={isSuggestModalOpen}
        onClose={() => setIsSuggestModalOpen(false)}
        initialDistrictId={food?.districtId}
        districts={allDistricts}
        divisions={allDivisions}
        onSuccess={() => {
          setAdminFeedback({
            type: 'success',
            text: language === 'bn' ? 'আপনার খাবার প্রস্তাব সফলভাবে জমা হয়েছে!' : 'Your food suggestion has been submitted successfully!',
          });
        }}
        navigate={navigate}
      />
    </div>
  );
};
