/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./*.{js,ts,jsx,tsx}",
    "./App.jsx",
  ],
  // Esta linha é fundamental para que o tema mude quando adicionamos a classe 'dark' ao HTML
  darkMode: "class",
  theme: {
    extend: {},
  },
  plugins: [],
};
