import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // This replaces process.env.API_KEY in the code with the actual value during the build.
    // Ensure you add API_KEY to your Vercel Environment Variables.
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY),
  },
});