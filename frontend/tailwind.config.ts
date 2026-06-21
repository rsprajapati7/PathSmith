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
        bg: "#FDF4AF", // Gold background
        surface: "#ffffff", // Pure white card surfaces
        "border-dim": "#D8CE95", // Warm gold-cream border
        "border-bright": "#34908B", // Deep Ocean
        accent: "#34908B", // Deep Ocean
        "accent-glow": "#6FBEB2", // Sage Teal
        sage: "#6FBEB2", // Sage Teal
        gold: "#FDF4AF", // Gold
        danger: "#BE123C", // Rose Red
        warning: "#D97706", // Amber
        main: "#122a2c", // Deep soothing text color
        muted: "#4e6a6c", // Muted soothing text color
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

