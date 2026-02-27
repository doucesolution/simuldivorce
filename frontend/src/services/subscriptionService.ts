/**
 * Subscription service — manages the lawyer app premium state.
 *
 * In the native app:
 *   - Free tier: shows Google AdSense ads (same as website)
 *   - Premium tier: no ads, full Word export features
 *
 * For now this uses a simple localStorage flag. In production this would
 * integrate with Google Play Billing via a Capacitor plugin.
 *
 * The web version (simuldivorce.fr) always returns "free" and never
 * shows subscription UI.
 */

// Import the platform detection helper to distinguish native app from web.
// Subscription features only apply inside the native (Capacitor) app;
// the web version is always treated as "free" tier.
import { isNativeApp } from "./platform";

// The two subscription tiers:
// - "free": ad-supported, limited export features
// - "premium": no ads, full Word document export, lawyer-specific features
export type SubscriptionTier = "free" | "premium";

// Represents the full subscription state persisted in localStorage
export interface SubscriptionState {
  // Current subscription tier — either "free" or "premium"
  tier: SubscriptionTier;
  // ISO date string indicating when the premium subscription expires, or null if free
  expiresAt: string | null; // ISO date string
  // Whether the user has already used their free trial (prevents re-use)
  trialUsed: boolean;
}

// localStorage key under which the subscription state JSON is stored
const STORAGE_KEY = "subscriptionState";

// Default state used when no subscription data is found in localStorage.
// Users start on the free tier with no expiry and no trial used.
const DEFAULT_STATE: SubscriptionState = {
  tier: "free", // Start on the free (ad-supported) tier
  expiresAt: null, // No expiry since no premium subscription
  trialUsed: false, // Trial has not been consumed yet
};

// Loads the current subscription state from localStorage.
// On the web, always returns the default free state regardless of storage.
// On native, reads localStorage data and checks for subscription expiry.
export function loadSubscription(): SubscriptionState {
  // Web users always get the free tier — no subscription management on the website
  if (!isNativeApp()) return { ...DEFAULT_STATE }; // Web always free
  try {
    // Attempt to read the persisted subscription state from localStorage
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      // Merge saved data with defaults so any missing fields get default values.
      // This handles schema evolution (e.g., new fields added later).
      const state = { ...DEFAULT_STATE, ...JSON.parse(saved) };
      // Check expiry: if the premium subscription has expired, downgrade to free
      if (state.expiresAt && new Date(state.expiresAt) < new Date()) {
        // Subscription has expired — reset to free tier
        state.tier = "free";
        // Clear the expiry date since it's no longer relevant
        state.expiresAt = null;
        // Persist the downgraded state back to localStorage
        saveSubscription(state);
      }
      // Return the (possibly downgraded) subscription state
      return state;
    }
  } catch {
    /* ignore JSON parse errors or storage access issues */
  }
  // Fallback: return default free state if nothing valid was stored
  return { ...DEFAULT_STATE };
}

// Saves a partial subscription state update to localStorage.
// Merges the provided partial data with the current state so callers
// only need to specify the fields they want to change.
// Returns the merged (complete) subscription state after saving.
export function saveSubscription(
  partial: Partial<SubscriptionState>,
): SubscriptionState {
  // Load the current full state first so we can merge with it
  const current = loadSubscription();
  // Merge: new values override current values, unspecified fields are preserved
  const merged = { ...current, ...partial };
  // Persist the merged state as JSON to localStorage
  localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  // Return the merged state so callers can use it immediately
  return merged;
}

/** True if the user should see ads (free tier on native, always on web) */
// On the web, ads are always shown (the website is ad-supported).
// On the native app, ads are shown only for free-tier users.
export function shouldShowAds(): boolean {
  if (!isNativeApp()) return true; // Web version: always ads
  // Native app: show ads only if the user is on the free tier
  return loadSubscription().tier === "free";
}

/** True if user has premium features (Word export, no ads) */
// Premium features include: no ads, full Word document generation,
// and advanced export options. Only available on the native app.
export function isPremium(): boolean {
  // Web users never get premium — it's a native-only feature
  if (!isNativeApp()) return false;
  // Check if the current subscription tier is "premium" (not expired)
  return loadSubscription().tier === "premium";
}

/**
 * Simulate activating premium (for dev/testing).
 * In production this would be triggered by Google Play Billing callback.
 */
// Activates a premium subscription for the specified number of days.
// Sets the expiry date, marks the trial as used, and persists to localStorage.
export function activatePremium(durationDays = 30): void {
  // Calculate the expiration date by adding durationDays to the current date
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + durationDays);
  // Save the updated subscription state with premium tier and computed expiry
  saveSubscription({
    tier: "premium", // Upgrade to premium tier
    expiresAt: expiresAt.toISOString(), // Store expiry as ISO date string
    trialUsed: true, // Mark the trial as consumed so it can't be reused
  });
}

// Deactivates premium by downgrading back to the free tier.
// Clears the expiry date but preserves the trialUsed flag so
// the user cannot re-activate a free trial.
export function deactivatePremium(): void {
  saveSubscription({ tier: "free", expiresAt: null });
}
