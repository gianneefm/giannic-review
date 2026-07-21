 import React, {useMemo, useRef, useCallback} from 'react';
 import * as htmlToImage from 'html-to-image';

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

const Star = ({ 
  ratingValue, 
  current, 
  previous, 
  next, 
  fillPercentage,
  size = 28 
}) => {
  const center = 100;
  const outerRadius = 90;
  const innerRadius = outerRadius * 0.45;
  const pointsCount = 5;
  const waitingColor = "#b0afac";
  const id = useMemo(() => Math.random().toString(36).substr(2, 9), []);

  const stops = useMemo(() => {
    if (ratingValue === null || ratingValue === 0) return [waitingColor, waitingColor, waitingColor];
    const currentDark = interpolateColor(current.color, "#000000", 0.4);
    const prevDark = previous ? interpolateColor(previous.color, "#000000", 0.4) : "#000000";
    const mixFactor = (100 - fillPercentage) / 100;
    const mixedPreviousDark = interpolateColor(prevDark, currentDark, mixFactor);
    const mixedNext = next ? interpolateColor(current.color, next.color, fillPercentage / 100) : current.color;

    if (ratingValue < current.average) return [mixedPreviousDark, currentDark, current.color];
    if (ratingValue > current.average) return [currentDark, current.color, mixedNext];
    return [current.color, current.color, current.color];
  }, [ratingValue, current, previous, next, fillPercentage]);

  const facetPaths = useMemo(() => {
    const points = [];
    for (let i = 0; i < 10; i++) {
      const angle = (i * Math.PI) / 5 - Math.PI / 2;
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      points.push({ x: center + radius * Math.cos(angle), y: center + radius * Math.sin(angle) });
    }
    return points.map((p, i) => {
      const nextP = points[(i + 1) % 10];
      return `M ${center},${center} L ${p.x},${p.y} L ${nextP.x},${nextP.y} Z`;
    });
  }, []);

  return (
    <div className="relative flex items-center justify-center animate-rating-pulse" style={{ width: size, height: size }}>
      <svg viewBox="0 0 200 200" className="w-full h-full overflow-visible drop-shadow-[0_3px_5px_rgba(0,0,0,0.4)]">
        <defs>
          <linearGradient id={`starGrad-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={stops[0]} />
            <stop offset="50%" stopColor={stops[1]} />
            <stop offset="100%" stopColor={stops[2]} />
          </linearGradient>
          <mask id={`starMask-${id}`}>
            <rect x="0" y="0" width={`${fillPercentage}%`} height="200" fill="white" />
          </mask>
        </defs>
        <g>
          {facetPaths.map((d, i) => (
            <React.Fragment key={`bg-${i}`}>
              <path d={d} fill={waitingColor} />
              <path d={d} fill={i % 2 === 0 ? "white" : "black"} fillOpacity={i % 2 === 0 ? 0.05 : 0.08} />
            </React.Fragment>
          ))}
        </g>
        {ratingValue > 0 && (
          <g mask={`url(#starMask-${id})`}>
            {facetPaths.map((d, i) => (
              <React.Fragment key={`fg-${i}`}>
                <path d={d} fill={`url(#starGrad-${id})`} />
                <path d={d} fill={i % 2 === 0 ? "white" : "black"} fillOpacity={i % 2 === 0 ? 0.12 : 0.18} />
              </React.Fragment>
            ))}
          </g>
        )}
        <g fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="1">
           {facetPaths.map((d, i) => <path key={`s-${i}`} d={d} />)}
        </g>
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
  
  // Если базовый цвет уже темный (L < 25), мы уменьшаем интенсивность 
  // отрицательного смещения, чтобы сохранить цветовой тон в тенях.
  let calculatedLOffset = lOffset;
  if (l < 25 && lOffset < 0) {
    calculatedLOffset = lOffset * (l / 35); // Смягчаем эффект затемнения
  }

  s = Math.max(0, Math.min(100, s + sOffset));
  
  // Ограничиваем L в диапазоне 5-95%, чтобы избежать "провала" в 
  // абсолютно черный (#000) или абсолютно белый (#fff) цвета.
  l = Math.max(5, Math.min(95, l + calculatedLOffset));
  
  return hslToHex(h, s, l);
}

const App = () => {
  const cardRef = React.useRef(null);
    const coverLink = 'https://i.ibb.co/1Gg5sjDr/e7085082ee74ca0b39999654615e53e8-1000x1000x1.png';

    const vinylColor = '#cec892';
    
    const hdStop1 = '#E8D7B0';
    const hdStop2 = '#C9A56A';
    const hdTypo  = '#21170F';

     const bgStop1 = '#F3E5BF';
     const bgStop2 = '#F4F1EA';
    const bgStop3 = '#DDE8E8';
    const bgStop4 = '#BEDBCF';

    
const bgStop1 = '#e6cf94';
const bgStop2 = '#d7e3b0';
const bgStop3 = '#d1eae9';
const bgStop4 = '#aee0c9';

    const albumTitle = 'everything under the sun';
    const artist = 'Nickelback';

    const proxiedCoverLink = useMemo(() => {
  if (!coverLink) return null;
  return `https://images.weserv.nl/?url=${encodeURIComponent(coverLink)}&default=${encodeURIComponent(coverLink)}`;
}, [coverLink]);

    const handleDownload = React.useCallback(async () => {
  if (cardRef.current === null) return;
  try {
    const dataUrl = await htmlToImage.toPng(cardRef.current, {
      cacheBust: true,
      pixelRatio: 3,
      backgroundColor: null,
       includeQueryParams: true
    });
    const link = document.createElement('a');
    link.download = `${artist} - ${albumTitle}.png`.replace(/\s+/g, '_');
    link.href = dataUrl;
    link.click();
  } catch (err) {
    console.error('Ошибка экспорта:', err);
  }
}, [artist, albumTitle]); 

    const scaleMx = 1000;
    const rateArray = [1000];
    const ratingValue = !rateArray.length ? null : rateArray.reduce((sum, value) => sum + value, 0) / (rateArray.length * (scaleMx / 5));

    const TIERS = [
      { label: "STOP", color: "#EF4444", threshold: 0, average: 0.5 },
      { label: "FLOP", color: "#EA580C", threshold: 1, average: 1.75 },
      { label: "MOP", color: "#F59E0B", threshold: 2.5, average: 3.125 },
      { label: "POP", color: "#7D9A3A", threshold: 3.75, average: 4 },
      { label: "TOP", color: "#059669", threshold: 4.25, average: 4.625 },
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
      return `linear-gradient(to right, ${current.color}, ${current.color})`;
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

      <div ref={cardRef} className="w-full max-w-[450px] aspect-square flex flex-col shadow-2xl rounded-md overflow-hidden relative">
        {/* HEADER */}
        <div className="h-[32px] flex items-center justify-between px-6 shrink-0 z-30 text-black"
              style={{
                borderBottom: `${(hexToHSL(hdStop2).l < 20 && hexToHSL(ftStop1).l < 20 ? '1px solid #ffffff1a' : 'none')}`,
                background: `linear-gradient(to bottom, ${hdStop1 || '#FFFFFF'} 0%, ${hdStop2 || '#FFFFFF'} 100%)`
              }}>
          <span className="font-orbitron text-[10px] tracking-[0.45em] text-black font-black uppercase"
                style={{
                  color: `${hdTypo}`
                }}>GIANNIC REVIEW</span>
          <div className="flex space-x-1">
            <div className="w-1.5 h-1.5 rounded-full" style={{background: '#0A3A4A'}}/>
        <div className="w-1.5 h-1.5 rounded-full bg-neutral-300" style={{background: interpolateColor(interpolateColor('#0A3A4A', '#F0F3F4', 0.5), interpolateColor(bgStop1, bgStop2, 0.5), 0.5)}}/>
            <div className="w-1.5 h-1.5 rounded-full border border-neutral-200" style={{background: '#F0F3F4'}}/>
          </div>
        </div>

        {/* VINYL SECTION */}
        <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden" 
              style={{
               background: `linear-gradient (to bottom, ${bgStop1 || '#FFFFFF'} 0%, ${bgStop2 || '#FFFFFF'} 24%, ${bgStop3 || '#FFFFFF'} 62%,
${bgStop4 || '#FFFFFF'} 100%`
        }}>
          <div className="relative w-[80%] aspect-square z-10 flex items-center justify-center">
            
            {/* Глубокая тень */}
            <div className="absolute inset-2 rounded-full shadow-[0_30px_60px_-5px_rgba(0,0,0,1)]"></div>
            
            {/* Диск (Vinyl Container) */}
            <div className="absolute inset-0 rounded-full vinyl-base border-[3px] border-black/40 overflow-hidden shadow-inner">
              <div className="absolute inset-0" 
                  style={{
                    background: `radial-gradient(circle, ${adjustColor(vinylColor || '#FFFFFF', -30, -10)} 0%, ${vinylColor || '#FFFFFF'} 60%, ${adjustColor(vinylColor || '#FFFFFF', 5, 5)} 100%)`
                }}/>
              <div className="absolute inset-0 rounded-full border border-white/5" />
              <div className="absolute inset-0 opacity-20" 
      style={{
        background: `repeating-radial-gradient(
          circle at center,
          transparent 0,
          transparent 2px,
          ${interpolateColor(vinylColor, '#FFFFFF', 0.1)} 2.5px,
          transparent 3px
        )`
      }} />

  <div className="absolute inset-0 rounded-full border border-white/5" />
              {/* Яблоко (Central Album Cover) */}
              <div className="absolute inset-[18%] rounded-full border-[3px] border-[#13110f] flex items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.8)] z-20 overflow-hidden">
                <img 
  src={proxiedCoverLink} 
  alt="Cover"
  crossOrigin="anonymous" 
  className="absolute inset-0 w-full h-full object-cover"
  style={{ display: coverLink ? 'block' : 'none' }}
/>
{!coverLink && <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600" />}
                
                {/* Центральное отверстие (Central Hole) */}
                <div className="relative w-6 h-6 rounded-full border border-black/20 shadow-inner flex items-center justify-center z-30"
                      style={{
                        backgroundColor: vinylColor ? vinylColor : '#FFFFFF'
                      }}>
                        <button 
                        onClick={handleDownload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50"
                        title="Скачать карточку"
                      />
                  <div className="w-1.5 h-1.5 bg-neutral-300 rounded-full opacity-50" />
                </div>
              </div>
            </div>
          </div>

          {/* Текстовая подложка */}
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-end pb-8 px-8 pointer-events-none text-center">
            <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/95 via-black/50 to-transparent backdrop-blur-[0.5px]" />
            
            <h2 className="relative font-header text-xl md:text-2xl font-black text-white tracking-tighter uppercase leading-none drop-shadow-[0_4px_6px_rgba(0,0,0,0.8)]">
              {albumTitle ? albumTitle : "ALBUN TITLE"}
            </h2>
            <h3 className="relative font-mono text-[10px] md:text-[11px] font-bold text-white tracking-[0.5em] uppercase mt-1 opacity-80">
              {artist ? artist : 'ARTIST NAME'}
            </h3>
          </div>
        </div>

        {/* FOOTER */}
        <div className="h-[56px] flex items-center justify-between px-8 shrink-0 z-30"
              style={{
                borderTop: `${hexToHSL(ftStop1).l < 20 ? '1px solid #ffffff1a' : 'none'}`,
                background: `linear-gradient(to bottom, ${ftStop1 || '#FFFFFF'} 0%, ${ftStop2 || '#FFFFFF'} 50%, ${ftStop3  || '#FFFFFF'} 100%)`
              }}
        >
          <div className="flex items-center w-full">
            {/* Секция со звездой и рейтингом */}
            <div className="flex flex-col items-center justify-center min-w-[35px]">
              <Star 
  ratingValue={ratingValue} 
  current={current}
  previous={previous}
  next={next}
  fillPercentage={fillPercentage}
  size={28}
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
                {ratingValue === null ? "WAITING…" : current.label}
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
