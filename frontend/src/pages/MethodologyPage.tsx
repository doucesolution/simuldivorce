// Import React core library along with useState (for local state management) and useEffect (for side effects)
import React, { useState, useEffect } from "react";
// Import createPortal from react-dom to render the modal outside the main DOM hierarchy (directly in document.body)
import { createPortal } from "react-dom";
// Import useNavigate from react-router-dom for programmatic navigation (back button, home button)
import { useNavigate } from "react-router-dom";
// Import various icon components from the lucide-react icon library used throughout the page UI
import {
  ChevronLeft, // Left arrow icon for the "go back" navigation button
  Home, // Home icon for the "go to homepage" navigation button
  BookOpen, // Book icon used in the "Cadre Légal" (Legal Framework) section header
  Scale, // Scale/balance icon used in the "Référentiels de Calcul" (Calculation References) section
  ShieldCheck, // Shield icon used in the "Conformité RGPD" (GDPR Compliance) section header
  Mail, // Mail/envelope icon used in the email modal header and send button
  Download, // Download icon used in the CTA button and local PDF download button
  X, // Close (X) icon used to dismiss the modal
  CheckSquare, // Checked checkbox icon for selected calculation categories in the modal
  Square, // Empty checkbox icon for unselected calculation categories in the modal
  Check, // Checkmark icon displayed in the success state after email submission
  Loader2, // Spinning loader icon shown during the email submission loading state
  ArrowRight, // Right arrow icon shown on the CTA button on larger screens
} from "lucide-react";
// Import the SEO component (sets <title>, <meta>, Open Graph tags) and breadcrumbJsonLd helper for structured data
import { SEO, breadcrumbJsonLd } from "../components/SEO";
// Import the AdUnit component to display Google Ads on this content-rich methodology page
import { AdUnit } from "../components/AdUnit";
// Import the PDF generator service that builds a methodology PDF document using jsPDF
import { generateMethodologyPdf } from "../services/methodologyPdfGenerator";

// Define the available calculation categories that users can select when requesting the methodology PDF.
// Each category has an id (for state tracking), a French label, a description of the calculation methods it covers,
// an icon component, and Tailwind color classes for styling. Currently only "Prestation Compensatoire" is available.
const CALCULATION_CATEGORIES = [
  {
    id: "prestation_compensatoire", // Unique identifier used when toggling selection state
    label: "Prestation Compensatoire", // Display label in French: "Compensatory Benefit"
    description:
      "Méthode Calcul PC (projections magistrat), Méthode Pilote (Tiers Pondéré) et Méthode INSEE (Unités de Consommation OCDE). Coefficients d'âge, durée du mariage, capitalisation.",
    // Description summarizing the three calculation methods: magistrate projections, weighted third, and INSEE consumption units
    icon: Scale, // The lucide-react Scale icon representing justice/calculation
    color: "text-teal-400", // Tailwind text color class for the icon (teal accent)
    bg: "bg-teal-500/10", // Tailwind background color class with 10% opacity for the icon container
  },
];

// Main MethodologyPage component — renders the methodology/sources page explaining SimulDivorce's
// legal references, calculation methods (Calcul PC, Tiers Pondéré, INSEE), GDPR compliance,
// and provides a CTA to download or email a PDF of the detailed formulas.
const MethodologyPage: React.FC = () => {
  // Hook for programmatic navigation (go back, go to home page)
  const navigate = useNavigate();
  // Controls visibility of the email/download modal overlay
  const [showModal, setShowModal] = useState(false);
  // Tracks which calculation categories the user has selected (array of category IDs)
  const [selected, setSelected] = useState<string[]>([]);
  // Stores the user's email address input for sending the methodology PDF
  const [email, setEmail] = useState("");
  // Tracks the submission lifecycle: idle (initial), loading (API call in progress),
  // success (email sent), or error (API call failed)
  const [submitState, setSubmitState] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  // Side effect: when the modal opens, disable body scrolling to prevent background content from scrolling.
  // When the modal closes (or component unmounts), restore normal scrolling via the cleanup function.
  useEffect(() => {
    if (showModal) {
      // Lock vertical scroll on the <body> element so only the modal content scrolls
      document.body.style.overflow = "hidden";
      // Cleanup function: re-enable body scroll when modal is dismissed or component unmounts
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [showModal]); // Re-run only when showModal changes

  // Derived boolean: true if every calculation category is currently selected
  const allSelected = selected.length === CALCULATION_CATEGORIES.length;

  // Toggle a single category's selection state: if already selected, remove it; otherwise, add it
  const toggleCategory = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  };

  // Toggle all categories: if all are selected, deselect all; otherwise, select all category IDs
  const toggleAll = () => {
    if (allSelected) {
      setSelected([]); // Deselect everything
    } else {
      setSelected(CALCULATION_CATEGORIES.map((c) => c.id)); // Select all categories
    }
  };

  // Open the modal overlay, pre-selecting all categories by default, and reset email/submit state
  const handleOpenModal = () => {
    setShowModal(true); // Show the modal
    setSelected(CALCULATION_CATEGORIES.map((c) => c.id)); // All selected by default
    setEmail(""); // Clear previous email input
    setSubmitState("idle"); // Reset submission state
  };

  // Basic email validation using a regex pattern: checks for "something@something.something"
  const isValidEmail = (e: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

  // Handle local PDF download: generates a PDF blob using jsPDF, creates a temporary <a> element,
  // triggers a click to download the file, then cleans up the temporary DOM element and object URL.
  const handleDownload = async () => {
    // Generate the methodology PDF as a Blob using the dedicated PDF generator service
    const blob = await generateMethodologyPdf();
    // Create a temporary object URL pointing to the generated PDF blob
    const url = URL.createObjectURL(blob);
    // Create a hidden anchor element to programmatically trigger the download
    const link = document.createElement("a");
    link.href = url;
    // Set the download filename with the current date (ISO format, e.g., "2026-02-27")
    link.download = `SimulDivorce_Methodologie_${new Date().toISOString().slice(0, 10)}.pdf`;
    // Temporarily attach the link to the DOM, click it to trigger download, then remove it
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    // Revoke the object URL after a short delay to free memory
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  // Handle the "send by email" form submission: validates input, calls the backend API,
  // and updates submitState to reflect loading/success/error.
  const handleSubmit = async () => {
    // Guard: do nothing if email is invalid or no categories are selected
    if (!isValidEmail(email) || selected.length === 0) return;
    // Transition to loading state (disables button, shows spinner)
    setSubmitState("loading");
    try {
      // POST the user's email and selected categories to the backend API endpoint
      const res = await fetch("/api/methodology-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(), // Trimmed email address
          categories: selected, // Array of selected category IDs
        }),
      });
      // If the server responds with a non-2xx status, throw to trigger the catch block
      if (!res.ok) throw new Error("API error");
      // On success, show the success confirmation UI
      setSubmitState("success");
    } catch {
      // On any error (network failure, server error), show the error state
      setSubmitState("error");
    }
  };

  // Reusable Section sub-component: renders a titled section with an icon, a bottom border,
  // and child content. Used for each major section (Legal Framework, Calculation References, GDPR).
  const Section = ({
    title, // Section heading text (e.g., "1. Cadre Légal : Code Civil")
    icon: Icon, // A lucide-react icon component rendered next to the title
    children, // Content to render inside the section body
  }: {
    title: string;
    icon: any;
    children: React.ReactNode;
  }) => (
    // Outer section wrapper with bottom margin and a fade-in animation class
    <section className="mb-8 animate-fade-in">
      {/* Section header: displays the icon and title with a subtle bottom border */}
      <div className="flex items-center pb-2 mb-4 space-x-2 border-b border-white/10">
        {/* Icon rendered in the app's plasma-cyan accent color */}
        <Icon className="w-5 h-5 text-[var(--color-plasma-cyan)]" />
        {/* Title text: small, bold, uppercase with wide letter spacing */}
        <h2 className="text-sm font-bold tracking-widest text-white uppercase">
          {title}
        </h2>
      </div>
      {/* Section body: vertical spacing between child elements */}
      <div className="space-y-4">{children}</div>
    </section>
  );

  // Reusable Table sub-component: renders a styled HTML table inside a glass-panel card.
  // Used to display legal references and GDPR compliance information in a structured format.
  const Table = ({
    headers, // Array of column header strings (e.g., ["Domaine", "Portée"])
    rows, // 2D array of cell strings; each inner array is one table row
  }: {
    headers: string[];
    rows: string[][];
  }) => (
    // Table container with rounded corners, a subtle border, and glassmorphism styling
    <div className="overflow-hidden border rounded-xl border-white/10 glass-panel">
      {/* Full-width table with small left-aligned text */}
      <table className="w-full text-xs text-left">
        {/* Table header row: gray uppercase text on a slightly lighter background */}
        <thead className="tracking-wider text-gray-400 uppercase bg-white/5">
          <tr>
            {/* Map each header string to a <th> cell */}
            {headers.map((h, i) => (
              <th key={i} className="px-4 py-3">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        {/* Table body: light gray text, rows separated by thin dividers */}
        <tbody className="text-gray-300 divide-y divide-white/5">
          {/* Map each row array to a <tr>, with hover highlight effect */}
          {rows.map((row, i) => (
            <tr key={i} className="transition hover:bg-white/5">
              {/* Map each cell string in the row to a <td> */}
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // ============================= JSX RETURN =============================
  return (
    // Root container: full-screen height, dark "deep space" background, column layout, relative for absolute children
    <div className="min-h-screen bg-[var(--color-deep-space)] flex flex-col relative text-white font-sans">
      {/* SEO component: sets the page <title>, meta description, Open Graph tags, and JSON-LD breadcrumb structured data.
          This helps search engines index the methodology page properly. */}
      <SEO
        title="Méthodologie et Sources Juridiques — Code Civil, Barèmes 2026"
        description="Transparence sur les sources juridiques et méthodes de calcul utilisées : méthodes Calcul PC, Tiers Pondéré et INSEE pour la prestation compensatoire."
        path="/"
        type="article"
        jsonLd={breadcrumbJsonLd([
          { name: "Accueil", path: "/" }, // Breadcrumb: Home
          { name: "Méthodologie", path: "/methodology" }, // Breadcrumb: Methodology
        ])}
      />
      {/* Decorative radial gradient background overlay positioned absolutely behind all content.
          Creates a subtle light accent in the bottom-left corner of the page. */}
      <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_0%_100%,_var(--accent-light)_0%,_transparent_50%)] opacity-30 pointer-events-none" />
      {/* ===== Sticky Header Navigation Bar =====
          Fixed at the top of the viewport with a blurred background. Contains:
          - A "go back" button (left) using ChevronLeft icon
          - The page title "Méthodologie" centered
          - A "go home" button (right) using Home icon */}
      <div className="p-6 pt-8 flex items-center justify-between z-10 sticky top-0 bg-[var(--color-deep-space)]/90 backdrop-blur-xl border-b border-white/5">
        {/* Back button: navigates to the previous page in browser history */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center p-2 transition rounded-full bg-white/5 hover:bg-white/10 group"
        >
          {/* ChevronLeft icon turns white on hover via group-hover */}
          <ChevronLeft className="w-5 h-5 text-gray-300 group-hover:text-white" />
        </button>
        {/* Page title: "Méthodologie" in uppercase with wide letter-spacing and a glow effect */}
        <span className="text-xs font-bold tracking-[0.2em] text-white uppercase text-glow">
          Méthodologie
        </span>
        {/* Home button: navigates to the root/landing page */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center justify-center p-2 transition rounded-full bg-white/5 hover:bg-white/10 group"
          title="Accueil"
        >
          {/* Home icon turns white on hover via group-hover */}
          <Home className="w-5 h-5 text-gray-300 group-hover:text-white" />
        </button>
      </div>
      {/* ===== Main Scrollable Content Area =====
          Flex-1 to fill remaining vertical space; horizontally padded with extra bottom padding
          to avoid overlap with the ad unit at the bottom. overflow-y-auto enables vertical scrolling. */}
      <div className="flex-1 px-6 py-8 pb-32 overflow-y-auto">
        {/* ---- Page Introduction ----
            Centered heading and subtitle explaining the purpose of this page:
            transparency about legal sources and algorithms used by SimulDivorce v2026. */}
        <div className="mb-10 text-center">
          {/* Main heading: "Legal & Algorithmic Sources" */}
          <h1 className="mb-2 text-xl font-bold">
            Sources Juridiques & Algorithmiques
          </h1>
          {/* Subtitle: brief description of what this page covers */}
          <p className="max-w-sm mx-auto text-xs text-gray-400">
            Transparence sur les règles de droit et les méthodes de calcul
            utilisées par SimulDivorce (v2026).
          </p>
        </div>

        {/* ===== Section 1: Legal Framework ("Cadre Légal") =====
            Displays a table of legal domains from the French Civil Code that govern
            the calculations (Prestation Compensatoire criteria, income proof obligations). */}
        <Section title="1. Cadre Légal : Code Civil" icon={BookOpen}>
          {/* Table listing legal domains and their scope within French family law */}
          <Table
            headers={["Domaine", "Portée"]}
            rows={[
              [
                "Prestation Compensatoire", // Domain: Compensatory Benefit
                "Critères de disparité et modalités de versement.", // Scope: disparity criteria and payment methods
              ],
              [
                "Preuve des Revenus", // Domain: Proof of Income
                "Obligation de déclaration sur l'honneur.", // Scope: mandatory sworn declaration
              ],
            ]}
          />
        </Section>

        {/* ===== Section 2: Calculation References ("Référentiels de Calcul") =====
            Explains the three cross-referenced doctrinal methods used to calculate
            the prestation compensatoire (compensatory benefit) in French divorce law. */}
        <Section title="2. Référentiels de Calcul" icon={Scale}>
          {/* Glass-panel card containing the detailed explanation of the three methods */}
          <div className="p-4 border glass-panel rounded-xl border-white/10">
            {/* Sub-heading: "Prestation Compensatoire" in the accent cyan color */}
            <h3 className="text-xs font-bold text-[var(--color-plasma-cyan)] mb-2">
              Prestation Compensatoire
            </h3>
            {/* Introductory note: explains that the three methods are cross-referenced */}
            <p className="mb-2 text-xs text-gray-300">
              Méthodes doctrinales croisées :
            </p>
            {/* Bulleted list describing each of the three calculation methods */}
            <ul className="pl-4 space-y-1 text-xs text-gray-400 list-disc">
              {/* Method 1: "Calcul PC" — magistrate-style projections over 8 years,
                  factoring in gross income, assets, duration×age weighting, and retirement repairs */}
              <li>
                <strong>Méthode Calcul PC :</strong> Projections de revenus
                bruts sur 8 ans, patrimoine, pondération durée × âge, réparation
                retraite.
              </li>
              {/* Method 2: "Tiers Pondéré" (Weighted Third / Pilot method) —
                  net income differential weighted by marriage duration and beneficiary age */}
              <li>
                <strong>Méthode Tiers Pondéré (Pilote) :</strong> Différentiel
                de revenus nets pondéré par la durée du mariage et l'âge du
                bénéficiaire.
              </li>
              {/* Method 3: "INSEE" — analysis based on OECD consumption units,
                  accounting for children and custody type */}
              <li>
                <strong>Méthode INSEE :</strong> Analyse basée sur les unités de
                consommation OCDE, prenant en compte les enfants et le type de
                garde.
              </li>
            </ul>
          </div>
        </Section>

        {/* ===== Section 3: GDPR Compliance ("Conformité RGPD") =====
            Explains how the application complies with EU GDPR regulations:
            - Calculations are performed locally in the browser (no server-side data processing)
            - Only advertising data (Google) and email addresses (for document delivery) are transmitted */}
        <Section title="3. Conformité RGPD" icon={ShieldCheck}>
          {/* Introductory paragraph explaining the data minimization approach */}
          <p className="mb-4 text-xs text-gray-400">
            L'application respecte le principe de minimisation des données. Les
            calculs de simulation sont réalisés localement dans votre
            navigateur. Seules les données nécessaires à la publicité (Google)
            et à l'envoi de documents par e-mail transitent par des services
            tiers.
          </p>
          {/* Table detailing specific GDPR principles and their implementation in the app */}
          <Table
            // Column headers: "Principle" and "Implementation"
            headers={["Principe", "Mise en œuvre"]}
            rows={[
              [
                "Minimisation (Art. 5.1.c)", // GDPR Article 5(1)(c): data minimization
                "Calculs locaux. Seules les données publicitaires (Google) et l'adresse e-mail (envoi de documents) sont transmises.",
                // Local calculations. Only advertising data and email addresses are transmitted.
              ],
              [
                "Transparence", // Transparency principle
                "Sources juridiques et méthodes de calcul documentées sur cette page.",
                // Legal sources and calculation methods are documented on this very page.
              ],
            ]}
          />
        </Section>

        {/* ===== CTA Section: "Receive calculation formulas by email / PDF" =====
            A prominent call-to-action button that opens the modal for downloading or emailing
            the detailed methodology PDF containing all mathematical formulas and legal references. */}
        <section className="mb-8 animate-fade-in">
          {/* Full-width button wrapper — the entire card is clickable */}
          <button
            onClick={handleOpenModal}
            className="w-full group"
            type="button"
          >
            {/* CTA card: gradient background, accent border, hover glow effect */}
            <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--accent-primary)]/40 bg-gradient-to-br from-[var(--accent-primary)]/10 via-transparent to-[var(--color-plasma-cyan)]/10 p-6 sm:p-8 transition-all duration-300 hover:border-[var(--accent-primary)]/70 hover:shadow-[0_0_40px_rgba(13,148,136,0.2)]">
              {/* Decorative glow circle in the top-right corner, intensifies on hover */}
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-[var(--accent-primary)]/10 rounded-full blur-3xl group-hover:bg-[var(--accent-primary)]/20 transition-all duration-500" />

              {/* Inner layout: icon + text + arrow, stacked on mobile, horizontal on desktop */}
              <div className="relative flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
                {/* Download icon container: scales up on hover for a subtle animation */}
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[var(--accent-primary)]/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                  {/* Download icon in the primary accent color */}
                  <Download className="w-7 h-7 sm:w-8 sm:h-8 text-[var(--accent-primary)]" />
                </div>
                {/* Text content: heading + description */}
                <div className="flex-1 text-center sm:text-left">
                  {/* CTA heading: "Receive the calculation formulas by email" */}
                  <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] mb-1">
                    Recevoir les formules de calcul par e-mail
                  </h3>
                  {/* CTA description: explains what the PDF contains */}
                  <p className="text-xs leading-relaxed text-gray-400 sm:text-sm">
                    Obtenez un PDF détaillant les formules mathématiques et
                    références juridiques utilisées pour chaque calcul.
                  </p>
                </div>
                {/* Arrow icon: visible only on sm+ screens, shifts right on hover */}
                <ArrowRight className="w-5 h-5 text-[var(--accent-primary)] shrink-0 group-hover:translate-x-1 transition-transform hidden sm:block" />
              </div>
            </div>
          </button>
        </section>
      </div>{" "}
      {/* End of main scrollable content area */}
      {/* ===== Modal: Calculation Selection + Email Form =====
          Rendered via React Portal (createPortal) directly into document.body so it overlays
          everything regardless of parent stacking contexts. Only shown when showModal is true. */}
      {showModal &&
        createPortal(
          // Full-screen backdrop overlay: semi-transparent black with backdrop blur.
          // Clicking the backdrop closes the modal (unless a submission is in progress).
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => submitState !== "loading" && setShowModal(false)}
          >
            {/* Modal dialog container: centered card with max width, rounded corners,
                shadow, and a zoom-in entrance animation. Stops click propagation
                so clicking inside the modal doesn't close it. */}
            <div
              className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl shadow-2xl w-full max-w-[calc(100vw-1.5rem)] sm:max-w-lg relative flex flex-col max-h-[85vh] sm:max-h-[90vh] animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* ----- Modal Header -----
                  Displays a mail icon, the title "Recevoir les calculs" (Receive the calculations),
                  and a close (X) button. Has a bottom border to separate it from the content area. */}
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[var(--border-color)] shrink-0">
                {/* Left side: icon + title */}
                <div className="flex items-center gap-2 sm:gap-3">
                  {/* Circular icon container with a tinted accent background */}
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[var(--accent-primary)]/10 flex items-center justify-center shrink-0">
                    {/* Mail icon in the primary accent color */}
                    <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--accent-primary)]" />
                  </div>
                  {/* Modal title: "Receive the calculations" */}
                  <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
                    Recevoir les calculs
                  </h3>
                </div>
                {/* Close button: disabled during loading to prevent accidentally closing mid-submission */}
                <button
                  onClick={() =>
                    submitState !== "loading" && setShowModal(false)
                  }
                  className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition p-2 rounded-full hover:bg-[var(--bg-tertiary)] cursor-pointer"
                  aria-label="Fermer"
                  type="button"
                >
                  {/* X (close) icon */}
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* ----- Modal Content Area -----
                  Scrollable content section. Shows either the success confirmation or the
                  category selection + email form, depending on submitState. */}
              <div className="flex-1 min-h-0 p-4 overflow-y-auto sm:p-6">
                {submitState === "success" ? (
                  /* ---- Success State ----
                     Shown after the API call succeeds. Displays a green checkmark icon,
                     a "PDF sent!" heading, a confirmation message with the user's email,
                     and a "Close" button to dismiss the modal. */
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    {/* Green circle with a check icon indicating success */}
                    <div className="flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-green-500/10">
                      <Check className="w-8 h-8 text-green-400" />
                    </div>
                    {/* Success heading: "PDF sent!" */}
                    <h4 className="text-lg font-bold text-[var(--text-primary)] mb-2">
                      PDF envoyé !
                    </h4>
                    {/* Confirmation message: tells the user which email received the document */}
                    <p className="text-sm text-[var(--text-secondary)] mb-6 max-w-xs">
                      Le document contenant les formules sélectionnées a été
                      envoyé à <strong>{email}</strong>.
                    </p>
                    {/* "Close" button to dismiss the modal after successful submission */}
                    <button
                      onClick={() => setShowModal(false)}
                      className="px-6 py-2.5 rounded-xl bg-[var(--accent-primary)] text-white font-semibold hover:opacity-90 transition"
                      type="button"
                    >
                      Fermer
                    </button>
                  </div>
                ) : (
                  <>
                    {/* ---- Category Selection Form (shown when not in success state) ---- */}

                    {/* Select All / Deselect All toggle row */}
                    <div className="flex items-center justify-between mb-4">
                      {/* Instructional label: "Select the calculations to include" */}
                      <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium">
                        Sélectionnez les calculs à inclure :
                      </p>
                      {/* Toggle button: text changes between "Deselect all" and "Select all" based on current state */}
                      <button
                        onClick={toggleAll}
                        className="text-xs font-medium text-[var(--accent-primary)] hover:underline shrink-0 ml-2"
                        type="button"
                      >
                        {allSelected
                          ? "Tout désélectionner" // "Deselect all" when everything is selected
                          : "Tout sélectionner"}{" "}
                        {/* "Select all" when not everything is selected */}
                      </button>
                    </div>

                    {/* ---- Calculation Category Checkboxes ----
                        Renders a button for each category in CALCULATION_CATEGORIES.
                        Each button acts as a selectable checkbox with icon, label, and description. */}
                    <div className="space-y-2.5 mb-6">
                      {CALCULATION_CATEGORIES.map((cat) => {
                        // Check if the current category is in the selected array
                        const isChecked = selected.includes(cat.id);
                        // Destructure the icon component for this category
                        const Icon = cat.icon;
                        return (
                          // Full-width button styled as a selectable card; border color changes when selected
                          <button
                            key={cat.id}
                            onClick={() => toggleCategory(cat.id)}
                            className={`w-full text-left flex items-start gap-3 p-3 sm:p-4 rounded-xl border transition-all duration-200 ${
                              isChecked
                                ? "border-[var(--accent-primary)]/50 bg-[var(--accent-primary)]/5" // Selected: accent border + tinted background
                                : "border-[var(--border-color)] bg-[var(--bg-tertiary)]/50 hover:border-[var(--text-muted)]/30" // Unselected: default border, subtle hover
                            }`}
                            type="button"
                          >
                            {/* Checkbox icon: CheckSquare when selected, Square when not */}
                            <div className="pt-0.5 shrink-0">
                              {isChecked ? (
                                // Filled checkbox icon in accent color
                                <CheckSquare className="w-5 h-5 text-[var(--accent-primary)]" />
                              ) : (
                                // Empty checkbox icon in muted color
                                <Square className="w-5 h-5 text-[var(--text-muted)]" />
                              )}
                            </div>
                            {/* Category details: icon badge + label + description */}
                            <div className="flex-1 min-w-0">
                              {/* Row with small colored icon badge and category label */}
                              <div className="flex items-center gap-2 mb-0.5">
                                {/* Small rounded icon container with the category's background color */}
                                <div
                                  className={`w-5 h-5 rounded-md ${cat.bg} flex items-center justify-center shrink-0`}
                                >
                                  {/* Category icon rendered in the category's text color */}
                                  <Icon className={`w-3 h-3 ${cat.color}`} />
                                </div>
                                {/* Category label (e.g., "Prestation Compensatoire") */}
                                <span className="text-sm font-semibold text-[var(--text-primary)]">
                                  {cat.label}
                                </span>
                              </div>
                              {/* Category description: brief summary of what methods are included */}
                              <p className="text-[11px] sm:text-xs text-[var(--text-muted)] leading-relaxed">
                                {cat.description}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* ---- Email Input Field ----
                        Allows the user to enter their email address to receive the methodology PDF.
                        Includes a label, the input field, and an error message shown on submission failure. */}
                    <div className="mb-5">
                      {/* Label for the email input, linked via htmlFor/id */}
                      <label
                        htmlFor="calc-email"
                        className="block text-xs sm:text-sm font-medium text-[var(--text-secondary)] mb-1.5"
                      >
                        Adresse e-mail
                      </label>
                      {/* Email text input with placeholder, focus ring styling, and auto-complete hint */}
                      <input
                        id="calc-email"
                        type="email"
                        value={email}
                        onChange={(e) => {
                          // Update the email state as the user types
                          setEmail(e.target.value);
                          // If there was a previous submission error, reset to idle when the user starts correcting
                          if (submitState === "error") setSubmitState("idle");
                        }}
                        placeholder="votre@email.com" // Placeholder: "your@email.com" in French
                        className="w-full px-4 py-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-sm placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50 focus:border-[var(--accent-primary)] transition"
                        autoComplete="email"
                      />
                      {/* Error message: shown only when the API call failed */}
                      {submitState === "error" && (
                        <p className="text-xs text-red-400 mt-1.5">
                          Une erreur est survenue. Veuillez réessayer.
                          {/* "An error occurred. Please try again." */}
                        </p>
                      )}
                    </div>

                    {/* ---- Action Buttons ----
                        Two buttons stacked vertically:
                        1. "Send PDF by email" — primary action, calls handleSubmit
                        2. "Download PDF" — secondary action, calls handleDownload locally */}
                    <div className="space-y-2.5">
                      {/* Primary button: Send methodology PDF by email via the backend API */}
                      <button
                        onClick={handleSubmit}
                        disabled={
                          // Disabled when: email is invalid, no categories selected, or submission in progress
                          !isValidEmail(email) ||
                          selected.length === 0 ||
                          submitState === "loading"
                        }
                        className={`w-full py-3 sm:py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                          // Dynamic styling: disabled state gets muted colors and not-allowed cursor;
                          // enabled state gets the accent background with a press-scale effect
                          !isValidEmail(email) ||
                          selected.length === 0 ||
                          submitState === "loading"
                            ? "bg-[var(--text-muted)]/20 text-[var(--text-muted)] cursor-not-allowed"
                            : "bg-[var(--accent-primary)] text-white hover:opacity-90 active:scale-[0.98]"
                        }`}
                        type="button"
                      >
                        {/* Show a spinning loader during submission, otherwise show the mail icon + text */}
                        {submitState === "loading" ? (
                          <>
                            {/* Spinning loader icon to indicate in-progress API call */}
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Envoi en cours… {/* "Sending..." */}
                          </>
                        ) : (
                          <>
                            {/* Mail icon for the default (idle) button state */}
                            <Mail className="w-4 h-4" />
                            Envoyer le PDF par e-mail{" "}
                            {/* "Send PDF by email" */}
                          </>
                        )}
                      </button>

                      {/* Secondary button: Download methodology PDF locally (no server call).
                          Styled as an outlined/bordered button with the accent color. */}
                      <button
                        onClick={handleDownload}
                        disabled={selected.length === 0} // Disabled when no categories are selected
                        className={`w-full py-3 sm:py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all border ${
                          // Disabled: muted border and text; Enabled: accent-colored border with hover tint
                          selected.length === 0
                            ? "border-[var(--text-muted)]/20 text-[var(--text-muted)] cursor-not-allowed"
                            : "border-[var(--accent-primary)]/40 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 active:scale-[0.98]"
                        }`}
                        type="button"
                      >
                        {/* Download icon */}
                        <Download className="w-4 h-4" />
                        Télécharger le PDF {/* "Download the PDF" */}
                      </button>
                    </div>
                    {/* End of the non-success form state */}
                  </>
                )}
              </div>
              {/* End of modal content area */}
            </div>
            {/* End of modal dialog container */}
          </div>,
          document.body, // Portal target: render the modal directly into <body>
        )}
      {/* ===== Advertisement Unit =====
          Displays a Google Ads rectangle ad at the bottom of the page.
          This is a content-rich informational page, which is suitable for ad placement. */}
      <div className="flex justify-center px-6 pb-12">
        <AdUnit type="rectangle" />
      </div>
    </div> // End of root container
  ); // End of return statement
}; // End of MethodologyPage component

// Default export of the MethodologyPage component so it can be imported by the router
export default MethodologyPage;
