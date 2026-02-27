// Import React library, required for JSX compilation and component creation
import React from "react";
// Import useNavigate hook from React Router to enable programmatic navigation between pages
import { useNavigate } from "react-router-dom";
// Import icon components from the lucide-react icon library:
// - ChevronLeft: back arrow icon for the header navigation
// - Shield: security/privacy icon used in the confidentiality notice
// - Home: home icon for navigating back to the landing page
// - CheckCircle2: checkmark icon used for each item in the preparation checklist
import { ChevronLeft, Shield, Home, CheckCircle2 } from "lucide-react";
// Import SEO component for managing page meta tags, and JSON-LD schema generators
// for structured data (breadcrumb navigation and HowTo schema) to improve search engine indexing
import { SEO, howToJsonLd, breadcrumbJsonLd } from "../components/SEO";
// Import the AdUnit component that renders Google AdSense advertisement blocks
import { AdUnit } from "../components/AdUnit";

// Define the GuidePage functional component using React.FC type annotation.
// This page explains what information users should prepare before running a divorce simulation.
const GuidePage: React.FC = () => {
  // Initialize the navigate function from React Router to allow in-app navigation (back, home, etc.)
  const navigate = useNavigate();

  // Return the JSX structure that renders the entire Guide page
  return (
    // Root container: full-height dark-themed page using CSS custom properties, flex column layout
    <div className="min-h-screen bg-[var(--color-deep-space)] flex flex-col relative text-white font-sans">
      {/* SEO component injects <title>, <meta description>, and JSON-LD structured data into the <head>.
          This helps search engines understand the page content and display rich results. */}
      <SEO
        title="Guide de Préparation — Informations Requises"
        description="Préparez les informations nécessaires pour une simulation de divorce précise : revenus, situation familiale. Guide par méthode de calcul."
        path="/"
        jsonLd={[
          // Breadcrumb JSON-LD: tells search engines the navigation hierarchy (Home > Guide)
          breadcrumbJsonLd([
            { name: "Accueil", path: "/" },
            { name: "Guide de préparation", path: "/guide" },
          ]),
          // HowTo JSON-LD: provides structured step-by-step instructions for Google rich results,
          // describing how to prepare information for a divorce simulation
          howToJsonLd(
            "Préparer ses informations pour une simulation de divorce",
            "Guide étape par étape pour rassembler les informations nécessaires à une simulation précise de la prestation compensatoire.",
            [
              // Step 1: Gather basic information (marriage date, divorce date, birth dates)
              {
                name: "Rassembler les informations de base",
                text: "Date de mariage, date prévisionnelle de divorce, dates de naissance des deux conjoints.",
              },
              // Step 2: Prepare income data (net monthly for some methods, gross for others)
              {
                name: "Préparer les données de revenus",
                text: "Revenus nets mensuels (pour les méthodes Tiers Pondéré et INSEE) et/ou revenus bruts (pour la méthode Calcul PC).",
              },
              // Step 3: Family situation (number of children, ages, custody type)
              {
                name: "Situation familiale",
                text: "Nombre d'enfants, âge de chaque enfant et type de garde (classique, alternée ou réduite).",
              },
              // Step 4: Launch the simulation — all calculations happen locally on the user's device
              {
                name: "Lancer la simulation",
                text: "Saisissez vos informations directement dans le simulateur. Les calculs sont réalisés localement sur votre appareil.",
              },
            ],
          ),
        ]}
      />
      {/* Background Ambience: a large, blurred cyan circle positioned top-right
          to create a subtle glowing background effect for visual depth */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[var(--color-plasma-cyan)]/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header bar: sticky at the top with a blurred semi-transparent background.
          Contains back button, page title, and home button for navigation. */}
      <div className="p-6 pt-8 flex items-center justify-between z-10 sticky top-0 bg-[var(--color-deep-space)]/80 backdrop-blur-md border-b border-white/5">
        {/* Back button: navigates to the previous page in browser history using navigate(-1) */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center p-2 transition rounded-full bg-white/5 hover:bg-white/10 group"
        >
          {/* ChevronLeft icon: left-pointing arrow that brightens on hover via group-hover */}
          <ChevronLeft className="w-5 h-5 text-gray-300 group-hover:text-white" />
        </button>
        {/* Page title: "Guide de Préparation" (Preparation Guide) displayed in uppercase with glow effect */}
        <h1 className="text-sm font-bold tracking-widest text-white uppercase text-glow">
          Guide de Préparation
        </h1>
        {/* Home button: navigates to the root landing page ("/") when clicked */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center justify-center p-2 transition rounded-full bg-white/5 hover:bg-white/10 group"
          title="Accueil"
        >
          {/* Home icon: house symbol that brightens on hover */}
          <Home className="w-5 h-5 text-gray-300 group-hover:text-white" />
        </button>
      </div>

      {/* Main scrollable content area with vertical spacing between sections and bottom padding for mobile */}
      <div className="flex-1 px-6 py-8 pb-32 space-y-12 overflow-y-auto">
        {/* Section 1: Introduction — explains what the simulator does and what info is needed */}
        <section className="animate-fade-in">
          {/* Section heading: "What information to prepare?" with a gradient text effect */}
          <h2 className="text-2xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-[var(--text-primary)] to-[var(--text-muted)]">
            Quelles informations préparer ?
          </h2>
          {/* Glass-morphism panel containing the introduction text and privacy notice */}
          <div className="p-6 border glass-panel rounded-2xl border-white/10">
            {/* Introductory paragraph explaining the simulator works via manual input,
                and that info needed depends on the chosen calculation methods */}
            <p className="mb-4 text-sm leading-relaxed text-gray-300">
              Notre simulateur fonctionne par <strong>saisie manuelle</strong>.
              Les informations demandées dépendent des méthodes de calcul que
              vous sélectionnerez. En les rassemblant à l'avance, vous gagnerez
              du temps et obtiendrez des résultats plus fiables.
            </p>
            {/* Privacy/confidentiality callout box with cyan accent styling.
                Informs users that all calculations happen locally on their device. */}
            <div className="flex items-start space-x-3 bg-[var(--color-plasma-cyan)]/10 p-4 rounded-xl border border-[var(--color-plasma-cyan)]/20">
              {/* Shield icon: visual indicator of security/privacy */}
              <Shield className="w-5 h-5 text-[var(--color-plasma-cyan)] shrink-0 mt-0.5" />
              {/* Privacy notice text: explains local processing, PDF download option,
                  email transmission, and Google advertising data sharing */}
              <p className="text-xs text-[var(--color-plasma-cyan)]">
                <span className="block mb-1 font-bold tracking-wider uppercase">
                  Confidentialité
                </span>
                Tous les calculs de simulation sont réalisés localement sur
                votre appareil. Le document récapitulatif est téléchargeable ou
                peut vous être envoyé par courriel (votre adresse e-mail est
                alors transmise à notre service d'envoi). Des données
                strictement nécessaires sont partagées avec Google dans le cadre
                de la publicité.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: Checklist — a visual list of all information items users should prepare */}
        <section className="delay-100 animate-fade-in">
          {/* Section heading: "Information to prepare" in uppercase muted style */}
          <h3 className="mb-6 text-sm font-bold tracking-widest text-gray-500 uppercase">
            Informations à préparer
          </h3>

          {/* Glass panel containing the checklist items in a vertical list layout */}
          <div className="p-5 border glass-panel rounded-2xl border-white/10 space-y-3">
            {/* Array of all required information items for the divorce simulation.
                Each string represents one piece of data the user should have ready.
                Items include dates, incomes, children info, custody type, assets, and retirement gaps. */}
            {[
              "Date de mariage",
              "Date prévisionnelle du divorce",
              "Date de naissance du créancier",
              "Date de naissance du débiteur",
              "Revenus nets mensuels (créancier & débiteur)",
              "Revenus bruts mensuels ou annuels (créancier & débiteur)",
              "Nombre d'enfants et âge de chacun",
              "Type de garde (classique, alternée ou réduite)",
              "Contributions enfants mensuelles",
              "Patrimoine non productif et rendement estimé (%)",
              "Écart retraite du créancier (années sans cotisation)",
            ].map((item) => (
              // Each checklist item row: uses the item text as a unique React key
              <div key={item} className="flex items-start gap-3">
                {/* Cyan checkmark icon indicating each item in the preparation list */}
                <CheckCircle2 className="w-4 h-4 text-[var(--color-plasma-cyan)] shrink-0 mt-0.5" />
                {/* The checklist item label text displayed next to the checkmark */}
                <span className="text-sm text-gray-300">{item}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Advertisement section: displays a rectangle ad unit from Google AdSense.
            Placed here because this is a content-rich page suitable for ad placement. */}
        <div className="flex justify-center my-8">
          <AdUnit type="rectangle" />
        </div>

        {/* Section 4: Closing note — reiterates the privacy and local-processing message */}
        <section className="px-4 pb-8 text-center delay-500 animate-fade-in">
          {/* Final disclaimer paragraph explaining that all data entry is manual,
              calculations are local, and only ad data and email transit through external services */}
          <p className="max-w-xs mx-auto text-xs leading-relaxed text-gray-500">
            Toutes les informations sont saisies manuellement et les calculs
            sont réalisés sur votre appareil. Seules les données nécessaires à
            la publicité (Google) et à l'envoi de documents par e-mail
            transitent par nos services.
          </p>
        </section>
      </div>
    </div>
  );
};

// Export GuidePage as the default export so it can be imported by the router configuration
export default GuidePage;
