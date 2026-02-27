// PostCSS configuration file — PostCSS is a CSS transformation pipeline that Vite uses automatically
// Vite detects this file (postcss.config.js) at the project root and applies the listed plugins to all CSS
export default {
  // plugins: object mapping plugin names to their options — PostCSS applies them in order (top to bottom)
  plugins: {
    // @tailwindcss/postcss: the official Tailwind CSS PostCSS plugin
    // This processes Tailwind directives (@tailwind, @apply, @layer) and generates utility CSS from scanned class names
    // The empty object {} means "use default options" — Tailwind reads its own config from tailwind.config.js
    "@tailwindcss/postcss": {},
    // autoprefixer: automatically adds vendor prefixes (-webkit-, -moz-, -ms-) to CSS properties
    // This ensures cross-browser compatibility without manually writing prefixed rules
    // Uses the Browserslist config (from package.json or .browserslistrc) to determine which prefixes are needed
    // The empty object {} means "use default options" — targets browsers based on the project's Browserslist config
    autoprefixer: {},
  },
};
