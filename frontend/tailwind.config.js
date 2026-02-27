// JSDoc type annotation — tells IDEs (and TypeScript) that this object conforms to the Tailwind CSS Config type
// This enables autocompletion and type checking in editors without requiring a .ts file
/** @type {import('tailwindcss').Config} */
// Export the Tailwind CSS configuration as the default export — Tailwind reads this at build time via PostCSS
export default {
  // content: array of glob patterns telling Tailwind which files to scan for class names
  // Tailwind uses this to tree-shake unused CSS utilities, keeping the final bundle size minimal
  // "./index.html" — scan the root HTML template for any Tailwind classes used directly in markup
  // "./src/**/*.{js,ts,jsx,tsx}" — scan ALL JS/TS/JSX/TSX files under src/ recursively for Tailwind class usage
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  // theme: customize or extend Tailwind's default design tokens (colors, spacing, fonts, breakpoints, etc.)
  theme: {
    // extend: add new values without overriding Tailwind's defaults — keeps all built-in utilities available
    // Currently empty — the project uses Tailwind's default theme without custom extensions
    extend: {},
  },
  // plugins: array of Tailwind CSS plugins to add extra utilities, components, or variants
  // Currently empty — no third-party Tailwind plugins are installed (e.g., @tailwindcss/forms, @tailwindcss/typography)
  plugins: [],
};
