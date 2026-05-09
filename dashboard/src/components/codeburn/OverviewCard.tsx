import { SkeletonGroup } from '../Skeleton';
import { useCodeburnStatus } from '../../lib/codeburn';
import type { CodeburnReport, CodeburnStatus } from '../../../../server/src/services/codeburn.js';

interface Props {
  data: CodeburnReport;
}

export function OverviewCard({ data }: Props) {
  const statusQuery = useCodeburnStatus();
  const statusData = statusQuery.data?.ok ? (statusQuery.data.data as CodeburnStatus) : null;

  const tiles = [
    { label: 'Total Cost', value: `$${data.overview.cost.toFixed(2)}` },
    { label: 'Total Calls', value: data.overview.calls.toLocaleString() },
    { label: 'Sessions', value: String(data.overview.sessions) },
    { label: 'Cache Hit %', value: `${data.overview.cacheHitPercent.toFixed(1)}%` },
  ];

  return (
    <div>
      <SkeletonGroup
        loading={false}
        count={4}
        blockHeight="4rem"
        gridTemplate="repeat(4, 1fr)"
        gap="0.75rem"
        aria-label="Loading overview stats"
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
          {tiles.map((t) => (
            <div
              key={t.label}
              style={{
                background: 'var(--bg-secondary, #1a1a2e)',
                border: '1px solid var(--border, #2d2d4e)',
                borderRadius: '0.5rem',
                padding: '0.75rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem',
              }}
            >
              <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary, #888)', textTransform: 'uppercase' }}>
                {t.label}
              </span>
              <span style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary, #eee)' }}>
                {t.value}
              </span>
            </div>
          ))}
        </div>
      </SkeletonGroup>
      {statusData && (
        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.7rem', color: 'var(--text-secondary, #888)' }}>
          <span>Today: ${statusData.today.cost.toFixed(2)} ({statusData.today.calls} calls)</span>
          <span>Month: ${statusData.month.cost.toFixed(2)} ({statusData.month.calls} calls)</span>
        </div>
      )}
    </div>
  );
}
