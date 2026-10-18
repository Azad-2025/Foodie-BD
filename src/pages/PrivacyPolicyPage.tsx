import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { useLanguage } from '../i18n';

export const PrivacyPolicyPage: React.FC = () => {
  const { language } = useLanguage();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8 font-bengali">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#155C3A]">
          <ShieldCheck className="w-4 h-4" />
          <span>{language === 'bn' ? 'আইনি ও গোপনীয়তা' : 'Legal & Privacy'}</span>
        </div>
        <h1 className="text-3xl font-black text-slate-900">
          {language === 'bn' ? 'গোপনীয়তা নীতিমালা' : 'Privacy Policy'}
        </h1>
        <p className="text-xs text-slate-500">
          {language === 'bn' ? 'সর্বশেষ হালনাগাদ: জানুয়ারি ২০২৬ · ফুডি বিডি (খাদক ম্যাপ)' : 'Last updated: January 2026 · Foodie BD (খাদক ম্যাপ)'}
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-amber-900/10 p-6 sm:p-10 shadow-2xs space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">
            {language === 'bn' ? '১. সংগৃহীত তথ্যাবলী' : '1. Information We Collect'}
          </h2>
          <p>
            {language === 'bn'
              ? 'ফুডি বিডি অ্যাকাউন্টে নিবন্ধনের সময় ব্যবহারকারীর নাম, ইমেইল ঠিকানা, ক্রিপ্টোগ্রাফিক স্ক্রিপ্ট (scrypt) হ্যাশ করা পাসওয়ার্ড এবং ঐচ্ছিক প্রোফাইল তথ্য (নিজ জেলা, ছবি, জীবনবৃত্তান্ত) সংরক্ষিত হয়।'
              : 'When registering for Foodie BD, we collect your name, email address, password hash (encrypted using industry-standard scrypt cryptographic hashing), and optional details such as your home district, bio, and avatar.'}
          </p>
          <p>
            {language === 'bn'
              ? 'যখন আপনি কোনো খাবার চেখে দেখেছেন হিসেবে তালিকাভুক্ত করেন, তখন চেখে দেখার তারিখ, ব্যক্তিগত রেটিং ও নোট আমাদের ডাটাবেজে বিশ্বস্ততার সাথে সংরক্ষিত থাকে।'
              : 'When you log food tastings, we store your tasting dates, subjective ratings, and personal tasting notes securely in persistent database storage.'}
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">
            {language === 'bn' ? '২. ব্যক্তিগত খাদ্য যাত্রার নিরাপত্তা' : '2. Privacy of Personal Food Journeys'}
          </h2>
          <p>
            {language === 'bn'
              ? 'আপনার ব্যক্তিগত ট্র্যাকিং রেকর্ড, চেখে দেখার তারিখ এবং ব্যক্তিগত মন্তব্য শুধুমাত্র আপনার অ্যাকাউন্টের সাথেই যুক্ত থাকে। তবে খাবারের পাতায় দেওয়া সার্বজনীন রিভিউ জনসাধারণের জন্য দৃশ্যমান।'
              : 'Your food tracking entries, private tasting dates, and notes are associated strictly with your user account and are private by default. Community reviews posted on public food pages are publicly visible alongside your display name.'}
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">
            {language === 'bn' ? '৩. মানচিত্র ও ভৌগোলিক উপাত্তের ব্যবহার' : '3. Geographic & Map Data Usage'}
          </h2>
          <p>
            {language === 'bn'
              ? 'ফুডি বিডি ব্যবহারকারীর ব্যাকগ্রাউন্ড জিপিএস বা লাইভ লোকেশন কখনো ট্র্যাকিং করে না। সম্পূর্ণ মানচিত্রটি উন্মুক্ত ভৌগোলিক তথ্যভাণ্ডারের উপর ভিত্তি করে পরিবেশিত হয়।'
              : 'Foodie BD does not track your live real-time GPS location in the background without explicit permission. Interactive maps render public administrative district boundaries without logging user geographic coordinates.'}
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">
            {language === 'bn' ? '৪. যোগাযোগ ও তথ্য অধিকার' : '4. Contacting Support & Privacy Officer'}
          </h2>
          <p>
            {language === 'bn'
              ? 'আপনার যেকোনো তথ্যের অধিকার, অ্যাকাউন্ট বা ডেটা অপসারণ সম্পর্কিত প্রশ্নের জন্য আমাদের সাথে যোগাযোগ করতে পারেন: '
              : 'For privacy inquiries, account data deletion requests, or questions regarding our culinary database archives, contact us at: '}
            <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[#155C3A]">privacy@foodiebd.app</code>
          </p>
        </section>
      </div>
    </div>
  );
};
