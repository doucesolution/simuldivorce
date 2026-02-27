/**
 * Platform detection — distinguishes between:
 *   - Web (simuldivorce.fr)  → Client mode (free, ad-supported)
 *   - Native (Capacitor app) → Lawyer/Pro mode (subscription, Word export)
 *
 * DEV TOGGLE:
 *   Set DEV_LAWYER_MODE to true below to enable lawyer mode on the web.
 *   Set it back to false for normal client mode.
 */

// Import Capacitor core to detect whether the app is running inside a native
// Android/iOS shell or in a standard browser. This is the primary mechanism
// for distinguishing web vs. native builds.
import { Capacitor } from "@capacitor/core";

// Union type representing the two application modes:
// - "client": free web user on simuldivorce.fr (ad-supported, limited features)
// - "lawyer": professional/lawyer mode (subscription-based, Word export, no ads)
export type AppMode = "client" | "lawyer";

/* ──────────────────────────────────────────────
 *  🔧  DEVELOPER SWITCH — change here to toggle
 * ────────────────────────────────────────────── */
// When true, forces lawyer mode even on the web — used during development
// to test lawyer-specific features (Word export, lawyer profile, etc.)
// without needing a native Android build. Set to false for production web builds.
const DEV_LAWYER_MODE = true;

/** True when running inside the native Android shell (Capacitor) */
// Checks Capacitor's internal platform detection to see if we're inside a
// native WebView (Android/iOS) rather than a regular browser.
export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

/** Returns the current mode based on platform or dev flag */
// If running natively OR the dev toggle is on, the app operates in lawyer mode.
// Otherwise, it defaults to client (free web) mode.
export function getAppMode(): AppMode {
  if (isNativeApp() || DEV_LAWYER_MODE) return "lawyer";
  return "client";
}

/** Convenience: true when the user should see lawyer features */
// Shorthand used by UI components to conditionally render lawyer-only
// features like case identity forms, Word export buttons, and profile pages.
export function isLawyerMode(): boolean {
  return getAppMode() === "lawyer";
}

/** Google Play Store URL for the lawyer app */
// Deep link to the published Android app on Google Play, used in CTAs
// on the web version to drive lawyers to install the Pro app.
export const PLAY_STORE_URL = "";
