import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
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
