
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
// API keys stay in the server environment. Do not inline them into the client bundle.
export default defineConfig(() => {
  return {
    plugins: [react()],
    base: '/', // Changed from './' to '/' for standard production routing
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
