import React, { useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useJourney } from '../../context/JourneyContext';
import { useLanguage } from '../../i18n';
import { MapTheme } from '../../types';
import { DISTRICTS } from '../../data/divisionsAndDistricts';
import { BangladeshSvgMap } from '../map/BangladeshSvgMap';
import { toPng, toJpeg } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { X, Download, Sparkles, CheckCircle2, MapPin, Award } from 'lucide-react';

interface FoodieCardExportModalProps {
  isOpen?: boolean;
  onClose: () => void;
  currentTheme?: MapTheme;
}

const DEFAULT_AVATAR =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><circle cx="24" cy="24" r="24" fill="%23155C3A"/><text x="24" y="28" fill="%23FFF9F0" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle">BD</text></svg>';

export const FoodieCardExportModal: React.FC<FoodieCardExportModalProps> = ({
  isOpen = true,
  onClose,
  currentTheme = 'light',
}) => {
  const { user } = useAuth();
  const { triedFoodIds, visitedDistrictIds, achievements } = useJourney();
  const { language, t } = useLanguage();
  const cardRef = useRef<HTMLDivElement>(null);

  const [includeProfile, setIncludeProfile] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportError, setExportError] = useState<string | null>(null);

  if (!isOpen) return null;

  const unlockedCount = achievements.filter((a) => a.isUnlocked).length;
  const coveragePercent = Math.round((visitedDistrictIds.size / 64) * 100);

  const renderCardDataUrl = async (format: 'png' | 'jpeg'): Promise<string> => {
    if (!cardRef.current) throw new Error('Preview element not ready');
    const options = {
      cacheBust: true,
      pixelRatio: 2,
      imagePlaceholder: DEFAULT_AVATAR,
    };

    try {
      return format === 'png'
        ? await toPng(cardRef.current, options)
        : await toJpeg(cardRef.current, { ...options, quality: 0.95 });
    } catch (initialErr) {
      console.warn('Initial export with external assets failed, attempting fallback:', initialErr);
      // Fallback attempt: if cross-origin images caused a failure, render without network fetches
      return format === 'png'
        ? await toPng(cardRef.current, { ...options, cacheBust: false })
        : await toJpeg(cardRef.current, { ...options, quality: 0.9, cacheBust: false });
    }
  };

  const handleDownloadPng = async () => {
    if (!cardRef.current) return;
    try {
      setIsExporting(true);
      setExportError(null);
      const dataUrl = await renderCardDataUrl('png');
      const link = document.createElement('a');
      link.download = `FoodieBD-Card-${user?.name?.replace(/\s+/g, '_') || 'Traveler'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err: any) {
      console.error('PNG export failed:', err);
      setExportError('Failed to generate PNG image. Please ensure your browser allows downloads.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadJpg = async () => {
    if (!cardRef.current) return;
    try {
      setIsExporting(true);
      setExportError(null);
      const dataUrl = await renderCardDataUrl('jpeg');
      const link = document.createElement('a');
      link.download = `FoodieBD-Card-${user?.name?.replace(/\s+/g, '_') || 'Traveler'}.jpg`;
      link.href = dataUrl;
      link.click();
    } catch (err: any) {
      console.error('JPG export failed:', err);
      setExportError('Failed to generate JPG image. Please ensure your browser allows downloads.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!cardRef.current) return;
    try {
      setIsExporting(true);
      setExportError(null);
      const dataUrl = await renderCardDataUrl('jpeg');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // A4 portrait is 210mm wide x 297mm high
      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = 180;
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(dataUrl, 'JPEG', 15, 20, pdfWidth, pdfHeight);
      pdf.save(`FoodieBD-Culinary-Passport.pdf`);
    } catch (err: any) {
      console.error('PDF export failed:', err);
      setExportError('Failed to generate PDF document. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-6 shadow-2xl relative my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5 font-bengali">
              <Sparkles className="w-4 h-4 text-[#F39C3D]" />
              {t('foodieCard.title')}
            </h3>
            <p className="text-xs text-slate-500 font-bengali">
              {t('foodieCard.subtitle')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
            aria-label={t('common.close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Customization toggles */}
        <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl text-xs">
          <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
            <input
              type="checkbox"
              checked={includeProfile}
              onChange={(e) => setIncludeProfile(e.target.checked)}
              className="rounded text-[#155C3A] focus:ring-[#155C3A]"
            />
            <span>{language === 'bn' ? 'প্রোফাইল নাম ও ছবি প্রদর্শন করুন' : 'Include profile name and avatar'}</span>
          </label>
          <span className="text-[11px] text-slate-400 capitalize">
            {language === 'bn' ? 'সক্রিয় থিম: ' : 'Active Theme: '}
            <strong className="text-slate-600">{currentTheme}</strong>
          </span>
        </div>

        {/* Live Preview Container (To be exported) */}
        <div className="border border-slate-200 rounded-2xl p-2 bg-slate-100 flex justify-center">
          <div
            ref={cardRef}
            className="w-full max-w-md bg-[#FFF9F0] text-slate-900 rounded-xl p-6 border border-amber-900/15 shadow-sm space-y-5"
            style={{ fontFamily: "'Plus Jakarta Sans', 'Noto Sans Bengali', sans-serif" }}
          >
            {/* Card Header */}
            <div className="flex items-center justify-between border-b border-amber-900/10 pb-4">
              <div className="flex items-center gap-2.5">
                <img
                  src="/foodie-bd-logo.svg"
                  alt="Foodie BD"
                  className="h-8 sm:h-9 w-auto max-w-[150px] object-contain shrink-0"
                />
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                  {language === 'bn' ? 'যাচাইকৃত খাদক' : 'Verified Foodie'}
                </span>
                <p className="text-[9px] text-slate-400 mt-0.5">{new Date().toLocaleDateString()}</p>
              </div>
            </div>

            {/* User Profile Block */}
            {includeProfile && (
              <div className="flex items-center gap-3 bg-white/80 p-3 rounded-xl border border-amber-900/10">
                <img
                  src={user?.avatarUrl || DEFAULT_AVATAR}
                  alt={user?.name || 'Explorer'}
                  crossOrigin="anonymous"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = DEFAULT_AVATAR;
                  }}
                  className="w-11 h-11 rounded-full object-cover ring-2 ring-[#155C3A]/20 bg-emerald-100"
                />
                <div>
                  <h5 className="font-bold text-sm text-slate-900">
                    {user?.name || (language === 'bn' ? 'রসনা অভিযাত্রী' : 'Culinary Adventurer')}
                  </h5>
                  <p className="text-[11px] text-slate-500">
                    {language === 'bn' ? 'নিজ জেলা: ' : 'Home District: '}
                    <strong className="text-slate-700 capitalize">
                      {user?.homeDistrictId || (language === 'bn' ? 'বাংলাদেশ' : 'Bangladesh')}
                    </strong>
                  </p>
                </div>
              </div>
            )}

            {/* Statistics Matrix */}
            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="bg-white/90 p-2.5 rounded-xl border border-amber-900/10 shadow-2xs">
                <MapPin className="w-4 h-4 text-[#155C3A] mx-auto mb-1" />
                <p className="text-lg font-black text-[#155C3A]">{visitedDistrictIds.size}<span className="text-xs text-slate-400">/64</span></p>
                <p className="text-[10px] text-slate-500 font-medium font-bengali">
                  {language === 'bn' ? 'জেলা কভারেজ' : 'Districts Explored'}
                </p>
              </div>

              <div className="bg-white/90 p-2.5 rounded-xl border border-amber-900/10 shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-[#E74C3C] mx-auto mb-1" />
                <p className="text-lg font-black text-[#E74C3C]">{triedFoodIds.size}</p>
                <p className="text-[10px] text-slate-500 font-medium font-bengali">
                  {language === 'bn' ? 'খাবার চেখেছেন' : 'Dishes Tasted'}
                </p>
              </div>

              <div className="bg-white/90 p-2.5 rounded-xl border border-amber-900/10 shadow-2xs">
                <Award className="w-4 h-4 text-[#F39C3D] mx-auto mb-1" />
                <p className="text-lg font-black text-[#F39C3D]">{unlockedCount}</p>
                <p className="text-[10px] text-slate-500 font-medium font-bengali">
                  {language === 'bn' ? 'অর্জিত ব্যাজ' : 'Achievements'}
                </p>
              </div>
            </div>

            {/* Embedded Accurate Bangladesh Map */}
            <div className="bg-white/70 p-2.5 rounded-xl border border-amber-900/10 flex items-center justify-center">
              <BangladeshSvgMap
                districts={DISTRICTS}
                visitedDistrictIds={visitedDistrictIds}
                selectedDistrict={null}
                onSelectDistrict={() => {}}
                themeColor="#155C3A"
                showLabels={true}
                showFoodMarkers={false}
                interactive={false}
                className="w-full max-h-[260px]"
              />
            </div>

            {/* Visual Progress Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-semibold text-slate-600 font-bengali">
                <span>{language === 'bn' ? 'বাংলাদেশ স্বাদ কভারেজ' : 'Bangladesh Exploration'}</span>
                <span className="text-[#155C3A]">{coveragePercent}% {language === 'bn' ? 'সম্পন্ন' : 'Completed'}</span>
              </div>
              <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-linear-to-r from-[#155C3A] to-[#F39C3D] rounded-full transition-all"
                  style={{ width: `${Math.max(5, coveragePercent)}%` }}
                />
              </div>
            </div>

            {/* Card Footer */}
            <div className="pt-2 border-t border-amber-900/10 flex items-center justify-between text-[10px] text-slate-400">
              <span>foodiebd.app · 64 Districts</span>
              <span className="font-bengali text-slate-500 font-medium">
                {language === 'bn' ? 'বাংলাদেশের ৬৪ জেলার খাবার আবিষ্কার' : 'Authentic Food Map of Bangladesh'}
              </span>
            </div>
          </div>
        </div>

        {exportError && (
          <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
            {exportError}
          </p>
        )}

        {/* Action Buttons: PNG, JPG, PDF */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
          >
            {t('common.close')}
          </button>

          <button
            onClick={handleDownloadPng}
            disabled={isExporting}
            className="w-full sm:w-auto px-3.5 py-2 text-xs font-semibold bg-[#155C3A] hover:bg-[#0e442a] text-white rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t('foodieCard.downloadPng')}</span>
          </button>

          <button
            onClick={handleDownloadJpg}
            disabled={isExporting}
            className="w-full sm:w-auto px-3.5 py-2 text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t('foodieCard.downloadJpg')}</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={isExporting}
            className="w-full sm:w-auto px-3.5 py-2 text-xs font-semibold bg-slate-900 hover:bg-black text-white rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t('foodieCard.downloadPdf')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
