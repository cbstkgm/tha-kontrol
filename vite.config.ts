import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/tkgm-wms': {
        target: 'https://cbsservis.tkgm.gov.tr',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/tkgm-wms/, '/tkgm.ows/wms'),
        auth: 'genelsunum:CbsSube+13579',
        secure: false,
      }
    }
  }
})
