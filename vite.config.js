import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Relative asset paths so the build works on GitHub Pages project sites
  // (served from https://<user>.github.io/<repo>/) as well as at any root.
  base: './',
  plugins: [react()],
  server: {
    port: Number(process.env.PORT) || 5173,
    open: false,
  },
})
