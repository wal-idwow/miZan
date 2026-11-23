import { readFileSync } from 'node:fs';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig, type Plugin } from 'vite';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as {
  version: string;
};

function preloadPrimaryArabicFont(): Plugin {
  return {
    name: 'mizan-preload-arabic-font',
    transformIndexHtml: {
      order: 'post',
      handler(_html, ctx) {
        if (!ctx.bundle) return [];
        const fontAsset = Object.keys(ctx.bundle).find(
          key => key.includes('ibm-plex-sans-arabic-arabic-400-normal') && key.endsWith('.woff2')
        );
        if (!fontAsset) return [];
        return [
          {
            tag: 'link',
            attrs: {
              rel: 'preload',
              as: 'font',
              type: 'font/woff2',
              href: `/${fontAsset}`,
              crossorigin: 'anonymous',
            },
            injectTo: 'head',
          },
        ];
      },
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    preloadPrimaryArabicFont(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['favicon.svg', 'favicon.ico', 'apple-touch-icon-180x180.png', 'og-image.png'],
      manifest: {
        id: '/',
        name: 'ميزان — miZan',
        short_name: 'ميزان',
        description:
          'تحكّم ففلوسك وشوف لقدّام: أهداف، ديون وتوقعات 12 شهر. بياناتك كتبقى فتيليفونك فقط.',
        lang: 'ar-MA',
        dir: 'rtl',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        display_override: ['standalone', 'minimal-ui'],
        orientation: 'portrait',
        theme_color: '#0F766E',
        background_color: '#F4F6F8',
        categories: ['finance', 'productivity'],
        icons: [
          { src: '/pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          {
            src: '/maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        shortcuts: [
          {
            name: 'تحديث سريع',
            url: '/#/checkin',
            icons: [{ src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' }],
          },
          {
            name: 'الأهداف',
            url: '/#/goals',
          },
        ],
        screenshots: [
          {
            src: '/screenshots/mobile-overview.png',
            sizes: '1080x2340',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'نظرة عامة',
          },
          {
            src: '/screenshots/desktop-overview.png',
            sizes: '1920x1080',
            type: 'image/png',
            form_factor: 'wide',
            label: 'نظرة عامة',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2,webmanifest}'],
        globIgnores: ['screenshots/**', 'og-image.png'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/sw\.js$/, /^\/workbox-/],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: false,
        maximumFileSizeToCacheInBytes: 3_000_000,
      },
      devOptions: { enabled: false },
    }),
  ],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  server: {
    watch: {
      usePolling: true,
    },
  },
});
