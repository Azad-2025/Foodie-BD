import React, { useState, useRef, useEffect } from 'react';
import { api } from '../../lib/api';
import { useLanguage } from '../../i18n';
import {
  Camera,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Loader2,
  RefreshCw,
  User,
} from 'lucide-react';

export interface AvatarImageUploadProps {
  value: string;
  onChange: (imageUrl: string) => void;
  userName?: string;
  disabled?: boolean;
  className?: string;
}

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ACCEPTED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const AvatarImageUpload: React.FC<AvatarImageUploadProps> = ({
  value,
  onChange,
  userName = 'Foodie',
  disabled = false,
  className = '',
}) => {
  const { language } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Generate fallback avatar based on user's name
  const fallbackAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
    userName || 'Foodie'
  )}`;

  // Synchronize initial and external value changes
  useEffect(() => {
    if (value) {
      setPreviewUrl(value);
    } else {
      setPreviewUrl(fallbackAvatar);
    }
  }, [value, userName]);

  const handleFileSelection = async (file: File) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    // 1. Client-side Format Validation
    const isSupportedMime = ACCEPTED_MIME_TYPES.includes(file.type.toLowerCase());
    const isSupportedExt = /\.(jpe?g|png|webp)$/i.test(file.name);

    if (!isSupportedMime && !isSupportedExt) {
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
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      setErrorMessage(
        language === 'bn'
          ? `ছবির আকার সর্বোচ্চ ৫ মেগাবাইট (5 MB) হতে পারবে। নির্বাচিত ফাইলের আকার: ${sizeMb} MB`
          : `File size (${sizeMb} MB) exceeds the 5 MB limit.`
      );
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Real-time instant preview using object URL
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setIsUploading(true);

    try {
      // Direct upload to Supabase Storage via /api/upload/image
      const res = await api.uploadFoodImage(file, 'avatar');
      
      // Update with persistent Supabase Storage / application URL
      onChange(res.imageUrl);
      setPreviewUrl(res.imageUrl);
      setSuccessMessage(
        language === 'bn'
          ? 'প্রোফাইল ছবি সফলভাবে আপলোড হয়েছে!'
          : 'Profile photo uploaded successfully!'
      );
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: any) {
      // Revert preview on error if upload fails
      setPreviewUrl(value || fallbackAvatar);
      setErrorMessage(
        err.message ||
          (language === 'bn'
            ? 'ছবি আপলোড করতে ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।'
            : 'Failed to upload image. Please try again.')
      );
    } finally {
      setIsUploading(false);
      URL.revokeObjectURL(objectUrl);
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
    setPreviewUrl(fallbackAvatar);
    setErrorMessage(null);
    setSuccessMessage(
      language === 'bn'
        ? 'প্রোফাইল ছবি ডিফল্ট অবতারে ফিরিয়ে আনা হয়েছে।'
        : 'Profile photo reset to default avatar.'
    );
    setTimeout(() => setSuccessMessage(null), 3000);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const triggerFileInput = () => {
    if (!disabled && !isUploading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const hasCustomAvatar = Boolean(value && value !== fallbackAvatar && !value.includes('dicebear.com'));

  return (
    <div className={`space-y-3 ${className}`}>
      <label className="block text-xs font-semibold text-slate-700 font-bengali">
        {language === 'bn' ? 'প্রোফাইল ছবি (Avatar)' : 'Profile Avatar'}
      </label>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={onFileInputChange}
        disabled={disabled || isUploading}
        className="hidden"
        aria-label={language === 'bn' ? 'ছবি ফাইল নির্বাচন করুন' : 'Select image file'}
      />

      {/* Interactive Avatar Container */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl border transition-all ${
          isDragging
            ? 'border-[#155C3A] bg-emerald-50/50 ring-2 ring-[#155C3A]/20'
            : 'border-slate-200 bg-slate-50/60 hover:bg-slate-50'
        }`}
      >
        {/* Avatar Preview Ring */}
        <div className="relative group shrink-0">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-white border-2 border-emerald-900/10 shadow-sm relative">
            <img
              src={previewUrl || fallbackAvatar}
              alt={userName}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
              onError={(e) => {
                // Graceful fallback to dicebear initials if image load fails
                (e.target as HTMLImageElement).src = fallbackAvatar;
              }}
            />

            {/* Uploading Overlay */}
            {isUploading && (
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-2xs flex flex-col items-center justify-center text-white">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
                <span className="text-[10px] font-bold mt-1 font-bengali">
                  {language === 'bn' ? 'আপলোড হচ্ছে...' : 'Uploading...'}
                </span>
              </div>
            )}
          </div>

          {/* Quick Camera Action Badge */}
          <button
            type="button"
            onClick={triggerFileInput}
            disabled={disabled || isUploading}
            title={language === 'bn' ? 'ছবি পরিবর্তন করুন' : 'Change photo'}
            className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-xl bg-[#155C3A] hover:bg-[#0e442a] text-white flex items-center justify-center shadow-md transition-transform hover:scale-110 cursor-pointer disabled:opacity-50"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Action Controls & Guidelines */}
        <div className="flex-1 text-center sm:text-left space-y-2">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <button
              type="button"
              onClick={triggerFileInput}
              disabled={disabled || isUploading}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#155C3A] hover:bg-[#0e442a] text-white text-xs font-bold transition-all shadow-2xs cursor-pointer disabled:opacity-50 font-bengali"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>
                {hasCustomAvatar
                  ? language === 'bn'
                    ? 'নতুন ছবি আপলোড করুন'
                    : 'Change Photo'
                  : language === 'bn'
                  ? 'ছবি নির্বাচন করুন'
                  : 'Choose Photo'}
              </span>
            </button>

            {hasCustomAvatar && (
              <button
                type="button"
                onClick={handleRemoveImage}
                disabled={disabled || isUploading}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-red-50 text-slate-700 hover:text-red-700 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 font-bengali"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{language === 'bn' ? 'ছবি মুছে ফেলুন' : 'Remove'}</span>
              </button>
            )}
          </div>

          <p className="text-[11px] text-slate-500 font-bengali leading-relaxed">
            {language === 'bn'
              ? 'ডিভাইস থেকে সরাসরি ছবি আপলোড করুন। ফাইল টেনে এনেও ড্রপ করতে পারেন।'
              : 'Upload a picture directly from your local device or drag and drop here.'}
          </p>

          <p className="text-[10px] text-slate-400 font-bengali">
            {language === 'bn'
              ? 'সমর্থিত ফরম্যাট: JPG, PNG, WebP (সর্বোচ্চ ৫ MB)'
              : 'Supported formats: JPG, PNG, WebP (Max 5 MB)'}
          </p>
        </div>
      </div>

      {/* Real-time Error Alert */}
      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2 animate-in fade-in font-bengali">
          <AlertTriangle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {successMessage && (
        <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 animate-in fade-in font-bengali">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}
    </div>
  );
};
