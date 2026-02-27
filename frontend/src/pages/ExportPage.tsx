// Import React core library and the useState hook for managing component-level state
import React, { useState } from "react";

// Import icon components from lucide-react used for the export UI:
// Share2 = download/share icon, FileLock = sealed document icon,
// Power = shutdown/exit icon, ChevronLeft = back arrow, Home = home navigation
import { Share2, FileLock, Power, ChevronLeft, Home } from "lucide-react";
// Import useNavigate from react-router-dom for programmatic page navigation
import { useNavigate } from "react-router-dom";

// Import the legal calculation engine (computes divorce simulation results),
// along with TypeScript types for the simulation result and financial input data
import {
  legalEngine,
  type SimulationResult,
  type FinancialData,
} from "../services/legalEngine";
// Import the PDF generation service used to create downloadable reports
import { pdfGenerator } from "../services/pdfGenerator";
// Import the SEO component for setting page title and meta description (improves search engine indexing)
import { SEO } from "../components/SEO";

// TypeScript interface describing the shape of export data:
// - financial: the raw financial inputs entered by the user (incomes, assets, debts, etc.)
// - simulation: the calculated divorce simulation results produced by the legal engine
interface ExportData {
  financial: FinancialData; // The user's financial input data
  simulation: SimulationResult; // The computed simulation output
}

// Main ExportPage functional component — allows users to download their divorce simulation
// report as a PDF and optionally wipe all local data for privacy
const ExportPage: React.FC = () => {
  // Hook for programmatic navigation (go back, go home, etc.)
  const navigate = useNavigate();
  // State flag: when true, plays a visual "imploding" animation while wiping data
  const [isImploding, setIsImploding] = useState(false);
  // State flag: controls visibility of the "confirm data wipe" modal dialog
  const [showExitModal, setShowExitModal] = useState(false);

  // Lazily initialize export data from localStorage on first render.
  // Uses a state initializer function (runs only once) to avoid re-reading on every render.
  const [data] = useState<ExportData | null>(() => {
    // Attempt to retrieve previously saved financial data from the browser's localStorage
    const raw = localStorage.getItem("financialData");
    // If no data exists, return null (user hasn't completed the simulation)
    if (!raw) return null;
    try {
      // Parse the stored JSON string back into a JavaScript object
      const financial = JSON.parse(raw);
      // Run the legal engine's calculation on the financial data to produce simulation results
      const simulation = legalEngine.calculate(financial);
      // Return both the raw financial inputs and the computed results as a bundle
      return { financial, simulation };
    } catch (e) {
      // If parsing or calculation fails, log the error and return null
      console.error("Failed to calculate export data", e);
      return null;
    }
  });

  // Async handler to generate and download the PDF report.
  // Called when the user clicks the "Télécharger" (Download) button.
  const generatePDF = async () => {
    // Guard clause: if no data is available, abort early
    if (!data) return;
    try {
      // Delegate PDF creation to the pdfGenerator service, passing financial input and simulation results.
      // The service internally builds the PDF document and triggers a browser download.
      await pdfGenerator.generateReport(data.financial, data.simulation);
    } catch (e) {
      // Log the error for debugging purposes
      console.error(e);
      // Show a user-facing alert in French indicating PDF generation failed, with an internal error code
      alert(
        "Échec de la génération du rapport via le service PDF. (Code: PDF_GEN_02)",
      );
    }
  };

  // Handler invoked when the user confirms they want to wipe all data and exit.
  // Triggers the "imploding" animation, clears localStorage, then redirects to the landing page.
  const confirmWipe = () => {
    // Close the confirmation modal immediately
    setShowExitModal(false);
    // Activate the visual "imploding" animation (black screen with fade effect)
    setIsImploding(true);
    // Wait 1.5 seconds to let the animation play before clearing data
    setTimeout(() => {
      // Erase all data from the browser's localStorage (financial data, preferences, etc.)
      localStorage.clear();
      // Navigate the user back to the landing/home page
      navigate("/");
      // Note: navigating to "/" effectively closes the session.
      // A "Session closed" toast could be shown on the landing page for better UX.
    }, 1500);
  };

  // If the data-wipe animation is active, render a fullscreen "session closed" animation
  // instead of the normal export UI. This provides dramatic visual feedback for privacy reassurance.
  if (isImploding) {
    return (
      // Fullscreen black background container centered both horizontally and vertically
      <div className="h-screen bg-black flex items-center justify-center overflow-hidden relative">
        {/* Animated imploding visual effect — a large blurred white circle that pulses */}
        <div className="animate-implode flex flex-col items-center z-10">
          {/* Large glowing circle with heavy blur to create a light-burst effect */}
          <div className="w-96 h-96 rounded-full bg-white blur-[100px] animate-pulse" />
        </div>
        {/* Overlay text informing the user their session has been securely closed */}
        <div className="absolute text-center z-20">
          <p
            className="font-bold tracking-widest text-xl uppercase mb-2"
            style={{ color: "#ffffff" }}
          >
            {/* "Session Closed" — displayed in French */}
            Session Clôturée
          </p>
          <p className="text-(--color-plasma-cyan) text-xs">
            {/* "Your privacy is preserved" — reassurance message in French */}
            Votre vie privée est préservée.
          </p>
        </div>
      </div>
    );
  }

  // Main render: the export/download page UI
  return (
    // Outer container: full-screen dark background with centered content and padding
    <div className="min-h-screen bg-(--color-deep-space) flex flex-col items-center justify-center p-6 text-center relative">
      {/* SEO component sets the page <title> and <meta description> for search engines */}
      <SEO
        title="Export du Rapport"
        description="Téléchargez votre rapport de simulation de divorce."
        path="/"
      />
      {/* Navigation Header — fixed at the top with back, title, and home buttons */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-20">
        {/* Back button — navigates to the previous page in browser history */}
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition group flex items-center justify-center"
        >
          {/* Left chevron icon; brightens on hover via group-hover */}
          <ChevronLeft className="w-5 h-5 text-gray-300 group-hover:text-white" />
        </button>
        {/* Page title label displayed in the center of the header bar */}
        <span className="text-xs font-bold tracking-[0.2em] text-white uppercase text-glow">
          Export
        </span>
        {/* Home button — navigates directly to the app's landing page */}
        <button
          onClick={() => navigate("/")}
          className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition group flex items-center justify-center"
          title="Accueil"
        >
          {/* Home icon; brightens on hover */}
          <Home className="w-5 h-5 text-gray-300 group-hover:text-white" />
        </button>
      </div>
      {/* Decorative background noise texture overlay — adds subtle grain for visual depth */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5" />
      {/* Decorative background grid — draws a 50×50px grid pattern using CSS linear gradients
          to give the page a futuristic/technical aesthetic */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(var(--border-color) 1px, transparent 1px), linear-gradient(90deg, var(--border-color) 1px, transparent 1px)",
          backgroundSize: "50px 50px",
          opacity: 0.3,
        }}
      />

      {/* Main content card — glass morphism panel with rounded corners, fade-in animation, and subtle border */}
      <div className="glass-panel p-8 rounded-3xl w-full max-w-sm relative z-10 animate-fade-in border border-white/10">
        {/* Sealed Packet Visual — a circular icon representing the sealed/secure document */}
        <div className="w-24 h-24 bg-(--color-plasma-cyan)/10 rounded-full flex items-center justify-center mx-auto mb-6 relative group cursor-pointer hover:bg-(--color-plasma-cyan)/20 transition-all duration-500">
          {/* Subtle circular border ring around the icon for visual emphasis */}
          <div className="absolute inset-0 rounded-full border border-(--color-plasma-cyan) opacity-30" />
          {/* FileLock icon — symbolizes a secure, sealed document ready for download */}
          <FileLock className="w-10 h-10 text-(--color-plasma-cyan)" />
        </div>

        {/* Main heading: "Summary Document" in French */}
        <h1 className="text-2xl font-bold text-white mb-2 tracking-wide text-glow">
          Document récapitulatif
        </h1>
        {/* Subtitle: "Your document is ready to be downloaded" in French */}
        <p className="text-gray-400 mb-8 text-sm">
          Votre document est prêt à être téléchargé.
        </p>

        {/* Primary action button — triggers PDF generation and download when clicked.
            Styled with teal/cyan background, glow shadow, and a press-down scale animation. */}
        <button
          onClick={generatePDF}
          className="w-full bg-(--color-plasma-cyan) hover:bg-(--accent-hover) text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(20,184,166,0.3)] mb-6 flex items-center justify-center space-x-2 transition transform active:scale-95"
          style={{ color: "#ffffff" }}
        >
          {/* Share/download icon displayed to the left of the button label */}
          <Share2 className="w-5 h-5" />
          {/* Button label: "Download the estimate" in French */}
          <span className="uppercase tracking-widest text-xs">
            Télécharger l'estimation
          </span>
        </button>

        {/* Danger zone section — separated by a top border for visual distinction */}
        <div className="border-t border-white/10 pt-6 mt-2">
          {/* "Wipe data and exit" button — styled in red to signal a destructive action.
              Opens a confirmation modal before actually wiping data. */}
          <button
            onClick={() => setShowExitModal(true)}
            className="w-full group bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-500 font-medium py-3 rounded-xl flex items-center justify-center space-x-2 transition-all duration-300"
          >
            {/* Power/shutdown icon reinforcing the "exit" action */}
            <Power className="w-4 h-4" />
            {/* Button label: "Erase data and exit" in French */}
            <span className="text-xs uppercase tracking-widest group-hover:text-red-400">
              Effacer les données et quitter
            </span>
          </button>
          {/* Privacy disclaimer in tiny text: "Erasure applies only to your browser's memory,
              we don't store anything" — reinforcing the app's privacy-first approach */}
          <p className="text-[9px] text-gray-600 mt-2">
            L'effacement sera actif au niveau de la mémoire de votre navigateur,
            nous ne conservons rien.
          </p>
        </div>
      </div>

      {/* Exit Confirmation Modal — only rendered when the user clicks the wipe button.
          Displays a fullscreen overlay asking for final confirmation before erasing all data. */}
      {showExitModal && (
        // Fullscreen fixed overlay with dark semi-transparent backdrop and blur effect
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
          {/* Modal dialog card — glass panel with red-tinted border and glow shadow */}
          <div className="glass-panel p-6 rounded-2xl max-w-xs w-full border border-red-500/30 shadow-[0_0_40px_rgba(239,68,68,0.2)]">
            {/* Modal title: "Final Confirmation" in French */}
            <h3 className="text-lg font-bold text-white mb-2">
              Confirmation finale
            </h3>
            {/* Warning message explaining the consequences of data wipe:
                "Do you really want to leave? Your undownloaded PDF report will be permanently lost,
                because we don't store anything on our servers." */}
            <p className="text-sm text-gray-300 mb-6 leading-relaxed">
              Voulez-vous vraiment quitter ? <br />
              <span className="text-red-400">
                Votre rapport PDF non téléchargé sera définitivement perdu
              </span>
              , car nous ne conservons rien sur nos serveurs.
            </p>
            {/* Action buttons row — Cancel (left) and Confirm Wipe (right) */}
            <div className="flex space-x-3">
              {/* Cancel button — closes the modal without taking any action */}
              <button
                onClick={() => setShowExitModal(false)}
                className="flex-1 py-3 rounded-xl bg-[var(--bg-tertiary)] hover:bg-[var(--border-color)] text-[var(--text-primary)] text-xs font-bold uppercase tracking-wider transition"
              >
                {/* "Cancel" in French */}
                Annuler
              </button>
              {/* Confirm wipe button — triggers the data erasure and session-close animation */}
              <button
                onClick={confirmWipe}
                className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-xs font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(239,68,68,0.4)] transition"
                style={{ color: "#ffffff" }}
              >
                {/* "Erase Everything" in French */}
                Tout Effacer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Default export of the ExportPage component so it can be imported by the router
export default ExportPage;
