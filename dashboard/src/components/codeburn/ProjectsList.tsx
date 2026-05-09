import { useState } from 'react';
import { Skeleton } from '../Skeleton';
import type { CodeburnProject } from '../../../../server/src/services/codeburn.js';

interface Props {
  projects: CodeburnProject[];
  selectedProjects: string[];
  onSelect: (name: string) => void;
  isPending?: boolean;
}

function basename(p: string): string {
  return (p.split('/').pop() || p).slice(0, 40);
}

export function ProjectsList({ projects, selectedProjects, onSelect, isPending }: Props) {
  const [sortKey, setSortKey] = useState<'cost' | 'calls' | 'sessions'>('cost');

  const sorted = [...projects].sort((a, b) => b[sortKey] - a[sortKey]);

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary, #eee)' }}>Projects</span>
        <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary, #888)' }}>Sort:</span>
        {(['cost', 'calls', 'sessions'] as const).map((k) => (
          <button
            key={k}
            onClick={() => setSortKey(k)}
            style={{
              fontSize: '0.6rem',
              padding: '1px 6px',
              border: 'none',
              borderRadius: 3,
              cursor: 'pointer',
              background: sortKey === k ? '#79b8ff' : 'var(--bg-secondary, #1a1a2e)',
              color: sortKey === k ? '#000' : 'var(--text-secondary, #888)',
            }}
          >
            {k}
          </button>
        ))}
      </div>
      <Skeleton loading={!!isPending} rows={6} rowHeight="2rem" rowGap="0.4rem" aria-label="Loading projects">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem' }}>
          <thead>
            <tr style={{ color: 'var(--text-secondary, #888)', textAlign: 'left' }}>
              <th style={{ padding: '2px 4px' }}>Project</th>
              <th style={{ padding: '2px 4px', textAlign: 'right' }}>Cost</th>
              <th style={{ padding: '2px 4px', textAlign: 'right' }}>Calls</th>
              <th style={{ padding: '2px 4px', textAlign: 'right' }}>Sessions</th>
              <th style={{ padding: '2px 4px', textAlign: 'right' }}>$/session</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((p) => {
              const isSelected = selectedProjects.includes(p.name);
              return (
                <tr
                  key={p.name}
                  onClick={() => onSelect(p.name)}
                  style={{
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(121,184,255,0.15)' : 'transparent',
                    borderBottom: '1px solid var(--border, #2d2d4e)',
                    color: 'var(--text-primary, #eee)',
                  }}
                >
                  <td style={{ padding: '3px 4px', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {basename(p.path)}
                  </td>
                  <td style={{ padding: '3px 4px', textAlign: 'right' }}>${p.cost.toFixed(2)}</td>
                  <td style={{ padding: '3px 4px', textAlign: 'right' }}>{p.calls.toLocaleString()}</td>
                  <td style={{ padding: '3px 4px', textAlign: 'right' }}>{p.sessions}</td>
                  <td style={{ padding: '3px 4px', textAlign: 'right' }}>${(p.avgCostPerSession ?? 0).toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Skeleton>
    </div>
  );
}
