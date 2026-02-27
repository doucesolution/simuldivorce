// Import React library — required for JSX component rendering
import React from "react";
// Import useNavigate hook from React Router for programmatic navigation (back, home, etc.)
import { useNavigate } from "react-router-dom";
// Import icon components from Lucide for visual section headers:
// ChevronLeft = back navigation, Home = homepage, Book = income/revenue section,
// Scale = legal/compensatory payment, Users = divorce actors & family, Calculator = calculation methods
import {
  ChevronLeft,
  Home,
  Book,
  Scale,
  Users,
  Calculator,
} from "lucide-react";
// Import SEO component for meta tags, breadcrumbJsonLd for breadcrumb structured data,
// and faqJsonLd for FAQ rich snippet structured data (helps search engines display Q&A results)
import { SEO, breadcrumbJsonLd, faqJsonLd } from "../components/SEO";
// Import AdUnit component to display Google AdSense ad blocks within the glossary page
import { AdUnit } from "../components/AdUnit";

// Define the GlossaryPage functional component — renders a legal terms glossary for the divorce simulator
const GlossaryPage: React.FC = () => {
  // Initialize React Router's navigate function for back/home navigation
  const navigate = useNavigate();

  // Reusable Section component — renders a titled category of glossary definitions
  // Props: title (section heading text), icon (Lucide icon component), children (Definition cards)
  const Section = ({
    title,
    icon: Icon,
    children,
  }: {
    title: string;
    icon: any;
    children: React.ReactNode;
  }) => (
    // Section wrapper — bottom margin spacing and fade-in entrance animation
    <section className="mb-8 animate-fade-in">
      {/* Section header — icon + title on one line with a subtle bottom border separator */}
      <div className="flex items-center space-x-2 mb-4 border-b border-white/10 pb-2">
        {/* Render the section icon in cyan brand color */}
        <Icon className="w-5 h-5 text-[var(--color-plasma-cyan)]" />
        {/* Section title — uppercase, bold, wide letter-spacing for a clean category label */}
        <h2 className="text-sm font-bold uppercase tracking-widest text-white">
          {title}
        </h2>
      </div>
      {/* Container for the child Definition cards, vertically spaced */}
      <div className="space-y-4">{children}</div>
    </section>
  );

  // Reusable Definition component — renders a single glossary term card with term name and definition
  // Props: term (the legal term title), def (the definition content, can include JSX)
  const Definition = ({
    term,
    def,
  }: {
    term: string;
    def: React.ReactNode;
  }) => (
    // Card container — semi-transparent background, rounded corners, subtle border that highlights on hover
    <div className="bg-white/5 rounded-lg p-4 border border-white/5 hover:border-white/10 transition">
      {/* Term name — displayed in cyan, uppercase, bold for quick scanning */}
      <h3 className="text-xs font-bold text-[var(--color-plasma-cyan)] uppercase tracking-wide mb-2">
        {term}
      </h3>
      {/* Definition text — light gray, relaxed line height for readability */}
      <div className="text-sm text-gray-300 leading-relaxed">{def}</div>
    </div>
  );

  // Main render: the full Glossary page layout
  return (
    // Root container — full viewport dark background, vertical flex layout, white text
    <div className="min-h-screen bg-[var(--color-deep-space)] flex flex-col relative text-white font-sans">
      {/* SEO component — sets page title, meta description, and injects structured data (breadcrumbs + FAQ) */}
      {/* The FAQ JSON-LD helps Google display rich snippet Q&A results for common divorce-related queries */}
      <SEO
        title="Lexique du Divorce — Définitions 2026"
        description="Définitions claires des termes juridiques du divorce : prestation compensatoire, créancier, débiteur, tiers pondéré, unités de consommation."
        path="/"
        type="article"
        jsonLd={[
          // Breadcrumb structured data: Accueil > Lexique for search engine navigation
          breadcrumbJsonLd([
            { name: "Accueil", path: "/" },
            { name: "Lexique", path: "/glossary" },
          ]),
          // FAQ structured data — 3 frequently asked questions about divorce terms
          // These can appear as expandable FAQ snippets in Google search results
          faqJsonLd([
            {
              question: "Qu'est-ce que la prestation compensatoire ?",
              answer:
                "La prestation compensatoire est un capital versé pour compenser la disparité de niveau de vie causée par le divorce (art. 270 à 281 du Code Civil). Elle est estimée via plusieurs méthodes (Calcul PC, Tiers Pondéré, INSEE). Les calculs sont réalisés localement sur votre appareil.",
            },
            {
              question: "Que signifie créancier et débiteur dans un divorce ?",
              answer:
                "Le créancier est l'époux qui perçoit la prestation compensatoire (celui qui subit la disparité de revenus). Le débiteur est celui qui la verse (celui qui a les revenus les plus élevés).",
            },
            {
              question: "Qu'est-ce que la méthode du Tiers Pondéré ?",
              answer:
                "La méthode du Tiers Pondéré (dite Pilote) calcule la prestation compensatoire à partir du différentiel de revenus nets, pondéré par la durée du mariage et l'âge du bénéficiaire.",
            },
          ]),
        ]}
      />
      {/* Decorative radial gradient background overlay — cosmetic only, non-interactive */}
      <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_100%_0%,_var(--accent-light)_0%,_transparent_50%)] opacity-30 pointer-events-none" />

      {/* Sticky top header bar — contains back button, page title "Lexique", and home button */}
      <div className="p-6 pt-8 flex items-center justify-between z-10 sticky top-0 bg-[var(--color-deep-space)]/90 backdrop-blur-xl border-b border-white/5">
        {/* Back button — navigates to the previous page in browser history */}
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition group flex items-center justify-center"
        >
          {/* Left chevron arrow icon — turns white on hover via group-hover */}
          <ChevronLeft className="w-5 h-5 text-gray-300 group-hover:text-white" />
        </button>
        {/* Page label "Lexique" (Glossary) — centered, uppercase, with glowing text effect */}
        <span className="text-xs font-bold tracking-[0.2em] text-white uppercase text-glow">
          Lexique
        </span>
        {/* Home button — navigates directly to the landing page */}
        <button
          onClick={() => navigate("/")}
          className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition group flex items-center justify-center"
          title="Accueil"
        >
          {/* Home icon — turns white on hover */}
          <Home className="w-5 h-5 text-gray-300 group-hover:text-white" />
        </button>
      </div>

      {/* Scrollable main content area — extra bottom padding (pb-32) to avoid overlap with mobile bottom navbars */}
      <div className="flex-1 overflow-y-auto px-6 py-8 pb-32">
        {/* Page title block — heading and subtitle explaining the glossary's purpose */}
        <div className="mb-8">
          {/* Main heading: "2026 Terminology" */}
          <h1 className="text-2xl font-bold mb-2">Terminologie 2026</h1>
          {/* Subtitle explaining users can learn the vocabulary used in the simulator */}
          <p className="text-sm text-gray-400">
            Comprendre le vocabulaire utilisé dans le simulateur.
          </p>
        </div>

        {/* Section 1: Divorce Actors — defines the key people involved in a divorce proceeding */}
        <Section title="1. Acteurs du Divorce" icon={Users}>
          {/* Definition: Creditor — the spouse who receives compensatory payment (lower income) */}
          <Definition
            term="Créancier"
            def="L'époux qui perçoit la prestation compensatoire. C'est celui dont les revenus sont les plus faibles après le divorce. Le simulateur identifie automatiquement le créancier."
          />
          {/* Definition: Debtor — the spouse who pays compensatory payment (higher income) */}
          <Definition
            term="Débiteur"
            def="L'époux qui verse la prestation compensatoire. C'est celui dont les revenus sont les plus élevés. Si les revenus sont inversés, le simulateur effectue un échange automatique."
          />
          {/* Definition: JAF — Family Affairs Judge who adjudicates divorce cases */}
          <Definition
            term="JAF (Juge aux Affaires Familiales)"
            def="Magistrat compétent pour trancher les litiges liés au divorce, à la garde des enfants et aux prestations financières."
          />
        </Section>

        {/* Section 2: Calculation Methods for Compensatory Payment (PC) — the three doctrinal methods */}
        <Section title="2. Méthodes de Calcul (PC)" icon={Calculator}>
          {/* Definition: "Calcul PC" method — based on gross income projected over 8 years, assets, duration×age weighting, and retirement */}
          <Definition
            term="Méthode Calcul PC"
            def="Méthode de calcul de la prestation compensatoire basée sur les revenus bruts projetés sur 8 ans, le patrimoine, la pondération durée × âge et la réparation retraite. Nécessite les revenus bruts, le patrimoine non productif et les données de retraite."
          />
          {/* Definition: "Tiers Pondéré" (Weighted Third / Pilot) method — annual net income differential × duration × age coefficient */}
          <Definition
            term="Méthode du Tiers Pondéré (Pilote)"
            def="Calcul du différentiel de revenus nets annuels, pondéré par la durée du mariage et un coefficient d'âge du bénéficiaire. Méthode rapide basée uniquement sur les revenus nets mensuels."
          />
          {/* Definition: INSEE (OECD UC) method — uses OECD consumption units, accounts for children, custody type, and net income */}
          <Definition
            term="Méthode INSEE (UC OCDE)"
            def="Analyse basée sur les unités de consommation de l'OCDE. Prend en compte les enfants (âge et nombre), le type de garde et les revenus nets pour calculer la perte de niveau de vie du créancier."
          />
        </Section>

        {/* Section 3: Income/Revenue — defines income-related terms used throughout the simulator */}
        <Section title="3. Revenus" icon={Book}>
          {/* Definition: Net Social — mandatory payslip amount since 2024, basis for Tiers Pondéré and INSEE methods */}
          <Definition
            term="Net Social"
            def="Montant obligatoire sur les bulletins de paie depuis 2024. Correspond au brut moins les cotisations sociales. C'est la base de calcul pour les méthodes Tiers Pondéré et INSEE."
          />
          {/* Definition: Gross Income — before social deductions, used by the Calcul PC method */}
          <Definition
            term="Revenu Brut"
            def="Revenu avant déduction des cotisations sociales. Utilisé par la méthode Calcul PC (saisie en mensuel ou annuel)."
          />
          {/* Definition: Standard of Living Disparity — the core concept behind compensatory payment */}
          <Definition
            term="Disparité de Niveau de Vie"
            def="Différence de situation financière entre les deux époux après le divorce. C'est le fondement de la prestation compensatoire."
          />
          {/* Definition: RSA Socle — minimum welfare income used as a reference in certain calculation scales */}
          <Definition
            term="RSA Socle"
            def="Revenu de Solidarité Active — montant de référence utilisé dans certains barèmes de calcul."
          />
        </Section>

        {/* Section 4: Family & Custody — explains custody types and OECD consumption units */}
        <Section title="4. Famille & Garde" icon={Users}>
          {/* Definition: Classic Custody — child lives primarily with one parent (visitation rights for the other) */}
          <Definition
            term="Garde Classique (Droit de visite et d'hébergement)"
            def="L'enfant réside principalement chez un parent."
          />
          {/* Definition: Alternating Custody — child lives equally with both parents (50/50 split) */}
          <Definition
            term="Garde Alternée"
            def="L'enfant réside à parts égales chez les deux parents."
          />
          {/* Definition: Reduced Custody — limited visitation; one parent has the child most of the time */}
          <Definition
            term="Garde Réduite"
            def="Droit de visite réduit. Le parent a l'enfant la majeure partie du temps."
          />
          {/* Definition: Consumption Unit (UC) — OECD scale used by INSEE method to compare household living standards */}
          <Definition
            term="Unité de Consommation (UC)"
            def="Échelle OCDE utilisée par la méthode INSEE : 1er adulte = 1, 2e adulte = 0,5, enfant < 14 ans = 0,3, enfant ≥ 14 ans = 0,5. Permet de comparer les niveaux de vie des ménages."
          />
        </Section>

        {/* Google AdSense ad unit — placed between content sections on this content-rich page for monetization */}
        <div className="flex justify-center my-8">
          <AdUnit type="rectangle" />
        </div>

        {/* Section 5: Compensatory Payment — defines the central legal concept of the entire app */}
        <Section title="5. Prestation Compensatoire" icon={Scale}>
          {/* Definition: Compensatory Payment (PC) — lump sum or annuity to offset the standard-of-living gap caused by divorce */}
          <Definition
            term="Prestation Compensatoire (PC)"
            def="Capital versé en une fois ou sous forme de rente pour compenser la disparité de niveau de vie causée par le divorce. Estimée via 3 méthodes croisées (Calcul PC, Tiers Pondéré, INSEE)."
          />
        </Section>

        {/* Section 6: Acronyms — a quick-reference table of common abbreviations used in the simulator */}
        <Section title="6. Acronymes" icon={Scale}>
          {/* Rounded container with border for the acronym table */}
          <div className="overflow-hidden rounded-xl border border-white/10">
            {/* Two-column table: abbreviation + full name */}
            <table className="w-full text-xs text-left">
              {/* Table body with dividers between rows */}
              <tbody className="divide-y divide-white/5 text-gray-300">
                {/* Row: PC = Prestation Compensatoire (Compensatory Payment) */}
                <tr className="bg-white/5">
                  <td className="px-4 py-2 font-bold text-[var(--color-plasma-cyan)]">
                    PC
                  </td>
                  <td className="px-4 py-2">Prestation Compensatoire</td>
                </tr>
                {/* Row: JAF = Juge aux Affaires Familiales (Family Affairs Judge) */}
                <tr>
                  <td className="px-4 py-2 font-bold text-[var(--color-plasma-cyan)]">
                    JAF
                  </td>
                  <td className="px-4 py-2">Juge aux Affaires Familiales</td>
                </tr>
                {/* Row: UC = Unité de Consommation OCDE (OECD Consumption Unit) */}
                <tr className="bg-white/5">
                  <td className="px-4 py-2 font-bold text-[var(--color-plasma-cyan)]">
                    UC
                  </td>
                  <td className="px-4 py-2">Unité de Consommation (OCDE)</td>
                </tr>
                {/* Row: RSA = Revenu de Solidarité Active (welfare baseline income) */}
                <tr>
                  <td className="px-4 py-2 font-bold text-[var(--color-plasma-cyan)]">
                    RSA
                  </td>
                  <td className="px-4 py-2">Revenu de Solidarité Active</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Section>
      </div>
    </div>
  );
};

// Export the GlossaryPage component as the default export so it can be used by the router
export default GlossaryPage;
