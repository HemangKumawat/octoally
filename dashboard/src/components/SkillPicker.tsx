/**
 * SkillPicker.tsx
 *
 * Wired variant of SkillPicker.stub.tsx (plugins/claude-skills/SkillPicker.stub.tsx).
 * Promoted to dashboard component in Batch 2 Stream D.
 *
 * Differences from stub:
 *   - Fetches skills via api.skills.list() (same data source as SkillsPanel/SkillSuggestBar)
 *   - onSkillInvoke dispatches octoally:skill-invoke event (sends command to active terminal)
 *   - Styled to match OctoAlly CSS variables (var(--bg-*), var(--text-*), var(--border))
 */

import { useState, useMemo, useEffect } from 'react';
import { api } from '../lib/api';
import type { SkillItem } from '../types/skills';

interface SkillPickerProps {
  /** Called when the user selects a skill */
  onSkillInvoke: (command: string) => void;
  /** Whether to show user-invocable skills only — currently all skills are shown */
  userInvocableOnly?: boolean;
  className?: string;
}

export function SkillPicker({ onSkillInvoke, className = '' }: SkillPickerProps) {
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // Fetch once on mount (same endpoint as SkillsPanel)
  useEffect(() => {
    api.skills.list('').then((data) => setSkills(data.skills)).catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return skills;
    const q = query.toLowerCase();
    return skills.filter(
      (s) =>
        s.id.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        (s.description?.toLowerCase().includes(q)) ||
        s.command.toLowerCase().includes(q)
    );
  }, [skills, query]);

  function handleSelect(skill: SkillItem) {
    onSkillInvoke(skill.command);
    setQuery('');
    setIsOpen(false);
  }

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    function handler(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest('.skill-picker-root')) {
        setIsOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  return (
    <div className={`skill-picker-root ${className}`} style={{ position: 'relative' }}>
      {/* Trigger button — "/" icon to match the slash-command metaphor */}
      <button
        type="button"
        aria-label="Open skill picker"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        onClick={() => setIsOpen((v) => !v)}
        title={`Browse ${skills.length} skills`}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: '0 8px',
          height: 20,
          lineHeight: '20px',
          borderRadius: 10,
          border: `1px solid ${isOpen ? 'var(--accent)' : 'var(--border)'}`,
          background: isOpen ? 'var(--accent)' : 'var(--bg-tertiary)',
          color: isOpen ? 'white' : 'var(--text-secondary)',
          cursor: 'pointer',
          fontSize: 11,
          fontWeight: 600,
          fontFamily: 'monospace',
          userSelect: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        /skills
        {skills.length > 0 && (
          <span style={{ fontSize: 9, opacity: 0.8, fontFamily: 'inherit' }}>
            ({skills.length})
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          role="listbox"
          aria-label="Available skills"
          style={{
            position: 'absolute',
            bottom: '110%',
            left: 0,
            width: 360,
            maxHeight: 320,
            overflowY: 'auto',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            zIndex: 9999,
          }}
        >
          {/* Search */}
          <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'var(--bg-secondary)' }}>
            <input
              type="search"
              placeholder="Filter skills…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              style={{
                width: '100%',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border)',
                borderRadius: 4,
                color: 'var(--text-primary)',
                padding: '4px 8px',
                fontSize: 12,
                boxSizing: 'border-box',
                outline: 'none',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
            />
          </div>

          {/* Results */}
          {filtered.length === 0 ? (
            <div style={{ padding: '12px 14px', color: 'var(--text-tertiary)', fontSize: 12 }}>
              No skills match &ldquo;{query}&rdquo;
            </div>
          ) : (
            filtered.map((skill) => (
              <button
                key={skill.id}
                role="option"
                aria-selected={false}
                onClick={() => handleSelect(skill)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '7px 14px',
                  cursor: 'pointer',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '1px solid var(--border)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-tertiary)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: 'var(--accent)', fontSize: 11, fontFamily: 'monospace', fontWeight: 600, flexShrink: 0 }}>
                    {skill.command}
                  </span>
                  {skill.category && (
                    <span style={{ color: 'var(--text-tertiary)', fontSize: 9, marginLeft: 'auto', whiteSpace: 'nowrap' }}>
                      {skill.category}
                    </span>
                  )}
                </div>
                {skill.description && (
                  <div
                    style={{
                      color: 'var(--text-secondary)',
                      fontSize: 10,
                      marginTop: 1,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {skill.description}
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default SkillPicker;
