import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '127.0.0.1',      // Use localhost explicitly instead of 'true'
    strictPort: false,      // Allow fallback to other ports if 5173 is busy
    hmr: false,             // Completely disable HMR
    watch: {
      usePolling: false,    // Disable polling which can cause refreshes
    },
    open: false,            // Don't open browser automatically
    cors: true              // Enable CORS
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  }
})
