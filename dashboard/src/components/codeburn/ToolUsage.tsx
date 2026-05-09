import type { CodeburnTool, CodeburnMcpServer, CodeburnShellCmd } from '../../../../server/src/services/codeburn.js';

interface Props {
  tools: CodeburnTool[];
  mcpServers: CodeburnMcpServer[];
  shellCommands: CodeburnShellCmd[];
}

function SmallList({ title, items, limit }: { title: string; items: Array<{ name: string; calls: number }>; limit: number }) {
  return (
    <div>
      <div style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-secondary, #888)', marginBottom: '0.25rem', textTransform: 'uppercase' }}>
        {title}
      </div>
      {items.slice(0, limit).map((item) => (
        <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', padding: '1px 0', color: 'var(--text-primary, #eee)' }}>
          <span style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
          <span style={{ color: 'var(--text-secondary, #888)' }}>{item.calls}</span>
        </div>
      ))}
    </div>
  );
}

export function ToolUsage({ tools, mcpServers, shellCommands }: Props) {
  const sortedTools = [...tools].sort((a, b) => b.calls - a.calls);
  const sortedMcps = [...mcpServers].sort((a, b) => b.calls - a.calls);
  const sortedShells = [...shellCommands]
    .filter((s) => /^[a-zA-Z]/.test(s.name))
    .sort((a, b) => b.calls - a.calls);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
      <SmallList title="Tools" items={sortedTools} limit={10} />
      <SmallList title="MCP Servers" items={sortedMcps} limit={5} />
      <SmallList title="Shell Commands" items={sortedShells} limit={15} />
    </div>
  );
}
