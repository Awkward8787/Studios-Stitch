
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const apiKey = env.API_KEY || env.VITE_GOOGLE_API_KEY || env.GOOGLE_API_KEY || "";
  
  return {
    plugins: [react()],
    base: '/', // Changed from './' to '/' for standard production routing
    define: {
      'process.env.API_KEY': JSON.stringify(apiKey)
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
      open: true,
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:3001',
          changeOrigin: true,
          secure: false,
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.log('[PROXY_ERROR] Connection to backend failed:', err);
            });
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              console.log('[PROXY_OUT] Sending Request:', req.method, req.url);
            });
            proxy.on('proxyRes', (proxyRes, req, _res) => {
              console.log('[PROXY_IN] Received Response:', proxyRes.statusCode, req.url);
            });
          },
        }
      }
    }
  };
});
