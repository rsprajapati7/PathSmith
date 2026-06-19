import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#050b0c",
        surface: "#0b1516",
        "border-dim": "#1b2f30",
        "border-bright": "#A5E9DD", // Mint
        accent: "#A5E9DD", // Mint
        "accent-glow": "#34908B", // Deep Ocean
        sage: "#6FBEB2", // Sage Teal
        gold: "#FDF4AF", // Gold
        danger: "#f87171",
        warning: "#FDF4AF",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;

