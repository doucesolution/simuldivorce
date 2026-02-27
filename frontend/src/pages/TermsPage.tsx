// Import React library for building UI components using JSX syntax
import React from "react";
// Import useNavigate hook from React Router to enable programmatic navigation between pages
import { useNavigate } from "react-router-dom";
// Import icon components from Lucide icon library, each used to visually represent a Terms section:
// ChevronLeft = back arrow, Home = home button, Scale = legal/justice icon,
// AlertTriangle = warning/disclaimer, CloudOff = stateless/offline architecture,
// UserCheck = user responsibility, ShieldOff = liability limitation,
// Copyright = intellectual property, DollarSign = advertising/monetization, Flag = data protection
import {
  ChevronLeft,
  Home,
  Scale,
  AlertTriangle,
  CloudOff,
  UserCheck,
  ShieldOff,
  Copyright,
  DollarSign,
  Flag,
} from "lucide-react";
// Import SEO component for setting meta tags and breadcrumbJsonLd helper for structured data (Google rich results)
import { SEO, breadcrumbJsonLd } from "../components/SEO";

// Define the TermsPage functional component — renders the Terms of Service (CGU) page for SimulDivorce
const TermsPage: React.FC = () => {
  // Initialize the navigate function from React Router for back/forward navigation
  const navigate = useNavigate();

  // Define a reusable inner Section component that renders each Terms section with a consistent layout
  // Props: title (section heading), children (section body), icon (optional Lucide icon), isWarning (yellow styling flag)
  const Section = ({
    title,
    children,
    icon: Icon,
    isWarning = false,
  }: {
    title: string;
    children: React.ReactNode;
    icon?: any;
    isWarning?: boolean;
  }) => (
    // Outer section wrapper — bottom margin and fade-in animation for a smooth appearing effect
    <section className="mb-10 animate-fade-in">
      {/* Section header row: icon + title side by side */}
      <div className="flex items-center mb-4 space-x-2">
        {/* Render the icon if provided; use yellow color for warnings, cyan otherwise */}
        {Icon && (
          <Icon
            className={`w-5 h-5 ${isWarning ? "text-yellow-500" : "text-[var(--color-plasma-cyan)]"}`}
          />
        )}
        {/* Section title styled as small-caps, bold, uppercase, with wide letter spacing */}
        <h2 className="text-sm font-bold tracking-widest text-gray-400 uppercase">
          {title}
        </h2>
      </div>
      {/* Section body container — glass-morphism panel with conditional warning border/background */}
      <div
        className={`glass-panel p-6 rounded-2xl border ${isWarning ? "border-yellow-500/30 bg-yellow-500/5" : "border-white/10"} text-sm text-gray-300 leading-relaxed space-y-4`}
      >
        {/* Render the child content (paragraphs, lists, etc.) passed into the Section */}
        {children}
      </div>
    </section>
  );

  // Main render: the full Terms of Service page layout
  return (
    // Root container — full-screen dark background, vertical flex layout, relative positioning for the BG overlay
    <div className="min-h-screen bg-[var(--color-deep-space)] flex flex-col relative text-white font-sans">
      {/* SEO component: sets <title>, <meta description>, and injects JSON-LD breadcrumb structured data for search engines */}
      <SEO
        title="Conditions Générales d'Utilisation (CGU)"
        description="CGU de SimulDivorce : simulateur de divorce gratuit à vocation informative. Calculs locaux, publicité Google, envoi de documents par e-mail."
        path="/"
        jsonLd={breadcrumbJsonLd([
          { name: "Accueil", path: "/" },
          { name: "CGU", path: "/terms" },
        ])}
      />
      {/* Decorative radial gradient background overlay — purely cosmetic, non-interactive (pointer-events-none) */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_100%_0%,_var(--accent-light)_0%,_transparent_50%)] opacity-30 pointer-events-none" />

      {/* Sticky top header bar — contains back button, page title, and home button */}
      <div className="p-6 pt-8 flex items-center justify-between z-10 sticky top-0 bg-[var(--color-deep-space)]/90 backdrop-blur-xl border-b border-white/5">
        {/* Back button — navigates to the previous page in browser history */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center p-2 transition rounded-full bg-white/5 hover:bg-white/10 group"
        >
          {/* Left chevron icon — turns white on hover via the group-hover utility */}
          <ChevronLeft className="w-5 h-5 text-gray-300 group-hover:text-white" />
        </button>
        {/* Page label "CGU" (Conditions Générales d'Utilisation) — centered, glowing text effect */}
        <span className="text-xs font-bold tracking-[0.2em] text-white uppercase text-glow">
          CGU
        </span>
        {/* Home button — navigates back to the landing page */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center justify-center p-2 transition rounded-full bg-white/5 hover:bg-white/10 group"
          title="Accueil"
        >
          {/* Home icon — turns white on hover */}
          <Home className="w-5 h-5 text-gray-300 group-hover:text-white" />
        </button>
      </div>

      {/* Scrollable main content area — extra bottom padding (pb-32) to avoid overlap with mobile navbars */}
      <div className="flex-1 px-6 py-8 pb-32 overflow-y-auto">
        {/* Page title block — centered hero area with icon, heading, and last-update date */}
        <div className="mb-12 text-center">
          {/* Decorative icon badge — pulsing cyan glow, visually anchors the page */}
          <div className="inline-flex items-center justify-center p-4 bg-[var(--color-plasma-cyan)]/10 rounded-full mb-6 border border-[var(--color-plasma-cyan)]/20 animate-pulse-glow">
            {/* Scale (justice) icon representing legal terms */}
            <Scale className="w-8 h-8 text-[var(--color-plasma-cyan)]" />
          </div>
          {/* Main page heading — gradient text from primary to muted for a modern look */}
          <h1 className="mb-4 text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[var(--text-primary)] to-[var(--text-muted)]">
            Conditions Générales d'Utilisation
          </h1>
          {/* Subtitle showing last update date — helps users know how recent the terms are */}
          <p className="max-w-sm mx-auto text-sm text-gray-400">
            Dernière mise à jour : Février 2026
          </p>
        </div>

        {/* Section 1: "Purpose of Service" — describes what the app does (divorce financial simulation) */}
        <Section title="1. Objet du Service" icon={Scale}>
          {/* Paragraph explaining the app provides a divorce financial consequence simulation tool */}
          <p>
            La plateforme (ci-après "l'Application") propose un outil de
            simulation permettant d'estimer les conséquences financières d'un
            divorce.
          </p>
          {/* Paragraph clarifying that all computations happen locally; only ad/email data is transmitted */}
          <p>
            L'Application fonctionne par saisie manuelle des informations et
            réalise tous les calculs en local sur votre appareil. Des données
            strictement nécessaires sont transmises à des tiers dans le cadre de
            la publicité (Google) et de l'envoi de documents par e-mail.
          </p>
        </Section>

        {/* Section 2: Legal disclaimer — rendered with warning styling (yellow border/bg) */}
        <Section
          title="2. Avertissement (Disclaimer)"
          icon={AlertTriangle}
          isWarning={true}
        >
          {/* Bold yellow warning: app usage does NOT constitute legal advice */}
          <strong className="block mb-2 font-bold tracking-wider text-yellow-400">
            L'UTILISATION DE L'APPLICATION NE CONSTITUE EN AUCUN CAS UN CONSEIL
            JURIDIQUE.
          </strong>
          {/* Bullet list of disclaimer points */}
          <ul className="pl-4 space-y-2 list-disc">
            {/* Nature of service: purely mathematical tool based on public schedules */}
            <li>
              <strong className="text-white">Nature du service :</strong> Simple
              outil mathématique basé sur des barèmes publics.
            </li>
            {/* Absence of legal advice: publisher is not a lawyer or notary */}
            <li>
              <strong className="text-white">Absence de conseil :</strong>{" "}
              L'Éditeur n'est pas avocat ni notaire. Résultats indicatifs.
            </li>
            {/* Recommendation to consult a professional lawyer */}
            <li>
              <strong className="text-white">
                Nécessité d'un professionnel :
              </strong>{" "}
              Consultez un avocat pour valider tout résultat.
            </li>
          </ul>
        </Section>

        {/* Section 3: Access & Stateless Architecture — explains the free, local, privacy-respecting design */}
        <Section title="3. Accès & Fonctionnement Stateless" icon={CloudOff}>
          <ul className="space-y-2">
            {/* Free service funded by advertising */}
            <li>
              <strong>Gratuité :</strong> Service financé par la publicité.
            </li>
            {/* Local architecture: all simulation calculations run entirely on the user's device */}
            <li>
              <strong>Architecture Locale :</strong> Calculs de simulation
              réalisés intégralement sur votre appareil.
            </li>
            {/* Limited data transmissions: only navigation data to Google and email for document sending */}
            <li>
              <strong>Transmissions limitées :</strong> Des données de
              navigation sont partagées avec Google (publicité). Votre adresse
              e-mail est transmise si vous demandez l'envoi d'un document.
            </li>
            {/* Local storage: user data is stored in localStorage and can be deleted at any time */}
            <li>
              <strong>Stockage local :</strong> Les données saisies sont
              conservées dans le navigateur (localStorage) et peuvent être
              supprimées à tout moment.
            </li>
          </ul>
        </Section>

        {/* Section 4: User Responsibility — users are solely responsible for input accuracy and personal use */}
        <Section title="4. Responsabilité Utilisateur" icon={UserCheck}>
          <p>Vous êtes seul responsable de :</p>
          {/* Bullet list of user responsibilities */}
          <ul className="pl-4 mt-2 space-y-1 list-disc">
            {/* User is responsible for the accuracy of entered data */}
            <li>L'exactitude des informations saisies.</li>
            {/* Personal (non-commercial) use only */}
            <li>L'usage personnel (non commercial) du service.</li>
            {/* User must manually verify every result */}
            <li>La vérification humaine de chaque résultat.</li>
          </ul>
        </Section>

        {/* Section 5: Liability Limitation — the publisher is not liable for errors, discrepancies, lost data, or ad bugs */}
        <Section title="5. Limitation de Responsabilité" icon={ShieldOff}>
          <p>L'Éditeur n'est pas responsable :</p>
          {/* Bullet list of items for which the publisher disclaims liability */}
          <ul className="pl-4 mt-2 space-y-1 text-gray-400 list-disc">
            {/* Not liable for user input errors */}
            <li>Des erreurs de saisie par l'utilisateur.</li>
            {/* Not liable for differences from actual court decisions */}
            <li>Des divergences avec les décisions judiciaires réelles.</li>
            {/* Not liable for data loss due to accidental tab/browser closure */}
            <li>Des pertes de données par fermeture accidentelle.</li>
            {/* Not liable for bugs related to third-party advertising */}
            <li>Des bugs liés à la publicité tierce.</li>
          </ul>
        </Section>

        {/* Section 6: Intellectual Property — all code, algorithms, and design are owned by the publisher */}
        <Section title="6. Propriété Intellectuelle" icon={Copyright}>
          <p>
            Tous les éléments (code, algo, design) sont la propriété exclusive
            de l'Éditeur. Reproduction interdite.
          </p>
        </Section>

        {/* Section 7: Advertising & Monetization — explains Google AdSense/GTM funding model */}
        <Section title="7. Publicité & Monétisation" icon={DollarSign}>
          {/* States that the service is funded by Google AdSense / Google Tag Manager */}
          <p>
            Le service est financé par{" "}
            <strong>Google AdSense / Google Tag Manager</strong>.
          </p>
          {/* Bullet list of advertising-related terms */}
          <ul className="pl-4 mt-2 space-y-1 list-disc">
            {/* User accepts exposure to ads */}
            <li>L'Utilisateur accepte l'exposition publicitaire.</li>
            {/* Navigation data (IP, pages, device type) shared with Google for ad serving — minimized */}
            <li>
              Des données de navigation (adresse IP, pages visitées, type
              d'appareil) sont transmises à Google dans le cadre de la diffusion
              publicitaire. Ces données sont limitées au strict nécessaire.
            </li>
            {/* Publisher may restrict access if ad blockers are detected */}
            <li>
              L'Éditeur peut restreindre l'accès en cas d'utilisation de
              bloqueur de publicité.
            </li>
          </ul>
        </Section>

        {/* Section 8: Data Protection — explains where financial data stays and what is shared */}
        <Section title="8. Protection des Données" icon={Flag}>
          <p>
            {/* Financial simulation data stays on the user's device; navigation data goes to Google; email may be transmitted */}
            Vos données financières de simulation restent sur votre appareil.
            Des données de navigation sont partagées avec Google (publicité) et
            votre adresse e-mail peut être transmise pour l'envoi de documents.
            Voir {/* Link to the Privacy Policy page for full details */}
            <a
              href="/privacy"
              className="text-[var(--color-plasma-cyan)] underline"
            >
              Politique de Confidentialité
            </a>{" "}
            pour le détail.
          </p>
        </Section>

        {/* Section 9: Jurisdiction — French law applies, exclusive jurisdiction of local courts */}
        <Section title="9. Juridiction">
          <p>
            Droit français applicable. Compétence exclusive des tribunaux de
            [Votre Ville].
          </p>
        </Section>
      </div>
    </div>
  );
};

// Export the TermsPage component as the default export so it can be used by the router
export default TermsPage;
