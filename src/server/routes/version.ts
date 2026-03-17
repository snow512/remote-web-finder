import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';

const router = Router();

function loadPackageJson() {
  const pkgPath = path.join(__dirname, '..', '..', '..', 'package.json');
  return JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
}

router.get('/api/version', (_req, res) => {
  try {
    const pkg = loadPackageJson();
    res.json({ version: pkg.version, name: pkg.name });
  } catch (err: any) {
    logger.error('GET /api/version error', { error: err.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
