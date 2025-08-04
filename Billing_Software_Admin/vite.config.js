import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      '/api': 'http://localhost:5000', // Forward /api to backend server
    },
  },
  base: './',
  build: {
    outDir: 'dist',
  },
});
