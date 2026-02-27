/**
 * Extended identity data for the lawyer (Pro) app.
 *
 * These fields are persisted separately from DivorceFormData so the
 * existing client flow is never affected. They are only used by the
 * Word document generator and the lawyer-specific recap page.
 */

// Import the default yield rate string from legalEngine — single source of truth
import { DEFAULT_YIELD_RATE_STR } from "./legalEngine";

// Interface representing identity information for one party (debtor or creditor).
// These fields are collected on the lawyer-specific identity pages.
export interface PartyIdentity {
  // Date of birth in ISO format (YYYY-MM-DD), used to compute age and life expectancy
  birthDate: string; // ISO date
  // Full postal address of the party, included in the generated Word document header
  fullAddress: string;
}

// Interface grouping all case-specific data that the lawyer enters
// beyond the standard divorce calculation fields.
export interface LawyerCaseData {
  /** Débiteur identity */
  // Identity data for the debtor (the party who pays the compensatory allowance)
  debtor: PartyIdentity;
  /** Créancier identity */
  // Identity data for the creditor (the party who receives the compensatory allowance)
  creditor: PartyIdentity;
  /** Date of evaluation (auto-filled, editable) */
  // The reference date for the evaluation, defaulting to today; the lawyer can override it
  evaluationDate: string;
  /** Estimated annual yield rate (%) */
  // Annual yield rate used in property-based income calculations (e.g., 3% default)
  yieldRate: string;
}

// localStorage key used to persist the lawyer case data.
// Kept separate from "divorceFormData" to avoid conflicts with the client flow.
const STORAGE_KEY = "lawyerCaseData";

// Default empty party identity — all fields are empty strings.
// Used as a template when initializing or resetting case data.
const EMPTY_PARTY: PartyIdentity = {
  birthDate: "", // No birth date set by default
  fullAddress: "", // No address set by default
};

// Default empty case data — debtor and creditor start with empty identities,
// the evaluation date defaults to today's date, and the yield rate defaults to 3%.
const EMPTY_CASE: LawyerCaseData = {
  debtor: { ...EMPTY_PARTY }, // Spread creates a fresh copy so mutations don't leak
  creditor: { ...EMPTY_PARTY }, // Spread creates another independent copy
  evaluationDate: new Date().toISOString().split("T")[0], // Today in YYYY-MM-DD format
  yieldRate: DEFAULT_YIELD_RATE_STR, // Default annual yield rate (common legal assumption in France)
};

// Loads the lawyer case data from localStorage.
// Returns the persisted data merged with defaults, ensuring all fields exist
// even if the stored data is from an older schema version.
export function loadCaseData(): LawyerCaseData {
  try {
    // Attempt to read the stored JSON string from localStorage
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      // Parse the JSON string back into an object
      const parsed = JSON.parse(saved);
      // Merge with EMPTY_CASE as a fallback for any missing top-level fields,
      // then deep-merge debtor and creditor with EMPTY_PARTY for nested fields.
      return {
        ...EMPTY_CASE,
        ...parsed,
        debtor: { ...EMPTY_PARTY, ...(parsed.debtor || {}) }, // Deep merge debtor
        creditor: { ...EMPTY_PARTY, ...(parsed.creditor || {}) }, // Deep merge creditor
      };
    }
  } catch {
    /* ignore JSON parse errors or localStorage access issues */
  }
  // If nothing was stored or parsing failed, return a fresh copy of defaults
  return {
    ...EMPTY_CASE,
    debtor: { ...EMPTY_PARTY },
    creditor: { ...EMPTY_PARTY },
  };
}

// Saves a partial update to the lawyer case data.
// Merges the provided partial with the current stored state, performing
// a deep merge on the debtor and creditor nested objects.
// Returns the fully merged state after saving.
export function saveCaseData(partial: Partial<LawyerCaseData>): LawyerCaseData {
  // Load the current state so we can merge new values on top
  const current = loadCaseData();
  // Merge top-level fields, then deep-merge debtor and creditor sub-objects
  const merged = {
    ...current,
    ...partial,
    debtor: { ...current.debtor, ...(partial.debtor || {}) }, // Preserve existing debtor fields not in partial
    creditor: { ...current.creditor, ...(partial.creditor || {}) }, // Preserve existing creditor fields not in partial
  };
  // Persist the merged state as a JSON string in localStorage
  localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  // Return the merged state for immediate use by the caller
  return merged;
}

// Removes all lawyer case data from localStorage.
// Called when the lawyer wants to start a fresh case or clear sensitive data.
export function clearCaseData(): void {
  localStorage.removeItem(STORAGE_KEY);
}
