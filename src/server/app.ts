import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { createIgnoreChecker } from './utils/ignore';
import { createSafePathChecker } from './utils/safePath';
import { logger } from './utils/logger';
import { createTreeRouter } from './routes/tree';
import { createFileRouter } from './routes/file';
import { createFolderRouter } from './routes/folder';
import { createRenameRouter } from './routes/rename';
import versionRouter from './routes/version';

export function createApp(docsDir: string, ignorePatterns: string[]) {
  const resolvedDir = path.resolve(docsDir);
  const isIgnored = createIgnoreChecker(ignorePatterns);
  const safePath = createSafePathChecker(resolvedDir);

  const app = express();
  app.use(express.text({ type: '*/*', limit: '5mb' }));

  // Request logging middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on('finish', () => {
      logger.request(req.method, req.path, res.statusCode, Date.now() - start);
    });
    next();
  });

  app.use(express.static(path.join(__dirname, '..', 'public')));

  app.use(versionRouter);
  app.use(createTreeRouter(resolvedDir, isIgnored));
  app.use(createFileRouter(safePath));
  app.use(createFolderRouter(safePath));
  app.use(createRenameRouter(safePath));

  // Global error handler
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    logger.error('Unhandled error', { error: err.message, stack: err.stack });
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return app;
}
