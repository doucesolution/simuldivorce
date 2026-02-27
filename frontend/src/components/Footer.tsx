// Import React core library for JSX support and component type definitions
import React from "react";
// Import Link component from react-router-dom for client-side navigation without full page reloads
import { Link } from "react-router-dom";

// Footer — a functional component that renders the site-wide footer with navigation links and legal notices
const Footer: React.FC = () => {
  // Get the current year dynamically so the copyright notice always displays the correct year automatically
  const currentYear = new Date().getFullYear();

  // Render the footer element
  return (
    // <footer> HTML5 landmark element: full width, vertical padding, pushed to bottom via mt-auto in flex layouts
    // Themed top border, background color, text color, and smooth transition for dark/light mode switching
    <footer
      className="w-full py-12 mt-auto border-t border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-300"
      itemScope /* Enable Schema.org microdata scope on this element for SEO structured data */
      itemType="https://schema.org/WPFooter" /* Declare this element as a WPFooter type for search engine understanding */
    >
      {/* Centered container with responsive horizontal padding (6→8→12 units) and max width capped at 7xl */}
      <div className="px-6 mx-auto max-w-7xl sm:px-8 lg:px-12">
        {/* Main flex row: stacks vertically centered on mobile, switches to horizontal row on md+ screens */}
        <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
          {/* Left section: brand identity, copyright, and service tagline */}
          <div className="flex flex-col items-center space-y-3 md:items-start">
            {/* Application brand name displayed in bold with wide letter spacing for visual emphasis */}
            <span className="text-base font-bold text-[var(--text-primary)] tracking-wide">
              SimulDivorce
            </span>
            {/* Copyright notice with dynamically inserted current year; "All rights reserved" in French */}
            <p className="text-xs text-[var(--text-muted)] font-medium">
              © {currentYear} SimulDivorce. Tous droits réservés.
            </p>
            {/* Short service tagline in French: "Free divorce simulator — compensatory allowance" */}
            <p className="text-xs text-[var(--text-muted)] max-w-xs text-center md:text-left">
              Simulateur de divorce gratuit — prestation compensatoire.
            </p>
          </div>

          {/* Right section: secondary navigation links for legal pages, guides, and resources */}
          <nav
            className="flex flex-wrap justify-center md:justify-end gap-x-8 gap-y-3" /* Wrap links on small screens; centered on mobile, right-aligned on desktop */
            aria-label="Navigation secondaire" /* Accessible label in French: "Secondary navigation" for screen readers */
          >
            {/* Link to the divorce preparation guide page */}
            <Link
              to="/guide"
              className="text-sm text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-colors duration-200 font-medium"
            >
              Guide de préparation {/* French: "Preparation guide" */}
            </Link>
            {/* Link to the privacy policy page */}
            <Link
              to="/privacy"
              className="text-sm text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-colors duration-200 font-medium"
            >
              Confidentialité {/* French: "Privacy" */}
            </Link>
            {/* Link to the terms and conditions (CGU) page */}
            <Link
              to="/terms"
              className="text-sm text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-colors duration-200 font-medium"
            >
              CGU{" "}
              {/* French abbreviation for "Conditions Générales d'Utilisation" (Terms of Use) */}
            </Link>
            {/* Link to the methodology and data sources page */}
            <Link
              to="/methodology"
              className="text-sm text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-colors duration-200 font-medium"
            >
              Sources & Méthodologie {/* French: "Sources & Methodology" */}
            </Link>
            {/* Link to the legal glossary/lexicon page */}
            <Link
              to="/glossary"
              className="text-sm text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-colors duration-200 font-medium"
            >
              Lexique {/* French: "Glossary" */}
            </Link>
          </nav>
        </div>

        {/* Bottom section: EU AI Act compliance notice, visually separated by a top border */}
        <div className="mt-12 pt-6 border-t border-[var(--border-color)] text-center">
          {/* Regulatory disclaimer about European AI Act compliance; slightly transparent (opacity-70) for subtlety */}
          <p className="text-xs text-[var(--text-muted)] opacity-70">
            Conforme à l'AI Act européen — Transparence et responsabilité
            algorithmique.{" "}
            {/* French: "Compliant with the European AI Act — Transparency and algorithmic accountability" */}
          </p>
        </div>
      </div>
    </footer>
  );
};

// Default export so the Footer component can be imported by other modules (e.g., the root App.tsx layout)
export default Footer;
