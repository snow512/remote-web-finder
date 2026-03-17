import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: 'src/client',
  build: {
    outDir: '../../dist/public',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, 'src/shared'),
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:5999',
    },
  },
});
