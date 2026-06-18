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

// Преобразует HEX (#RRGGBB) в HSL объект
const hexToHSL = (hex) => {
  let r = parseInt(hex.slice(1, 3), 16) / 255;
  let g = parseInt(hex.slice(3, 5), 16) / 255;
  let b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0; 
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
};

// Преобразует HSL обратно в HEX строку
const hslToHex = (h, s, l) => {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = n => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};

const adjustColor = (hex, lOffset, sOffset = 0) => {
  let { h, s, l } = hexToHSL(hex);
  // Ограничиваем значения в диапазоне 0-100
  s = Math.max(0, Math.min(100, s + sOffset));
  l = Math.max(0, Math.min(100, l + lOffset));
  return hslToHex(h, s, l);
}

const App = () => {
  const coverLink = '';
  const vinylColor = '#F5F5ED';
  const bgStop1 = '#F2F5E9';
  const bgStop2 = '#D6DBCC';
  const hdStop1 = '#FFFFFF';
  const hdStop2 = '#F8F8F4';
  const hdTypo = '#333333';
  const ftStop1 = '#171411';
  const ftStop2 = '#0D100B';
  const ftTypo = '##696868';
  const albumTitle = '';
  const artist = '';

  const scaleMx = 1000;
  const rateArray = [];
  const ratingValue = !rateArray.length ? null : rateArray.reduce((sum, value) => sum + value, 0) / (rateArray.length * (scaleMx / 5));

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

  // Расчет градиента для текста на основе логики звезды
  const getTextGradient = () => {
    if (ratingValue === null) return null;

    const currentDark = interpolateColor(current.color, "#000000", 0.4);
    const prevDark = previous ? interpolateColor(previous.color, "#000000", 0.4) : "#000000";
    const mixFactor = (100 - fillPercentage) / 100;
    const mixedPreviousDark = interpolateColor(prevDark, currentDark, mixFactor);
    const mixedNext = next ? interpolateColor(current.color, next.color, fillPercentage / 100) : current.color;

    if (ratingValue < current.average) {
      return `linear-gradient(to right, ${mixedPreviousDark}, ${currentDark}, ${current.color})`;
    } else if (ratingValue > current.average) {
      return `linear-gradient(to right, ${currentDark}, ${current.color}, ${mixedNext})`;
    } else {
      return current.color; // Сплошной цвет, если точно равно среднему
    }
  };

  const textGradient = getTextGradient();

  // Общие стили для применения градиента к тексту
  const gradientTextStyle = ratingValue !== null ? {
    backgroundImage: textGradient,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    color: 'transparent',
    display: 'inline-block'
  } : { color: "#b0afac" };

  return (
    <div className="flex items-center justify-center min-h-screen bg-neutral-200 p-4">
      {/* Интеграция шрифтов Orbitron, Space Grotesk и Share Tech Mono */}
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

      <div className="w-full max-w-[450px] aspect-square flex flex-col shadow-2xl rounded-sm overflow-hidden relative">
        {/* HEADER */}
        <div className="h-[32px] bg-[#fdfdfb] flex items-center justify-between px-6 border-b border-neutral-100 shrink-0 z-30 text-black">
          <span className="font-orbitron text-[10px] tracking-[0.45em] text-black font-black uppercase"
                style={{
                  color: `${hdTypo}`
                }}>GIANNIC REVIEW</span>
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
          <div className="relative w-[80%] aspect-square z-10 flex items-center justify-center">
            
            {/* Глубокая тень */}
            <div className="absolute inset-2 rounded-full shadow-[0_30px_60px_-5px_rgba(0,0,0,1)]"></div>
            
            {/* Диск (Vinyl Container) */}
            <div className="absolute inset-0 rounded-full vinyl-base border-[3px] border-black/40 overflow-hidden shadow-inner">
              <div className="absolute inset-0" 
                  style={{
                    background: `radial-gradient(circle, ${vinylColor} 0%, ${adjustColor(vinylColor, -30, -10)} 60%, ${adjustColor(vinylColor, 5, 5)} 100%)`
                }}/>
              <div className="absolute inset-0 rounded-full border border-white/5" />
              
              {/* Яблоко (Central Album Cover) */}
              <div 
                className="absolute inset-[18%] rounded-full border-[3px] border-[#13110f] flex items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.8)] z-20 overflow-hidden"
              >
                <div 
                  className="absolute inset-0"
                  style={{
                    backgroundImage: coverLink ? `url(${coverLink})` : `linear-gradient(135deg, #3B82F6, #4F46E5)`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                />
                
                {/* Центральное отверстие (Central Hole) */}
                <div className="relative w-6 h-6 rounded-full border border-black/20 shadow-inner flex items-center justify-center z-30"
                      style={{
                        backgroundColor: '#00000000'
                      }}
                >
                  <div className="w-1.5 h-1.5 bg-neutral-300 rounded-full opacity-50" />
                </div>
              </div>
            </div>
          </div>

          {/* Текстовая подложка */}
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-end pb-8 px-8 pointer-events-none text-center">
            <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/95 via-black/50 to-transparent backdrop-blur-[0.5px]" />
            
            <h2 className="relative font-mono text-xl md:text-2xl font-black text-white tracking-tighter uppercase leading-none drop-shadow-[0_4px_6px_rgba(0,0,0,0.8)]">
              {albumTitle ? albumTitle : "ALBUM TITLE"}
            </h2>
            <h3 className="relative font-mono text-[10px] md:text-[11px] font-bold text-white tracking-[0.5em] uppercase mt-1 opacity-80">
              {artist ? artist : "ARTIST NAME"}
            </h3>
          </div>
        </div>

        {/* FOOTER */}
        <div className="h-[56px] bg-[#f0f3f4] flex items-center justify-between px-8 shrink-0 z-30">
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
                style={gradientTextStyle}
              >
                {displayRating}
              </span>
            </div>

            {/* RELEASE RANK - Strictly positioned between star and tier label */}
            <div className="flex flex-col items-center justify-center opacity-30 flex-1">
              <span className="font-orbitron text-[7px] tracking-[0.3em] font-black uppercase"
                    style={{
                      color: `${ftTypo}`
                    }}>RELEASE</span>
              <span className="font-orbitron text-[7px] tracking-[0.3em] font-black uppercase text-black mt-1 leading-none"
                                  style={{
                      color: `${ftTypo}`
                    }}>RANK</span>
            </div>

            {/* Tier label section with Orbitron font and dynamic gradient */}
            <div className="flex items-center justify-end min-w-[60px]">
              <span 
                className="font-orbitron text-xl font-black tracking-tighter uppercase"
                style={gradientTextStyle}>
                {ratingValue === null ? "WAІTІNG…" : current.label}
              </span>
            </div>
          </div>
        </div>

        <div className="h-2 w-full bg-neutral-950 shrink-0 z-30"></div>
      </div>
    </div>
  );
};

export default App;
