import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'pwa-192.png', 'pwa-512.png', 'pwa-maskable-512.png'],
      manifest: {
        name: 'MelodyMatch',
        short_name: 'MelodyMatch',
        description: 'Local multiplayer music quiz — guess the song!',
        theme_color: '#ae35ff',
        background_color: '#0f0f1a',
        display: 'standalone',
        orientation: 'portrait',
        scope: '.',
        start_url: '.',
        icons: [
          {
            src: 'pwa-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Precache all app-shell assets (JS, CSS, HTML)
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            // Cache Deezer album artwork for 7 days
            urlPattern: /^https:\/\/e-cdns-images\.dzcdn\.net\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'deezer-artwork',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7,
              },
            },
          },
        ],
        // Never cache Deezer API calls, audio previews, or external data APIs
        navigateFallback: null,
      },
    }),
  ],
  base: './',
  server: {
    proxy: {
      '/api-itunes': {
        target: 'https://itunes.apple.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-itunes/, ''),
      }
    }
  }
});
