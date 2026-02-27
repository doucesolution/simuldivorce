// Import React core library along with useState (local state management) and useEffect (side effects) hooks
import React, { useState, useEffect } from "react";
// Import useNavigate hook from React Router to programmatically navigate between pages
import { useNavigate } from "react-router-dom";
// Import icon components from lucide-react, used throughout the form for visual labeling:
// - Calendar: date-of-birth and date fields
// - ArrowRight: "next" button indicator
// - ChevronLeft: back navigation arrow
// - Home: home button in the header
// - User: section header icon for creditor identity
// - Wallet: income and financial field icons
// - TrendingUp: income projection field icons
// - Percent: yield rate field icon
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
// Import InfoTooltip component — displays an "i" icon that shows explanatory text on hover/click
import { InfoTooltip } from "../components/InfoTooltip";
// Import CurrencyInput — a custom numeric input that formats values as currency (€)
import { CurrencyInput } from "../components/CurrencyInput";
// Import GuidedStep (wrapper that highlights a step in guided mode) and useGuidedSteps (hook managing guided tour state)
import { GuidedStep, useGuidedSteps } from "../components/GuidedTooltip";
// Import GuidedHeaderTour — renders the guided mode overlay/header tour component
import { GuidedHeaderTour } from "../components/GuidedHeaderTour";
// Import SEO component (sets <title>, meta description, JSON-LD) and breadcrumbJsonLd helper for structured data
import { SEO, breadcrumbJsonLd } from "../components/SEO";
// Import AdUnit component — renders an ad placement (Google AdSense) within the page
import { AdUnit } from "../components/AdUnit";
// Import utility functions from the central divorce form store:
// - loadFormData: retrieves previously saved form values from localStorage
// - saveFormData: persists current form values to localStorage
// - computeAge: calculates age in years from a birth date string
// - getNextPage / getPreviousPage: determine the next/previous route in the multi-step wizard
// - getPageIndex / getTotalPages: return the current page index and total page count for the progress bar
// - getCalculationChoices: returns which calculation methods the user selected (Pilote, INSEE, Axel Depondt, etc.)
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

// Define the CreancierPage functional component — collects the creditor spouse's financial information
const CreancierPage: React.FC = () => {
  // useNavigate returns a function to programmatically change routes (e.g., go to next/previous page)
  const navigate = useNavigate();
  // The route path for this page, used to compute progress and navigation targets
  const currentPath = "/informations-creancier";
  // Compute the zero-based index of this page within the multi-step wizard (used for the progress bar)
  const pageIdx = getPageIndex(currentPath);
  // Get the total number of pages in the wizard (used for rendering the progress bar dots)
  const totalPages = getTotalPages();

  // Load all previously saved form data from localStorage so we can pre-populate fields
  const stored = loadFormData();

  // ── Method flags ──
  // Retrieve the calculation methods the user chose on an earlier page
  const { selectedMethods } = getCalculationChoices();
  // Extract just the array of selected "prestation compensatoire" methods (e.g., "pilote", "insee", "axelDepondt")
  const pcMethods = selectedMethods.prestationCompensatoire || [];
  // If the Axel Depondt ("Calcul PC") method is selected, we need to show extra projection fields
  const showAxelDepondtSteps = pcMethods.includes("axelDepondt");
  // If the Pilote or INSEE methods are selected, we need to ask for the net social income
  const needsNetIncome =
    pcMethods.includes("pilote") || pcMethods.includes("insee");

  // ── Local state — each useState is initialized from localStorage (stored) so returning users see their previous entries ──

  // Creditor's date of birth — used to compute age, which feeds into the Pilote method coefficient
  const [myBirthDate, setMyBirthDate] = useState(stored.myBirthDate);
  // Creditor's net social monthly income in euros — used by Pilote and INSEE methods to measure disparity
  const [myIncome, setMyIncome] = useState(stored.myIncome);
  // Boolean flag: if true, the creditor declares no income (sets myIncome to "0" and disables the input)
  const [noIncomeCreancier, setNoIncomeCreancier] = useState(
    stored.myIncome === "0",
  );

  // Creditor's gross income before taxes — used by the Axel Depondt (Calcul PC) method
  const [creditorGrossIncome, setCreditorGrossIncome] = useState(
    stored.creditorGrossIncome,
  );
  // Whether the gross income was entered as "monthly" or "annual" — controls display and conversion
  const [creditorIncomeMode, setCreditorIncomeMode] = useState(
    stored.creditorIncomeMode || "monthly",
  );
  // Monthly amount the creditor contributes toward children's expenses (child support paid by creditor)
  const [creditorChildContribution, setCreditorChildContribution] = useState(
    stored.creditorChildContribution,
  );
  // Creditor's expected future monthly income (if a revenue change is anticipated within 8 years)
  const [creditorFutureIncome, setCreditorFutureIncome] = useState(
    stored.creditorFutureIncome,
  );
  // Creditor's expected future monthly child contribution after the anticipated revenue change
  const [creditorFutureChildContribution, setCreditorFutureChildContribution] =
    useState(stored.creditorFutureChildContribution);
  // Date when the creditor expects the revenue change to occur (e.g., retirement date, job start)
  const [creditorChangeDate, setCreditorChangeDate] = useState(
    stored.creditorChangeDate,
  );
  // Value in euros of the creditor's own assets that do not currently generate income (non-income-producing property)
  const [creditorPropertyValue, setCreditorPropertyValue] = useState(
    stored.creditorPropertyValue,
  );
  // Estimated annual yield rate (%) for the non-income-producing property — defaults to DEFAULT_YIELD_RATE
  const [creditorPropertyYield, setCreditorPropertyYield] = useState(
    stored.creditorPropertyYield || DEFAULT_YIELD_RATE_STR,
  );
  // Whether to display the yield rate input — shown only if the user has previously customized it away from default
  const [showYieldInput, setShowYieldInput] = useState(
    stored.creditorPropertyYield !== "" &&
      stored.creditorPropertyYield !== DEFAULT_YIELD_RATE_STR,
  );
  // Number of years the creditor did not contribute to their retirement pension during the marriage (career break)
  const [creditorRetirementGapYears, setCreditorRetirementGapYears] = useState(
    stored.creditorRetirementGapYears,
  );
  // Creditor's monthly income before they stopped working — used to compute the retirement gap compensation
  const [creditorPreRetirementIncome, setCreditorPreRetirementIncome] =
    useState(stored.creditorPreRetirementIncome);
  // Whether the creditor expects a revenue change in the next 8 years — "yes" or "no"; controls conditional fields
  const [creditorExpectsRevenueChange, setCreditorExpectsRevenueChange] =
    useState(stored.creditorExpectsRevenueChange || "no");

  // Initialize the guided tour hook with 1 step total; returns the current step index, advance function,
  // whether all steps are done, and whether guided mode is active
  const { currentStep, advanceStep, allDone, isGuided } = useGuidedSteps(1);

  // On component mount, scroll to the top of the page so the user starts from the top when navigating here
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []); // Empty dependency array means this runs only once on mount

  // Persist all creditor-related form fields into localStorage via the central store
  const save = () => {
    saveFormData({
      myBirthDate, // creditor date of birth
      myIncome, // creditor net social monthly income
      creditorGrossIncome, // creditor gross income before taxes
      creditorIncomeMode, // "monthly" or "annual" mode for gross income entry
      creditorChildContribution, // current monthly child contribution
      creditorFutureIncome, // projected future monthly income
      creditorFutureChildContribution, // projected future child contribution
      creditorChangeDate, // date of anticipated revenue change
      creditorPropertyValue, // non-income-producing property value
      creditorPropertyYield, // estimated yield rate on that property
      creditorRetirementGapYears, // years without retirement contributions during marriage
      creditorPreRetirementIncome, // income before career cessation
      creditorExpectsRevenueChange, // "yes" or "no" — whether a revenue change is expected
    });
  };

  // Handler for the "Next" button: validates if needed, saves the form data, then navigates to the next page
  const handleNext = () => {
    // If the Pilote or INSEE methods require a net income, perform a soft validation check
    if (needsNetIncome) {
      // Parse the creditor's net income; default to 0 if empty/invalid
      const myIncVal = parseFloat(myIncome) || 0;
      // If the income is zero or negative and the "no income" checkbox is NOT checked, we could warn—
      // but currently we use soft validation and allow the user to proceed regardless
      if (myIncVal <= 0 && !noIncomeCreancier) {
        // Simple fallback — just proceed (validation is soft)
      }
    }
    // Save all form fields to localStorage before navigating away
    save();
    // Navigate to the next page in the wizard sequence
    navigate(getNextPage(currentPath));
  };

  return (
    // Root container: full viewport height, dark deep-space background, flex column layout, white text, no overflow
    <div className="h-[100dvh] bg-[var(--color-deep-space)] flex flex-col relative text-white overflow-hidden">
      {/* SEO component injects <title>, <meta description>, and JSON-LD structured data (breadcrumb) into <head> */}
      <SEO
        title="Informations Créancier — Simulation Divorce"
        description="Renseignez les informations du créancier : date de naissance, revenus, projections financières et écart de retraite."
        path="/"
        jsonLd={breadcrumbJsonLd([
          { name: "Accueil", path: "/" },
          { name: "Informations Créancier", path: "/informations-creancier" },
        ])}
      />

      {/* Background Ambience — decorative blurred circle in the top-right corner for a futuristic glow effect */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--color-plasma-cyan)]/10 rounded-full blur-[100px]" />

      {/* Header bar — sticky at top with backdrop blur; contains back button, page title, and home button */}
      <div
        className="sticky top-0 z-50 flex items-center justify-between p-4 border-b bg-black/20 backdrop-blur-md border-white/5"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1rem)" }} // Respects iOS safe-area notch
      >
        {/* Back button — navigates to the previous page in the wizard */}
        <button
          onClick={() => navigate(getPreviousPage(currentPath))}
          className="flex items-center justify-center p-2 rounded-full hover:bg-white/10 group"
        >
          {/* Chevron-left icon indicating backward navigation */}
          <ChevronLeft className="w-5 h-5 text-gray-400 group-hover:text-white" />
        </button>
        {/* Page title displayed in the center of the header */}
        <h1 className="text-sm font-bold tracking-widest uppercase text-glow">
          Informations Créancier
        </h1>
        {/* Home button — navigates directly to the landing page */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center justify-center p-2 rounded-full hover:bg-white/10 group"
          title="Accueil" // Tooltip text: "Home"
        >
          {/* House icon for the home navigation action */}
          <Home className="w-5 h-5 text-gray-400 group-hover:text-white" />
        </button>
      </div>

      {/* Progress bar section — shows which step the user is on within the wizard */}
      <div className="z-10 px-4 pt-4 pb-2 sm:px-6 sm:pt-6">
        {/* Row of dots aligned to the right — one dot per wizard page */}
        <div className="flex justify-end mb-6">
          <div className="flex space-x-1">
            {/* Generate one dot per page; highlight the current page in plasma-cyan, others in border color */}
            {Array.from({ length: totalPages }).map((_, i) => (
              <div
                key={i}
                className={`w-8 h-1 rounded-full ${i === pageIdx ? "bg-[var(--color-plasma-cyan)]" : "bg-[var(--border-color)]"}`}
              />
            ))}
          </div>
        </div>
        {/* Main heading for the page — "Creditor Information" */}
        <h1 className="mb-2 text-2xl font-bold text-white text-glow">
          Informations Créancier
        </h1>
        {/* Short instruction text explaining what this page collects */}
        <p className="text-sm text-gray-400">
          Renseignez les informations du créancier : identité, revenus,
          projections et retraite.
        </p>
        {/* Detailed explanatory paragraph about who the creditor is and how the retirement repair module works */}
        <p className="mt-2 text-xs leading-relaxed text-gray-500">
          Le créancier est l'époux qui perçoit la prestation compensatoire —
          celui qui subit la plus forte baisse de niveau de vie après le
          divorce. Si vous avez connu une cessation d'activité pendant le
          mariage, la méthode Calcul PC intègre un module de réparation retraite
          compensant le déficit de cotisations.
        </p>
      </div>

      {/* Main scrollable content area — contains all the creditor form fields */}
      <div className="relative z-10 flex-1 px-4 space-y-8 overflow-y-auto sm:px-6 pb-28 sm:pb-32 animate-fade-in scrollbar-hide">
        {/* GuidedStep wraps the entire form section; in guided mode it highlights this step and shows a tooltip */}
        <GuidedStep
          step={0} // This is step index 0 (the only step on this page)
          currentStep={currentStep} // Currently active guided step
          totalSteps={1} // Total number of guided steps on this page
          onAdvance={advanceStep} // Callback to move to the next guided step
          content="Renseignez les informations du créancier : date de naissance, revenus, projections financières et écart de retraite."
          stepLabel="Créancier" // Label displayed in the guided tooltip
          isComplete={true} // This step is always marked as complete (no strict validation here)
        >
          {/* Container for all form fields with vertical spacing */}
          <div className="space-y-6">
            {/* Section icon and title for the creditor information block */}
            <div className="flex items-center space-x-2">
              {/* User icon in teal to visually identify the “creditor identity” section */}
              <User className="w-4 h-4 text-teal-400" />
              <span className="text-xs font-bold tracking-widest text-teal-400 uppercase">
                Informations Créancier
              </span>
            </div>

            {/* ===== Date of Birth Field ===== */}
            {/* Glass-panel card: semi-transparent card with rounded corners and a subtle border */}
            <div className="p-6 border glass-panel rounded-2xl border-white/10">
              {/* Label row: Calendar icon + text + info tooltip explaining why the date matters */}
              <label className="flex items-center space-x-2 text-[10px] uppercase tracking-widest text-gray-400 mb-4">
                <Calendar className="w-3 h-3" />
                <span>Date de naissance</span>
                {/* Tooltip explains that the creditor's age impacts the Pilote method coefficient */}
                <InfoTooltip content="L'âge du créancier est utilisé dans la méthode Pilote. Plus le créancier est âgé, plus le coefficient est élevé." />
              </label>
              {/* HTML date picker: pre-filled with stored value, max date is today (no future dates allowed) */}
              <input
                type="date"
                value={myBirthDate}
                max={new Date().toISOString().split("T")[0]} // Restrict to dates up to today
                onChange={(e) => setMyBirthDate(e.target.value)} // Update local state on change
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl p-4 text-[var(--text-primary)] focus:border-[var(--color-plasma-cyan)] outline-none"
              />
              {/* If a birth date is entered, display the computed age below the input */}
              {myBirthDate && (
                <p className="text-xs text-[var(--text-muted)] mt-2">
                  Âge : {computeAge(myBirthDate)} ans
                </p>
              )}
            </div>

            {/* ===== Net Social Monthly Income Field ===== */}
            {/* Only rendered if the Pilote or INSEE method is selected (they require net income) */}
            {needsNetIncome && (
              <div className="p-6 border glass-panel rounded-2xl border-white/10">
                {/* Label with Wallet icon and tooltip explaining the income's purpose */}
                <label className="flex items-center space-x-2 text-[10px] uppercase tracking-widest text-gray-400 mb-4">
                  <Wallet className="w-3 h-3" />
                  <span>Net Social (€/mois)</span>
                  {/* Tooltip: this income is compared with the debtor's to assess disparity */}
                  <InfoTooltip content="Le revenu net mensuel du créancier. Ce montant est comparé à celui du débiteur pour déterminer la disparité de niveau de vie." />
                </label>
                {/* CurrencyInput: custom component formatting the value as euros; disabled when "no income" is checked */}
                <CurrencyInput
                  min="0"
                  value={myIncome}
                  onValueChange={setMyIncome}
                  placeholder="ex: 2 500"
                  disabled={noIncomeCreancier} // Disable input when creditor declares no income
                  className={`w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl p-4 text-[var(--text-primary)] focus:border-[var(--color-plasma-cyan)] outline-none ${noIncomeCreancier ? "opacity-50 cursor-not-allowed" : ""}`}
                />
                {/* Checkbox: allows the creditor to declare they have no income at all */}
                <label className="flex items-center mt-2 space-x-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={noIncomeCreancier}
                    onChange={(e) => {
                      // Toggle the "no income" flag
                      setNoIncomeCreancier(e.target.checked);
                      // When checked, force income to "0" so calculations treat it as zero
                      if (e.target.checked) setMyIncome("0");
                    }}
                    className="w-3.5 h-3.5 rounded border-white/20 bg-transparent accent-[var(--color-plasma-cyan)]"
                  />
                  {/* Label text: "No Income" in French */}
                  <span className="text-xs text-gray-400">Aucun Revenu</span>
                </label>
              </div>
            )}

            {/* ===== Axel Depondt ("Calcul PC") Method Fields ===== */}
            {/* These extra projection fields are only rendered when the user selected the Axel Depondt method */}
            {showAxelDepondtSteps && (
              <>
                {/* ===== Gross Income Before Taxes ===== */}
                <div className="p-6 border glass-panel rounded-2xl border-white/10">
                  {/* Label with TrendingUp icon — indicates income/revenue data */}
                  <label className="flex items-center space-x-2 text-[10px] uppercase tracking-widest text-gray-400 mb-4">
                    <TrendingUp className="w-3 h-3" />
                    <span>Revenus actuels avant impôts</span>
                    {/* Tooltip: explains this is the gross pre-tax income and that monthly/annual modes are available */}
                    <InfoTooltip content="Revenus bruts (avant impôts) du créancier. Vous pouvez saisir le montant annuel ou mensuel." />
                  </label>
                  {/* Toggle buttons to switch between Monthly and Annual input mode */}
                  <div className="flex mb-3 overflow-hidden border rounded-lg border-white/10">
                    {/* Monthly mode button — highlighted in plasma-cyan when selected */}
                    <button
                      type="button"
                      onClick={() => setCreditorIncomeMode("monthly")}
                      className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider transition-all ${creditorIncomeMode === "monthly" ? "bg-[var(--color-plasma-cyan)]/20 text-[var(--color-plasma-cyan)] border-b-2 border-[var(--color-plasma-cyan)]" : "bg-white/5 text-gray-500 hover:bg-white/10"}`}
                    >
                      Mensuel
                    </button>
                    {/* Annual mode button — highlighted in plasma-cyan when selected */}
                    <button
                      type="button"
                      onClick={() => setCreditorIncomeMode("annual")}
                      className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider transition-all ${creditorIncomeMode === "annual" ? "bg-[var(--color-plasma-cyan)]/20 text-[var(--color-plasma-cyan)] border-b-2 border-[var(--color-plasma-cyan)]" : "bg-white/5 text-gray-500 hover:bg-white/10"}`}
                    >
                      Annuel
                    </button>
                  </div>
                  {/* CurrencyInput for the gross income — placeholder changes based on monthly/annual mode */}
                  <CurrencyInput
                    min="0"
                    value={creditorGrossIncome}
                    onValueChange={setCreditorGrossIncome}
                    placeholder={
                      creditorIncomeMode === "annual"
                        ? "ex: 24 000" // Annual placeholder
                        : "ex: 2 000" // Monthly placeholder
                    }
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl p-4 text-[var(--text-primary)] focus:border-[var(--color-plasma-cyan)] outline-none"
                  />
                  {/* If a value is entered, display the converted equivalent (monthly ↔ annual) */}
                  {creditorGrossIncome && (
                    <p className="text-xs text-[var(--text-muted)] mt-2">
                      {creditorIncomeMode === "annual"
                        ? `≈ ${Math.round(parseFloat(creditorGrossIncome) / 12).toLocaleString()} €/mois` // Convert annual to monthly
                        : `≈ ${Math.round(parseFloat(creditorGrossIncome) * 12).toLocaleString()} €/an`}{" "}
                      {/* Convert monthly to annual */}
                    </p>
                  )}
                </div>

                {/* ===== Monthly Child Contribution ===== */}
                {/* Amount the creditor pays monthly toward children's expenses */}
                <div className="p-6 border glass-panel rounded-2xl border-white/10">
                  <label className="flex items-center space-x-2 text-[10px] uppercase tracking-widest text-gray-400 mb-4">
                    <Wallet className="w-3 h-3" />
                    <span>
                      Contribution mensuelle pour les enfants (€/mois)
                    </span>
                    {/* Tooltip: explains this is the amount the creditor contributes for children's expenses */}
                    <InfoTooltip content="Montant que le créancier verse pour la contribution aux charges des enfants." />
                  </label>
                  {/* CurrencyInput for the child contribution amount */}
                  <CurrencyInput
                    min="0"
                    value={creditorChildContribution}
                    onValueChange={setCreditorChildContribution}
                    placeholder="ex: 200"
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl p-4 text-[var(--text-primary)] focus:border-[var(--color-plasma-cyan)] outline-none"
                  />
                </div>

                {/* ===== Revenue Change Toggle ===== */}
                {/* Asks if the creditor expects a change in income within the next 8 years (e.g., retirement, new job) */}
                <div className="p-6 border glass-panel rounded-2xl border-white/10">
                  <label className="flex items-center space-x-2 text-[10px] uppercase tracking-widest text-gray-400 mb-4">
                    <TrendingUp className="w-3 h-3" />
                    <span>
                      Un changement de revenus est-il prévu dans les 8
                      prochaines années ?
                    </span>
                    {/* Tooltip: explains situations that qualify (returning to work, retirement, promotion…) */}
                    <InfoTooltip content="Si le créancier anticipe un changement de revenus dans les 8 ans (reprise d'emploi, retraite, promotion…), répondez Oui pour renseigner les détails." />
                  </label>
                  {/* Two-button toggle: "Non" (No) or "Oui" (Yes) */}
                  <div className="flex overflow-hidden border rounded-lg border-white/10">
                    {/* "No" button — selected by default; no revenue change expected */}
                    <button
                      type="button"
                      onClick={() => setCreditorExpectsRevenueChange("no")}
                      className={`flex-1 py-3 text-sm font-bold transition-all ${creditorExpectsRevenueChange === "no" ? "bg-[var(--color-plasma-cyan)]/20 text-[var(--color-plasma-cyan)] border-b-2 border-[var(--color-plasma-cyan)]" : "bg-white/5 text-gray-500 hover:bg-white/10"}`}
                    >
                      Non
                    </button>
                    {/* "Yes" button — when selected, reveals additional future income fields below */}
                    <button
                      type="button"
                      onClick={() => setCreditorExpectsRevenueChange("yes")}
                      className={`flex-1 py-3 text-sm font-bold transition-all ${creditorExpectsRevenueChange === "yes" ? "bg-[var(--color-plasma-cyan)]/20 text-[var(--color-plasma-cyan)] border-b-2 border-[var(--color-plasma-cyan)]" : "bg-white/5 text-gray-500 hover:bg-white/10"}`}
                    >
                      Oui
                    </button>
                  </div>
                </div>

                {/* ===== Conditional Future Income Fields ===== */}
                {/* These three fields are only shown when the creditor expects a revenue change ("yes") */}
                {creditorExpectsRevenueChange === "yes" && (
                  <>
                    {/* ===== Expected Future Monthly Income Before Taxes ===== */}
                    <div className="p-6 border glass-panel rounded-2xl border-white/10">
                      <label className="flex items-center space-x-2 text-[10px] uppercase tracking-widest text-gray-400 mb-4">
                        <Wallet className="w-3 h-3" />
                        <span>
                          Revenu mensuel prévisible avant impôts (€/mois)
                        </span>
                        {/* Tooltip: the expected gross monthly income after the situation changes */}
                        <InfoTooltip content="Montant futur mensuel brut (avant impôts) attendu après le changement de situation." />
                      </label>
                      {/* CurrencyInput for the projected future gross monthly income */}
                      <CurrencyInput
                        min="0"
                        value={creditorFutureIncome}
                        onValueChange={setCreditorFutureIncome}
                        placeholder="ex: 1 800"
                        className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl p-4 text-[var(--text-primary)] focus:border-[var(--color-plasma-cyan)] outline-none"
                      />
                    </div>

                    {/* ===== Expected Future Monthly Child Contribution ===== */}
                    <div className="p-6 border glass-panel rounded-2xl border-white/10">
                      <label className="flex items-center space-x-2 text-[10px] uppercase tracking-widest text-gray-400 mb-4">
                        <Wallet className="w-3 h-3" />
                        <span>
                          Contribution prévisible pour les enfants (€/mois)
                        </span>
                        {/* Tooltip: the expected child contribution amount after the revenue change */}
                        <InfoTooltip content="Montant prévisible de la contribution aux charges des enfants après le changement de situation du créancier." />
                      </label>
                      {/* CurrencyInput for the projected future child contribution */}
                      <CurrencyInput
                        min="0"
                        value={creditorFutureChildContribution}
                        onValueChange={
                          (v) => setCreditorFutureChildContribution(v) // Update state with the new value
                        }
                        placeholder="ex: 150"
                        className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl p-4 text-[var(--text-primary)] focus:border-[var(--color-plasma-cyan)] outline-none"
                      />
                    </div>

                    {/* ===== Expected Date of Revenue Change ===== */}
                    <div className="p-6 border glass-panel rounded-2xl border-white/10">
                      <label className="flex items-center space-x-2 text-[10px] uppercase tracking-widest text-gray-400 mb-4">
                        <Calendar className="w-3 h-3" />
                        <span>Date prévisible des modifications</span>
                        {/* Tooltip: the anticipated date when the creditor's financial situation will change */}
                        <InfoTooltip content="Date prévue du changement de situation du créancier." />
                      </label>
                      {/* Standard HTML date picker for the expected change date */}
                      <input
                        type="date"
                        value={creditorChangeDate}
                        onChange={(e) => setCreditorChangeDate(e.target.value)} // Update state on change
                        className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl p-4 text-[var(--text-primary)] focus:border-[var(--color-plasma-cyan)] outline-none"
                      />
                    </div>
                  </>
                )}

                {/* ===== Non-Income-Producing Property Value ===== */}
                {/* Value of the creditor's own assets that don't currently generate income (e.g., a secondary residence) */}
                <div className="p-6 border glass-panel rounded-2xl border-white/10">
                  <label className="flex items-center space-x-2 text-[10px] uppercase tracking-widest text-gray-400 mb-4">
                    <Wallet className="w-3 h-3" />
                    <span>Patrimoine propre non producteur de revenus (€)</span>
                    {/* Tooltip: explains this is property that doesn't currently generate income */}
                    <InfoTooltip content="Valeur du patrimoine propre du créancier actuellement non producteur de revenus." />
                  </label>
                  {/* CurrencyInput for the total value of non-income-producing assets */}
                  <CurrencyInput
                    min="0"
                    value={creditorPropertyValue}
                    onValueChange={setCreditorPropertyValue}
                    placeholder="ex: 100 000"
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl p-4 text-[var(--text-primary)] focus:border-[var(--color-plasma-cyan)] outline-none"
                  />

                  {/* Toggle button to show/hide the custom yield rate input */}
                  <button
                    type="button"
                    onClick={() => {
                      // Toggle the visibility of the yield rate input
                      setShowYieldInput((v) => !v);
                      // If we're about to show it and the yield is empty, set the default
                      if (!showYieldInput && creditorPropertyYield === "")
                        setCreditorPropertyYield(DEFAULT_YIELD_RATE_STR);
                    }}
                    className="mt-3 text-[10px] uppercase tracking-widest text-[var(--color-plasma-cyan)] hover:underline flex items-center space-x-1"
                  >
                    {/* Percent icon next to the toggle text */}
                    <Percent className="w-3 h-3" />
                    <span>
                      {/* Toggle label: "Hide yield rate" when visible, "Edit yield rate?" when hidden */}
                      {showYieldInput
                        ? "Masquer le taux de rendement"
                        : "Modifier le taux de rendement ?"}
                    </span>
                  </button>

                  {/* Conditionally rendered yield rate input — only shown when the user clicks the toggle */}
                  {showYieldInput && (
                    <div className="mt-3">
                      <label className="flex items-center space-x-2 text-[10px] uppercase tracking-widest text-gray-400 mb-2">
                        <Percent className="w-3 h-3" />
                        <span>Taux de rendement estimé (%)</span>
                        {/* Tooltip: explains the default rate and that this is creditor-specific */}
                        <InfoTooltip
                          content={`Taux de rendement annuel estimé du patrimoine non productif. Par défaut ${DEFAULT_YIELD_RATE} %. Ce taux est propre au créancier.`}
                        />
                      </label>
                      {/* Numeric input for the estimated annual yield rate (0–100%, step 0.1) */}
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={creditorPropertyYield}
                        onChange={
                          (e) => setCreditorPropertyYield(e.target.value) // Update yield rate state on change
                        }
                        placeholder={DEFAULT_YIELD_RATE_STR}
                        className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl p-4 text-[var(--text-primary)] focus:border-[var(--color-plasma-cyan)] outline-none"
                      />
                    </div>
                  )}
                </div>

                {/* ===== Retirement Gap Years ===== */}
                {/* Number of years the creditor did not contribute to retirement during the marriage (career break) */}
                <div className="p-6 border glass-panel rounded-2xl border-white/10">
                  <label className="flex items-center space-x-2 text-[10px] uppercase tracking-widest text-gray-400 mb-4">
                    <Wallet className="w-3 h-3" />
                    <span>
                      Années sans cotisations retraite pendant le mariage
                    </span>
                    {/* Tooltip: explains this counts years without pension contributions; leave 0 if not applicable */}
                    <InfoTooltip content="Nombre d'années sans cotisations retraite pendant le mariage (interruption de carrière, etc.). Laissez 0 si non applicable." />
                  </label>
                  {/* Numeric input for the number of gap years (minimum 0) */}
                  <input
                    type="number"
                    min="0"
                    value={creditorRetirementGapYears}
                    onChange={
                      (e) => setCreditorRetirementGapYears(e.target.value) // Update state with the entered number of years
                    }
                    placeholder="ex: 5"
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl p-4 text-[var(--text-primary)] focus:border-[var(--color-plasma-cyan)] outline-none"
                  />
                </div>

                {/* ===== Pre-Retirement Monthly Income ===== */}
                {/* The creditor's monthly income before they stopped working — used to calculate retirement gap compensation */}
                <div className="p-6 border glass-panel rounded-2xl border-white/10">
                  <label className="flex items-center space-x-2 text-[10px] uppercase tracking-widest text-gray-400 mb-4">
                    <Wallet className="w-3 h-3" />
                    <span>
                      Revenu mensuel avant cessation d'activité (€/mois)
                    </span>
                    {/* Tooltip: used to compute the flat-rate retirement deficit repair */}
                    <InfoTooltip content="Revenu mensuel moyen du créancier avant la cessation d'activité, utilisé pour calculer la réparation forfaitaire du déficit de retraite." />
                  </label>
                  {/* CurrencyInput for the monthly income before the creditor stopped working */}
                  <CurrencyInput
                    min="0"
                    value={creditorPreRetirementIncome}
                    onValueChange={setCreditorPreRetirementIncome}
                    placeholder="ex: 2 000"
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl p-4 text-[var(--text-primary)] focus:border-[var(--color-plasma-cyan)] outline-none"
                  />
                </div>
                {/* End of Axel Depondt conditional fields fragment */}
              </>
            )}
            {/* End of form fields container */}
          </div>
          {/* End of GuidedStep wrapper */}
        </GuidedStep>
        {/* End of scrollable content area */}
      </div>

      {/* ===== Editorial / AdSense Block ===== */}
      {/* This section contains a native ad unit for Google AdSense compliance — editorial content wrapper */}
      <div className="px-6 pb-6 space-y-4">
        {/* Centered ad container with max width */}
        <div className="flex justify-center">
          {/* AdUnit component renders a native ad; type="native" for in-content format */}
          <AdUnit type="native" className="w-full max-w-md" />
        </div>
      </div>

      {/* ===== Fixed Footer with "Next" Button ===== */}
      {/* Pinned to the bottom of the viewport; gradient fades from transparent to the dark background */}
      {/* In guided mode (when not all steps are done), pointer events are disabled to prevent premature navigation */}
      <div
        className={`fixed bottom-0 left-0 w-full p-3 sm:p-6 bg-gradient-to-t from-[var(--color-deep-space)] to-transparent z-20 ${isGuided && !allDone ? "pointer-events-none" : ""}`}
        style={{
          // Respect the iOS safe-area-inset at the bottom to avoid the home indicator overlapping the button
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.75rem)",
        }}
      >
        {/* "Validate and continue" button — saves form data and navigates to the next wizard page */}
        {/* In guided mode (not all done), the button is visually dimmed and blurred to discourage interaction */}
        <button
          onClick={handleNext}
          className={`w-full max-w-md mx-auto bg-[var(--color-plasma-cyan)] hover:bg-[var(--accent-hover)] text-white font-bold py-3 sm:py-5 rounded-2xl shadow-[0_0_30px_rgba(34,211,238,0.3)] transition-all flex items-center justify-center space-x-2 sm:space-x-3 group active:scale-95 ${isGuided && !allDone ? "opacity-20 blur-[3px]" : ""}`}
          style={{ color: "#ffffff" }} // Explicit white text color fallback
        >
          {/* Button label: shorter text on mobile ("Valider"), full text on larger screens ("Valider et poursuivre") */}
          <span className="text-xs tracking-wider uppercase sm:text-sm sm:tracking-widest">
            {/* Mobile-only short label */}
            <span className="sm:hidden">Valider</span>
            {/* Desktop/tablet full label */}
            <span className="hidden sm:inline">Valider et poursuivre</span>
          </span>
          {/* Arrow-right icon indicating forward navigation; slides right on hover via group-hover */}
          <ArrowRight className="w-4 h-4 transition-transform sm:w-5 sm:h-5 group-hover:translate-x-1" />
        </button>
      </div>
      {/* Render the guided header tour overlay (shown when guided mode is active across the app) */}
      <GuidedHeaderTour />
      {/* End of root container */}
    </div>
  );
};

// Export the CreancierPage component as the default export so it can be used in the router configuration
export default CreancierPage;
