import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        porcelain: "#F7F5F6",
        surface: "#FFFFFF",
        ink: "#26212B",
        muted: "#8A8290",
        line: "#ECE7EA",
        accent: {
          DEFAULT: "#A76C7E",
          soft: "#F3E9ED",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "-apple-system", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(38,33,43,0.04), 0 8px 24px -12px rgba(38,33,43,0.10)",
        lift: "0 4px 10px rgba(38,33,43,0.06), 0 18px 40px -16px rgba(38,33,43,0.18)",
        sheet: "0 -8px 40px -12px rgba(38,33,43,0.20)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      keyframes: {
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "translateY(8px) scale(0.98)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "sheet-up": {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
      },
      animation: {
        shimmer: "shimmer 1.6s infinite",
        "fade-in": "fade-in 0.2s ease-out both",
        "scale-in": "scale-in 0.22s cubic-bezier(0.22,1,0.36,1) both",
        "sheet-up": "sheet-up 0.28s cubic-bezier(0.22,1,0.36,1) both",
      },
    },
  },
  plugins: [],
};

export default config;
