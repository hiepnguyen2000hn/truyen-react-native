/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#E94057",
        "primary-dark": "#c73347",
        surface: "#fff",
        "surface-dark": "#1e1e1e",
        "bg-reader-light": "#fdf6e3",
        "bg-reader-dark": "#1a1a1a",
      },
    },
  },
  plugins: [],
};
