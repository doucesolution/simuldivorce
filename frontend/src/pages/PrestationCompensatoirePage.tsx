// Import React core library along with hooks:
// - useState: manages local component state (form fields, modal visibility, etc.)
// - useEffect: runs side-effects on mount (e.g. scroll to top)
// - useMemo: memoizes derived values to avoid unnecessary recalculations
import React, { useState, useEffect, useMemo } from "react";
// Import useNavigate from React Router to programmatically navigate between pages
import { useNavigate } from "react-router-dom";
// Import icon components from the lucide-react icon library.
// These SVG icons are used throughout the page for visual cues:
// - Calendar: used next to date input fields (marriage date, divorce date)
// - Users: used next to children/family-related fields
// - ArrowRight: used on the "next" / "continue" buttons
// - AlertTriangle: used in the warning modal when marriage date is missing
// - X: used as the close button for the modal
// - ChevronLeft: used as the "back" navigation arrow in the header
// - Home: used as the "home" navigation icon in the header
// - Scale: used as a decorative icon for the "prestation compensatoire" section headers
import {
  Calendar,
  Users,
  ArrowRight,
  AlertTriangle,
  X,
  ChevronLeft,
  Home,
  Scale,
} from "lucide-react";
// Import the InfoTooltip component which renders a small (i) icon that shows
// explanatory text on hover/click — used to explain legal terms to the user
import { InfoTooltip } from "../components/InfoTooltip";
// Import the GuidedStep wrapper component and the useGuidedSteps hook.
// GuidedStep highlights one section at a time in guided mode, while
// useGuidedSteps tracks which step the user is on and whether all steps are done.
import { GuidedStep, useGuidedSteps } from "../components/GuidedTooltip";
// Import GuidedHeaderTour which renders an optional guided-tour overlay
// at the top of the page to onboard new users
import { GuidedHeaderTour } from "../components/GuidedHeaderTour";
// Import the SEO component (sets <title>, <meta>, Open Graph tags) and
// breadcrumbJsonLd helper (generates JSON-LD structured data for breadcrumbs)
import { SEO, breadcrumbJsonLd } from "../components/SEO";
// Import the AdUnit component that renders Google AdSense ad placements
import { AdUnit } from "../components/AdUnit";
// Import utility functions from the central divorce-form store:
// - loadFormData: retrieves previously saved form data from localStorage
// - saveFormData: persists the current form fields to localStorage
// - getNextPage / getPreviousPage: determine the next/previous route in the wizard
// - getPageIndex / getTotalPages: return the current page index and total page count (for the progress bar)
// - getCalculationChoices: returns which calculation methods the user has selected
import {
  loadFormData,
  saveFormData,
  getNextPage,
  getPreviousPage,
  getPageIndex,
  getTotalPages,
  getCalculationChoices,
} from "../services/divorceFormStore";

// Define the PrestationCompensatoirePage functional component.
// This page collects marriage/family information needed to compute the
// "prestation compensatoire" (compensatory allowance) in a French divorce.
const PrestationCompensatoirePage: React.FC = () => {
  // Obtain the navigate function from React Router to move between wizard pages
  const navigate = useNavigate();
  // Store the current route path — used to look up page position and adjacent pages
  const currentPath = "/prestation-compensatoire";
  // Determine the zero-based index of this page in the wizard sequence (for the progress bar)
  const pageIdx = getPageIndex(currentPath);
  // Get the total number of pages in the wizard (for the progress bar)
  const totalPages = getTotalPages();

  // Load any previously saved form data from localStorage so the user
  // can resume where they left off without losing previously entered values
  const stored = loadFormData();

  // ── Local state for form fields ──
  // Each field is initialised from the stored (persisted) data.

  // marriageDate: the date the couple got married (ISO string, e.g. "2010-06-15")
  const [marriageDate, setMarriageDate] = useState(stored.marriageDate);
  // divorceDate: the date of divorce or effective separation
  const [divorceDate, setDivorceDate] = useState(stored.divorceDate);
  // childrenCount: integer number of children from the marriage
  const [childrenCount, setChildrenCount] = useState(stored.childrenCount);
  // childrenAges: array of integers representing each child's age in years,
  // used to determine OECD consumption units (< 14 → 0.3 UC, ≥ 14 → 0.5 UC)
  const [childrenAges, setChildrenAges] = useState<number[]>(
    stored.childrenAges,
  );
  // custodyType: the custody arrangement — "classic" (visiting rights),
  // "alternating" (50/50 shared), or "reduced" (extended visiting rights)
  const [custodyType, setCustodyType] = useState(stored.custodyType);

  // showDateModal: controls visibility of the modal that forces the user
  // to enter a valid marriage date before proceeding
  const [showDateModal, setShowDateModal] = useState(false);
  // dateModalError: holds the validation error message displayed inside the modal
  const [dateModalError, setDateModalError] = useState("");

  // ── Calculation method flags ──
  // Retrieve which calculation methods the user previously selected on the
  // calculation-choice page (e.g. "insee", "pratique", "patrimoine", etc.)
  const { selectedMethods } = getCalculationChoices();
  // Extract the array of methods specifically for the "prestation compensatoire" calculation
  const pcMethods = selectedMethods.prestationCompensatoire || [];
  // The INSEE method requires family data (children count, ages, custody type)
  // because it uses OECD-modified consumption units. Other methods may not need this.
  const needsFamilyData = pcMethods.includes("insee");

  // Build the list of guided-mode section names dynamically.
  // Always include "mariage" (marriage info); only include "famille" (family info)
  // if the INSEE method is selected and we actually need family data.
  const guidedSections = useMemo(() => {
    const s: string[] = ["mariage"];
    if (needsFamilyData) {
      s.push("famille");
    }
    return s;
  }, [needsFamilyData]);

  // Initialize the guided-tour stepper hook with the total number of sections.
  // Returns:
  // - currentStep: the index of the section currently highlighted
  // - advanceStep: callback to move to the next guided step
  // - allDone: boolean indicating the user has completed all guided steps
  // - isGuided: boolean indicating whether guided mode is currently active
  const { currentStep, advanceStep, allDone, isGuided } = useGuidedSteps(
    guidedSections.length,
  );

  // Helper to convert a section name (e.g. "mariage") to its numeric index
  // in the guidedSections array, used by GuidedStep's `step` prop
  const stepIdx = (name: string) => guidedSections.indexOf(name);

  // On component mount, scroll the window to the top so the user always
  // starts at the beginning of the page (important when navigating back)
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Persist the current form field values to localStorage.
  // Called before navigating away so the user's input is not lost.
  const save = () => {
    saveFormData({
      marriageDate,
      divorceDate,
      childrenCount,
      childrenAges,
      custodyType,
    });
  };

  // Handler for the main "Validate & Continue" button at the bottom of the page.
  // Validates that a marriage date is present and not in the future,
  // then saves the data and navigates to the next page in the wizard.
  const handleNext = () => {
    // If no marriage date has been entered, show the modal with an error
    if (!marriageDate) {
      setDateModalError("Veuillez entrer une date de mariage pour continuer.");
      setShowDateModal(true);
      return;
    }
    // If the marriage date is in the future, show the modal with a different error
    if (new Date(marriageDate) > new Date()) {
      setDateModalError("La date de mariage ne peut pas être dans le futur.");
      setShowDateModal(true);
      return;
    }
    // All validations passed — persist the form data and navigate forward
    save();
    navigate(getNextPage(currentPath));
  };

  // Handler for the "Continue" button inside the date-correction modal.
  // Re-validates the marriage date entered in the modal before proceeding.
  const handleModalConfirm = () => {
    // Re-check: marriage date must be filled in
    if (!marriageDate) {
      setDateModalError("Veuillez entrer une date de mariage.");
      return;
    }
    // Re-check: marriage date must not be in the future
    if (new Date(marriageDate) > new Date()) {
      setDateModalError("La date de mariage ne peut pas être dans le futur.");
      return;
    }
    // Close the modal and clear any error messages
    setShowDateModal(false);
    setDateModalError("");
    // Persist and navigate to the next wizard page
    save();
    navigate(getNextPage(currentPath));
  };

  return (
    // Root container: takes full dynamic viewport height, dark "deep space" background,
    // flex column layout, white text, and hidden overflow to contain the page
    <div className="h-[100dvh] bg-[var(--color-deep-space)] flex flex-col relative text-white overflow-hidden">
      {/* SEO component: injects <title>, <meta description>, Open Graph / Twitter Card tags,
          and JSON-LD breadcrumb structured data into the document <head>.
          This improves search-engine indexing and social-media link previews. */}
      <SEO
        title="Prestation Compensatoire — Simulation Divorce"
        description="Renseignez les informations nécessaires au calcul de la prestation compensatoire : mariage, identité, revenus, famille."
        path="/"
        jsonLd={breadcrumbJsonLd([
          { name: "Accueil", path: "/" },
          {
            name: "Prestation Compensatoire",
            path: "/prestation-compensatoire",
          },
        ])}
      />

      {/* Decorative background glow: a large blurred cyan circle at the top-right
          corner that provides a subtle futuristic ambient light effect */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--color-plasma-cyan)]/10 rounded-full blur-[100px]" />

      {/* ====== Page Header ======
          Sticky top bar with a frosted-glass effect (backdrop-blur).
          Contains: back button, page title, and home button.
          safe-area-inset-top adds padding for devices with notches (e.g. iPhones). */}
      <div
        className="bg-black/20 backdrop-blur-md border-b border-white/5 p-4 flex justify-between items-center sticky top-0 z-50"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1rem)" }}
      >
        {/* Back button: navigates to the previous page in the wizard sequence */}
        <button
          onClick={() => navigate(getPreviousPage(currentPath))}
          className="p-2 rounded-full hover:bg-white/10 group flex items-center justify-center"
        >
          <ChevronLeft className="w-5 h-5 text-gray-400 group-hover:text-white" />
        </button>
        {/* Page title centered in the header bar */}
        <h1 className="text-sm font-bold tracking-widest uppercase text-glow">
          Prestation Compensatoire
        </h1>
        {/* Home button: takes the user directly back to the landing page */}
        <button
          onClick={() => navigate("/")}
          className="p-2 rounded-full hover:bg-white/10 group flex items-center justify-center"
          title="Accueil"
        >
          <Home className="w-5 h-5 text-gray-400 group-hover:text-white" />
        </button>
      </div>

      {/* ====== Progress Bar + Subtitle Section ======
          Displays a segmented progress bar (one segment per wizard page)
          followed by the page heading and explanatory text. */}
      <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2 z-10">
        {/* Progress indicator: row of thin horizontal bars.
            The bar matching the current page index is highlighted in cyan;
            all others are rendered in a neutral border colour. */}
        <div className="flex justify-end mb-6">
          <div className="flex space-x-1">
            {Array.from({ length: totalPages }).map((_, i) => (
              <div
                key={i}
                className={`w-8 h-1 rounded-full ${i === pageIdx ? "bg-[var(--color-plasma-cyan)]" : "bg-[var(--border-color)]"}`}
              />
            ))}
          </div>
        </div>
        {/* Main page heading — "Prestation Compensatoire" (Compensatory Allowance) */}
        <h1 className="text-2xl font-bold text-white text-glow mb-2">
          Prestation Compensatoire
        </h1>
        {/* Short instruction text telling the user what information to fill in */}
        <p className="text-sm text-gray-400">
          Renseignez les informations nécessaires au calcul de la prestation
          compensatoire.
        </p>
        {/* Extended legal context: explains why marriage duration and family situation
            are key criteria (Art. 271 of the French Civil Code) and describes
            the OECD consumption-unit scale used by the INSEE calculation method */}
        <p className="mt-2 text-xs leading-relaxed text-gray-500">
          La durée du mariage et la situation familiale sont des critères clés
          du calcul (art. 271 du Code Civil). Les unités de consommation OCDE
          utilisées par la méthode INSEE attribuent 0,3 UC par enfant de moins
          de 14 ans et 0,5 UC au-delà.
        </p>
      </div>

      {/* ====== Main Scrollable Content Area ======
          This flex-1 container fills remaining vertical space and scrolls vertically.
          Bottom padding (pb-28/32) prevents content from being hidden behind the
          fixed footer button. The animate-fade-in class adds an entrance animation. */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-28 sm:pb-32 animate-fade-in relative z-10 scrollbar-hide space-y-8">
        {/* ── Section 1: Marriage Information ──
            Wrapped in a GuidedStep so that in guided mode this section is highlighted
            and the user receives a tooltip explaining what to do.
            isComplete is true once the user has entered a marriage date. */}
        <GuidedStep
          step={stepIdx("mariage")}
          currentStep={currentStep}
          totalSteps={guidedSections.length}
          onAdvance={advanceStep}
          content="Entrez la date de votre mariage et, si connue, la date de divorce ou séparation. La durée du mariage est un critère clé de la prestation compensatoire."
          stepLabel="Mariage"
          isComplete={!!marriageDate}
        >
          <div className="space-y-6">
            {/* Section category label with a Scale icon and uppercase teal text */}
            <div className="flex items-center space-x-2">
              <Scale className="w-4 h-4 text-teal-400" />
              <span className="text-xs uppercase tracking-widest text-teal-400 font-bold">
                Prestation Compensatoire — Mariage
              </span>
            </div>

            {/* ── Marriage Date input card ──
                A glass-morphism panel containing a date input.
                The max attribute prevents selecting a future date. */}
            <div className="glass-panel p-6 rounded-2xl border border-white/10">
              {/* Label with a Calendar icon and the text "Date de Mariage" (Wedding Date) */}
              <label className="flex items-center space-x-2 text-[10px] uppercase tracking-widest text-gray-400 mb-4">
                <Calendar className="w-3 h-3" /> <span>Date de Mariage</span>
              </label>
              {/* Native HTML date picker bound to the marriageDate state.
                  max is set to today's date to prevent future dates. */}
              <input
                type="date"
                value={marriageDate}
                max={new Date().toISOString().split("T")[0]}
                onChange={(e) => setMarriageDate(e.target.value)}
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl p-4 text-[var(--text-primary)] focus:border-[var(--color-plasma-cyan)] outline-none"
              />
            </div>

            {/* ── Divorce / Separation Date input card ──
                Optional field. The min is constrained to the marriage date
                (a divorce cannot predate the marriage). */}
            <div className="glass-panel p-6 rounded-2xl border border-white/10">
              {/* Label with Calendar icon, "Date de Divorce / Séparation" text,
                  and an InfoTooltip that explains what date to enter */}
              <label className="flex items-center space-x-2 text-[10px] uppercase tracking-widest text-gray-400 mb-4">
                <Calendar className="w-3 h-3" />{" "}
                <span>Date de Divorce / Séparation</span>
                <InfoTooltip content="Indiquez la date du prononcé du divorce, ou à défaut la date de séparation effective. Cette date sert à calculer la durée du mariage." />
              </label>
              {/* Date picker for divorce/separation date.
                  min = marriage date (cannot divorce before marrying).
                  max = today (cannot set a future divorce date). */}
              <input
                type="date"
                value={divorceDate}
                min={marriageDate || undefined}
                max={new Date().toISOString().split("T")[0]}
                onChange={(e) => setDivorceDate(e.target.value)}
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl p-4 text-[var(--text-primary)] focus:border-[var(--color-plasma-cyan)] outline-none"
              />
              {/* If both dates are filled in, compute and display the marriage duration
                  in years. The formula divides the millisecond difference by the number
                  of milliseconds in an average year (365.25 days). */}
              {marriageDate && divorceDate && (
                <p className="text-xs text-[var(--text-muted)] mt-2">
                  Durée du mariage :{" "}
                  {Math.max(
                    0,
                    Math.round(
                      (new Date(divorceDate).getTime() -
                        new Date(marriageDate).getTime()) /
                        (1000 * 60 * 60 * 24 * 365.25),
                    ),
                  )}{" "}
                  ans
                </p>
              )}
            </div>
          </div>
        </GuidedStep>

        {/* ── Section 2: Family Information (only shown when INSEE method is selected) ──
            This entire block is conditionally rendered based on needsFamilyData.
            The INSEE method needs children count, ages, and custody type to compute
            OECD-modified consumption units (UC) for the compensatory allowance formula. */}
        {needsFamilyData && (
          <GuidedStep
            step={stepIdx("famille")}
            currentStep={currentStep}
            totalSteps={guidedSections.length}
            onAdvance={advanceStep}
            content="Les informations familiales (enfants, garde) influencent le calcul de la prestation compensatoire via les unités de consommation (UC OCDE) et déterminent également le montant de la pension alimentaire."
            stepLabel="Famille"
            isComplete={true}
          >
            <div className="space-y-6">
              {/* Section category label with Scale icon */}
              <div className="flex items-center space-x-2">
                <Scale className="w-4 h-4 text-teal-400" />
                <span className="text-xs uppercase tracking-widest text-teal-400 font-bold">
                  Prestation Compensatoire — Famille
                </span>
              </div>

              {/* ── Children Count stepper card ──
                  A +/− stepper control for the number of children.
                  Decrementing also trims the childrenAges array to stay in sync. */}
              <div className="glass-panel p-6 rounded-2xl border border-white/10">
                {/* Label with Users icon and "Enfants" (Children) text */}
                <label className="flex items-center space-x-2 text-[10px] uppercase tracking-widest text-gray-400 mb-4">
                  <Users className="w-3 h-3" /> <span>Enfants</span>
                </label>
                {/* Stepper row: minus button, current count, plus button */}
                <div className="flex items-center justify-between bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl p-2">
                  {/* Minus button: decrements childrenCount (min 0) and trims the ages array */}
                  <button
                    onClick={() => {
                      const n = Math.max(0, childrenCount - 1);
                      setChildrenCount(n);
                      setChildrenAges((prev) => prev.slice(0, n));
                    }}
                    className="w-10 h-10 rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--border-color)] flex items-center justify-center text-xl font-bold transition"
                  >
                    -
                  </button>
                  {/* Display the current number of children in monospace cyan text */}
                  <span className="text-2xl font-mono text-[var(--color-plasma-cyan)]">
                    {childrenCount}
                  </span>
                  {/* Plus button: increments childrenCount and appends a default age (0) */}
                  <button
                    onClick={() => {
                      setChildrenCount(childrenCount + 1);
                      setChildrenAges((prev) => [...prev, 0]);
                    }}
                    className="w-10 h-10 rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--border-color)] flex items-center justify-center text-xl font-bold transition"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* ── Children Ages card ──
                  Only rendered when there is at least one child.
                  Displays a number input for each child's age.
                  The age determines the OECD consumption unit:
                  < 14 years = 0.3 UC, ≥ 14 years = 0.5 UC */}
              {childrenCount > 0 && (
                <div className="glass-panel p-6 rounded-2xl border border-white/10">
                  {/* Label with Users icon, "Âge des Enfants" (Children's Ages),
                      and an InfoTooltip explaining the OECD UC impact */}
                  <label className="flex items-center space-x-2 text-[10px] uppercase tracking-widest text-gray-400 mb-4">
                    <Users className="w-3 h-3" /> <span>Âge des Enfants</span>
                    <InfoTooltip content="L'âge de chaque enfant détermine les unités de consommation OCDE (< 14 ans = 0.3 UC, ≥ 14 ans = 0.5 UC) et influence le calcul de la prestation compensatoire." />
                  </label>
                  {/* Grid of age inputs — one row per child on mobile, two columns on sm+ */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Iterate over the childrenCount to render one input per child */}
                    {Array.from({ length: childrenCount }).map((_, i) => (
                      <div key={i} className="flex items-center space-x-3">
                        {/* Label showing which child this is ("Enfant 1", "Enfant 2", etc.) */}
                        <span className="text-sm text-gray-400 shrink-0">
                          Enfant {i + 1}
                        </span>
                        {/* Number input for this child's age (0–30 range).
                            On change, clone the ages array and update the specific index. */}
                        <input
                          type="number"
                          min="0"
                          max="30"
                          value={childrenAges[i] ?? 0}
                          onChange={(e) => {
                            const newAges = [...childrenAges];
                            newAges[i] = parseInt(e.target.value) || 0;
                            setChildrenAges(newAges);
                          }}
                          className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl p-3 text-[var(--text-primary)] focus:border-[var(--color-plasma-cyan)] outline-none text-center w-20 min-w-[5rem]"
                        />
                        {/* Unit label "ans" (years) displayed after the input */}
                        <span className="text-sm text-gray-500 shrink-0">
                          ans
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Custody Type selection card ──
                  Only rendered when there is at least one child.
                  Provides three mutually exclusive buttons for the custody arrangement:
                  - "Classique": standard visiting rights (every other weekend)
                  - "Alternée": alternating / shared custody (50-50)
                  - "Réduite": reduced / extended visiting rights */}
              {childrenCount > 0 && (
                <div className="glass-panel p-6 rounded-2xl border border-white/10">
                  {/* Label with Users icon and "Type de Garde" (Custody Type) text */}
                  <label className="flex items-center space-x-2 text-[10px] uppercase tracking-widest text-gray-400 mb-4">
                    <Users className="w-3 h-3" /> <span>Type de Garde</span>
                  </label>
                  {/* Vertical stack of custody option buttons */}
                  <div className="space-y-3">
                    {/* Map over the three custody options to render a button for each.
                        The selected option gets a cyan border and glow effect. */}
                    {[
                      { key: "classic", label: "Classique (Droit de visite)" },
                      { key: "alternating", label: "Alternée (50/50)" },
                      { key: "reduced", label: "Réduite (Élargi)" },
                    ].map((g) => (
                      <button
                        key={g.key}
                        onClick={() => setCustodyType(g.key)}
                        className={`w-full p-4 rounded-xl border text-sm font-medium transition-all duration-300 ${
                          custodyType === g.key
                            ? "border-[var(--color-plasma-cyan)] bg-[var(--color-plasma-cyan)]/10 text-white shadow-[0_0_15px_rgba(34,211,238,0.2)]"
                            : "border-white/5 bg-white/5 text-gray-400 hover:bg-white/10"
                        }`}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </GuidedStep>
        )}
      </div>

      {/* ====== Marriage Date Validation Modal ======
          This modal appears when the user tries to proceed without entering a
          valid marriage date. It overlays the entire viewport with a dark
          semi-transparent backdrop and a centered dialog box. */}
      {showDateModal && (
        // Backdrop overlay: clicking it dismisses the modal
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => {
            setShowDateModal(false);
            setDateModalError("");
          }}
        >
          {/* Modal dialog box: stops click propagation so clicking inside
              the modal does not close it (only the backdrop click does) */}
          <div
            className="bg-[var(--color-deep-space)] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header: warning icon + title + close (X) button */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                {/* Amber warning icon inside a tinted circle */}
                <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                </div>
                {/* Modal title: "Date de mariage requise" (Marriage date required) */}
                <h3 className="text-lg font-bold text-white">
                  Date de mariage requise
                </h3>
              </div>
              {/* Close button in the top-right corner of the modal header */}
              <button
                onClick={() => {
                  setShowDateModal(false);
                  setDateModalError("");
                }}
                className="text-gray-400 hover:text-white transition p-2 rounded-full hover:bg-white/10 cursor-pointer"
                type="button"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Modal body: error message, date input, and confirm button */}
            <div className="p-6 space-y-4">
              {/* Display the specific validation error, or a default prompt
                  if no error string is set */}
              <p className="text-sm text-gray-300 leading-relaxed">
                {dateModalError ||
                  "Veuillez entrer votre date de mariage pour continuer la simulation."}
              </p>
              {/* Date input inside the modal so the user can correct it in-place */}
              <div>
                {/* Label for the date field */}
                <label className="text-xs text-gray-400 mb-2 block">
                  Date de mariage
                </label>
                {/* Date picker: updating it also clears any previous error */}
                <input
                  type="date"
                  value={marriageDate}
                  max={new Date().toISOString().split("T")[0]}
                  onChange={(e) => {
                    setMarriageDate(e.target.value);
                    setDateModalError("");
                  }}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl p-4 text-[var(--text-primary)] focus:border-[var(--color-plasma-cyan)] outline-none"
                />
              </div>
              {/* Confirm / Continue button: validates the date and proceeds
                  to the next wizard page if valid */}
              <button
                onClick={handleModalConfirm}
                className="w-full bg-[var(--color-plasma-cyan)] hover:bg-[var(--accent-hover)] text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center space-x-2 active:scale-95"
                style={{ color: "#ffffff" }}
              >
                {/* Button label "Continuer" (Continue) */}
                <span className="tracking-widest text-sm uppercase">
                  Continuer
                </span>
                {/* Right arrow icon to indicate forward navigation */}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====== AdSense native ad unit ======
          Editorial content block placed between the form and the footer.
          Required for Google AdSense policy compliance (ads must appear
          alongside substantive editorial content). */}
      <div className="px-6 pb-6 space-y-4">
        <div className="flex justify-center">
          {/* Renders a "native" style ad that blends with the surrounding content */}
          <AdUnit type="native" className="w-full max-w-md" />
        </div>
      </div>

      {/* ====== Fixed Footer with "Next" button ======
          Pinned to the bottom of the viewport. A gradient fades from the
          deep-space background upward so the button floats above content.
          In guided mode (isGuided && !allDone), the button is visually
          disabled (low opacity + blur) and pointer events are blocked
          until the user completes all guided steps. */}
      <div
        className={`fixed bottom-0 left-0 w-full p-3 sm:p-6 bg-gradient-to-t from-[var(--color-deep-space)] to-transparent z-20 ${isGuided && !allDone ? "pointer-events-none" : ""}`}
        style={{
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.75rem)",
        }}
      >
        {/* Primary action button: "Valider et poursuivre" (Validate and continue).
            On mobile (sm:hidden) a shorter label "Valider" is shown.
            Calls handleNext which validates and navigates. */}
        <button
          onClick={handleNext}
          className={`w-full max-w-md mx-auto bg-[var(--color-plasma-cyan)] hover:bg-[var(--accent-hover)] text-white font-bold py-3 sm:py-5 rounded-2xl shadow-[0_0_30px_rgba(34,211,238,0.3)] transition-all flex items-center justify-center space-x-2 sm:space-x-3 group active:scale-95 ${isGuided && !allDone ? "opacity-20 blur-[3px]" : ""}`}
          style={{ color: "#ffffff" }}
        >
          <span className="text-xs sm:text-sm tracking-wider sm:tracking-widest uppercase">
            {/* Short label for mobile screens */}
            <span className="sm:hidden">Valider</span>
            {/* Full label for wider screens */}
            <span className="hidden sm:inline">Valider et poursuivre</span>
          </span>
          {/* Arrow icon that slides right on hover via group-hover */}
          <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
      {/* Renders the optional guided-tour header overlay that onboards
          new users by highlighting UI elements step by step */}
      <GuidedHeaderTour />
    </div>
  );
};

// Export the component as the default export so it can be lazy-loaded
// or imported by the React Router route configuration
export default PrestationCompensatoirePage;
