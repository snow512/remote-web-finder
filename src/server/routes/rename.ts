import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';

export function createRenameRouter(safePath: (relPath: string) => string | null) {
  const router = Router();

  router.patch('/api/rename', (req: Request, res: Response) => {
    const oldPath = safePath(req.query.path as string || '');
    const newPath = safePath(req.query.newPath as string || '');
    if (!oldPath || !newPath) return res.status(400).json({ error: 'Invalid path' });
    if (!fs.existsSync(oldPath)) return res.status(404).json({ error: 'Source not found' });
    if (fs.existsSync(newPath)) return res.status(409).json({ error: 'Destination already exists' });
    try {
      const dir = path.dirname(newPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.renameSync(oldPath, newPath);
      res.json({ ok: true });
    } catch (err: any) {
      logger.error('PATCH /api/rename error', { error: err.message, path: req.query.path, newPath: req.query.newPath });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}
