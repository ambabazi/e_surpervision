/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // mycampus.uok.ac.rw SME portal palette
        campus: {
          gold: "#E5A000",
          maroon: "#7A1D2E",
          sky: "#00AEEF",
          page: "#F0F0F0",
        },
        // Official University of Kigali brand palette (uok.ac.rw)
        uok: {
          red: "#801830",
          blue: "#1D428A",
          gold: "#FDB913",
        },
        // Primary: crimson / maroon red (aligned with UoK official red)
        crimson: {
          50: "#fdf2f4",
          100: "#fce4e8",
          200: "#f8c9d2",
          300: "#f099aa",
          400: "#e05f78",
          500: "#c9334f",
          600: "#a8223c",
          700: "#801830",
          800: "#6b1528",
          900: "#5a1322",
          950: "#320810",
        },
        // Secondary: gold / yellow (UoK official gold)
        gold: {
          50: "#fffbeb",
          100: "#fff3c4",
          200: "#fde68a",
          300: "#FDB913",
          400: "#f7c948",
          500: "#f0b429",
          600: "#de911d",
          700: "#cb6e17",
          800: "#b44d12",
          900: "#8d2b0b",
        },
        // Tertiary: blue (UoK official blue)
        royal: {
          50: "#eef3fa",
          100: "#d9e4f5",
          200: "#b3c9eb",
          300: "#7da3d9",
          400: "#4a7bc4",
          500: "#2d5aa8",
          600: "#1D428A",
          700: "#183670",
          800: "#142d5c",
          900: "#102548",
        },
        brand: {
          DEFAULT: "#801830",
          dark: "#5a1322",
          light: "#a8223c",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "Segoe UI", "Roboto", "Helvetica", "Arial", "sans-serif"],
        serif: ["Georgia", "Times New Roman", "Times", "serif"],
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(0 0 0 / 0.07), 0 1px 2px -1px rgb(0 0 0 / 0.07)",
        soft: "0 4px 24px -8px rgb(15 23 42 / 0.12)",
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out",
      },
    },
  },
  plugins: [],
};
