import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  optimizeDeps: {
    include: ['opencascade.js']
  },
  // Ensure Vite treats WASM and worker helper scripts from deps as assets
  assetsInclude: ['**/*.wasm', '**/*.worker.js'],
  build: {
    outDir: 'dist',
    sourcemap: true,
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          three: ['three'],
          r3f: ['@react-three/fiber', '@react-three/csg'],
          pdf: ['jspdf', 'html2canvas'],
          dxf: ['dxf-writer']
        }
      }
    }
  },
  worker: {
    format: 'es', // Use ES modules for workers
    rollupOptions: {
      output: {
        format: 'es',
        entryFileNames: 'assets/[name]-[hash].js'
      }
    }
  },
  server: {
    port: 3000,
    host: true
  }
})