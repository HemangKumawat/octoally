import type { ReactNode } from 'react';

export interface SkeletonProps {
  /** Show shimmer when true. */
  loading: boolean;
  /** Children render when loading=false. Required. */
  children?: ReactNode;
  /** Optional empty-data slot. If provided and !loading and isEmpty, renders this instead of children. */
  empty?: ReactNode;
  /** Optional error slot. If provided and !loading and error, renders this instead of children. */
  error?: ReactNode | null;
  /** True when data exists but is empty (e.g. array.length === 0). Caller decides emptiness. */
  isEmpty?: boolean;
  /** Number of skeleton rows to render. Default 3. */
  rows?: number;
  /** Per-row height in CSS units. Default '1rem'. */
  rowHeight?: string;
  /** Per-row width — string or function(index)=>string. Default 100%. */
  rowWidth?: string | ((i: number) => string);
  /** Gap between rows. Default '0.4rem'. */
  rowGap?: string;
  /** Free-form className for the OUTER wrapper (not the rows). */
  className?: string;
  /** ARIA label announced to screen readers while loading. Default 'Loading'. */
  label?: string;
  /** Delay (ms) before shimmer appears — prevents flicker on fast loads. Default 100. */
  delayMs?: number;
}

/**
 * Skeleton — accessible shimmer loading state.
 *
 * Compose with TanStack React Query: pass `loading={query.isPending}`.
 * Use `isPending` (not `isLoading`) so background refetches don't shimmer.
 *
 * Accessibility (VETO baseline — non-negotiable):
 *  - role="status" on the loading wrapper
 *  - aria-busy="true" while loading
 *  - aria-live="polite" announces label once
 *  - Respects prefers-reduced-motion via the .skeleton CSS rule
 *
 * States handled:
 *  - loading=true                 -> shimmer rows
 *  - loading=false + error        -> error slot (if provided) or children
 *  - loading=false + isEmpty      -> empty slot (if provided) or children
 *  - loading=false                -> children
 *  - fast load (<delayMs)         -> no shimmer, no flicker (opacity:0 until animation-delay)
 *  - slow load (>5s)              -> shimmer continues; no UI lock (purely visual)
 */
export function Skeleton({
  loading,
  children,
  empty,
  error,
  isEmpty,
  rows = 3,
  rowHeight = '1rem',
  rowWidth = '100%',
  rowGap = '0.4rem',
  className,
  label = 'Loading',
  delayMs = 100,
}: SkeletonProps) {
  if (!loading) {
    if (error) return <>{error}</>;
    if (isEmpty && empty !== undefined) return <>{empty}</>;
    return <>{children}</>;
  }

  const widthFor = (i: number) =>
    typeof rowWidth === 'function' ? rowWidth(i) : rowWidth;

  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      aria-label={label}
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: rowGap,
      }}
    >
      <span style={{ position: 'absolute', left: -9999, width: 1, height: 1 }}>
        {label}…
      </span>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="skeleton"
          style={{
            height: rowHeight,
            width: widthFor(i),
            // Per-row stagger + delay so fast loads (<delayMs) never see the row
            animationDelay: `${delayMs + i * 80}ms`,
          }}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

/**
 * SkeletonGroup — for grid layouts (e.g. stat tiles, hardware grid).
 * Renders `count` skeleton blocks in the supplied gridTemplate.
 */
export interface SkeletonGroupProps {
  loading: boolean;
  children?: ReactNode;
  count?: number;
  blockHeight?: string;
  gridTemplate?: string;
  gap?: string;
  className?: string;
  label?: string;
}

export function SkeletonGroup({
  loading,
  children,
  count = 4,
  blockHeight = '3rem',
  gridTemplate = 'repeat(auto-fit, minmax(140px, 1fr))',
  gap = '0.5rem',
  className,
  label = 'Loading',
}: SkeletonGroupProps) {
  if (!loading) return <>{children}</>;
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      aria-label={label}
      className={className}
      style={{ display: 'grid', gridTemplateColumns: gridTemplate, gap }}
    >
      <span style={{ position: 'absolute', left: -9999, width: 1, height: 1 }}>{label}…</span>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="skeleton"
          style={{ height: blockHeight, animationDelay: `${100 + i * 80}ms` }}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}
