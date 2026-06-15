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
  // Константы палитры Toxic Alchemy
  const coverLink = "https://i.ibb.co/k6BkRRBQ/2025-12-cover-art.png";
  const vinylColor = '#C6E8BC';
  const bgStop1 = '#050B05';
  const bgStop2 = '#1A331A';
  const hdStop1 = '#DFFF00';
  const hdStop2 = '#32CD32';
  const ftStop1 = '#0A1F0A';
  const ftStop2 = '#1DB954';

  const albumTitle = "Судный день";
  const artist = "ЛСП";
  const ratingValue = null; // Текущее состояние: Ожидание

  const TIERS = [
    { label: "STOP", color: "#EF4444", threshold: 0, average: 0.75 },
    { label: "FLOP", color: "#EA580C", threshold: 1.5, average: 2.0 },
    { label: "MOP", color: "#F59E0B", threshold: 2.5, average: 3.0 },
    { label: "POP", color: "#7D9A3A", threshold: 3.5, average: 4.0 },
    { label: "TOP", color: "#059669", threshold: 4.5, average: 4.75 },
  ];

  const currentIndex = TIERS.slice().reverse().findIndex(tier => ratingValue >= tier.threshold);
  const actualIndex = currentIndex >= 0 ? (TIERS.length - 1 - currentIndex) : 0;

  const current = TIERS[actualIndex];
  const previous = TIERS[actualIndex - 1];
  const next = TIERS[actualIndex + 1];
  
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
    <div className="flex items-center justify-center min-h-screen bg-neutral-900 p-4">
      {/* Интеграция шрифтов */}
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Share+Tech+Mono&family=Space+Grotesk:wght@400;700;900&display=swap');
        .font-orbitron {
          font-family: 'Orbitron', sans-serif;
        }
        .font-header {
          font-family: 'Space Grotesk', sans-serif;
        }
        .font-mono {
          font-family: 'Share Tech Mono', monospace;
        }
        @keyframes rating-pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        .animate-rating-pulse {
          animation: rating-pulse 2s infinite ease-in-out;
        }
      `}} />

      <div 
        className="w-full max-w-[450px] aspect-square flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.8)] rounded-sm overflow-hidden relative"
        style={{ border: `2px solid ${hdStop2}33` }}
      >
        {/* HEADER */}
        <div className="h-[32px] bg-[#fdfdfb] flex items-center justify-between px-6 border-b border-neutral-100 shrink-0 z-30 text-black">
          <span className="font-orbitron text-[10px] tracking-[0.45em] text-black font-black uppercase">
            GIANNIC REVIEW
          </span>
          <div className="flex space-x-1">
            <div className="w-1.5 h-1.5 rounded-full bg-black" />
            <div className="w-1.5 h-1.5 rounded-full bg-neutral-300" />
            <div className="w-1.5 h-1.5 rounded-full bg-neutral-100 border border-neutral-200" />
          </div>
        </div>

        {/* VINYL SECTION */}
        <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden" style={{
          backgroundImage: `linear-gradient(135deg, ${bgStop1} 0%, ${bgStop2} 100%)`
        }}>
          {/* Highlight/Neon Gradient Overlay */}
          <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
            background: `radial-gradient(circle at top right, ${hdStop1}, transparent 70%)`
          }} />

          <div className="relative w-[80%] aspect-square z-10 flex items-center justify-center">
            
            {/* Глубокая тень */}
            <div className="absolute inset-2 rounded-full shadow-[0_30px_60px_-5px_rgba(0,0,0,1)]"></div>
            
            {/* Диск (Vinyl Container) */}
            <div className="absolute inset-0 rounded-full vinyl-base border-[3px] border-black/60 overflow-hidden shadow-inner">
              <div className="absolute inset-0" style={{
                background: `radial-gradient(circle, ${vinylColor} 0%, #0a110a 60%, #000000 100%)`
              }}/>
              
              {/* Канавки винила */}
              <div className="absolute inset-0 rounded-full opacity-20" style={{
                background: `repeating-radial-gradient(circle, transparent, transparent 2px, rgba(255,255,255,0.05) 3px)`
              }} />
              
              {/* Яблоко (Central Album Cover) */}
              <div 
                className="absolute inset-[18%] rounded-full border-[6px] border-[#13110f] flex items-center justify-center shadow-[0_0_40px_rgba(0,0,0,0.9)] z-20 overflow-hidden"
              >
                <div 
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `url(${coverLink})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                />
                
                {/* Центральное отверстие (Central Hole) */}
                <div className="relative w-6 h-6 rounded-full border border-black/40 shadow-inner flex items-center justify-center z-30 overflow-hidden bg-black">
                  <div className="absolute inset-0 opacity-50" style={{
                    backgroundImage: `linear-gradient(135deg, ${hdStop1}, ${hdStop2})`
                  }} />
                  <div className="relative w-1.5 h-1.5 bg-neutral-200 rounded-full opacity-80 z-40" />
                </div>
              </div>
            </div>
          </div>

          {/* Текстовая подложка */}
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-end pb-8 px-8 pointer-events-none text-center">
            <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/95 via-black/40 to-transparent backdrop-blur-[0.5px]" />
            
            <h2 className="relative font-mono text-xl md:text-2xl font-black text-white tracking-tighter uppercase leading-none drop-shadow-[0_4px_8px_rgba(0,0,0,1)]">
              {albumTitle}
            </h2>
            <h3 className="relative font-mono text-[10px] md:text-[11px] font-bold text-white tracking-[0.5em] uppercase mt-1 opacity-80" style={{ color: hdStop1 }}>
              {artist}
            </h3>
          </div>
        </div>

        {/* FOOTER */}
        <div className="h-[56px] flex items-center justify-between px-8 border-t border-white/10 shrink-0 z-30" style={{
          background: `linear-gradient(90deg, ${ftStop1} 0%, ${ftStop2} 100%)`
        }}>
          <div className="flex items-center w-full">
            {/* Секция со звездой и рейтингом */}
            <div className="flex flex-col items-center justify-center min-w-[30px]">
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

            {/* RELEASE RANK */}
            <div className="flex flex-col items-center justify-center opacity-40 flex-1">
              <span className="font-orbitron text-[7px] tracking-[0.3em] font-black uppercase text-white">RELEASE</span>
              <span className="font-orbitron text-[7px] tracking-[0.3em] font-black uppercase text-white mt-1 leading-none">RANK</span>
            </div>

            {/* Tier label section */}
            <div className="flex items-center justify-end min-w-[60px]">
              <span 
                className="font-orbitron text-xl font-black tracking-tighter uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
                style={{ color: syncedColor === "#b0afac" ? "#ffffff" : syncedColor }}
              >
                {ratingValue === null ? "WAІTІNG…" : current.label}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="h-2 w-full bg-black shrink-0 z-30 border-t border-white/5"></div>
      </div>
    </div>
  );
};

export default App;
