/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          gold:       "#111111", // Changed to pure black for sleek feel
          "gold-light": "#333333",
          "gold-dark":  "#000000",
          green:      "#CCFF00", // Neon / Volt Accent
          "green-light": "#DFFF33",
          "green-dark":  "#A3CC00",
        },
        sand: {
          50:  "#FFFFFF",
          100: "#F7F7F7", // main background
          200: "#EFEFEF",
          300: "#E5E5E5",
        },
        charcoal: {
          900: "#111111", // primary text
          700: "#555555",
          500: "#888888", // muted text
          300: "#BBBBBB",
          100: "#EAEAEA",
        },
        danger: "#FF3333",
        success: "#00E054",
        warning: "#FF8C00",
      },
      fontFamily: {
        sans: ["'Helvetica Neue'", "Helvetica", "Arial", "sans-serif"],
        display: ["'Helvetica Neue'", "Helvetica", "Arial", "sans-serif"],
      },
      borderRadius: {
        xl:  "0.75rem",
        "2xl": "1.25rem",
        "3xl": "2rem",
      },
      boxShadow: {
        card: "0 2px 8px rgba(0,0,0,0.03)",
        "card-hover": "0 8px 24px rgba(0,0,0,0.06)",
      },
    },
  },
  plugins: [],
}


