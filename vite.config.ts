import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Offline support (spec: works fully without network except live AI).
    // Workbox precaches the built app shell so the app launches and runs
    // offline; layouts/tiles live in IndexedDB and TTS is on-device, so the
    // whole experience works air-gapped. AI generation needs network by nature
    // and is left uncached (no runtime caching of api.anthropic.com).
    VitePWA({
      registerType: 'autoUpdate',
      // Auto-inject the SW registration into the bundle — no code in main.tsx.
      injectRegister: 'auto',
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Modular AAC',
        short_name: 'AAC',
        description: 'Free, web-based AAC communication board with AI word suggestions.',
        theme_color: '#1f6f6b',
        background_color: '#1f6f6b',
        display: 'standalone',
        orientation: 'any',
        start_url: '/',
        icons: [
          // SVG for crisp scaling where supported; PNGs for Android/Chrome install.
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Cache the app shell; SVG/woff included for offline symbols/fonts.
        globPatterns: ['**/*.{js,css,html,svg,woff,woff2}'],
        // Runtime caching for ARASAAC pictograms (cross-origin, fetched on demand
        // so they can't be precached). Each symbol downloads once while online,
        // then works offline — essential for a communication device.
        runtimeCaching: [
          {
            // The pictogram images themselves (the important one for offline).
            urlPattern: /^https:\/\/static\.arasaac\.org\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'arasaac-pictograms',
              expiration: {
                maxEntries: 1000,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                purgeOnQuotaError: true,
              },
              // status 0 = opaque cross-origin <img> response; still cacheable.
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Keyword → id lookups; serve cached results when offline.
            urlPattern: /^https:\/\/api\.arasaac\.org\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'arasaac-api',
              expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 30 }, // 30 days
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      // Let the offline app also work while developing.
      devOptions: { enabled: false },
    }),
  ],
  server: {
    // Honor a port assigned by the environment (e.g. the preview harness) so it
    // doesn't collide with another dev server; fall back to Vite's default.
    port: process.env.PORT ? Number(process.env.PORT) : 5173,
  },
});
