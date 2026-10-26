import React, { useState } from 'react';
import { DIVISIONS } from '../../data/divisionsAndDistricts';
import { useLanguage } from '../../i18n';
import {
  Heart,
  MapPin,
  ShieldCheck,
  Mail,
  Facebook,
  Instagram,
  Linkedin,
  Github,
  User,
} from 'lucide-react';

interface FooterProps {
  navigate: (route: string, param?: string) => void;
}

interface CreatorSocialLink {
  id: string;
  name: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
}

/**
 * ============================================================================
 * CREATOR PROFILE PHOTO CONFIGURATION
 * ============================================================================
 * To display your actual photo:
 * 1. Place your photograph (JPG, PNG, or WebP) in `/public/creator-profile.jpg`
 *    or update `CREATOR_PHOTO_URL` to your custom asset path or URL.
 * 2. The photo is rendered inside a circular crop (object-fit: cover, centered)
 *    with a subtle green border (border-2 border-emerald-400/80) and soft glow.
 * 3. If no image asset has been supplied yet or if the file cannot be loaded,
 *    a clean neutral fallback avatar silhouette is displayed automatically.
 * ============================================================================
 */
export const CREATOR_PHOTO_URL = '/myphoto.png';

const CREATOR_SOCIAL_LINKS: CreatorSocialLink[] = [
  {
    id: 'facebook',
    name: 'Facebook',
    url: 'https://www.facebook.com/sazad01631',
    icon: Facebook,
  },
  {
    id: 'instagram',
    name: 'Instagram',
    url: 'https://www.instagram.com/sazad01631/',
    icon: Instagram,
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    url: 'https://www.linkedin.com/in/sazad01631/',
    icon: Linkedin,
  },
  {
    id: 'github',
    name: 'GitHub',
    url: 'https://github.com/Azad-2025',
    icon: Github,
  },
];

export const Footer: React.FC<FooterProps> = ({ navigate }) => {
  const { language, t, localizedName } = useLanguage();
  const [photoError, setPhotoError] = useState(false);

  return (
    <footer className="relative bg-[#0d2a1c] text-emerald-100 border-t border-emerald-800/60 mt-16 overflow-hidden">
      {/* Cartoon Style Food Feast Background Image with Theme-Harmonized Dark Emerald Overlay */}
      <div className="absolute inset-0 z-0 pointer-events-none select-none overflow-hidden">
        <img
          src="/food-cartoon-banner.jpg"
          alt=""
          aria-hidden="true"
          className="w-full h-full object-cover object-center scale-105 filter brightness-[0.32] contrast-[1.15] saturate-[1.2]"
          loading="lazy"
        />
        {/* Multi-layered dark emerald gradient & vignette overlay to ensure pristine contrast and brand theme harmony */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#12422A]/94 via-[#0d2f1f]/88 to-[#06180f]/96" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/30 via-transparent to-black/60" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand & Creator Col */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-amber-300">
                <MapPin className="w-5 h-5 text-amber-300" />
              </div>
              <span className="text-xl font-black text-white">
                Foodie <span className="text-[#E74C3C]">BD</span>
              </span>
              <span className="text-sm font-bengali text-amber-200">
                {language === 'bn' ? '(খাদক ম্যাপ)' : '(Food Map)'}
              </span>
            </div>
            <p className="text-xs text-emerald-200/80 leading-relaxed max-w-sm">
              {t('footer.aboutDesc')}
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-300/90 pt-1">
              <span className="inline-flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Verified 64 Districts GeoJSON
              </span>
              <span>·</span>
              <span>Open Geographic Data</span>
            </div>

            {/* Creator Personal Social Profile Section with Circular Photo */}
            <div className="pt-4 border-t border-emerald-800/40 space-y-3.5">
              <div className="flex items-center gap-3.5 sm:gap-4.5">
                {/* Circular Profile Photo / Neutral Fallback */}
                <div
                  className="relative shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-emerald-400/80 shadow-[0_0_18px_rgba(52,211,153,0.32)] ring-1 ring-emerald-500/25 bg-emerald-950/80 flex items-center justify-center"
                  title="Muhammad Salah Uddin (Azad)"
                >
                  {!photoError && CREATOR_PHOTO_URL ? (
                    <img
                      src={CREATOR_PHOTO_URL}
                      alt="Muhammad Salah Uddin (Azad)"
                      onError={() => setPhotoError(true)}
                      className="w-full h-full object-cover object-center rounded-full"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-850 to-emerald-950 text-emerald-300/85">
                      <User className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-300/80" aria-label="Muhammad Salah Uddin (Azad)" />
                    </div>
                  )}
                </div>

                {/* Name & Professional Title */}
                <div className="min-w-0">
                  <h3 className="text-lg sm:text-[24px] lg:text-[27px] font-bold text-white tracking-tight leading-tight">
                    Muhammad Salah Uddin (Azad)
                  </h3>
                  <p className="text-xs sm:text-[17px] lg:text-[19px] text-[#34D399] font-medium leading-snug mt-1">
                    Developer &amp; Creator of Foodie BD
                  </p>
                </div>
              </div>

              {/* Social Media Links with Modern Glow Design */}
              <div className="flex items-center gap-2.5 pt-0.5">
                {CREATOR_SOCIAL_LINKS.map((link) => {
                  const IconComponent = link.icon;
                  return (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={link.name}
                      aria-label={`${link.name} - Muhammad Salah Uddin (Azad)`}
                      className="group relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-950/50 border border-emerald-500/25 flex items-center justify-center text-emerald-200 transition-all duration-300 outline-none hover:scale-105 hover:bg-emerald-900/70 hover:border-emerald-400/70 hover:text-white hover:shadow-[0_0_16px_rgba(52,211,153,0.35)] focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#12422A] cursor-pointer"
                    >
                      <IconComponent className="w-[18px] h-[18px] sm:w-5 sm:h-5 transition-transform duration-200 group-hover:scale-110" />
                      {/* Modern ambient glow layer */}
                      <span className="absolute inset-0 rounded-xl bg-emerald-400/0 group-hover:bg-emerald-400/10 transition-colors duration-300 pointer-events-none" />
                    </a>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Divisions */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-300">
              {language === 'bn' ? 'বিভাগসমূহ' : 'Divisions'}
            </p>
            <ul className="space-y-1.5 text-xs text-emerald-200/80">
              {DIVISIONS.map((div) => (
                <li key={div.id}>
                  <button
                    onClick={() => navigate('map', div.id)}
                    className="hover:text-white transition-colors flex items-center justify-between w-full text-left cursor-pointer"
                  >
                    <span>{localizedName(div)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Exploration */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-300">
              {t('footer.exploreLinks')}
            </p>
            <ul className="space-y-2 text-xs text-emerald-200/80">
              <li>
                <button onClick={() => navigate('map')} className="hover:text-white transition-colors cursor-pointer">
                  {t('footer.foodMap')}
                </button>
              </li>
              <li>
                <button onClick={() => navigate('discover')} className="hover:text-white transition-colors cursor-pointer">
                  {t('footer.discover')}
                </button>
              </li>
              <li>
                <button onClick={() => navigate('journey')} className="hover:text-white transition-colors cursor-pointer">
                  {t('footer.journey')}
                </button>
              </li>
              <li>
                <button onClick={() => navigate('about')} className="hover:text-white transition-colors cursor-pointer">
                  {t('footer.about')}
                </button>
              </li>
              <li>
                <button onClick={() => navigate('contact')} className="hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer">
                  <Mail className="w-3.5 h-3.5" />
                  {t('footer.contact')}
                </button>
              </li>
            </ul>
          </div>

          {/* Legal & Standards */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-300">
              {t('footer.legal')}
            </p>
            <ul className="space-y-2 text-xs text-emerald-200/80">
              <li>
                <button onClick={() => navigate('privacy')} className="hover:text-white transition-colors cursor-pointer">
                  {t('footer.privacy')}
                </button>
              </li>
              <li>
                <button onClick={() => navigate('terms')} className="hover:text-white transition-colors cursor-pointer">
                  {t('footer.terms')}
                </button>
              </li>
              <li className="pt-2 text-[11px] text-emerald-300/60 leading-normal">
                District boundaries sourced under CC-BY 4.0 from geoBoundaries (ADM2). Verified 64 district boundaries.
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-emerald-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-emerald-300/70">
          <p>© {new Date().getFullYear()} Foodie BD · {t('footer.rights')}</p>
          <p className="flex items-center gap-1">
            {t('footer.madewith')} <Heart className="w-3.5 h-3.5 text-red-400 fill-current inline" />
          </p>
        </div>
      </div>
    </footer>
  );
};
