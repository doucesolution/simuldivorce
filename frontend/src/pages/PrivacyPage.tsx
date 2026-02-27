// Import React library, required for JSX compilation and component creation
import React from "react";
// Import useNavigate hook from React Router to enable programmatic navigation between pages
import { useNavigate } from "react-router-dom";
// Import icon components from the lucide-react icon library:
// - ChevronLeft: back arrow icon for header navigation
// - Home: home icon for navigating to the landing page
// - Shield: large shield icon used in the preamble hero area
// - Lock: padlock icon for the "Preamble" section header (privacy by design)
// - Fingerprint: fingerprint icon for the "Nature of Data" section header
// - EyeOff: hidden-eye icon for the "Recipients & Transfers" section header
// - ServerOff: server-off icon for the "Data Security" section header
import {
  ChevronLeft,
  Home,
  Shield,
  Lock,
  Fingerprint,
  EyeOff,
  ServerOff,
} from "lucide-react";
// Import SEO component for managing page meta tags, and the breadcrumbJsonLd generator
// for structured data that tells search engines the navigation hierarchy
import { SEO, breadcrumbJsonLd } from "../components/SEO";

// Define the PrivacyPage functional component using React.FC type annotation.
// This page displays the full privacy policy for the SimulDivorce application,
// covering GDPR compliance, data processing details, user rights, and security measures.
const PrivacyPage: React.FC = () => {
  // Initialize the navigate function from React Router for programmatic navigation (back, home)
  const navigate = useNavigate();

  // Define a reusable Section sub-component for rendering each privacy policy section.
  // It accepts a title string, children content, and an optional icon component.
  // This avoids repeating the same section layout markup for every policy section.
  const Section = ({
    title,
    children,
    icon: Icon,
  }: {
    title: string; // The section heading text (e.g., "1. Préambule")
    children: React.ReactNode; // The section body content (paragraphs, lists, etc.)
    icon?: any; // Optional lucide-react icon component displayed next to the title
  }) => (
    // Each section has a fade-in animation and bottom margin for spacing
    <section className="animate-fade-in mb-10">
      {/* Section header row: displays the optional icon and the section title side by side */}
      <div className="flex items-center mb-4 space-x-2">
        {/* Conditionally render the icon only if one was provided */}
        {Icon && <Icon className="w-5 h-5 text-[var(--color-plasma-cyan)]" />}
        {/* Section title in uppercase, small font, wide letter-spacing for a legal/formal style */}
        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400">
          {title}
        </h2>
      </div>
      {/* Glass-morphism content panel with rounded corners and subtle border for the section body */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10 text-sm text-gray-300 leading-relaxed space-y-4">
        {/* Render the section body content passed as children */}
        {children}
      </div>
    </section>
  );

  // Return the JSX structure that renders the entire Privacy Policy page
  return (
    // Root container: full-height dark-themed page with flex column layout and white text
    <div className="min-h-screen bg-[var(--color-deep-space)] flex flex-col relative text-white font-sans">
      {/* SEO component injects <title>, <meta description>, and breadcrumb JSON-LD
          structured data into the <head> for search engine optimization */}
      <SEO
        title="Politique de Confidentialité — Privacy by Design"
        description="SimulDivorce : calculs 100 % locaux, données publicitaires Google limitées au strict nécessaire, envoi de documents par e-mail sur demande. Conforme RGPD."
        path="/"
        jsonLd={breadcrumbJsonLd([
          // Breadcrumb: Home > Privacy, helps search engines show navigation path in results
          { name: "Accueil", path: "/" },
          { name: "Confidentialité", path: "/privacy" },
        ])}
      />
      {/* Background gradient overlay: a radial gradient positioned at top-left corner
          creating a subtle light accent effect behind the page content */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_0%_0%,_var(--accent-light)_0%,_transparent_50%)] opacity-30 pointer-events-none" />

      {/* Header bar: sticky at the top with blurred semi-transparent background.
          Contains back button, page title, and home button for navigation. */}
      <div className="p-6 pt-8 flex items-center justify-between z-10 sticky top-0 bg-[var(--color-deep-space)]/90 backdrop-blur-xl border-b border-white/5">
        {/* Back button: navigates to the previous page in browser history via navigate(-1) */}
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition group flex items-center justify-center"
        >
          {/* ChevronLeft icon: left-pointing arrow that brightens on hover via group-hover */}
          <ChevronLeft className="w-5 h-5 text-gray-300 group-hover:text-white" />
        </button>
        {/* Page title: "Politique de Confidentialité" (Privacy Policy) with wide letter-spacing and glow effect */}
        <span className="text-xs font-bold tracking-[0.2em] text-white uppercase text-glow">
          Politique de Confidentialité
        </span>
        {/* Home button: navigates to the root landing page ("/") when clicked */}
        <button
          onClick={() => navigate("/")}
          className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition group flex items-center justify-center"
          title="Accueil"
        >
          {/* Home icon: house symbol that brightens on hover */}
          <Home className="w-5 h-5 text-gray-300 group-hover:text-white" />
        </button>
      </div>

      {/* Main scrollable content area with bottom padding to account for mobile navigation bars */}
      <div className="flex-1 overflow-y-auto px-6 py-8 pb-32">
        {/* Preamble hero section: centered introductory area with shield icon, title, and summary */}
        <div className="mb-12 text-center">
          {/* Animated glowing circle containing the large shield icon, symbolizing data protection */}
          <div className="inline-flex items-center justify-center p-4 bg-[var(--color-plasma-cyan)]/10 rounded-full mb-6 border border-[var(--color-plasma-cyan)]/20 animate-pulse-glow">
            {/* Large Shield icon: the primary visual element representing privacy and security */}
            <Shield className="w-8 h-8 text-[var(--color-plasma-cyan)]" />
          </div>
          {/* Main page heading: "Privacy by Design" with gradient text effect */}
          <h1 className="text-2xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-[var(--text-primary)] to-[var(--text-muted)]">
            Privacy by Design
          </h1>
          {/* Summary paragraph: explains the core privacy principle — simulation data stays on device,
              only ad data and email for document delivery transit through third-party services */}
          <p className="text-sm text-gray-400 max-w-sm mx-auto">
            Vos données de simulation restent sur votre appareil. Seules les
            données strictement nécessaires à la publicité et à l'envoi de
            documents transitent par des services tiers.
          </p>
        </div>

        {/* Section 1: Preamble — explains the Privacy by Design principle and what data transits externally.
            Uses the Lock icon to visually represent security/privacy. */}
        <Section title="1. Préambule" icon={Lock}>
          {/* Paragraph explaining the app was designed with Privacy by Design principles:
              all simulation calculations happen locally, but some data (ads, email) goes through third parties */}
          <p>
            L'application a été conçue selon le principe du{" "}
            <strong>Privacy by Design</strong> (Protection de la vie privée dès
            la conception). Tous les calculs de simulation sont réalisés
            directement sur votre appareil, sans serveur de traitement.
            Toutefois, certaines données transitent par des services tiers :
            données nécessaires à la publicité (Google Ads) et adresse e-mail
            pour l'envoi de documents sur votre demande.
          </p>
        </Section>

        {/* Section 2: Data Controller — identifies who is responsible for data processing under GDPR.
            For simulation data it's the user themselves; for ad/email data it's the publisher. */}
        <Section title="2. Responsable du Traitement">
          {/* Main paragraph explaining the dual responsibility: user controls their own simulation data,
              while the app publisher controls advertising and email delivery data */}
          <p>
            Pour les données de simulation, le responsable de traitement au sens
            du RGPD est l'utilisateur lui-même sur son propre terminal. Pour les
            données publicitaires et l'envoi d'e-mails, le responsable de
            traitement est l'Éditeur.
          </p>
          {/* Contact details for the third-party services management (placeholder "X" values).
              In production, these would be replaced with actual entity name and DPO contact. */}
          <p className="text-xs text-gray-500 mt-2">
            Pour la gestion des services tiers (Publicité) :<br />
            Entité : X<br />
            Contact DPO : X
          </p>
        </Section>

        {/* Section 3: Nature of Data — categorizes the three types of data handled by the app.
            Uses the Fingerprint icon to represent personal/sensitive data identification. */}
        <Section title="3. Nature des Données" icon={Fingerprint}>
          {/* Sub-section A: Simulation Data (Sensitive) — income, family situation data */}
          <h3 className="text-white font-bold mb-1">
            A. Données de Simulation (Sensibles)
          </h3>
          {/* List of sensitive simulation data characteristics:
              what data is collected, how it's processed (local JS only), and how it's stored (localStorage) */}
          <ul className="list-disc pl-4 space-y-1 mb-4 text-gray-400">
            <li>Revenus, situation familiale.</li>
            <li>
              Traitement : Exclusivement local (JavaScript côté navigateur).
            </li>
            <li>
              Stockage : localStorage uniquement. Supprimé à la fermeture de
              session ou manuellement.
            </li>
          </ul>

          {/* Sub-section B: Advertising Data — cookies and tracking identifiers */}
          <h3 className="text-white font-bold mb-1">
            B. Données Publicitaires
          </h3>
          {/* List of advertising data: cookies/identifiers from Google AdSense/Tag Manager,
              navigation data for ad targeting (IP, device, pages), and Google's privacy policy reference */}
          <ul className="list-disc pl-4 space-y-1 mb-4 text-gray-400">
            <li>
              Cookies & Identifiants (Google AdSense / Google Tag Manager).
            </li>
            <li>
              Données de navigation nécessaires au ciblage publicitaire (adresse
              IP, type d'appareil, pages visitées).
            </li>
            <li>
              Ces données sont transmises à Google conformément à leur politique
              de confidentialité.
            </li>
          </ul>

          {/* Sub-section C: Document Delivery Data — email address and document type */}
          <h3 className="text-white font-bold mb-1">
            C. Données d'Envoi de Documents
          </h3>
          {/* List of document delivery data: voluntarily provided email address,
              selected calculation type (not financial data), and transmission purpose */}
          <ul className="list-disc pl-4 space-y-1 text-gray-400">
            <li>
              Adresse e-mail (fournie volontairement pour recevoir un document).
            </li>
            <li>
              Sélection des calculs demandés (type de document, pas les données
              financières).
            </li>
            <li>
              Transmises à notre service d'envoi d'e-mails uniquement dans le
              but de délivrer le document.
            </li>
          </ul>
        </Section>

        {/* Section 4: Legal Basis — explains the GDPR legal basis for data processing (explicit consent) */}
        <Section title="4. Base Légale">
          {/* Paragraph explaining that simulation data processing is based on explicit consent,
              given at the time of data entry, and withdrawable by closing the app or clearing browser data */}
          <p>
            Le traitement de vos données de simulation repose sur votre{" "}
            <strong>consentement explicite</strong>, recueilli au moment de la
            saisie de vos informations. Vous pouvez retirer ce consentement à
            tout moment en fermant simplement l'application ou en effaçant les
            données du navigateur.
          </p>
        </Section>

        {/* Section 5: Recipients & Transfers — details who receives what data and under what conditions.
            Uses the EyeOff icon to represent data privacy/hidden data. */}
        <Section title="5. Destinataires & Transferts" icon={EyeOff}>
          {/* Financial data: stays entirely on the user's device, never transmitted to any third party */}
          <p>
            <strong>Données financières :</strong> Vos chiffres de simulation
            (revenus, situation familiale) restent sur votre appareil et ne sont
            transmis à aucun tiers.
          </p>
          {/* Advertising data: navigation data (IP, pages, device) shared with Google for ad delivery */}
          <p>
            <strong>Publicité :</strong> Des données de navigation (adresse IP,
            pages visitées, type d'appareil) sont partagées avec Google dans le
            cadre de la diffusion publicitaire. Ces données sont strictement
            limitées au nécessaire.
          </p>
          {/* Document delivery: email address and document type sent to the email delivery service on request */}
          <p>
            <strong>Envoi de documents :</strong> Si vous demandez l'envoi d'un
            document par e-mail, votre adresse e-mail et le type de document
            choisi sont transmis à notre service d'envoi.
          </p>
        </Section>

        {/* Section 6: Data Security — lists the technical security measures in place.
            Uses the ServerOff icon to emphasize on no server-side data storage. */}
        <Section title="6. Sécurité des Données" icon={ServerOff}>
          {/* Unordered list of security features, each with a colored bullet indicator */}
          <ul className="list-none space-y-2">
            {/* Security feature 1: Local Processing — all simulation calculations run in the browser */}
            <li className="flex items-center space-x-2">
              {/* Cyan dot bullet: indicates a positive security feature */}
              <div className="w-1.5 h-1.5 bg-[var(--color-plasma-cyan)] rounded-full" />
              <span>
                <strong>Traitement Local :</strong> Tous les calculs de
                simulation sont exécutés dans votre navigateur.
              </span>
            </li>
            {/* Security feature 2: Isolation — code runs in the browser's sandboxed environment */}
            <li className="flex items-center space-x-2">
              {/* Cyan dot bullet: indicates a positive security feature */}
              <div className="w-1.5 h-1.5 bg-[var(--color-plasma-cyan)] rounded-full" />
              <span>
                <strong>Isolation :</strong> Code sandboxé dans le navigateur.
              </span>
            </li>
            {/* Security feature 3: No Database — no cloud storage of financial data whatsoever */}
            <li className="flex items-center space-x-2">
              {/* Cyan dot bullet: indicates a positive security feature */}
              <div className="w-1.5 h-1.5 bg-[var(--color-plasma-cyan)] rounded-full" />
              <span>
                <strong>Sans Base de Données :</strong> Aucun stockage Cloud de
                vos données financières.
              </span>
            </li>
            {/* Security caveat: Limited Transmissions — ad data to Google and email for documents only */}
            <li className="flex items-center space-x-2">
              {/* Yellow dot bullet: indicates a caveat/warning rather than a purely positive feature */}
              <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full" />
              <span>
                <strong>Transmissions limitées :</strong> Données publicitaires
                (Google) et adresse e-mail (envoi de documents) uniquement.
              </span>
            </li>
          </ul>
        </Section>

        {/* Section 7: User Rights (GDPR) — outlines the rights users have under GDPR regulations */}
        <Section title="7. Vos Droits (RGPD)">
          {/* List of GDPR rights available to users of the application */}
          <ul className="space-y-2">
            {/* Right to erasure: effective immediately by closing the session or clearing browser data */}
            <li>
              <strong>Droit à l'oubli :</strong> Effectif dès fermeture de
              session ou suppression des données du navigateur.
            </li>
            {/* Right to data portability: users can download their data as a PDF report */}
            <li>
              <strong>Droit à la portabilité :</strong> Via "Télécharger le
              rapport PDF".
            </li>
            {/* Right to object: users can refuse advertising cookies */}
            <li>
              <strong>Droit d'opposition :</strong> Refus des cookies
              publicitaires possible.
            </li>
          </ul>
        </Section>

        {/* Section 8: Modifications — explains how users will be notified of privacy policy changes */}
        <Section title="8. Modifications">
          {/* Simple statement: any updates to the privacy policy will be communicated via in-app notification */}
          <p>Toute mise à jour sera signalée par une notification in-app.</p>
        </Section>

        {/* Footer quote: a closing statement summarizing the app's philosophy —
            financial data stays local, the business model relies on advertising (not selling personal data) */}
        <div className="mt-12 p-6 border-t border-white/10 text-center">
          <p className="text-xs text-gray-500 italic">
            "Vos données financières restent sur votre appareil. Notre modèle
            économique repose sur la publicité (données de navigation partagées
            avec Google) et non sur la revente de vos informations personnelles
            sensibles."
          </p>
        </div>
      </div>
    </div>
  );
};

// Export PrivacyPage as the default export so it can be imported by the router configuration
export default PrivacyPage;
