/**
 * SkillPicker.stub.tsx
 *
 * Phase 1 stub — NOT wired into the OctoAlly UI yet.
 * Integration target (Phase 2): render inside the OctoAlly sidebar or
 * input toolbar, replacing the raw slash-command entry point.
 *
 * Contract:
 *   - Reads skills from the bundled skills.json (populated by discover-skills.mjs)
 *   - Renders a searchable dropdown of available skills
 *   - On selection, calls `onSkillInvoke(skillName)` — the parent decides
 *     whether to emit a /slashcommand into the chat input or call an API
 *
 * Wire-up checklist (Phase 2):
 *   [ ] Import SkillPicker into the OctoAlly sidebar component
 *   [ ] Pass onSkillInvoke that appends `/${skill.trigger || skill.slug}` to chat input
 *   [ ] Add a refresh button that GETs /api/skills (backed by discover-skills.mjs)
 *   [ ] Gate behind a feature flag: VITE_SKILLS_PLUGIN_ENABLED=true
 */

import React, { useState, useMemo } from 'react';
import skillsData from './skills.json';

export interface Skill {
  slug: string;
  name: string;
  description: string;
  trigger: string | null;
  userInvocable: boolean;
  path: string;
}

interface SkillPickerProps {
  /** Called when the user selects a skill to invoke */
  onSkillInvoke: (skillName: string, trigger: string | null) => void;
  /** Optional filter — set to true to show only user-invocable skills */
  userInvocableOnly?: boolean;
  /** Optional className for the root element */
  className?: string;
}

const skills: Skill[] = skillsData as Skill[];

export function SkillPicker({
  onSkillInvoke,
  userInvocableOnly = false,
  className = '',
}: SkillPickerProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filtered = useMemo(() => {
    const base = userInvocableOnly
      ? skills.filter((s) => s.userInvocable)
      : skills;

    if (!query.trim()) return base;
    const q = query.toLowerCase();
    return base.filter(
      (s) =>
        s.slug.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        (s.trigger && s.trigger.toLowerCase().includes(q))
    );
  }, [query, userInvocableOnly]);

  function handleSelect(skill: Skill) {
    onSkillInvoke(skill.name, skill.trigger);
    setQuery('');
    setIsOpen(false);
  }

  return (
    <div className={`skill-picker ${className}`} style={{ position: 'relative' }}>
      {/* Trigger button */}
      <button
        type="button"
        aria-label="Open skill picker"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        onClick={() => setIsOpen((v) => !v)}
        style={{
          padding: '4px 10px',
          borderRadius: 6,
          border: '1px solid #444',
          background: '#1e1e1e',
          color: '#ccc',
          cursor: 'pointer',
          fontSize: 13,
        }}
      >
        /skills ({skills.length})
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
            width: 380,
            maxHeight: 340,
            overflowY: 'auto',
            background: '#1e1e1e',
            border: '1px solid #555',
            borderRadius: 8,
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            zIndex: 9999,
          }}
        >
          {/* Search */}
          <div style={{ padding: '8px 10px', borderBottom: '1px solid #333' }}>
            <input
              type="search"
              placeholder="Filter skills…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              style={{
                width: '100%',
                background: '#111',
                border: '1px solid #444',
                borderRadius: 4,
                color: '#eee',
                padding: '4px 8px',
                fontSize: 13,
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Results */}
          {filtered.length === 0 ? (
            <div style={{ padding: '12px 14px', color: '#888', fontSize: 13 }}>
              No skills match &ldquo;{query}&rdquo;
            </div>
          ) : (
            filtered.map((skill) => (
              <div
                key={skill.slug}
                role="option"
                aria-selected={false}
                onClick={() => handleSelect(skill)}
                style={{
                  padding: '8px 14px',
                  cursor: 'pointer',
                  borderBottom: '1px solid #2a2a2a',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.background = '#2a2a2a';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.background = 'transparent';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: '#7ec8e3', fontSize: 12, fontFamily: 'monospace' }}>
                    {skill.trigger ?? `/${skill.slug}`}
                  </span>
                  <span style={{ color: '#eee', fontSize: 13, fontWeight: 500 }}>
                    {skill.name}
                  </span>
                </div>
                <div
                  style={{
                    color: '#888',
                    fontSize: 11,
                    marginTop: 2,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {skill.description}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default SkillPicker;
