import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../i18n';
import { District, Division, FoodSubmission } from '../types';
import { api } from '../lib/api';
import { FoodImage } from '../components/common/FoodImage';
import { FoodImageUpload } from '../components/common/FoodImageUpload';
import { FoodSubmissionModal } from '../components/food/FoodSubmissionModal';
import {
  User,
  MapPin,
  Mail,
  ShieldCheck,
  Check,
  Camera,
  PlusCircle,
  Clock,
  CheckCircle2,
  XCircle,
  ExternalLink,
  MessageSquare,
  Edit3,
  Calendar,
  Sparkles,
  Info,
  RefreshCw,
} from 'lucide-react';

interface MyProfilePageProps {
  districts: District[];
  divisions?: Division[];
  navigate: (route: string, param?: string) => void;
}

export const MyProfilePage: React.FC<MyProfilePageProps> = ({
  districts,
  divisions = [],
  navigate,
}) => {
  const { user, isLoggedIn, updateProfile } = useAuth();
  const { language, t, localizedName } = useLanguage();

  const [activeTab, setActiveTab] = useState<'profile' | 'contributions'>('contributions');

  // Profile Form state
  const [name, setName] = useState(user?.name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [homeDistrictId, setHomeDistrictId] = useState(user?.homeDistrictId || 'dhaka');
  const [bio, setBio] = useState(user?.bio || '');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Contributions state
  const [submissions, setSubmissions] = useState<FoodSubmission[]>([]);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);
  const [submissionsError, setSubmissionsError] = useState<string | null>(null);
  const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false);

  // Editing pending submission state
  const [editingSubmission, setEditingSubmission] = useState<FoodSubmission | null>(null);
  const [editNameBn, setEditNameBn] = useState('');
  const [editNameEn, setEditNameEn] = useState('');
  const [editShortDesc, setEditShortDesc] = useState('');
  const [editDetailedDesc, setEditDetailedDesc] = useState('');
  const [editOriginHistory, setEditOriginHistory] = useState('');
  const [editOriginSource, setEditOriginSource] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editPrice, setEditPrice] = useState('0');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const loadSubmissions = async () => {
    if (!isLoggedIn) return;
    try {
      setIsLoadingSubmissions(true);
      setSubmissionsError(null);
      const data = await api.getUserSubmissions();
      setSubmissions(data);
    } catch (err: any) {
      setSubmissionsError(err.message || 'Failed to load food submissions.');
    } finally {
      setIsLoadingSubmissions(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      loadSubmissions();
    }
  }, [isLoggedIn]);

  if (!isLoggedIn) {
    navigate('login');
    return null;
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      setErrorMsg(null);
      await updateProfile({
        name,
        avatarUrl,
        homeDistrictId,
        bio,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartEdit = (sub: FoodSubmission) => {
    setEditingSubmission(sub);
    setEditNameBn(sub.nameBn);
    setEditNameEn(sub.nameEn);
    setEditShortDesc(sub.shortDescription);
    setEditDetailedDesc(sub.detailedDescription || '');
    setEditOriginHistory(sub.originHistory || '');
    setEditOriginSource(sub.originSource || '');
    setEditImageUrl(sub.imageUrl || '');
    setEditPrice(String(sub.approximatePriceBdt || 0));
    setEditError(null);
  };

  const handleSaveEditSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubmission) return;

    try {
      setIsSavingEdit(true);
      setEditError(null);
      const updated = await api.updateUserSubmission(editingSubmission.id, {
        nameBn: editNameBn.trim(),
        nameEn: editNameEn.trim(),
        shortDescription: editShortDesc.trim(),
        detailedDescription: editDetailedDesc.trim(),
        originHistory: editOriginHistory.trim(),
        originSource: editOriginSource.trim(),
        imageUrl: editImageUrl.trim(),
        approximatePriceBdt: Number(editPrice) || 0,
      });

      setSubmissions((prev) =>
        prev.map((s) => (s.id === updated.id ? updated : s))
      );
      setEditingSubmission(null);
    } catch (err: any) {
      setEditError(err.message || 'Failed to update submission.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const pendingCount = submissions.filter((s) => s.status === 'pending').length;
  const approvedCount = submissions.filter((s) => s.status === 'approved').length;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Page Title & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 font-bengali">
            {language === 'bn' ? 'ব্যবহারকারী প্রোফাইল ও অবদান' : 'Profile & Contributions'}
          </h1>
          <p className="text-xs text-slate-500 font-bengali">
            {language === 'bn'
              ? 'আপনার ব্যক্তিগত তথ্য ও বাংলাদেশের আঞ্চলিক খাবারের অবদান পরিচালনা করুন'
              : 'Manage your profile details and track your submitted regional foods'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsSubmissionModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#155C3A] hover:bg-[#10482d] text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{language === 'bn' ? 'খাবার যোগ করার অনুরোধ' : 'Suggest a Food'}</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-amber-900/10 pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('contributions')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all font-bengali flex items-center gap-2 ${
            activeTab === 'contributions'
              ? 'bg-[#155C3A] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{language === 'bn' ? 'আমার খাবারের অনুরোধ' : 'My Food Contributions'}</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              activeTab === 'contributions'
                ? 'bg-white/20 text-white'
                : 'bg-slate-200 text-slate-700'
            }`}
          >
            {submissions.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all font-bengali flex items-center gap-2 ${
            activeTab === 'profile'
              ? 'bg-[#155C3A] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>{language === 'bn' ? 'ব্যক্তিগত তথ্য' : 'Profile Settings'}</span>
        </button>
      </div>

      {/* TAB 1: MY CONTRIBUTIONS */}
      {activeTab === 'contributions' && (
        <div className="space-y-6">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-white p-4 rounded-2xl border border-amber-900/10 shadow-2xs">
              <p className="text-[11px] font-semibold text-slate-500 font-bengali">
                {language === 'bn' ? 'মোট প্রস্তাবনা' : 'Total Submitted'}
              </p>
              <p className="text-xl font-black text-slate-900 mt-1">{submissions.length}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-2xs bg-amber-50/20">
              <p className="text-[11px] font-semibold text-amber-700 font-bengali">
                {language === 'bn' ? 'পর্যালোচনাধীন' : 'Pending Review'}
              </p>
              <p className="text-xl font-black text-amber-800 mt-1">{pendingCount}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-2xs bg-emerald-50/20">
              <p className="text-[11px] font-semibold text-emerald-700 font-bengali">
                {language === 'bn' ? 'অনুমোদিত ও প্রকাশিত' : 'Approved & Published'}
              </p>
              <p className="text-xl font-black text-emerald-800 mt-1">{approvedCount}</p>
            </div>
          </div>

          {/* Submissions List Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 font-bengali flex items-center gap-2">
              <span>{language === 'bn' ? 'আপনার জমা দেওয়া আঞ্চলিক খাবার' : 'Your Submitted Regional Dishes'}</span>
            </h2>
            <button
              type="button"
              onClick={loadSubmissions}
              disabled={isLoadingSubmissions}
              className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 font-medium"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSubmissions ? 'animate-spin' : ''}`} />
              <span>{language === 'bn' ? 'রিফ্রেশ' : 'Refresh'}</span>
            </button>
          </div>

          {/* Loading / Error States */}
          {isLoadingSubmissions && (
            <div className="p-8 text-center text-slate-400 text-xs bg-white rounded-3xl border border-slate-100">
              {language === 'bn' ? 'অনুরোধ তালিকা লোড হচ্ছে...' : 'Loading your submissions...'}
            </div>
          )}

          {submissionsError && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl">
              {submissionsError}
            </div>
          )}

          {/* Empty State */}
          {!isLoadingSubmissions && submissions.length === 0 && (
            <div className="bg-white rounded-3xl border border-amber-900/10 p-8 sm:p-12 text-center space-y-4 shadow-2xs">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-[#155C3A] flex items-center justify-center mx-auto">
                <Sparkles className="w-8 h-8" />
              </div>
              <div className="space-y-1.5 max-w-md mx-auto">
                <h3 className="text-lg font-bold text-slate-900 font-bengali">
                  {language === 'bn'
                    ? 'এখনও কোনো খাবারের প্রস্তাব করেননি'
                    : 'No Food Suggestions Yet'}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed font-bengali">
                  {language === 'bn'
                    ? 'আপনার জেলা বা অঞ্চলের ঐতিহ্যবাহী ও বিখ্যাত খাবার সম্পর্কে তথ্য জমা দিন। আমাদের অ্যাডমিন টিম যাচাই করে এটি মানচিত্রে যুক্ত করবেন!'
                    : 'Help enrich Bangladesh culinary heritage. Suggest authentic regional foods from your district for verification and map publishing!'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSubmissionModalOpen(true)}
                className="px-5 py-2.5 bg-[#155C3A] hover:bg-[#10482d] text-white text-xs font-bold rounded-xl transition-all shadow-sm inline-flex items-center gap-2 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{language === 'bn' ? 'প্রথম খাবার প্রস্তাব করুন' : 'Suggest Your First Food'}</span>
              </button>
            </div>
          )}

          {/* Cards List */}
          <div className="space-y-4">
            {submissions.map((sub) => {
              const district = districts.find((d) => d.id === sub.districtId);
              const division = divisions.find((div) => div.id === sub.divisionId);

              return (
                <div
                  key={sub.id}
                  className="bg-white rounded-3xl border border-amber-900/10 p-5 sm:p-6 shadow-2xs space-y-4 hover:border-emerald-700/30 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      {/* Thumbnail */}
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shrink-0 border border-slate-200">
                        <FoodImage
                          src={sub.imageUrl}
                          alt={sub.nameEn}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Content */}
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-base text-slate-900 font-bengali">
                            {sub.nameBn}
                          </h3>
                          <span className="text-xs text-slate-500 font-medium">({sub.nameEn})</span>
                        </div>

                        <p className="text-xs text-slate-600 flex items-center gap-1.5 font-bengali">
                          <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                          <span>
                            {district ? localizedName(district) : sub.districtId},{' '}
                            {division ? localizedName(division) : sub.divisionId}
                          </span>
                        </p>

                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {sub.shortDescription}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-400">
                          <span className="flex items-center gap-1 font-mono">
                            ID: {sub.id}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(sub.createdAt).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                          {sub.approximatePriceBdt ? (
                            <>
                              <span>•</span>
                              <span>৳ {sub.approximatePriceBdt} BDT</span>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {/* Status Badge & Actions */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 shrink-0">
                      {sub.status === 'pending' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>{language === 'bn' ? 'পর্যালোচনাধীন' : 'Pending Review'}</span>
                        </span>
                      )}

                      {sub.status === 'approved' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{language === 'bn' ? 'অনুমোদিত' : 'Approved'}</span>
                        </span>
                      )}

                      {sub.status === 'rejected' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          <span>{language === 'bn' ? 'প্রত্যাখ্যাত' : 'Rejected'}</span>
                        </span>
                      )}

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 pt-1">
                        {sub.status === 'approved' && sub.approvedFoodId && (
                          <button
                            type="button"
                            onClick={() => navigate('food', sub.approvedFoodId)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                          >
                            <span>{language === 'bn' ? 'খাবার দেখুন' : 'View Food'}</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        )}

                        {sub.status === 'pending' && (
                          <button
                            type="button"
                            onClick={() => handleStartEdit(sub)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3 text-slate-500" />
                            <span>{language === 'bn' ? 'সম্পাদনা' : 'Edit'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Admin Feedback Box */}
                  {sub.adminFeedback && (
                    <div
                      className={`p-3.5 rounded-2xl text-xs space-y-1 ${
                        sub.status === 'rejected'
                          ? 'bg-rose-50 border border-rose-200 text-rose-900'
                          : 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold font-bengali">
                        <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          {language === 'bn' ? 'অ্যাডমিন ফিডব্যাক:' : 'Administrator Feedback:'}
                        </span>
                        {sub.reviewedByUserName && (
                          <span className="font-normal opacity-80">({sub.reviewedByUserName})</span>
                        )}
                      </div>
                      <p className="leading-relaxed pl-5">{sub.adminFeedback}</p>
                    </div>
                  )}

                  {/* Source Reference if available */}
                  {sub.originSource && (
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                      <span className="font-semibold text-slate-700">
                        {language === 'bn' ? 'তথ্যসূত্র:' : 'Source:'}
                      </span>
                      <span>{sub.originSource}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: PROFILE SETTINGS */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-3xl border border-amber-900/10 p-6 sm:p-8 shadow-2xs space-y-6">
          {/* Profile Avatar Preview */}
          <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
            <img
              src={avatarUrl || 'https://api.dicebear.com/7.x/initials/svg?seed=Foodie'}
              alt={name}
              className="w-16 h-16 rounded-2xl object-cover ring-2 ring-[#155C3A]/20"
            />
            <div>
              <h3 className="font-bold text-base text-slate-900">{name}</h3>
              <p className="text-xs text-slate-500">{user?.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-bold uppercase text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded font-bengali">
                  {t('profile.role')}: {user?.role}
                </span>
              </div>
            </div>
          </div>

          {/* Edit Form */}
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 font-bengali">
                {t('profile.name')}
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#155C3A]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 font-bengali">
                {language === 'bn' ? 'ছবির লিঙ্ক (Avatar URL)' : 'Avatar Image URL'}
              </label>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#155C3A]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 font-bengali">
                {t('profile.homeDistrict')}
              </label>
              <select
                value={homeDistrictId}
                onChange={(e) => setHomeDistrictId(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#155C3A]"
              >
                {districts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {localizedName(d)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 font-bengali">
                {t('profile.bio')}
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder={t('profile.bioPlaceholder')}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#155C3A]"
              />
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-bengali">
                {errorMsg}
              </div>
            )}

            {savedSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 font-bengali">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{t('profile.success')}</span>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 bg-[#155C3A] hover:bg-[#0e442a] text-white text-xs font-bold rounded-xl transition-colors shadow-xs disabled:opacity-50 cursor-pointer font-bengali"
              >
                {isSaving ? t('profile.saving') : t('profile.saveChanges')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* EDIT PENDING SUBMISSION MODAL */}
      {editingSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-amber-900/10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900 font-bengali">
                {language === 'bn' ? 'খাবারের অনুরোধ সম্পাদনা' : 'Edit Food Request'}
              </h3>
              <button
                type="button"
                onClick={() => setEditingSubmission(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            {editError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl">
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveEditSubmission} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'bn' ? 'বাংলা নাম' : 'Bengali Name'} *
                </label>
                <input
                  type="text"
                  required
                  value={editNameBn}
                  onChange={(e) => setEditNameBn(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'bn' ? 'ইংরেজি নাম' : 'English Name'} *
                </label>
                <input
                  type="text"
                  required
                  value={editNameEn}
                  onChange={(e) => setEditNameEn(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'bn' ? 'সংক্ষিপ্ত বিবরণ' : 'Short Description'} *
                </label>
                <textarea
                  required
                  rows={2}
                  value={editShortDesc}
                  onChange={(e) => setEditShortDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'bn' ? 'বিস্তারিত তথ্য' : 'Detailed Notes'}
                </label>
                <textarea
                  rows={2}
                  value={editDetailedDesc}
                  onChange={(e) => setEditDetailedDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <FoodImageUpload
                value={editImageUrl}
                onChange={setEditImageUrl}
                context="submission"
                targetId={editingSubmission.id}
                label={language === 'bn' ? 'খাবারের ছবি (ছবি আপলোড করুন)' : 'Food Image (Direct Upload)'}
              />

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'bn' ? 'তথ্যসূত্র' : 'Source'}
                </label>
                <input
                  type="text"
                  value={editOriginSource}
                  onChange={(e) => setEditOriginSource(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingSubmission(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50"
                >
                  {language === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-5 py-2 bg-[#155C3A] hover:bg-[#10482d] text-white rounded-xl font-bold"
                >
                  {isSavingEdit ? 'সংরক্ষণ হচ্ছে...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global Suggestion Modal */}
      <FoodSubmissionModal
        isOpen={isSubmissionModalOpen}
        onClose={() => setIsSubmissionModalOpen(false)}
        districts={districts}
        divisions={divisions}
        onSuccess={() => {
          loadSubmissions();
        }}
        navigate={navigate}
      />
    </div>
  );
};
