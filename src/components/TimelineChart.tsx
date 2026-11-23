// miZan — Timeline Chart (12-month balance projection)
import { useId } from 'react';
import { darija } from '../i18n/darija';
import type { ForecastResult } from '../types/finance';

interface TimelineChartProps {
  monthly: ForecastResult['monthly'];
  currentBalance: number;
}

export function TimelineChart({ monthly, currentBalance }: TimelineChartProps) {
  const gradientId = useId();
  const maxBalance = Math.max(...monthly.map(m => m.endingBalance), currentBalance, 0);
  const minBalance = Math.min(...monthly.map(m => m.endingBalance), currentBalance, 0);
  const range = maxBalance - minBalance || 1;
  const viewBoxWidth = 600;
  const viewBoxHeight = 160;
  const paddingX = 30;
  const paddingY = 20;
  const chartWidth = viewBoxWidth - 2 * paddingX;
  const chartHeight = viewBoxHeight - 2 * paddingY;

  const getX = (i: number) => paddingX + (i / 11) * chartWidth;
  const getY = (balance: number) => paddingY + (1 - (balance - minBalance) / range) * chartHeight;
  const zeroY = getY(0);
  const bottomY = viewBoxHeight - paddingY;

  // Build closed path for area fill (polyline + down to bottom + back to start)
  const areaPoints = [
    ...monthly.map((m: ForecastResult['monthly'][0], i: number) => `${getX(i).toFixed(1)},${getY(m.endingBalance).toFixed(1)}`),
    `${getX(11).toFixed(1)},${bottomY.toFixed(1)}`,
    `${getX(0).toFixed(1)},${bottomY.toFixed(1)}`,
  ].join(' ');

  return (
    <div className="bg-white rounded-xl border p-4" role="img" aria-label={darija.vision.timelineAriaLabel} dir="ltr">
      <h4 className="text-sm font-medium text-gray-700 mb-3 text-center">{darija.vision.timelineTitle}</h4>
      <div className="relative" style={{ width: '100%', height: viewBoxHeight }}>
        <svg viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Closed area fill */}
          <polygon
            fill={`url(#${gradientId})`}
            points={areaPoints}
          />
          {/* Zero baseline reference */}
          <line x1={paddingX} y1={zeroY} x2={viewBoxWidth - paddingX} y2={zeroY} stroke="#ef4444" strokeWidth="0.8" strokeDasharray="4,4" />
          {/* Balance line */}
          <polyline
            fill="none"
            stroke="#10b981"
            strokeWidth="1.5"
            points={monthly.map((m: ForecastResult['monthly'][0], i: number) => {
              return `${getX(i).toFixed(1)},${getY(m.endingBalance).toFixed(1)}`;
            }).join(' ')}
          />
          {/* Monthly data points */}
          {monthly.map((m: ForecastResult['monthly'][0], i: number) => {
            const x = getX(i);
            const y = getY(m.endingBalance);
            const isMilestone = m.isMilestone4 || m.isMilestone8 || m.isMilestone12;
            return (
              <g key={i}>
                <circle cx={x.toFixed(1)} cy={y.toFixed(1)} r={isMilestone ? 5 : 3.5} fill={isMilestone ? '#f59e0b' : '#10b981'} />
                {isMilestone && (
                  <text x={x.toFixed(1)} y={y - 10} textAnchor="middle" fontSize="10" fill="#f59e0b" fontWeight="bold" fontFamily="system-ui, sans-serif">
                    {m.isMilestone4 ? 'M4' : m.isMilestone8 ? 'M8' : 'M12'}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[10px] text-gray-400 px-1" style={{ bottom: '4px' }}>
          {monthly.filter((_: ForecastResult['monthly'][0], i: number) => i % 3 === 0 || i === 11).map((m: ForecastResult['monthly'][0], idx: number) => (
            <span key={idx} className="text-center w-[25%]">{m.label.split(' ')[0]}</span>
          ))}
        </div>
      </div>
    </div>
  );
}