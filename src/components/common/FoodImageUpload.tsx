import React, { useState, useRef, useEffect } from 'react';
import { api } from '../../lib/api';
import { useLanguage } from '../../i18n';
import { FoodImage } from './FoodImage';
import {
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Trash2,
  Image as ImageIcon,
  Loader2,
  Camera,
} from 'lucide-react';

export interface FoodImageUploadProps {
  value: string;
  onChange: (imageUrl: string) => void;
  context?: 'food' | 'submission';
  targetId?: string;
  required?: boolean;
  label?: string;
  disabled?: boolean;
  className?: string;
}

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const FoodImageUpload: React.FC<FoodImageUploadProps> = ({
  value,
  onChange,
  context = 'food',
  targetId,
  required = false,
  label,
  disabled = false,
  className = '',
}) => {
  const { language } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [localFileName, setLocalFileName] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);

  // If value is cleared from outside, reset error/success
  useEffect(() => {
    if (!value) {
      setLocalFileName('');
    }
  }, [value]);

  const handleFileSelection = async (file: File) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    // 1. Client-side Format Validation
    if (!ACCEPTED_TYPES.includes(file.type.toLowerCase()) && !/\.(jpe?g|png|webp)$/i.test(file.name)) {
      setErrorMessage(
        language === 'bn'
          ? 'শুধুমাত্র JPG, PNG বা WebP ফরম্যাটের ছবি আপলোড করা যাবে।'
          : 'Only JPG, PNG, and WebP image formats are supported.'
      );
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // 2. Client-side Size Validation (Max 5 MB)
    if (file.size > MAX_SIZE_BYTES) {
      setErrorMessage(
        language === 'bn'
          ? 'ছবির আকার সর্বোচ্চ ৫ মেগাবাইট (5 MB) হতে পারবে।'
          : `File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the 5 MB limit.`
      );
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setLocalFileName(file.name);
    setIsUploading(true);
    setUploadProgress(20);

    try {
      setUploadProgress(60);
      const res = await api.uploadFoodImage(file, context, targetId);
      setUploadProgress(100);

      onChange(res.imageUrl);
      setSuccessMessage(
        language === 'bn'
          ? 'ছবি সফলভাবে আপলোড ও সংরক্ষিত হয়েছে।'
          : 'Image uploaded and stored successfully.'
      );
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: any) {
      setErrorMessage(
        err.message ||
          (language === 'bn'
            ? 'ছবি আপলোড করতে ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।'
            : 'Failed to upload image. Please try again.')
      );
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelection(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isUploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled || isUploading) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelection(file);
    }
  };

  const handleRemoveImage = () => {
    onChange('');
    setLocalFileName('');
    setErrorMessage(null);
    setSuccessMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const triggerFilePicker = () => {
    if (disabled || isUploading) return;
    fileInputRef.current?.click();
  };

  const hasImage = Boolean(value && value.trim());

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label and Info */}
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-800 font-bengali">
          {label || (language === 'bn' ? 'খাবারের ছবি' : 'Food Image')}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        <span className="text-[10px] text-slate-500 font-medium">
          {language === 'bn' ? 'JPG, PNG, WebP (সর্বোচ্চ ৫ MB)' : 'JPG, PNG, WebP (Max 5 MB)'}
        </span>
      </div>

      {/* Hidden Native File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        onChange={onFileInputChange}
        className="hidden"
        disabled={disabled || isUploading}
        tabIndex={-1}
        aria-hidden="true"
      />

      {/* Upload Zone / Active Preview State */}
      {!hasImage ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={triggerFilePicker}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              triggerFilePicker();
            }
          }}
          tabIndex={disabled ? -1 : 0}
          role="button"
          aria-label={language === 'bn' ? 'ছবি আপলোড করুন' : 'Upload Image'}
          className={`relative border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all outline-none focus:ring-2 focus:ring-[#155C3A] ${
            isDragging
              ? 'border-[#155C3A] bg-emerald-50/70 scale-[0.99]'
              : 'border-slate-300 bg-slate-50/80 hover:bg-slate-100/90 hover:border-slate-400'
          } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          {isUploading ? (
            <div className="py-4 space-y-3">
              <Loader2 className="w-8 h-8 text-[#155C3A] animate-spin mx-auto" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-800 font-bengali">
                  {language === 'bn' ? 'ছবি আপলোড হচ্ছে...' : 'Uploading food image...'}
                </p>
                <p className="text-[11px] text-slate-500">
                  {uploadProgress ? `${uploadProgress}%` : (language === 'bn' ? 'সংরক্ষিত হচ্ছে' : 'Storing securely')}
                </p>
              </div>
              <div className="w-36 h-1.5 bg-slate-200 rounded-full mx-auto overflow-hidden">
                <div
                  className="h-full bg-[#155C3A] transition-all duration-300"
                  style={{ width: `${uploadProgress || 40}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="py-2 space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100/80 text-[#155C3A] flex items-center justify-center mx-auto shadow-2xs">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 font-bengali">
                  <span className="text-[#155C3A] underline decoration-emerald-500 underline-offset-2">
                    {language === 'bn' ? 'ছবি আপলোড করতে ক্লিক করুন' : 'Click to upload image'}
                  </span>{' '}
                  <span className="font-normal text-slate-500">
                    {language === 'bn' ? 'অথবা টেনে আনুন' : 'or drag and drop'}
                  </span>
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  {language === 'bn'
                    ? 'আপনার মোবাইল বা কম্পিউটার থেকে সরাসরি ছবি নির্বাচন করুন'
                    : 'Select directly from your phone gallery or computer files'}
                </p>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-xl text-[11px] font-bold text-slate-700 shadow-2xs font-bengali">
                <Camera className="w-3.5 h-3.5 text-[#155C3A]" />
                <span>{language === 'bn' ? 'ছবি নির্বাচন করুন' : 'Select Image'}</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Image Preview with Replace and Remove controls */
        <div className="p-3 bg-white border border-slate-200 rounded-2xl space-y-3 shadow-2xs">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Thumbnail */}
            <div className="w-full sm:w-28 h-28 rounded-xl overflow-hidden border border-slate-200 bg-stone-100 shrink-0 shadow-2xs relative">
              <FoodImage src={value} alt="Uploaded food" className="w-full h-full object-cover" />
              {isUploading && (
                <div className="absolute inset-0 bg-black/50 backdrop-blur-2xs flex items-center justify-center text-white text-xs font-bold">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
              )}
            </div>

            {/* Metadata & Actions */}
            <div className="flex-1 w-full space-y-2 text-left">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>{language === 'bn' ? 'ছবি সংলগ্ন রয়েছে' : 'Image Attached'}</span>
                </span>
                {localFileName && (
                  <span className="text-[11px] text-slate-500 truncate max-w-[200px]" title={localFileName}>
                    {localFileName}
                  </span>
                )}
              </div>

              <p className="text-[11px] text-slate-500 leading-snug">
                {language === 'bn'
                  ? 'এই ছবিটি খাবার ক্যাটালগ ও মানচিত্রে প্রদর্শিত হবে।'
                  : 'This exact image will be displayed on the food profile, cards, and map.'}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={triggerFilePicker}
                  disabled={disabled || isUploading}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 font-bengali shadow-2xs"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
                  <span>{language === 'bn' ? 'ছবি পরিবর্তন করুন' : 'Replace Image'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleRemoveImage}
                  disabled={disabled || isUploading}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 font-bengali shadow-2xs"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>{language === 'bn' ? 'ছবি মুছে ফেলুন' : 'Remove Image'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {successMessage && (
        <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in font-bengali">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Error Notification */}
      {errorMessage && (
        <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in font-bengali">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
