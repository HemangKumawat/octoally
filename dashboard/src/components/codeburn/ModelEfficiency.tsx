import type { CodeburnModel } from '../../../../server/src/services/codeburn.js';

interface Props {
  models: CodeburnModel[];
}

export function ModelEfficiency({ models }: Props) {
  const filtered = models.filter(
    (m) => !(m.name === '<synthetic>' || (m.cost === 0 && m.calls < 5))
  );

  return (
    <div>
      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary, #eee)', marginBottom: '0.5rem' }}>
        Model Efficiency
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.65rem' }}>
        <thead>
          <tr style={{ color: 'var(--text-secondary, #888)' }}>
            <th style={{ textAlign: 'left', padding: '2px 4px' }}>Model</th>
            <th style={{ textAlign: 'right', padding: '2px 4px' }}>Calls</th>
            <th style={{ textAlign: 'right', padding: '2px 4px' }}>Cost</th>
            <th style={{ textAlign: 'right', padding: '2px 4px' }}>1-shot%</th>
            <th style={{ textAlign: 'right', padding: '2px 4px' }}>Retries</th>
            <th style={{ textAlign: 'right', padding: '2px 4px' }}>$/edit</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((m) => {
            const isOpus = m.name.startsWith('Opus');
            return (
              <tr
                key={m.name}
                style={{
                  borderBottom: '1px solid var(--border, #2d2d4e)',
                  color: isOpus ? '#79b8ff' : 'var(--text-primary, #eee)',
                }}
              >
                <td style={{ padding: '2px 4px', maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {m.name}
                </td>
                <td style={{ textAlign: 'right', padding: '2px 4px' }}>{m.calls.toLocaleString()}</td>
                <td style={{ textAlign: 'right', padding: '2px 4px' }}>${m.cost.toFixed(2)}</td>
                <td style={{ textAlign: 'right', padding: '2px 4px' }}>
                  {m.oneShotRate != null ? `${m.oneShotRate.toFixed(0)}%` : '—'}
                </td>
                <td style={{ textAlign: 'right', padding: '2px 4px' }}>
                  {m.retriesPerEdit != null ? m.retriesPerEdit.toFixed(2) : '—'}
                </td>
                <td style={{ textAlign: 'right', padding: '2px 4px' }}>
                  {m.costPerEdit != null ? `$${m.costPerEdit.toFixed(3)}` : '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
