// miZan — Interactive RTL-Mirrored 12-Month Timeline Chart
import { useEffect, useId, useRef, useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { darija } from '../i18n/darija';
import { t } from '../i18n/t';
import { formatCompactAmount, formatCurrencyText } from '../utils/format';
import type { ForecastResult } from '../types/finance';
import { Money } from './ui/Money';

interface ChartPoint {
  idx: number;
  label: string;
  shortLabel: string;
  balance: number;
  deltaFromPrev: number;
  milestone: 4 | 8 | 12 | null;
  scenarioBalance?: number;
}

interface TimelineChartProps {
  monthly: ForecastResult['monthly'];
  scenarioMonthly?: ForecastResult['monthly'];
  currentBalance: number;
  monthlyIncome: number;
  highlightedMonth?: 4 | 8 | 12 | null;
  onQuickCheckin?: () => void;
}

export function TimelineChart({
  monthly,
  scenarioMonthly,
  currentBalance,
  monthlyIncome,
  highlightedMonth = null,
  onQuickCheckin,
}: TimelineChartProps) {
  const uid = useId();
  const posGradId = `${uid}-pos-grad`;
  const negGradId = `${uid}-neg-grad`;
  const posClipId = `${uid}-pos-clip`;
  const negClipId = `${uid}-neg-clip`;

  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(340);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const updateSize = () => {
      const next = Math.max(240, Math.round(el.getBoundingClientRect().width));
      setWidth(next);
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const isZeroState =
    currentBalance === 0 &&
    monthlyIncome === 0 &&
    monthly.every(m => m.endingBalance === 0);

  if (isZeroState) {
    return (
      <section className="bg-card rounded-2xl border border-line p-6 shadow-card text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto">
          <TrendingUp size={24} strokeWidth={1.75} aria-hidden="true" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-ink-900">{darija.vision.noData}</h3>
          <p className="text-sm text-ink-600">{darija.vision.noDataCta}</p>
        </div>
        {onQuickCheckin ? (
          <button
            type="button"
            onClick={onQuickCheckin}
            className="px-5 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors min-h-[44px]"
          >
            {darija.nav.quickCheckin}
          </button>
        ) : null}
      </section>
    );
  }

  const points: ChartPoint[] = [
    {
      idx: 0,
      label: darija.checkin.today,
      shortLabel: darija.checkin.today,
      balance: currentBalance,
      deltaFromPrev: 0,
      milestone: null,
      scenarioBalance: scenarioMonthly ? currentBalance : undefined,
    },
    ...monthly.map((m, i) => {
      const prev = i === 0 ? currentBalance : monthly[i - 1].endingBalance;
      return {
        idx: i + 1,
        label: m.label,
        shortLabel: m.label.split(' ')[0] || m.label,
        balance: m.endingBalance,
        deltaFromPrev: m.endingBalance - prev,
        milestone: m.isMilestone4 ? (4 as const) : m.isMilestone8 ? (8 as const) : m.isMilestone12 ? (12 as const) : null,
        scenarioBalance: scenarioMonthly?.[i]?.endingBalance,
      };
    }),
  ];

  const allValues = points.flatMap(p =>
    p.scenarioBalance !== undefined ? [p.balance, p.scenarioBalance] : [p.balance]
  );
  const rawMin = Math.min(...allValues);
  const rawMax = Math.max(...allValues);
  const rawSpan = rawMax - rawMin;
  const padDomain = rawSpan === 0 ? Math.max(1000, Math.abs(rawMax) * 0.2) : rawSpan * 0.14;
  const yMin = rawMin - padDomain;
  const yMax = rawMax + padDomain;
  const yRange = yMax - yMin || 1;
  const showZeroLine = yMin <= 0 && yMax >= 0;

  const height = width < 640 ? 200 : 260;
  const padLeft = 48;
  const padRight = 18;
  const padTop = 26;
  const padBottom = 28;
  const plotW = Math.max(100, width - padLeft - padRight);
  const plotH = Math.max(80, height - padTop - padBottom);

  // RTL-mirrored horizontal scale: idx 0 (today) on right, idx 12 (month 12) on left
  const getX = (idx: number) => padLeft + (1 - idx / 12) * plotW;
  const getY = (val: number) => padTop + (1 - (val - yMin) / yRange) * plotH;

  const zeroY = getY(0);
  const areaBaseY = showZeroLine ? zeroY : rawMax < 0 ? padTop : padTop + plotH;

  const linePointsAttr = points
    .map(p => `${getX(p.idx).toFixed(1)},${getY(p.balance).toFixed(1)}`)
    .join(' ');

  const areaPointsAttr = [
    ...points.map(p => `${getX(p.idx).toFixed(1)},${getY(p.balance).toFixed(1)}`),
    `${getX(12).toFixed(1)},${areaBaseY.toFixed(1)}`,
    `${getX(0).toFixed(1)},${areaBaseY.toFixed(1)}`,
  ].join(' ');

  const scenarioPointsAttr = scenarioMonthly
    ? points
        .map(p => `${getX(p.idx).toFixed(1)},${getY(p.scenarioBalance ?? p.balance).toFixed(1)}`)
        .join(' ')
    : null;

  const gridValues = [yMin + yRange * 0.15, yMin + yRange * 0.5, yMin + yRange * 0.85];
  const tickIndices = [0, 4, 8, 12];

  const highlightedIdx =
    highlightedMonth === 4 ? 4 : highlightedMonth === 8 ? 8 : highlightedMonth === 12 ? 12 : null;
  const focusedIdx = activeIdx ?? highlightedIdx;
  const focusedPoint = focusedIdx !== null ? points[focusedIdx] : null;

  const snapToClientX = (clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const localX = clientX - rect.left;
    const normalizedFromRight = 1 - (localX - padLeft) / plotW;
    const snapped = Math.min(12, Math.max(0, Math.round(normalizedFromRight * 12)));
    setActiveIdx(snapped);
  };

  const handleKeyDown = (e: React.KeyboardEvent<SVGRectElement>) => {
    const current = activeIdx ?? highlightedIdx ?? 0;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setActiveIdx(Math.min(12, current + 1));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setActiveIdx(Math.max(0, current - 1));
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActiveIdx(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setActiveIdx(12);
    } else if (e.key === 'Escape') {
      setActiveIdx(null);
    }
  };

  const getMilestoneShortLabel = (milestone: 4 | 8 | 12) => {
    if (milestone === 4) return darija.vision.month4Short;
    if (milestone === 8) return darija.vision.month8Short;
    return darija.vision.month12Short;
  };

  const tooltipLeftPx = focusedPoint
    ? Math.min(Math.max(8, getX(focusedPoint.idx) - 84), Math.max(8, width - 176))
    : 8;

  return (
    <section
      className="bg-card rounded-2xl border border-line p-4 sm:p-5 shadow-card space-y-3"
      aria-labelledby="timeline-title"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id="timeline-title" className="text-base font-bold text-ink-900">
          {darija.vision.timelineTitle}
        </h3>
        {scenarioMonthly ? (
          <div className="flex items-center gap-3 text-xs text-ink-600">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-positive-600 inline-block" aria-hidden="true" />
              <span>{darija.vision.baselineLine}</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span
                className="w-3 border-t-2 border-dashed border-brand-600 inline-block"
                aria-hidden="true"
              />
              <span>{darija.vision.scenarioLine}</span>
            </span>
          </div>
        ) : null}
      </div>

      <div ref={containerRef} dir="ltr" className="relative w-full" style={{ height }}>
        {focusedPoint ? (
          <div
            dir="rtl"
            className="absolute top-1 z-10 w-42 rounded-xl bg-ink-900 text-white p-2.5 text-xs shadow-raised pointer-events-none"
            style={{ insetInlineStart: `${tooltipLeftPx}px` }}
          >
            <div className="font-semibold text-white/80 mb-0.5">{focusedPoint.label}</div>
            <div className="text-sm font-bold">
              <Money amount={focusedPoint.balance} />
            </div>
            {focusedPoint.idx > 0 ? (
              <div className="text-[11px] text-white/80">
                {t(darija.vision.tooltipChange, {
                  amount: formatCurrencyText(focusedPoint.deltaFromPrev, { signed: true }),
                })}
              </div>
            ) : null}
            {focusedPoint.scenarioBalance !== undefined ? (
              <div className="text-[11px] text-brand-50 mt-0.5 pt-0.5 border-t border-white/15">
                {darija.vision.scenarioLine}:{' '}
                <Money amount={focusedPoint.scenarioBalance} showCurrency={false} />
              </div>
            ) : null}
          </div>
        ) : null}

        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="block overflow-visible select-none"
        >
          <defs>
            <linearGradient id={posGradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#059669" stopOpacity="0.24" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id={negGradId} x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#E11D48" stopOpacity="0.24" />
              <stop offset="100%" stopColor="#E11D48" stopOpacity="0.02" />
            </linearGradient>
            <clipPath id={posClipId}>
              <rect
                x={padLeft}
                y={padTop}
                width={plotW}
                height={Math.max(0, (showZeroLine ? zeroY : padTop + plotH) - padTop)}
              />
            </clipPath>
            <clipPath id={negClipId}>
              <rect
                x={padLeft}
                y={showZeroLine ? Math.max(padTop, zeroY) : padTop + plotH}
                width={plotW}
                height={
                  showZeroLine
                    ? Math.max(0, padTop + plotH - Math.max(padTop, zeroY))
                    : 0
                }
              />
            </clipPath>
          </defs>

          {gridValues.map((val, idx) => {
            const gy = getY(val);
            return (
              <g key={idx}>
                <line
                  x1={padLeft}
                  y1={gy}
                  x2={padLeft + plotW}
                  y2={gy}
                  stroke="#E2E8F0"
                  strokeWidth="1"
                />
                <text
                  x={padLeft - 6}
                  y={gy + 3}
                  textAnchor="end"
                  fontSize="10"
                  fill="#94A3B8"
                >
                  {formatCompactAmount(val)}
                </text>
              </g>
            );
          })}

          {showZeroLine ? (
            <line
              x1={padLeft}
              y1={zeroY}
              x2={padLeft + plotW}
              y2={zeroY}
              stroke="#E11D48"
              strokeWidth="1"
              strokeDasharray="4,4"
              opacity="0.7"
            />
          ) : null}

          <polygon points={areaPointsAttr} fill={`url(#${posGradId})`} clipPath={`url(#${posClipId})`} />
          <polygon points={areaPointsAttr} fill={`url(#${negGradId})`} clipPath={`url(#${negClipId})`} />

          <polyline
            fill="none"
            stroke="#059669"
            strokeWidth="2.25"
            strokeLinejoin="round"
            strokeLinecap="round"
            points={linePointsAttr}
          />

          {scenarioPointsAttr ? (
            <polyline
              fill="none"
              stroke="#0F766E"
              strokeWidth="2"
              strokeDasharray="5,4"
              strokeLinejoin="round"
              strokeLinecap="round"
              points={scenarioPointsAttr}
            />
          ) : null}

          {focusedPoint ? (
            <line
              x1={getX(focusedPoint.idx)}
              y1={padTop}
              x2={getX(focusedPoint.idx)}
              y2={padTop + plotH}
              stroke="#0F766E"
              strokeWidth="1"
              strokeDasharray="3,3"
            />
          ) : null}

          {points.map(p => {
            const cx = getX(p.idx);
            const cy = getY(p.balance);
            const isMilestone = p.milestone !== null;
            const isFocused = focusedIdx === p.idx;
            const flipBelow =
              cy < padTop + 22 || (showZeroLine && Math.abs(cy - zeroY) < 14 && cy <= zeroY);
            const labelY = flipBelow ? cy + 16 : cy - 10;

            return (
              <g key={p.idx}>
                {isFocused ? (
                  <circle cx={cx} cy={cy} r="9" fill="#0F766E" fillOpacity="0.16" />
                ) : null}
                <circle
                  cx={cx}
                  cy={cy}
                  r={isFocused ? 5.5 : isMilestone ? 4.5 : 3}
                  fill={isMilestone ? '#C8A24A' : p.balance < 0 ? '#E11D48' : '#059669'}
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                />
                {p.milestone !== null ? (
                  <text
                    x={cx}
                    y={labelY}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="700"
                    fill="#B48728"
                  >
                    {getMilestoneShortLabel(p.milestone)}
                  </text>
                ) : null}
              </g>
            );
          })}

          {tickIndices.map(idx => {
            const pt = points[idx];
            const tx = getX(idx);
            const anchor = idx === 0 ? 'end' : idx === 12 ? 'start' : 'middle';
            return (
              <text
                key={idx}
                x={tx}
                y={height - 6}
                textAnchor={anchor}
                fontSize="11"
                fill="#475569"
              >
                {pt.shortLabel}
              </text>
            );
          })}

          <rect
            x={padLeft}
            y={padTop}
            width={plotW}
            height={plotH}
            fill="transparent"
            tabIndex={0}
            aria-label={darija.vision.timelineAriaLabel}
            style={{ touchAction: 'pan-y', outline: 'none' }}
            onPointerDown={e => snapToClientX(e.clientX)}
            onPointerMove={e => {
              if (e.buttons > 0 || e.pointerType === 'mouse') {
                snapToClientX(e.clientX);
              }
            }}
            onPointerLeave={() => setActiveIdx(null)}
            onKeyDown={handleKeyDown}
          />
        </svg>
      </div>

      <table className="sr-only" aria-label={darija.a11y.chartTable}>
        <thead>
          <tr>
            <th scope="col">{darija.vision.chartTableMonth}</th>
            <th scope="col">{darija.vision.chartTableBalance}</th>
            <th scope="col">{darija.vision.chartTableChange}</th>
          </tr>
        </thead>
        <tbody>
          {points.map(p => (
            <tr key={p.idx}>
              <td>{p.label}</td>
              <td>{formatCurrencyText(p.balance)}</td>
              <td>{p.idx === 0 ? '0' : formatCurrencyText(p.deltaFromPrev, { signed: true })}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
