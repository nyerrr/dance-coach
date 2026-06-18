import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Dance Coach",
        short_name: "DanceCoach",
        theme_color: "#15101c",
        background_color: "#15101c",
        display: "standalone",
        icons: [
          {src: "icon-192.png", sizes: "192x192", type: "image/png"},
          {src: "icon-512.png", sizes: "512x512", type: "image/png"}
        ],  
      },

      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/storage\.googleapis\.com\/mediapipe-models\//,
            handler: "CacheFirst",
            options: { cacheName: "pose-model-cache" },
          },
          {
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/npm\/@mediapipe\//,
            handler: "CacheFirst",
            options: { cacheName: "pose-wasm-cache" },
          }
        ]
      }
    })
  ],
});