import React from 'react';
import { BookOpen } from 'lucide-react';
import { useLanguage } from '../i18n';

export const TermsPage: React.FC = () => {
  const { language } = useLanguage();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8 font-bengali">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#155C3A]">
          <BookOpen className="w-4 h-4" />
          <span>{language === 'bn' ? 'আইনি শর্তাবলী' : 'Terms & Conditions'}</span>
        </div>
        <h1 className="text-3xl font-black text-slate-900">
          {language === 'bn' ? 'ব্যবহারের শর্তাবলী' : 'Terms of Service'}
        </h1>
        <p className="text-xs text-slate-500">
          {language === 'bn' ? 'সর্বশেষ হালনাগাদ: জানুয়ারি ২০২৬ · ফুডি বিডি (খাদক ম্যাপ)' : 'Last updated: January 2026 · Foodie BD (খাদক ম্যাপ)'}
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-amber-900/10 p-6 sm:p-10 shadow-2xs space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">
            {language === 'bn' ? '১. শর্তাবলীর গ্রহণযোগ্যতা' : '1. Acceptance of Terms'}
          </h2>
          <p>
            {language === 'bn'
              ? 'ফুডি বিডি (খাদক ম্যাপ) ব্যবহারের মাধ্যমে আপনি এই সকল শর্তাবলী মেনে নিতে সম্মত হচ্ছেন।'
              : 'By accessing Foodie BD (খাদক ম্যাপ), you agree to be bound by these Terms of Service and applicable Bangladeshi and international digital regulations.'}
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">
            {language === 'bn' ? '২. কমিউনিটি আচরণবিধি ও পর্যালোচনা' : '2. Community Guidelines & Reviews'}
          </h2>
          <p>
            {language === 'bn'
              ? 'খাবারের রেটিং বা রিভিউ প্রদানের ক্ষেত্রে ব্যবহারকারীকে গঠনমূলক ও সত্যনিষ্ঠ মতামত প্রকাশ করতে হবে। কোনো ধরনের বিভ্রান্তিকর তথ্য বা স্প্যামিং গ্রহণযোগ্য নয়।'
              : 'When leaving ratings and reviews for regional foods, users must provide respectful, accurate feedback. Defamatory, fraudulent, commercial spam, or abusive comments will be moderated and removed by our administrators.'}
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">
            {language === 'bn' ? '৩. মেধা সম্পদ ও ওপেন ডাটা' : '3. Intellectual Property & Attribution'}
          </h2>
          <p>
            {language === 'bn'
              ? 'বাংলাদেশের ৬৪ জেলার প্রশাসনিক সীমানা geoBoundaries ওপেন ডাটাবেজ (CC-BY 4.0) থেকে গৃহীত। ঐতিহ্যবাহী খাবারের বিবরণ ও ইতিহাস সাংস্কৃতিক সংরক্ষণের উদ্দেশ্যে সংকলিত।'
              : 'Administrative district boundaries are sourced under Creative Commons Attribution 4.0 International (CC-BY 4.0) from geoBoundaries. Traditional dish names, culinary heritage narratives, and folk descriptions are archived for public cultural education and culinary preservation.'}
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">
            {language === 'bn' ? '৪. বাণিজ্যিক বিজ্ঞাপনহীনতা' : '4. Disclaimer of Commercial Endorsement'}
          </h2>
          <p>
            {language === 'bn'
              ? 'ঐতিহ্যবাহী দোকান বা মিষ্টির নাম উল্লেখ কোনো বাণিজ্যিক বিজ্ঞাপনের অংশ নয়। খাদ্যতালিকার আনুমানিক মূল্য বাজারের পরিস্থিতি অনুযায়ী পরিবর্তিত হতে পারে।'
              : 'Foodie BD documents cultural and historical culinary origins. Listing a historical sweetmaker, restaurant, or bazaar does not constitute a commercial advertisement. Prices listed are approximate estimations and may fluctuate based on seasonal market conditions.'}
          </p>
        </section>
      </div>
    </div>
  );
};
