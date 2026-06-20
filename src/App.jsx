import React, { useMemo } from 'react';
import { Star, TrendingUp, Minus, TrendingDown, XCircle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from 'recharts';

const getWeekNumber = (date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

const getWeekDates = (date) => {
  const d = new Date(date);
  const dayOfWeek = d.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  
  const startDate = new Date(d);
  startDate.setDate(d.getDate() + diff);
  
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  
  return { startDate, endDate };
};

const formatWeekDateRange = (startDate, endDate) => {
  const options = { month: 'short', day: 'numeric' };
  const startMonth = startDate.toLocaleDateString('en-US', { ...options, month: 'short' });
  const endMonth = endDate.toLocaleDateString('en-US', { ...options, month: 'short' });
  const year = endDate.getFullYear();
  const formatDay = (d) => d.getDate();
  
  if (startDate.getMonth() === endDate.getMonth()) {
    return `${startMonth} ${formatDay(startDate)} – ${formatDay(endDate)}, ${year}`;
  } else {
    return `${startMonth} ${formatDay(startDate)} – ${endMonth} ${formatDay(endDate)}, ${year}`;
  }
};

const interpolateColor = (color1, color2, factor) => {
  const r1 = parseInt(color1.substring(1, 3), 16);
  const g1 = parseInt(color1.substring(3, 5), 16);
  const b1 = parseInt(color1.substring(5, 7), 16);
  const r2 = parseInt(color2.substring(1, 3), 16);
  const g2 = parseInt(color2.substring(3, 5), 16);
  const b2 = parseInt(color2.substring(5, 7), 16);

  const r = Math.round(r1 + (r2 - r1) * factor);
  const g = Math.round(g1 + (g2 - g1) * factor);
  const b = Math.round(b1 + (b2 - b1) * factor);

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
};

const getDynamicColor = (score) => {
  const scale = [
    { threshold: 0, color: '#B91C1C' },
    { threshold: 1.5, color: '#EA580C' },
    { threshold: 2.5, color: '#F59E0B' },
    { threshold: 3.5, color: '#7D9A3A' },
    { threshold: 4.75, color: '#059669' }
  ];
  if (score <= 0) return scale[0].color;
  if (score >= 5) return scale[4].color;
  for (let i = 0; i < scale.length - 1; i++) {
    if (score >= scale[i].threshold && score <= scale[i + 1].threshold) {
      const factor = (score - scale[i].threshold) / (scale[i + 1].threshold - scale[i].threshold);
      return interpolateColor(scale[i].color, scale[i + 1].color, factor);
    }
  }
  return scale[4].color;
};

const getRankLabel = (score, isNAState = false) => {
  if (isNAState) return "N/A";
  if (score >= 4.5) return "TOP";
  if (score >= 3.5) return "POP";
  if (score >= 2.5) return "MOP";
  if (score >= 1.5) return "FLOP";
  return "STOP";
};

const ActiveSector = (props) => {
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  const RADIAN = Math.PI / 180;
  const offset = 12;
  const nx = cx + offset * Math.cos(-midAngle * RADIAN);
  const ny = cy + offset * Math.sin(-midAngle * RADIAN);

  return (
    <g transform={`translate(${nx - cx}, ${ny - cy})`}>
      <Sector
        cx={cx} cy={cy}
        innerRadius={innerRadius} outerRadius={outerRadius}
        startAngle={startAngle} endAngle={endAngle}
        fill={fill} stroke="none"
      />
    </g>
  );
};

const GradientStar = ({ percentage, score, sizeClass = 'size-7', isZeroRating = false, isNA = false, customGradientStops = null, starColor }) => {
  const gradientId = useMemo(() => `star-gradient-${Math.random().toString(36).slice(2, 9)}`, []);
  const fillPercent = Math.max(0, Math.min(100, percentage));

  let activeColor = starColor || getDynamicColor(score);
  if (isNA) activeColor = '#9CA3AF';

  return (
    <span className={`${sizeClass} inline-flex items-center justify-center`}>
      <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" style={{ filter: 'drop-shadow(1px 1px 4px rgba(0, 0, 0, 0.6))' }}>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            {customGradientStops ? (
              customGradientStops.map((stop, i) => (
                <stop key={i} offset={`${stop.offset}%`} stopColor={stop.color} />
              ))
            ) : isZeroRating ? (
              <>
                <stop offset="0%" stopColor="#441021" />
                <stop offset="50%" stopColor="#db4072" />
                <stop offset="100%" stopColor="#f00552" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor={activeColor} />
                <stop offset={`${fillPercent}%`} stopColor={activeColor} />
                <stop offset={`${fillPercent}%`} stopColor="#4B5563" />
                <stop offset="100%" stopColor="#4B5563" />
              </>
            )}
          </linearGradient>
        </defs>
        <Star fill={`url(#${gradientId})`} stroke="none" size="100%" />
      </svg>
    </span>
  );
};

const RankFooter = ({ avgScore, isZeroRating, isNAState, tierRatio, accentColor, labelText }) => {
  const ratioFill = tierRatio * 100;
  return (
    <div className="flex flex-row items-center justify-center p-4 select-none bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md mt-2 gap-8 text-center font-sans">
      <div className="flex-shrink-0 font-bold text-white/90">{labelText}</div>
      <div className="flex flex-col items-center gap-1">
        <GradientStar percentage={ratioFill} score={avgScore} sizeClass="size-10 sm:size-12" isZeroRating={isZeroRating} isNA={isNAState} starColor={accentColor} />
        {!isNAState && (
          <div className="flex flex-col items-center leading-none">
            <span className="font-sans text-base sm:text-lg font-black tracking-tighter" style={{ color: accentColor }}>
              {ratioFill.toFixed(2)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

const ReleaseItem = ({ title, artist, releaseRank, accentColor, imageUrl }) => {
  const formatText = (text) => text?.toUpperCase().split(" FEAT. ").join(" feat. ") || "";
  
  return (
    <button className="relative group w-full aspect-square rounded-xl overflow-hidden bg-white/10 backdrop-blur-md border border-white/20 shadow-lg transition-transform duration-300 hover:scale-105 active:scale-95 text-left font-sans">
      <img
        src={imageUrl || `https://placehold.co/300x300/1a1a1a/ffffff?text=${encodeURIComponent(title?.charAt(0) || 'R')}`}
        alt={title}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
      />
      <div className="absolute top-0 right-0 bg-black px-2 py-1 rounded-tr-xl rounded-bl-md shadow-xl z-20 border-l border-b border-white/10 min-w-[28px] text-center">
        <span className="font-sans text-[9px] sm:text-[10px] font-extrabold tracking-tighter" style={{ color: accentColor }}>
          {releaseRank.toFixed(2)}
        </span>
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-90" />
      <div className="absolute bottom-0 left-0 w-full p-2.5 flex flex-col justify-end items-start overflow-hidden font-sans">
        <h3 className="text-white text-[10px] sm:text-[12px] font-extrabold tracking-tight leading-tight w-full break-words whitespace-normal uppercase">
          {formatText(title)}
        </h3>
        <p className="text-white/80 text-[8px] sm:text-[10px] font-medium leading-tight mt-1 w-full break-words whitespace-normal">
          {formatText(artist)}
        </p>
      </div>
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 border-2 rounded-xl" style={{ borderColor: accentColor, boxShadow: `inset 0 0 20px ${accentColor}44` }} />
    </button>
  );
};

const Header = ({ weekNumber, dateRangeText }) => (
  <header className="flex flex-col items-center mb-10 text-center select-none border-b-2 border-red-600 pb-4 font-sans">
    <h1 className="font-black tracking-tighter uppercase bg-clip-text text-transparent whitespace-nowrap leading-[1.2] px-8"
      style={{
        backgroundImage: 'linear-gradient(to right, #059669, #7d9a3a, #f59e0b, #ea580c, #b91c1c)',
        WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
        fontSize: 'clamp(1.5rem, 8.5vw, 5rem)', boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone'
      }}>
      FRESH PACK O'FLOW
    </h1>
    <p className="text-lg sm:text-2xl font-bold mt-2 text-gray-400">{dateRangeText}</p>
    <p className="text-sm sm:text-base font-extrabold tracking-widest text-gray-600 mt-1 uppercase">WEEK {weekNumber}</p>
  </header>
);

const TierRow = ({ label, icon: Icon, bgColorClass, rowBgColor, textColorClass, releases, accentColor, tierRatio }) => {
  const isEmpty = !releases || releases.length === 0;

  const { avgScore, isNAState } = useMemo(() => {
    if (isEmpty) return { avgScore: 0, isNAState: true };
    const sum = releases.reduce((acc, r) => acc + r.releaseRank, 0);
    return { avgScore: sum / releases.length, isNAState: false };
  }, [releases, isEmpty]);

  return (
    <section className="w-full mb-8 last:mb-0 pb-8 font-sans" style={{ borderBottom: '2px solid #B91C1C' }}>
      <div className={`flex flex-col sm:flex-row rounded-2xl overflow-hidden backdrop-blur-md border border-white/10 shadow-md ${rowBgColor}`}>
        <div className={`flex flex-col items-center justify-center py-6 sm:py-0 sm:w-28 md:w-32 flex-shrink-0 gap-1 ${bgColorClass} ${textColorClass} shadow-xl`}>
          {Icon && <Icon className="size-6 sm:size-7 opacity-90" />} 
          <h2 className="text-xl md:text-2xl font-black uppercase tracking-tighter text-center leading-none">{label}</h2>
        </div>
        <div className="flex flex-wrap justify-center items-start p-4 sm:p-5 gap-3 sm:gap-4 flex-grow min-h-44">
          {isEmpty ? (
            <div className="flex items-center justify-center w-full h-36 border-2 border-dashed border-gray-400/40 dark:border-white/10 rounded-xl px-4 text-center">
              <span className="text-gray-500/80 dark:text-gray-400/80 font-extrabold uppercase tracking-widest text-xs">
                NO SUCH RELEASES
              </span>
            </div>
          ) : (
            releases.map((rel, idx) => (
              <div key={idx} className="w-[calc(50%-0.75rem)] xs:w-[calc(33.33%-0.75rem)] sm:w-32 md:w-36">
                <ReleaseItem {...rel} accentColor={accentColor} />
              </div>
            ))
          )}
        </div>
      </div>
      <RankFooter
        avgScore={avgScore} isNAState={isNAState}
        tierRatio={tierRatio} accentColor={accentColor}
        labelText={
          <div className="flex flex-col items-start text-left uppercase font-black tracking-widest text-sm sm:text-base leading-tight">
            <span style={{ color: accentColor }}>{label}</span>
            <span className="text-gray-400">RATIO</span>
          </div>
        }
      />
    </section>
  );
};

const MusicRankingFooter = ({ avgScore, isNAState, customGradient, pieData, dominantIndex, dominantLabel, dominantColor }) => {
  const finalPieData = useMemo(() => {
    if (isNAState) return [{ name: "EMPTY", value: 1, fill: "#9CA3AF" }]; 
    return pieData
      .filter(data => data.value > 0)
      .map(data => ({ ...data, fill: data.color }));
  }, [isNAState, pieData]);

  const activeCount = finalPieData.length;

  const filteredActiveIndex = useMemo(() => {
    if (isNAState || dominantIndex === -1) return -1;
    return finalPieData.findIndex(d => d.name === dominantLabel);
  }, [finalPieData, dominantLabel, isNAState, dominantIndex]);

  const textGradientStyle = useMemo(() => {
    if (!customGradient) return 'none';
    const stops = customGradient.map(s => `${s.color} ${s.offset}%`).join(', ');
    return `linear-gradient(to right, ${stops})`;
  }, [customGradient]);

  const reverseRankLabelGradient = useMemo(() => {
    if (!customGradient || isNAState) return 'none';
    const reversedColors = [...customGradient].reverse();
    const stops = reversedColors.map((s, idx) => {
      const offset = (idx / (reversedColors.length - 1)) * 100;
      return `${s.color} ${offset}%`;
    }).join(', ');
    return `linear-gradient(to right, ${stops})`;
  }, [customGradient, isNAState]);

  const renderCustomizedLabel = (props) => {
    const { cx, cy, innerRadius, outerRadius, percent, name, startAngle, endAngle } = props;
    const RADIAN = Math.PI / 180;
    
    if (isNAState || (activeCount === 1 && !isNAState)) return null;

    const midAngle = (startAngle + endAngle) / 2;
    const tierRatio = percent * 100;
    const radius = (innerRadius + outerRadius) / 2;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    if (tierRatio < 5) return null;

    const baseFontSize = activeCount > 3 ? 9 : 11;
    const isOneLine = tierRatio <= 10;
    const rotationAngle = isOneLine ? -midAngle : 0;

    return (
      <g transform={`translate(${x}, ${y})`}>
        <text
          x={0}
          y={0}
          fill="white"
          textAnchor="middle"
          dominantBaseline="central"
          transform={`rotate(${rotationAngle})`}
          className="font-sans font-black uppercase tracking-tighter pointer-events-none"
          style={{ fontSize: `${baseFontSize}px` }}
        >
          {isOneLine ? (
            <tspan x={0} dy="0.3em" className="fill-white/90">
              {`${name} ${tierRatio.toFixed(1)}%`}
            </tspan>
          ) : (
            <>
              <tspan x={0} dy="-0.6em" className="fill-white/90">
                {name}
              </tspan>
              <tspan x={0} dy="1.2em" style={{ fontSize: `${baseFontSize - 1}px`, fontWeight: 700 }} className="fill-white/70">
                {`${tierRatio.toFixed(1)}%`}
              </tspan>
            </>
          )}
        </text>
      </g>
    );
  };

  // UPDATED CAPTIONS
  const captions = {
    'TOP': 'EXCESSIVE REPLAY SYNDROME',
    'POP': 'CERTIFIED FRESH',
    'MOP': 'NGNT | (NOT GREAT, NOT TERRIBLE)',
    'FLOP': 'SKIP-FRIENDLY',
    'STOP': 'COMPLETELY ARGGH'
  };

  const currentCaption = captions[dominantLabel] || 'READY FOR RUSH...';
  // UPDATED SPLITTING LOGIC
  const captionLines = currentCaption.split(' | ');

  return (
    <footer className="mt-12 w-full flex flex-col items-center justify-center select-none overflow-hidden mb-12 font-sans">
      <div className="w-full bg-white/5 border-t border-x border-white/10 backdrop-blur-md px-4 sm:px-10 flex flex-col items-center min-h-[620px]" style={{ clipPath: 'polygon(5% 0%, 95% 0%, 100% 100%, 0% 100%)' }}>
        <div className="w-full flex flex-col items-center pt-8">
          <div className="w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={finalPieData}
                  innerRadius={0}
                  outerRadius="80%"
                  dataKey="value"
                  label={renderCustomizedLabel}
                  labelLine={false}
                  stroke="none"
                  activeIndex={filteredActiveIndex}
                  activeShape={ActiveSector}
                >
                  {finalPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} stroke="none" />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {!isNAState && activeCount === 1 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10 text-center">
                <h2 className="text-4xl sm:text-6xl font-black uppercase tracking-tighter leading-none" style={{ color: finalPieData[0].fill }}>
                  {finalPieData[0].name}
                </h2>
                <span className="text-xl sm:text-2xl font-black text-white/80 tracking-widest mt-1">100%</span>
              </div>
            )}
          </div>
          <div className="mt-12 mb-10 w-full flex flex-row items-center gap-4 justify-center px-4 pl-0 sm:pl-12">
            <div className="flex flex-col items-end sm:items-start leading-tight text-right sm:text-left">
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-500 whitespace-nowrap">MAIN VIBE</span>
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-500 whitespace-nowrap">OF THE WEEK:</span>
            </div>
            <div className="flex flex-col items-start leading-[0.85]">
              {captionLines.map((line, idx) => {
                // FONT SCALING LOGIC
                const isSubtext = line.includes('(');
                return (
                  <span 
                    key={idx} 
                    className={`font-black uppercase -tracking-widest ${isSubtext ? '' : 'text-3xl sm:text-5xl'}`} 
                    style={{ 
                      color: dominantColor,
                      // Ratio 4:1 (if text-5xl is ~3rem, subtext is 0.75rem)
                      fontSize: isSubtext ? '0.75rem' : undefined,
                      lineHeight: isSubtext ? '1.2' : undefined,
                      marginTop: isSubtext ? '0.25rem' : undefined
                    }}
                  >
                    {line}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        <div className="pb-16 flex flex-col items-center w-full">
          <span className="text-xl sm:text-2xl font-black uppercase tracking-widest mb-4" style={{ color: isNAState ? '#9CA3AF' : 'rgb(55, 65, 81)' }}>
            Week Rank
          </span>
          <div className="flex flex-row items-center gap-6 sm:gap-12">
            <div className="flex flex-col items-center gap-2">
              <GradientStar percentage={100} score={avgScore} sizeClass="size-20 sm:size-32" isNA={isNAState} customGradientStops={customGradient} starColor={dominantColor} />
              {!isNAState && (
                <span className="text-2xl sm:text-4xl font-black tracking-tighter leading-none" 
                  style={{ backgroundImage: textGradientStyle, color: customGradient ? 'transparent' : dominantColor, WebkitBackgroundClip: customGradient ? 'text' : 'border-box', backgroundClip: customGradient ? 'text' : 'border-box' }}>
                  {avgScore.toFixed(2)}
                </span>
              )}
            </div>
            <span className="text-5xl sm:text-9xl font-black uppercase tracking-tighter"
                  style={{
                    backgroundImage: reverseRankLabelGradient !== 'none' ? reverseRankLabelGradient : 'none',
                    WebkitBackgroundClip: reverseRankLabelGradient !== 'none' ? 'text' : 'border-box',
                    backgroundClip: reverseRankLabelGradient !== 'none' ? 'text' : 'border-box',
                    color: isNAState ? '#9CA3AF' : (reverseRankLabelGradient !== 'none' ? 'transparent' : dominantColor)
                  }}>
              {getRankLabel(avgScore, isNAState)}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

const FreshPackOFlow = () => {
  const weekInfo = useMemo(() => {
    const now = new Date();
    const { startDate, endDate } = getWeekDates(now);
    const weekNumber = getWeekNumber(startDate);
    const dateRangeText = formatWeekDateRange(startDate, endDate);
    return { weekNumber, dateRangeText };
  }, []);
  
  const releasesData = useMemo(() => [
    {title: 'На ручки', artist: 'Руки вверх!', imageUrl: 'https://i.ibb.co/7JMVq5h4/Cover-of-by-Ruki-Vverh.jpg', releaseRank: 3.07},
    {title: 'Нора', artist: 'Ленинград', imageUrl: 'https://i.ibb.co/htLSD2s/ab67616d0000b2735d0db9872c6769e2a02a2a8a.jpg', releaseRank: 1.48},
    {title: 'Мы', artist: 'IOWA', imageUrl: 'https://i.ibb.co/qYjfYTkf/ab67616d0000b2736daf194767f5fd51b027f401.jpg', releaseRank: 4.23},
    {title: 'LOCA LA VIDA', artist: 'XOLIDAYBOY', imageUrl: 'https://i.ibb.co/1fStJBRM/ab67616d0000b2734b94424c1cf0d4c18fa87cf9.jpg',releaseRank: 4.53},
    {title: 'Ай Ай', artist: 'Yanix', imageUrl: 'https://i.ibb.co/Kxvk46JP/ab67616d0000b2733b971b47d17279092ff02cfb.jpg',releaseRank: 3.34},
    {title: 'Никто не обещал', artist: 'T-Fest', imageUrl: 'https://i.ibb.co/Dxm37hB/ab67616d0000b2730e77e28be11c13e562926895.jpg',releaseRank: 4.93},
    {title: 'свобода ', artist:.' JOLLO, Bunble Beezy, МЦ Похоронил', imageUrl: 'https://i.ibb.co/PZC9L3Rv/Cover-of-CYPHER-by-JOLLO-Bumble-Beezy-Halloween.jpg'; releaseRank: 2.94}
  ].sort((a, b) => b.releaseRank - a.releaseRank), []);

  const tierBase = useMemo(() => [
    { label: "TOP", icon: Star, bgColorClass: "bg-emerald-600/90", rowBgColor: "bg-emerald-500/60", textColorClass: "text-white", accentColor: "#059669" },
    { label: "POP", icon: TrendingUp, bgColorClass: "bg-[#7d9a3a]", rowBgColor: "bg-[#7d9a3a]/60", textColorClass: "text-white", accentColor: "#7D9A3A" },
    { label: "MOP", icon: Minus, bgColorClass: "bg-amber-500/90", rowBgColor: "bg-amber-500/60", textColorClass: "text-white", accentColor: "#F59E0B" },
    { label: "FLOP", icon: TrendingDown, bgColorClass: "bg-orange-600/90", rowBgColor: "bg-orange-500/60", textColorClass: "text-white", accentColor: "#EA580C" },
    { label: "STOP", icon: XCircle, bgColorClass: "bg-red-700/90", rowBgColor: "bg-red-600/60", textColorClass: "text-white", accentColor: "#B91C1C" }
  ], []);

  const CATEGORY_WEIGHTS = { TOP: 1, POP: 2, MOP: 3, FLOP: 4, STOP: 5 };

  const metrics = useMemo(() => {
    const activeReleases = releasesData.filter(r => r.title && typeof r.releaseRank === 'number');
    
    const getTierLabelForRank = (rank) => {
      if (rank >= 4.5) return "TOP";
      if (rank >= 3.5) return "POP";
      if (rank >= 2.5) return "MOP";
      if (rank >= 1.5) return "FLOP";
      return "STOP";
    };

    const grouped = { TOP: [], POP: [], MOP: [], FLOP: [], STOP: [] };
    activeReleases.forEach(rel => {
      const tier = getTierLabelForRank(rel.releaseRank);
      grouped[tier].push(rel);
    });

    const totalWeightedDenominator = activeReleases.reduce((acc, rel) => {
      const tierLabel = getTierLabelForRank(rel.releaseRank);
      const weight = CATEGORY_WEIGHTS[tierLabel] || 0;
      return acc + (rel.releaseRank + weight);
    }, 0);

    const sumOfReleaseRatings = activeReleases.reduce((acc, r) => acc + r.releaseRank, 0);
    const avgScore = activeReleases.length > 0 ? (sumOfReleaseRatings / activeReleases.length) : 0;
    
    const tierRatios = {};
    const pieData = tierBase.map((t) => {
      const releasesInTier = grouped[t.label] || [];
      const tierWeight = CATEGORY_WEIGHTS[t.label] || 0;
      const weightedNumerator = releasesInTier.reduce((acc, r) => acc + (r.releaseRank + tierWeight), 0);
      const ratio = totalWeightedDenominator > 0 ? (weightedNumerator / totalWeightedDenominator) : 0;
      tierRatios[t.label] = ratio;
      return { name: t.label, value: weightedNumerator, color: t.accentColor };
    });

    const isNAState = activeReleases.length === 0;
    const activeTiersForGradient = tierBase.filter(t => (grouped[t.label] || []).length > 0);
    const customGradient = activeTiersForGradient.length > 1 ? activeTiersForGradient.map((t, index) => ({
      color: t.accentColor, offset: (index / (activeTiersForGradient.length - 1)) * 100
    })) : null;

    let maxWeightValue = -1, dominantLabel = 'N/A', dominantColor = '#9CA3AF', dominantIndex = -1;
    pieData.forEach((d, i) => {
      if (d.value > maxWeightValue) {
        maxWeightValue = d.value; dominantLabel = d.name; dominantColor = d.color; dominantIndex = i;
      }
    });

    return { avgScore, isNAState, customGradient, pieData, dominantIndex, dominantLabel, dominantColor, tierRatios, grouped };
  }, [releasesData, tierBase]);

  const { avgScore, isNAState, customGradient, pieData, dominantIndex, dominantLabel, dominantColor, tierRatios, grouped } = metrics;

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-8 font-sans selection:bg-red-600 selection:text-white">
      <div className="max-w-5xl mx-auto">
        <Header weekNumber={weekInfo.weekNumber} dateRangeText={weekInfo.dateRangeText} />
        <main className="space-y-4">
          {tierBase.map((tier) => (
            <TierRow
              key={tier.label} {...tier}
              releases={grouped[tier.label] || []}
              tierRatio={tierRatios[tier.label] || 0}
            />
          ))}
        </main>
        <MusicRankingFooter
          avgScore={avgScore} isNAState={isNAState}
          customGradient={customGradient} pieData={pieData} 
          dominantIndex={dominantIndex} dominantLabel={dominantLabel} dominantColor={dominantColor}
        />
      </div>
    </div>
  );
};

export default FreshPackOFlow;              
