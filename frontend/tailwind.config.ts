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
        bg: "#05050a",
        surface: "#0e0e15",
        "border-dim": "#222233",
        "border-bright": "#6366f1",
        accent: "#06b6d4",
        "accent-glow": "#3b82f6",
        danger: "#f43f5e",
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

