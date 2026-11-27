import React, { useMemo } from 'react';
import * as htmlToImage from 'html-to-image';

/**
 * Смешивает два HEX-цвета.
 */
const interpolateColor = (color1, color2, factor) => {
  if (!color1 || !color2) return '#b0afac';

  const hex = (color) => parseInt(color.replace('#', ''), 16);

  const r1 = (hex(color1) >> 16) & 255;
  const g1 = (hex(color1) >> 8) & 255;
  const b1 = hex(color1) & 255;

  const r2 = (hex(color2) >> 16) & 255;
  const g2 = (hex(color2) >> 8) & 255;
  const b2 = hex(color2) & 255;

  const r = Math.round(r1 + factor * (r2 - r1));
  const g = Math.round(g1 + factor * (g2 - g1));
  const b = Math.round(b1 + factor * (b2 - b1));

  const toHex = (value) => value.toString(16).padStart(2, '0');

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const Star = ({
  ratingValue,
  current,
  previous,
  next,
  fillPercentage,
  size = 28,
}) => {
  const center = 100;
  const outerRadius = 90;
  const innerRadius = outerRadius * 0.45;
  const waitingColor = '#b0afac';

  const id = useMemo(
    () => Math.random().toString(36).slice(2, 11),
    [],
  );

  const stops = useMemo(() => {
    if (ratingValue === null || ratingValue === 0) {
      return [waitingColor, waitingColor, waitingColor];
    }

    const currentDark = interpolateColor(current.color, '#000000', 0.4);
    const prevDark = previous
      ? interpolateColor(previous.color, '#000000', 0.4)
      : '#000000';

    const mixFactor = (100 - fillPercentage) / 100;
    const mixedPreviousDark = interpolateColor(
      prevDark,
      currentDark,
      mixFactor,
    );
    const mixedNext = next
      ? interpolateColor(current.color, next.color, fillPercentage / 100)
      : current.color;

    if (ratingValue < current.average) {
      return [mixedPreviousDark, currentDark, current.color];
    }

    if (ratingValue > current.average) {
      return [currentDark, current.color, mixedNext];
    }

    return [current.color, current.color, current.color];
  }, [ratingValue, current, previous, next, fillPercentage]);

  const facetPaths = useMemo(() => {
    const points = [];

    for (let i = 0; i < 10; i += 1) {
      const angle = (i * Math.PI) / 5 - Math.PI / 2;
      const radius = i % 2 === 0 ? outerRadius : innerRadius;

      points.push({
        x: center + radius * Math.cos(angle),
        y: center + radius * Math.sin(angle),
      });
    }

    return points.map((point, index) => {
      const nextPoint = points[(index + 1) % 10];
      return `M ${center},${center} L ${point.x},${point.y} L ${nextPoint.x},${nextPoint.y} Z`;
    });
  }, []);

  return (
    <div
      className="relative flex items-center justify-center animate-rating-pulse"
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full overflow-visible drop-shadow-[0_3px_5px_rgba(0,0,0,0.4)]"
      >
        <defs>
          <linearGradient
            id={`starGrad-${id}`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor={stops[0]} />
            <stop offset="50%" stopColor={stops[1]} />
            <stop offset="100%" stopColor={stops[2]} />
          </linearGradient>

          <mask id={`starMask-${id}`}>
            <rect
              x="0"
              y="0"
              width={`${fillPercentage}%`}
              height="200"
              fill="white"
            />
          </mask>
        </defs>

        <g>
          {facetPaths.map((path, index) => (
            <React.Fragment key={`bg-${index}`}>
              <path d={path} fill={waitingColor} />
              <path
                d={path}
                fill={index % 2 === 0 ? 'white' : 'black'}
                fillOpacity={index % 2 === 0 ? 0.05 : 0.08}
              />
            </React.Fragment>
          ))}
        </g>

        {ratingValue > 0 && (
          <g mask={`url(#starMask-${id})`}>
            {facetPaths.map((path, index) => (
              <React.Fragment key={`fg-${index}`}>
                <path d={path} fill={`url(#starGrad-${id})`} />
                <path
                  d={path}
                  fill={index % 2 === 0 ? 'white' : 'black'}
                  fillOpacity={index % 2 === 0 ? 0.12 : 0.18}
                />
              </React.Fragment>
            ))}
          </g>
        )}

        <g fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="1">
          {facetPaths.map((path, index) => (
            <path key={`s-${index}`} d={path} />
          ))}
        </g>
      </svg>
    </div>
  );
};

// Преобразует HEX (#RRGGBB) в HSL.
const hexToHSL = (hex) => {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h;
  let s;
  const l = (max + min) / 2;

  if (max === min) {
    h = 0;
    s = 0;
  } else {
    const delta = max - min;
    s = l > 0.5
      ? delta / (2 - max - min)
      : delta / (max + min);

    switch (max) {
      case r:
        h = (g - b) / delta + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / delta + 2;
        break;
      default:
        h = (r - g) / delta + 4;
        break;
    }

    h /= 6;
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
};

const App = () => {
  const cardRef = React.useRef(null);

  const coverLink = 'https://t2.genius.com/unsafe/604x0/https%3A%2F%2Fimages.genius.com%2F3e49b14373c802c9f73f8097c4aa46f9.1000x1000x1.png';
  const hdStop1 = '#f06380';
  const hdStop2 = '#da3d58';
  const hdTypo = '#f7f8f6';
  const ftStop1 = '#f0f3f4';
  const ftStop2 = '#ffffff';
  const ftTypo = '#e5506c';
  const albumTitle = 'PLAY';
  const artist = 'Эда Ширана';

  const proxiedCoverLink = useMemo(() => {
    if (!coverLink) return null;

    return `https://images.weserv.nl/?url=${encodeURIComponent(
      coverLink,
    )}&default=${encodeURIComponent(coverLink)}`;
  }, [coverLink]);

  const handleDownload = React.useCallback(async () => {
    if (!cardRef.current) return;

    try {
      const dataUrl = await htmlToImage.toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 3,
        backgroundColor: null,
        includeQueryParams: true,
      });

      const link = document.createElement('a');
      link.download = `${artist} - ${albumTitle}.png`.replace(/\s+/g, '_');
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Ошибка экспорта:', error);
    }
  }, [artist, albumTitle]);

  const scaleMx = 1000;
  const rateArray = [914];

  const ratingValue = rateArray.length
    ? rateArray.reduce((sum, value) => sum + value, 0)
      / (rateArray.length * (scaleMx / 5))
    : null;

  const tiers = [
    { label: 'STOP', color: '#EF4444', threshold: 0, average: 0.5 },
    { label: 'FLOP', color: '#EA580C', threshold: 1, average: 1.75 },
    { label: 'MOP', color: '#F59E0B', threshold: 2.5, average: 3.125 },
    { label: 'POP', color: '#7D9A3A', threshold: 3.75, average: 4 },
    { label: 'TOP', color: '#059669', threshold: 4.25, average: 4.625 },
  ];

  const currentIndex = tiers
    .slice()
    .reverse()
    .findIndex((tier) => ratingValue >= tier.threshold);

  const actualIndex = currentIndex >= 0
    ? tiers.length - 1 - currentIndex
    : 0;

  const current = tiers[actualIndex];
  const previous = tiers[actualIndex - 1];
  const next = tiers[actualIndex + 1];

  const fillPercentage = ratingValue !== null
    ? (ratingValue / 5) * 100
    : 0;

  const displayRating = ratingValue !== null
    ? ratingValue.toFixed(2).replace('.', ',')
    : null;

  const getTextGradient = () => {
    if (ratingValue === null) return null;

    const currentDark = interpolateColor(current.color, '#000000', 0.4);
    const prevDark = previous
      ? interpolateColor(previous.color, '#000000', 0.4)
      : '#000000';

    const mixFactor = (100 - fillPercentage) / 100;
    const mixedPreviousDark = interpolateColor(
      prevDark,
      currentDark,
      mixFactor,
    );
    const mixedNext = next
      ? interpolateColor(current.color, next.color, fillPercentage / 100)
      : current.color;

    if (ratingValue < current.average) {
      return `linear-gradient(to right, ${mixedPreviousDark}, ${currentDark}, ${current.color})`;
    }

    if (ratingValue > current.average) {
      return `linear-gradient(to right, ${currentDark}, ${current.color}, ${mixedNext})`;
    }

    return `linear-gradient(to right, ${current.color}, ${current.color})`;
  };

  const textGradient = getTextGradient();

  const gradientTextStyle = ratingValue !== null
    ? {
        backgroundImage: textGradient,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        color: 'transparent',
        display: 'inline-block',
      }
    : { color: '#b0afac' };

  return (
    <div className="flex items-center justify-center min-h-screen bg-neutral-200 p-4">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&family=Orbitron:wght@400;700;900&family=Share+Tech+Mono&family=Space+Grotesk:wght@400;700;900&display=swap');

            .font-orbitron {
              font-family: 'Orbitron', sans-serif;
            }

            .font-inter {
              font-family: 'Inter', sans-serif;
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
          `,
        }}
      />

      <div
        ref={cardRef}
        className="w-full max-w-[450px] aspect-square flex flex-col shadow-2xl overflow-hidden relative"
      >
        {/* HEADER */}
        <div className="h-[32px] flex items-center justify-center border-b border-white/5 z-30" style={{background: `linear-gradient(to bottom, ${hdStop1 || '#fff'} 50%, ${hdStop2 || '#fff'} 100%)`}}>
        <span className="font-orbitron text-[10px] tracking-[0.45em] uppercase" 
                style={{
                    color: hdTypo || '#000',
                    fontWeight: 900,
                }}
        >
            Gianneeversary
          </span>
        </div>

        {/* VINYL SECTION */}
        <div className="flex-1 relative overflow-hidden flex flex-col justify-end items-start p-8">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: proxiedCoverLink
                ? `url("${proxiedCoverLink}")`
                : 'none',
            }}
          />

          <div className="absolute inset-0 bg-gradient-to-tr from-black/90 via-black/30 to-transparent pointer-events-none" />

          <div className="relative z-20 text-white drop-shadow-[0_4px_6px_rgba(0,0,0,0.9)]">
            <span className="font-inter font-normal block text-[10px] tracking-[0.35em] uppercase mb-2 opacity-90">
              <span className="font-bold text-white">2 года</span> альбому
            </span>

            <h2 className="font-inter text-4xl font-black leading-none mb-3 uppercase tracking-tighter">
              {albumTitle}
            </h2>

            <p className="font-inter font-normal text-[10px] tracking-[0.3em] opacity-75 uppercase">
              ОТ <span className="font-medium">{artist}</span>
            </p>
          </div>
        </div>

        {/* FOOTER */}
        <div
          className="h-[56px] flex items-center justify-between px-8 shrink-0 z-30"
          style={{
            background: `linear-gradient(to bottom, ${ftStop1 || '#FFFFFF'} 50%, ${ftStop2 || '#FFFFFF'} 100%)`,
          }}
        >
          <div className="flex items-center w-full">
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

            <div className="flex flex-col items-center justify-center opacity-30 flex-1">
              <span
                className="font-orbitron text-[7px] tracking-[0.3em] font-black uppercase"
                style={{ color: ftTypo || '#000000' }}
              >
                RELEASE
              </span>
              <span
                className="font-orbitron text-[7px] tracking-[0.3em] font-black uppercase text-black mt-1 leading-none"
                style={{ color: ftTypo || '#000000' }}
              >
                RANK
              </span>
            </div>

            <div className="flex items-center justify-end min-w-[60px]">
              <span
                className="font-orbitron text-xl font-black tracking-tighter uppercase"
                style={gradientTextStyle}
              >
                {ratingValue === null ? 'WAITING…' : current.label}
              </span>
            </div>
          </div>
        </div>

        <div className="h-2 w-full bg-neutral-950 shrink-0 z-30" />
      </div>

      {/* Вызовите handleDownload из кнопки или другого элемента интерфейса,
          если нужно экспортировать карточку в PNG. */}
    </div>
  );
};

export default App;