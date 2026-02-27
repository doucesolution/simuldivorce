// Import the core ESLint JS plugin — provides the base "recommended" rule set (no-unused-vars, no-undef, etc.)
import js from "@eslint/js";
// Import the globals package — provides predefined sets of global variables (browser, node, etc.) to avoid false "undefined" warnings
import globals from "globals";
// Import the React Hooks ESLint plugin — enforces the Rules of Hooks (e.g., hooks must be called at the top level, deps arrays must be correct)
import reactHooks from "eslint-plugin-react-hooks";
// Import the React Refresh ESLint plugin — warns when component exports aren't compatible with Vite's Fast Refresh (HMR)
import reactRefresh from "eslint-plugin-react-refresh";
// Import typescript-eslint — provides TypeScript-aware linting rules and a parser that understands TS syntax
import tseslint from "typescript-eslint";
// Import defineConfig and globalIgnores from ESLint — defineConfig provides type-safe flat config, globalIgnores excludes paths from all rules
import { defineConfig, globalIgnores } from "eslint/config";

// Export the flat ESLint configuration array — ESLint 9+ uses this "flat config" format instead of the legacy .eslintrc
export default defineConfig([
  // Globally ignore the dist/ directory — never lint production build output (it's generated code)
  globalIgnores(["dist"]),
  // Configuration object that applies to all TypeScript and TSX files in the project
  {
    // files: glob pattern specifying which files this config block applies to — only .ts and .tsx files
    files: ["**/*.{ts,tsx}"],
    // extends: inherit rule sets from multiple plugins — each adds its own recommended rules
    extends: [
      // ESLint core recommended rules — catches common JavaScript errors (no-debugger, no-duplicate-case, etc.)
      js.configs.recommended,
      // TypeScript-ESLint recommended rules — catches TS-specific issues (no-explicit-any, no-unused-vars for TS, etc.)
      tseslint.configs.recommended,
      // React Hooks recommended rules — enforces exhaustive-deps for useEffect and correct hook call order
      reactHooks.configs.flat.recommended,
      // React Refresh (Vite) rules — ensures components are exported in a way that supports Vite's Hot Module Replacement
      reactRefresh.configs.vite,
    ],
    // languageOptions: configure the JavaScript/TypeScript parser behavior and global variable definitions
    languageOptions: {
      // ecmaVersion: 2020 — enable parsing of ES2020 syntax features (optional chaining ?., nullish coalescing ??, BigInt, etc.)
      ecmaVersion: 2020,
      // globals: inject browser global variables (window, document, navigator, fetch, etc.) so ESLint doesn't flag them as undefined
      globals: globals.browser,
    },
  },
]);
