// Import React library — the core library for building UI components using JSX and the virtual DOM
import React from "react";
// Import ReactDOM client module — provides createRoot() for React 18+ concurrent rendering in the browser
import ReactDOM from "react-dom/client";
// Import BrowserRouter — wraps the entire app with HTML5 History API-based client-side routing (no full page reloads)
import { BrowserRouter } from "react-router-dom";
// Import the root App component — contains all route definitions, lazy-loaded pages, global providers, and layout wrappers
import App from "./App.tsx";
// Import the global stylesheet — includes CSS custom property design system, TailwindCSS directives, theme definitions, and animations
import "./index.css";

// Block the browser's native PWA "Add to Home Screen" install prompt (the beforeinstallprompt event)
// The web app manifest is still shipped so the app can be published on Google Play Store via TWA (Trusted Web Activity)
// Calling preventDefault() suppresses the automatic install mini-infobar without removing PWA capabilities
window.addEventListener("beforeinstallprompt", (e) => {
  // Prevent the default browser install prompt from automatically appearing to the user
  e.preventDefault();
});

// Create a React 18+ concurrent root, attaching it to the <div id="root"> element declared in index.html
// The non-null assertion operator (!) tells TypeScript that getElementById("root") will never return null
ReactDOM.createRoot(document.getElementById("root")!).render(
  // React.StrictMode enables additional development-time checks and warnings:
  // - Detects unsafe lifecycle methods, legacy string refs, and unexpected side effects
  // - Double-invokes render functions and effects in development to surface hidden bugs
  // - Has zero runtime cost in production builds
  <React.StrictMode>
    {/* BrowserRouter provides the routing context for the entire application tree */}
    {/* It uses the HTML5 pushState API so clean URLs like /dashboard work without server-side redirect rules */}
    <BrowserRouter>
      {/* App is the top-level component rendered inside the router context */}
      {/* It defines all <Route> paths and wraps them with providers (GuidedMode, Theme, etc.) */}
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
