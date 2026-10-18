import React from 'react';
import { District, Division, MapTheme } from '../../types';
import { useLanguage } from '../../i18n';
import { Search, Download, RotateCcw, Palette, Filter } from 'lucide-react';

interface MapControlsProps {
  districts: District[];
  divisions: Division[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedDivisionId: string;
  onDivisionChange: (divId: string) => void;
  currentTheme: MapTheme;
  onThemeChange: (theme: MapTheme) => void;
  onReset: () => void;
  onOpenExport: () => void;
  onSelectDistrict: (district: District) => void;
}

export const MapControls: React.FC<MapControlsProps> = ({
  districts,
  divisions,
  searchQuery,
  onSearchChange,
  selectedDivisionId,
  onDivisionChange,
  currentTheme,
  onThemeChange,
  onReset,
  onOpenExport,
  onSelectDistrict,
}) => {
  const { language, t, localizedName, localizedDish } = useLanguage();

  const filteredSuggestions = searchQuery.trim()
    ? districts.filter(
        (d) =>
          d.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.nameBn.includes(searchQuery) ||
          d.prominentDishEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.prominentDishBn.includes(searchQuery)
      )
    : [];

  const themeLabels: Record<MapTheme, string> = {
    light: t('map.themeDefault'),
    dark: t('map.themeSatellite'),
    minimal: t('map.themeMinimal'),
    journey: t('map.themeWarm'),
  };

  return (
    <div className="bg-white rounded-xl border border-amber-900/10 p-3 shadow-2xs space-y-3">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* District Search with Autocomplete */}
        <div className="relative flex-1">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t('map.searchDistrict')}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#155C3A] focus:bg-white text-slate-800"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {filteredSuggestions.length > 0 && searchQuery.trim().length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-slate-200 z-50 max-h-56 overflow-y-auto divide-y divide-slate-100">
              {filteredSuggestions.slice(0, 8).map((d) => (
                <button
                  key={d.id}
                  onClick={() => {
                    onSelectDistrict(d);
                    onSearchChange('');
                  }}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-emerald-50 flex items-center justify-between transition-colors cursor-pointer"
                >
                  <div>
                    <span className="font-semibold text-slate-800">{localizedName(d)}</span>
                    <p className="text-[11px] text-amber-800 font-medium">{localizedDish(d)}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 uppercase">{d.divisionId}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Division Filter Buttons / Dropdown */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedDivisionId}
              onChange={(e) => onDivisionChange(e.target.value)}
              aria-label={t('map.filterDivision')}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:ring-1 focus:ring-[#155C3A] focus:outline-none cursor-pointer"
            >
              <option value="all">{t('map.allDivisions')}</option>
              {divisions.map((div) => (
                <option key={div.id} value={div.id}>
                  {localizedName(div)}
                </option>
              ))}
            </select>
          </div>

          {/* Map Themes */}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs">
            <Palette className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
            {(['light', 'dark', 'minimal', 'journey'] as MapTheme[]).map((thm) => (
              <button
                key={thm}
                onClick={() => onThemeChange(thm)}
                className={`px-2 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer ${
                  currentTheme === thm
                    ? 'bg-white text-[#155C3A] font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {themeLabels[thm] || thm}
              </button>
            ))}
          </div>

          {/* Reset Map */}
          <button
            onClick={onReset}
            title={t('map.resetZoom')}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Export Map / Foodie Card */}
          <button
            onClick={onOpenExport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#155C3A] hover:bg-[#0e442a] rounded-lg shadow-2xs transition-colors shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t('journey.exportCardBtn')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
