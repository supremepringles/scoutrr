import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: Number(process.env.FRONTEND_PORT || 3010),
    strictPort: true,
    host: '0.0.0.0',
  },
  preview: {
    port: Number(process.env.FRONTEND_PORT || 3010),
    host: '0.0.0.0',
  },
});
