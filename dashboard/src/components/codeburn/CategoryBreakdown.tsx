import type { CodeburnActivity } from '../../../../server/src/services/codeburn.js';

interface Props {
  activities: CodeburnActivity[];
}

function rateColor(rate: number | null): string {
  if (rate === null) return 'var(--text-secondary, #888)';
  if (rate >= 70) return '#4caf50';
  if (rate >= 40) return '#ff9800';
  return '#f44336';
}

export function CategoryBreakdown({ activities }: Props) {
  const sorted = [...activities].sort((a, b) => b.cost - a.cost);
  const maxCost = Math.max(...sorted.map((a) => a.cost), 0.01);

  return (
    <div>
      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary, #eee)', marginBottom: '0.5rem' }}>
        Activity Categories
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        {sorted.map((a) => (
          <div key={a.category} style={{ display: 'grid', gridTemplateColumns: '100px 1fr 50px 60px', gap: '0.5rem', alignItems: 'center', fontSize: '0.65rem' }}>
            <span style={{ color: 'var(--text-secondary, #888)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {a.category}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <div
                style={{
                  height: '0.5rem',
                  width: `${(a.cost / maxCost) * 100}%`,
                  background: '#79b8ff',
                  borderRadius: 2,
                  minWidth: 2,
                }}
              />
              <span style={{ color: 'var(--text-primary, #eee)', whiteSpace: 'nowrap' }}>${a.cost.toFixed(2)}</span>
            </div>
            <span style={{ color: 'var(--text-secondary, #888)', textAlign: 'right' }}>{a.turns}t</span>
            <span style={{ color: rateColor(a.oneShotRate), textAlign: 'right' }}>
              {a.oneShotRate != null ? `${a.oneShotRate.toFixed(0)}%` : '—'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
