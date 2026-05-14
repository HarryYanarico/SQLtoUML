import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      external: ['web-worker'],
      output: {
        manualChunks: {
          reactflow: ['@xyflow/react'],
        }
      }
    }
  },
  optimizeDeps: {
    include: ['@xyflow/react', 'elkjs', 'react', 'react-dom']
  }
})