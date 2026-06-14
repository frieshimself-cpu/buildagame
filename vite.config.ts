import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Relative base so the production build works at any path — a project page on
// GitHub Pages (e.g. /buildagame/), a Vercel root, or a plain static host.
export default defineConfig({
  base: "./",
  plugins: [react()],
  // @solana/web3.js (loaded only when launching a token) expects a Node-ish
  // environment. Map `global` to `globalThis` and the `buffer` import to the
  // browser shim; main.tsx installs the Buffer global before web3 is imported.
  define: {
    global: "globalThis",
  },
  resolve: {
    alias: {
      buffer: "buffer",
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
});
