import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  preview: {
    allowedHosts: [
      "recycle-monitor-app.onrender.com", // ✅ Render deploy domain
      "localhost",                        // ✅ Allow local testing
      "127.0.0.1",                        // ✅ Backup localhost
      "*.onrender.com"                    // ✅ (Optional) wildcard for future deployments
    ],
    port: 8080, // Optional: make sure preview uses the same port
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom"],
  },
}));
