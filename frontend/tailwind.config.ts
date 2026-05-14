import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17201a",
        moss: "#3f6b4f",
        coral: "#d97059",
        saffron: "#d79b2b",
        paper: "#f7f5ef"
      },
      boxShadow: {
        soft: "0 12px 30px rgba(23, 32, 26, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
