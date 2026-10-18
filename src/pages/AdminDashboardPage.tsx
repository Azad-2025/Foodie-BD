import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../i18n';
import { District, Division, Food, FoodReview, AuditLog, UserProfile, FoodCategory } from '../types';
import { FOOD_CATEGORIES } from '../data/divisionsAndDistricts';
import { api } from '../lib/api';
import {
  Shield,
  UtensilsCrossed,
  Plus,
  Trash2,
  Edit,
  CheckCircle2,
  AlertTriangle,
  History,
  Users,
  Eye,
  EyeOff,
  Search,
  Filter,
  RotateCcw,
  ExternalLink,
  Sparkles,
  AlertCircle,
  Image as ImageIcon,
  Link2,
  Inbox,
} from 'lucide-react';
import { FoodImage } from '../components/common/FoodImage';
import { FoodImageUpload } from '../components/common/FoodImageUpload';
import { AdminFoodRequestsTab } from '../components/admin/AdminFoodRequestsTab';
import { AdminResearchDossierTab } from '../components/admin/AdminResearchDossierTab';
import { analyzeImageUrl, normalizeImageUrl, isValidFoodImageReference } from '../lib/imageUrlHelper';
import { BookOpen } from 'lucide-react';

interface AdminDashboardPageProps {
  districts: District[];
  divisions: Division[];
  foods: Food[];
  onRefreshFoods: () => Promise<void>;
  navigate: (route: string, param?: string) => void;
  initialEditFoodId?: string;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
  districts,
  divisions,
  foods,
  onRefreshFoods,
  navigate,
  initialEditFoodId,
}) => {
  const { user, isAdmin, isLoggedIn } = useAuth();
  const { language, t, localizedName } = useLanguage();

  const [activeTab, setActiveTab] = useState<'foods' | 'requests' | 'research' | 'overview' | 'users' | 'reviews' | 'audits'>('foods');
  const [adminOverview, setAdminOverview] = useState<any>(null);
  const [adminUsers, setAdminUsers] = useState<UserProfile[]>([]);
  const [adminAudits, setAdminAudits] = useState<AuditLog[]>([]);
  const [reviews, setReviews] = useState<FoodReview[]>([]);
  const [adminCatalogFoods, setAdminCatalogFoods] = useState<Food[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Search & Filter state for catalog table
  const [catalogSearch, setCatalogSearch] = useState('');
  const [filterDivision, setFilterDivision] = useState('all');
  const [filterDistrict, setFilterDistrict] = useState('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all');

  // Food Form state (for create / edit)
  const [isEditingFood, setIsEditingFood] = useState(false);
  const [editFoodId, setEditFoodId] = useState<string | null>(null);
  const [formNameEn, setFormNameEn] = useState('');
  const [formNameBn, setFormNameBn] = useState('');
  const [formShortDesc, setFormShortDesc] = useState('');
  const [formDetailedDesc, setFormDetailedDesc] = useState('');
  const [formCategory, setFormCategory] = useState<FoodCategory>('traditional');
  const [formDistrictId, setFormDistrictId] = useState('dhaka');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formOriginHistory, setFormOriginHistory] = useState('');
  const [formOriginSource, setFormOriginSource] = useState('');
  const [formPrice, setFormPrice] = useState('250');
  const [formIsPublished, setFormIsPublished] = useState(true);
  const [formDietary, setFormDietary] = useState<'non-veg' | 'veg' | 'sweet'>('non-veg');
  const [formImageStatus, setFormImageStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const formImageAnalysis = useMemo(() => analyzeImageUrl(formImageUrl), [formImageUrl]);

  useEffect(() => {
    const trimmed = formImageUrl.trim();
    if (!trimmed) {
      setFormImageStatus('idle');
      return;
    }

    if (!isValidFoodImageReference(trimmed)) {
      setFormImageStatus('error');
      return;
    }

    setFormImageStatus('loading');
    const img = new Image();
    img.onload = () => setFormImageStatus('success');
    img.onerror = () => setFormImageStatus('error');
    img.src = trimmed;
  }, [formImageUrl]);

  const [formMsg, setFormMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<{ type: 'food' | 'review'; id: string; name: string } | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Access protection check
  if (!isLoggedIn || !isAdmin) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl border border-red-200 text-center space-y-4 shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
          <Shield className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 font-bengali">
          {language === 'bn' ? 'অননুমোদিত প্রবেশাধিকার' : 'Access Denied'}
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed font-bengali">
          {t('admin.accessDenied')}
        </p>
        <button
          onClick={() => navigate('login')}
          className="px-4 py-2 bg-[#155C3A] text-white text-xs font-bold rounded-xl cursor-pointer font-bengali hover:bg-[#0e442a] transition-colors"
        >
          {t('nav.signIn')}
        </button>
      </div>
    );
  }

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [overviewData, usersData, auditsData, reviewsData, catalogData] = await Promise.all([
        api.getAdminOverview().catch(() => null),
        api.getAdminUsers().catch(() => []),
        api.getAdminAuditLogs().catch(() => []),
        api.getReviews().catch(() => []),
        api.getAdminFoods().catch(() => foods),
      ]);
      if (overviewData) setAdminOverview(overviewData);
      setAdminUsers(usersData);
      setAdminAudits(auditsData);
      setReviews(reviewsData);
      setAdminCatalogFoods(catalogData);
    } catch (err: any) {
      console.error('Failed to load admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update district options filtered by selected division in filter bar
  const availableFilterDistricts = useMemo(() => {
    if (filterDivision === 'all') return districts;
    return districts.filter((d) => d.divisionId === filterDivision);
  }, [filterDivision, districts]);

  // Filtered food catalog
  const filteredCatalogFoods = useMemo(() => {
    const list = adminCatalogFoods.length > 0 ? adminCatalogFoods : foods;
    let result = [...list];

    if (catalogSearch.trim()) {
      const q = catalogSearch.trim().toLowerCase();
      result = result.filter((f) => {
        const dist = districts.find((d) => d.id === f.districtId);
        const div = divisions.find((d) => d.id === f.divisionId);
        return (
          f.nameEn.toLowerCase().includes(q) ||
          f.nameBn.includes(q) ||
          (dist && (dist.nameEn.toLowerCase().includes(q) || dist.nameBn.includes(q))) ||
          (div && (div.nameEn.toLowerCase().includes(q) || div.nameBn.includes(q))) ||
          (f.category && f.category.toLowerCase().includes(q))
        );
      });
    }

    if (filterDivision !== 'all') {
      result = result.filter((f) => f.divisionId === filterDivision);
    }

    if (filterDistrict !== 'all') {
      result = result.filter((f) => f.districtId === filterDistrict);
    }

    if (filterCategory !== 'all') {
      result = result.filter((f) => f.category === filterCategory);
    }

    if (filterStatus === 'published') {
      result = result.filter((f) => f.isPublished);
    } else if (filterStatus === 'draft') {
      result = result.filter((f) => !f.isPublished);
    }

    return result;
  }, [adminCatalogFoods, foods, catalogSearch, filterDivision, filterDistrict, filterCategory, filterStatus, districts, divisions]);

  const handleStartCreateFood = () => {
    setIsEditingFood(true);
    setEditFoodId(null);
    setFormNameEn('');
    setFormNameBn('');
    setFormShortDesc('');
    setFormDetailedDesc('');
    setFormCategory('traditional');
    setFormDistrictId('dhaka');
    setFormImageUrl('');
    setFormOriginHistory('');
    setFormOriginSource('');
    setFormPrice('250');
    setFormIsPublished(true);
    setFormDietary('non-veg');
    setFormMsg(null);

    // Smooth scroll into form view
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  const handleStartEditFood = (food: Food) => {
    setIsEditingFood(true);
    setEditFoodId(food.id);
    setFormNameEn(food.nameEn);
    setFormNameBn(food.nameBn);
    setFormShortDesc(food.shortDescription || '');
    setFormDetailedDesc(food.detailedDescription || '');
    setFormCategory(food.category);
    setFormDistrictId(food.districtId);
    setFormImageUrl(food.imageUrl || '');
    setFormOriginHistory(food.originHistory || '');
    setFormOriginSource(food.originSource || '');
    setFormPrice(String(food.approximatePriceBdt ?? 0));
    setFormIsPublished(food.isPublished);
    setFormDietary(food.dietaryType || 'non-veg');
    setFormMsg(null);

    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  useEffect(() => {
    if (initialEditFoodId) {
      const cleanId = initialEditFoodId.replace(/^(edit\/|food\/|edit-)/, '');
      const list = adminCatalogFoods.length > 0 ? adminCatalogFoods : foods;
      const target = list.find((f) => f.id === cleanId);
      if (target) {
        setActiveTab('foods');
        handleStartEditFood(target);
      }
    }
  }, [initialEditFoodId, adminCatalogFoods, foods]);

  const handleSaveFoodForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMsg(null);

    // Client-side validations
    if (!formNameBn.trim()) {
      setFormMsg({ type: 'error', text: language === 'bn' ? 'খাবারের বাংলা নাম আবশ্যক।' : 'Bengali food name is required.' });
      return;
    }
    if (!formNameEn.trim()) {
      setFormMsg({ type: 'error', text: language === 'bn' ? 'খাবারের ইংরেজি নাম আবশ্যক।' : 'English food name is required.' });
      return;
    }
    if (!formDistrictId) {
      setFormMsg({ type: 'error', text: language === 'bn' ? 'জেলা নির্বাচন করুন।' : 'Please select a district.' });
      return;
    }

    const cleanImageUrl = normalizeImageUrl(formImageUrl);
    if (cleanImageUrl) {
      const analysis = analyzeImageUrl(cleanImageUrl);
      if (!analysis.isValid) {
        setFormMsg({
          type: 'error',
          text: analysis.error || (language === 'bn' ? 'ছবির লিংকটি অবৈধ।' : 'Invalid image URL.'),
        });
        return;
      }
    } else if (!editFoodId) {
      setFormMsg({
        type: 'error',
        text: language === 'bn' ? 'খাবারের ছবির সরাসরি লিংক দিন।' : 'Please provide a food image URL.',
      });
      return;
    }

    const dist = districts.find((d) => d.id === formDistrictId);
    const divId = dist ? dist.divisionId : 'dhaka';

    const existingFood = editFoodId
      ? adminCatalogFoods.find((f) => f.id === editFoodId) || foods.find((f) => f.id === editFoodId)
      : undefined;

    const payload: Partial<Food> = {
      nameEn: formNameEn.trim(),
      nameBn: formNameBn.trim(),
      shortDescription: formShortDesc.trim() || `${formNameEn.trim()} (${formNameBn.trim()}) from ${dist?.nameEn || ''}`,
      detailedDescription: formDetailedDesc.trim() || formShortDesc.trim() || `${formNameEn.trim()} (${formNameBn.trim()}) is a traditional regional specialty of ${dist?.nameEn || ''}, Bangladesh.`,
      category: formCategory,
      districtId: formDistrictId,
      divisionId: divId,
      imageUrl: cleanImageUrl || existingFood?.imageUrl || '',
      originHistory: formOriginHistory.trim(),
      originSource: formOriginSource.trim(),
      approximatePriceBdt: Number(formPrice) || 0,
      isPublished: formIsPublished,
      dietaryType: formDietary,
    };

    try {
      setIsSubmitting(true);
      if (editFoodId) {
        await api.updateFood(editFoodId, payload);
        setFormMsg({
          type: 'success',
          text: language === 'bn' ? 'খাবারটি সফলভাবে আপডেট হয়েছে।' : 'Food item updated successfully.',
        });
      } else {
        await api.createFood(payload);
        setFormMsg({
          type: 'success',
          text: language === 'bn' ? 'নতুন খাবার ক্যাটালগে সফলভাবে যুক্ত হয়েছে।' : 'New food record created and saved.',
        });
      }
      await onRefreshFoods();
      await loadData();
      setTimeout(() => {
        setIsEditingFood(false);
        setFormMsg(null);
      }, 1400);
    } catch (err: any) {
      setFormMsg({ type: 'error', text: err.message || (language === 'bn' ? 'অপারেশন ব্যর্থ হয়েছে।' : 'Operation failed.') });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePublish = async (food: Food) => {
    try {
      const nextStatus = !food.isPublished;
      await api.togglePublishFood(food.id, nextStatus);
      await onRefreshFoods();
      await loadData();
      setActionFeedback({
        type: 'success',
        text: nextStatus
          ? (language === 'bn' ? `"${food.nameBn}" প্রকাশিত হয়েছে এবং সাধারণ ব্যবহারকারীদের জন্য উন্মুক্ত।` : `"${food.nameEn}" is now published and visible to the public.`)
          : (language === 'bn' ? `"${food.nameBn}" ড্রাফট করা হয়েছে এবং পাবলিক থেকে লুকানো আছে।` : `"${food.nameEn}" is now unpublished (draft) and hidden from the public.`),
      });
      setTimeout(() => setActionFeedback(null), 3500);
    } catch (err: any) {
      setActionFeedback({ type: 'error', text: err.message || 'Failed to toggle status.' });
      setTimeout(() => setActionFeedback(null), 4000);
    }
  };

  const handleDeleteFood = (id: string, name: string) => {
    setDeleteConfirmItem({ type: 'food', id, name });
  };

  const handleDeleteReview = (id: string) => {
    setDeleteConfirmItem({ type: 'review', id, name: 'Review ID ' + id });
  };

  const handleExecuteDelete = async () => {
    if (!deleteConfirmItem) return;
    try {
      if (deleteConfirmItem.type === 'food') {
        await api.deleteFood(deleteConfirmItem.id);
        await onRefreshFoods();
        await loadData();
        setActionFeedback({
          type: 'success',
          text: language === 'bn'
            ? `"${deleteConfirmItem.name}" খাদ্য রেকর্ডটি সফলভাবে মুছে ফেলা হয়েছে।`
            : `Food item "${deleteConfirmItem.name}" deleted permanently.`,
        });
      } else {
        await api.deleteReview(deleteConfirmItem.id);
        await loadData();
        setActionFeedback({
          type: 'success',
          text: language === 'bn' ? 'রিভিউটি মুছে ফেলা হয়েছে।' : 'Review removed from community display.',
        });
      }
      setTimeout(() => setActionFeedback(null), 3500);
    } catch (err: any) {
      setActionFeedback({ type: 'error', text: err.message || 'Operation failed.' });
      setTimeout(() => setActionFeedback(null), 4000);
    } finally {
      setDeleteConfirmItem(null);
    }
  };

  const resetFilters = () => {
    setCatalogSearch('');
    setFilterDivision('all');
    setFilterDistrict('all');
    setFilterCategory('all');
    setFilterStatus('all');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-amber-900/10 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-[#155C3A] flex items-center justify-center font-bold">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-bengali">
                {t('admin.title')}
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                {user?.role || 'Admin'}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-bengali mt-0.5">
              {t('admin.subtitle')}
            </p>
          </div>
        </div>

        <button
          onClick={handleStartCreateFood}
          id="admin-add-food-btn"
          className="px-4 py-2.5 bg-[#155C3A] hover:bg-[#0e442a] text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-colors shadow-2xs shrink-0 cursor-pointer font-bengali"
        >
          <Plus className="w-4 h-4" />
          <span>{language === 'bn' ? 'খাবার যোগ করুন' : 'Add Food'}</span>
        </button>
      </div>

      {/* Action feedback banner */}
      {actionFeedback && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-semibold border flex items-center gap-2 transition-all ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          {actionFeedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
          )}
          <span>{actionFeedback.text}</span>
        </div>
      )}

      {/* Confirmation Modal */}
      {deleteConfirmItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center gap-2 text-red-600 font-bold text-sm">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{language === 'bn' ? 'স্থায়ীভাবে মুছে ফেলা নিশ্চিত করুন' : 'Confirm Permanent Deletion'}</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-bengali">
              {language === 'bn' ? (
                <>আপনি কি নিশ্চিত যে <strong className="text-slate-900">{deleteConfirmItem.name}</strong> রেকর্ডটি স্থায়ীভাবে মুছে ফেলতে চান? এটি আর ফিরিয়ে আনা যাবে না।</>
              ) : (
                <>Are you sure you want to delete <strong className="text-slate-900">{deleteConfirmItem.name}</strong>? This action cannot be undone.</>
              )}
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteConfirmItem(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                {language === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="button"
                id="confirm-delete-action-btn"
                onClick={handleExecuteDelete}
                className="px-3.5 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors shadow-xs cursor-pointer font-bengali"
              >
                {language === 'bn' ? 'মুছে ফেলুন' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-amber-900/10 pb-2 overflow-x-auto">
        <button
          onClick={() => { setActiveTab('foods'); }}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors shrink-0 cursor-pointer font-bengali ${
            activeTab === 'foods' ? 'bg-[#155C3A] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {language === 'bn' ? 'খাবার ব্যবস্থাপনা' : 'Food Catalog'} ({adminCatalogFoods.length || foods.length})
        </button>
        <button
          onClick={() => { setActiveTab('requests'); }}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors shrink-0 cursor-pointer font-bengali flex items-center gap-1.5 ${
            activeTab === 'requests' ? 'bg-[#155C3A] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Inbox className="w-3.5 h-3.5" />
          <span>{language === 'bn' ? 'খাবার সংযোজনের অনুরোধ' : 'Food Requests'}</span>
        </button>
        <button
          onClick={() => { setActiveTab('research'); }}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors shrink-0 cursor-pointer font-bengali flex items-center gap-1.5 ${
            activeTab === 'research' ? 'bg-[#155C3A] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>{language === 'bn' ? 'গবেষণা ও জেলা যাচাই (৬৪ জেলা)' : 'Research & 64-District Audit'}</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-sans font-bold">28</span>
        </button>
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors shrink-0 cursor-pointer font-bengali ${
            activeTab === 'overview' ? 'bg-[#155C3A] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {language === 'bn' ? 'সংক্ষিপ্ত পরিসংখ্যান' : 'System Overview'}
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors shrink-0 cursor-pointer font-bengali ${
            activeTab === 'users' ? 'bg-[#155C3A] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {language === 'bn' ? 'নিবন্ধিত খাদক' : 'Users'} ({adminUsers.length})
        </button>
        <button
          onClick={() => setActiveTab('reviews')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors shrink-0 cursor-pointer font-bengali ${
            activeTab === 'reviews' ? 'bg-[#155C3A] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {language === 'bn' ? 'রিভিউ মডারেশন' : 'Review Moderation'} ({reviews.length})
        </button>
        <button
          onClick={() => setActiveTab('audits')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors shrink-0 cursor-pointer font-bengali ${
            activeTab === 'audits' ? 'bg-[#155C3A] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {language === 'bn' ? 'নিরাপত্তা লগ' : 'Audit Logs'} ({adminAudits.length})
        </button>
      </div>

      {/* Tab: Food Requests */}
      {activeTab === 'requests' && (
        <AdminFoodRequestsTab
          districts={districts}
          divisions={divisions}
          onRefreshFoods={onRefreshFoods}
          navigate={navigate}
        />
      )}

      {/* Tab: Research & 64-District Audit */}
      {activeTab === 'research' && (
        <AdminResearchDossierTab
          onFoodPublished={onRefreshFoods}
          navigate={navigate}
        />
      )}

      {/* Tab: Foods Management */}
      {activeTab === 'foods' && (
        <div className="space-y-6">
          {/* Create / Edit Form Section: “খাবার যোগ করুন” / “Add Food” */}
          {isEditingFood && (
            <div id="add-food-section" className="bg-white rounded-3xl border border-emerald-800/20 p-6 sm:p-8 shadow-md space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-[#155C3A] flex items-center justify-center">
                    {editFoodId ? <Edit className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 font-bengali">
                      {editFoodId
                        ? (language === 'bn' ? 'খাবার রেকর্ড সম্পাদনা' : 'Edit Regional Food Record')
                        : (language === 'bn' ? 'খাবার যোগ করুন' : 'Add Food')}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-bengali">
                      {language === 'bn'
                        ? 'সঠিক তথ্য দিয়ে বাংলাদেশের আঞ্চলিক খাবারের তথ্যভাণ্ডার সমৃদ্ধ করুন'
                        : 'Accurately document authentic district culinary records'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditingFood(false)}
                  className="text-xs text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  {language === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
              </div>

              {formMsg && (
                <div
                  className={`p-3.5 rounded-xl text-xs font-semibold border flex items-center gap-2 ${
                    formMsg.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-red-50 border-red-200 text-red-800'
                  }`}
                >
                  {formMsg.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                  )}
                  <span>{formMsg.text}</span>
                </div>
              )}

              <form onSubmit={handleSaveFoodForm} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Bengali Name (required) */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 font-bengali">
                      {language === 'bn' ? 'খাবারের নাম (বাংলা) *' : 'Food Name (Bengali) *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={formNameBn}
                      onChange={(e) => setFormNameBn(e.target.value)}
                      placeholder={language === 'bn' ? 'যেমন: পোড়াবাড়ির চমচম' : 'e.g. পোড়াবাড়ির চমচম'}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#155C3A] font-bengali outline-none"
                    />
                  </div>

                  {/* English Name (required) */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {language === 'bn' ? 'খাবারের নাম (ইংরেজি) *' : 'Food Name (English) *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={formNameEn}
                      onChange={(e) => setFormNameEn(e.target.value)}
                      placeholder="e.g. Porabari Chomchom"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#155C3A] outline-none"
                    />
                  </div>

                  {/* District (required) */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 font-bengali">
                      {language === 'bn' ? 'জেলা (District) *' : 'District *'}
                    </label>
                    <select
                      value={formDistrictId}
                      onChange={(e) => setFormDistrictId(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#155C3A] outline-none"
                    >
                      {districts.map((d) => (
                        <option key={d.id} value={d.id}>
                          {language === 'bn' ? `${d.nameBn} (${d.nameEn})` : `${d.nameEn} (${d.nameBn})`} · {d.divisionId.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Division (read-only auto-synced with district) */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 font-bengali">
                      {language === 'bn' ? 'বিভাগ (Division)' : 'Division (Auto)'}
                    </label>
                    <div className="w-full px-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-medium">
                      {(() => {
                        const d = districts.find((x) => x.id === formDistrictId);
                        const dv = divisions.find((x) => x.id === d?.divisionId);
                        return dv ? (language === 'bn' ? `${dv.nameBn} (${dv.nameEn})` : `${dv.nameEn} Division`) : 'Auto';
                      })()}
                    </div>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 font-bengali">
                      {language === 'bn' ? 'ক্যাটাগরি (ধরন)' : 'Food Category'}
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#155C3A] outline-none font-bengali"
                    >
                      {FOOD_CATEGORIES.map((c) => (
                        <option key={c.id} value={c.id}>
                          {language === 'bn' ? `${c.nameBn} (${c.nameEn})` : `${c.nameEn} (${c.nameBn})`}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Dietary */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 font-bengali">
                      {language === 'bn' ? 'আহারের ধরন (Dietary)' : 'Dietary Type'}
                    </label>
                    <select
                      value={formDietary}
                      onChange={(e) => setFormDietary(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#155C3A] outline-none"
                    >
                      <option value="non-veg">Non-Veg (আমিষ)</option>
                      <option value="veg">Vegetarian (নিরামিষ)</option>
                      <option value="sweet">Sweet / Mishti (মিষ্টি)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Food Image Direct Upload */}
                  <div className="sm:col-span-2">
                    <FoodImageUpload
                      value={formImageUrl}
                      onChange={setFormImageUrl}
                      context="food"
                      targetId={editFoodId || undefined}
                      label={language === 'bn' ? 'খাবারের ছবি (ছবি আপলোড করুন)' : 'Food Image (Direct Upload)'}
                    />
                  </div>

                  {/* Price */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 font-bengali">
                      {language === 'bn' ? 'আনুমানিক দাম (টাকা)' : 'Approx. Price (BDT)'}
                    </label>
                    <input
                      type="number"
                      value={formPrice}
                      onChange={(e) => setFormPrice(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#155C3A] outline-none"
                    />
                  </div>
                </div>

                {/* Short Description */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 font-bengali">
                    {language === 'bn' ? 'সংক্ষিপ্ত বিবরণ (Short Description)' : 'Short Description'}
                  </label>
                  <textarea
                    rows={2}
                    value={formShortDesc}
                    onChange={(e) => setFormShortDesc(e.target.value)}
                    placeholder={language === 'bn' ? 'খাবারটির সংক্ষিপ্ত বিশেষত্ব লিখুন...' : 'Brief summary of the culinary dish...'}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#155C3A] font-bengali outline-none"
                  />
                </div>

                {/* Detailed Description */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 font-bengali">
                    {language === 'bn' ? 'বিস্তারিত বিবরণ ও প্রস্তুতপ্রণালী' : 'Detailed Preparation & Tasting Notes'}
                  </label>
                  <textarea
                    rows={3}
                    value={formDetailedDesc}
                    onChange={(e) => setFormDetailedDesc(e.target.value)}
                    placeholder={language === 'bn' ? 'ঐতিহ্যবাহী রন্ধনপ্রণালী ও স্বাদ পরিচিতি...' : 'Authentic preparation, serving tradition, and sensory notes...'}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#155C3A] font-bengali outline-none"
                  />
                </div>

                {/* Historical Origin / Citation */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 font-bengali">
                      {language === 'bn' ? 'ঐতিহাসিক পটভূমি ও রন্ধনগাথা' : 'Historical Origin & Lore'}
                    </label>
                    <textarea
                      rows={2}
                      value={formOriginHistory}
                      onChange={(e) => setFormOriginHistory(e.target.value)}
                      placeholder={language === 'bn' ? 'খাবারটির উৎপত্তির শতবর্ষী গল্প...' : 'Historical origin story of the artisan culinary item...'}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#155C3A] font-bengali outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 font-bengali">
                      {language === 'bn' ? 'তথ্যসূত্র ও উৎস (Source Citation)' : 'Origin Source Citation'}
                    </label>
                    <textarea
                      rows={2}
                      value={formOriginSource}
                      onChange={(e) => setFormOriginSource(e.target.value)}
                      placeholder={language === 'bn' ? 'যেমন: বাংলা একাডেমি লোকজ সংগ্রহ, জেলা গেজেটিয়ার' : 'e.g. Bangla Academy Folk Heritage Archive, District Gazetteer'}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#155C3A] font-bengali outline-none"
                    />
                  </div>
                </div>

                {/* Publication Status Checkbox */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-slate-100">
                  <label className="flex items-center gap-3 cursor-pointer text-xs font-bold text-slate-800">
                    <input
                      type="checkbox"
                      checked={formIsPublished}
                      onChange={(e) => setFormIsPublished(e.target.checked)}
                      className="w-4 h-4 rounded text-[#155C3A] focus:ring-[#155C3A] cursor-pointer"
                    />
                    <div className="flex items-center gap-2 font-bengali">
                      <span>{language === 'bn' ? 'অবিলম্বে প্রকাশ করুন (Publicly Published)' : 'Publish immediately (Publicly visible)'}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        formIsPublished ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {formIsPublished ? (language === 'bn' ? 'প্রকাশিত' : 'Published') : (language === 'bn' ? 'অপ্রকাশিত (ড্রাফট)' : 'Draft')}
                      </span>
                    </div>
                  </label>

                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingFood(false)}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                    >
                      {language === 'bn' ? 'বাতিল' : 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2 bg-[#155C3A] hover:bg-[#0e442a] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 font-bengali disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <span>{language === 'bn' ? 'সংরক্ষণ হচ্ছে...' : 'Saving...'}</span>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{editFoodId ? (language === 'bn' ? 'আপডেট করুন' : 'Update Record') : (language === 'bn' ? 'খাবার সংরক্ষণ করুন' : 'Save Food Record')}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* Search & Filter Toolbar */}
          <div className="bg-white p-5 rounded-3xl border border-amber-900/10 shadow-2xs space-y-4">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  placeholder={language === 'bn' ? 'খাবার খুঁজুন (নাম বা জেলা)...' : 'Search catalog (name or district)...'}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#155C3A] outline-none font-bengali"
                />
              </div>

              {/* Status filter toggle pills */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start md:self-auto text-xs font-bold shrink-0">
                <button
                  type="button"
                  onClick={() => setFilterStatus('all')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer font-bengali ${
                    filterStatus === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {language === 'bn' ? 'সব' : 'All'}
                </button>
                <button
                  type="button"
                  onClick={() => setFilterStatus('published')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer font-bengali ${
                    filterStatus === 'published' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {language === 'bn' ? 'প্রকাশিত' : 'Published'}
                </button>
                <button
                  type="button"
                  onClick={() => setFilterStatus('draft')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer font-bengali ${
                    filterStatus === 'draft' ? 'bg-amber-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {language === 'bn' ? 'ড্রাফট' : 'Drafts'}
                </button>
              </div>
            </div>

            {/* Division, District, Category dropdown filters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 text-xs">
              <div>
                <select
                  value={filterDivision}
                  onChange={(e) => {
                    setFilterDivision(e.target.value);
                    setFilterDistrict('all');
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-700 outline-none font-bengali"
                >
                  <option value="all">{language === 'bn' ? 'সকল বিভাগ (All Divisions)' : 'All Divisions'}</option>
                  {divisions.map((div) => (
                    <option key={div.id} value={div.id}>
                      {language === 'bn' ? div.nameBn : div.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  value={filterDistrict}
                  onChange={(e) => setFilterDistrict(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-700 outline-none font-bengali"
                >
                  <option value="all">{language === 'bn' ? 'সকল জেলা (All Districts)' : 'All Districts'}</option>
                  {availableFilterDistricts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {language === 'bn' ? d.nameBn : d.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-700 outline-none font-bengali"
                >
                  <option value="all">{language === 'bn' ? 'সকল ক্যাটাগরি (All Categories)' : 'All Categories'}</option>
                  {FOOD_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {language === 'bn' ? c.nameBn : c.nameEn}
                    </option>
                  ))}
                </select>

                {(catalogSearch || filterDivision !== 'all' || filterDistrict !== 'all' || filterCategory !== 'all' || filterStatus !== 'all') && (
                  <button
                    onClick={resetFilters}
                    title={language === 'bn' ? 'ফিল্টার রিসেট' : 'Reset filters'}
                    className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl cursor-pointer shrink-0"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Foods Table */}
          <div className="bg-white rounded-3xl border border-amber-900/10 overflow-hidden shadow-2xs">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UtensilsCrossed className="w-4 h-4 text-[#155C3A]" />
                <h3 className="font-bold text-xs sm:text-sm text-slate-900 font-bengali">
                  {language === 'bn' ? 'নথিভুক্ত খাবার ক্যাটালগ' : 'Registered Culinary Catalog'}
                </h3>
                <span className="text-xs text-slate-400">({filteredCatalogFoods.length})</span>
              </div>

              {!isEditingFood && (
                <button
                  type="button"
                  onClick={handleStartCreateFood}
                  className="text-xs font-bold text-[#155C3A] hover:underline flex items-center gap-1 cursor-pointer font-bengali"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{language === 'bn' ? 'খাবার যোগ করুন' : 'Add Food'}</span>
                </button>
              )}
            </div>

            {filteredCatalogFoods.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <UtensilsCrossed className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500 font-bengali">
                  {language === 'bn' ? 'কোনো খাবার রেকর্ড খুঁজে পাওয়া যায়নি।' : 'No food records match your search criteria.'}
                </p>
                <button
                  onClick={resetFilters}
                  className="px-3 py-1.5 text-xs text-[#155C3A] font-bold hover:underline cursor-pointer"
                >
                  {language === 'bn' ? 'ফিল্টার রিসেট করুন' : 'Clear filters'}
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="p-4">{language === 'bn' ? 'খাবার' : 'Dish'}</th>
                      <th className="p-4">{language === 'bn' ? 'জেলা' : 'District'}</th>
                      <th className="p-4">{language === 'bn' ? 'বিভাগ' : 'Division'}</th>
                      <th className="p-4">{language === 'bn' ? 'ক্যাটাগরি' : 'Category'}</th>
                      <th className="p-4">{language === 'bn' ? 'দাম' : 'Price'}</th>
                      <th className="p-4">{language === 'bn' ? 'অবস্থা' : 'Status'}</th>
                      <th className="p-4 text-right">{language === 'bn' ? 'অ্যাকশন' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredCatalogFoods.map((food) => {
                      const dist = districts.find((d) => d.id === food.districtId);
                      const div = divisions.find((d) => d.id === food.divisionId);

                      return (
                        <tr key={food.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg overflow-hidden ring-1 ring-slate-200 shrink-0">
                                <FoodImage
                                  src={food.imageUrl}
                                  alt={food.nameEn}
                                  className="w-full h-full object-cover"
                                  containerClassName="w-full h-full relative overflow-hidden bg-slate-100"
                                  isAdmin={isAdmin}
                                  loading="lazy"
                                />
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 font-bengali text-sm">
                                  {food.nameBn}
                                </p>
                                <p className="text-[11px] text-slate-500">{food.nameEn}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 font-medium font-bengali">
                            {dist ? (language === 'bn' ? dist.nameBn : dist.nameEn) : food.districtId}
                          </td>
                          <td className="p-4 font-bengali">
                            {div ? (language === 'bn' ? div.nameBn : div.nameEn) : food.divisionId}
                          </td>
                          <td className="p-4 capitalize">
                            {food.category.replace('_', ' ')}
                          </td>
                          <td className="p-4 font-semibold">৳{food.approximatePriceBdt || 0}</td>
                          <td className="p-4">
                            <button
                              type="button"
                              onClick={() => handleTogglePublish(food)}
                              title={food.isPublished ? 'Click to Unpublish' : 'Click to Publish'}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                                food.isPublished
                                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                  : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                              }`}
                            >
                              {food.isPublished ? (
                                <>
                                  <Eye className="w-3 h-3 text-emerald-600" />
                                  <span>{language === 'bn' ? 'প্রকাশিত' : 'Published'}</span>
                                </>
                              ) : (
                                <>
                                  <EyeOff className="w-3 h-3 text-amber-600" />
                                  <span>{language === 'bn' ? 'ড্রাফট' : 'Draft'}</span>
                                </>
                              )}
                            </button>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Quick toggle publish button */}
                              <button
                                onClick={() => handleTogglePublish(food)}
                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                  food.isPublished
                                    ? 'text-slate-500 hover:text-amber-700 hover:bg-amber-50'
                                    : 'text-slate-500 hover:text-emerald-700 hover:bg-emerald-50'
                                }`}
                                title={food.isPublished ? (language === 'bn' ? 'ড্রাফট করুন' : 'Unpublish') : (language === 'bn' ? 'প্রকাশ করুন' : 'Publish')}
                              >
                                {food.isPublished ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>

                              {/* Edit button */}
                              <button
                                onClick={() => handleStartEditFood(food)}
                                className="p-1.5 text-slate-600 hover:text-[#155C3A] hover:bg-slate-100 rounded-lg cursor-pointer"
                                title={language === 'bn' ? 'সম্পাদনা' : 'Edit'}
                              >
                                <Edit className="w-4 h-4" />
                              </button>

                              {/* Delete button */}
                              <button
                                onClick={() => handleDeleteFood(food.id, food.nameEn || food.nameBn)}
                                className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg cursor-pointer"
                                title={language === 'bn' ? 'মুছে ফেলুন' : 'Delete'}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: System Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-amber-900/10 shadow-2xs">
              <p className="text-2xl font-black text-[#155C3A]">{adminOverview?.totalFoods || foods.length}</p>
              <p className="text-xs font-bold text-slate-800 font-bengali">
                {language === 'bn' ? 'মোট নথিভুক্ত খাবার' : 'Total Foods Cataloged'}
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-amber-900/10 shadow-2xs">
              <p className="text-2xl font-black text-slate-800">{adminOverview?.totalUsers || adminUsers.length}</p>
              <p className="text-xs font-bold text-slate-800 font-bengali">
                {language === 'bn' ? 'নিবন্ধিত খাদক' : 'Registered Users'}
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-amber-900/10 shadow-2xs">
              <p className="text-2xl font-black text-[#E74C3C]">{adminOverview?.totalReviews || reviews.length}</p>
              <p className="text-xs font-bold text-slate-800 font-bengali">
                {language === 'bn' ? 'মোট পর্যালোচনা' : 'Community Reviews'}
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-amber-900/10 shadow-2xs">
              <p className="text-2xl font-black text-[#F39C3D]">{adminOverview?.totalTrackingEntries || 0}</p>
              <p className="text-xs font-bold text-slate-800 font-bengali">
                {language === 'bn' ? 'স্বাদযাত্রার এন্ট্রি' : 'Tracking Entries'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Users */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl border border-amber-900/10 overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 font-bengali">
              {language === 'bn' ? 'নিবন্ধিত খাদক অ্যাকাউন্ট তালিকা' : 'Registered User Accounts'}
            </h3>
            <span className="text-xs text-slate-400">{adminUsers.length} accounts</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px]">
                <tr>
                  <th className="p-4">{language === 'bn' ? 'ব্যবহারকারী' : 'User'}</th>
                  <th className="p-4">{language === 'bn' ? 'ইমেইল' : 'Email'}</th>
                  <th className="p-4">{language === 'bn' ? 'ভূমিকা' : 'Role'}</th>
                  <th className="p-4">{language === 'bn' ? 'নিজ জেলা' : 'Home District'}</th>
                  <th className="p-4">{language === 'bn' ? 'তারিখ' : 'Created Date'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {adminUsers.map((u) => (
                  <tr key={u.id}>
                    <td className="p-4 font-semibold text-slate-900 flex items-center gap-2">
                      <img src={u.avatarUrl} alt={u.name} className="w-6 h-6 rounded-full" />
                      <span>{u.name}</span>
                    </td>
                    <td className="p-4 text-slate-600">{u.email}</td>
                    <td className="p-4">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100">
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4 capitalize">{u.homeDistrictId || 'dhaka'}</td>
                    <td className="p-4 text-slate-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Reviews */}
      {activeTab === 'reviews' && (
        <div className="bg-white rounded-3xl border border-amber-900/10 p-6 space-y-4 shadow-2xs">
          <h3 className="font-bold text-sm text-slate-900 font-bengali">
            {language === 'bn' ? 'কমিউনিটি রিভিউ মডারেশন' : 'Community Reviews Moderation'}
          </h3>
          {reviews.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No community reviews submitted yet.</p>
          ) : (
            <div className="space-y-3">
              {reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 flex items-start justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{rev.userName}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(rev.createdAt).toLocaleDateString()}
                      </span>
                      <span className="text-amber-500 font-bold">★ {rev.rating}/5</span>
                    </div>
                    <p className="text-xs text-slate-600">"{rev.comment}"</p>
                  </div>

                  <button
                    onClick={() => handleDeleteReview(rev.id)}
                    className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{language === 'bn' ? 'মুছে ফেলুন' : 'Delete'}</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Audit Logs */}
      {activeTab === 'audits' && (
        <div className="bg-white rounded-3xl border border-amber-900/10 p-6 space-y-4 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-sm font-bengali">
            <History className="w-4 h-4 text-[#155C3A]" />
            <span>{language === 'bn' ? 'অ্যাডমিনিস্ট্রেটর সিকিউরিটি অডিট ট্রেইল' : 'Administrator Security Audit Trail'}</span>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {adminAudits.map((log) => (
              <div key={log.id} className="py-3 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 font-mono text-[11px] bg-slate-100 px-1.5 py-0.5 rounded">
                      {log.action}
                    </span>
                    <span className="text-slate-500">by {log.userName}</span>
                  </div>
                  <p className="text-slate-600 mt-1">{log.details}</p>
                </div>
                <span className="text-[10px] text-slate-400 shrink-0">
                  {new Date(log.createdAt).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
