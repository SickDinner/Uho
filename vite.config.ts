import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // Relative asset URLs keep the build working both at /Uho/ on GitHub Pages
  // and under a future custom domain without another rebuild.
  base: './',
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@core': resolve(__dirname, './core'),
      '@data': resolve(__dirname, './data'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    target: 'es2022',
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
});