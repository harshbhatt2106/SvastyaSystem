/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        clinic: {
          25: "#f5f8ff",
          50: "#eef4ff",
          100: "#d9e7ff",
          200: "#aec8ff",
          500: "#2f66d0",
          600: "#2556b8",
          700: "#1e4697",
          800: "#183a7e",
          900: "#102a5c",
        },
        care: {
          50: "#ecfdf5",
          100: "#d1fae5",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
        },
      },
      boxShadow: {
        soft: "0 10px 30px rgba(15, 23, 42, 0.08)",
        clinical: "0 18px 45px rgba(16, 42, 92, 0.16)",
      },
    },
  },
  plugins: [],
};
