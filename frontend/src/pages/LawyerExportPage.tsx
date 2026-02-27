// Import React core library and the useState hook for managing local component state
import React, { useState } from "react";
// Import useNavigate hook from React Router to enable programmatic page navigation
import { useNavigate } from "react-router-dom";
// Import icon components from the lucide-react icon library, each serving a specific UI purpose:
// - FileText: icon for the Word document download button
// - FileLock: icon displayed as the main visual element in the export panel (secure document)
// - ChevronLeft: back navigation arrow in the header
// - Home: home navigation button in the header
// - Share2: icon for the PDF download button (sharing/exporting)
// - Power: icon for the "close case" button (power off / shutdown metaphor)
// - Settings: icon for the profile settings button
// - AlertTriangle: warning icon shown when the lawyer profile is incomplete
import {
  FileText,
  FileLock,
  ChevronLeft,
  Home,
  Share2,
  Power,
  Settings,
  AlertTriangle,
} from "lucide-react";
// Import the SEO component which injects <head> meta tags (title, description) for search engines
import { SEO } from "../components/SEO";
// Import the legal calculation engine and its TypeScript types:
// - legalEngine: singleton service that computes compensatory allowance using French legal methods
// - SimulationResult: type describing the output of a simulation (amounts per method, etc.)
// - FinancialData: type describing the financial inputs (incomes, assets, marriage duration, etc.)
import {
  legalEngine,
  type SimulationResult,
  type FinancialData,
} from "../services/legalEngine";
// Import the PDF generator service used to create a downloadable PDF report of the simulation
import { pdfGenerator } from "../services/pdfGenerator";
// Import loadFormData to retrieve the user's divorce form inputs from localStorage
import { loadFormData } from "../services/divorceFormStore";
// Import loadCaseData to retrieve the lawyer's case data (party identities, evaluation params) from localStorage
import { loadCaseData } from "../services/lawyerCaseStore";
// Import loadLawyerProfile to retrieve the lawyer's profile (name, firm, email) and
// isProfileComplete to check whether all required profile fields are filled in
import {
  loadLawyerProfile,
  isProfileComplete,
} from "../services/lawyerProfileStore";
// Note: wordGenerator is imported dynamically (via import()) inside generateWord() below
// to keep the initial JavaScript bundle small — the docx generation library is large.

// Define the LawyerExportPage functional component — this page allows lawyers to
// export the simulation results as either a Word document or a PDF, and to close the case.
const LawyerExportPage: React.FC = () => {
  // Obtain the navigate function from React Router to redirect the user to other pages
  const navigate = useNavigate();
  // State flag indicating whether the Word document generation is currently in progress
  const [isGenerating, setIsGenerating] = useState(false);
  // State flag indicating whether the "case closed" implosion animation is playing
  const [isImploding, setIsImploding] = useState(false);
  // State flag controlling the visibility of the exit confirmation modal dialog
  const [showExitModal, setShowExitModal] = useState(false);

  // Lazy-initialized state that loads financial data from localStorage and computes simulation results.
  // The initializer function runs only on the first render to avoid recalculating on every re-render.
  // Returns null if no financial data is found or if parsing/calculation fails.
  const [data] = useState<{
    financial: FinancialData;
    simulation: SimulationResult;
  } | null>(() => {
    // Attempt to read the raw JSON string of financial data from localStorage
    const raw = localStorage.getItem("financialData");
    // If no data exists, return null (the user hasn't completed the simulation yet)
    if (!raw) return null;
    try {
      // Parse the JSON string into a FinancialData object
      const financial = JSON.parse(raw) as FinancialData;
      // Run the legal calculation engine on the financial data to produce simulation results
      const simulation = legalEngine.calculate(financial);
      // Return both the input data and the computed results as a combined object
      return { financial, simulation };
    } catch (e) {
      // Log the error for debugging purposes if parsing or calculation fails
      console.error("Failed to calculate export data", e);
      // Return null so the UI can show a disabled state for export buttons
      return null;
    }
  });

  // Async handler to generate and download the PDF report.
  // Uses the pdfGenerator service which creates a PDF blob and triggers a browser download.
  const generatePDF = async () => {
    // Guard: do nothing if simulation data is not available
    if (!data) return;
    try {
      // Generate the PDF using the financial data and simulation results
      await pdfGenerator.generateReport(data.financial, data.simulation);
    } catch (e) {
      // Log the error for debugging
      console.error(e);
      // Show a user-friendly error alert with an error code for support reference
      alert("Erreur de génération PDF. (Code: PDF_GEN_02)");
    }
  };

  // Async handler to generate the Word (.docx) document, upload it to Google Drive,
  // and notify the lawyer via email through the webhook service.
  const generateWord = async () => {
    // Guard: do nothing if simulation data is not available
    if (!data) return;
    // Set the generating flag to true to show a loading state on the button
    setIsGenerating(true);
    try {
      // Load the lawyer's case data (party identities and evaluation parameters) from localStorage
      const caseData = loadCaseData();
      // Load the lawyer's profile (name, bar registration, firm, email) from localStorage
      const profile = loadLawyerProfile();
      // Load the divorce form data (financial inputs entered during the simulation) from localStorage
      const formData = loadFormData();

      // Dynamically import the Word document generator to avoid loading the heavy docx library upfront.
      // This code-splits the wordGenerator module into a separate chunk loaded on demand.
      const { generateLawyerDocx } = await import("../services/wordGenerator");
      // Generate the Word document as a Blob, passing all necessary data for the template
      const blob = await generateLawyerDocx({
        formData,
        financialData: data.financial,
        results: data.simulation,
        caseData,
        profile,
      });

      // Dynamically import the webhook service (also code-split for bundle optimization).
      // deliverDocument uploads the blob to Google Drive and sends an email notification
      // to the lawyer with a link to the generated document.
      const { deliverDocument } = await import("../services/webhookService");
      // Upload the document blob and trigger email delivery to the lawyer's registered email
      await deliverDocument(blob, profile.email);
    } catch (e) {
      // Log the error for debugging
      console.error(e);
      // Show a user-friendly error alert in French: "Error generating the Word document"
      alert("Erreur lors de la génération du document Word.");
    } finally {
      // Always reset the generating flag, whether the operation succeeded or failed,
      // so the button returns to its normal state
      setIsGenerating(false);
    }
  };

  // Handler called when the user confirms they want to close/wipe the case.
  // Plays an implosion animation, then clears simulation data and navigates home.
  const confirmWipe = () => {
    // Hide the confirmation modal immediately
    setShowExitModal(false);
    // Trigger the implosion animation by setting the flag to true
    setIsImploding(true);
    // After 1.5 seconds (allowing the animation to play), clear data and redirect
    setTimeout(() => {
      // Remove the financial simulation data from localStorage
      localStorage.removeItem("financialData");
      // Remove the divorce form data from localStorage
      localStorage.removeItem("divorceFormData");
      // Remove the lawyer case data (party identities) from localStorage
      // Note: the lawyer profile is intentionally NOT removed so it persists across cases
      localStorage.removeItem("lawyerCaseData");
      // Navigate to the home/landing page
      navigate("/");
    }, 1500);
  };

  // Check whether the lawyer's profile is complete (all required fields filled).
  // This determines whether to show a warning banner prompting profile completion.
  const profileOk = isProfileComplete(loadLawyerProfile());

  // If the implosion animation is active, render a full-screen black overlay
  // with a pulsing white circle and "Case closed" messaging instead of the normal page
  if (isImploding) {
    return (
      // Full-screen black container centered with overflow hidden to contain the animation
      <div className="h-screen bg-black flex items-center justify-center overflow-hidden relative">
        {/* Animated implosion visual: a large blurred white circle that pulses */}
        <div className="animate-implode flex flex-col items-center z-10">
          <div className="w-96 h-96 rounded-full bg-white blur-[100px] animate-pulse" />
        </div>
        {/* Text overlay displayed on top of the animation */}
        <div className="absolute text-center z-20">
          {/* "Case closed" heading in French */}
          <p
            className="font-bold tracking-widest text-xl uppercase mb-2"
            style={{ color: "#ffffff" }}
          >
            Dossier clôturé
          </p>
          {/* Reassuring message: "Your lawyer profile is preserved" */}
          <p className="text-[var(--color-plasma-cyan)] text-xs">
            Votre profil avocat est conservé.
          </p>
        </div>
      </div>
    );
  }

  // Main render: the export page with download buttons, profile settings, and wipe option
  return (
    // Root container: full min-height screen, dark background, centered layout with padding
    <div className="min-h-screen bg-[var(--color-deep-space)] flex flex-col items-center justify-center p-6 text-center relative">
      {/* SEO component sets the page title and meta description.
          noindex=true prevents search engine indexing since this is a private lawyer tool page. */}
      <SEO
        title="Export Avocat — SimulDivorce Pro"
        description="Exportez le récapitulatif au format Word ou PDF."
        path="/export-avocat"
        noindex={true}
      />

      {/* ── Navigation Header ──
          Fixed at the top, contains back, title, and home buttons */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-20">
        {/* Back button: navigates to the previous page in the browser history */}
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition group flex items-center justify-center"
        >
          {/* ChevronLeft icon turns white on hover via group-hover */}
          <ChevronLeft className="w-5 h-5 text-gray-300 group-hover:text-white" />
        </button>
        {/* Page title: "Export Pro" displayed with wide letter-spacing and glow effect */}
        <span className="text-xs font-bold tracking-[0.2em] text-white uppercase text-glow">
          Export Pro
        </span>
        {/* Home button: navigates to the app root (landing page) */}
        <button
          onClick={() => navigate("/")}
          className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition group flex items-center justify-center"
          title="Accueil"
        >
          {/* Home icon turns white on hover via group-hover */}
          <Home className="w-5 h-5 text-gray-300 group-hover:text-white" />
        </button>
      </div>

      {/* ── Decorative Background Elements ── */}
      {/* Subtle noise texture overlay for visual depth */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5" />
      {/* Grid pattern overlay using CSS linear gradients to create a subtle wireframe/tech aesthetic */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(var(--border-color) 1px, transparent 1px), linear-gradient(90deg, var(--border-color) 1px, transparent 1px)",
          backgroundSize: "50px 50px",
          opacity: 0.3,
        }}
      />

      {/* ── Main Export Card ──
          Glass-morphism panel containing all the export options and actions */}
      <div className="glass-panel p-8 rounded-3xl w-full max-w-sm relative z-10 animate-fade-in border border-white/10">
        {/* Circular icon container with the FileLock icon — represents secure document generation.
            Has a hover effect that intensifies the cyan background. */}
        <div className="w-24 h-24 bg-[var(--color-plasma-cyan)]/10 rounded-full flex items-center justify-center mx-auto mb-6 relative group cursor-pointer hover:bg-[var(--color-plasma-cyan)]/20 transition-all duration-500">
          {/* Decorative border ring around the icon circle with reduced opacity */}
          <div className="absolute inset-0 rounded-full border border-[var(--color-plasma-cyan)] opacity-30" />
          {/* FileLock icon representing a secure/official document */}
          <FileLock className="w-10 h-10 text-[var(--color-plasma-cyan)]" />
        </div>

        {/* Page heading: "Lawyer Export" with glow effect */}
        <h1 className="text-2xl font-bold text-white mb-2 tracking-wide text-glow">
          Export Avocat
        </h1>
        {/* Description text explaining what this page does:
            "Generate the summary document with party identities and the results of the three methods." */}
        <p className="text-gray-400 mb-8 text-sm">
          Générez le document récapitulatif avec l'identité des parties et les
          résultats des trois méthodes.
        </p>

        {/* ── Profile Incomplete Warning ──
            Shown only when the lawyer's profile is missing required fields.
            Clicking it navigates to the profile settings page. */}
        {!profileOk && (
          <button
            onClick={() => navigate("/profil-avocat")}
            className="w-full mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center space-x-3 transition hover:bg-amber-500/20"
          >
            {/* Warning triangle icon in amber color */}
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
            {/* Warning message: "Profile incomplete — configure your identity and firm for a personalized header." */}
            <span className="text-xs text-amber-300 text-left">
              Profil incomplet — configurez votre identité et cabinet pour un
              en-tête personnalisé.
            </span>
          </button>
        )}

        {/* ── Word Document Download Button ──
            Triggers generateWord() which creates a .docx file, uploads it to Google Drive,
            and sends it to the lawyer's email. Disabled when no data or currently generating. */}
        <button
          onClick={generateWord}
          disabled={!data || isGenerating}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.3)] mb-3 flex items-center justify-center space-x-2 transition transform active:scale-95"
          style={{ color: "#ffffff" }}
        >
          {/* FileText icon representing a Word document */}
          <FileText className="w-5 h-5" />
          {/* Button label: shows "Generating…" during generation, otherwise "Download the Word document" */}
          <span className="uppercase tracking-widest text-xs">
            {isGenerating ? "Génération…" : "Télécharger le document Word"}
          </span>
        </button>
        {/* Helper text below the Word button: ".docx format — editable in Word, LibreOffice, Google Docs" */}
        <p className="text-[9px] text-gray-500 mb-6">
          Format .docx — modifiable dans Word, LibreOffice, Google Docs
        </p>

        {/* ── PDF Download Button ──
            Triggers generatePDF() which creates and downloads a PDF report.
            Disabled when no simulation data is available. */}
        <button
          onClick={generatePDF}
          disabled={!data}
          className="w-full bg-[var(--color-plasma-cyan)] hover:bg-[var(--accent-hover)] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(20,184,166,0.3)] mb-6 flex items-center justify-center space-x-2 transition transform active:scale-95"
          style={{ color: "#ffffff" }}
        >
          {/* Share2 icon representing export/sharing */}
          <Share2 className="w-5 h-5" />
          {/* Button label: "Download the classic PDF" */}
          <span className="uppercase tracking-widest text-xs">
            Télécharger le PDF classique
          </span>
        </button>

        {/* ── Profile Settings Link Button ──
            Navigates to the lawyer profile configuration page where the user can set
            their name, bar registration number, firm details, and email. */}
        <button
          onClick={() => navigate("/profil-avocat")}
          className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center space-x-2 transition mb-4"
        >
          {/* Settings gear icon */}
          <Settings className="w-4 h-4 text-gray-400" />
          {/* Button label: "Profile settings" */}
          <span className="text-xs text-gray-300 uppercase tracking-widest">
            Paramètres du profil
          </span>
        </button>

        {/* ── Case Wipe / Close Section ──
            Separated by a top border. Allows the lawyer to delete all simulation data
            for the current case while preserving their profile for future cases. */}
        <div className="border-t border-white/10 pt-6 mt-2">
          {/* "Close case" button styled in red to indicate a destructive action.
              Opens the exit confirmation modal before actually wiping data. */}
          <button
            onClick={() => setShowExitModal(true)}
            className="w-full group bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-500 font-medium py-3 rounded-xl flex items-center justify-center space-x-2 transition-all duration-300"
          >
            {/* Power icon representing shutdown/closure */}
            <Power className="w-4 h-4" />
            {/* Button label: "Close the case" — turns slightly more red on hover */}
            <span className="text-xs uppercase tracking-widest group-hover:text-red-400">
              Clôturer le dossier
            </span>
          </button>
          {/* Explanatory text: "Case data will be deleted. Your lawyer profile is preserved." */}
          <p className="text-[9px] text-gray-600 mt-2">
            Les données du dossier seront supprimées. Votre profil avocat est
            conservé.
          </p>
        </div>
      </div>

      {/* ── Exit Confirmation Modal ──
          Rendered as a full-screen overlay when showExitModal is true.
          Asks the user to confirm before irreversibly wiping simulation data. */}
      {showExitModal && (
        // Full-screen semi-transparent backdrop with blur effect and fade-in animation
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
          {/* Modal card with red-tinted border and glow shadow to emphasize the destructive nature */}
          <div className="glass-panel p-6 rounded-2xl max-w-xs w-full border border-red-500/30 shadow-[0_0_40px_rgba(239,68,68,0.2)]">
            {/* Modal title: "Close the case?" */}
            <h3 className="text-lg font-bold text-white mb-2">
              Clôturer le dossier ?
            </h3>
            {/* Modal body explaining the consequences:
                "All simulation data will be erased. Make sure you've downloaded your document." */}
            <p className="text-sm text-gray-300 mb-6 leading-relaxed">
              Toutes les données de simulation seront effacées.{" "}
              {/* Red-highlighted warning text for emphasis */}
              <span className="text-red-400">
                Assurez-vous d'avoir téléchargé votre document.
              </span>
            </p>
            {/* Action buttons row: Cancel and Confirm */}
            <div className="flex space-x-3">
              {/* Cancel button: closes the modal without performing any action */}
              <button
                onClick={() => setShowExitModal(false)}
                className="flex-1 py-3 rounded-xl bg-[var(--bg-tertiary)] hover:bg-[var(--border-color)] text-[var(--text-primary)] text-xs font-bold uppercase tracking-wider transition"
              >
                Annuler
              </button>
              {/* Confirm "Close" button: calls confirmWipe() to erase data and navigate home.
                  Styled in solid red with a red glow shadow to clearly indicate a destructive action. */}
              <button
                onClick={confirmWipe}
                className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-xs font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(239,68,68,0.4)] transition"
                style={{ color: "#ffffff" }}
              >
                Clôturer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Export the LawyerExportPage component as the default export so it can be
// imported and used as a route component in the application's router configuration.
export default LawyerExportPage;
