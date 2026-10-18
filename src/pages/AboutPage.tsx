import React from 'react';
import { Logo } from '../components/layout/Logo';
import { useLanguage } from '../i18n';
import { ShieldCheck, MapPin, Heart, BookOpen, Compass } from 'lucide-react';

interface AboutPageProps {
  navigate: (route: string, param?: string) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ navigate }) => {
  const { language, t } = useLanguage();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-10">
      <div className="text-center space-y-3">
        <div className="flex justify-center mb-2">
          <Logo size="lg" showTagline />
        </div>
        <h1 className="text-3xl font-black text-slate-900 font-bengali">
          {language === 'bn' ? 'খাদক ম্যাপের লক্ষ্য ও দর্শন' : 'About Foodie BD (খাদক ম্যাপ)'}
        </h1>
        <p className="text-sm text-slate-600 max-w-xl mx-auto leading-relaxed font-bengali">
          {language === 'bn'
            ? 'বাংলাদেশের ৮টি বিভাগ এবং ৬৪টি জেলার শতাব্দীপ্রাচীন রন্ধন ঐতিহ্য ও খাঁটি আঞ্চলিক খাবারকে ডিজিটাল মানচিত্রে নথিভুক্ত করার উন্মুক্ত প্ল্যাটফর্ম।'
            : 'Preserving and documenting Bangladesh\'s rich regional culinary tapestry across all 8 divisions and 64 districts.'}
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-amber-900/10 p-6 sm:p-10 shadow-2xs space-y-8 text-xs sm:text-sm text-slate-700 leading-relaxed font-bengali">
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Compass className="w-5 h-5 text-[#155C3A]" />
            <span>{language === 'bn' ? 'আমাদের লক্ষ্য ও দর্শন' : 'Our Vision & Purpose'}</span>
          </h2>
          <p>
            {language === 'bn'
              ? 'ফুডি বিডি (খাদক ম্যাপ) একটি আধুনিক ডিজিটাল খাদ্য অভিধান এবং ভৌগোলিক স্বাদ অন্বেষণ প্ল্যাটফর্ম। নদীমাতৃক বাংলাদেশের প্রতিটি অঞ্চলের রন্ধনপ্রণালী যুগ যুগ ধরে ভূগোল, কৃষিজ ঐতিহ্য ও স্থানীয় সংস্কৃতির সাথে অঙ্গাঙ্গীভাবে জড়িয়ে আছে।'
              : 'Foodie BD (খাদক ম্যাপ) was conceived as a digital culinary archive and geographic discovery engine. Every district of Bangladesh holds recipes forged through centuries of riverine geography, agricultural traditions, royal banquets, and indigenous heritage.'}
          </p>
          <p>
            {language === 'bn'
              ? 'পুরান ঢাকার ঐতিহ্যবাহী কাচ্চি বিরিয়ানি থেকে শুরু করে চট্টগ্রামের মেজবানি মাংস, সিলেটের সাতকড়া গরুর মাংস কিংবা পার্বত্য চট্টগ্রামের বাঁশকড়ুল—খাবারের গল্প ও আঞ্চলিক উৎস তুলে ধরাই আমাদের প্রধান উদ্দেশ্য।'
              : 'From the Mughal court kitchens of Old Dhaka to the bamboo-smoked delicacies of the Chittagong Hill Tracts, our platform empowers explorers to understand not just what a dish tastes like, but where it originated and why it belongs to that specific terroir.'}
          </p>
        </div>

        <div className="space-y-3 pt-4 border-t border-slate-100">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#E74C3C]" />
            <span>{language === 'bn' ? 'ভৌগোলিক নির্ভুলতা ও উন্মুক্ত উপাত্ত' : 'Geographic Integrity & Open Data'}</span>
          </h2>
          <p>
            {language === 'bn'
              ? 'কাল্পনিক কোনো মানচিত্র নয়, ফুডি বিডি সম্পূর্ণভাবে বাংলাদেশের অফিশিয়াল ৬৪ জেলার জিওজেসন বাউন্ডারি (geoBoundaries ADM2) ব্যবহার করে নির্মিত। প্রতিটি জেলার প্রকৃত ভৌগোলিক স্থানাঙ্ক ও সীমানা এতে সংরক্ষিত।'
              : 'Unlike decorative or approximate map illustrations, Foodie BD strictly uses the verified administrative level 2 (ADM2) 64-district boundaries of Bangladesh provided by the geoBoundaries Global Database under CC-BY 4.0.'}
          </p>
        </div>

        <div className="space-y-3 pt-4 border-t border-slate-100">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#F39C3D]" />
            <span>{language === 'bn' ? 'কমিউনিটি নির্ভর রন্ধন আর্কাইভ' : 'Community Driven Heritage'}</span>
          </h2>
          <p>
            {language === 'bn'
              ? 'নিবন্ধিত যে কেউ তার স্বাদগ্রহণ অভিজ্ঞতা রেকর্ড করতে পারেন, চেখে দেখা খাবারের রেটিং ও নোট সংরক্ষণ করতে পারেন এবং নিজের জেলার অনন্য খাবারের প্রস্তাব দিতে পারেন।'
              : 'Registered users can actively maintain their personal food tasting passport, document dates, capture memories, and suggest traditional food varieties from their home districts.'}
          </p>
        </div>

        <div className="pt-6 border-t border-slate-100 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => navigate('map')}
            className="px-6 py-2.5 bg-[#155C3A] hover:bg-[#0e442a] text-white text-xs font-bold rounded-xl transition-colors shadow-xs cursor-pointer"
          >
            {language === 'bn' ? 'খাবারের মানচিত্র দেখুন' : 'Explore Food Map'}
          </button>
          <button
            onClick={() => navigate('contact')}
            className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            {language === 'bn' ? 'যোগাযোগ ও খাবার প্রস্তাব' : 'Contact & Suggest Foods'}
          </button>
        </div>
      </div>
    </div>
  );
};
