
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables from the current directory
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    base: '/',
    // Define environment variables so they are available in the browser via process.env
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY || env.VITE_GOOGLE_API_KEY || env.GOOGLE_API_KEY || process.env.API_KEY),
      'process.env.PRINTFUL_API_KEY': JSON.stringify(env.PRINTFUL_API_KEY || 'KwSxNJ1mHlNYUJZ57eqOIAXQXQ9250Q19a2CHEas')
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom']
          }
        }
      }
    },
    server: {
      port: 3000,
      open: true
    }
  };
});
