import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000
    // Proxy removed for production deployment. Use VITE_API_URL in your API calls.
  }
})
