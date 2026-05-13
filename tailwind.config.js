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
          25: "#f8fcff",
          50: "#eef8fb",
          100: "#d8f0f6",
          200: "#b8e4ee",
          500: "#1e8fb5",
          600: "#14779c",
          700: "#115f7e",
          800: "#124f68",
          900: "#123f55",
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
        clinical: "0 18px 45px rgba(15, 79, 104, 0.10)",
      },
    },
  },
  plugins: [],
};
