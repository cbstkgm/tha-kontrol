import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'dev-html-fallback',
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          if (req.url === '/' || req.url === '/tha-makam/' || req.url === '/tha-makam/index.html') {
            req.url = '/index.dev.html';
          }
          next();
        });
      }
    }
  ],
  base: '/tha-makam/',
})
