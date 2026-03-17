import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';

export function createFileRouter(safePath: (relPath: string) => string | null) {
  const router = Router();

  router.head('/api/file', (req: Request, res: Response) => {
    const filePath = safePath(req.query.path as string || '');
    if (!filePath) return res.status(400).end();
    try {
      const stat = fs.statSync(filePath);
      if (!stat.isFile()) return res.status(404).end();
      res.set('Content-Length', String(stat.size)).type('text/plain').end();
    } catch {
      res.status(404).end();
    }
  });

  router.get('/api/file', (req: Request, res: Response) => {
    const filePath = safePath(req.query.path as string || '');
    if (!filePath) return res.status(400).json({ error: 'Invalid path' });
    try {
      const stat = fs.statSync(filePath);
      if (!stat.isFile()) return res.status(400).json({ error: 'Not a file' });
      res.type('text/plain').send(fs.readFileSync(filePath, 'utf-8'));
    } catch (err: any) {
      if (err.code === 'ENOENT') return res.status(404).json({ error: 'Not found' });
      logger.error('GET /api/file error', { error: err.message, path: req.query.path });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.get('/api/raw', (req: Request, res: Response) => {
    const filePath = safePath(req.query.path as string || '');
    if (!filePath) return res.status(400).json({ error: 'Invalid path' });
    try {
      if (!fs.statSync(filePath).isFile()) return res.status(400).json({ error: 'Not a file' });
    } catch {
      return res.status(404).json({ error: 'Not found' });
    }
    res.sendFile(filePath, (err) => {
      if (err && !res.headersSent) {
        logger.error('GET /api/raw error', { error: err.message, path: req.query.path });
        res.status(500).json({ error: 'Internal server error' });
      }
    });
  });

  router.put('/api/file', (req: Request, res: Response) => {
    const filePath = safePath(req.query.path as string || '');
    if (!filePath) return res.status(400).json({ error: 'Invalid path' });
    try {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(filePath, req.body ?? '', 'utf-8');
      res.json({ ok: true });
    } catch (err: any) {
      logger.error('PUT /api/file error', { error: err.message, path: req.query.path });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.post('/api/file', (req: Request, res: Response) => {
    const filePath = safePath(req.query.path as string || '');
    if (!filePath) return res.status(400).json({ error: 'Invalid path' });
    try {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(filePath, req.body ?? '', { encoding: 'utf-8', flag: 'wx' });
      res.json({ ok: true });
    } catch (err: any) {
      if (err.code === 'EEXIST') return res.status(409).json({ error: 'File already exists' });
      logger.error('POST /api/file error', { error: err.message, path: req.query.path });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.delete('/api/file', (req: Request, res: Response) => {
    const filePath = safePath(req.query.path as string || '');
    if (!filePath) return res.status(400).json({ error: 'Invalid path' });
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Not found' });
    try {
      if (fs.statSync(filePath).isDirectory()) {
        return res.status(400).json({ error: 'Use DELETE /api/folder for directories' });
      }
      fs.unlinkSync(filePath);
      res.json({ ok: true });
    } catch (err: any) {
      logger.error('DELETE /api/file error', { error: err.message, path: req.query.path });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}
