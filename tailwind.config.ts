import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        // Body / UI text.
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        inter: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        // Display text — headings, logo, hero.
        serif: ["'Instrument Serif'", "Georgia", "serif"],
      },
      colors: {
        // The landing page lives in a clean black-on-white world. These tokens
        // back the gradient overlays referenced in the hero spec
        // (from-background … to-background).
        background: "#FFFFFF",
        foreground: "#000000",
        muted: "#6F6F6F",
        line: "#ECECEC",
        // The studio + player are a focused, dark "pro tool" surface.
        ink: {
          950: "#0b0c10",
          900: "#101218",
          850: "#161922",
          800: "#1c2030",
          700: "#262b3d",
          600: "#343a52",
        },
      },
      maxWidth: {
        "7xl": "80rem",
      },
      keyframes: {
        "fade-rise": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-rise": "fade-rise 0.8s ease-out both",
      },
    },
  },
  plugins: [],
} satisfies Config;
