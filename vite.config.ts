import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Relative base so the production build works at any path — a project page on
// GitHub Pages (e.g. /buildagame/), a Vercel root, or a plain static host.
export default defineConfig({
  base: "./",
  plugins: [react()],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
});
