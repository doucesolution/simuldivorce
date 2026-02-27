// Import React core library along with useState (for local component state) and useEffect (for side effects like scrolling on mount)
import React, { useState, useEffect } from "react";
// Import useNavigate hook from React Router to programmatically navigate between pages in the multi-step form wizard
import { useNavigate } from "react-router-dom";
// Import icon components from the lucide-react icon library, used throughout the form for visual labels and buttons:
// - Calendar: used next to date-of-birth and date picker fields
// - ArrowRight: used on the "Next" navigation button
// - ChevronLeft: used on the "Back" navigation button
// - Home: used on the home/dashboard navigation button
// - User: used as a section icon for debtor identity information
// - Wallet: used next to income and financial input fields
// - TrendingUp: used next to income projection / revenue change fields
// - Percent: used next to the property yield rate input
import {
  Calendar,
  ArrowRight,
  ChevronLeft,
  Home,
  User,
  Wallet,
  TrendingUp,
  Percent,
} from "lucide-react";
// Import the InfoTooltip component which renders a small "?" icon that shows explanatory text on hover/click, used for contextual legal/financial help
import { InfoTooltip } from "../components/InfoTooltip";
// Import the CurrencyInput component which is a specialized numeric input that formats values as currency (with thousands separators, euro symbol, etc.)
import { CurrencyInput } from "../components/CurrencyInput";
// Import GuidedStep (a wrapper that highlights a form section during guided mode) and useGuidedSteps (a hook to manage the guided tour state machine)
import { GuidedStep, useGuidedSteps } from "../components/GuidedTooltip";
// Import GuidedHeaderTour which displays an overlay header tutorial for first-time users walking through the guided mode
import { GuidedHeaderTour } from "../components/GuidedHeaderTour";
// Import SEO component (sets <title>, <meta description>, and structured data) and breadcrumbJsonLd helper (generates JSON-LD breadcrumb schema for search engines)
import { SEO, breadcrumbJsonLd } from "../components/SEO";
// Import AdUnit component that renders an advertisement block (Google AdSense native ad) for monetization
import { AdUnit } from "../components/AdUnit";
// Import utility functions from the central divorce form store service:
// - loadFormData: retrieves previously saved form data from localStorage so the user can resume where they left off
// - saveFormData: persists the current form field values to localStorage
// - computeAge: calculates the person's age from a birth date string (used to display debtor's age)
// - getNextPage: returns the URL of the next page in the multi-step wizard flow
// - getPreviousPage: returns the URL of the previous page in the wizard flow
// - getPageIndex: returns the 0-based index of the current page (used for the progress bar)
// - getTotalPages: returns the total number of pages in the wizard (used for the progress bar)
// - getCalculationChoices: retrieves which calculation methods the user selected earlier (determines which fields to show)
import {
  loadFormData,
  saveFormData,
  computeAge,
  getNextPage,
  getPreviousPage,
  getPageIndex,
  getTotalPages,
  getCalculationChoices,
} from "../services/divorceFormStore";
// Import the default yield rate string from legalEngine — single source of truth for the default %
import {
  DEFAULT_YIELD_RATE,
  DEFAULT_YIELD_RATE_STR,
} from "../services/legalEngine";

// Define the DebiteurPage functional component — this page collects financial and identity data for the debtor spouse
// (the spouse with the higher income who will pay the compensatory allowance — "prestation compensatoire" in French law)
const DebiteurPage: React.FC = () => {
  // Obtain the navigate function from React Router to redirect the user to previous/next pages in the wizard
  const navigate = useNavigate();
  // Define the current route path for this page, used to compute navigation targets and progress bar position
  const currentPath = "/informations-debiteur";
  // Compute the 0-based index of this page within the wizard flow (used to highlight the correct progress dot)
  const pageIdx = getPageIndex(currentPath);
  // Get the total number of pages in the wizard flow (used to render the correct number of progress dots)
  const totalPages = getTotalPages();

  // Load any previously saved form data from localStorage so returning users see their prior inputs pre-filled
  const stored = loadFormData();

  // ── Method flags ──
  // Retrieve which calculation methods the user selected on an earlier page (e.g., "pilote", "insee", "axelDepondt")
  const { selectedMethods } = getCalculationChoices();
  // Extract just the array of methods chosen for "prestation compensatoire" (compensatory allowance) calculation
  const pcMethods = selectedMethods.prestationCompensatoire || [];
  // Determine whether to show the Axel Depondt-specific financial projection fields (gross income, child contributions, property, etc.)
  const showAxelDepondtSteps = pcMethods.includes("axelDepondt");
  // Determine whether to show the Net Social income field — required by the "pilote" and "insee" calculation methods
  const needsNetIncome =
    pcMethods.includes("pilote") || pcMethods.includes("insee");

  // ── Local state: each useState initializes from stored data so the form is pre-filled on revisit ──

  // State for the debtor's date of birth — used to compute their age, which factors into certain calculation methods (e.g., Pilote)
  const [spouseBirthDate, setSpouseBirthDate] = useState(
    stored.spouseBirthDate,
  );
  // State for the debtor's monthly net social income — used by Pilote and INSEE methods to measure income disparity between spouses
  const [spouseIncome, setSpouseIncome] = useState(stored.spouseIncome);
  // State for the "no income" checkbox — when checked, the debtor's income is forced to "0" and the input is disabled
  const [noIncomeDebiteur, setNoIncomeDebiteur] = useState(
    stored.spouseIncome === "0",
  );

  // State for the debtor's gross (pre-tax) income — used by the Axel Depondt / "Calcul PC" method which projects income over 8 years
  const [debtorGrossIncome, setDebtorGrossIncome] = useState(
    stored.debtorGrossIncome,
  );
  // State for the income entry mode toggle: "monthly" or "annual" — lets the user choose their preferred input format
  const [debtorIncomeMode, setDebtorIncomeMode] = useState(
    stored.debtorIncomeMode || "monthly",
  );
  // State for the debtor's monthly child support contribution amount — deducted from disposable income in calculations
  const [debtorChildContribution, setDebtorChildContribution] = useState(
    stored.debtorChildContribution,
  );
  // State for the debtor's expected future monthly gross income (after an anticipated change like retirement or job loss)
  const [debtorFutureIncome, setDebtorFutureIncome] = useState(
    stored.debtorFutureIncome,
  );
  // State for the debtor's expected future child contribution after the revenue change event
  const [debtorFutureChildContribution, setDebtorFutureChildContribution] =
    useState(stored.debtorFutureChildContribution);
  // State for the date when the debtor expects the revenue change to occur (e.g., retirement date)
  const [debtorChangeDate, setDebtorChangeDate] = useState(
    stored.debtorChangeDate,
  );
  // State for the value of the debtor's own non-income-producing property (e.g., unrented real estate, idle savings)
  const [debtorPropertyValue, setDebtorPropertyValue] = useState(
    stored.debtorPropertyValue,
  );
  // State for the estimated annual yield rate on the debtor's non-productive property — defaults to DEFAULT_YIELD_RATE per legal convention
  const [debtorPropertyYield, setDebtorPropertyYield] = useState(
    stored.debtorPropertyYield || DEFAULT_YIELD_RATE_STR,
  );
  // State controlling whether the yield rate input is visible — shown only if the user previously modified it from the default
  const [showYieldInput, setShowYieldInput] = useState(
    stored.debtorPropertyYield !== "" &&
      stored.debtorPropertyYield !== DEFAULT_YIELD_RATE_STR,
  );
  // State for whether the debtor expects a revenue change within the next 8 years — "yes" or "no"; controls visibility of future income fields
  const [debtorExpectsRevenueChange, setDebtorExpectsRevenueChange] = useState(
    stored.debtorExpectsRevenueChange || "no",
  );

  // Initialize the guided tour state machine with 1 step — returns the current step index, advance function, completion flag, and whether guided mode is active
  const { currentStep, advanceStep, allDone, isGuided } = useGuidedSteps(1);

  // On component mount, scroll the page to the top so the user starts at the beginning of the form
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // save() persists all debtor-related form fields to localStorage via the divorceFormStore service,
  // ensuring the user's inputs are preserved if they navigate away and return later
  const save = () => {
    saveFormData({
      spouseBirthDate, // Debtor's date of birth
      spouseIncome, // Debtor's monthly net social income
      debtorGrossIncome, // Debtor's gross (pre-tax) income
      debtorIncomeMode, // Whether the gross income was entered as "monthly" or "annual"
      debtorChildContribution, // Monthly child support contribution
      debtorFutureIncome, // Expected future gross income after anticipated revenue change
      debtorFutureChildContribution, // Expected future child contribution after revenue change
      debtorChangeDate, // Date when the revenue change is expected
      debtorPropertyValue, // Value of non-income-producing property
      debtorPropertyYield, // Estimated yield rate on that property
      debtorExpectsRevenueChange, // Whether a revenue change is anticipated ("yes"/"no")
    });
  };

  // handleNext is called when the user clicks the "Validate and continue" button:
  // it saves the current form data to localStorage, then navigates to the next page in the wizard flow
  const handleNext = () => {
    save();
    navigate(getNextPage(currentPath));
  };

  // ── JSX Render ──
  // The entire page is wrapped in a full-viewport-height flex column container with a dark "deep space" background
  return (
    <div className="h-[100dvh] bg-[var(--color-deep-space)] flex flex-col relative text-white overflow-hidden">
      {/* SEO component injects <title>, <meta description>, and JSON-LD structured data into the <head> for search engine optimization */}
      <SEO
        title="Informations Débiteur — Simulation Divorce"
        description="Renseignez les informations du débiteur : date de naissance, revenus et projections financières."
        path="/"
        jsonLd={breadcrumbJsonLd([
          { name: "Accueil", path: "/" },
          { name: "Informations Débiteur", path: "/informations-debiteur" },
        ])}
      />

      {/* Background Ambience — a decorative blurred cyan circle in the top-right corner, purely aesthetic, gives the page a glowing plasma feel */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--color-plasma-cyan)]/10 rounded-full blur-[100px]" />

      {/* Header bar — sticky at top with a translucent dark backdrop; contains back button, page title, and home button */}
      <div
        className="sticky top-0 z-50 flex items-center justify-between p-4 border-b bg-black/20 backdrop-blur-md border-white/5"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1rem)" }}
      >
        {/* Back button — navigates to the previous page in the wizard (e.g., Creditor page) */}
        <button
          onClick={() => navigate(getPreviousPage(currentPath))}
          className="flex items-center justify-center p-2 rounded-full hover:bg-white/10 group"
        >
          {/* ChevronLeft icon turns white on hover via the "group-hover" Tailwind class */}
          <ChevronLeft className="w-5 h-5 text-gray-400 group-hover:text-white" />
        </button>
        {/* Page title displayed in the center of the header — "Informations Débiteur" (Debtor Information) */}
        <h1 className="text-sm font-bold tracking-widest uppercase text-glow">
          Informations Débiteur
        </h1>
        {/* Home button — allows the user to jump back to the landing/dashboard page */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center justify-center p-2 rounded-full hover:bg-white/10 group"
          title="Accueil"
        >
          {/* Home icon with hover effect */}
          <Home className="w-5 h-5 text-gray-400 group-hover:text-white" />
        </button>
      </div>

      {/* Progress section — shows a horizontal dot-based progress bar and section title/description */}
      <div className="z-10 px-4 pt-4 pb-2 sm:px-6 sm:pt-6">
        {/* Right-aligned row of progress indicator dots */}
        <div className="flex justify-end mb-6">
          <div className="flex space-x-1">
            {/* Render one dot per wizard page; the current page's dot is highlighted in cyan, others are dimmed */}
            {Array.from({ length: totalPages }).map((_, i) => (
              <div
                key={i}
                className={`w-8 h-1 rounded-full ${i === pageIdx ? "bg-[var(--color-plasma-cyan)]" : "bg-[var(--border-color)]"}`}
              />
            ))}
          </div>
        </div>
        {/* Main section heading — "Informations Débiteur" (Debtor Information) */}
        <h1 className="mb-2 text-2xl font-bold text-white text-glow">
          Informations Débiteur
        </h1>
        {/* Short instruction text explaining what the user should fill in on this page */}
        <p className="text-sm text-gray-400">
          Renseignez les informations du débiteur : identité, revenus et
          projections.
        </p>
        {/* Detailed legal context explaining who the debtor is (Art. 270 Civil Code), the role of Net Social income
            (mandatory on French pay slips since 2024), and how the Calcul PC method uses gross income over 8 years */}
        <p className="mt-2 text-xs leading-relaxed text-gray-500">
          Le débiteur est l'époux aux revenus les plus élevés (art. 270 du Code
          Civil). Le Net Social — obligatoire sur les bulletins de paie depuis
          2024 — sert de base aux méthodes Tiers Pondéré et INSEE. La méthode
          Calcul PC utilise les revenus bruts projetés sur 8 ans.
        </p>
      </div>

      {/* Main scrollable content area — flex-1 takes remaining vertical space; overflow-y-auto allows scrolling; bottom padding reserves space for the fixed footer button */}
      <div className="relative z-10 flex-1 px-4 space-y-8 overflow-y-auto sm:px-6 pb-28 sm:pb-32 animate-fade-in scrollbar-hide">
        {/* GuidedStep wraps the entire form section in a guided-mode overlay. Step 0 of 1 total step.
            When guided mode is active, this highlights the section and shows a tooltip explaining what to do.
            isComplete=true means this step is always considered done (no validation gating). */}
        <GuidedStep
          step={0}
          currentStep={currentStep}
          totalSteps={1}
          onAdvance={advanceStep}
          content="Renseignez les informations du débiteur : date de naissance, revenus et projections financières."
          stepLabel="Débiteur"
          isComplete={true}
        >
          {/* Vertical stack of form field groups with consistent spacing */}
          <div className="space-y-6">
            {/* Section header with a teal User icon and uppercase label identifying this as the "Debtor Information" section */}
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-teal-400" />
              <span className="text-xs font-bold tracking-widest text-teal-400 uppercase">
                Informations Débiteur
              </span>
            </div>

            {/* ── Date of Birth field ──
                Glass-morphism panel containing a date picker for the debtor's birth date.
                The age is used in the Pilote method to weight the compensatory allowance calculation. */}
            <div className="p-6 border glass-panel rounded-2xl border-white/10">
              {/* Label row with Calendar icon, text, and an InfoTooltip explaining why birth date matters */}
              <label className="flex items-center space-x-2 text-[10px] uppercase tracking-widest text-gray-400 mb-4">
                <Calendar className="w-3 h-3" />
                <span>Date de naissance</span>
                {/* Tooltip explaining that the debtor's age is used in the Pilote method to weight the compensatory allowance */}
                <InfoTooltip content="L'âge du débiteur est utilisé dans la méthode Pilote pour pondérer la prestation compensatoire." />
              </label>
              {/* HTML5 date input — max is set to today's date to prevent future birth dates */}
              <input
                type="date"
                value={spouseBirthDate}
                max={new Date().toISOString().split("T")[0]}
                onChange={(e) => setSpouseBirthDate(e.target.value)}
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl p-4 text-[var(--text-primary)] focus:border-[var(--color-plasma-cyan)] outline-none"
              />
              {/* If a birth date has been entered, display the computed age below the input */}
              {spouseBirthDate && (
                <p className="text-xs text-[var(--text-muted)] mt-2">
                  Âge : {computeAge(spouseBirthDate)} ans
                </p>
              )}
            </div>

            {/* ── Net Social Income field ──
                Only shown if the user selected the "pilote" or "insee" calculation methods (needsNetIncome flag).
                "Net Social" is a French payroll figure mandatory on pay slips since 2024 — it represents take-home pay
                before optional deductions, used to compare living standards between the two spouses. */}
            {needsNetIncome && (
              <div className="p-6 border glass-panel rounded-2xl border-white/10">
                {/* Label row with Wallet icon and tooltip explaining what Net Social means in context */}
                <label className="flex items-center space-x-2 text-[10px] uppercase tracking-widest text-gray-400 mb-4">
                  <Wallet className="w-3 h-3" />
                  <span>Net Social (€/mois)</span>
                  {/* Tooltip explaining that this income is compared with the creditor's to determine the disparity */}
                  <InfoTooltip content="Le revenu net mensuel du débiteur. Ce montant est comparé à celui du créancier pour déterminer la disparité de niveau de vie." />
                </label>
                {/* CurrencyInput: a specialized input that formats numbers with thousands separators; disabled when "no income" is checked */}
                <CurrencyInput
                  min="0"
                  value={spouseIncome}
                  onValueChange={setSpouseIncome}
                  placeholder="ex: 3 500"
                  disabled={noIncomeDebiteur}
                  className={`w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl p-4 text-[var(--text-primary)] focus:border-[var(--color-plasma-cyan)] outline-none ${noIncomeDebiteur ? "opacity-50 cursor-not-allowed" : ""}`}
                />
                {/* "No Income" checkbox — when checked, sets the debtor's income to "0" and grays out the input field */}
                <label className="flex items-center mt-2 space-x-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={noIncomeDebiteur}
                    onChange={(e) => {
                      // Update the no-income flag state
                      setNoIncomeDebiteur(e.target.checked);
                      // If checked, force the income value to "0"
                      if (e.target.checked) setSpouseIncome("0");
                    }}
                    className="w-3.5 h-3.5 rounded border-white/20 bg-transparent accent-[var(--color-plasma-cyan)]"
                  />
                  {/* Label text: "Aucun Revenu" = "No Income" */}
                  <span className="text-xs text-gray-400">Aucun Revenu</span>
                </label>
              </div>
            )}

            {/* ── Axel Depondt / "Calcul PC" projection fields ──
                Only shown if the user selected the "axelDepondt" calculation method.
                This method requires gross (pre-tax) income, child contributions, future projections, and property data
                to compute the compensatory allowance over an 8-year projection period. */}
            {showAxelDepondtSteps && (
              <>
                {/* ── Current gross income (before taxes) ──
                    The user can toggle between monthly and annual entry modes.
                    A conversion hint is shown below the input (monthly↔annual). */}
                <div className="p-6 border glass-panel rounded-2xl border-white/10">
                  {/* Label with TrendingUp icon and tooltip explaining this is gross (pre-tax) income */}
                  <label className="flex items-center space-x-2 text-[10px] uppercase tracking-widest text-gray-400 mb-4">
                    <TrendingUp className="w-3 h-3" />
                    <span>Revenus actuels avant impôts</span>
                    {/* Tooltip: "Gross income (before taxes) of the debtor. You can enter the annual or monthly amount." */}
                    <InfoTooltip content="Revenus bruts (avant impôts) du débiteur. Vous pouvez saisir le montant annuel ou mensuel." />
                  </label>
                  {/* Toggle switch between "Monthly" and "Annual" income entry modes — styled as a segmented control */}
                  <div className="flex mb-3 overflow-hidden border rounded-lg border-white/10">
                    {/* Monthly mode button — highlighted with cyan when active */}
                    <button
                      type="button"
                      onClick={() => setDebtorIncomeMode("monthly")}
                      className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider transition-all ${debtorIncomeMode === "monthly" ? "bg-[var(--color-plasma-cyan)]/20 text-[var(--color-plasma-cyan)] border-b-2 border-[var(--color-plasma-cyan)]" : "bg-white/5 text-gray-500 hover:bg-white/10"}`}
                    >
                      Mensuel
                    </button>
                    {/* Annual mode button — highlighted with cyan when active */}
                    <button
                      type="button"
                      onClick={() => setDebtorIncomeMode("annual")}
                      className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider transition-all ${debtorIncomeMode === "annual" ? "bg-[var(--color-plasma-cyan)]/20 text-[var(--color-plasma-cyan)] border-b-2 border-[var(--color-plasma-cyan)]" : "bg-white/5 text-gray-500 hover:bg-white/10"}`}
                    >
                      Annuel
                    </button>
                  </div>
                  {/* Currency input for the gross income amount — placeholder adapts to the selected mode */}
                  <CurrencyInput
                    min="0"
                    value={debtorGrossIncome}
                    onValueChange={setDebtorGrossIncome}
                    placeholder={
                      debtorIncomeMode === "annual" ? "ex: 42 000" : "ex: 3 500"
                    }
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl p-4 text-[var(--text-primary)] focus:border-[var(--color-plasma-cyan)] outline-none"
                  />
                  {/* If a value is entered, show the converted equivalent (annual→monthly or monthly→annual) as a convenience */}
                  {debtorGrossIncome && (
                    <p className="text-xs text-[var(--text-muted)] mt-2">
                      {debtorIncomeMode === "annual"
                        ? `≈ ${Math.round(parseFloat(debtorGrossIncome) / 12).toLocaleString()} €/mois`
                        : `≈ ${Math.round(parseFloat(debtorGrossIncome) * 12).toLocaleString()} €/an`}
                    </p>
                  )}
                </div>

                {/* ── Monthly child support contribution ──
                    Amount the debtor pays monthly for child maintenance and education (pension alimentaire).
                    This is deducted from the debtor's disposable income in the Calcul PC calculation. */}
                <div className="p-6 border glass-panel rounded-2xl border-white/10">
                  {/* Label with Wallet icon and tooltip explaining this is the child support contribution */}
                  <label className="flex items-center space-x-2 text-[10px] uppercase tracking-widest text-gray-400 mb-4">
                    <Wallet className="w-3 h-3" />
                    <span>
                      Contribution mensuelle pour les enfants (€/mois)
                    </span>
                    {/* Tooltip: "Amount the debtor pays for child maintenance and education (child support, etc.)" */}
                    <InfoTooltip content="Montant que le débiteur verse pour la contribution à l'entretien et l'éducation des enfants (pension alimentaire, etc.)." />
                  </label>
                  {/* Currency input for the monthly child contribution amount */}
                  <CurrencyInput
                    min="0"
                    value={debtorChildContribution}
                    onValueChange={setDebtorChildContribution}
                    placeholder="ex: 400"
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl p-4 text-[var(--text-primary)] focus:border-[var(--color-plasma-cyan)] outline-none"
                  />
                </div>

                {/* ── Revenue change question ──
                    Asks whether the debtor anticipates a change in income within the next 8 years
                    (e.g., retirement, promotion, end of contract). If "yes", additional fields appear below. */}
                <div className="p-6 border glass-panel rounded-2xl border-white/10">
                  {/* Label with TrendingUp icon and tooltip explaining the 8-year projection horizon */}
                  <label className="flex items-center space-x-2 text-[10px] uppercase tracking-widest text-gray-400 mb-4">
                    <TrendingUp className="w-3 h-3" />
                    <span>
                      Un changement de revenus est-il prévu dans les 8
                      prochaines années ?
                    </span>
                    {/* Tooltip: "If the debtor anticipates an income change within 8 years (retirement, promotion, end of contract…), answer Yes to enter details." */}
                    <InfoTooltip content="Si le débiteur anticipe un changement de revenus dans les 8 ans (retraite, promotion, fin de contrat…), répondez Oui pour renseigner les détails." />
                  </label>
                  {/* Yes/No segmented toggle — styled as two buttons in a rounded container */}
                  <div className="flex overflow-hidden border rounded-lg border-white/10">
                    {/* "No" button — when selected, future income fields are hidden */}
                    <button
                      type="button"
                      onClick={() => setDebtorExpectsRevenueChange("no")}
                      className={`flex-1 py-3 text-sm font-bold transition-all ${debtorExpectsRevenueChange === "no" ? "bg-[var(--color-plasma-cyan)]/20 text-[var(--color-plasma-cyan)] border-b-2 border-[var(--color-plasma-cyan)]" : "bg-white/5 text-gray-500 hover:bg-white/10"}`}
                    >
                      Non
                    </button>
                    {/* "Yes" button — when selected, three additional fields appear: future income, future child contribution, and change date */}
                    <button
                      type="button"
                      onClick={() => setDebtorExpectsRevenueChange("yes")}
                      className={`flex-1 py-3 text-sm font-bold transition-all ${debtorExpectsRevenueChange === "yes" ? "bg-[var(--color-plasma-cyan)]/20 text-[var(--color-plasma-cyan)] border-b-2 border-[var(--color-plasma-cyan)]" : "bg-white/5 text-gray-500 hover:bg-white/10"}`}
                    >
                      Oui
                    </button>
                  </div>
                </div>

                {/* ── Conditional future income fields ──
                    Only rendered when the debtor indicates they expect a revenue change ("yes").
                    These three fields capture: future expected income, future child contribution, and the date of the change. */}
                {debtorExpectsRevenueChange === "yes" && (
                  <>
                    {/* Future expected monthly gross income (before taxes) after the anticipated change */}
                    <div className="p-6 border glass-panel rounded-2xl border-white/10">
                      {/* Label with Wallet icon and tooltip */}
                      <label className="flex items-center space-x-2 text-[10px] uppercase tracking-widest text-gray-400 mb-4">
                        <Wallet className="w-3 h-3" />
                        <span>
                          Revenu mensuel prévisible avant impôts (€/mois)
                        </span>
                        {/* Tooltip: "Expected future monthly gross amount (before taxes) after the change in situation." */}
                        <InfoTooltip content="Montant futur mensuel brut (avant impôts) attendu après le changement de situation." />
                      </label>
                      {/* Currency input for the expected future gross monthly income */}
                      <CurrencyInput
                        min="0"
                        value={debtorFutureIncome}
                        onValueChange={setDebtorFutureIncome}
                        placeholder="ex: 3 000"
                        className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl p-4 text-[var(--text-primary)] focus:border-[var(--color-plasma-cyan)] outline-none"
                      />
                    </div>

                    {/* Future expected monthly child contribution after the revenue change */}
                    <div className="p-6 border glass-panel rounded-2xl border-white/10">
                      {/* Label with Wallet icon and tooltip */}
                      <label className="flex items-center space-x-2 text-[10px] uppercase tracking-widest text-gray-400 mb-4">
                        <Wallet className="w-3 h-3" />
                        <span>
                          Contribution prévisible pour les enfants (€/mois)
                        </span>
                        {/* Tooltip: "Expected child contribution amount after the debtor's change in situation." */}
                        <InfoTooltip content="Montant prévisible de la contribution aux charges des enfants après le changement de situation du débiteur." />
                      </label>
                      {/* Currency input for the expected future child contribution */}
                      <CurrencyInput
                        min="0"
                        value={debtorFutureChildContribution}
                        onValueChange={setDebtorFutureChildContribution}
                        placeholder="ex: 300"
                        className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl p-4 text-[var(--text-primary)] focus:border-[var(--color-plasma-cyan)] outline-none"
                      />
                    </div>

                    {/* Expected date of the revenue change (e.g., retirement date, end of contract) */}
                    <div className="p-6 border glass-panel rounded-2xl border-white/10">
                      {/* Label with Calendar icon and tooltip */}
                      <label className="flex items-center space-x-2 text-[10px] uppercase tracking-widest text-gray-400 mb-4">
                        <Calendar className="w-3 h-3" />
                        <span>Date prévisible des modifications</span>
                        {/* Tooltip: "Expected date of the change in situation (retirement, end of contract, etc.)." */}
                        <InfoTooltip content="Date prévue du changement de situation (retraite, fin de contrat, etc.)." />
                      </label>
                      {/* HTML5 date picker for the expected change date */}
                      <input
                        type="date"
                        value={debtorChangeDate}
                        onChange={(e) => setDebtorChangeDate(e.target.value)}
                        className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl p-4 text-[var(--text-primary)] focus:border-[var(--color-plasma-cyan)] outline-none"
                      />
                    </div>
                  </>
                )}

                {/* ── Non-income-producing property value ──
                    Captures the value of the debtor's own assets that currently don't generate income
                    (e.g., unrented real estate, idle savings). In the Calcul PC method, a notional yield
                    is applied to this value to estimate potential income from these assets. */}
                <div className="p-6 border glass-panel rounded-2xl border-white/10">
                  {/* Label with Wallet icon and tooltip explaining what "patrimoine propre non producteur" means */}
                  <label className="flex items-center space-x-2 text-[10px] uppercase tracking-widest text-gray-400 mb-4">
                    <Wallet className="w-3 h-3" />
                    <span>Patrimoine propre non producteur de revenus (€)</span>
                    {/* Tooltip: "Value of the debtor's own non-income-producing property (unrented assets, uninvested savings, etc.)" */}
                    <InfoTooltip content="Valeur du patrimoine propre du débiteur actuellement non producteur de revenus (biens non loués, épargne non placée, etc.)." />
                  </label>
                  {/* Currency input for the total value of non-productive property */}
                  <CurrencyInput
                    min="0"
                    value={debtorPropertyValue}
                    onValueChange={setDebtorPropertyValue}
                    placeholder="ex: 200 000"
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl p-4 text-[var(--text-primary)] focus:border-[var(--color-plasma-cyan)] outline-none"
                  />

                  {/* Toggle button to show/hide the custom yield rate input.
                      By default, a 3% annual yield rate is assumed. Clicking this lets the user override it. */}
                  <button
                    type="button"
                    onClick={() => {
                      // Toggle the visibility of the yield input field
                      setShowYieldInput((v) => !v);
                      // If opening the field and yield is empty, reset to the default
                      if (!showYieldInput && debtorPropertyYield === "")
                        setDebtorPropertyYield(DEFAULT_YIELD_RATE_STR);
                    }}
                    className="mt-3 text-[10px] uppercase tracking-widest text-[var(--color-plasma-cyan)] hover:underline flex items-center space-x-1"
                  >
                    {/* Percent icon next to the toggle text */}
                    <Percent className="w-3 h-3" />
                    {/* Toggle text: "Hide yield rate" when visible, "Modify yield rate?" when hidden */}
                    <span>
                      {showYieldInput
                        ? "Masquer le taux de rendement"
                        : "Modifier le taux de rendement ?"}
                    </span>
                  </button>

                  {/* Conditional yield rate input — only shown when the user clicks to customize the yield */}
                  {showYieldInput && (
                    <div className="mt-3">
                      {/* Label with Percent icon and tooltip explaining the yield rate purpose */}
                      <label className="flex items-center space-x-2 text-[10px] uppercase tracking-widest text-gray-400 mb-2">
                        <Percent className="w-3 h-3" />
                        <span>Taux de rendement estimé (%)</span>
                        {/* Tooltip: "Estimated annual yield rate on non-productive property. Default is 3%. This rate is specific to the debtor." */}
                        <InfoTooltip
                          content={`Taux de rendement annuel estimé du patrimoine non productif. Par défaut ${DEFAULT_YIELD_RATE} %. Ce taux est propre au débiteur.`}
                        />
                      </label>
                      {/* Numeric input for the yield percentage — min 0, max 100, step 0.1 for decimal precision */}
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={debtorPropertyYield}
                        onChange={(e) => setDebtorPropertyYield(e.target.value)}
                        placeholder={DEFAULT_YIELD_RATE_STR}
                        className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl p-4 text-[var(--text-primary)] focus:border-[var(--color-plasma-cyan)] outline-none"
                      />
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </GuidedStep>
      </div>

      {/* ── Editorial/Ad block ──
          Contains a native AdSense ad unit for monetization.
          The editorial content label satisfies Google AdSense compliance requirements. */}
      <div className="px-6 pb-6 space-y-4">
        {/* Centered container for the ad unit, limited to max-width md for readability */}
        <div className="flex justify-center">
          {/* AdUnit renders a Google AdSense native ad — "type=native" selects the native ad format */}
          <AdUnit type="native" className="w-full max-w-md" />
        </div>
      </div>

      {/* ── Fixed footer with the "Validate and continue" navigation button ──
          Positioned at the bottom of the viewport with a gradient fade-out effect.
          When guided mode is active and not yet completed, pointer events are disabled to prevent premature navigation. */}
      <div
        className={`fixed bottom-0 left-0 w-full p-3 sm:p-6 bg-gradient-to-t from-[var(--color-deep-space)] to-transparent z-20 ${isGuided && !allDone ? "pointer-events-none" : ""}`}
        style={{
          // Add extra bottom padding to account for the safe area inset on mobile devices (e.g., iPhone notch/home indicator)
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.75rem)",
        }}
      >
        {/* Main CTA button — saves form data and navigates to the next wizard page.
            Features a glowing cyan shadow, scale-down on click (active:scale-95), and is blurred/faded during guided mode. */}
        <button
          onClick={handleNext}
          className={`w-full max-w-md mx-auto bg-[var(--color-plasma-cyan)] hover:bg-[var(--accent-hover)] text-white font-bold py-3 sm:py-5 rounded-2xl shadow-[0_0_30px_rgba(34,211,238,0.3)] transition-all flex items-center justify-center space-x-2 sm:space-x-3 group active:scale-95 ${isGuided && !allDone ? "opacity-20 blur-[3px]" : ""}`}
          style={{ color: "#ffffff" }}
        >
          {/* Button label — shows shortened "Valider" on mobile (sm:hidden) and full "Valider et poursuivre" on larger screens */}
          <span className="text-xs tracking-wider uppercase sm:text-sm sm:tracking-widest">
            {/* Short label for mobile screens */}
            <span className="sm:hidden">Valider</span>
            {/* Full label for tablet/desktop screens */}
            <span className="hidden sm:inline">Valider et poursuivre</span>
          </span>
          {/* ArrowRight icon with a hover animation that shifts it slightly to the right */}
          <ArrowRight className="w-4 h-4 transition-transform sm:w-5 sm:h-5 group-hover:translate-x-1" />
        </button>
      </div>
      {/* GuidedHeaderTour renders a floating overlay tutorial for first-time users explaining the page header controls */}
      <GuidedHeaderTour />
    </div>
  );
};

// Export the DebiteurPage component as the default export so it can be used in the React Router route configuration
export default DebiteurPage;
