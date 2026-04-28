import { useEffect, useRef, useState } from 'react';
import { Palette, Check } from 'lucide-react';

const STORAGE_KEY = 'octoally_theme';

const THEMES = [
  { id: 'operator', label: 'Pro Operator',     blurb: 'dense · IDE',          bg: '#0d0f12', accent: '#ff7a1a' },
  { id: 'neon',     label: 'Neon Vibecoder',   blurb: 'electric multi',       bg: '#0e0b14', accent: '#c6ff3d' },
  { id: 'crt',      label: 'Retro CRT',        blurb: 'phosphor green',       bg: '#061006', accent: '#7dff7d' },
  { id: 'studio',   label: 'Tasteful Studio',  blurb: 'editorial · serif',    bg: '#f5f2ec', accent: '#c65a3a' },
  { id: 'zen',      label: 'Swiss Minimal',    blurb: 'grid · monochrome',    bg: '#ededea', accent: '#0a0a0a' },
  { id: 'critter',  label: 'Playful Creature', blurb: 'octopus · soft pink',  bg: '#fff1f6', accent: '#ff4d8f' },
] as const;

type ThemeId = (typeof THEMES)[number]['id'];

function loadTheme(): ThemeId {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && THEMES.some((t) => t.id === stored)) return stored as ThemeId;
  } catch {}
  return 'operator';
}

function applyTheme(id: ThemeId) {
  document.documentElement.setAttribute('data-theme', id);
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {}
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeId>(loadTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Apply on initial mount (handles persisted value from a previous session)
  useEffect(() => {
    applyTheme(loadTheme());
  }, []);

  function setTheme(id: ThemeId) {
    setThemeState(id);
    applyTheme(id);
  }

  return { theme, setTheme };
}

interface ThemeToggleProps {
  theme: ThemeId;
  setTheme: (id: ThemeId) => void;
}

export function ThemeToggle({ theme, setTheme }: ThemeToggleProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-1.5 rounded-md transition-colors hover:opacity-80"
        style={{ color: 'var(--text-secondary)', background: 'transparent' }}
        title="Change theme"
        aria-label="Change theme"
      >
        <Palette className="w-4 h-4" />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1 z-50 rounded-lg overflow-hidden"
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            minWidth: '180px',
          }}
        >
          <div
            className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}
          >
            Theme
          </div>
          {THEMES.map((t) => {
            const active = theme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => { setTheme(t.id); setOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors"
                style={{
                  color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                  background: active ? 'var(--bg-tertiary)' : 'transparent',
                }}
              >
                {/* Swatch */}
                <span
                  className="w-4 h-4 rounded shrink-0"
                  style={{
                    background: t.bg,
                    boxShadow: `inset 0 0 0 3px ${t.accent}44, 0 0 0 1px ${t.accent}88`,
                  }}
                />
                <span className="flex-1 flex flex-col items-start gap-0.5">
                  <span>{t.label}</span>
                  <span className="text-[10px] opacity-60">{t.blurb}</span>
                </span>
                {active && <Check className="w-3 h-3 shrink-0" style={{ color: 'var(--accent)' }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
