// Import React core library along with useState (for local state management) and useEffect (for side-effects on mount/update)
import React, { useState, useEffect } from "react";
// Import useNavigate hook from React Router to enable programmatic page navigation
import { useNavigate } from "react-router-dom";
// Import icon components from the lucide-react icon library, each used in the UI for visual cues:
// - ChevronLeft: back navigation arrow
// - Home: home navigation button
// - UserCheck: icon for the creditor (beneficiary) section header
// - UserMinus: icon for the debtor section header
// - Calendar: icon for date-related input fields
// - MapPin: icon for address input fields
// - Banknote: icon for the yield rate (financial parameter) input field
// - ArrowRight: icon on the "continue" button to indicate progression
import {
  ChevronLeft,
  Home,
  UserCheck,
  UserMinus,
  Calendar,
  MapPin,
  Banknote,
  ArrowRight,
} from "lucide-react";
// Import the SEO component which sets <head> meta tags (title, description, etc.) for search engine optimization
import { SEO } from "../components/SEO";
// Import helper functions and TypeScript types from the lawyer case store service:
// - loadCaseData: reads persisted case data from localStorage
// - saveCaseData: writes case data back to localStorage
// - LawyerCaseData: type defining the full case data structure (debtor, creditor, evaluation params)
// - PartyIdentity: type for a single party's identity fields (birthDate, fullAddress, etc.)
import {
  loadCaseData,
  saveCaseData,
  type LawyerCaseData,
  type PartyIdentity,
} from "../services/lawyerCaseStore";

// Define the LawyerIdentityPage functional component — this page lets lawyers enter identity
// information for both divorce parties (debtor and creditor) and set evaluation parameters.
const LawyerIdentityPage: React.FC = () => {
  // Obtain the navigate function from React Router to redirect the user to other pages
  const navigate = useNavigate();
  // Initialize the caseData state with the data previously saved in localStorage.
  // The lazy initializer arrow function ensures loadCaseData() is called only on first render,
  // avoiding unnecessary reads from localStorage on every re-render.
  const [caseData, setCaseData] = useState<LawyerCaseData>(() =>
    loadCaseData(),
  );

  // On component mount, scroll the window to the top so the user starts at the beginning of the form.
  // The empty dependency array [] ensures this effect runs only once after the initial render.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Helper function to update a specific field on the debtor's identity.
  // Uses a functional state update to safely merge the new value into the existing state,
  // spreading the previous debtor object and overriding only the specified field.
  const updateDebtor = (field: keyof PartyIdentity, value: string) => {
    setCaseData((prev) => ({
      ...prev,
      debtor: { ...prev.debtor, [field]: value },
    }));
  };

  // Helper function to update a specific field on the creditor's identity.
  // Works identically to updateDebtor but targets the creditor sub-object instead.
  const updateCreditor = (field: keyof PartyIdentity, value: string) => {
    setCaseData((prev) => ({
      ...prev,
      creditor: { ...prev.creditor, [field]: value },
    }));
  };

  // Helper function to update a root-level field on LawyerCaseData (e.g. evaluationDate, yieldRate).
  // The Omit<…, "debtor" | "creditor"> type constraint ensures only non-party fields are accepted,
  // preventing accidental overwrite of the nested debtor/creditor objects.
  const updateRoot = (
    field: keyof Omit<LawyerCaseData, "debtor" | "creditor">,
    value: string,
  ) => {
    setCaseData((prev) => ({ ...prev, [field]: value }));
  };

  // Persist the current in-memory case data to localStorage by delegating to the saveCaseData service.
  // This is called before navigating away so user input is not lost.
  const handleSave = () => {
    saveCaseData(caseData);
  };

  // Handler for the "Continue" button: first saves the case data to localStorage,
  // then navigates the user to the prestation compensatoire (compensatory allowance) simulation page.
  const handleNext = () => {
    handleSave();
    navigate("/prestation-compensatoire");
  };

  // Render the page UI
  return (
    // Root container: full dynamic viewport height, dark background, flex column layout, white text, no overflow
    <div className="h-[100dvh] bg-[var(--color-deep-space)] flex flex-col relative text-white overflow-hidden">
      {/* SEO component sets the page title and meta description for search engines.
          noindex=true prevents indexing since this is a private lawyer tool page. */}
      <SEO
        title="Identité des parties — SimulDivorce Pro"
        description="Renseignez l'identité du débiteur et du créancier."
        path="/identite-parties"
        noindex={true}
      />

      {/* Decorative background glow: a large blurred cyan circle in the top-right corner
          to give the page a futuristic ambient lighting effect */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--color-plasma-cyan)]/10 rounded-full blur-[100px]" />

      {/* Sticky header bar with back button, page title, and home button.
          Uses backdrop-blur for a frosted-glass effect and safe-area-inset-top padding for mobile notch support. */}
      <div
        className="bg-black/20 backdrop-blur-md border-b border-white/5 p-4 flex justify-between items-center sticky top-0 z-50"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1rem)" }}
      >
        {/* Back button: navigates to the previous page in the browser history stack */}
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-white/10 group flex items-center justify-center"
        >
          {/* ChevronLeft icon turns white on hover via the group-hover utility */}
          <ChevronLeft className="w-5 h-5 text-gray-400 group-hover:text-white" />
        </button>
        {/* Page title displayed in the center: "Paramètres du dossier" = "Case Parameters" */}
        <h1 className="text-sm font-bold tracking-widest uppercase text-glow">
          Paramètres du dossier
        </h1>
        {/* Home button: navigates to the app root (landing page) */}
        <button
          onClick={() => navigate("/")}
          className="p-2 rounded-full hover:bg-white/10 group flex items-center justify-center"
          title="Accueil"
        >
          {/* Home icon turns white on hover via the group-hover utility */}
          <Home className="w-5 h-5 text-gray-400 group-hover:text-white" />
        </button>
      </div>

      {/* Main scrollable content area. Has bottom padding to account for the fixed "Continue" button.
          The animate-fade-in class provides a subtle entrance animation. */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-28 sm:pb-32 pt-6 animate-fade-in relative z-10 scrollbar-hide space-y-8">
        {/* ── Section: Debtor (Débiteur) ──
            This section collects identity details for the debtor, i.e. the spouse
            with the higher income who may owe the compensatory allowance. */}
        <div className="space-y-4">
          {/* Section header with a UserMinus icon and label */}
          <div className="flex items-center space-x-2">
            {/* UserMinus icon visually represents the debtor (the party who "pays") */}
            <UserMinus className="w-4 h-4 text-teal-400" />
            {/* Label: "Debtor (spouse with the highest income)" */}
            <span className="text-xs uppercase tracking-widest text-teal-400 font-bold">
              Débiteur (époux aux revenus les plus élevés)
            </span>
          </div>

          {/* Glass-morphism panel containing the debtor's input fields */}
          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
            {/* Date of birth input for the debtor, using a date picker input type */}
            <InputRow
              icon={<Calendar className="w-3.5 h-3.5" />}
              label="Date de naissance"
              value={caseData.debtor.birthDate}
              onChange={(v) => updateDebtor("birthDate", v)}
              type="date"
            />
            {/* Full address input for the debtor, with a placeholder showing an example French address */}
            <InputRow
              icon={<MapPin className="w-3.5 h-3.5" />}
              label="Adresse complète"
              value={caseData.debtor.fullAddress}
              onChange={(v) => updateDebtor("fullAddress", v)}
              placeholder="12 rue de la Paix, 75001 Paris"
            />
          </div>
        </div>

        {/* ── Section: Creditor (Créancier) ──
            This section collects identity details for the creditor, i.e. the spouse
            who may be entitled to receive the compensatory allowance. */}
        <div className="space-y-4">
          {/* Section header with a UserCheck icon and label */}
          <div className="flex items-center space-x-2">
            {/* UserCheck icon visually represents the creditor (the potential beneficiary) */}
            <UserCheck className="w-4 h-4 text-teal-400" />
            {/* Label: "Creditor (potential beneficiary)" */}
            <span className="text-xs uppercase tracking-widest text-teal-400 font-bold">
              Créancier (bénéficiaire potentiel)
            </span>
          </div>

          {/* Glass-morphism panel containing the creditor's input fields */}
          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
            {/* Date of birth input for the creditor, using a date picker input type */}
            <InputRow
              icon={<Calendar className="w-3.5 h-3.5" />}
              label="Date de naissance"
              value={caseData.creditor.birthDate}
              onChange={(v) => updateCreditor("birthDate", v)}
              type="date"
            />
            {/* Full address input for the creditor, with a placeholder showing an example French address */}
            <InputRow
              icon={<MapPin className="w-3.5 h-3.5" />}
              label="Adresse complète"
              value={caseData.creditor.fullAddress}
              onChange={(v) => updateCreditor("fullAddress", v)}
              placeholder="34 boulevard Haussmann, 75009 Paris"
            />
          </div>
        </div>

        {/* ── Section: Evaluation Parameters (Paramètres de l'évaluation) ──
            Allows the lawyer to set the evaluation date and annual yield rate
            used in the compensatory allowance calculation methods. */}
        <div className="space-y-4">
          {/* Section header with a Calendar icon and label */}
          <div className="flex items-center space-x-2">
            {/* Calendar icon for the evaluation parameters section */}
            <Calendar className="w-4 h-4 text-teal-400" />
            {/* Label: "Evaluation parameters" */}
            <span className="text-xs uppercase tracking-widest text-teal-400 font-bold">
              Paramètres de l'évaluation
            </span>
          </div>

          {/* Glass-morphism panel containing the evaluation parameter input fields */}
          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
            {/* Date input for the evaluation date — the date at which the simulation is computed */}
            <InputRow
              icon={<Calendar className="w-3.5 h-3.5" />}
              label="Date de l'évaluation"
              value={caseData.evaluationDate}
              onChange={(v) => updateRoot("evaluationDate", v)}
              type="date"
            />
            {/* Numeric input for the annual yield rate (%), used in the capitalization method
                to compute the present value of future payments */}
            <InputRow
              icon={<Banknote className="w-3.5 h-3.5" />}
              label="Taux de rendement annuel (%)"
              value={caseData.yieldRate}
              onChange={(v) => updateRoot("yieldRate", v)}
              placeholder="3"
              type="number"
            />
          </div>
        </div>

        {/* Informational note telling the user that party names should be filled in directly
            on the generated Word document after the simulation is complete */}
        <p className="text-center text-xs text-gray-500">
          Les noms et prénoms des parties sont à compléter directement sur le
          document Word généré à l'issue de la simulation.
        </p>
      </div>

      {/* Fixed bottom bar containing the "Continue" button.
          Uses a gradient background that fades from solid dark at the bottom to transparent at the top
          so the scrollable content appears to fade beneath it. */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[var(--color-deep-space)] via-[var(--color-deep-space)]/95 to-transparent z-30">
        {/* "Continue to simulation" button: saves data and navigates to the prestation compensatoire page.
            Styled with the app's cyan accent color, a glow shadow, and a press-down scale animation. */}
        <button
          onClick={handleNext}
          className="w-full max-w-md mx-auto flex items-center justify-center space-x-2 py-4 rounded-xl font-bold uppercase tracking-widest text-xs bg-[var(--color-plasma-cyan)] hover:bg-[var(--accent-hover)] shadow-[0_0_20px_rgba(20,184,166,0.3)] transition transform active:scale-95"
          style={{ color: "#ffffff" }}
        >
          {/* Button label: "Continue to simulation" */}
          <span>Continuer vers la simulation</span>
          {/* Arrow icon pointing right to indicate forward navigation */}
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

// ── Reusable Input Row Component ──
// A small helper component that renders a labeled input field with an icon.
// Used throughout this page to keep form rows consistent and avoid code duplication.
function InputRow({
  icon, // ReactNode icon element displayed next to the label
  label, // The text label describing the field (e.g. "Date de naissance")
  value, // The current controlled value of the input
  onChange, // Callback invoked with the new string value when the user types
  placeholder, // Optional placeholder text shown when the input is empty
  type = "text", // HTML input type (defaults to "text"); can be "date", "number", etc.
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    // Wrapper div for the input row
    <div>
      {/* Label element displayed above the input, with the icon and label text side-by-side.
          Uses very small uppercase text with wide letter-spacing for a clean, modern look. */}
      <label className="flex items-center space-x-2 text-[10px] uppercase tracking-widest text-gray-400 mb-2">
        {/* Render the icon passed as a prop */}
        {icon}
        {/* Render the label text */}
        <span>{label}</span>
      </label>
      {/* The actual HTML input element. Styled with a semi-transparent background,
          subtle border, rounded corners, and a teal focus ring for accessibility.
          The onChange handler extracts the string value from the event and passes it up. */}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-teal-400/50 focus:ring-1 focus:ring-teal-400/20 transition text-sm"
      />
    </div>
  );
}

// Export the LawyerIdentityPage component as the default export so it can be
// imported and used as a route component in the application's router configuration.
export default LawyerIdentityPage;
