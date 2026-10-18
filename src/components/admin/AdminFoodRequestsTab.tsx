import React, { useState, useEffect, useMemo } from 'react';
import { FoodSubmission, District, Division, FoodCategory } from '../../types';
import { FOOD_CATEGORIES } from '../../data/divisionsAndDistricts';
import { api } from '../../lib/api';
import { useLanguage } from '../../i18n';
import { FoodImage } from '../common/FoodImage';
import { FoodImageUpload } from '../common/FoodImageUpload';
import {
  Inbox,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  AlertTriangle,
  ExternalLink,
  MessageSquare,
  Check,
  X,
  Edit,
  Eye,
  Calendar,
  User,
  MapPin,
  RefreshCw,
  Sparkles,
  Link2,
} from 'lucide-react';
import { analyzeImageUrl, normalizeImageUrl } from '../../lib/imageUrlHelper';

export interface AdminFoodRequestsTabProps {
  districts: District[];
  divisions: Division[];
  onRefreshFoods: () => Promise<void>;
  navigate: (route: string, param?: string) => void;
}

export const AdminFoodRequestsTab: React.FC<AdminFoodRequestsTabProps> = ({
  districts,
  divisions,
  onRefreshFoods,
  navigate,
}) => {
  const { language, localizedName } = useLanguage();

  const [submissions, setSubmissions] = useState<
    (FoodSubmission & {
      potentialDuplicate?: { id: string; nameEn: string; nameBn: string; districtId: string } | null;
    })[]
  >([]);
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('all');
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Review & Correction Modal
  const [reviewingSub, setReviewingSub] = useState<
    (FoodSubmission & {
      potentialDuplicate?: { id: string; nameEn: string; nameBn: string; districtId: string } | null;
    }) | null
  >(null);

  // Correction form fields
  const [corrNameBn, setCorrNameBn] = useState('');
  const [corrNameEn, setCorrNameEn] = useState('');
  const [corrDistrictId, setCorrDistrictId] = useState('');
  const [corrCategory, setCorrCategory] = useState<FoodCategory>('traditional');
  const [corrDietary, setCorrDietary] = useState<'non-veg' | 'veg' | 'sweet'>('non-veg');
  const [corrPrice, setCorrPrice] = useState('0');
  const [corrImageUrl, setCorrImageUrl] = useState('');
  const [corrShortDesc, setCorrShortDesc] = useState('');
  const [corrDetailedDesc, setCorrDetailedDesc] = useState('');
  const [corrOriginHistory, setCorrOriginHistory] = useState('');
  const [corrOriginSource, setCorrOriginSource] = useState('');
  const [adminFeedbackInput, setAdminFeedbackInput] = useState('');
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // Quick Reject Dialog
  const [quickRejectSub, setQuickRejectSub] = useState<FoodSubmission | null>(null);
  const [quickRejectReason, setQuickRejectReason] = useState('');

  const loadSubmissions = async () => {
    try {
      setIsLoading(true);
      const data = await api.getAdminSubmissions({
        status: statusFilter,
        search: searchQuery,
        division: selectedDivision,
        district: selectedDistrict,
      });
      setSubmissions(data);
    } catch (err: any) {
      console.error('Failed to load submissions:', err);
      setFeedbackMsg({
        type: 'error',
        text: err.message || 'Failed to load submissions.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSubmissions();
  }, [statusFilter, selectedDivision, selectedDistrict]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadSubmissions();
  };

  const openReviewModal = (
    sub: FoodSubmission & {
      potentialDuplicate?: { id: string; nameEn: string; nameBn: string; districtId: string } | null;
    }
  ) => {
    setReviewingSub(sub);
    setCorrNameBn(sub.nameBn);
    setCorrNameEn(sub.nameEn);
    setCorrDistrictId(sub.districtId);
    setCorrCategory(sub.category);
    setCorrDietary(sub.dietaryType || 'non-veg');
    setCorrPrice(String(sub.approximatePriceBdt || 0));
    setCorrImageUrl(sub.imageUrl || '');
    setCorrShortDesc(sub.shortDescription);
    setCorrDetailedDesc(sub.detailedDescription || '');
    setCorrOriginHistory(sub.originHistory || '');
    setCorrOriginSource(sub.originSource || '');
    setAdminFeedbackInput(sub.adminFeedback || '');
  };

  const handleExecuteApproval = async (subId: string) => {
    try {
      setIsProcessingAction(true);
      const res = await api.reviewAdminSubmission(subId, {
        action: 'approve',
        adminFeedback: adminFeedbackInput.trim() || 'Approved for catalog publishing.',
        correctedData: {
          nameBn: corrNameBn.trim(),
          nameEn: corrNameEn.trim(),
          districtId: corrDistrictId,
          category: corrCategory,
          dietaryType: corrDietary,
          approximatePriceBdt: Number(corrPrice) || 0,
          imageUrl: corrImageUrl.trim(),
          shortDescription: corrShortDesc.trim(),
          detailedDescription: corrDetailedDesc.trim(),
          originHistory: corrOriginHistory.trim(),
          originSource: corrOriginSource.trim(),
        },
      });

      setFeedbackMsg({
        type: 'success',
        text: language === 'bn'
          ? `খাবার "${res.submission.nameBn}" অনুমোদিত এবং ক্যাটালগে প্রকাশিত হয়েছে!`
          : `Food "${res.submission.nameEn}" successfully approved and published to catalog!`,
      });

      await onRefreshFoods();
      await loadSubmissions();
      setReviewingSub(null);
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err: any) {
      setFeedbackMsg({
        type: 'error',
        text: err.message || 'Approval failed.',
      });
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleExecuteRejection = async (subId: string, reason: string) => {
    if (!reason || !reason.trim()) {
      setFeedbackMsg({
        type: 'error',
        text: language === 'bn' ? 'প্রত্যাখ্যানের কারণ উল্লেখ করা আবশ্যক।' : 'Rejection feedback is required.',
      });
      return;
    }

    try {
      setIsProcessingAction(true);
      const res = await api.reviewAdminSubmission(subId, {
        action: 'reject',
        adminFeedback: reason.trim(),
      });

      setFeedbackMsg({
        type: 'success',
        text: language === 'bn'
          ? `অনুরোধ "${res.submission.nameBn}" প্রত্যাখ্যান করা হয়েছে।`
          : `Submission "${res.submission.nameEn}" was rejected with feedback.`,
      });

      await loadSubmissions();
      setReviewingSub(null);
      setQuickRejectSub(null);
      setQuickRejectReason('');
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err: any) {
      setFeedbackMsg({
        type: 'error',
        text: err.message || 'Rejection failed.',
      });
    } finally {
      setIsProcessingAction(false);
    }
  };

  const availableDistricts = useMemo(() => {
    if (selectedDivision === 'all') return districts;
    return districts.filter((d) => d.divisionId === selectedDivision);
  }, [selectedDivision, districts]);

  return (
    <div className="space-y-6">
      {/* Tab Header & Sub-Tabs */}
      <div className="bg-white rounded-3xl border border-amber-900/10 p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <Inbox className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 font-bengali">
                {language === 'bn' ? 'খাবার সংযোজনের অনুরোধ' : 'Community Food Requests'}
              </h2>
              <p className="text-xs text-slate-500 font-bengali">
                {language === 'bn'
                  ? 'ব্যবহারকারীদের পাঠানো আঞ্চলিক খাবারের প্রস্তাব যাচাই ও প্রকাশ করুন'
                  : 'Review, correct inaccuracies, approve into public catalog, or decline community submissions'}
              </p>
            </div>
          </div>

          {/* Sub-Tabs: Pending / Approved / Rejected */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl shrink-0">
            <button
              type="button"
              onClick={() => setStatusFilter('pending')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all font-bengali flex items-center gap-1.5 ${
                statusFilter === 'pending'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'অপেক্ষমাণ' : 'Pending'}</span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('approved')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all font-bengali flex items-center gap-1.5 ${
                statusFilter === 'approved'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'অনুমোদিত' : 'Approved'}</span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('rejected')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all font-bengali flex items-center gap-1.5 ${
                statusFilter === 'rejected'
                  ? 'bg-rose-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'প্রত্যাখ্যাত' : 'Rejected'}</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[200px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                language === 'bn'
                  ? 'খাবারের নাম, জেলা, বিভাগ বা প্রস্তাবকের নামে খুঁজুন...'
                  : 'Search by food name, district, or submitter...'
              }
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#155C3A]"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </form>

          <select
            value={selectedDivision}
            onChange={(e) => {
              setSelectedDivision(e.target.value);
              setSelectedDistrict('all');
            }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#155C3A]"
          >
            <option value="all">{language === 'bn' ? 'সকল বিভাগ' : 'All Divisions'}</option>
            {divisions.map((div) => (
              <option key={div.id} value={div.id}>
                {localizedName(div)}
              </option>
            ))}
          </select>

          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#155C3A]"
          >
            <option value="all">{language === 'bn' ? 'সকল জেলা' : 'All Districts'}</option>
            {availableDistricts.map((d) => (
              <option key={d.id} value={d.id}>
                {localizedName(d)}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={loadSubmissions}
            className="p-2 text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Action Notification */}
      {feedbackMsg && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2 border ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          {feedbackMsg.type === 'success' ? (
            <Check className="w-4 h-4 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-600" />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Submissions Cards */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-100">
          {language === 'bn' ? 'অনুরোধ তালিকা লোড হচ্ছে...' : 'Loading food requests...'}
        </div>
      ) : submissions.length === 0 ? (
        <div className="p-12 text-center space-y-2 bg-white rounded-3xl border border-amber-900/10">
          <p className="font-bold text-sm text-slate-800 font-bengali">
            {language === 'bn'
              ? `"${statusFilter}" তালিকায় কোনো অনুরোধ পাওয়া যায়নি`
              : `No ${statusFilter} food requests found`}
          </p>
          <p className="text-xs text-slate-400 font-bengali">
            {language === 'bn'
              ? 'নতুন কমিউনিটি প্রস্তাব আসলে এখানে দেখতে পাবেন।'
              : 'New community food suggestions will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {submissions.map((sub) => {
            const district = districts.find((d) => d.id === sub.districtId);
            const division = divisions.find((div) => div.id === sub.divisionId);

            return (
              <div
                key={sub.id}
                className="bg-white rounded-3xl border border-amber-900/10 p-5 sm:p-6 shadow-2xs space-y-4 hover:border-emerald-600/30 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  {/* Thumbnail & Title */}
                  <div className="flex items-start gap-4">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shrink-0 border border-slate-200 bg-slate-100">
                      <FoodImage
                        src={sub.imageUrl}
                        alt={sub.nameEn}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-base text-slate-900 font-bengali">
                          {sub.nameBn}
                        </h3>
                        <span className="text-xs text-slate-500 font-medium">({sub.nameEn})</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 font-bengali">
                        <span className="flex items-center gap-1 text-emerald-800 font-semibold">
                          <MapPin className="w-3.5 h-3.5" />
                          {district ? localizedName(district) : sub.districtId} (
                          {division ? localizedName(division) : sub.divisionId})
                        </span>
                        <span>•</span>
                        <span className="capitalize text-slate-500">{sub.category.replace('_', ' ')}</span>
                        {sub.approximatePriceBdt ? (
                          <>
                            <span>•</span>
                            <span className="font-medium">৳ {sub.approximatePriceBdt}</span>
                          </>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" />
                          <strong className="text-slate-700">{sub.submitterName}</strong>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-mono">ID: {sub.id}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(sub.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Status */}
                  <div className="flex flex-wrap sm:flex-col items-end gap-2 shrink-0">
                    {sub.status === 'pending' ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openReviewModal(sub)}
                          className="px-3.5 py-1.5 bg-[#155C3A] hover:bg-[#10482d] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer font-bengali"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{language === 'bn' ? 'পর্যালোচনা' : 'Review & Edit'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setQuickRejectSub(sub);
                            setQuickRejectReason('');
                          }}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer font-bengali"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>{language === 'bn' ? 'প্রত্যাখ্যান' : 'Reject'}</span>
                        </button>
                      </div>
                    ) : sub.status === 'approved' ? (
                      <div className="space-y-1 text-right">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{language === 'bn' ? 'অনুমোদিত' : 'Approved'}</span>
                        </span>
                        {sub.approvedFoodId && (
                          <div>
                            <button
                              type="button"
                              onClick={() => navigate('food', sub.approvedFoodId)}
                              className="text-xs text-emerald-700 hover:underline font-bold inline-flex items-center gap-1 cursor-pointer"
                            >
                              <span>{language === 'bn' ? 'ক্যাটালগে দেখুন' : 'View in Catalog'}</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">
                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                        <span>{language === 'bn' ? 'প্রত্যাখ্যাত' : 'Rejected'}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Duplicate Warning Indicator */}
                {sub.potentialDuplicate && (
                  <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs space-y-1">
                    <p className="font-bold text-amber-900 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>
                        {language === 'bn'
                          ? `সতর্কতা: এই জেলায় অনুরূপ খাবার "${sub.potentialDuplicate.nameBn}" (${sub.potentialDuplicate.nameEn}) আগে থেকেই ক্যাটালগে বিদ্যমান!`
                          : `Notice: Matching catalog food "${sub.potentialDuplicate.nameEn}" already exists in this district!`}
                      </span>
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate('food', sub.potentialDuplicate!.id)}
                      className="text-amber-800 underline font-semibold hover:text-amber-950 inline-flex items-center gap-1"
                    >
                      <span>{language === 'bn' ? 'বিদ্যমান খাবারটি পরীক্ষা করুন' : 'Inspect Existing Catalog Food'}</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {/* Descriptions & Sources */}
                <div className="text-xs space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-slate-700 leading-relaxed font-bengali">
                    <strong className="text-slate-900">
                      {language === 'bn' ? 'সংক্ষিপ্ত বিবরণ:' : 'Short Description:'}
                    </strong>{' '}
                    {sub.shortDescription}
                  </p>

                  {sub.detailedDescription && (
                    <p className="text-slate-600 leading-relaxed font-bengali">
                      <strong className="text-slate-800">
                        {language === 'bn' ? 'বিস্তারিত নোট:' : 'Detailed Notes:'}
                      </strong>{' '}
                      {sub.detailedDescription}
                    </p>
                  )}

                  {sub.originHistory && (
                    <p className="text-slate-600 leading-relaxed font-bengali">
                      <strong className="text-slate-800">
                        {language === 'bn' ? 'ঐতিহাসিক পটভূমি:' : 'History:'}
                      </strong>{' '}
                      {sub.originHistory}
                    </p>
                  )}

                  {sub.originSource && (
                    <p className="text-slate-600 leading-relaxed flex items-center gap-1.5 font-bengali">
                      <Link2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <strong className="text-slate-800">
                        {language === 'bn' ? 'তথ্যসূত্র:' : 'Sources:'}
                      </strong>{' '}
                      <span>{sub.originSource}</span>
                    </p>
                  )}
                </div>

                {/* Audit & Review History */}
                {sub.reviewedAt && (
                  <div className="text-[11px] text-slate-500 pt-1 flex flex-wrap items-center gap-3">
                    <span>
                      {language === 'bn' ? 'পর্যালোচক:' : 'Reviewed by:'}{' '}
                      <strong className="text-slate-700">{sub.reviewedByUserName || 'Admin'}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      {language === 'bn' ? 'তারিখ:' : 'Date:'}{' '}
                      {new Date(sub.reviewedAt).toLocaleString()}
                    </span>
                    {sub.adminFeedback && (
                      <>
                        <span>•</span>
                        <span className="italic font-medium text-slate-700">"{sub.adminFeedback}"</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* DETAILED REVIEW & CORRECTION MODAL */}
      {reviewingSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full my-6 shadow-2xl border border-amber-900/10 flex flex-col max-h-[92vh] overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-emerald-800 to-[#155C3A] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-bengali">
                    {language === 'bn' ? 'খাবার প্রস্তাব পর্যালোচনা ও অনুমোদন' : 'Review & Approve Food Submission'}
                  </h3>
                  <p className="text-[11px] text-emerald-100 font-bengali">
                    Submitter: {reviewingSub.submitterName} (Ref: {reviewingSub.id})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReviewingSub(null)}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              {reviewingSub.potentialDuplicate && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>
                      {language === 'bn' ? 'সতর্কতা: অনুরূপ খাবার ইতিমধ্যে ক্যাটালগে আছে!' : 'Notice: Potential Duplicate'}
                    </span>
                  </p>
                  <p>
                    Matching food: <strong>{reviewingSub.potentialDuplicate.nameEn}</strong> (
                    {reviewingSub.potentialDuplicate.nameBn})
                  </p>
                </div>
              )}

              {/* Names */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    {language === 'bn' ? 'খাবারের বাংলা নাম' : 'Bengali Name'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={corrNameBn}
                    onChange={(e) => setCorrNameBn(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    {language === 'bn' ? 'ইংরেজি নাম' : 'English Name'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={corrNameEn}
                    onChange={(e) => setCorrNameEn(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                  />
                </div>
              </div>

              {/* District, Category & Price */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    {language === 'bn' ? 'জেলা' : 'District'} *
                  </label>
                  <select
                    value={corrDistrictId}
                    onChange={(e) => setCorrDistrictId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                  >
                    {districts.map((d) => (
                      <option key={d.id} value={d.id}>
                        {localizedName(d)} ({d.nameEn})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    {language === 'bn' ? 'ধরন' : 'Category'} *
                  </label>
                  <select
                    value={corrCategory}
                    onChange={(e) => setCorrCategory(e.target.value as FoodCategory)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                  >
                    {FOOD_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {localizedName(cat)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    {language === 'bn' ? 'মূল্য (৳)' : 'Price (BDT)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={corrPrice}
                    onChange={(e) => setCorrPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                  />
                </div>
              </div>

              {/* Food Image Direct Upload */}
              <FoodImageUpload
                value={corrImageUrl}
                onChange={setCorrImageUrl}
                context="food"
                targetId={reviewingSub.id}
                label={language === 'bn' ? 'খাবারের ছবি (ছবি আপলোড করুন)' : 'Food Image (Direct Upload)'}
              />

              {/* Short & Detailed Descriptions */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  {language === 'bn' ? 'সংক্ষিপ্ত বিবরণ' : 'Short Description'} *
                </label>
                <textarea
                  rows={2}
                  value={corrShortDesc}
                  onChange={(e) => setCorrShortDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-bengali"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  {language === 'bn' ? 'বিস্তারিত স্বাদ ও প্রস্তুত প্রণালী' : 'Detailed Notes'}
                </label>
                <textarea
                  rows={2}
                  value={corrDetailedDesc}
                  onChange={(e) => setCorrDetailedDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-bengali"
                />
              </div>

              {/* Origin History & Source */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    {language === 'bn' ? 'ঐতিহাসিক পটভূমি' : 'Historical Lore'}
                  </label>
                  <textarea
                    rows={2}
                    value={corrOriginHistory}
                    onChange={(e) => setCorrOriginHistory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-bengali"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    {language === 'bn' ? 'তথ্যসূত্র ও রেফারেন্স' : 'Sources & References'}
                  </label>
                  <textarea
                    rows={2}
                    value={corrOriginSource}
                    onChange={(e) => setCorrOriginSource(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-bengali"
                  />
                </div>
              </div>

              {/* Admin Feedback / Review Notes */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <label className="block font-bold text-slate-900 font-bengali flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-emerald-800" />
                  <span>{language === 'bn' ? 'অ্যাডমিন রিভিউ নোট / ফিডব্যাক' : 'Admin Review Notes / User Feedback'}</span>
                </label>
                <textarea
                  rows={2}
                  value={adminFeedbackInput}
                  onChange={(e) => setAdminFeedbackInput(e.target.value)}
                  placeholder={
                    language === 'bn'
                      ? 'অনুমোদনের প্রশংসা বা প্রত্যাখ্যানের স্পষ্ট কারণ লিখুন...'
                      : 'Optional approval notes or detailed rejection reason...'
                  }
                  className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#155C3A]"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setReviewingSub(null)}
                disabled={isProcessingAction}
                className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 text-xs font-bold hover:bg-slate-100"
              >
                {language === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleExecuteRejection(reviewingSub.id, adminFeedbackInput)}
                  disabled={isProcessingAction}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5"
                >
                  <XCircle className="w-4 h-4" />
                  <span>{language === 'bn' ? 'প্রত্যাখ্যান করুন' : 'Reject Request'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleExecuteApproval(reviewingSub.id)}
                  disabled={isProcessingAction}
                  className="px-5 py-2 bg-[#155C3A] hover:bg-[#10482d] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {isProcessingAction
                      ? 'প্রসেসিং...'
                      : language === 'bn'
                      ? 'অনুমোদন ও প্রকাশ করুন'
                      : 'Approve & Publish Food'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QUICK REJECT MODAL */}
      {quickRejectSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-rose-200">
            <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
              <XCircle className="w-5 h-5 shrink-0" />
              <span>{language === 'bn' ? 'অনুরোধ প্রত্যাখ্যান করুন' : 'Reject Food Submission'}</span>
            </div>

            <p className="text-xs text-slate-600 font-bengali">
              {language === 'bn' ? (
                <>
                  আপনি <strong>"{quickRejectSub.nameBn}"</strong> ({quickRejectSub.nameEn}) প্রস্তাবটি প্রত্যাখ্যান
                  করছেন। ব্যবহারকারীকে কারণ জানাতে অনুগ্রহ করে নিচে ফিডব্যাক লিখুন।
                </>
              ) : (
                <>
                  You are declining the submission for <strong>"{quickRejectSub.nameEn}"</strong>. Please provide a clear
                  reason for the submitting user.
                </>
              )}
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                {language === 'bn' ? 'প্রত্যাখ্যানের কারণ' : 'Rejection Reason'} *
              </label>
              <textarea
                required
                rows={3}
                value={quickRejectReason}
                onChange={(e) => setQuickRejectReason(e.target.value)}
                placeholder={
                  language === 'bn'
                    ? 'যেমন: প্রদত্ত খাবারটি ইতিমধ্যে ক্যাটালগে অন্তর্ভুক্ত আছে, বা তথ্যের অপর্যাপ্ততা...'
                    : 'e.g. Dish already exists in catalog, or incomplete preparation references...'
                }
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 font-bengali"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setQuickRejectSub(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 text-xs font-bold hover:bg-slate-50"
              >
                {language === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={!quickRejectReason.trim() || isProcessingAction}
                onClick={() => handleExecuteRejection(quickRejectSub.id, quickRejectReason)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs disabled:opacity-50"
              >
                {isProcessingAction ? 'প্রসেসিং...' : language === 'bn' ? 'প্রত্যাখ্যান নিশ্চিত করুন' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
