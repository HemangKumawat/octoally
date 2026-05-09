import { z } from 'zod';
import { router, publicProcedure } from '../index.js';
import { getReport, getStatus, getProjects } from '../../services/codeburn.js';

const reportInput = z.object({
  period: z.enum(['today', 'week', '30days', 'month', 'all']).optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  provider: z.enum(['claude', 'gemini', 'cursor', 'copilot', 'all']).optional(),
  project: z.array(z.string()).optional(),
  exclude: z.array(z.string()).optional(),
}).optional();

const statusInput = z.object({
  period: z.enum(['today', 'week', '30days', 'month', 'all']).optional(),
}).optional();

export const codeburnRouter = router({
  report: publicProcedure.input(reportInput).query(({ input }) => getReport(input ?? {})),
  status: publicProcedure.input(statusInput).query(({ input }) => getStatus(input ?? {})),
  menubar: publicProcedure.input(statusInput).query(({ input }) => getStatus({ ...(input ?? {}), menubarFormat: true })),
  projects: publicProcedure.query(() => getProjects()),
});
