/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#F6F8FC",
        panel: "#FFFFFF",
        ink: {
          DEFAULT: "#0F1729",
          soft: "#4A5468",
          faint: "#8891A5",
        },
        line: "#E6EAF2",
        signal: {
          normal: "#16B981",
          warn: "#F5A524",
          crit: "#EF4444",
          info: "#2D6CDF",
          ai: "#7C5CFF",
        },
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      boxShadow: {
        panel: "0 1px 2px rgba(15,23,41,0.04), 0 8px 24px -12px rgba(15,23,41,0.10)",
        glow: "0 0 0 1px rgba(45,108,223,0.15), 0 8px 30px -8px rgba(45,108,223,0.35)",
      },
      keyframes: {
        pulseRing: {
          "0%": { transform: "scale(0.9)", opacity: "0.8" },
          "70%": { transform: "scale(1.9)", opacity: "0" },
          "100%": { transform: "scale(1.9)", opacity: "0" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        pulseRing: "pulseRing 2.2s cubic-bezier(0.4,0,0.2,1) infinite",
        shimmer: "shimmer 2.5s linear infinite",
      },
    },
  },
  plugins: [],
};
