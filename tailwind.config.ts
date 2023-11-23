import type { Config } from "tailwindcss";

function alpha(variableName: string) {
  // some tailwind magic to allow us to specify opacity with CSS variables (eg: bg-app/80)
  // https://tailwindcss.com/docs/customizing-colors#using-css-variables
  return `hsla(var(${variableName}), <alpha-value>)`;
}

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      colors: {
        accent: {
          DEFAULT: alpha("--color-accent"),
        },
        app: {
          DEFAULT: alpha("--color-app"),
        },
        sidebar: {
          DEFAULT: alpha("--color-sidebar"),
          selected: alpha("--color-sidebar-selected"),
          ink: alpha("--color-sidebar-ink"),
          inkDull: alpha("--color-sidebar-ink-dull"),
          inkFaint: alpha("--color-sidebar-ink-faint"),
          divider: alpha("--color-sidebar-divider"),
        },
      },
    },
  },
  plugins: [],
};
export default config;
