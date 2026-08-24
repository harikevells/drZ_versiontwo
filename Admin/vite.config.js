import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ["mangy-unjustly-subtitle.ngrok-free.dev"]
  },
  base: './',
  build: {
    outDir: 'build'
  }
})
