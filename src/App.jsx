import React from 'react';

/**
 * Вспомогательная функция для смешивания HEX-цветов.
 */
const interpolateColor = (color1, color2, factor) => {
  if (!color1 || !color2) return "#b0afac";
  const hex = (c) => parseInt(c.replace('#', ''), 16);
  const r1 = (hex(color1) >> 16) & 255, g1 = (hex(color1) >> 8) & 255, b1 = hex(color1) & 255;
  const r2 = (hex(color2) >> 16) & 255, g2 = (hex(color2) >> 8) & 255, b2 = hex(color2) & 255;
  
  const r = Math.round(r1 + factor * (r2 - r1));
  const g = Math.round(g1 + factor * (g2 - g1));
  const b = Math.round(b1 + factor * (b2 - b1));
  
  const toHex = (n) => n.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

/**
 * DynamicGradientStar: Отрисовка звезды с динамическим градиентом.
 */
const DynamicGradientStar = ({ 
  id, 
  ratingValue, 
  current, 
  previous, 
  next, 
  fillPercentage 
}) => {
  const waitingColor = "#b0afac";
  
  if (ratingValue === null || ratingValue === 0) {
    return (
      <div className="relative w-[25px] h-[25px] flex items-center justify-center animate-rating-pulse">
        <svg 
          viewBox="0 0 24 24" 
          className="w-full h-full drop-shadow-[0_1px_2px_rgba(0,0,0,0.1)] block" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fill={waitingColor}
            d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
          />
        </svg>
      </div>
    );
  }

  const currentDark = interpolateColor(current.color, "#000000", 0.4);
  const prevDark = previous ? interpolateColor(previous.color, "#000000", 0.4) : "#000000";
  const mixFactor = (100 - fillPercentage) / 100;
  const mixedPreviousDark = interpolateColor(prevDark, currentDark, mixFactor);
  const mixedNext = next ? interpolateColor(current.color, next.color, fillPercentage / 100) : current.color;

  const isBelowAverage = ratingValue < current.average;
  const isAboveAverage = ratingValue > current.average;

  const paintId = `${id}-paint`;
  const maskId = `${id}-mask-fill`;

  return (
    <div className="relative w-[25px] h-[25px] flex items-center justify-center animate-rating-pulse">
      <svg 
        viewBox="0 0 24 24" 
        className="w-full h-full drop-shadow-[0_1px_2px_rgba(0,0,0,0.1)] block" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={paintId} x1="0%" y1="0%" x2="100%" y2="0%">
            {isBelowAverage ? (
              <>
                <stop offset="0%" stopColor={mixedPreviousDark} />
                <stop offset="50%" stopColor={currentDark} />
                <stop offset="100%" stopColor={current.color} />
              </>
            ) : isAboveAverage ? (
              <>
                <stop offset="0%" stopColor={currentDark} />
                <stop offset="50%" stopColor={current.color} />
                <stop offset="100%" stopColor={mixedNext} />
              </>
            ) : (
              <stop offset="0%" stopColor={current.color} />
            )}
          </linearGradient>

          <mask id={maskId}>
            <rect x="0" y="0" width={`${fillPercentage}%`} height="100%" fill="white" />
          </mask>
        </defs>

        <path
          fill={waitingColor}
          d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
        />

        <path
          fill={`url(#${paintId})`}
          mask={`url(#${maskId})`}
          d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
        />
      </svg>
    </div>
  );
};

const App = () => {
  const artist = "ARTIST NAME";
  const albumTitle = "ALBUM TITLE";
  const ratingValue = null; // По умолчанию NULL, можно заменить на значение от 0 до 5 для теста

  const TIERS = [
    { label: "STOP", color: "#EF4444", threshold: 0, average: 0.75 },
    { label: "FLOP", color: "#EA580C", threshold: 1.5, average: 2.0 },
    { label: "MOP", color: "#F59E0B", threshold: 2.5, average: 3.0 },
    { label: "POP", color: "#2563EB", threshold: 3.5, average: 4.25 },
    { label: "TOP", color: "#059669", threshold: 5.0, average: 5.0 },
  ];

  const current = TIERS[3]; // По умолчанию выбран тир POP
  const previous = TIERS[2];
  const next = TIERS[4];
  
  const fillPercentage = ratingValue !== null ? (ratingValue / 5) * 100 : 0;
  const displayRating = ratingValue !== null ? ratingValue.toFixed(2).replace('.', ',') : null;

  const getActiveColor = () => {
    if (ratingValue === null) return "#b0afac";
    const nextColorFactor = fillPercentage / 100;
    const mixedNext = next ? interpolateColor(current.color, next.color, nextColorFactor) : current.color;

    if (ratingValue < current.average) {
      return current.color; 
    } else if (ratingValue > current.average) {
      return mixedNext;
    }
    return current.color;
  };

  const syncedColor = getActiveColor();

  return (
    <div className="flex items-center justify-center min-h-screen bg-neutral-200 p-4">
      <div 
        className="w-full max-w-[450px] aspect-square flex flex-col bg-white shadow-2xl rounded-sm overflow-hidden relative"
        style={{ border: '2px solid red' }}
      >
        {/* HEADER */}
        <div className="h-[32px] bg-[#fdfdfb] flex items-center justify-between px-6 border-b border-neutral-100 shrink-0 z-30 text-black">
          <span className="font-header text-[10px] tracking-[0.45em] text-black font-black uppercase">
            GIANNIC REVIEW
          </span>
          <div className="flex space-x-1">
            <div className="w-1.5 h-1.5 rounded-full bg-black" />
            <div className="w-1.5 h-1.5 rounded-full bg-neutral-300" />
            <div className="w-1.5 h-1.5 rounded-full bg-neutral-100 border" />
          </div>
        </div>

        {/* VINYL SECTION */}
        <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden bg-white">
          <div className="relative w-[80%] aspect-square z-10">
            <div className="absolute inset-0 rounded-full shadow-[0_20px_60px_rgba(0,0,0,0.5)]"></div>
            <div className="vinyl-grooves absolute inset-0 rounded-full border-2 border-black/40 animate-spin-slow overflow-hidden">
              <div className="absolute inset-[18%] rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 border-[6px] border-black/95 flex items-center justify-center shadow-inner z-10">
                <div className="w-5 h-5 bg-white rounded-full border border-black/20" />
              </div>
              <div className="absolute inset-0 glass-reflection" />
            </div>
          </div>

          <div className="absolute inset-0 z-20 flex flex-col items-center justify-end pb-8 px-8 pointer-events-none text-center">
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/40 to-transparent backdrop-blur-[2px]" />
            
            <h2 className="relative font-mono text-xl md:text-2xl font-black text-white tracking-tighter uppercase leading-none drop-shadow-md">
              {albumTitle}
            </h2>
            <h3 className="relative font-mono text-[10px] md:text-[11px] font-bold text-white tracking-[0.5em] uppercase mt-1 drop-shadow-md opacity-90">
              {artist}
            </h3>
          </div>
        </div>

        {/* FOOTER */}
        <div className="h-[56px] bg-[#f0f3f4] flex items-center justify-between px-8 border-t border-neutral-200 shrink-0 z-30">
          <div className="flex items-center gap-8">
            <div className="flex flex-col items-center justify-center min-w-[25px]">
              <DynamicGradientStar 
                id="star-rating-main" 
                ratingValue={ratingValue} 
                current={current}
                previous={previous}
                next={next}
                fillPercentage={fillPercentage}
              />
              <span 
                className="font-mono text-[12px] font-black tracking-tighter leading-none mt-1"
                style={{ color: syncedColor }}
              >
                {displayRating}
              </span>
            </div>

            <div className="flex flex-col items-start justify-center opacity-30">
              <span className="font-header text-[7px] tracking-[0.3em] font-black uppercase text-black">RELEASE</span>
              <span className="font-header text-[7px] tracking-[0.3em] font-black uppercase text-black mt-1 leading-none">RANK</span>
            </div>
          </div>

          <div className="flex items-center justify-end">
            <span 
              className="font-header text-xl font-black tracking-tighter uppercase"
              style={{ color: syncedColor }}
            >
              {ratingValue === null ? "WAІTІNG…" : current.label}
            </span>
          </div>
        </div>

        <div className="h-2 w-full bg-neutral-950 shrink-0 z-30"></div>
      </div>
    </div>
  );
};

export default App;