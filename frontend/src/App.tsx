import React, { useEffect, lazy, Suspense } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import ThemeToggle from "./components/ThemeToggle";
import Footer from "./components/Footer";
import OfflineIndicator from "./components/OfflineIndicator";
import VersionChecker from "./components/VersionChecker";
import { GuidedModeProvider } from "./services/guidedMode";
import { GuidedModeToggle } from "./components/GuidedModeToggle";

/* ── Lazy-loaded routes (code-split per page) ── */
const DisclaimerPage = lazy(() => import("./pages/DisclaimerPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const ExportPage = lazy(() => import("./pages/ExportPage"));
const PrestationCompensatoirePage = lazy(
  () => import("./pages/PrestationCompensatoirePage"),
);
const DebiteurPage = lazy(() => import("./pages/DebiteurPage"));
const CreancierPage = lazy(() => import("./pages/CreancierPage"));
const RecapitulatifPage = lazy(() => import("./pages/RecapitulatifPage"));
const GuidePage = lazy(() => import("./pages/GuidePage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const MethodologyPage = lazy(() => import("./pages/MethodologyPage"));
const GlossaryPage = lazy(() => import("./pages/GlossaryPage"));
const InterstitialAdPage = lazy(() => import("./pages/InterstitialAdPage"));

const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    // Scroll the window itself
    window.scrollTo(0, 0);
    // Also reset any inner scrollable containers (overflow-y-auto divs)
    document
      .querySelectorAll<HTMLElement>('[class*="overflow-y"]')
      .forEach((el) => el.scrollTo(0, 0));
  }, [pathname]);
  return null;
};

const CenteredLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <div className="max-w-4xl mx-auto w-full">
    {children}
    <Footer />
  </div>
);

const App: React.FC = () => {
  return (
    <GuidedModeProvider>
      <ScrollToTop />
      <OfflineIndicator />
      <VersionChecker />
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--accent-primary)] border-t-transparent" />
          </div>
        }
      >
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/disclaimer"
            element={
              <CenteredLayout>
                <DisclaimerPage />
              </CenteredLayout>
            }
          />

          <Route
            path="/guide"
            element={
              <CenteredLayout>
                <GuidePage />
              </CenteredLayout>
            }
          />
          <Route
            path="/privacy"
            element={
              <CenteredLayout>
                <PrivacyPage />
              </CenteredLayout>
            }
          />
          <Route
            path="/terms"
            element={
              <CenteredLayout>
                <TermsPage />
              </CenteredLayout>
            }
          />
          <Route
            path="/methodology"
            element={
              <CenteredLayout>
                <MethodologyPage />
              </CenteredLayout>
            }
          />
          <Route
            path="/glossary"
            element={
              <CenteredLayout>
                <GlossaryPage />
              </CenteredLayout>
            }
          />
          {/* New data-entry pages (by calculation type) */}
          <Route
            path="/prestation-compensatoire"
            element={
              <CenteredLayout>
                <PrestationCompensatoirePage />
              </CenteredLayout>
            }
          />
          <Route
            path="/informations-debiteur"
            element={
              <CenteredLayout>
                <DebiteurPage />
              </CenteredLayout>
            }
          />
          <Route
            path="/informations-creancier"
            element={
              <CenteredLayout>
                <CreancierPage />
              </CenteredLayout>
            }
          />

          <Route
            path="/recapitulatif"
            element={
              <CenteredLayout>
                <RecapitulatifPage />
              </CenteredLayout>
            }
          />
          <Route
            path="/dashboard"
            element={
              <CenteredLayout>
                <DashboardPage />
              </CenteredLayout>
            }
          />
          <Route
            path="/transition"
            element={
              <CenteredLayout>
                <InterstitialAdPage />
              </CenteredLayout>
            }
          />
          <Route
            path="/export"
            element={
              <CenteredLayout>
                <ExportPage />
              </CenteredLayout>
            }
          />
        </Routes>
      </Suspense>
      <ThemeToggle />
      <GuidedModeToggle />
    </GuidedModeProvider>
  );
};

export default App;
