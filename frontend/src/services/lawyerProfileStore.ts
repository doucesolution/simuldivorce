/**
 * Lawyer profile store — persists the lawyer's identity, cabinet info,
 * and logo for inclusion in generated Word documents.
 *
 * Data is stored in localStorage under a dedicated key so it never
 * interferes with the simulation data.
 */

// Interface representing all the fields of a lawyer's professional profile.
// These values are displayed in the header/footer of generated Word documents
// and on the lawyer-specific profile management page.
export interface LawyerProfile {
  /** Lawyer name (e.g. "Maître Jean Dupont") */
  // Full name including honorific, shown prominently on generated documents
  fullName: string;
  /** Email address */
  // Professional contact email, included in document footer for correspondence
  email: string;
  /** Phone number */
  // Professional phone number, included in document footer
  phone: string;
  /** Cabinet / firm name */
  // Name of the law firm or cabinet, displayed under the lawyer's name
  cabinetName: string;
  /** Cabinet address line 1 */
  // Street address of the cabinet, used in the document letterhead
  cabinetAddress: string;
  /** Cabinet city + postal code */
  // City and postal code (e.g., "75008 Paris"), completes the address block
  cabinetCity: string;
  /** SIRET / bar registration number */
  // Official registration number (SIRET or bar number) for legal identification
  barNumber: string;
  /** Base64-encoded logo image (PNG/JPEG) — stored as data URL */
  // The cabinet logo stored as a data URL (e.g., "data:image/png;base64,...").
  // Embedded directly in the generated Word document header.
  logoDataUrl: string;
}

// localStorage key for persisting the lawyer profile.
// Separate from other storage keys to prevent collisions.
const STORAGE_KEY = "lawyerProfile";

// Default empty profile — every field is an empty string.
// Used as a base when no profile has been saved yet or when merging partial updates.
const EMPTY_PROFILE: LawyerProfile = {
  fullName: "", // No name set
  email: "", // No email set
  phone: "", // No phone set
  cabinetName: "", // No cabinet name set
  cabinetAddress: "", // No address set
  cabinetCity: "", // No city set
  barNumber: "", // No registration number set
  logoDataUrl: "", // No logo uploaded
};

// Loads the lawyer profile from localStorage.
// Merges stored data with the empty profile defaults so all fields are guaranteed
// to exist, even if the stored data is from an older version with fewer fields.
export function loadLawyerProfile(): LawyerProfile {
  try {
    // Attempt to retrieve the stored profile JSON from localStorage
    const saved = localStorage.getItem(STORAGE_KEY);
    // If found, parse and merge with defaults (handles missing fields gracefully)
    if (saved) return { ...EMPTY_PROFILE, ...JSON.parse(saved) };
  } catch {
    /* ignore JSON parse errors or storage quota issues */
  }
  // Return a fresh copy of the empty profile if nothing valid was stored
  return { ...EMPTY_PROFILE };
}

// Saves a partial update to the lawyer profile.
// Only the fields provided in `partial` are overwritten; all other fields
// retain their current values. Returns the full merged profile after saving.
export function saveLawyerProfile(
  partial: Partial<LawyerProfile>,
): LawyerProfile {
  // Load the current full profile to merge with
  const current = loadLawyerProfile();
  // Spread-merge: partial values override current, missing fields preserved
  const merged = { ...current, ...partial };
  // Persist the complete merged profile as JSON in localStorage
  localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  // Return the merged profile for immediate use by the caller
  return merged;
}

// Checks whether the minimum required fields of a lawyer profile are filled in.
// Used to gate features like Word export that require lawyer identification.
// The three mandatory fields are: full name, email, and cabinet name.
export function isProfileComplete(profile: LawyerProfile): boolean {
  // Returns true only if all three required fields are non-empty strings
  return !!(profile.fullName && profile.email && profile.cabinetName);
}
