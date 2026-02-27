// Import React and hooks: useState for local state management, useEffect for side effects on mount
import React, { useState, useEffect } from "react";
// Import useNavigate for programmatic route navigation
import { useNavigate } from "react-router-dom";
// Import icons from lucide-react used throughout the dashboard UI
import { Download, ChevronLeft, Home, Scale } from "lucide-react";
// Import the legal calculation engine and its result type for computing divorce simulation results
import { legalEngine, type SimulationResult } from "../services/legalEngine";
// Import InfoTooltip component for hover/click information popups next to labels
import { InfoTooltip } from "../components/InfoTooltip";
// Import SEO component for injecting page title, meta description and structured data into <head>
import { SEO } from "../components/SEO";
// Import isLawyerMode to check if the app is in professional lawyer mode (affects export route)
import { isLawyerMode } from "../services/platform";

// Define the DashboardPage functional component — displays simulation results with PC estimates from multiple methods
const DashboardPage: React.FC = () => {
  // useNavigate hook for programmatic navigation between routes
  const navigate = useNavigate();
  // Determine the export path: lawyers get a dedicated export page, regular users go through an interstitial ad first
  const exportPath = isLawyerMode()
    ? "/export-avocat"
    : "/transition?to=/export";
  // State: raw financial data loaded from localStorage (contains all user inputs from previous pages)
  const [financialData, setFinancialData] = useState<any>(null);
  // State: computed simulation results from the legal engine (PC estimates from all methods)
  const [calculations, setCalculations] = useState<SimulationResult | null>(
    null,
  );

  // State: calculation method choices previously saved by the user (which methods to show results for)
  // Loaded from localStorage — contains selectedCalcs (calculation types) and selectedMethods (specific methods per type)
  const [calcChoices, setCalcChoices] = useState<{
    selectedCalcs: string[]; // Array of selected calculation categories (e.g., "prestationCompensatoire")
    selectedMethods: Record<string, string[]>; // Map of category to specific method IDs
  } | null>(null);

  // useEffect runs once on component mount to load data, run calculations, and load user preferences
  useEffect(() => {
    // Stage A: Load the saved financial data from localStorage (serialized JSON from form pages)
    const rawData = localStorage.getItem("financialData");
    // If no financial data exists, user hasn't completed the form — redirect to home page
    if (!rawData) {
      navigate("/");
      return;
    }

    // Try to parse the JSON data; redirect home if parsing fails (corrupted data)
    let data;
    try {
      data = JSON.parse(rawData);
    } catch {
      navigate("/");
      return;
    }
    // Store the parsed financial data in component state for rendering
    setFinancialData(data);

    // Stage B: Execute the legal calculation engine with the loaded financial data
    // This computes PC estimates using all three methods (Axel Depondt, Pilote, INSEE)
    const result = legalEngine.calculate(data);
    // Store the calculation results in state for display
    setCalculations(result);

    // Stage C: Load the user's calculation method choices from localStorage
    const choicesRaw = localStorage.getItem("calculationChoices");
    // If choices exist, parse and store them; otherwise calcChoices stays null (show all methods)
    if (choicesRaw) {
      try {
        setCalcChoices(JSON.parse(choicesRaw));
      } catch {
        /* ignore parsing errors — will fall back to showing all methods */
      }
    }
  }, []); // Empty dependency array means this runs only once on mount

  // If data hasn't loaded yet or calculations haven't completed, render an empty div (loading state)
  if (!financialData || !calculations) return <div />;

  // Determine whether the Prestation Compensatoire (PC) section should be visible
  // If no choices were saved, default to showing PC section
  const showPC =
    !calcChoices ||
    calcChoices.selectedCalcs.includes("prestationCompensatoire");

  // Determine which specific PC calculation methods to show
  // Default to all three methods if no choices were previously saved by the user
  const pcMethods = calcChoices?.selectedMethods?.prestationCompensatoire || [
    "axelDepondt", // Calcul PC method (Axel Depondt formula — 8-year gross income projection)
    "pilote", // Tiers Pondéré method (income differential × marriage duration × age coefficient)
    "insee", // INSEE method (consumption units analysis based on OECD equivalence scale)
  ];
  // Boolean flags for each method — used to conditionally render method-specific result cards
  const showAxelDepondt = pcMethods.includes("axelDepondt");
  const showPilote = pcMethods.includes("pilote");
  const showInsee = pcMethods.includes("insee");
  // Count how many PC methods are active — used to decide whether to show "average" label
  const pcMethodCount = [showAxelDepondt, showPilote, showInsee].filter(
    Boolean,
  ).length;
  // True if more than one method is selected — determines if we show "moy." (average) or "est." (estimate) label
  const multiplePCMethods = pcMethodCount > 1;

  // Calculate the displayed main PC value as a dynamic average of all active method results
  const activePCValues: number[] = []; // Collect PC values from each active method
  // Add Axel Depondt value if that method is selected and has results
  if (showAxelDepondt && calculations.details?.axelDepondt)
    activePCValues.push(calculations.details.axelDepondt.value);
  // Add Pilote (Tiers Pondéré) value if that method is selected
  if (showPilote) activePCValues.push(calculations.details.pilote.value);
  // Add INSEE value if that method is selected
  if (showInsee) activePCValues.push(calculations.details.insee.value);
  // Compute the average of active method values, or fall back to the engine's default compensatoryAllowance
  const pcMainValue =
    activePCValues.length > 0
      ? Math.round(
          activePCValues.reduce((a, b) => a + b, 0) / activePCValues.length,
        )
      : calculations.compensatoryAllowance;

  // Render the dashboard layout
  return (
    // Full-screen container with deep space background, flex column, white text, bottom padding for fixed elements
    <div className="min-h-screen bg-[var(--color-deep-space)] flex flex-col text-white pb-20">
      {/* SEO component: injects page title and meta description for search engines */}
      <SEO
        title="Résultats de la Simulation"
        description="Visualisez les résultats de votre simulation de divorce."
        path="/"
      />
      {/* Top Bar — sticky navigation header with back, title, home, and download buttons */}
      <div
        className="sticky top-0 z-50 flex items-center justify-between p-4 border-b bg-black/20 backdrop-blur-md border-white/5"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1rem)" }}
      >
        {/* Back button — navigates to the previous page in browser history */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center p-2 rounded-full hover:bg-white/10 group"
        >
          {/* Left chevron icon, turns white on hover via group-hover */}
          <ChevronLeft className="w-5 h-5 text-gray-400 group-hover:text-white" />
        </button>
        {/* Page title: "Dashboard" in French with glowing text effect */}
        <h1 className="text-sm font-bold tracking-widest uppercase text-glow">
          Tableau de Bord
        </h1>
        {/* Right side buttons: Home and Download */}
        <div className="flex items-center space-x-2">
          {/* Home button — navigates back to the landing page */}
          <button
            onClick={() => navigate("/")}
            className="flex items-center justify-center p-2 rounded-full hover:bg-white/10 group"
            title="Accueil"
          >
            {/* Home icon, turns white on hover */}
            <Home className="w-5 h-5 text-gray-400 group-hover:text-white" />
          </button>
          {/* Download button — navigates to the PDF export page (lawyer or regular user version) */}
          <button
            onClick={() => navigate(exportPath)}
            className="p-2.5 rounded-xl bg-[var(--accent-primary)]/15 hover:bg-[var(--accent-primary)]/25 transition group flex items-center justify-center"
            title="Télécharger le rapport"
          >
            {/* Download icon with accent color, turns white on hover */}
            <Download className="w-6 h-6 text-[var(--accent-primary)] group-hover:text-white" />
          </button>
        </div>
      </div>

      {/* Main Content — scrollable area containing all result cards */}
      <div className="z-10 flex-1 px-4 py-6 pb-32 overflow-y-auto scrollbar-hide">
        {/* Animated fade-in container for all content cards */}
        <div className="pb-10 space-y-4 animate-fade-in">
          {/* Prominent Download Button — large CTA at the top encouraging PDF export */}
          <button
            onClick={() => navigate(exportPath)}
            className="w-full bg-[var(--color-plasma-cyan)] hover:bg-[var(--accent-hover)] text-white font-bold py-5 rounded-2xl shadow-[0_0_30px_rgba(34,211,238,0.3)] transition-all flex items-center justify-center gap-2 sm:gap-3 group active:scale-95"
            style={{ color: "#ffffff" }}
          >
            {/* Download icon with bounce-down animation on hover */}
            <Download className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 group-hover:translate-y-0.5 transition-transform" />
            {/* Button label: "Download the PDF report" — responsive text size */}
            <span className="text-xs tracking-widest uppercase sm:text-base">
              Télécharger le rapport PDF
            </span>
          </button>

          {/* Compensatory Allowance section — only shown if PC calculation is selected */}
          {showPC && (
            // Main result card with glass-panel effect, rounded corners, and subtle border
            <div className="relative col-span-2 p-6 overflow-hidden border glass-panel rounded-2xl border-white/10 group">
              {/* Decorative large Scale icon in the top-right corner, fades in on card hover */}
              <div className="absolute top-0 right-0 p-4 transition-opacity opacity-10 group-hover:opacity-20">
                <Scale className="w-24 h-24 text-white" />
              </div>
              {/* Card content with relative z-index to appear above the decorative icon */}
              <div className="relative z-10">
                {/* Section title: "Estimated Compensatory Allowance" with InfoTooltip explaining the concept */}
                <h3 className="mb-2 text-xs font-bold tracking-widest text-gray-400 uppercase leading-relaxed">
                  Prestation Compensatoire Estimée{" "}
                  {/* Inline InfoTooltip explaining what PC is: compensates living standard disparity after divorce */}
                  <span className="inline-block align-middle ml-0.5">
                    <InfoTooltip content="La prestation compensatoire vise à compenser la disparité de niveau de vie entre les époux après le divorce. Elle est versée en capital (somme forfaitaire) par l'époux le plus aisé à celui qui subit une baisse de revenus." />
                  </span>
                </h3>
                {/* Main value display area — shows the computed PC amount prominently */}
                <div className="flex flex-wrap items-baseline space-x-2">
                  {/* Large cyan-colored euro amount — the primary result the user came to see */}
                  <span className="text-4xl sm:text-5xl font-bold text-[var(--color-plasma-cyan)] text-glow">
                    {pcMainValue.toLocaleString()} €
                  </span>
                  {/* Label: "moy." (average) if multiple methods active, "est." (estimate) if single method */}
                  <span className="text-sm text-gray-400">
                    {multiplePCMethods ? "moy." : "est."}
                  </span>
                </div>

                {/* Individual method result cards — displayed in a responsive grid */}
                <div className="grid grid-cols-1 gap-4 mt-4 md:grid-cols-2">
                  {/* Pilote (Tiers Pondéré) method result card — shown if this method is selected */}
                  {showPilote && (
                    // Card with dark background, subtle border that highlights cyan on hover
                    <div className="bg-black/20 p-3 rounded-lg border border-white/5 hover:border-[var(--color-plasma-cyan)]/30 transition-colors">
                      <div className="flex items-center justify-between">
                        {/* Method name label: "Third Method" (Méthode du Tiers) */}
                        <span className="text-sm font-medium text-gray-300">
                          Méthode du Tiers
                        </span>
                        {/* Computed value from the Pilote method, formatted with locale separators */}
                        <span className="font-mono text-[var(--color-plasma-cyan)]">
                          {calculations.details?.pilote.value.toLocaleString()}{" "}
                          €
                        </span>
                      </div>
                    </div>
                  )}

                  {/* INSEE method result card — shown if this method is selected */}
                  {showInsee && (
                    <div className="bg-black/20 p-3 rounded-lg border border-white/5 hover:border-[var(--color-plasma-cyan)]/30 transition-colors">
                      <div className="flex items-center justify-between">
                        {/* Method name label: "Insee Method" */}
                        <span className="text-sm font-medium text-gray-300">
                          Méthode Insee
                        </span>
                        {/* Computed value from the INSEE method */}
                        <span className="font-mono text-[var(--color-plasma-cyan)]">
                          {calculations.details?.insee.value.toLocaleString()} €
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Calcul PC (Axel Depondt) method result card — shown if selected AND results exist */}
                  {showAxelDepondt && calculations.details?.axelDepondt && (
                    <div className="bg-black/20 p-3 rounded-lg border border-white/5 hover:border-[var(--color-plasma-cyan)]/30 transition-colors">
                      <div className="flex items-center justify-between">
                        {/* Method name label: "Calcul PC Method" */}
                        <span className="text-sm font-medium text-gray-300">
                          Méthode Calcul PC
                        </span>
                        {/* Computed value from the Axel Depondt (Calcul PC) method */}
                        <span className="font-mono text-[var(--color-plasma-cyan)]">
                          {calculations.details.axelDepondt.value.toLocaleString()}{" "}
                          €
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Information banner explaining the averaging logic — only shown when multiple methods are active */}
                {multiplePCMethods && (
                  <div className="mt-3 px-3 py-2 rounded-lg bg-[var(--accent-primary)]/5 border border-[var(--accent-primary)]/20">
                    {/* Explains that the final result is the average of all N active methods */}
                    <p className="text-xs text-[var(--accent-primary)]">
                      ✓ Résultat final = Moyenne des {pcMethodCount} méthodes
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Export DashboardPage as the default export for use by the router
export default DashboardPage;
