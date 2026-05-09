import { useMutation, useQueryClient } from '@tanstack/react-query';
import { trpc } from './trpc';

export interface UseReportArgs {
  period?: 'today' | 'week' | '30days' | 'month' | 'all';
  project?: string[];
}

export function useCodeburnReport(args: UseReportArgs = {}) {
  // First run on an uncached project filter can take 30s+ as codeburn reads
  // session history; the frontend matches that with a 90s abort.
  return trpc.codeburn.report.useQuery(args, {
    refetchInterval: 5 * 60_000,         // 5 min
    staleTime: 2 * 60_000,
    refetchOnWindowFocus: false,
    refetchIntervalInBackground: false,  // pause when tab hidden
    // tRPC v10/v11 forwards `signal` from `meta` to the underlying fetch.
    meta: { signal: AbortSignal.timeout(90_000) },
  });
}

export function useCodeburnStatus() {
  // Status is faster (<5s) but match the backend grace window: 30s + 5s
  return trpc.codeburn.status.useQuery({ period: 'today' }, {
    refetchInterval: 60_000,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    refetchIntervalInBackground: false,
    meta: { signal: AbortSignal.timeout(35_000) },
  });
}

export function useCodeburnMenubar() {
  return trpc.codeburn.menubar.useQuery({ period: 'today' }, {
    refetchInterval: 60_000,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    refetchIntervalInBackground: false,
  });
}

export function useCodeburnProjects() {
  return trpc.codeburn.projects.useQuery(undefined, {
    refetchInterval: 5 * 60_000,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    refetchIntervalInBackground: false,
  });
}

export function useCodeburnRefresh() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/codeburn/refresh', { method: 'POST' });
      if (!res.ok) throw new Error(`refresh failed: ${res.status}`);
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [['codeburn']] }),
  });
}
