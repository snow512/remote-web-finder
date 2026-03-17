import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { TreeItem } from '../../shared/types';
import { logger } from '../utils/logger';

export function createTreeRouter(resolvedDir: string, isIgnored: (name: string) => boolean) {
  const router = Router();

  function buildTree(dirPath: string, relBase: string, showIgnored: boolean): TreeItem[] {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true })
      .filter(e => showIgnored || !isIgnored(e.name))
      .sort((a, b) => {
        if (a.isDirectory() && !b.isDirectory()) return -1;
        if (!a.isDirectory() && b.isDirectory()) return 1;
        return a.name.localeCompare(b.name);
      });

    return entries.map(entry => {
      const rel = path.join(relBase, entry.name);
      const ignored = isIgnored(entry.name);
      if (entry.isDirectory()) {
        let children: TreeItem[] = [];
        try {
          children = buildTree(path.join(dirPath, entry.name), rel, showIgnored);
        } catch { /* skip inaccessible dirs */ }
        return { name: entry.name, path: rel, type: 'dir' as const, ignored, children };
      }
      return { name: entry.name, path: rel, type: 'file' as const, ignored };
    });
  }

  router.get('/api/tree', (req: Request, res: Response) => {
    try {
      const showIgnored = req.query.showIgnored === 'true';
      res.json(buildTree(resolvedDir, '', showIgnored));
    } catch (err: any) {
      logger.error('GET /api/tree error', { error: err.message });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}
