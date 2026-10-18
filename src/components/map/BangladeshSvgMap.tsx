import React, { useState, useMemo } from 'react';
import { District, Food } from '../../types';
import { BANGLADESH_DISTRICT_SVGS, BANGLADESH_SVG_VIEWBOX } from '../../data/bangladeshDistrictSvgPaths';
import { useLanguage } from '../../i18n';
import { Utensils, ZoomIn, ZoomOut, RotateCcw, Check } from 'lucide-react';

interface BangladeshSvgMapProps {
  districts: District[];
  visitedDistrictIds: Set<string>;
  selectedDistrict: District | null;
  onSelectDistrict: (district: District) => void;
  themeColor: string;
  showLabels?: boolean;
  showFoodMarkers?: boolean;
  foods?: Food[];
  interactive?: boolean;
  className?: string;
}

export const BangladeshSvgMap: React.FC<BangladeshSvgMapProps> = ({
  districts,
  visitedDistrictIds,
  selectedDistrict,
  onSelectDistrict,
  themeColor,
  showLabels = true,
  showFoodMarkers = true,
  foods = [],
  interactive = true,
  className = '',
}) => {
  const { language, localizedName, localizedDish } = useLanguage();
  const [hoveredDistrict, setHoveredDistrict] = useState<District | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Fast district lookup by shapeName
  const districtByShapeName = useMemo(() => {
    const map = new Map<string, District>();
    districts.forEach((d) => {
      map.set(d.shapeName.toLowerCase(), d);
      map.set(d.id.toLowerCase(), d);
    });
    return map;
  }, [districts]);

  // Food count lookup per district
  const foodCountByDistrict = useMemo(() => {
    const map = new Map<string, number>();
    foods.forEach((f) => {
      map.set(f.districtId, (map.get(f.districtId) || 0) + 1);
    });
    return map;
  }, [foods]);

  const handleMouseMove = (e: React.MouseEvent<SVGElement>, district: District) => {
    if (!interactive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setHoveredDistrict(district);
  };

  const handleMouseLeave = () => {
    setHoveredDistrict(null);
    setMousePos(null);
  };

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.3, 2.5));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.3, 0.8));
  const handleResetZoom = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  return (
    <div className={`relative w-full h-full flex flex-col items-center justify-center select-none ${className}`}>
      {/* Zoom / Controls Floating Panel */}
      {interactive && (
        <div className="absolute top-2 right-2 z-20 flex items-center gap-1 bg-white/90 backdrop-blur-md px-1.5 py-1 rounded-xl border border-stone-200/80 shadow-2xs text-xs">
          <button
            onClick={handleZoomIn}
            className="p-1 text-stone-600 hover:text-[#155C3A] rounded-md hover:bg-stone-100 transition-colors cursor-pointer"
            title={language === 'bn' ? 'বড় করুন' : 'Zoom In'}
            aria-label="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-1 text-stone-600 hover:text-[#155C3A] rounded-md hover:bg-stone-100 transition-colors cursor-pointer"
            title={language === 'bn' ? 'ছোট করুন' : 'Zoom Out'}
            aria-label="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-3.5 bg-stone-200 mx-0.5" />
          <button
            onClick={handleResetZoom}
            className="p-1 text-stone-600 hover:text-[#155C3A] rounded-md hover:bg-stone-100 transition-colors cursor-pointer"
            title={language === 'bn' ? 'রিসেট ভিউ' : 'Reset View'}
            aria-label="Reset View"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* SVG Vector Map Container */}
      <div className="w-full h-full flex items-center justify-center overflow-hidden">
        <svg
          viewBox={BANGLADESH_SVG_VIEWBOX}
          className="w-full h-auto max-h-[580px] drop-shadow-xs transition-transform duration-200"
          style={{
            transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
            transformOrigin: 'center center',
          }}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            {/* Soft filter for visited districts */}
            <filter id="subtle-shadow" x="-5%" y="-5%" width="110%" height="110%">
              <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.12" />
            </filter>
          </defs>

          {/* Render all 64 districts */}
          <g id="districts-layer">
            {Object.entries(BANGLADESH_DISTRICT_SVGS).map(([shapeName, svgData]) => {
              const district = districtByShapeName.get(shapeName.toLowerCase());
              if (!district) return null;

              const isVisited = visitedDistrictIds.has(district.id);
              const isSelected = selectedDistrict?.id === district.id;
              const isHovered = hoveredDistrict?.id === district.id;

              // Color determination
              let fillColor = '#F3EFE6'; // Soft cream/sand unvisited tone
              let strokeColor = '#FFFFFF';
              let strokeWidth = 1.2;

              if (isVisited) {
                fillColor = themeColor;
                strokeColor = '#FFFFFF';
                strokeWidth = 1.5;
              }

              if (isSelected) {
                fillColor = '#E74C3C'; // Bright red for selected
                strokeColor = '#FFFFFF';
                strokeWidth = 2.5;
              } else if (isHovered) {
                strokeColor = '#155C3A';
                strokeWidth = 2;
              }

              return (
                <path
                  key={district.id}
                  d={svgData.path}
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  filter={isVisited || isSelected ? 'url(#subtle-shadow)' : undefined}
                  className={`transition-colors duration-150 ${
                    interactive ? 'cursor-pointer hover:opacity-90' : ''
                  }`}
                  onClick={() => interactive && onSelectDistrict(district)}
                  onMouseMove={(e) => handleMouseMove(e, district)}
                />
              );
            })}
          </g>

          {/* Render District Centroid Markers / Labels */}
          <g id="labels-layer" pointerEvents="none">
            {Object.entries(BANGLADESH_DISTRICT_SVGS).map(([shapeName, svgData]) => {
              const district = districtByShapeName.get(shapeName.toLowerCase());
              if (!district) return null;

              const [cx, cy] = svgData.centroid;
              const isVisited = visitedDistrictIds.has(district.id);
              const isSelected = selectedDistrict?.id === district.id;
              const foodCount = foodCountByDistrict.get(district.id) || 0;

              // Show marker pins for visited or selected or prominent districts
              return (
                <g key={`marker-${district.id}`} transform={`translate(${cx}, ${cy})`}>
                  {/* Visited / Selected badge dot */}
                  {isVisited && (
                    <circle
                      r={isSelected ? 6 : 4}
                      fill="#FFFFFF"
                      stroke={themeColor}
                      strokeWidth={2}
                      opacity={0.95}
                    />
                  )}

                  {/* Food count indicator if food markers are enabled */}
                  {showFoodMarkers && foodCount > 0 && !isVisited && (
                    <circle
                      r={3}
                      fill="#F39C3D"
                      stroke="#FFFFFF"
                      strokeWidth={1}
                      opacity={0.8}
                    />
                  )}

                  {/* District Name text inside/near polygon centroid */}
                  {showLabels && (
                    <text
                      y={isVisited || (showFoodMarkers && foodCount > 0) ? 12 : 3}
                      textAnchor="middle"
                      fill={isVisited ? '#FFFFFF' : '#1e293b'}
                      stroke={isVisited ? themeColor : '#FFFFFF'}
                      strokeWidth={isVisited ? 2.5 : 2}
                      paintOrder="stroke fill"
                      fontSize={isSelected ? '10px' : isVisited ? '8.5px' : '7.5px'}
                      fontWeight={isSelected || isVisited ? '700' : '600'}
                      className="font-bengali select-none pointer-events-none drop-shadow-2xs"
                    >
                      {language === 'bn' ? district.nameBn : district.nameEn}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* Floating Hover Tooltip */}
      {interactive && hoveredDistrict && mousePos && (
        <div
          className="absolute z-30 pointer-events-none bg-slate-900/95 backdrop-blur-md text-white text-xs px-3 py-2 rounded-xl shadow-xl border border-white/10 animate-in fade-in duration-100 flex flex-col gap-0.5"
          style={{
            left: `${Math.min(Math.max(mousePos.x - 70, 10), 450)}px`,
            top: `${Math.max(mousePos.y - 65, 10)}px`,
          }}
        >
          <div className="flex items-center gap-1.5 font-bold">
            <span
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: visitedDistrictIds.has(hoveredDistrict.id)
                  ? themeColor
                  : '#cbd5e1',
              }}
            />
            <span className="font-bengali text-sm font-extrabold">
              {localizedName(hoveredDistrict)}
            </span>
            <span className="text-stone-400 text-[10px] uppercase font-sans">
              ({hoveredDistrict.nameEn})
            </span>
          </div>
          <div className="text-[11px] text-amber-300 font-medium font-bengali flex items-center gap-1">
            <Utensils className="w-3 h-3 text-[#F39C3D]" />
            <span>{localizedDish(hoveredDistrict)}</span>
          </div>
          <div className="text-[10px] text-stone-300 mt-0.5 flex items-center justify-between gap-3">
            <span>
              {visitedDistrictIds.has(hoveredDistrict.id)
                ? (language === 'bn' ? '✓ চেখে দেখেছি' : '✓ Tasted')
                : (language === 'bn' ? 'চেখে দেখতে বাকি' : 'Not yet tasted')}
            </span>
            <span className="text-emerald-400 font-semibold">
              {language === 'bn' ? 'ক্লিক করে খাবার দেখুন' : 'Click to view foods'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
