// Import React hooks: useEffect for side effects, useRef for mutable refs that persist across renders,
// useState for managing component state, useCallback for memoising functions
import { useEffect, useRef, useState, useCallback } from "react";

/**
 * VersionChecker — detects new site deployments and forces a fresh page load.
 *
 * Cross-browser compatible (Chrome, Firefox, Safari, Edge).
 *
 * Strategy:
 *  1. Fetches /version.json with aggressive cache-busting (unique URL +
 *     no-cache headers) so we ALWAYS get the real latest hash from the server.
 *  2. Compares with the hash in localStorage ("appBuildHash").
 *  3. First visit → stores hash, nothing else.
 *  4. Stale on page load → navigates to a cache-busted URL (?_v=<ts>) which
 *     forces both the browser AND the CDN to fetch fresh HTML. The hash is
 *     stored ONLY via sessionStorage flag; if the page still loads old code
 *     after the navigate, a banner is shown instead of looping.
 *  5. Mid-session new version → shows a non-intrusive banner.
 *  6. Re-checks every 5 min + when the tab regains focus.
 *
 * IMPORTANT: Only "appBuildHash" in localStorage is written. All user data
 * (divorceFormData, simulationMode, calculationChoices, etc.) is untouched.
 */

// localStorage key where the current build hash is persisted across sessions
const STORAGE_KEY = "appBuildHash";
// sessionStorage key used as a flag to prevent infinite reload loops when the CDN still serves stale content
const RELOAD_FLAG = "appVersionReloading"; // sessionStorage flag
// Polling interval: check for new versions every 5 minutes (300,000 milliseconds)
const CHECK_INTERVAL_MS = 5 * 60 * 1000;

// TypeScript interface for the shape of the JSON response from /version.json
interface VersionInfo {
  // The unique build hash string generated at build time, used to identify each deployment
  buildHash: string;
}

/* ------------------------------------------------------------------ */
/*  Fetch version.json — maximum cache-busting for every browser      */
/* ------------------------------------------------------------------ */
/**
 * Fetches /version.json with aggressive cache-busting to bypass browser and CDN caches.
 * Uses a unique timestamp + random string in the URL, plus no-cache/no-store headers.
 * @returns The parsed VersionInfo object containing the buildHash, or null if the fetch fails
 */
async function fetchVersionJson(): Promise<VersionInfo | null> {
  try {
    // Construct a URL with two cache-busting query parameters:
    // _t = current timestamp in milliseconds (unique per call)
    // _r = random alphanumeric string (extra uniqueness to defeat aggressive caching)
    const url = `/version.json?_t=${Date.now()}&_r=${Math.random().toString(36).slice(2)}`;
    // Perform the HTTP GET request with maximum cache-busting settings
    const res = await fetch(url, {
      method: "GET", // Standard GET request
      cache: "no-store", // Tell the browser to never use the cache for this request
      headers: {
        // Legacy HTTP/1.0 cache-busting header (for older proxies)
        Pragma: "no-cache",
        // Modern cache control: no caching at any level, must always revalidate
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
    // If the server returned a non-OK status (e.g., 404, 500), return null
    if (!res.ok) return null;
    // Parse and return the JSON response as a VersionInfo object
    return (await res.json()) as VersionInfo;
  } catch {
    // If the fetch fails entirely (network error, CORS issue, etc.), return null silently
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Navigate to a cache-busted URL (forces fresh HTML from server)    */
/*  reload(true) is deprecated and silently ignored in most browsers  */
/*  so we use URL-based cache-busting instead.                        */
/* ------------------------------------------------------------------ */
/**
 * Forces a full page reload by navigating to the current URL with a cache-busting query parameter.
 * This approach works reliably across all modern browsers, unlike the deprecated location.reload(true).
 * window.location.replace() is used so the stale URL doesn't stay in the browser history.
 */
function navigateFresh(): void {
  // Parse the current page URL into a URL object for easy manipulation
  const url = new URL(window.location.href);
  // Add or overwrite the "_v" query parameter with the current timestamp
  // This makes the URL unique, forcing the browser and CDN to fetch fresh HTML
  url.searchParams.set("_v", Date.now().toString());
  // Navigate to the cache-busted URL, replacing the current history entry (no back-button to stale page)
  window.location.replace(url.toString());
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
// The VersionChecker functional component — renders either nothing or a "new version" banner
const VersionChecker: React.FC = () => {
  // State: whether to display the "new version available" banner to the user
  const [showBanner, setShowBanner] = useState(false);
  // Ref: tracks whether the current version check is the initial one (on page load) vs. a periodic one
  const isInitialCheck = useRef(true);
  // Ref: tracks whether we've already attempted a cache-busted reload in this component lifecycle
  const hasAttemptedReload = useRef(false);

  // Effect: on mount, clean up the ?_v= cache-busting parameter from the URL bar
  // so the URL looks clean to the user after a cache-busted navigation
  useEffect(() => {
    // Parse the current URL to check for the "_v" query parameter
    const url = new URL(window.location.href);
    // If the URL contains the cache-busting "_v" parameter from a previous navigateFresh() call
    if (url.searchParams.has("_v")) {
      // Remove the "_v" parameter from the URL
      url.searchParams.delete("_v");
      // Reconstruct a clean URL string without the cache-busting parameter
      const clean = url.pathname + (url.search || "") + (url.hash || "");
      // Use replaceState to update the URL bar without triggering a navigation or adding a history entry
      window.history.replaceState({}, "", clean);
    }
  }, []); // Empty dependency array: run only once on mount

  // Memoised callback that performs the actual version check logic
  const checkVersion = useCallback(async () => {
    // Fetch the latest version.json from the server with cache-busting
    const data = await fetchVersionJson();
    // If the fetch failed (network error, 404, etc.), silently abort
    if (!data) return;

    // Extract the build hash from the fetched version data
    const newHash = data.buildHash;
    // Retrieve the previously stored build hash from localStorage (may be null on first visit)
    const storedHash = localStorage.getItem(STORAGE_KEY);

    // ── First visit ever: no stored hash exists ──
    if (!storedHash) {
      // Store the current build hash for future comparisons
      localStorage.setItem(STORAGE_KEY, newHash);
      // Clear any lingering reload flag from a previous session
      sessionStorage.removeItem(RELOAD_FLAG);
      // Mark that the initial check is complete
      isInitialCheck.current = false;
      return; // Nothing more to do on first visit
    }

    // ── Same version: hashes match, site is up to date ──
    if (storedHash === newHash) {
      // Clear the reload flag since the version is current (successful reload, or no change)
      sessionStorage.removeItem(RELOAD_FLAG);
      // Mark that the initial check is complete
      isInitialCheck.current = false;
      return; // No update needed
    }

    // ── New version detected! The stored hash doesn't match the server's hash ──

    // Check if we already attempted a cache-busted reload during this session
    // (to prevent infinite reload loops if the CDN still serves old content)
    const alreadyTried = sessionStorage.getItem(RELOAD_FLAG) === "1";

    // On the initial page load check: attempt a single cache-busted navigation
    if (
      isInitialCheck.current && // This is the first check after page load
      !hasAttemptedReload.current && // Haven't attempted a reload in this component lifecycle
      !alreadyTried // Haven't attempted a reload in this browser session
    ) {
      // First load & version is stale → navigate with cache-bust.
      // We do NOT update localStorage yet. After the navigate:
      //   - If the fresh HTML loads → new code runs, hashes match → OK
      //   - If CDN still serves old HTML → same old code runs, detects
      //     mismatch again, but sessionStorage flag prevents a loop →
      //     falls through to banner below.
      // Mark that we've attempted a reload to prevent doing it again
      hasAttemptedReload.current = true;
      // Set the session flag so the next page load knows a reload was already tried
      sessionStorage.setItem(RELOAD_FLAG, "1");
      // Perform the cache-busted navigation (replaces current page)
      navigateFresh();
      return; // Execution stops here as the page will navigate away
    }

    // If we reach here, either:
    // - This is a mid-session update (periodic check found a new version), or
    // - A cache-busted reload was already attempted but the CDN still served stale HTML.
    // In both cases: save the new hash and show the user a non-intrusive update banner.
    localStorage.setItem(STORAGE_KEY, newHash);
    // Clear the reload flag since we're now handling the update via the banner
    sessionStorage.removeItem(RELOAD_FLAG);
    // Show the "new version available" banner to prompt the user to refresh
    setShowBanner(true);
  }, []); // No dependencies: the callback reads from refs and closures, not from state

  // Effect: set up the version checking lifecycle — initial check, periodic polling, and visibility listener
  useEffect(() => {
    // Perform the initial version check immediately on mount
    checkVersion();

    // Set up a periodic interval to check for new versions every CHECK_INTERVAL_MS (5 minutes)
    const interval = setInterval(() => {
      // Mark that this is not the initial check — mid-session checks show a banner instead of auto-reloading
      isInitialCheck.current = false;
      // Perform the version check
      checkVersion();
    }, CHECK_INTERVAL_MS);

    // Handler for the Page Visibility API — checks for updates when the user returns to the tab
    const handleVisibility = () => {
      // Only check when the tab becomes visible (user switched back to this tab)
      if (document.visibilityState === "visible") {
        // Mark as non-initial since the page was already loaded
        isInitialCheck.current = false;
        // Check for a new version
        checkVersion();
      }
    };
    // Register the visibility change listener on the document
    document.addEventListener("visibilitychange", handleVisibility);

    // Cleanup: clear the interval and remove the event listener when the component unmounts
    return () => {
      // Stop the periodic version check interval
      clearInterval(interval);
      // Remove the visibility change event listener to prevent memory leaks
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [checkVersion]); // Depend on checkVersion (stable due to useCallback with empty deps)

  // If the banner is not being shown, render nothing
  if (!showBanner) return null;

  // Render the "new version available" notification banner
  return (
    // Banner container: fixed at the bottom-center of the viewport with high z-index
    <div
      // ARIA role "alert" for accessibility — screen readers will announce this immediately
      role="alert"
      // Tailwind classes: fixed bottom positioning, centered horizontally via translate,
      // very high z-index, flex layout, rounded corners, padding, large shadow,
      // blue background with white text, slide-in animation from below
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999]
        flex items-center gap-3 rounded-xl px-5 py-3 shadow-2xl
        bg-blue-600 text-white text-sm font-medium
        animate-in slide-in-from-bottom-4 duration-300"
    >
      {/* Notification text with a refresh emoji, in French: "A new version is available." */}
      <span>🔄 Une nouvelle version est disponible.</span>
      {/* "Refresh" button: triggers a cache-busted page navigation to load the new version */}
      <button
        // On click, call navigateFresh() to reload the page with a cache-busted URL
        onClick={() => navigateFresh()}
        // Styled as a semi-transparent white button with hover effect
        className="rounded-lg bg-white/20 hover:bg-white/30 px-3 py-1
          text-white font-semibold transition-colors"
      >
        {/* French: "Refresh" — prompts the user to reload for the new version */}
        Actualiser
      </button>
      {/* Close/dismiss button: hides the banner without refreshing */}
      <button
        // On click, hide the banner by setting showBanner to false
        onClick={() => setShowBanner(false)}
        // ARIA label in French "Close" for accessibility (the button only shows an X symbol)
        aria-label="Fermer"
        // Subtle opacity with hover effect for the dismiss action
        className="ml-1 opacity-70 hover:opacity-100 transition-opacity"
      >
        {/* Unicode multiplication sign used as a close (X) icon */}✕
      </button>
    </div>
  );
};

// Default export so this component can be lazily imported or used in route definitions
export default VersionChecker;
