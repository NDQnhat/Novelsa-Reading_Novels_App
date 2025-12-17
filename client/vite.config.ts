import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],
  server: {
    middlewareMode: false,
  },
  build: {
    // Ensure service worker is copied to dist
    rollupOptions: {
      input: {
        main: './index.html',
      },
    },
  },
})
