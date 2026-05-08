import { useEffect, useRef, useState, type ReactNode } from 'react';

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
  /**
   * ARIA label for screen readers while loading. Default 'Loading'.
   * Accepts EITHER `aria-label` (preferred, matches HTML convention) OR `label`.
   * Resolution order: aria-label > label > 'Loading'.
   */
  'aria-label'?: string;
  label?: string;
  /** Delay (ms) before shimmer appears — prevents flicker on fast loads. Default 300. */
  delayMs?: number;
  /** Timeout (ms) before showing retry/still-loading UI. Default 15000. */
  timeoutMs?: number;
  /** Called when timeoutMs elapses; if absent, "Still loading…" text is shown. */
  onTimeout?: () => void;
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
  'aria-label': ariaLabelProp,
  label,
  delayMs = 300,
  timeoutMs = 15000,
  onTimeout,
}: SkeletonProps) {
  // Resolution order: aria-label > label > 'Loading'
  const resolvedLabel = ariaLabelProp ?? label ?? 'Loading';

  // A4: announce load-complete when loading flips false (polite, no focus steal)
  const liveRef = useRef<HTMLSpanElement | null>(null);
  const prevLoading = useRef(loading);
  useEffect(() => {
    if (prevLoading.current && !loading && liveRef.current) {
      liveRef.current.textContent = `${resolvedLabel} loaded`;
    }
    prevLoading.current = loading;
  }, [loading, resolvedLabel]);

  // A5: timeout boundary — clear timer if loading resolves before timeout
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    if (!loading) { setTimedOut(false); return; }
    const t = setTimeout(() => setTimedOut(true), timeoutMs);
    return () => clearTimeout(t);
  }, [loading, timeoutMs]);

  if (!loading) {
    if (error) return <>{error}</>;
    if (isEmpty && empty !== undefined) return <>{empty}</>;
    return (
      <>
        {/* A4: polite live region persists briefly after content renders */}
        <span ref={liveRef} role="status" aria-live="polite" aria-atomic="true"
          style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)', clipPath: 'inset(50%)', whiteSpace: 'nowrap' }} />
        {children}
      </>
    );
  }

  const widthFor = (i: number) =>
    typeof rowWidth === 'function' ? rowWidth(i) : rowWidth;

  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      aria-label={resolvedLabel}
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: rowGap,
      }}
    >
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
      {timedOut && (
        onTimeout
          ? <button type="button" onClick={onTimeout} style={{ marginTop: '0.5rem', fontSize: '0.75rem' }}>Retry</button>
          : <span style={{ marginTop: '0.5rem', fontSize: '0.75rem', opacity: 0.7 }}>Still loading…</span>
      )}
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
  /**
   * ARIA label. Accepts either `aria-label` (preferred) OR `label`.
   * Resolution order: aria-label > label > 'Loading'.
   */
  'aria-label'?: string;
  label?: string;
  /** Delay (ms) before shimmer appears. Default 300. */
  delayMs?: number;
  /** Timeout (ms) before showing retry/still-loading UI. Default 15000. */
  timeoutMs?: number;
  /** Called when timeoutMs elapses; if absent, "Still loading…" text is shown. */
  onTimeout?: () => void;
}

export function SkeletonGroup({
  loading,
  children,
  count = 4,
  blockHeight = '3rem',
  gridTemplate = 'repeat(auto-fit, minmax(140px, 1fr))',
  gap = '0.5rem',
  className,
  'aria-label': ariaLabelProp,
  label,
  delayMs = 300,
  timeoutMs = 15000,
  onTimeout,
}: SkeletonGroupProps) {
  // Resolution order: aria-label > label > 'Loading'
  const resolvedLabel = ariaLabelProp ?? label ?? 'Loading';

  // A4: announce load-complete when loading flips false
  const liveRef = useRef<HTMLSpanElement | null>(null);
  const prevLoading = useRef(loading);
  useEffect(() => {
    if (prevLoading.current && !loading && liveRef.current) {
      liveRef.current.textContent = `${resolvedLabel} loaded`;
    }
    prevLoading.current = loading;
  }, [loading, resolvedLabel]);

  // A5: timeout boundary
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    if (!loading) { setTimedOut(false); return; }
    const t = setTimeout(() => setTimedOut(true), timeoutMs);
    return () => clearTimeout(t);
  }, [loading, timeoutMs]);

  if (!loading) return (
    <>
      <span ref={liveRef} role="status" aria-live="polite" aria-atomic="true"
        style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)', clipPath: 'inset(50%)', whiteSpace: 'nowrap' }} />
      {children}
    </>
  );

  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      aria-label={resolvedLabel}
      className={className}
      style={{ display: 'grid', gridTemplateColumns: gridTemplate, gap }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="skeleton"
          style={{ height: blockHeight, animationDelay: `${delayMs + i * 80}ms` }}
          aria-hidden="true"
        />
      ))}
      {timedOut && (
        onTimeout
          ? <button type="button" onClick={onTimeout} style={{ marginTop: '0.5rem', fontSize: '0.75rem', gridColumn: '1/-1' }}>Retry</button>
          : <span style={{ marginTop: '0.5rem', fontSize: '0.75rem', opacity: 0.7, gridColumn: '1/-1' }}>Still loading…</span>
      )}
    </div>
  );
}
