import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    base: './',
    server: {
      port: 5173,
      open: true,
      // In dev, /api calls are forwarded to the backend (set VITE_PROXY_TARGET in .env.local).
      proxy: { '/api': { target: env.VITE_PROXY_TARGET || 'http://localhost:3000', changeOrigin: true } }
    },
    build: { outDir: 'dist', assetsInlineLimit: 0 }
  };
});
