import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// When building for GitHub Pages (a project site served at
// https://<user>.github.io/CosmOS/), assets must be referenced under /CosmOS/.
// Locally and in other hosts we serve from the root.
export default defineConfig(({ command }) => ({
  base: command === "build" && process.env.GITHUB_PAGES ? "/CosmOS/" : "/",
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
}));
