import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // El backend tiene el CORS habilitado para este puerto exacto
    // (ver WebConfig.java), asi que no lo cambiamos.
    port: 5173,
  },
})
