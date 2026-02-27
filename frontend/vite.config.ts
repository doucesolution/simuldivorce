// Import defineConfig helper from Vite — provides type-safe configuration and IDE autocompletion
import { defineConfig } from "vite";
// Import the Plugin type from Vite — used to type-annotate custom plugin factory functions below
import type { Plugin } from "vite";
// Import the official Vite plugin for React — enables JSX transform, Fast Refresh (HMR), and Babel/SWC integration
import react from "@vitejs/plugin-react";
// Import Node.js filesystem utilities: copyFileSync (copy files), mkdirSync (create directories), writeFileSync (write files)
import { copyFileSync, mkdirSync, writeFileSync } from "fs";
// Import resolve from Node.js path module — joins path segments into an absolute path (cross-platform)
import { resolve } from "path";
// Import randomUUID from Node.js crypto module — generates a RFC 4122 v4 UUID used as a unique build fingerprint
import { randomUUID } from "crypto";

/**
 * Vite plugin that writes a version.json file into the build output.
 * The file contains a unique buildHash generated at build time.
 * The VersionChecker component fetches this file to detect new deploys.
 */
// Factory function that returns a Vite Plugin object for version.json generation
function versionJsonPlugin(): Plugin {
  // Generate a unique UUID at build time — this hash changes on every build, allowing the client to detect updates
  const buildHash = randomUUID();
  // Return the Vite plugin descriptor object
  return {
    // Unique plugin name — Vite uses this for error messages and debugging
    name: "version-json",
    // Only activate this plugin during production builds (not during dev server)
    apply: "build",
    // closeBundle hook fires after Rollup has finished writing all output files to disk
    closeBundle() {
      // Compute the absolute path to dist/version.json using __dirname (the directory of this config file)
      const versionFile = resolve(__dirname, "dist", "version.json");
      // Write the JSON file containing the buildHash (unique per build) and builtAt (ISO 8601 timestamp)
      writeFileSync(
        versionFile,
        // Serialize the version metadata as a JSON string for the VersionChecker component to fetch at runtime
        JSON.stringify({ buildHash, builtAt: new Date().toISOString() }),
      );
    },
  };
}

/**
 * Vite plugin that copies dist/index.html into each public SPA route folder.
 * This ensures GitHub Pages serves HTTP 200 (not 404) for every route,
 * which is required for Google Search Console to index SPA sub-pages.
 * Also creates a 404.html fallback for any unmatched routes.
 */
// Factory function that returns a Vite Plugin object for pre-rendering SPA route folders
function spaRoutesPlugin(): Plugin {
  /** All client-facing routes — each gets its own index.html for HTTP 200 */
  // Define every SPA route that must return HTTP 200 on GitHub Pages (static hosting has no server-side routing)
  const routes = [
    // --- Editorial / informational pages ---
    "disclaimer", // Legal disclaimer page
    "guide", // User guide / tutorial page
    "methodology", // Explanation of the calculation methodology
    "glossary", // Glossary of legal and financial terms
    "privacy", // Privacy policy page
    "terms", // Terms of service page
    // --- Application pages (forms, results, export) ---
    "prestation-compensatoire", // Main compensatory allowance calculation form
    "informations-debiteur", // Debtor (payer) information form
    "informations-creancier", // Creditor (recipient) information form
    "recapitulatif", // Summary / recap page showing all computed results
    "dashboard", // Dashboard overview page
    "export", // PDF / Word export page
    "transition", // Interstitial transition / ad page between form steps
  ];

  // Return the Vite plugin descriptor object
  return {
    // Unique plugin name — Vite uses this for error messages and debugging
    name: "spa-routes",
    // Only activate this plugin during production builds (not during dev server)
    apply: "build",
    // closeBundle hook fires after Rollup has finished writing all output files to disk
    closeBundle() {
      // Resolve the absolute path to the dist output directory
      const distDir = resolve(__dirname, "dist");
      // Resolve the absolute path to the main index.html that Vite generated
      const indexHtml = resolve(distDir, "index.html");

      // Copy index.html into each route subfolder so GitHub Pages returns 200
      // Iterate over each defined SPA route to create a subfolder with its own index.html
      for (const route of routes) {
        // Compute the absolute path for the route's subfolder (e.g., dist/disclaimer/)
        const routeDir = resolve(distDir, route);
        // Create the subfolder (and any parent directories) if it doesn't already exist
        mkdirSync(routeDir, { recursive: true });
        // Copy the main index.html into the subfolder — GitHub Pages will serve this for /route/ requests
        copyFileSync(indexHtml, resolve(routeDir, "index.html"));
      }

      // Also create a 404.html fallback for any unknown route
      // GitHub Pages serves 404.html for unmatched paths — this lets the SPA client-side router handle them
      copyFileSync(indexHtml, resolve(distDir, "404.html"));
    },
  };
}

// https://vitejs.dev/config/
// Export the Vite configuration object — defineConfig provides type hints and validation
export default defineConfig({
  // Set the base public path to "/" — all asset URLs will be relative to the site root
  base: "/",
  // Register Vite plugins: React support, version.json generator, and SPA route pre-renderer
  plugins: [react(), versionJsonPlugin(), spaRoutesPlugin()],
  // Build configuration — customizes the Rollup bundler behavior for production builds
  build: {
    // Rollup-specific options for fine-grained control over the output bundle
    rollupOptions: {
      // Output configuration — controls how chunks and assets are organized
      output: {
        // manualChunks splits specified dependencies into separate JS files for better caching
        manualChunks: {
          /* Core React runtime — cached long-term */
          // Group React core libraries into one chunk — these rarely change and are cached by the browser
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          /* Heavy PDF library — loaded only when user exports */
          // Isolate jsPDF into its own chunk so it's only downloaded when the user triggers PDF export
          "vendor-jspdf": ["jspdf"],
        },
      },
    },
  },
});
