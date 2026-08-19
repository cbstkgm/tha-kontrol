import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/tha-makam/',
  server: {
    proxy: {
      '/tkgm-wms': {
        target: 'https://cbsservis.tkgm.gov.tr',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/tkgm-wms/, '/tkgm.ows/wms'),
        auth: 'tk41671:Jackass+0078',
        secure: false,
      }
    }
  }
})
