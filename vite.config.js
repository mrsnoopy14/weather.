import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command }) => ({
  plugins: [react()],
  // Use relative asset paths for production builds (works on GitHub Pages sub-paths)
  base: command === 'build' ? './' : '/',
  server: {
    port: 5173,
    open: true,
  },
}))
