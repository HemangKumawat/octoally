import type { FastifyPluginAsync } from 'fastify';
import {
  getReport, getStatus, getProjects, bustCache, warmCache,
  type ReportArgs,
} from '../services/codeburn.js';

export const codeburnRoutes: FastifyPluginAsync = async (fastify) => {
  warmCache();  // fire-and-forget

  fastify.get('/codeburn/report', async (req, reply) => {
    const q = req.query as Record<string, string | string[] | undefined>;
    const args: ReportArgs = {
      period: q.period as ReportArgs['period'],
      from: q.from as string | undefined,
      to: q.to as string | undefined,
      provider: q.provider as ReportArgs['provider'],
      project: typeof q.project === 'string' ? [q.project] : (q.project as string[] | undefined),
      exclude: typeof q.exclude === 'string' ? [q.exclude] : (q.exclude as string[] | undefined),
    };
    return getReport(args);
  });

  fastify.get('/codeburn/status', async (req) => {
    const q = req.query as Record<string, string | undefined>;
    return getStatus({ period: q.period as ReportArgs['period'] });
  });

  fastify.get('/codeburn/menubar', async (req) => {
    const q = req.query as Record<string, string | undefined>;
    return getStatus({ period: q.period as ReportArgs['period'], menubarFormat: true });
  });

  fastify.get('/codeburn/projects', async () => getProjects());

  fastify.post('/codeburn/refresh', async (_req, reply) => {
    const removed = await bustCache();
    reply.code(200);
    return { ok: true, removed };
  });
};
