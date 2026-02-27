// Import React core library along with useEffect (side-effects) and useMemo (memoisation) hooks
import React, { useEffect, useMemo } from "react";
// Import useNavigate from React Router to programmatically change routes
import { useNavigate } from "react-router-dom";
// Import icon components from lucide-react used in the page UI:
// - ArrowRight: validate/next button icon
// - ChevronLeft: back navigation icon
// - Home: home navigation icon
// - Scale: legal/balance icon for prestation compensatoire sections
// - CheckCircle: checkmark icon for the recap header
import {
  ArrowRight,
  ChevronLeft,
  Home,
  Scale,
  CheckCircle,
} from "lucide-react";
// Import the SEO component for meta tags and the breadcrumbJsonLd helper for structured data
import { SEO, breadcrumbJsonLd } from "../components/SEO";
// Import the AdUnit component to display advertisements within the page
import { AdUnit } from "../components/AdUnit";
// Import utilities and types from the divorce form store:
// - loadFormData: retrieves all saved form data from localStorage
// - computeAge: computes someone's age from their birth date
// - buildFinancialPayload: transforms form data into the payload expected by the dashboard
// - getCalculationChoices: retrieves which calculations/methods the user selected
// - getPreviousPage: determines the previous page path for back navigation
// - getPageIndex / getTotalPages: used to render the progress bar
// - DivorceFormData: TypeScript type describing the shape of all form fields
import {
  loadFormData,
  computeAge,
  buildFinancialPayload,
  getCalculationChoices,
  getPreviousPage,
  getPageIndex,
  getTotalPages,
  type DivorceFormData,
} from "../services/divorceFormStore";

// ---------------------------------------------------------------------------
// Helpers — pure utility functions used to format values for display
// ---------------------------------------------------------------------------

// formatDate: converts an ISO date string to a human-readable French date.
// Returns an em-dash "—" when the input is empty, and falls back to the raw string on parse error.
const formatDate = (d: string) => {
  // If the date string is falsy (empty/undefined), return a dash placeholder
  if (!d) return "—";
  try {
    // Use the Intl.DateTimeFormat API to produce a localised French date, e.g. "15 mars 2024"
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric", // Day of the month as a number
      month: "long", // Full month name in French
      year: "numeric", // Four-digit year
    }).format(new Date(d)); // Parse the ISO string into a Date object before formatting
  } catch {
    // If parsing/formatting fails, return the raw input as a fallback
    return d;
  }
};

// formatCurrency: formats a number (or numeric string) as a French-locale currency string with " €" suffix.
// Returns "—" when the value is null/NaN/undefined.
const formatCurrency = (n: number | string) => {
  // Coerce string values to numbers; keep numbers as-is
  const num = typeof n === "string" ? parseFloat(n) : n;
  // Guard against NaN or undefined — but allow 0 as a valid value
  if (!num && num !== 0) return "—";
  // Format with French locale (spaces as thousands separator) and append the euro sign
  return num.toLocaleString("fr-FR") + " €";
};

// custodyLabel: maps the internal custody-type key to a user-friendly French label.
// "classic" → standard visitation rights, "alternating" → 50/50 shared custody,
// "reduced" → extended visitation (less common arrangement). Falls back to the raw string.
const custodyLabel = (t: string) =>
  t === "classic"
    ? "Classique (Droit de visite)"
    : t === "alternating"
      ? "Alternée (50/50)"
      : t === "reduced"
        ? "Réduite (Élargi)"
        : t; // Return the raw value if none of the known keys match

// ---------------------------------------------------------------------------
// Row component: renders a single key→value pair as a horizontal line.
// Used inside Section cards to display individual data points (e.g. "Date de mariage → 15 mars 2024").
// ---------------------------------------------------------------------------
// Props: label (left-side description) and value (right-side formatted data, can be any ReactNode)
const Row: React.FC<{ label: string; value: React.ReactNode }> = ({
  label,
  value,
}) => (
  // Flex row with vertical padding and a subtle bottom border; the last row removes its border
  <div className="flex items-baseline justify-between py-2 border-b border-white/5 last:border-0">
    {/* Left side: data label in small gray text */}
    <span className="text-xs text-gray-400">{label}</span>
    {/* Right side: data value in monospace font for numeric alignment, themed primary colour */}
    <span className="text-sm font-mono text-[var(--text-primary)] text-right">
      {value}
    </span>
  </div>
);

// ---------------------------------------------------------------------------
// Section component: a themed card that groups related Row components under
// a category + subcategory header (e.g. "Prestation Compensatoire — Mariage").
// ---------------------------------------------------------------------------
// Props:
//   icon        – a React element (e.g. <Scale />) displayed before the header
//   color       – Tailwind text-colour class applied to the icon and header
//   category    – primary category name (left of the dash)
//   subcategory – secondary label (right of the dash)
//   children    – Row elements rendered inside the glass card
const Section: React.FC<{
  icon: React.ReactNode;
  color: string;
  category: string;
  subcategory: string;
  children: React.ReactNode;
}> = ({ icon, color, category, subcategory, children }) => (
  // Outer wrapper with vertical spacing and a CSS fade-in animation
  <div className="space-y-3 animate-fade-in">
    {/* Header row: icon + "CATEGORY — SUBCATEGORY" in uppercase with wide letter-spacing */}
    <div className="flex items-center space-x-2">
      {/* Icon container coloured via the dynamic class */}
      <div className={color}>{icon}</div>
      {/* Category label styled bold, uppercase, with the same colour */}
      <span className={`text-xs uppercase tracking-widest font-bold ${color}`}>
        {category} — {subcategory}
      </span>
    </div>
    {/* Glass-morphism card body that holds all child Row components */}
    <div className="p-5 space-y-0 border glass-panel rounded-2xl border-white/10">
      {children}
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Main component — RecapitulatifPage
// This is the summary/recap page that displays ALL data the user has entered
// across previous form steps. It allows them to review and then validate
// before proceeding to the calculation dashboard.
// ---------------------------------------------------------------------------

const RecapitulatifPage: React.FC = () => {
  // Hook to navigate programmatically between routes
  const navigate = useNavigate();

  // The route path for this page — used to derive progress bar position and back-navigation
  const currentPath = "/recapitulatif";
  // Index of this page in the overall wizard flow (0-based), used for the progress dots
  const pageIdx = getPageIndex(currentPath);
  // Total number of pages in the wizard, used to render the correct number of progress dots
  const totalPages = getTotalPages();

  // Load the saved form data from localStorage once on mount (memoised to avoid re-parsing)
  const formData: DivorceFormData = useMemo(() => loadFormData(), []);
  // Load the user's calculation method choices (which calculations & which doctrinal methods)
  const choices = useMemo(() => getCalculationChoices(), []);

  // Determine whether the user selected the "prestation compensatoire" (compensatory allowance) calculation
  const hasPC = choices.selectedCalcs.includes("prestationCompensatoire");

  // Check if the Axel-Depondt method is among the selected PC methods.
  // This method requires additional debtor/creditor projection fields.
  const showAxelDepondt =
    hasPC &&
    (choices.selectedMethods.prestationCompensatoire || []).includes(
      "axelDepondt",
    );

  // The "pilote" or "insee" methods require net income data for both spouses
  const pcNeedsNetIncome =
    hasPC &&
    ((choices.selectedMethods.prestationCompensatoire || []).includes(
      "pilote",
    ) ||
      (choices.selectedMethods.prestationCompensatoire || []).includes(
        "insee",
      ));

  // The INSEE method additionally requires family composition data (children count, ages, custody)
  const pcNeedsFamilyData =
    hasPC &&
    (choices.selectedMethods.prestationCompensatoire || []).includes("insee");

  // Scroll the window to the top when this page mounts, so the user starts at the top of the recap
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []); // Empty dependency array ensures this runs only once on mount

  // Handler called when the user clicks "Valider & Calculer".
  // It converts the form data into the financial payload format expected by the DashboardPage,
  // persists it to localStorage, then navigates through a transition animation to the dashboard.
  const handleValidate = () => {
    // Build the financial payload (income, patrimony, children, etc.) from raw form data
    const payload = buildFinancialPayload(formData);
    // Store the payload in localStorage so DashboardPage can read it on mount
    localStorage.setItem("financialData", JSON.stringify(payload));
    // Navigate to the interstitial transition page which will then redirect to /dashboard
    navigate("/transition?to=/dashboard");
  };

  return (
    // Root container: full dynamic-viewport height, deep-space background, flex column, white text
    <div className="h-[100dvh] bg-[var(--color-deep-space)] flex flex-col relative text-white overflow-hidden">
      {/* SEO component injects <title>, <meta description>, and JSON-LD breadcrumb structured data
          so search engines understand this page's position in the site hierarchy */}
      <SEO
        title="Récapitulatif — Simulation Divorce"
        description="Vérifiez toutes les informations saisies avant de lancer le calcul."
        path="/"
        jsonLd={breadcrumbJsonLd([
          { name: "Accueil", path: "/" },
          { name: "Récapitulatif", path: "/recapitulatif" },
        ])}
      />

      {/* Background Ambience — a large blurred cyan circle in the top-right corner
          to give the page a subtle glowing/atmospheric effect */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--color-plasma-cyan)]/10 rounded-full blur-[100px]" />

      {/* Header bar — sticky at top with backdrop blur, contains back button, page title, and home button */}
      <div
        className="sticky top-0 z-50 flex items-center justify-between p-4 border-b bg-black/20 backdrop-blur-md border-white/5"
        // Extra top padding accounts for the device safe-area (e.g. notch on mobile)
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1rem)" }}
      >
        {/* Back button — navigates to the previous page in the wizard flow */}
        <button
          onClick={() => navigate(getPreviousPage(currentPath))}
          className="flex items-center justify-center p-2 rounded-full hover:bg-white/10 group"
        >
          {/* Chevron-left icon, turns white on hover via the group utility */}
          <ChevronLeft className="w-5 h-5 text-gray-400 group-hover:text-white" />
        </button>
        {/* Page title in the centre of the header */}
        <h1 className="text-sm font-bold tracking-widest uppercase text-glow">
          Récapitulatif
        </h1>
        {/* Home button — allows quick navigation back to the landing page */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center justify-center p-2 rounded-full hover:bg-white/10 group"
          title="Accueil"
        >
          {/* Home icon, with same hover-white treatment */}
          <Home className="w-5 h-5 text-gray-400 group-hover:text-white" />
        </button>
      </div>

      {/* Progress dots + subtitle section — sits between the header and the scrollable content */}
      <div className="z-10 px-4 pt-4 pb-2 sm:px-6 sm:pt-6">
        {/* Progress bar: a row of small horizontal pills, one per wizard page */}
        <div className="flex justify-end mb-6">
          <div className="flex space-x-1">
            {/* Generate one dot per page; highlight the current page in cyan, others in the border colour */}
            {Array.from({ length: totalPages }).map((_, i) => (
              <div
                key={i}
                className={`w-8 h-1 rounded-full ${i === pageIdx ? "bg-[var(--color-plasma-cyan)]" : "bg-[var(--border-color)]"}`}
              />
            ))}
          </div>
        </div>
        {/* Section title with a checkmark icon indicating the data entry is complete */}
        <div className="flex items-center mb-2 space-x-3">
          {/* Green-cyan check-circle icon */}
          <CheckCircle className="w-6 h-6 text-[var(--color-plasma-cyan)]" />
          {/* Large bold heading: "Récapitulatif" (Summary) */}
          <h1 className="text-2xl font-bold text-white text-glow">
            Récapitulatif
          </h1>
        </div>
        {/* Short instructional subtitle — tells the user to review before calculating */}
        <p className="text-sm text-gray-400">
          Vérifiez vos informations avant de lancer le calcul.
        </p>
        {/* Detailed explanatory paragraph about the three doctrinal calculation methods used:
            - Tiers Pondéré (Weighted Third: net income differential × duration × age)
            - INSEE (OECD consumption units)
            - Calcul PC / Axel-Depondt (gross income projected over 8 years)
            Also states results are indicative; only the family court judge (JAF) sets the final amount. */}
        <p className="mt-2 text-xs leading-relaxed text-gray-500">
          Votre simulation croise jusqu'à trois méthodes doctrinales : Tiers
          Pondéré (différentiel de revenus nets × durée × âge), INSEE (unités de
          consommation OCDE) et Calcul PC (revenus bruts projetés sur 8 ans).
          Les résultats constituent une estimation indicative — seul le JAF fixe
          souverainement le montant de la prestation compensatoire.
        </p>
      </div>

      {/* Scrollable content area — takes remaining vertical space, fades in, hides scrollbar */}
      <div className="relative z-10 flex-1 px-4 space-y-6 overflow-y-auto sm:px-6 pb-28 sm:pb-32 animate-fade-in scrollbar-hide">
        {/* ════════════════════════════════════════ */}
        {/* PRESTATION COMPENSATOIRE sections        */}
        {/* Only rendered if the user chose the PC calculation */}
        {/* ════════════════════════════════════════ */}
        {hasPC && (
          <>
            {/* Section: Marriage dates — shows when the marriage started and ended,
                plus the computed duration in years */}
            <Section
              icon={<Scale className="w-4 h-4" />}
              color="text-teal-400"
              category="Prestation Compensatoire"
              subcategory="Mariage"
            >
              {/* Row: formatted marriage date */}
              <Row
                label="Date de mariage"
                value={formatDate(formData.marriageDate)}
              />
              {/* Row: divorce/separation date — if not provided, indicate today's date is used */}
              <Row
                label="Date de divorce / séparation"
                value={
                  formData.divorceDate
                    ? formatDate(formData.divorceDate)
                    : "Non renseignée (date du jour)"
                }
              />
              {/* Row: computed marriage duration in years (only shown when a marriage date exists).
                  Calculation: (divorce-or-now timestamp − marriage timestamp) / ms-per-year, rounded */}
              {formData.marriageDate && (
                <Row
                  label="Durée du mariage"
                  value={`${Math.max(
                    0,
                    Math.round(
                      ((formData.divorceDate
                        ? new Date(formData.divorceDate).getTime()
                        : Date.now()) -
                        new Date(formData.marriageDate).getTime()) /
                        (1000 * 60 * 60 * 24 * 365.25),
                    ),
                  )} ans`}
                />
              )}
            </Section>

            {/* Section: Identity — birth dates and computed ages of both parties.
                "Créancier" = creditor (the spouse who would receive the compensatory allowance)
                "Débiteur" = debtor (the spouse who would pay) */}
            <Section
              icon={<Scale className="w-4 h-4" />}
              color="text-teal-400"
              category="Prestation Compensatoire"
              subcategory="Identité"
            >
              {/* Row: Creditor's birth date and current age */}
              <Row
                label="Créancier"
                value={
                  formData.myBirthDate
                    ? `${formatDate(formData.myBirthDate)} (${computeAge(formData.myBirthDate)} ans)`
                    : "—"
                }
              />
              {/* Row: Debtor's birth date and current age */}
              <Row
                label="Débiteur"
                value={
                  formData.spouseBirthDate
                    ? `${formatDate(formData.spouseBirthDate)} (${computeAge(formData.spouseBirthDate)} ans)`
                    : "—"
                }
              />
            </Section>

            {/* Section: Net income — only displayed when the pilote or INSEE method is selected,
                because those methods need net income figures for both spouses */}
            {pcNeedsNetIncome && (
              <Section
                icon={<Scale className="w-4 h-4" />}
                color="text-teal-400"
                category="Prestation Compensatoire"
                subcategory="Revenus"
              >
                {/* Row: Creditor's net social income (revenu net social) */}
                <Row
                  label="Net Social Créancier"
                  value={formatCurrency(formData.myIncome)}
                />
                {/* Row: Debtor's income */}
                <Row
                  label="Revenu Débiteur"
                  value={formatCurrency(formData.spouseIncome)}
                />
              </Section>
            )}

            {/* Section: Debtor projections — only displayed for the Axel-Depondt method,
                which projects gross income over 8 years to compute the compensatory allowance */}
            {showAxelDepondt && (
              <Section
                icon={<Scale className="w-4 h-4" />}
                color="text-teal-400"
                category="Prestation Compensatoire"
                subcategory="Projections Débiteur"
              >
                {/* Row: Debtor's gross income with mode indicator (annual or monthly) */}
                <Row
                  label="Revenu brut"
                  value={`${formatCurrency(formData.debtorGrossIncome)} (${formData.debtorIncomeMode === "annual" ? "annuel" : "mensuel"})`}
                />
                {/* Row: Debtor's monthly child support contribution */}
                <Row
                  label="Contribution mensuelle enfants"
                  value={formatCurrency(formData.debtorChildContribution)}
                />
                {/* Conditional block: if the debtor has a foreseeable future income change,
                    display the projected income, projected child contribution, and target date */}
                {parseFloat(formData.debtorFutureIncome) > 0 && (
                  <>
                    {/* Row: Expected future pre-tax income */}
                    <Row
                      label="Revenu prévisible avant impôts"
                      value={formatCurrency(formData.debtorFutureIncome)}
                    />
                    {/* Row: Expected future child contribution */}
                    <Row
                      label="Contribution prévisible enfants"
                      value={formatCurrency(
                        formData.debtorFutureChildContribution,
                      )}
                    />
                    {/* Row: Date when the income change is expected */}
                    <Row
                      label="Date prévisible"
                      value={
                        formData.debtorChangeDate
                          ? formatDate(formData.debtorChangeDate)
                          : "—"
                      }
                    />
                  </>
                )}
                {/* Row: Debtor's non-income-producing personal assets (e.g. real estate) */}
                <Row
                  label="Patrimoine propre non producteur"
                  value={formatCurrency(formData.debtorPropertyValue)}
                />
                {/* Row: Annual yield rate applied to the debtor's assets (default 0%) */}
                <Row
                  label="Taux rendement annuel"
                  value={`${formData.debtorPropertyYield || "0"} %`}
                />
              </Section>
            )}

            {/* Section: Creditor projections — mirrors the debtor section above,
                plus two additional fields specific to the creditor's retirement situation */}
            {showAxelDepondt && (
              <Section
                icon={<Scale className="w-4 h-4" />}
                color="text-teal-400"
                category="Prestation Compensatoire"
                subcategory="Projections Créancier"
              >
                {/* Row: Creditor's gross income with annual/monthly indicator */}
                <Row
                  label="Revenu brut"
                  value={`${formatCurrency(formData.creditorGrossIncome)} (${formData.creditorIncomeMode === "annual" ? "annuel" : "mensuel"})`}
                />
                {/* Row: Creditor's monthly child support contribution */}
                <Row
                  label="Contribution mensuelle enfants"
                  value={formatCurrency(formData.creditorChildContribution)}
                />
                {/* Conditional block: if the creditor has a foreseeable future income change */}
                {parseFloat(formData.creditorFutureIncome) > 0 && (
                  <>
                    {/* Row: Expected future pre-tax income for the creditor */}
                    <Row
                      label="Revenu prévisible avant impôts"
                      value={formatCurrency(formData.creditorFutureIncome)}
                    />
                    {/* Row: Expected future child contribution for the creditor */}
                    <Row
                      label="Contribution prévisible enfants"
                      value={formatCurrency(
                        formData.creditorFutureChildContribution,
                      )}
                    />
                    {/* Row: Date when the creditor's income change is expected */}
                    <Row
                      label="Date prévisible"
                      value={
                        formData.creditorChangeDate
                          ? formatDate(formData.creditorChangeDate)
                          : "—"
                      }
                    />
                  </>
                )}
                {/* Row: Creditor's non-income-producing personal assets */}
                <Row
                  label="Patrimoine propre non producteur"
                  value={formatCurrency(formData.creditorPropertyValue)}
                />
                {/* Row: Annual yield rate applied to the creditor's assets */}
                <Row
                  label="Taux rendement annuel"
                  value={`${formData.creditorPropertyYield || "0"} %`}
                />
                {/* Row: Number of years the creditor did not contribute to retirement
                    (e.g. stayed home to raise children) — important for disparity analysis */}
                <Row
                  label="Années sans cotisations retraite"
                  value={`${formData.creditorRetirementGapYears || "0"} ans`}
                />
                {/* Row: Creditor's income before they stopped working,
                    used to estimate the career sacrifice */}
                <Row
                  label="Revenu avant cessation d'activité"
                  value={formatCurrency(formData.creditorPreRetirementIncome)}
                />
              </Section>
            )}

            {/* Section: Family composition — only needed by the INSEE method,
                which uses OECD consumption units that depend on the number and ages of children */}
            {pcNeedsFamilyData && (
              <Section
                icon={<Scale className="w-4 h-4" />}
                color="text-teal-400"
                category="Prestation Compensatoire"
                subcategory="Famille"
              >
                {/* Row: Total number of dependent children */}
                <Row label="Nombre d'enfants" value={formData.childrenCount} />
                {/* Row: Individual ages of each child (only shown when there are children with ages entered) */}
                {formData.childrenCount > 0 &&
                  formData.childrenAges.length > 0 && (
                    <Row
                      label="Âges des enfants"
                      value={formData.childrenAges
                        .slice(0, formData.childrenCount) // Only take as many ages as there are children
                        .map((a) => `${a} ans`) // Format each age with " ans" suffix
                        .join(", ")} // Join with commas for display
                    />
                  )}
                {/* Row: Custody arrangement type (classic, alternating, or reduced) — only when children exist */}
                {formData.childrenCount > 0 && (
                  <Row
                    label="Type de garde"
                    value={custodyLabel(formData.custodyType)}
                  />
                )}
              </Section>
            )}
          </>
          // End of the hasPC conditional fragment
        )}

        {/* Info note — a subtle tip box reminding the user they can go back to edit,
            and that clicking "Valider & Calculer" will launch the simulation */}
        <div className="px-4 py-3 rounded-xl border border-white/5 bg-white/[0.02]">
          <p className="text-xs leading-relaxed text-gray-500">
            💡 Vous pouvez revenir en arrière pour modifier les informations
            saisies. Le bouton « Valider & Calculer » lancera le calcul avec les
            données ci-dessus.
          </p>
        </div>

        {/* Native ad unit — placed at the bottom of the scrollable content for monetisation */}
        <div className="flex justify-center pb-4">
          <AdUnit type="native" className="w-full" />
        </div>
      </div>

      {/* Footer — fixed at the bottom of the viewport with a gradient fade-up effect,
          ensuring the validate button is always visible regardless of scroll position */}
      <div
        className="fixed bottom-0 left-0 w-full p-3 sm:p-6 bg-gradient-to-t from-[var(--color-deep-space)] to-transparent z-20"
        // Extra bottom padding respects the device safe-area (e.g. home indicator on iOS)
        style={{
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.75rem)",
        }}
      >
        {/* Primary CTA button — "Valider & Calculer" (Validate & Calculate).
            On click it builds the financial payload, saves to localStorage, and navigates to the dashboard.
            Styled with the plasma-cyan accent, a glowing box shadow, and a press-scale animation. */}
        <button
          onClick={handleValidate}
          className="w-full max-w-md mx-auto bg-[var(--color-plasma-cyan)] hover:bg-[var(--accent-hover)] text-white font-bold py-3 sm:py-5 rounded-2xl shadow-[0_0_30px_rgba(34,211,238,0.3)] transition-all flex items-center justify-center space-x-2 sm:space-x-3 group active:scale-95"
          style={{ color: "#ffffff" }}
        >
          {/* Button label — uppercase tracking for a sleek UI feel */}
          <span className="text-xs tracking-wider uppercase sm:text-sm sm:tracking-widest">
            Valider & Calculer
          </span>
          {/* Arrow icon — slides right on hover for a visual "proceed" cue */}
          <ArrowRight className="w-4 h-4 transition-transform sm:w-5 sm:h-5 group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  );
};

// Default export of the RecapitulatifPage component so it can be lazy-loaded or imported by the router
export default RecapitulatifPage;
