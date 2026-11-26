import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // SLUSH DESIGN SYSTEM TOKENS
        carbon: "#000000",
        "paper-white": "#ffffff",
        "sky-wash": "#dceeff",
        "concrete-gray": "#cccccc",
        "soft-mist": "#e9e9e9",
        "electric-blue": "#4da2ff",
        "mint-pop": "#55db9c",
        lavender: "#e9ccff",
        ember: "#fb4903",
        sunburst: "#ffd731",
        "voltage-violet": "#5c4ade",

        // Classic colors for backwards compatibility
        obsidian: {
          950: "#050507",
          900: "#09090B",
          850: "#111116",
          800: "#18181B",
          700: "#27272A",
        },
        emerald: {
          950: "#022c22",
          900: "#064E3B",
          800: "#065F46",
          700: "#047857",
          600: "#059669",
          500: "#10B981",
        },
        gold: {
          50: "#FFFBEB",
          100: "#FEF3C7",
          200: "#FDE68A",
          300: "#FCD34D",
          400: "#FBBF24",
          500: "#F59E0B",
          600: "#D97706",
          700: "#B45309",
        },
        crimson: {
          500: "#EF4444",
          600: "#DC2626",
          700: "#B91C1C",
        },
      },
      borderRadius: {
        cards: "24px",
        "cards-elevated": "40px",
        pills: "1600px",
        buttons: "1600px",
      },
      fontFamily: {
        lateral: ["'Bowlby One'", "'Impact'", "'Arial Black'", "system-ui", "sans-serif"],
        aeonik: ["'Inter'", "'Satoshi'", "system-ui", "-apple-system", "sans-serif"],
      },
      lineHeight: {
        crushed: "0.78",
        tight: "0.82",
      },
      boxShadow: {
        sticker: "2px 2px 0px #000000",
        "sticker-lg": "4px 4px 0px #000000",
      },
    },
  },
  plugins: [],
};
export default config;
