/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cosmos: {
          bg: "#05060e",
          panel: "#0c0f1f",
          panel2: "#141a33",
          border: "#23294a",
          accent: "#7c5cff",
          accent2: "#34d3ff",
          star: "#ffd479",
          good: "#3ddc84",
          bad: "#ff5d6c",
        },
      },
      fontFamily: {
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
