/**
 * Shared form data store for the divorce calculation flow.
 *
 * All data-entry pages read/write to the same localStorage key so that
 * information is shared across pages and duplicate questions are avoided.
 */

// Import the default yield rate constant from legalEngine — single source of truth
import { DEFAULT_YIELD_RATE } from "./legalEngine";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

// Main interface holding every field collected from the user during the
// divorce simulation flow. Each page reads and writes a subset of these.
export interface DivorceFormData {
  // ── Marriage information ──

  // Date the marriage was celebrated (ISO YYYY-MM-DD), used to compute marriage duration
  marriageDate: string;
  // Date of divorce or separation (ISO YYYY-MM-DD), used as end date for duration calculation
  divorceDate: string;

  // ── Identity / Ages ──

  // Birth date of the creditor / "me" party (ISO YYYY-MM-DD), used to compute age and age coefficient
  myBirthDate: string;
  // Birth date of the debtor / spouse party (ISO YYYY-MM-DD)
  spouseBirthDate: string;

  // ── Income ──

  // Net monthly income of the creditor (stored as string to handle empty-state in inputs)
  myIncome: string; // Net social créancier (string for empty-state)
  // Net monthly income of the debtor / spouse
  spouseIncome: string; // Revenu débiteur

  // ── Family / Children ──

  // Number of dependent children from the marriage
  childrenCount: number;
  // Array of ages for each child (used by OECD-modified consumption unit calculation)
  childrenAges: number[];
  // Custody arrangement type: "classic" (sole), "alternating" (shared 50/50), or "reduced"
  custodyType: string; // "classic" | "alternating" | "reduced"

  // ── Detailed PC Calculation — Debtor projections ──

  // Debtor's gross income before tax (used by the Axel-Depondt detailed method)
  debtorGrossIncome: string;
  // Whether the debtor income is entered as "monthly" or "annual"
  debtorIncomeMode: string; // "monthly" | "annual"
  // Monthly child support contribution paid by the debtor
  debtorChildContribution: string;
  // Debtor's expected future gross income (after a planned change, e.g., new job)
  debtorFutureIncome: string;
  // Debtor's expected future child contribution (after children become independent)
  debtorFutureChildContribution: string;
  // Date when the debtor's income change is expected to take effect (ISO YYYY-MM-DD)
  debtorChangeDate: string;
  // Total value of real estate / property owned by the debtor (€)
  debtorPropertyValue: string;
  // Annual yield rate (%) of the debtor's property (e.g., rental income)
  debtorPropertyYield: string;

  // ── Detailed PC Calculation — Creditor projections ──

  // Creditor's gross income before tax
  creditorGrossIncome: string;
  // Whether the creditor income is entered as "monthly" or "annual"
  creditorIncomeMode: string; // "monthly" | "annual"
  // Monthly child support contribution paid by the creditor
  creditorChildContribution: string;
  // Creditor's expected future gross income
  creditorFutureIncome: string;
  // Creditor's expected future child contribution
  creditorFutureChildContribution: string;
  // Date when the creditor's income change is expected (ISO YYYY-MM-DD)
  creditorChangeDate: string;
  // Total value of property owned by the creditor (€)
  creditorPropertyValue: string;
  // Annual yield rate (%) of the creditor's property
  creditorPropertyYield: string;
  // Number of years until the creditor reaches retirement (gap years for pension loss)
  creditorRetirementGapYears: string;
  // Creditor's expected monthly income just before retirement (pension proxy)
  creditorPreRetirementIncome: string;
  // Whether the debtor expects a revenue change ("yes" / "no"), controls future income fields visibility
  debtorExpectsRevenueChange: string;
  // Whether the creditor expects a revenue change ("yes" / "no")
  creditorExpectsRevenueChange: string;
}

// localStorage key under which the entire form state is persisted as JSON
const STORAGE_KEY = "divorceFormData";

// Initial (empty) form state used when no data has been saved yet.
// String fields default to "" and numeric fields to 0 or sensible defaults.
const INITIAL_FORM_DATA: DivorceFormData = {
  marriageDate: "", // No marriage date entered yet
  divorceDate: "", // No divorce date entered yet
  myBirthDate: "", // No creditor birth date entered
  spouseBirthDate: "", // No debtor birth date entered
  myIncome: "", // Empty string = no income entered (not 0)
  spouseIncome: "", // Empty string = no income entered
  childrenCount: 0, // Default: no children
  childrenAges: [], // Empty array: no ages to track
  custodyType: "classic", // Default custody type is sole / classic custody
  debtorGrossIncome: "", // No gross income entered
  debtorIncomeMode: "monthly", // Default to monthly income entry
  debtorChildContribution: "", // No child contribution entered
  debtorFutureIncome: "", // No future income projection
  debtorFutureChildContribution: "", // No future child contribution
  debtorChangeDate: "", // No revenue change date set
  debtorPropertyValue: "", // No property value entered
  debtorPropertyYield: "", // No property yield entered
  creditorGrossIncome: "", // No gross income entered
  creditorIncomeMode: "monthly", // Default to monthly income entry
  creditorChildContribution: "", // No child contribution entered
  creditorFutureIncome: "", // No future income projection
  creditorFutureChildContribution: "", // No future child contribution
  creditorChangeDate: "", // No revenue change date set
  creditorPropertyValue: "", // No property value entered
  creditorPropertyYield: "", // No property yield entered
  creditorRetirementGapYears: "", // No retirement gap years entered
  creditorPreRetirementIncome: "", // No pre-retirement income entered
  debtorExpectsRevenueChange: "no", // Default: debtor does NOT expect a revenue change
  creditorExpectsRevenueChange: "no", // Default: creditor does NOT expect a revenue change
};

// ---------------------------------------------------------------------------
// Load / Save helpers
// ---------------------------------------------------------------------------

// Loads the entire form data from localStorage.
// Merges stored JSON with INITIAL_FORM_DATA so any newly added fields
// (from app updates) automatically get their default values.
export function loadFormData(): DivorceFormData {
  try {
    // Read the raw JSON string from localStorage
    const saved = localStorage.getItem(STORAGE_KEY);
    // If data exists, parse it and merge with defaults to fill any missing fields
    if (saved) return { ...INITIAL_FORM_DATA, ...JSON.parse(saved) };
  } catch {
    /* ignore parse errors — treat as empty */
  }
  // No valid stored data: return a fresh copy of the initial defaults
  return { ...INITIAL_FORM_DATA };
}

// Saves a partial form update to localStorage.
// Merges the provided partial data with the current full state so the caller
// only needs to pass the fields that changed on the current page.
export function saveFormData(partial: Partial<DivorceFormData>): void {
  // Load the current form state to merge with
  const current = loadFormData();
  // Spread-merge: new values override current, unchanged fields preserved
  const merged = { ...current, ...partial };
  // Persist the complete merged form data as JSON
  localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
}

// ---------------------------------------------------------------------------
// Calculation choices helpers
// ---------------------------------------------------------------------------

// Interface representing the user's choices on the Dashboard:
// which calculations to run and which methods to use for each.
export interface CalculationChoices {
  // Array of calculation IDs the user selected (e.g., ["prestationCompensatoire"])
  selectedCalcs: string[];
  // Map from calculation ID to array of method IDs chosen for that calculation
  // (e.g., { prestationCompensatoire: ["tiersPolaire", "insee", "axelDepondt"] })
  selectedMethods: Record<string, string[]>;
}

// Reads the user's calculation selection choices from localStorage.
// These choices drive the navigation flow (which pages to show)
// and which calculation methods to execute on the results page.
export function getCalculationChoices(): CalculationChoices {
  try {
    // Read the stored choices JSON (stored under a separate key from form data)
    const saved = localStorage.getItem("calculationChoices");
    if (saved) {
      // Parse the JSON and extract the two expected properties
      const parsed = JSON.parse(saved);
      return {
        // Default to empty arrays if the properties are missing or malformed
        selectedCalcs: parsed.selectedCalcs || [],
        selectedMethods: parsed.selectedMethods || {},
      };
    }
  } catch {
    /* ignore parse errors */
  }
  // Default: nothing selected yet
  return { selectedCalcs: [], selectedMethods: {} };
}

// ---------------------------------------------------------------------------
// Navigation helpers
// ---------------------------------------------------------------------------

/**
 * Returns the ordered list of data-entry page paths the user must visit,
 * based on the calculations they selected. The last entry is always
 * "/recapitulatif".
 *
 * If Prestation Compensatoire is selected it covers all fields needed by
 * Pension Alimentaire, so the PA page is skipped.
 */
// Builds a dynamic navigation sequence based on what calculations the user
// chose. This allows the guided mode to show only the relevant pages.
export function getNavigationPages(): string[] {
  // Read which calculations the user has selected on the dashboard
  const { selectedCalcs } = getCalculationChoices();
  // Start with an empty array; pages will be pushed in order
  const pages: string[] = [];

  // Check whether the user selected the Prestation Compensatoire calculation
  const hasPC = selectedCalcs.includes("prestationCompensatoire");

  // If PC is selected, add the three data-entry pages for it:
  // 1. Main PC form page
  // 2. Debtor information page (detailed income & projections)
  // 3. Creditor information page (detailed income & projections)
  if (hasPC) {
    pages.push("/prestation-compensatoire"); // Core PC data entry
    pages.push("/informations-debiteur"); // Debtor financial details
    pages.push("/informations-creancier"); // Creditor financial details
  }

  // Always end with the recap page that shows all results
  pages.push("/recapitulatif");

  return pages;
}

// Returns the 0-based index of the given path in the navigation sequence.
// Used by progress indicators to show "Step X of Y".
// Returns -1 if the path is not found in the navigation pages.
export function getPageIndex(currentPath: string): number {
  return getNavigationPages().indexOf(currentPath);
}

// Returns the total number of pages in the navigation sequence.
// Used alongside getPageIndex for "Step X of Y" display.
export function getTotalPages(): number {
  return getNavigationPages().length;
}

// Returns the path of the next page after the current one in the navigation sequence.
// If the current page is the last one (recap), returns "/dashboard" to go back home.
export function getNextPage(currentPath: string): string {
  // Get the full ordered list of navigation pages
  const pages = getNavigationPages();
  // Find the current page's position in the list
  const idx = pages.indexOf(currentPath);
  // If found and not the last page, return the next page in sequence
  if (idx >= 0 && idx < pages.length - 1) return pages[idx + 1];
  // After the last page (recap) or if not found, go to the dashboard
  return "/dashboard"; // After recap → dashboard
}

// Returns the path of the previous page before the current one.
// If the current page is the first data-entry page, returns "/disclaimer"
// (the page that precedes the data-entry flow).
export function getPreviousPage(currentPath: string): string {
  // Get the full ordered list of navigation pages
  const pages = getNavigationPages();
  // Find the current page's position
  const idx = pages.indexOf(currentPath);
  // If not the first page, return the preceding page
  if (idx > 0) return pages[idx - 1];
  // Before the first data page, go back to the disclaimer page
  return "/disclaimer"; // Before first data page
}

// ---------------------------------------------------------------------------
// Age helper
// ---------------------------------------------------------------------------

// Computes the current age in whole years from a birth date string.
// Handles birthday-not-yet-reached logic (subtracts 1 if birthday hasn't occurred this year).
// Returns 0 if the birthDate is empty or invalid.
export function computeAge(birthDate: string): number {
  // Guard: return 0 for empty or missing birth dates
  if (!birthDate) return 0;
  // Parse the birth date string into a Date object
  const birth = new Date(birthDate);
  // Get today's date for comparison
  const today = new Date();
  // Start with the simple year difference
  let age = today.getFullYear() - birth.getFullYear();
  // Calculate the month difference to check if birthday has passed this year
  const m = today.getMonth() - birth.getMonth();
  // If birth month hasn't arrived yet, or it's the birth month but the day hasn't come,
  // subtract 1 because the person hasn't had their birthday this year yet
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  // Ensure we never return a negative age (e.g., for future dates)
  return Math.max(0, age);
}

// ---------------------------------------------------------------------------
// Build FinancialData payload (for DashboardPage)
// ---------------------------------------------------------------------------

// Transforms raw DivorceFormData (string fields from form inputs) into a
// numeric FinancialData-compatible payload that the legalEngine can consume.
// This function parses all string values to numbers with fallback defaults.
export function buildFinancialPayload(
  formData: DivorceFormData, // The raw form data with values as strings
): Record<string, unknown> {
  // Calculate marriage duration as an IIFE (Immediately Invoked Function Expression).
  // This computes the number of full years between marriage date and divorce date (or today).
  const marriageDuration = (() => {
    // Only compute if a marriage date is provided
    if (formData.marriageDate) {
      // Parse the marriage start date
      const start = new Date(formData.marriageDate);
      // Use the divorce date as end, or fall back to today if not yet divorced
      const end = formData.divorceDate
        ? new Date(formData.divorceDate)
        : new Date();
      // Compute the difference in fractional years (using 365.25 to account for leap years)
      const diffYears =
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
      // Only use the value if it's a valid positive number; round to nearest whole year
      if (!isNaN(diffYears) && diffYears > 0) return Math.round(diffYears);
    }
    // Default to 0 if marriage date is missing or invalid
    return 0;
  })();

  // Build and return the flat payload object with all numeric conversions.
  // parseFloat(...) || 0 handles empty strings and NaN by defaulting to 0.
  return {
    // Creditor's net monthly income (parsed from string)
    myIncome: parseFloat(formData.myIncome) || 0,
    // Debtor's net monthly income (parsed from string)
    spouseIncome: parseFloat(formData.spouseIncome) || 0,
    // Raw date strings passed through for the legal engine's yearFrac calculations
    marriageDate: formData.marriageDate,
    divorceDate: formData.divorceDate,
    // Number of children (already a number, but default to 0 for safety)
    childrenCount: formData.childrenCount || 0,
    // Map each child's age to a number, defaulting individual invalid entries to 0
    childrenAges: (formData.childrenAges || []).map((a) => Number(a) || 0),
    // Computed marriage duration in whole years
    marriageDuration,
    // Compute creditor age from birth date, fallback to 42 if unknown (average age in French divorces)
    myAge: computeAge(formData.myBirthDate) || 42,
    // Compute debtor age from birth date, fallback to 44 if unknown
    spouseAge: computeAge(formData.spouseBirthDate) || 44,
    // Custody type string ("classic", "alternating", or "reduced")
    custodyType: formData.custodyType || "classic",
    // Debtor gross income before tax (for the detailed Axel-Depondt method)
    debtorGrossIncome: parseFloat(formData.debtorGrossIncome) || 0,
    // Income entry mode: "monthly" or "annual"
    debtorIncomeMode: formData.debtorIncomeMode || "monthly",
    // Debtor's monthly child support obligation
    debtorChildContribution: parseFloat(formData.debtorChildContribution) || 0,
    // Debtor's projected future gross income (after expected change)
    debtorFutureIncome: parseFloat(formData.debtorFutureIncome) || 0,
    // Debtor's projected future child contribution
    debtorFutureChildContribution:
      parseFloat(formData.debtorFutureChildContribution) || 0,
    // Date when debtor's income change takes effect (ISO string)
    debtorChangeDate: formData.debtorChangeDate,
    // Value of debtor's real estate holdings
    debtorPropertyValue: parseFloat(formData.debtorPropertyValue) || 0,
    // Annual yield rate of debtor's property; defaults to DEFAULT_YIELD_RATE (standard French assumption)
    debtorPropertyYield:
      parseFloat(formData.debtorPropertyYield) || DEFAULT_YIELD_RATE,
    // Creditor gross income before tax
    creditorGrossIncome: parseFloat(formData.creditorGrossIncome) || 0,
    // Creditor income entry mode
    creditorIncomeMode: formData.creditorIncomeMode || "monthly",
    // Creditor's monthly child support obligation
    creditorChildContribution:
      parseFloat(formData.creditorChildContribution) || 0,
    // Creditor's projected future gross income
    creditorFutureIncome: parseFloat(formData.creditorFutureIncome) || 0,
    // Creditor's projected future child contribution
    creditorFutureChildContribution:
      parseFloat(formData.creditorFutureChildContribution) || 0,
    // Date when creditor's income change takes effect
    creditorChangeDate: formData.creditorChangeDate,
    // Value of creditor's real estate holdings
    creditorPropertyValue: parseFloat(formData.creditorPropertyValue) || 0,
    // Annual yield rate of creditor's property; defaults to DEFAULT_YIELD_RATE
    creditorPropertyYield:
      parseFloat(formData.creditorPropertyYield) || DEFAULT_YIELD_RATE,
    // Years remaining until creditor reaches retirement
    creditorRetirementGapYears:
      parseFloat(formData.creditorRetirementGapYears) || 0,
    // Creditor's monthly income just before retirement threshold
    creditorPreRetirementIncome:
      parseFloat(formData.creditorPreRetirementIncome) || 0,
    // Metadata block for auditing and debugging purposes
    metadata: {
      source: "FORM_INPUT", // Indicates data came from user form input (not imported)
      timestamp: Date.now(), // Unix timestamp of when the payload was built
      isHumanVerified: true, // Flag indicating a human entered the data (vs. automated)
    },
  };
}
