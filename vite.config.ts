import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },

  preview: {
    allowedHosts: [
      "recycle-monitor-app.onrender.com",
      "localhost",
      "127.0.0.1",
      "*.onrender.com",
    ],
    port: 8080,
  },

  plugins: [
    react(),
    mode === "development" && componentTagger(),

    // ⭐ AUTOMATIC PWA GENERATOR ⭐
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "icon-192x192.png",
        "icon-512x512.png",
        "favicon.ico",
        "apple-touch-icon.png",
      ],
      manifest: {
        name: "EcoShift",
        short_name: "EcoShift",
        description: "Smart waste collection tracking and monitoring platform.",
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#4CAF50",
        orientation: "portrait-primary",
        scope: "/",
        id: "ecoshift-waste-management",

        icons: [
          {
            src: "/icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "/icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],

        categories: ["productivity", "utilities", "business"],
        lang: "en",
        dir: "ltr",
      },

      // 🛡️ service worker generated automatically
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg,ico,json}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/firestore\.googleapis\.com\//,
            handler: "NetworkFirst",
            options: {
              cacheName: "firestore-cache",
            },
          },
          {
            urlPattern: /^https:\/\/firebasestorage\.googleapis\.com\//,
            handler: "CacheFirst",
            options: {
              cacheName: "firebase-storage-cache",
            },
          },
        ],
      },
    }),
  ].filter(Boolean),

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@radix-ui/react-tooltip": path.resolve(
        __dirname,
        "./src/shims/radix-tooltip.tsx"
      ),
    },
    dedupe: ["react", "react-dom"],
  },
}));
