import { Router, Request, Response } from 'express';
import fs from 'fs';
import { logger } from '../utils/logger';

export function createFolderRouter(safePath: (relPath: string) => string | null) {
  const router = Router();

  router.post('/api/folder', (req: Request, res: Response) => {
    const folderPath = safePath(req.query.path as string || '');
    if (!folderPath) return res.status(400).json({ error: 'Invalid path' });
    if (fs.existsSync(folderPath)) return res.status(409).json({ error: 'Already exists' });
    try {
      fs.mkdirSync(folderPath, { recursive: true });
      res.json({ ok: true });
    } catch (err: any) {
      logger.error('POST /api/folder error', { error: err.message, path: req.query.path });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.delete('/api/folder', (req: Request, res: Response) => {
    const folderPath = safePath(req.query.path as string || '');
    if (!folderPath) return res.status(400).json({ error: 'Invalid path' });
    if (!fs.existsSync(folderPath)) return res.status(404).json({ error: 'Not found' });
    try {
      const stat = fs.statSync(folderPath);
      if (!stat.isDirectory()) return res.status(400).json({ error: 'Not a directory' });
      const entries = fs.readdirSync(folderPath);
      if (entries.length > 0) return res.status(400).json({ error: 'Folder is not empty' });
      fs.rmSync(folderPath, { recursive: true });
      res.json({ ok: true });
    } catch (err: any) {
      logger.error('DELETE /api/folder error', { error: err.message, path: req.query.path });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}
