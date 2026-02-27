// Import React core library along with specific hooks and utilities:
// - useEffect: runs side effects after render (used here for scroll-to-top on navigation)
// - lazy: enables code-splitting by deferring component loading until first render
// - Suspense: shows a fallback UI while lazy-loaded components are being fetched over the network
import React, { useEffect, lazy, Suspense } from "react";
// Import routing utilities from react-router-dom:
// - Routes: container that matches the current URL against its child <Route> elements
// - Route: maps a URL path pattern to a React component to render
// - useLocation: hook returning the current URL location object (pathname, search, hash)
import { Routes, Route, useLocation } from "react-router-dom";
// Import LandingPage eagerly (not lazy-loaded) because it is the first page users see
// Eager loading ensures zero loading delay on the initial visit — critical for perceived performance
import LandingPage from "./pages/LandingPage";
// ThemeToggle: floating button component that lets users manually switch between light and dark themes
import ThemeToggle from "./components/ThemeToggle";
// Footer: site-wide footer component with links, copyright, and legal navigation — rendered on every centered page
import Footer from "./components/Footer";
// OfflineIndicator: displays a banner/toast notification when the user loses internet connectivity (PWA enhancement)
import OfflineIndicator from "./components/OfflineIndicator";
// VersionChecker: periodically checks if a new version of the app is deployed and prompts the user to refresh
import VersionChecker from "./components/VersionChecker";
// GuidedModeProvider: React context provider that manages the guided/tutorial mode state across the entire app
// Wraps the component tree so any child can access or toggle guided mode via useContext
import { GuidedModeProvider } from "./services/guidedMode";
// GuidedModeToggle: floating toggle button that lets users enable or disable the interactive guided tour
import { GuidedModeToggle } from "./components/GuidedModeToggle";

/* ── Lazy-loaded routes (code-split per page) ── */
/* React.lazy() combined with dynamic import() enables Vite/webpack code-splitting: */
/* Each page component is bundled into its own separate JS chunk file */
/* That chunk is only downloaded from the server when the user first navigates to the corresponding route */
/* This dramatically reduces the initial JavaScript bundle size and improves Time to Interactive (TTI) */

// DisclaimerPage: legal disclaimer that users must read and accept before using the simulation tool
const DisclaimerPage = lazy(() => import("./pages/DisclaimerPage"));
// DashboardPage: main results dashboard displaying the calculated prestation compensatoire amounts
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
// ExportPage: allows users to generate and download simulation results as PDF or Word documents
const ExportPage = lazy(() => import("./pages/ExportPage"));
// PrestationCompensatoirePage: primary data-entry form for the compensatory allowance calculation parameters
const PrestationCompensatoirePage = lazy(
  () => import("./pages/PrestationCompensatoirePage"),
);
// DebiteurPage: form page for entering the debtor (paying) spouse's financial information (income, assets, etc.)
const DebiteurPage = lazy(() => import("./pages/DebiteurPage"));
// CreancierPage: form page for entering the creditor (receiving) spouse's financial information
const CreancierPage = lazy(() => import("./pages/CreancierPage"));
// RecapitulatifPage: summary/review page displaying all entered data before the final calculation is triggered
const RecapitulatifPage = lazy(() => import("./pages/RecapitulatifPage"));
// GuidePage: interactive user guide explaining how to use the simulator step by step
const GuidePage = lazy(() => import("./pages/GuidePage"));
// PrivacyPage: privacy policy page — emphasizes that all calculations run locally on the user's device
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
// TermsPage: terms of service / conditions of use for the SimulDivorce application
const TermsPage = lazy(() => import("./pages/TermsPage"));
// MethodologyPage: detailed explanation of the three calculation methods (Calcul PC, Tiers Pondéré, INSEE)
const MethodologyPage = lazy(() => import("./pages/MethodologyPage"));
// GlossaryPage: glossary/dictionary of legal and financial terms used in French divorce proceedings
const GlossaryPage = lazy(() => import("./pages/GlossaryPage"));
// InterstitialAdPage: transition page shown between workflow steps, may display ads to support the free service
const InterstitialAdPage = lazy(() => import("./pages/InterstitialAdPage"));

/* ── Lawyer (Pro) app routes ── */
/* These pages are part of the professional/lawyer version of the app designed for family law attorneys */
/* They provide enhanced features like client identity management and formal legal document generation */

// LawyerProfilePage: page where lawyers configure their professional profile (name, bar, office details)
const LawyerProfilePage = lazy(() => import("./pages/LawyerProfilePage"));
// LawyerIdentityPage: form for lawyers to enter the full identities of both parties in the divorce case
const LawyerIdentityPage = lazy(() => import("./pages/LawyerIdentityPage"));
// LawyerExportPage: professional export page generating formal legal documents suitable for court filings
const LawyerExportPage = lazy(() => import("./pages/LawyerExportPage"));

// ScrollToTop: a utility component that scrolls the browser window to the top on every route change
// Without this, navigating from a scrolled page would show the new page at the same scroll position
// This component renders nothing visible (returns null) — it exists purely for the scroll side effect
const ScrollToTop: React.FC = () => {
  // Destructure pathname from the location object provided by react-router's useLocation hook
  // pathname is the URL path string (e.g., "/dashboard", "/export") without query params or hash
  const { pathname } = useLocation();
  // useEffect: runs the scroll side effect after the component renders when pathname changes
  useEffect(() => {
    // Scroll the browser window to the absolute top-left corner (x=0, y=0) on each route transition
    window.scrollTo(0, 0);
  }, [pathname]); // Dependency array: re-run this effect only when the URL pathname value changes
  // Return null — this component has no visual output; it only performs a scroll side effect
  return null;
};

// CenteredLayout: a reusable wrapper component that constrains page content to a centered column
// It accepts children (the page component) and appends a Footer below every page that uses this layout
// Every route page except LandingPage uses this wrapper for consistent max-width and footer placement
const CenteredLayout: React.FC<{ children: React.ReactNode }> = ({
  children, // Destructure children from props — the page elements to render inside the centered container
}) => (
  // max-w-4xl: constrains width to 896px maximum; mx-auto: centers horizontally; w-full: fills up to the max
  <div className="max-w-4xl mx-auto w-full">
    {/* Render the child page component(s) passed into this layout wrapper */}
    {children}
    {/* Footer: rendered at the bottom of every centered page for consistent site-wide navigation and legal links */}
    <Footer />
  </div>
);

// App: the root application component — responsible for:
// 1. Wrapping the entire component tree in the GuidedModeProvider context
// 2. Declaring all client-side routes via React Router's <Routes> component
// 3. Rendering global UI elements (ThemeToggle, OfflineIndicator, VersionChecker, GuidedModeToggle)
// 4. Wrapping lazy-loaded pages in <Suspense> with a loading spinner fallback
const App: React.FC = () => {
  return (
    // GuidedModeProvider: React context provider that wraps all children with guided tour state
    // Any descendant component can read or toggle the tour via useContext(GuidedModeContext)
    <GuidedModeProvider>
      {/* ScrollToTop: invisible utility — scrolls the window to the top on every route navigation */}
      <ScrollToTop />
      {/* OfflineIndicator: shows a user-facing banner/toast when network connectivity is lost */}
      <OfflineIndicator />
      {/* VersionChecker: polls for new app versions and prompts the user to refresh when a new build is detected */}
      <VersionChecker />
      {/* Suspense: required wrapper for React.lazy() components */}
      {/* Displays the fallback spinner while any lazy-loaded page chunk is being downloaded */}
      {/* Without Suspense, rendering a not-yet-loaded lazy component would throw a runtime error */}
      <Suspense
        fallback={
          // Fallback UI: a centered spinning loader shown while lazy page chunks are being fetched
          // flex + items-center + justify-center: centers the spinner both horizontally and vertically
          // min-h-[60vh]: ensures the loading area occupies at least 60% of the viewport height
          <div className="flex items-center justify-center min-h-[60vh]">
            {/* Spinning circle indicator using CSS border animation trick */}
            {/* h-8 w-8: 32px square; animate-spin: infinite rotation; rounded-full: perfect circle */}
            {/* border-4 with accent color + transparent top creates the spinning arc visual effect */}
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--accent-primary)] border-t-transparent" />
          </div>
        }
      >
        {/* Routes: evaluates the current browser URL and renders only the first matching Route element */}
        {/* React Router v6 uses exclusive matching — only one route renders at a time */}
        <Routes>
          {/* Root route "/": renders the LandingPage (eagerly loaded for instant first paint) */}
          <Route path="/" element={<LandingPage />} />
          {/* /disclaimer: legal disclaimer page users must acknowledge before proceeding with the simulation */}
          <Route
            path="/disclaimer"
            element={
              <CenteredLayout>
                <DisclaimerPage />
              </CenteredLayout>
            }
          />

          {/* /guide: step-by-step user guide explaining how to use the divorce simulator */}
          <Route
            path="/guide"
            element={
              <CenteredLayout>
                <GuidePage />
              </CenteredLayout>
            }
          />
          {/* /privacy: privacy policy — emphasizes that all calculations run locally on the user's device */}
          <Route
            path="/privacy"
            element={
              <CenteredLayout>
                <PrivacyPage />
              </CenteredLayout>
            }
          />
          {/* /terms: terms and conditions of service for the SimulDivorce application */}
          <Route
            path="/terms"
            element={
              <CenteredLayout>
                <TermsPage />
              </CenteredLayout>
            }
          />
          {/* /methodology: detailed explanation of the three calculation methods (Calcul PC, Tiers Pondéré, INSEE) */}
          <Route
            path="/methodology"
            element={
              <CenteredLayout>
                <MethodologyPage />
              </CenteredLayout>
            }
          />
          {/* /glossary: dictionary of legal and financial terms used in French divorce proceedings */}
          <Route
            path="/glossary"
            element={
              <CenteredLayout>
                <GlossaryPage />
              </CenteredLayout>
            }
          />
          {/* ── Data-entry pages: form pages that collect the financial data needed for calculation ── */}
          {/* New data-entry pages (by calculation type) */}
          {/* /prestation-compensatoire: main data-entry form for compensatory allowance calculation parameters */}
          <Route
            path="/prestation-compensatoire"
            element={
              <CenteredLayout>
                <PrestationCompensatoirePage />
              </CenteredLayout>
            }
          />
          {/* /informations-debiteur: form to enter the debtor (paying) spouse's financial details (income, assets) */}
          <Route
            path="/informations-debiteur"
            element={
              <CenteredLayout>
                <DebiteurPage />
              </CenteredLayout>
            }
          />
          {/* /informations-creancier: form to enter the creditor (receiving) spouse's financial details */}
          <Route
            path="/informations-creancier"
            element={
              <CenteredLayout>
                <CreancierPage />
              </CenteredLayout>
            }
          />

          {/* /recapitulatif: summary page reviewing all entered data before triggering the final calculation */}
          <Route
            path="/recapitulatif"
            element={
              <CenteredLayout>
                <RecapitulatifPage />
              </CenteredLayout>
            }
          />
          {/* /dashboard: main results page showing calculated prestation compensatoire via three methods */}
          <Route
            path="/dashboard"
            element={
              <CenteredLayout>
                <DashboardPage />
              </CenteredLayout>
            }
          />
          {/* /transition: interstitial page between workflow steps — may display an ad to fund the free service */}
          <Route
            path="/transition"
            element={
              <CenteredLayout>
                <InterstitialAdPage />
              </CenteredLayout>
            }
          />
          {/* /export: page for generating and downloading PDF/Word reports of simulation results */}
          <Route
            path="/export"
            element={
              <CenteredLayout>
                <ExportPage />
              </CenteredLayout>
            }
          />

          {/* ── Lawyer (Pro) routes: professional tools for family law attorneys ── */}
          {/* Lawyer (Pro) app routes */}
          {/* /profil-avocat: lawyer profile configuration (name, bar association, office contact details) */}
          <Route
            path="/profil-avocat"
            element={
              <CenteredLayout>
                <LawyerProfilePage />
              </CenteredLayout>
            }
          />
          {/* /identite-parties: form for lawyers to enter both parties' full personal identification data */}
          <Route
            path="/identite-parties"
            element={
              <CenteredLayout>
                <LawyerIdentityPage />
              </CenteredLayout>
            }
          />
          {/* /export-avocat: professional export generating formal legal documents suitable for court filings */}
          <Route
            path="/export-avocat"
            element={
              <CenteredLayout>
                <LawyerExportPage />
              </CenteredLayout>
            }
          />
        </Routes>
      </Suspense>
      {/* ThemeToggle: floating button (typically bottom-right corner) for switching between light and dark themes */}
      <ThemeToggle />
      {/* GuidedModeToggle: floating button to enable/disable the interactive guided tour overlay */}
      <GuidedModeToggle />
    </GuidedModeProvider>
  );
};

// Default export of the App component — imported by main.tsx for rendering inside BrowserRouter + StrictMode
export default App;
