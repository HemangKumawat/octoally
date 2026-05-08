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
   * R2-N1 fix (2026-05-08): empty-string aria-label="" no longer beats label —
   * uses truthy fallback (||) instead of nullish (??).
   */
  'aria-label'?: string;
  label?: string;
  /** Delay (ms) before shimmer appears — prevents flicker on fast loads. Default 300. */
  delayMs?: number;
  /** Timeout (ms) before showing retry/reload UI. Default 15000. */
  timeoutMs?: number;
  /**
   * Called when timeoutMs elapses; if absent, the wrapper renders a Reload button
   * that calls window.location.reload() so the user always has a recovery path.
   */
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
 *  - On timeout, role="alert" (implicit aria-live=assertive) draws operator attention
 *
 * States handled:
 *  - loading=true                 -> shimmer rows
 *  - loading=true + timedOut      -> Retry (if onTimeout) or Reload button — both inside role=alert
 *  - loading=false + error        -> error slot (if provided) or children
 *  - loading=false + isEmpty      -> empty slot (if provided) or children
 *  - loading=false                -> children
 *  - fast load (<delayMs)         -> no shimmer, no flicker (opacity:0 until animation-delay)
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
  // Resolution order: aria-label > label > 'Loading'.
  // R2-N1 fix: truthy fallback (||) so empty string doesn't win over label.
  const resolvedLabel = ariaLabelProp || label || 'Loading';

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

  // R3 fix: default to page reload when no onTimeout supplied — always give user a recovery action.
  const handleTimeout = onTimeout ?? (() => window.location.reload());
  const ctaLabel = onTimeout ? 'Retry' : 'Reload';

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
        // R4 fix: role=alert (implicit aria-live=assertive) — state change needing operator attention.
        <div role="alert" style={{ marginTop: '0.5rem' }}>
          <button type="button" onClick={handleTimeout} style={{ fontSize: '0.75rem' }}>{ctaLabel}</button>
        </div>
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
   * R2-N1 fix: truthy fallback so empty string doesn't beat label.
   */
  'aria-label'?: string;
  label?: string;
  /** Delay (ms) before shimmer appears. Default 300. */
  delayMs?: number;
  /** Timeout (ms) before showing retry/reload UI. Default 15000. */
  timeoutMs?: number;
  /** Called when timeoutMs elapses; if absent, defaults to window.location.reload(). */
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
  // R2-N1 fix: truthy fallback.
  const resolvedLabel = ariaLabelProp || label || 'Loading';

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

  // R3 fix: default to page reload when no onTimeout supplied.
  const handleTimeout = onTimeout ?? (() => window.location.reload());
  const ctaLabel = onTimeout ? 'Retry' : 'Reload';

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
        // R4 fix: role=alert; R3 fix: default Reload action.
        <div role="alert" style={{ marginTop: '0.5rem', gridColumn: '1/-1' }}>
          <button type="button" onClick={handleTimeout} style={{ fontSize: '0.75rem' }}>{ctaLabel}</button>
        </div>
      )}
    </div>
  );
}
