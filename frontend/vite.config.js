import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['tronweb'],
    include: [
      'wagmi',
      'wagmi/chains', 
      'wagmi/connectors',
      'viem',
      '@tanstack/react-query',
      'framer-motion',
      'lucide-react',
      'react',
      'react-dom',
      'react-dom/client',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
      'react-router-dom',
    ],
  },
  server: {
    port: 5173,
    warmup: {
      clientFiles: ['./src/main.jsx', './src/App.jsx', './src/components/*.jsx'],
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          wagmi: ['wagmi', 'viem'],
          motion: ['framer-motion'],
        },
      },
    },
  },
})