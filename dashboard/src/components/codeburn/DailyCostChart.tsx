import { useState } from 'react';
import type { CodeburnDaily } from '../../../../server/src/services/codeburn.js';

interface Props {
  daily: CodeburnDaily[];
}

export function DailyCostChart({ daily }: Props) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);

  if (!daily || daily.length === 0) {
    return <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary, #888)', fontSize: '0.75rem' }}>No daily data</div>;
  }

  const maxCost = Math.max(...daily.map((d) => d.cost), 0.01);
  const W = 600;
  const H = 200;
  const PADDING = { top: 16, right: 16, bottom: 48, left: 56 };
  const chartW = W - PADDING.left - PADDING.right;
  const chartH = H - PADDING.top - PADDING.bottom;
  const barWidth = Math.max(4, (chartW / daily.length) - 2);

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', height: H }}
        aria-label="Daily cost chart"
      >
        {/* Y axis labels */}
        {[0, 0.5, 1].map((frac) => {
          const y = PADDING.top + chartH * (1 - frac);
          const val = maxCost * frac;
          return (
            <g key={frac}>
              <line
                x1={PADDING.left}
                y1={y}
                x2={PADDING.left + chartW}
                y2={y}
                stroke="var(--border, #2d2d4e)"
                strokeDasharray="4 2"
              />
              <text
                x={PADDING.left - 4}
                y={y + 4}
                textAnchor="end"
                fontSize={10}
                fill="var(--text-secondary, #888)"
              >
                ${val.toFixed(val < 1 ? 2 : 0)}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {daily.map((d, i) => {
          const barH = (d.cost / maxCost) * chartH;
          const x = PADDING.left + (chartW / daily.length) * i + (chartW / daily.length - barWidth) / 2;
          const y = PADDING.top + chartH - barH;
          return (
            <rect
              key={d.date}
              x={x}
              y={y}
              width={barWidth}
              height={Math.max(barH, 1)}
              fill="#79b8ff"
              opacity={0.85}
              style={{ cursor: 'pointer' }}
              onMouseEnter={(e) => {
                const rect = (e.target as SVGElement).ownerSVGElement?.getBoundingClientRect();
                setTooltip({
                  x: rect ? e.clientX - rect.left : x,
                  y: rect ? e.clientY - rect.top : y,
                  text: `${d.date}: $${d.cost.toFixed(2)} (${d.calls} calls)`,
                });
              }}
              onMouseLeave={() => setTooltip(null)}
            />
          );
        })}

        {/* X axis labels */}
        {daily.map((d, i) => {
          const x = PADDING.left + (chartW / daily.length) * i + (chartW / daily.length) / 2;
          const label = d.date.slice(5); // MM-DD
          // Only show every Nth label to avoid overlap
          const step = Math.max(1, Math.floor(daily.length / 10));
          if (i % step !== 0 && i !== daily.length - 1) return null;
          return (
            <text
              key={d.date}
              x={x}
              y={H - PADDING.bottom + 14}
              textAnchor="end"
              fontSize={9}
              fill="var(--text-secondary, #888)"
              transform={`rotate(-45, ${x}, ${H - PADDING.bottom + 14})`}
            >
              {label}
            </text>
          );
        })}
      </svg>

      {tooltip && (
        <div
          style={{
            position: 'absolute',
            left: tooltip.x + 8,
            top: tooltip.y - 8,
            background: 'var(--bg-secondary, #1a1a2e)',
            border: '1px solid var(--border, #2d2d4e)',
            borderRadius: 4,
            padding: '4px 8px',
            fontSize: 11,
            color: 'var(--text-primary, #eee)',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            zIndex: 100,
          }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
}
