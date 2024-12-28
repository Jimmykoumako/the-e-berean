import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
    base: 'https://github.com/jimmyAtHvss/the-e-berean.git', // Replace with your GitHub repository name
    build: {
      outDir: 'dist',
    },
  plugins: [react()],
})
