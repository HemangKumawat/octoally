import type { CodeburnReport } from '../../../../server/src/services/codeburn.js';

interface Props {
  data: CodeburnReport;
  projectName: string;
}

function basename(p: string): string {
  return (p.split('/').pop() || p).slice(0, 40);
}

export function ProjectDetail({ data, projectName }: Props) {
  const project = data.projects.find((p) => p.name === projectName);
  if (!project) return null;

  return (
    <div style={{ padding: '0.5rem', background: 'var(--bg-secondary, #1a1a2e)', borderRadius: '0.5rem', border: '1px solid var(--border, #2d2d4e)' }}>
      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#79b8ff', marginBottom: '0.5rem' }}>
        {basename(project.path)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
        {[
          { label: 'Cost', value: `$${project.cost.toFixed(2)}` },
          { label: 'Calls', value: project.calls.toLocaleString() },
          { label: 'Sessions', value: String(project.sessions) },
          { label: '$/Session', value: `$${(project.avgCostPerSession ?? 0).toFixed(2)}` },
        ].map((t) => (
          <div key={t.label} style={{ fontSize: '0.65rem', color: 'var(--text-secondary, #888)' }}>
            <div>{t.label}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-primary, #eee)', fontWeight: 600 }}>{t.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
