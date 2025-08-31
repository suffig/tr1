import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/tr1/', // <-- Für GitHub Pages im Unterverzeichnis!
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'FIFA Statistik-Tracker',
        short_name: 'FIFA Tracker',
        description: 'Verfolge FIFA-Spiele, Spieler, Sperren und Finanzen',
        theme_color: '#475569',
        background_color: '#475569',
        display: 'standalone',
        orientation: 'portrait-primary',
        lang: 'de',
        categories: ['sports', 'games'],
        icons: [
          {
            src: 'assets/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'assets/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  server: {
    port: 3000,
    host: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
})