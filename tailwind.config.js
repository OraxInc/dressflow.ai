/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // DressUp AI Luxury Palette
        primary: "#0B1728",       // Navy dark — main background
        secondary: "#1E2E50",     // Navy mid — cards / elevated surfaces
        nav: "#0F1C35",           // Nav bar background
        green: "#2D6A4F",         // Bottle green — success / active states
        coffee: "#C8956A",        // Light coffee — primary CTA / warm accent
        coffeeDark: "#A87555",    // Coffee pressed state
        khaki: "#8B8760",         // Khaki — secondary accent / muted borders
        cream: "#F0EBE3",         // Cream white — primary text
        soft: "#8B8F9E",          // Muted blue-grey — secondary text
        glass: "#ffffff14",       // Glass fill (white 8%)
        glassBorder: "#ffffff1f", // Glass border (white 12%)
        // Legacy aliases (keep for any remaining references)
        tertiary: "#C8956A",
        whiteless: "#8B8F9E",
        gray: "#2D3A50",
        transp: "#ffffff14",
      },
    },
  },
  plugins: [],
};
