// Import React library for building the component UI
import React from "react";
// Import useNavigate for programmatic navigation and Link for declarative navigation from React Router
import { useNavigate, Link } from "react-router-dom";

// Import the InfoTooltip component to show hover/click information popups
import { InfoTooltip } from "../components/InfoTooltip";
// Import SEO component for page meta tags and faqJsonLd helper to generate FAQ structured data
import { SEO, faqJsonLd } from "../components/SEO";
// Import isLawyerMode to check if the app is running in lawyer/professional mode (activated via URL param ?mode=lawyer)
import { isLawyerMode } from "../services/platform";

// Generate FAQ JSON-LD structured data for SEO — Google can display these as rich results in search
const landingFaq = faqJsonLd([
  {
    // FAQ item 1: How the simulator works — explains local calculation, manual data entry
    question: `Comment fonctionne le simulateur de divorce "SimulDivorce" ?`,
    answer:
      "SimulDivorce vous permet de saisir manuellement vos informations financières (revenus, situation familiale) pour simuler la prestation compensatoire. Les calculs sont réalisés localement sur votre appareil.",
  },
  {
    // FAQ item 2: Is it free? — explains the ad-supported free model, no account required
    question: "Le simulateur de divorce est-il gratuit ?",
    answer:
      "Oui, SimulDivorce est 100% gratuit. Le service est financé par la publicité (Google AdSense). Aucun compte n'est requis.",
  },
  {
    // FAQ item 3: Data security — explains local-only processing with Google ads caveat
    question: "Mes données sont-elles en sécurité ?",
    answer:
      "Oui, vos données financières de simulation sont traitées localement sur votre appareil. Des données de navigation sont partagées avec Google (publicité) et votre adresse e-mail peut être transmise si vous demandez l'envoi d'un document.",
  },
  {
    // FAQ item 4: How PC is calculated — describes the Pilote and INSEE methods used
    question: "Comment est calculée la prestation compensatoire ?",
    answer:
      "SimulDivorce utilise deux méthodes doctrinales reconnues : la méthode Pilote (différentiel de revenus × durée du mariage × coefficient d'âge) et la méthode INSEE (analyse des unités de consommation). Les résultats sont croisés pour fournir une fourchette indicative.",
  },
  {
    // FAQ item 5: Does the result replace a lawyer? — legal disclaimer about indicative results only
    question: "Le résultat remplace-t-il un avocat ?",
    answer:
      "Non. SimulDivorce est un outil de simulation indicatif basé sur des barèmes publics (Ministère de la Justice, Code Civil). Il ne constitue pas un conseil juridique. Consultez un avocat spécialisé pour valider les résultats.",
  },
]);

// Define the LandingPage functional component — this is the home/hero page of the application
const LandingPage: React.FC = () => {
  // useNavigate hook provides a function to programmatically change routes
  const navigate = useNavigate();

  // Render the landing page layout
  return (
    // Full-screen container with primary background color, centered flex column layout, and smooth theme transition
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center relative overflow-hidden text-center transition-colors duration-300">
      {/* SEO component injects <title>, <meta description>, Open Graph tags, and FAQ JSON-LD into <head> */}
      <SEO
        title="Simulateur Divorce Gratuit — Prestation Compensatoire"
        description="Simulez gratuitement votre prestation compensatoire. Calculs locaux et confidentiels. Trois méthodes croisées : Calcul PC, Tiers Pondéré, INSEE."
        path="/"
        jsonLd={landingFaq}
      />
      {/* Background Ambience — decorative radial gradient overlay for visual depth */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,_var(--bg-secondary)_0%,_transparent_70%)] opacity-50" />
      {/* Decorative glowing orb in the bottom-right corner, pulsing animation for visual interest */}
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[var(--accent-primary)] rounded-full blur-[150px] opacity-10 animate-pulse-glow" />

      {/* Header — top bar with the app logo and brand name */}
      <div className="z-20 flex items-center w-full p-6">
        {/* Logo and brand name container, horizontally aligned */}
        <div className="flex items-center space-x-2">
          {/* Square logo icon with accent background and white "D" letter */}
          <div className="w-8 h-8 bg-[var(--accent-primary)] rounded-lg flex items-center justify-center">
            {/* The "D" stands for Divorce — uses monospace font for a technical feel */}
            <span className="font-mono font-bold" style={{ color: "#ffffff" }}>
              D
            </span>
          </div>
          {/* Brand name "SimulDivorce" displayed in bold with wider letter spacing */}
          <span className="text-[var(--text-primary)] font-bold tracking-wider">
            SimulDivorce
          </span>
        </div>
      </div>

      {/* Main content area — centered vertically and horizontally, max width constrained */}
      <div className="z-10 flex flex-col items-center justify-center flex-1 w-full max-w-md p-6 pb-24">
        {/* Zero-G Entry Visualization — animated 3D phone mockup showing the app concept */}
        <div className="relative flex items-center justify-center h-64 mb-10 preserve-3d">
          {/* Privacy Force Field (The Shield) — outer animated border ring symbolizing data protection */}
          <div className="absolute w-44 h-80 rounded-[3rem] border-2 border-[var(--accent-primary)] shadow-[0_0_30px_rgba(20,184,166,0.3)] animate-float" />
          {/* Second outer ring — slightly larger, more transparent, creates depth illusion with pulse animation */}
          <div className="absolute w-48 h-84 rounded-[3.5rem] border border-[var(--accent-primary)] opacity-30 animate-pulse-glow" />

          {/* The 3D Phone — central phone mockup with floating animation, representing the mobile app */}
          <div className="w-36 h-72 bg-[var(--bg-secondary)] rounded-[2.5rem] border border-[var(--border-color)] relative shadow-2xl animate-[float_6s_ease-in-out_infinite_1s] overflow-hidden">
            {/* Phone Screen Gradient — simulates a screen glow from tertiary to primary background */}
            <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg-tertiary)] to-[var(--bg-primary)] opacity-90" />
            {/* Bottom glow indicator on the phone — a blurred circle simulating a home button or status light */}
            <div className="absolute left-0 right-0 flex justify-center bottom-4">
              <div className="w-12 h-12 rounded-full bg-[var(--accent-primary)] blur-md opacity-20 animate-pulse" />
            </div>
            {/* Center dot — a tiny glowing accent dot in the middle of the phone screen, bouncing to attract attention */}
            <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 bg-[var(--accent-primary)] rounded-full shadow-[0_0_10px_var(--accent-primary)] animate-[bounce_2s_infinite]" />
          </div>
        </div>

        {/* Typography Manifesting — main hero headline with gradient text, fade-in animation */}
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[var(--text-primary)] to-[var(--text-muted)] mb-4 tracking-tighter animate-[fadeIn_1s_ease-out_forwards] leading-tight">
          {/* French headline: "Plan for the future, protect your privacy." — key value proposition */}
          Prévoyez l'avenir, <br /> protégez votre vie privée.
        </h1>
        {/* Subheadline area with delayed fade-in animation, contains privacy message and info tooltip */}
        <div className="flex flex-col items-center mb-10 space-y-2 animate-[fadeIn_1s_ease-out_0.3s_forwards]">
          {/* Privacy tagline — "No account required. Your information stays secure." */}
          <p className="text-sm text-[var(--text-muted)] font-light">
            Aucun compte requis.{" "}
            {/* Highlighted portion in accent color emphasizing data security */}
            <span className="text-[var(--accent-primary)] font-medium">
              Vos informations restent en sécurité.
            </span>
          </p>
          {/* InfoTooltip explaining how privacy works — local computation, no document upload, data erased on close */}
          <InfoTooltip
            content="Nous ne demandons aucun document. Vous insérer seulement les informations nécessaires et le calcul est fait en local. Dès que vous fermez l'app, tout est effacé."
            label="Comment c'est possible ?"
          />
        </div>

        {/* Kinetic Button — primary CTA (Call to Action) that navigates to the disclaimer page */}
        <button
          onClick={() => navigate("/disclaimer")}
          className="relative group w-full bg-[var(--bg-secondary)] hover:bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)] text-[var(--accent-primary)] font-bold py-5 px-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
        >
          {/* Animated shine/warp-speed effect on hover — a translucent gradient that slides across the button */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--bg-primary)]/10 to-transparent translate-x-[-100%] group-hover:animate-[warp-speed_0.5s_linear]" />
          {/* Button label — "Start my free simulation" in French */}
          <span className="relative flex items-center justify-center space-x-3 text-lg tracking-wider">
            <span>Démarrer ma simulation gratuite</span>
          </span>
          {/* Empty subtitle span — reserved for potential future use (e.g., "No signup needed") */}
          <span className="relative text-[10px] block mt-1 opacity-70"></span>
        </button>

        {/* Mini Disclaimer — amber-colored warning box reminding users this is informational only */}
        <div className="max-w-sm mx-auto mt-4 px-4 py-2.5 rounded-xl border border-amber-500/50 bg-amber-500/15">
          {/* Warning text: "Informational tool only — no legal value. Does not replace a lawyer or notary." */}
          <p className="text-xs font-semibold leading-relaxed text-center text-amber-500">
            ⚠ Outil à caractère informatif uniquement — aucune valeur
            juridique. Ne se substitue pas à l'avis d'un avocat ou d'un notaire.
          </p>
        </div>

        {/* Link to the preparation guide page — helps users gather documents before starting the simulation */}
        <Link
          to="/guide"
          className="mt-6 text-[var(--accent-primary)] hover:text-[var(--accent-hover)] text-xs uppercase tracking-widest font-bold border-b border-transparent hover:border-[var(--accent-primary)] transition-all pb-0.5"
        >
          {/* "Preparation Guide" — link text */}
          Guide de préparation
        </Link>

        {/* Lawyer Pro section — only rendered when lawyer mode is activated via ?mode=lawyer URL parameter */}
        {isLawyerMode() && (
          // Container for lawyer-specific buttons with vertical spacing
          <div className="mt-6 w-full space-y-3">
            {/* Button to navigate to the lawyer profile page (name, contact info, firm logo) */}
            <button
              onClick={() => navigate("/profil-avocat")}
              className="w-full bg-indigo-600/10 border border-indigo-500/30 hover:bg-indigo-600/20 py-4 px-4 rounded-xl transition flex flex-col items-center space-y-1"
            >
              {/* Label: "My lawyer profile" */}
              <span className="text-xs text-indigo-400 font-bold uppercase tracking-widest">
                Mon profil avocat
              </span>
              {/* Subtitle: "Name, contact details, firm logo" */}
              <span className="text-[10px] text-indigo-400/60">
                Nom, coordonnées, logo du cabinet
              </span>
            </button>

            {/* Button to start a new case — navigates to client identity entry page */}
            <button
              onClick={() => navigate("/identite-parties")}
              className="w-full bg-blue-600/10 border border-blue-500/30 hover:bg-blue-600/20 py-4 px-4 rounded-xl transition flex items-center justify-center space-x-2"
            >
              {/* Label: "New case" */}
              <span className="text-xs text-blue-400 font-bold uppercase tracking-widest">
                Nouveau dossier
              </span>
            </button>
          </div>
        )}

        {/* Legal links navigation — Privacy Policy and Terms of Use (CGU) */}
        <nav className="flex mt-4 space-x-4" aria-label="Liens légaux">
          {/* Link to the privacy/confidentiality policy page */}
          <Link
            to="/privacy"
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm uppercase tracking-widest transition-colors"
          >
            {/* "Privacy" in French */}
            Confidentialité
          </Link>
          {/* Bullet separator between links — hidden from screen readers with aria-hidden */}
          <span className="text-[var(--text-muted)]" aria-hidden="true">
            •
          </span>
          {/* Link to the Terms of Use (Conditions Générales d'Utilisation) page */}
          <Link
            to="/terms"
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm uppercase tracking-widest transition-colors"
          >
            {/* "Terms of Use" abbreviation in French */}
            CGU
          </Link>
        </nav>

        {/* Resources navigation — Methodology/Sources and Glossary links */}
        <nav
          className="flex flex-col items-center mt-4 space-y-2"
          aria-label="Ressources"
        >
          {/* Link to the methodology page explaining calculation sources and methods used */}
          <Link
            to="/methodology"
            className="text-[var(--accent-primary)]/70 hover:text-[var(--accent-primary)] text-sm uppercase tracking-widest transition-colors flex items-center justify-center space-x-1"
          >
            {/* Pulsing green dot indicator — draws attention to the methodology link */}
            <span className="w-1 h-1 bg-[var(--accent-primary)] rounded-full animate-pulse"></span>
            {/* "Sources & Methodology" — link text */}
            <span>Sources & Méthodologie</span>
          </Link>
          {/* Link to the glossary page with definitions of legal/financial terms */}
          <Link
            to="/glossary"
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm uppercase tracking-widest transition-colors"
          >
            {/* "Glossary" in French */}
            Lexique
          </Link>
        </nav>
      </div>
    </div>
  );
};

// Export LandingPage as the default export so it can be imported by the router
export default LandingPage;
