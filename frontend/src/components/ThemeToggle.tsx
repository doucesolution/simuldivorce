// Import React core and hooks: useState for tracking current theme, useEffect for side effects
import React, { useState, useEffect } from "react";
// Import createPortal from react-dom to render the toggle button directly into document.body (outside the React tree)
import { createPortal } from "react-dom";
// Import Moon and Sun icons from lucide-react for the dark/light mode visual indicator
import { Moon, Sun } from "lucide-react";

// ThemeToggle — floating button component that lets users switch between dark and light themes
const ThemeToggle: React.FC = () => {
  // Initialize isDark state: check if the user's OS prefers dark color scheme via matchMedia
  const [isDark, setIsDark] = useState(() => {
    // Guard against SSR environments where window may not exist
    if (typeof window !== "undefined") {
      // Query the browser's prefers-color-scheme media feature to get the OS-level preference
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    // Default to light mode if window is not available (SSR fallback)
    return false;
  });

  // Apply theme classes to the document root element whenever isDark changes
  useEffect(() => {
    // Get the <html> root element to toggle CSS class names for theming
    const root = document.documentElement;
    if (isDark) {
      // Add "dark" class and remove "light" class to activate dark theme styles
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      // Remove "dark" class and add "light" class to activate light theme styles
      root.classList.remove("dark");
      root.classList.add("light");
    }

    // Update PWA theme-color meta tag so the browser chrome matches the current theme
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      // Set dark slate color for dark mode, light gray for light mode
      meta.setAttribute("content", isDark ? "#020617" : "#f8fafc");
    }
  }, [isDark]); // Re-run whenever isDark changes

  // Listen for system-level preference changes (e.g., user toggles OS dark mode)
  useEffect(() => {
    // Create a MediaQueryList object to monitor the prefers-color-scheme media query
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    // Handler that updates isDark state when the OS preference changes
    const handler = (e: MediaQueryListEvent) => {
      // Sync the component state with the new OS-level preference
      setIsDark(e.matches);
    };
    // Register the change listener on the media query
    mq.addEventListener("change", handler);
    // Cleanup: remove the listener when the component unmounts
    return () => mq.removeEventListener("change", handler);
  }, []); // Empty deps: attach listener only once on mount

  // Use createPortal to render the toggle button directly in document.body,
  // ensuring it floats above all other content regardless of React component hierarchy
  return createPortal(
    // The floating toggle button: fixed position at the bottom-right corner of the viewport
    <button
      onClick={() =>
        setIsDark(!isDark)
      } /* Toggle the theme on click by flipping the isDark boolean */
      className="fixed bottom-[7rem] right-3 z-[9998] w-7 h-7 flex items-center justify-center sm:bottom-4 sm:right-4 sm:w-auto sm:h-auto sm:p-3 rounded-xl bg-(--bg-secondary) border border-(--border-color) shadow-lg hover:shadow-xl transition-all duration-300 btn-compact"
      aria-label={
        isDark ? "Passer en mode clair" : "Passer en mode sombre"
      } /* Accessible label in French describing the action */
    >
      {/* Conditionally render Sun icon (to switch to light) or Moon icon (to switch to dark) */}
      {isDark ? (
        // Sun icon displayed in dark mode — clicking will switch to light mode
        <Sun className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-(--accent-primary)" />
      ) : (
        // Moon icon displayed in light mode — clicking will switch to dark mode
        <Moon className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-(--accent-primary)" />
      )}
    </button>,
    document.body, // Portal target: render the button as a direct child of <body>
  );
};

// Default export for use across the application (typically in the root layout)
export default ThemeToggle;
