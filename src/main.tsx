import { Buffer } from "buffer";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/fonts.css";

// @solana/web3.js relies on a global Buffer. Install it before anything that
// might pull web3 in (the token launcher is code-split, but be safe).
if (!(globalThis as { Buffer?: unknown }).Buffer) {
  (globalThis as unknown as { Buffer: typeof Buffer }).Buffer = Buffer;
}
import "./styles/theme.css";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
