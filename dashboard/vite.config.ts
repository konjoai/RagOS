import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    dedupe: ['react', 'react-dom', 'motion', 'motion/react'],
  },
  server: {
    port: 5178,
    proxy: {
      // Real kyro FastAPI server (default :8000). The Vite proxy bypasses the
      // kyro server's missing CORS middleware for local development.
      '/query':       { target: 'http://localhost:8000', changeOrigin: true },
      '/agent':       { target: 'http://localhost:8000', changeOrigin: true },
      '/audit':       { target: 'http://localhost:8000', changeOrigin: true },
      '/eval':        { target: 'http://localhost:8000', changeOrigin: true },
      '/health':      { target: 'http://localhost:8000', changeOrigin: true },
      '/vectro':      { target: 'http://localhost:8000', changeOrigin: true },
      '/metrics':     { target: 'http://localhost:8000', changeOrigin: true },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: true,
  },
})
