import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['icon.svg'],
            manifest: {
                name: 'Games & Tools - Interactive Web Exercises',
                short_name: 'Games & Tools',
                description: 'A collection of interactive projects and games',
                theme_color: '#1a1a1a',
                background_color: '#242424',
                display: 'standalone',
                start_url: '/',
                icons: [
                    {
                        src: '/icon.svg',
                        sizes: 'any',
                        type: 'image/svg+xml',
                        purpose: 'any maskable',
                    },
                ],
            },
            workbox: {
                globPatterns: ['**/*.{js,css,html,svg,png,ico,txt,woff,woff2}'],
                runtimeCaching: [
                    {
                        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'google-fonts-cache',
                            expiration: {
                                maxEntries: 10,
                                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                            },
                            cacheableResponse: {
                                statuses: [0, 200],
                            },
                        },
                    },
                ],
            },
            devOptions: {
                enabled: true,
            },
        }),
    ],
    server: {
        proxy: {
            '/api/sudoku': {
                target: 'https://www.youdosudoku.com',
                changeOrigin: true,
                rewrite: () => '/api/',
                secure: false,
                followRedirects: true,
            },
        },
    },
    build: {
        // Minification using esbuild (fast and built-in)
        minify: 'esbuild',
        // Split code into smaller chunks for better caching
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom', 'react-router-dom'],
                },
            },
        },
        // Generate source maps for debugging (set to false for production)
        sourcemap: false,
    },
    esbuild: {
        // Remove console logs and debuggers in production
        drop: ['console', 'debugger'],
    },
});
