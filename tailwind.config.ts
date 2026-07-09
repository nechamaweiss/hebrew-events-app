import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // הצבעים מגיעים ממשתני CSS שנקבעים דינמית מהגדרות ה"עיצוב"
      colors: {
        primary: "var(--color-primary)",
        secondary: "var(--color-secondary)",
        btn: "var(--color-button)",
        link: "var(--color-link)",
        alert: "var(--color-alert)",
        heading: "var(--color-heading)",
        appbg: "var(--color-background)",
        menubg: "var(--color-menu-background)",
        apptext: "var(--color-text)",
      },
      fontFamily: {
        sans: ["Rubik", "Heebo", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)",
      },
    },
  },
  plugins: [],
};

export default config;
