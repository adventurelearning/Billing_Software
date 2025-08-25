import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
  },
  base: './', // Keep this!
  build: {
    minify: 'terser',  // smaller than esbuild for production
    terserOptions: {
      compress: {
        drop_console: true,   // remove console.log in prod
        drop_debugger: true
      }
    }
  }
});
