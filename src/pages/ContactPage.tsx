import React, { useState } from 'react';
import { Mail, Send, CheckCircle2, MapPin } from 'lucide-react';
import { District } from '../types';
import { useLanguage } from '../i18n';

interface ContactPageProps {
  districts: District[];
  navigate: (route: string, param?: string) => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({ districts }) => {
  const { language, localizedName } = useLanguage();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [districtId, setDistrictId] = useState('dhaka');
  const [foodName, setFoodName] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setName('');
    setEmail('');
    setFoodName('');
    setMessage('');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-black text-slate-900 font-bengali">
          {language === 'bn' ? 'যোগাযোগ ও নতুন খাবার প্রস্তাবনা' : 'Contact & Food Recommendation'}
        </h1>
        <p className="text-xs text-slate-500 max-w-lg mx-auto font-bengali">
          {language === 'bn'
            ? 'আপনার নিজের জেলার এমন কোনো ঐতিহ্যবাহী রেসিপি বা মিষ্টান্ন আছে যা এখনো তালিকায় নেই? আমাদের কাছে আপনার মূল্যবান তথ্য ও সুপারিশ পাঠান।'
            : 'Have an authentic heritage recipe or traditional sweet from your home district that we should catalog? Send us your recommendation!'}
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-amber-900/10 p-6 sm:p-10 shadow-2xs space-y-6">
        {submitted ? (
          <div className="p-8 text-center space-y-3 bg-emerald-50 rounded-2xl border border-emerald-200">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <h3 className="font-bold text-base text-emerald-950 font-bengali">
              {language === 'bn' ? 'ধন্যবাদ! আপনার প্রস্তাবনা সফলভাবে গৃহীত হয়েছে' : 'Thank You! Your submission has been received'}
            </h3>
            <p className="text-xs text-emerald-800 max-w-md mx-auto font-bengali">
              {language === 'bn'
                ? 'আমাদের রন্ধন ইতিহাস ও ঐতিহ্য গবেষণা দল জেলার তথ্য ও উৎস যাচাই করে প্ল্যাটফর্মে যুক্ত করবে।'
                : 'Our culinary research editorial team will verify the district origin and historical sources.'}
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="mt-2 px-4 py-2 bg-[#155C3A] text-white text-xs font-bold rounded-xl cursor-pointer font-bengali"
            >
              {language === 'bn' ? 'আরেকটি প্রস্তাবনা পাঠান' : 'Submit Another Recommendation'}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 font-bengali">
                  {language === 'bn' ? 'আপনার নাম *' : 'Your Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={language === 'bn' ? 'যেমন: আরিফ চৌধুরী' : 'e.g. Arif Chowdhury'}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 font-bengali">
                  {language === 'bn' ? 'ইমেইল ঠিকানা *' : 'Email Address *'}
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 font-bengali">
                  {language === 'bn' ? 'সংশ্লিষ্ট জেলা *' : 'District Origin *'}
                </label>
                <select
                  value={districtId}
                  onChange={(e) => setDistrictId(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                >
                  {districts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {localizedName(d)} ({language === 'bn' ? d.nameEn : d.nameBn})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 font-bengali">
                  {language === 'bn' ? 'খাবারের নাম *' : 'Food Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={foodName}
                  onChange={(e) => setFoodName(e.target.value)}
                  placeholder={language === 'bn' ? 'যেমন: ছানার পোলাও বা খাসির ভুনা' : 'e.g. Chhanar Polao or Khashi Bhuna'}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 font-bengali">
                {language === 'bn' ? 'বিবরণ ও ঐতিহ্যবাহী ইতিহাস / বিখ্যাত দোকান' : 'Details & History / Famous Sweetmaker / Restaurant'}
              </label>
              <textarea
                rows={4}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={
                  language === 'bn'
                    ? 'খাবারটির প্রস্তুতি, জনপ্রিয় দোকান বা শতবর্ষী ইতিহাস সম্পর্কে যা জানেন লিখুন...'
                    : 'Share the story, shop location, main ingredients, or why this dish is culturally important to the district...'
                }
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#155C3A] hover:bg-[#0e442a] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer font-bengali"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{language === 'bn' ? 'প্রস্তাব পাঠান' : 'Submit Recommendation'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
