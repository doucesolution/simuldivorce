// Import React and useState hook for managing local component state
import React, { useState } from "react";
// Import useNavigate hook for programmatic route navigation
import { useNavigate } from "react-router-dom";
// Import icon components from lucide-react — each serves a specific UI purpose in the disclaimer blocks
import {
  AlertTriangle, // Warning triangle icon for the "Limitations" disclaimer block
  ShieldAlert, // Shield with alert icon for the header and "No liability" block
  ArrowRight, // Right arrow icon used in the continue button
  LogOut, // Logout icon used in the quit/abandon button
  Scale, // Legal scale icon for the "No legal value" block
  FileWarning, // File warning icon for the "Doesn't replace a lawyer" block
  Ban, // Ban/prohibition icon for the "Not admissible in court" block
} from "lucide-react";
// Import SEO component for page meta tags and breadcrumbJsonLd helper for structured breadcrumb data
import { SEO, breadcrumbJsonLd } from "../components/SEO";

// Define the DisclaimerPage functional component — displays legal warnings the user must accept before proceeding
const DisclaimerPage: React.FC = () => {
  // useNavigate provides programmatic navigation to other routes
  const navigate = useNavigate();
  // State: array of 5 booleans tracking whether each checkbox is checked (one per disclaimer block)
  const [checks, setChecks] = useState([false, false, false, false, false]);
  // Derived value: true only when ALL 5 checkboxes are checked — enables the continue button
  const allAccepted = checks.every(Boolean);

  // Toggle function: flips the boolean at index `i` in the checks array while preserving others
  const toggle = (i: number) =>
    setChecks((prev) => prev.map((v, idx) => (idx === i ? !v : v)));

  // Handler for the "Continue" button — only proceeds if all disclaimers are accepted
  const handleContinue = () => {
    // If not all checkboxes are checked, do nothing (button should be disabled but this is a safety check)
    if (!allAccepted) return;
    // Store the acceptance flag in localStorage so the app knows disclaimer was accepted
    localStorage.setItem("disclaimerAccepted", "true");

    // Auto-select all PC (prestation compensatoire) calculation methods — this skips the CalculationChoicePage
    // The three methods are: axelDepondt (Calcul PC), pilote (Tiers Pondéré), and insee (INSEE method)
    const autoChoices = {
      selectedCalcs: ["prestationCompensatoire"],
      selectedMethods: {
        prestationCompensatoire: ["axelDepondt", "pilote", "insee"],
      },
    };
    // Persist the auto-selected calculation choices to localStorage for use by other pages
    localStorage.setItem("calculationChoices", JSON.stringify(autoChoices));

    // Auto-set the simulation to guided mode — this skips the SimulationModePage
    // Guided mode shows step-by-step tooltips helping the user fill out forms
    localStorage.setItem("simulationMode", "guided");

    // Navigate to the first data entry page (prestation compensatoire — marriage/family info)
    navigate("/prestation-compensatoire");
  };

  // Handler for the "Quit" button — navigates back to the landing/home page
  const handleQuit = () => {
    navigate("/");
  };

  // Render the disclaimer page layout
  return (
    // Full-screen container with deep space background, flex column layout, white text
    <div className="min-h-screen bg-[var(--color-deep-space)] flex flex-col relative text-white">
      {/* SEO component: sets page title, meta description, and structured breadcrumb data for search engines */}
      <SEO
        title="Avertissement Juridique — SimulDivorce"
        description="Avertissement : cet outil ne constitue pas un conseil juridique. Prenez connaissance des limitations avant de commencer la simulation."
        path="/"
        jsonLd={breadcrumbJsonLd([
          { name: "Accueil", path: "/" },
          { name: "Avertissement", path: "/disclaimer" },
        ])}
      />

      {/* Background — large blurred amber circle for warm atmospheric effect matching warning theme */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[120px]" />

      {/* Header — page title area with shield icon, heading, and subtitle */}
      <div className="p-6 pt-10 z-10 text-center">
        {/* Circular icon container with amber tint, houses the ShieldAlert icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 mb-4">
          {/* Shield alert icon — visually signals this is an important legal warning */}
          <ShieldAlert className="w-8 h-8 text-amber-400" />
        </div>
        {/* Page heading: "Important Warning" with glow text effect */}
        <h1 className="text-2xl font-bold text-white text-glow mb-2">
          Avertissement Important
        </h1>
        {/* Subtitle asking user to read carefully before continuing */}
        <p className="text-sm text-gray-400 max-w-md mx-auto">
          Veuillez lire attentivement les informations ci-dessous avant de
          continuer.
        </p>
      </div>

      {/* Disclaimer Content — scrollable area containing the 5 disclaimer blocks and action buttons */}
      <div className="flex-1 overflow-y-auto px-6 pb-10 z-10 scrollbar-hide">
        {/* Content container with max width and vertical spacing between blocks */}
        <div className="max-w-lg mx-auto space-y-4">
          {/* Block 1 — "No legal value": explains results are indicative estimates only */}
          <div className="glass-panel p-5 rounded-2xl border border-amber-500/20">
            {/* Horizontal layout: icon on left, content on right */}
            <div className="flex items-start space-x-3">
              {/* Icon container — Scale icon representing legal/justice theme */}
              <div className="shrink-0 mt-0.5">
                <Scale className="w-5 h-5 text-amber-400" />
              </div>
              {/* Text content area */}
              <div className="flex-1">
                {/* Block title: "No legal value" */}
                <h3 className="text-sm font-bold text-white mb-1">
                  Aucune valeur juridique
                </h3>
                {/* Explanation: results are purely informational estimates, not legal acts or advice */}
                <p className="text-xs text-gray-300 leading-relaxed">
                  Les résultats fournis par SimulDivorce sont de simples{" "}
                  <strong className="text-white">
                    estimations indicatives
                  </strong>{" "}
                  à caractère purement informatif. Ils ne constituent en aucun
                  cas un acte juridique, un conseil juridique, ni un avis
                  d'avocat ou de notaire.
                </p>
                {/* Checkbox label — user must check to acknowledge understanding */}
                <label className="flex items-center space-x-3 mt-3 cursor-pointer select-none">
                  {/* Checkbox input bound to checks[0] — toggles when clicked */}
                  <input
                    type="checkbox"
                    checked={checks[0]}
                    onChange={() => toggle(0)}
                    className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 accent-[var(--color-plasma-cyan)] cursor-pointer rounded"
                  />
                  {/* Acknowledgment text: "I understand that the results have no legal value" */}
                  <span className="text-xs sm:text-sm text-gray-400">
                    J'ai compris que les résultats n'ont aucune valeur juridique
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Block 2 — "Not admissible in court": results cannot be used as evidence before a judge */}
          <div className="glass-panel p-5 rounded-2xl border border-amber-500/20">
            <div className="flex items-start space-x-3">
              {/* Ban icon — represents prohibition/inadmissibility */}
              <div className="shrink-0 mt-0.5">
                <Ban className="w-5 h-5 text-amber-400" />
              </div>
              <div className="flex-1">
                {/* Block title: "Not admissible before a judge" */}
                <h3 className="text-sm font-bold text-white mb-1">
                  Non recevable devant un juge
                </h3>
                {/* Explanation: estimates are not admissible before family court (JAF) or any jurisdiction */}
                <p className="text-xs text-gray-300 leading-relaxed">
                  Les estimations produites par cet outil{" "}
                  <strong className="text-white">ne sont pas recevables</strong>{" "}
                  devant un juge aux affaires familiales (JAF), un tribunal
                  judiciaire, ou toute autre juridiction. Elles ne peuvent en
                  aucun cas se substituer à une décision de justice.
                </p>
                {/* Checkbox for acknowledgment — bound to checks[1] */}
                <label className="flex items-center space-x-3 mt-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={checks[1]}
                    onChange={() => toggle(1)}
                    className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 accent-[var(--color-plasma-cyan)] cursor-pointer rounded"
                  />
                  {/* "I understand that the results are not admissible in court" */}
                  <span className="text-xs sm:text-sm text-gray-400">
                    J'ai compris que les résultats ne sont pas recevables en
                    justice
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Block 3 — "Does not replace a legal professional": consultation with a lawyer is imperative */}
          <div className="glass-panel p-5 rounded-2xl border border-amber-500/20">
            <div className="flex items-start space-x-3">
              {/* FileWarning icon — signals the tool has limitations */}
              <div className="shrink-0 mt-0.5">
                <FileWarning className="w-5 h-5 text-amber-400" />
              </div>
              <div className="flex-1">
                {/* Block title: "Does not replace a legal professional" */}
                <h3 className="text-sm font-bold text-white mb-1">
                  Ne remplace pas un professionnel du droit
                </h3>
                {/* Explanation: a lawyer or notary must be consulted for any real divorce situation */}
                <p className="text-xs text-gray-300 leading-relaxed">
                  Cet outil ne remplace pas la consultation d'un{" "}
                  <strong className="text-white">avocat</strong>, d'un{" "}
                  <strong className="text-white">notaire</strong>, ou de tout
                  autre professionnel du droit compétent. Pour toute situation
                  réelle de divorce, il est impératif de faire appel à un
                  conseil juridique qualifié.
                </p>
                {/* Checkbox for acknowledgment — bound to checks[2] */}
                <label className="flex items-center space-x-3 mt-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={checks[2]}
                    onChange={() => toggle(2)}
                    className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 accent-[var(--color-plasma-cyan)] cursor-pointer rounded"
                  />
                  {/* "I understand that this tool does not replace a lawyer" */}
                  <span className="text-xs sm:text-sm text-gray-400">
                    J'ai compris que cet outil ne remplace pas un avocat
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Block 4 — "Simulation limitations": calculations use simplified formulas and public scales */}
          <div className="glass-panel p-5 rounded-2xl border border-amber-500/20">
            <div className="flex items-start space-x-3">
              {/* AlertTriangle icon — classic warning symbol for limitations */}
              <div className="shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <div className="flex-1">
                {/* Block title: "Simulation limitations" */}
                <h3 className="text-sm font-bold text-white mb-1">
                  Limites de la simulation
                </h3>
                {/* Explanation: calculations use simplified doctrinal formulas and public data from Justice Ministry/INSEE */}
                {/* They don't account for all criteria a judge might consider (career sacrifices, future assets, health, etc.) */}
                <p className="text-xs text-gray-300 leading-relaxed">
                  Les calculs reposent sur des formules doctrinales simplifiées
                  et des barèmes publics (Ministère de la Justice, INSEE). Ils
                  ne tiennent pas compte de l'ensemble des critères que le juge
                  peut retenir : sacrifices de carrière, patrimoine futur, état
                  de santé, etc. Les montants réels peuvent différer
                  significativement.
                </p>
                {/* Checkbox for acknowledgment — bound to checks[3] */}
                <label className="flex items-center space-x-3 mt-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={checks[3]}
                    onChange={() => toggle(3)}
                    className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 accent-[var(--color-plasma-cyan)] cursor-pointer rounded"
                  />
                  {/* "I understand the limitations of this simulation" */}
                  <span className="text-xs sm:text-sm text-gray-400">
                    J'ai compris les limites de cette simulation
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Block 5 — "No liability": the publisher disclaims all responsibility for use of results */}
          <div className="glass-panel p-5 rounded-2xl border border-amber-500/20">
            <div className="flex items-start space-x-3">
              {/* ShieldAlert icon — reinforces the liability disclaimer visually */}
              <div className="shrink-0 mt-0.5">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
              </div>
              <div className="flex-1">
                {/* Block title: "No liability" */}
                <h3 className="text-sm font-bold text-white mb-1">
                  Absence de responsabilité
                </h3>
                {/* Explanation: SimulDivorce publisher declines all liability; user acknowledges limitations */}
                <p className="text-xs text-gray-300 leading-relaxed">
                  L'éditeur de SimulDivorce décline toute responsabilité quant à
                  l'utilisation qui pourrait être faite des résultats de cette
                  simulation. En poursuivant, vous reconnaissez avoir pris
                  connaissance de ces limitations et les accepter pleinement.
                </p>
                {/* Checkbox for acknowledgment — bound to checks[4] */}
                <label className="flex items-center space-x-3 mt-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={checks[4]}
                    onChange={() => toggle(4)}
                    className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 accent-[var(--color-plasma-cyan)] cursor-pointer rounded"
                  />
                  {/* "I accept the publisher's absence of liability" */}
                  <span className="text-xs sm:text-sm text-gray-400">
                    J'accepte l'absence de responsabilité de l'éditeur
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Buttons — Continue and Quit actions */}
          <div className="space-y-3 mt-2">
            {/* Continue button — enabled only when all 5 checkboxes are checked */}
            <button
              onClick={handleContinue}
              disabled={!allAccepted}
              className={`w-full font-bold py-4 rounded-2xl transition-all flex items-center justify-center space-x-2 sm:space-x-3 group active:scale-95 ${
                // Conditional styling: cyan glow when all accepted, gray disabled when not
                allAccepted
                  ? "bg-[var(--color-plasma-cyan)] hover:bg-[var(--accent-hover)] text-white shadow-[0_0_30px_rgba(34,211,238,0.3)]"
                  : "bg-gray-700/50 text-gray-500 cursor-not-allowed"
              }`}
              // Force white text color when all checkboxes accepted to override any CSS variable issues
              style={{ color: allAccepted ? "#ffffff" : undefined }}
            >
              {/* Button label — responsive: shorter text on small screens, longer on larger screens */}
              <span className="text-xs sm:text-sm tracking-wider sm:tracking-widest uppercase">
                {/* Mobile-only shortened text: "I accept and continue" */}
                <span className="sm:hidden">J'accepte et continue</span>
                {/* Desktop version with formal phrasing: "I accept and I continue" */}
                <span className="hidden sm:inline">
                  J'accepte et je continue
                </span>
              </span>
              {/* Arrow icon that slides right on hover for visual feedback */}
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Quit button — returns user to the landing page, no data saved */}
            <button
              onClick={handleQuit}
              className="w-full py-3 rounded-2xl border border-white/10 text-gray-400 hover:text-white hover:border-white/30 transition-all flex items-center justify-center space-x-2 active:scale-95"
            >
              {/* Logout icon indicating exit/abandon action */}
              <LogOut className="w-4 h-4" />
              {/* "Abandon and quit" label */}
              <span className="tracking-widest text-xs uppercase">
                Abandonner et quitter
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Export DisclaimerPage as the default export for use by the router
export default DisclaimerPage;
