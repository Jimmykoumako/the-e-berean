import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "node:path";

// https://vite.dev/config/
export default defineConfig({
    base: '/', // Replace with your GitHub repository name
    build: {
      outDir: 'dist',
    },
  plugins: [react(),],
  // define: {
  //   'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL),
  //   'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY)
  // },
  resolve: {
      alias: {
          "@": path.resolve(__dirname, "./src"),
      },
  },
})
