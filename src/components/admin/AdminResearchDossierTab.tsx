import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useLanguage } from '../../i18n';
import { FoodImageUpload } from '../common/FoodImageUpload';
import {
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Award,
  Search,
  Filter,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  PlusCircle,
  FileCheck,
  Building2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

interface ResearchDossier {
  districtId: string;
  districtNameEn: string;
  districtNameBn: string;
  divisionId: string;
  divisionNameEn: string;
  foodNameEn: string;
  foodNameBn: string;
  category: string;
  dietaryType: string;
  approximatePriceBdt: number;
  shortDescriptionBn: string;
  shortDescriptionEn: string;
  detailedDescriptionBn: string;
  detailedDescriptionEn: string;
  ingredients: string[];
  preparationMethodEn: string;
  preparationMethodBn: string;
  historicalContextEn: string;
  historicalContextBn: string;
  primarySource: string;
  citationSources: string[];
  researchStatus: 'gi_certified' | 'verified' | 'partially_supported';
  isGiProduct: boolean;
  giRegistrationInfo?: string;
  imageSuggestionPrompt: string;
  imageAttribution: string;
  hasCatalogFood: boolean;
  existingCatalogFoodsCount: number;
}

interface AdminResearchDossierTabProps {
  onFoodPublished?: () => Promise<void>;
  navigate: (route: string, param?: string) => void;
}

export const AdminResearchDossierTab: React.FC<AdminResearchDossierTabProps> = ({
  onFoodPublished,
  navigate,
}) => {
  const { language } = useLanguage();
  const [dossiers, setDossiers] = useState<ResearchDossier[]>([]);
  const [stats, setStats] = useState<{
    totalDistricts: number;
    representedDistricts: number;
    unrepresentedDistricts: number;
    dossiersCount: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDivision, setFilterDivision] = useState('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'unrepresented' | 'represented' | 'gi'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Publishing modal / state
  const [publishingDossier, setPublishingDossier] = useState<ResearchDossier | null>(null);
  const [publishImageUrl, setPublishImageUrl] = useState('');
  const [publishPrice, setPublishPrice] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishFeedback, setPublishFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadDossiers = async () => {
    try {
      setIsLoading(true);
      const res = await api.getResearchDossiers();
      setDossiers(res.dossiers || []);
      setStats({
        totalDistricts: res.totalDistricts,
        representedDistricts: res.representedDistricts,
        unrepresentedDistricts: res.unrepresentedDistricts,
        dossiersCount: res.dossiersCount,
      });
    } catch (err: any) {
      console.error('Failed to load research dossiers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDossiers();
  }, []);

  const filteredDossiers = dossiers.filter((d) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        d.districtNameEn.toLowerCase().includes(q) ||
        d.districtNameBn.includes(q) ||
        d.foodNameEn.toLowerCase().includes(q) ||
        d.foodNameBn.includes(q) ||
        d.primarySource.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (filterDivision !== 'all' && d.divisionId !== filterDivision) {
      return false;
    }
    if (filterStatus === 'unrepresented' && d.hasCatalogFood) {
      return false;
    }
    if (filterStatus === 'represented' && !d.hasCatalogFood) {
      return false;
    }
    if (filterStatus === 'gi' && !d.isGiProduct) {
      return false;
    }
    return true;
  });

  const handleStartPublish = (dossier: ResearchDossier) => {
    setPublishingDossier(dossier);
    setPublishImageUrl('');
    setPublishPrice(String(dossier.approximatePriceBdt));
    setPublishFeedback(null);
  };

  const handleExecutePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publishingDossier) return;

    try {
      setIsPublishing(true);
      setPublishFeedback(null);
      const res = await api.publishResearchDossier({
        districtId: publishingDossier.districtId,
        customImageUrl: publishImageUrl.trim() || undefined,
        customPrice: Number(publishPrice) || publishingDossier.approximatePriceBdt,
      });

      setPublishFeedback({
        type: 'success',
        text: language === 'bn'
          ? `"${publishingDossier.foodNameBn}" সফলভাবে ক্যাটালগে যুক্ত হয়েছে।`
          : `Successfully published "${publishingDossier.foodNameEn}" to the official catalog.`,
      });

      if (onFoodPublished) {
        await onFoodPublished();
      }
      await loadDossiers();
      setTimeout(() => {
        setPublishingDossier(null);
        setPublishFeedback(null);
      }, 2500);
    } catch (err: any) {
      setPublishFeedback({
        type: 'error',
        text: err.message || 'Failed to publish food record.',
      });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>{language === 'bn' ? 'মোট জেলা কভারেজ' : 'Total Districts'}</span>
            <Building2 className="w-4 h-4 text-[#155C3A]" />
          </div>
          <p className="text-2xl font-black text-slate-900 font-sans">
            {stats ? `${stats.representedDistricts} / ${stats.totalDistricts}` : '...'}
          </p>
          <p className="text-[11px] text-slate-500 font-bengali">
            {language === 'bn' ? 'বর্তমানে ক্যাটালগে সক্রিয় জেলা' : 'Districts currently with catalog foods'}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>{language === 'bn' ? 'যাচাইকৃত গবেষণা ডসিয়ার' : 'Verified Dossiers'}</span>
            <BookOpen className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-700 font-sans">
            {stats ? stats.dossiersCount : '28'}
          </p>
          <p className="text-[11px] text-emerald-600 font-bengali">
            {language === 'bn' ? 'ঐতিহাসিক ও জিআই তথ্য সম্বলিত' : 'Fully documented & cited entries'}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>{language === 'bn' ? 'অপ্রতিনিধিত্বশীল জেলা' : 'Unrepresented Districts'}</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600 font-sans">
            {stats ? stats.unrepresentedDistricts : '...'}
          </p>
          <p className="text-[11px] text-amber-600 font-bengali">
            {language === 'bn' ? 'অনুমোদনের জন্য প্রস্তুত' : 'Ready for admin review & publishing'}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>{language === 'bn' ? 'জিআই পণ্য অন্তর্ভুক্তি' : 'GI Products Covered'}</span>
            <Award className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-amber-700 font-sans">
            {dossiers.filter((d) => d.isGiProduct).length}
          </p>
          <p className="text-[11px] text-amber-700 font-bengali">
            {language === 'bn' ? 'ডিপার্টমেন্ট অব পেটেন্টস সনদপ্রাপ্ত' : 'Officially certified by DPDT'}
          </p>
        </div>
      </div>

      {/* Search & Filter Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'bn' ? 'জেলা, খাবারের নাম বা উৎস দিয়ে খুঁজুন...' : 'Search by district, food, or source...'}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#155C3A] font-bengali"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <select
            value={filterDivision}
            onChange={(e) => setFilterDivision(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bengali cursor-pointer"
          >
            <option value="all">{language === 'bn' ? 'সকল বিভাগ' : 'All Divisions'}</option>
            <option value="dhaka">Dhaka (ঢাকা)</option>
            <option value="chattogram">Chattogram (চট্টগ্রাম)</option>
            <option value="rajshahi">Rajshahi (রাজশাহী)</option>
            <option value="khulna">Khulna (খুলনা)</option>
            <option value="barishal">Barishal (বরিশাল)</option>
            <option value="sylhet">Sylhet (সিলেট)</option>
            <option value="rangpur">Rangpur (রংপুর)</option>
            <option value="mymensingh">Mymensingh (ময়মনসিংহ)</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bengali cursor-pointer"
          >
            <option value="all">{language === 'bn' ? 'সকল ডসিয়ার' : 'All Dossiers'}</option>
            <option value="unrepresented">{language === 'bn' ? 'অপ্রতিনিধিত্বশীল জেলা' : 'Unrepresented'}</option>
            <option value="represented">{language === 'bn' ? 'ইতিমধ্যে ক্যাটালগে আছে' : 'Already in Catalog'}</option>
            <option value="gi">{language === 'bn' ? 'শুধুমাত্র জিআই পণ্য' : 'GI Certified Only'}</option>
          </select>
        </div>
      </div>

      {/* Dossiers Accordion List */}
      <div className="space-y-3">
        {filteredDossiers.map((dossier) => {
          const isExpanded = expandedId === dossier.districtId;
          return (
            <div
              key={dossier.districtId}
              className={`bg-white rounded-2xl border transition-all ${
                isExpanded ? 'border-[#155C3A]/50 shadow-sm' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Header Bar */}
              <div
                onClick={() => setExpandedId(isExpanded ? null : dossier.districtId)}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                    dossier.isGiProduct
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {dossier.isGiProduct ? <Award className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-slate-900 font-bengali">
                        {dossier.districtNameBn} ({dossier.districtNameEn})
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="text-xs font-semibold text-[#155C3A] font-bengali">
                        {dossier.foodNameBn}
                      </span>
                      {dossier.isGiProduct && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white uppercase tracking-wider">
                          GI Certified
                        </span>
                      )}
                      {dossier.hasCatalogFood ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                          {language === 'bn' ? 'ক্যাটালগে সক্রিয়' : 'In Catalog'}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          {language === 'bn' ? 'অপ্রতিনিধিত্বশীল জেলা' : 'Unrepresented'}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 font-bengali mt-0.5 line-clamp-1">
                      {dossier.shortDescriptionBn}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartPublish(dossier);
                    }}
                    className="px-3.5 py-1.5 bg-[#155C3A] hover:bg-[#0e442a] text-white text-xs font-bold rounded-xl transition-colors font-bengali flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>{language === 'bn' ? 'ক্যাটালগে প্রকাশ করুন' : 'Publish to Catalog'}</span>
                  </button>

                  <div className="p-1.5 text-slate-400 hover:text-slate-600">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>
              </div>

              {/* Expanded Detail Panel */}
              {isExpanded && (
                <div className="p-5 border-t border-slate-100 bg-slate-50/60 rounded-b-2xl space-y-4 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Detailed History & Preparation */}
                    <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800 font-bengali">
                        <FileCheck className="w-4 h-4 text-[#155C3A]" />
                        <span>ঐতিহাসিক প্রেক্ষাপট ও রন্ধন প্রণালী (Culinary Method)</span>
                      </div>
                      <p className="text-slate-700 leading-relaxed font-bengali">
                        {dossier.detailedDescriptionBn}
                      </p>
                      <div className="pt-2 border-t border-slate-100">
                        <p className="font-semibold text-slate-700 mb-1">প্রস্তুত প্রণালী:</p>
                        <p className="text-slate-600 font-bengali leading-relaxed">
                          {dossier.preparationMethodBn}
                        </p>
                      </div>
                    </div>

                    {/* Ingredients & Authority Sources */}
                    <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800 font-bengali">
                        <ShieldCheck className="w-4 h-4 text-[#155C3A]" />
                        <span>যাচাইকরণ সূত্র ও উপকরণ (Ingredients & Citations)</span>
                      </div>

                      <div>
                        <p className="font-semibold text-slate-700 mb-1">মূল উপাদানসমূহ:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {dossier.ingredients.map((ing, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[11px] font-medium border border-emerald-200">
                              {ing}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100">
                        <p className="font-semibold text-slate-700 mb-1">প্রাথমিক প্রাতিষ্ঠানিক উৎস:</p>
                        <p className="text-slate-800 font-medium italic">
                          {dossier.primarySource}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-100">
                        <p className="font-semibold text-slate-700 mb-1">তথ্যসূত্র ও সহায়ক প্রকাশনা:</p>
                        <ul className="list-disc list-inside space-y-0.5 text-slate-600">
                          {dossier.citationSources.map((c, i) => (
                            <li key={i} className="text-[11px]">{c}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Image Prompt Recommendation */}
                      <div className="pt-2 border-t border-slate-100 bg-amber-50/60 p-2.5 rounded-lg border border-amber-200/60">
                        <p className="font-bold text-amber-900 text-[11px] mb-0.5">প্রামাণ্য ছবির বিবরণ (Image Guidance):</p>
                        <p className="text-[11px] text-amber-800 italic">
                          "{dossier.imageSuggestionPrompt}"
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Publish Modal */}
      {publishingDossier && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-200 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#155C3A] flex items-center justify-center font-bold">
                  <PlusCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 font-bengali">
                    {language === 'bn' ? 'ক্যাটালগে প্রকাশ ও সংযোজন' : 'Publish Researched Food to Catalog'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {publishingDossier.districtNameEn} — {publishingDossier.foodNameEn}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPublishingDossier(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {publishFeedback && (
              <div className={`p-3 rounded-xl text-xs font-semibold border flex items-center gap-2 ${
                publishFeedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'
              }`}>
                {publishFeedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />}
                <span>{publishFeedback.text}</span>
              </div>
            )}

            <form onSubmit={handleExecutePublish} className="space-y-4 text-xs font-bengali">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <p className="font-bold text-slate-800 text-sm">{publishingDossier.foodNameBn} ({publishingDossier.foodNameEn})</p>
                <p className="text-slate-600 text-xs">{publishingDossier.shortDescriptionBn}</p>
                <div className="pt-2 text-[11px] text-slate-500 flex items-center gap-2">
                  <span className="font-semibold text-slate-700">উৎস:</span>
                  <span>{publishingDossier.primarySource}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  আনুমানিক মূল্য (Approximate Price in BDT):
                </label>
                <input
                  type="number"
                  value={publishPrice}
                  onChange={(e) => setPublishPrice(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  প্রামাণ্য খাদ্য ছবি আপলোড বা ইউআরএল (Authentic Food Image):
                </label>
                <FoodImageUpload
                  value={publishImageUrl}
                  onChange={(url: string) => setPublishImageUrl(url)}
                  disabled={isPublishing}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPublishingDossier(null)}
                  disabled={isPublishing}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  {language === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isPublishing}
                  className="px-5 py-2 text-xs font-bold bg-[#155C3A] hover:bg-[#0e442a] text-white rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-2"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>{isPublishing ? (language === 'bn' ? 'যুক্ত হচ্ছে...' : 'Publishing...') : (language === 'bn' ? 'ক্যাটালগে নিশ্চিত করুন' : 'Confirm & Publish')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
