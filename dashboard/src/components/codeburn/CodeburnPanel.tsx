import { useState, useEffect } from 'react';
import { Skeleton } from '../Skeleton';
import { useCodeburnReport, useCodeburnProjects, useCodeburnRefresh } from '../../lib/codeburn';
import { OverviewCard } from './OverviewCard';
import { DailyCostChart } from './DailyCostChart';
import { ProjectsList } from './ProjectsList';
import { ProjectDetail } from './ProjectDetail';
import { CategoryBreakdown } from './CategoryBreakdown';
import { ModelEfficiency } from './ModelEfficiency';
import { ToolUsage } from './ToolUsage';
import { Activity } from 'lucide-react';

// Top of CodeburnPanel.tsx
const params = new URLSearchParams(window.location.search);
const FORCE_SKELETON = params.get('codeburn_skeleton') === '1';

type Period = 'today' | 'week' | '30days' | 'month' | 'all';

export function CodeburnPanel() {
  const [period, setPeriod] = useState<Period>('week');
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [nextRefreshIn, setNextRefreshIn] = useState(300);

  const reportQuery = useCodeburnReport({ period, project: selectedProjects.length > 0 ? selectedProjects : undefined });
  const projectsQuery = useCodeburnProjects();
  const refresh = useCodeburnRefresh();

  const stillComputing = reportQuery.isPending && reportQuery.fetchStatus === 'fetching';
  const [fetchStartedAt, setFetchStartedAt] = useState<number | null>(null);
  useEffect(() => {
    if (reportQuery.isPending) setFetchStartedAt((prev) => prev ?? Date.now());
    else setFetchStartedAt(null);
  }, [reportQuery.isPending]);
  const showSlowHint = stillComputing && fetchStartedAt !== null && Date.now() - fetchStartedAt > 5_000;

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setNextRefreshIn((prev) => (prev <= 1 ? 300 : prev - 1));
    }, 1_000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!reportQuery.isPending && reportQuery.dataUpdatedAt > 0) {
      setNextRefreshIn(300);
    }
  }, [reportQuery.dataUpdatedAt, reportQuery.isPending]);

  function handleProjectSelect(name: string) {
    setSelectedProjects((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  }

  const reportData = reportQuery.data?.ok ? reportQuery.data.data : null;
  const projectsList = projectsQuery.data?.ok ? projectsQuery.data.data : [];

  const cachedAt = reportQuery.data?.ok ? reportQuery.data.cachedAt : null;

  return (
    <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Activity style={{ width: '1rem', height: '1rem', color: '#79b8ff' }} />
          <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary, #eee)' }}>Codeburn</span>
          {reportQuery.isFetching && !reportQuery.isPending && (
            <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary, #888)' }}>Refreshing…</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as Period)}
            style={{ fontSize: '0.7rem', padding: '3px 6px', background: 'var(--bg-secondary, #1a1a2e)', color: 'var(--text-primary, #eee)', border: '1px solid var(--border, #2d2d4e)', borderRadius: 4 }}
          >
            <option value="today">Today</option>
            <option value="week">Week</option>
            <option value="30days">30 days</option>
            <option value="month">Month</option>
            <option value="all">All</option>
          </select>
          <select
            multiple
            value={selectedProjects}
            onChange={(e) => {
              const vals = Array.from(e.target.selectedOptions).map((o) => o.value);
              setSelectedProjects(vals);
            }}
            style={{ fontSize: '0.7rem', padding: '3px 6px', background: 'var(--bg-secondary, #1a1a2e)', color: 'var(--text-primary, #eee)', border: '1px solid var(--border, #2d2d4e)', borderRadius: 4, maxHeight: '5rem' }}
          >
            {projectsList.map((p) => (
              <option key={p.name} value={p.name}>
                {(p.path.split('/').pop() || p.path).slice(0, 40)}
              </option>
            ))}
          </select>
          <button
            onClick={() => refresh.mutate()}
            disabled={refresh.isPending}
            style={{
              fontSize: '0.7rem',
              padding: '3px 10px',
              background: '#79b8ff',
              color: '#000',
              border: 'none',
              borderRadius: 4,
              cursor: refresh.isPending ? 'default' : 'pointer',
              opacity: refresh.isPending ? 0.7 : 1,
            }}
          >
            {refresh.isPending ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {showSlowHint && (
        <div role="status" style={{ fontSize: '0.7rem', color: 'var(--text-secondary, #888)', opacity: 0.8 }}>
          Still computing… first run takes a moment, codeburn is reading session history…
        </div>
      )}

      {/* Main content */}
      {(reportQuery.isPending || FORCE_SKELETON)
        ? <Skeleton loading={true} rows={4} rowHeight="6rem" rowGap="0.6rem" aria-label="Loading Codeburn overview" />
        : reportData
          ? (
            <>
              <OverviewCard data={reportData} />
              <DailyCostChart daily={reportData.daily} />
              {selectedProjects.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {selectedProjects.map((name) => (
                    <ProjectDetail key={name} data={reportData} projectName={name} />
                  ))}
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <ProjectsList
                  projects={reportData.projects}
                  selectedProjects={selectedProjects}
                  onSelect={handleProjectSelect}
                />
                <ModelEfficiency models={reportData.models} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <CategoryBreakdown activities={reportData.activities} />
                <ToolUsage tools={reportData.tools} mcpServers={reportData.mcpServers} shellCommands={reportData.shellCommands} />
              </div>
            </>
          )
          : reportQuery.data && !reportQuery.data.ok
            ? (
              <div style={{ padding: '1rem', border: '1px solid #f44336', color: '#f44336', borderRadius: 4 }}>
                Codeburn error: {reportQuery.data.code}.
                {reportQuery.data.code === 'CODEBURN_NOT_INSTALLED' && (
                  <span> Install: <code>npm install -g codeburn</code></span>
                )}
              </div>
            )
            : null
      }

      {/* Footer */}
      <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary, #888)', marginTop: 'auto' }}>
        {cachedAt
          ? `Last refreshed: ${new Date(cachedAt).toLocaleTimeString('en-US', { hour12: false, timeZone: 'Europe/Berlin' })}. Next refresh in ${nextRefreshIn}s.`
          : 'Fetching data…'
        }
      </div>
    </div>
  );
}
