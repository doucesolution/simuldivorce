// Import React core library and hooks:
// useEffect — runs side effects (timers) after render
// useState — manages component state (countdown, canSkip)
// useRef — holds a mutable reference to the interval timer without triggering re-renders
import React, { useEffect, useState, useRef } from "react";
// Import useNavigate for programmatic route navigation and useSearchParams to read URL query parameters
import { useNavigate, useSearchParams } from "react-router-dom";
// Import the Loader2 spinning icon from Lucide — used as a loading indicator during the countdown
import { Loader2 } from "lucide-react";
// Import AdUnit component — renders a Google AdSense ad block (rectangle format)
import { AdUnit } from "../components/AdUnit";
// Import SEO component — sets <title> and <meta description> for the interstitial page
import { SEO } from "../components/SEO";

// ──────────────────────────────────────────────────────────────
// Editorial content variants — substantial publisher content
// to satisfy AdSense "pages with publisher content" requirement.
// Google AdSense requires meaningful editorial content surrounding ads;
// these variants provide contextual legal information matching the user's destination.
// ──────────────────────────────────────────────────────────────

// TypeScript interface defining the shape of each editorial content variant
// Each variant has a display title, SEO metadata, and an array of informational paragraphs
interface ContentVariant {
  title: string; // Display title shown in the page header
  seoTitle: string; // Title used in the <title> meta tag for search engines
  seoDescription: string; // Meta description for search engines
  paragraphs: string[]; // Array of editorial paragraph strings shown on the page
}

// Map of content variants keyed by the user's intended destination route
// The interstitial page selects the appropriate variant based on the "to" URL parameter
const CONTENT_VARIANTS: Record<string, ContentVariant> = {
  // Variant shown when the user is heading to the dashboard (simulation results page)
  "/dashboard": {
    title: "Avant vos résultats — ce qu'il faut savoir",
    seoTitle: "Comprendre la Prestation Compensatoire — Avant vos résultats",
    seoDescription:
      "Informations essentielles sur la prestation compensatoire avant de consulter vos résultats de simulation de divorce.",
    paragraphs: [
      // Paragraph 1: Explains what compensatory payment is under French law (articles 270-281 Civil Code)
      "La prestation compensatoire est un mécanisme fondamental du droit du divorce en France. Prévue aux articles 270 à 281 du Code Civil, elle vise à compenser la disparité de niveau de vie créée par la rupture du mariage entre les deux époux. Contrairement à la pension alimentaire, elle est en principe versée sous forme de capital (somme forfaitaire), bien que le juge puisse exceptionnellement ordonner un versement sous forme de rente.",
      // Paragraph 2: Describes the criteria the Family Affairs Judge (JAF) uses to set the amount
      "Le Juge aux Affaires Familiales (JAF) dispose d'un pouvoir d'appréciation souverain pour fixer le montant de la prestation compensatoire. Il prend en compte les critères listés à l'article 271 du Code Civil : durée du mariage, âge et état de santé des époux, qualification et situation professionnelle, conséquences des choix professionnels faits pendant la vie commune, patrimoine estimé après liquidation du régime matrimonial, et droits prévisibles à la retraite.",
      // Paragraph 3: Disclaimer that results are indicative estimates based on doctrinal methods
      "Les résultats que vous allez consulter sont issus de méthodes de calcul doctrinales (Tiers Pondéré, INSEE, Calcul PC) utilisées par les praticiens du droit. Ils constituent une estimation indicative et ne sauraient se substituer à l'avis d'un avocat spécialisé en droit de la famille.",
    ],
  },
  // Variant shown when the user is heading to the export/report download page
  "/export": {
    title: "Avant votre rapport — conseils pratiques",
    seoTitle: "Conseils Pratiques — Avant le téléchargement du rapport",
    seoDescription:
      "Conseils pour exploiter au mieux votre rapport de simulation de prestation compensatoire.",
    paragraphs: [
      // Paragraph 1: Explains the report is a decision-support tool, not a legal document
      "Votre rapport de simulation est un outil d'aide à la décision qui synthétise les résultats des différentes méthodes de calcul sélectionnées. Il peut être présenté à votre avocat comme base de discussion, mais ne constitue en aucun cas un document juridique opposable. Seul le jugement de divorce ou la convention homologuée fixe définitivement le montant de la prestation compensatoire.",
      // Paragraph 2: Describes how the report is used in mutual consent vs contested divorce scenarios
      "En cas de divorce par consentement mutuel (article 229-1 du Code Civil), les deux époux et leurs avocats respectifs négocient librement le montant de la prestation compensatoire. Un simulateur comme SimulDivorce permet d'objectiver la discussion en fournissant des fourchettes basées sur des barèmes reconnus. En cas de divorce contentieux, c'est le JAF qui tranche souverainement.",
      // Paragraph 3: Recommends consulting the Methodology page for transparency on calculation assumptions
      "Pensez à consulter la page « Sources & Méthodologie » pour comprendre les hypothèses de calcul utilisées. Les coefficients d'âge, les projections de revenus et les unités de consommation OCDE sont détaillés pour chaque méthode, afin de garantir la transparence de la simulation.",
    ],
  },
};

// ──────────────────────────────────────────────────────────────
// Countdown duration (seconds) before auto-redirect
// ──────────────────────────────────────────────────────────────
// Total number of seconds the interstitial page remains visible before automatically navigating away
const COUNTDOWN_SECONDS = 12;
// Number of seconds after which the "Skip / Continue" button becomes visible to the user
const SKIP_AFTER_SECONDS = 5; // "Skip" button appears after this

// Define the InterstitialAdPage functional component — a transitional page shown between steps
// It displays editorial content + an ad while a countdown timer runs, then auto-redirects
const InterstitialAdPage: React.FC = () => {
  // Initialize navigate for programmatic routing to the destination page
  const navigate = useNavigate();
  // Read URL search parameters — specifically the "to" param which indicates the target destination
  const [searchParams] = useSearchParams();
  // Extract the destination route from URL params; default to "/dashboard" if not specified
  const destination = searchParams.get("to") || "/dashboard";
  // State: remaining seconds in the countdown timer (starts at COUNTDOWN_SECONDS)
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  // State: whether the user can skip/continue (becomes true after SKIP_AFTER_SECONDS)
  const [canSkip, setCanSkip] = useState(false);
  // Ref to store the interval ID so we can clear it on skip or component unmount
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(
    undefined,
  );

  // Select the editorial content variant matching the user's destination, falling back to dashboard variant
  const content =
    CONTENT_VARIANTS[destination] || CONTENT_VARIANTS["/dashboard"];

  // Effect: runs once on mount — sets up the countdown interval timer and the skip-enable timeout
  useEffect(() => {
    // Scroll to top of page when the interstitial loads so content is visible from the start
    window.scrollTo(0, 0);

    // Start a 1-second interval that decrements the countdown each tick
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        // When countdown reaches 0, clear the interval and auto-navigate to the destination
        if (prev <= 1) {
          clearInterval(timerRef.current);
          // Navigate to destination, replacing the interstitial in browser history so back button skips it
          navigate(destination, { replace: true });
          return 0;
        }
        // Decrement countdown by 1 second
        return prev - 1;
      });
    }, 1000);

    // Set a timeout to enable the skip/continue button after SKIP_AFTER_SECONDS
    const skipTimer = setTimeout(
      () => setCanSkip(true),
      SKIP_AFTER_SECONDS * 1000,
    );

    // Cleanup function: clear both the interval and the timeout when the component unmounts
    return () => {
      clearInterval(timerRef.current);
      clearTimeout(skipTimer);
    };
  }, [destination, navigate]); // Re-run if destination or navigate changes (unlikely but safe)

  // Handler for the skip/continue button — immediately navigates to the destination
  const handleSkip = () => {
    // Clear the countdown interval to prevent further state updates
    clearInterval(timerRef.current);
    // Navigate to the destination page, replacing this interstitial in history
    navigate(destination, { replace: true });
  };

  // Main render: interstitial page with header, editorial content, ad, progress bar, and skip button
  return (
    // Root container — full-screen dark background, vertical flex layout, white text
    <div className="min-h-screen bg-[var(--color-deep-space)] flex flex-col text-white">
      {/* SEO component — sets the page's <title> and <meta description> dynamically based on the content variant */}
      <SEO
        title={content.seoTitle}
        description={content.seoDescription}
        path="/"
      />

      {/* Top header bar — shows the editorial title on the left, and countdown/skip button on the right */}
      <div className="flex items-center justify-between p-4 border-b border-white/5 bg-black/20 backdrop-blur-md">
        {/* Display the editorial content title (e.g., "Before your results — what you need to know") */}
        <h1 className="text-xs font-bold tracking-widest text-white uppercase">
          {content.title}
        </h1>
        {/* Right side: either the skip/continue button or the countdown spinner */}
        <div className="flex items-center space-x-3">
          {/* Conditional rendering: show skip button if enough time has passed, otherwise show countdown */}
          {canSkip ? (
            // "Continue" button — appears after SKIP_AFTER_SECONDS; allows user to bypass the wait
            <button
              onClick={handleSkip}
              className="px-4 py-1.5 text-xs font-bold uppercase tracking-widest rounded-lg bg-[var(--color-plasma-cyan)]/20 hover:bg-[var(--color-plasma-cyan)]/40 text-[var(--color-plasma-cyan)] transition-all"
            >
              Continuer →
            </button>
          ) : (
            // Countdown display — spinning loader icon + remaining seconds shown in monospace
            <div className="flex items-center space-x-2 text-gray-500">
              {/* Animated spinning loader to indicate time is passing */}
              <Loader2 className="w-3 h-3 animate-spin" />
              {/* Countdown seconds remaining, displayed in tiny uppercase monospace for a technical feel */}
              <span className="text-[10px] uppercase tracking-widest font-mono">
                {countdown}s
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Scrollable main content area — editorial text, ad unit, disclaimer, progress bar, and bottom skip button */}
      <div className="flex-1 px-6 py-8 pb-24 space-y-6 overflow-y-auto">
        {/* Editorial content article — maps over the paragraph array and renders each with staggered fade-in animation */}
        <article className="space-y-4">
          {content.paragraphs.map((p, i) => (
            // Each paragraph renders with a fade-in animation, staggered by 150ms per paragraph index
            <p
              key={i}
              className="text-sm leading-relaxed text-gray-300 animate-fade-in"
              style={{ animationDelay: `${i * 150}ms` }}
            >
              {p}
            </p>
          ))}
        </article>

        {/* Google AdSense rectangle ad unit — placed between editorial content sections (above + below) */}
        {/* This satisfies AdSense's requirement that ads be surrounded by substantial publisher content */}
        <div className="flex justify-center py-4">
          <AdUnit type="rectangle" />
        </div>

        {/* Additional editorial disclaimer below the ad — reminds users this is not legal advice */}
        <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02]">
          <p className="text-xs leading-relaxed text-gray-500">
            {/* Bold "Reminder" label followed by the disclaimer text */}
            <strong className="text-gray-400">Rappel :</strong> SimulDivorce est
            un outil de simulation indicatif basé sur des barèmes publics
            (Ministère de la Justice, Code Civil, échelle OCDE). Il ne constitue
            pas un conseil juridique. Pour toute décision importante, consultez
            un avocat spécialisé en droit de la famille.
          </p>
        </div>

        {/* Visual progress bar — fills from left to right as the countdown progresses, giving users a time reference */}
        <div className="w-full h-1 overflow-hidden rounded-full bg-white/5">
          {/* Inner bar — width is proportional to elapsed time; cyan colored with smooth 1s linear transition */}
          <div
            className="h-full bg-[var(--color-plasma-cyan)] transition-all duration-1000 ease-linear rounded-full"
            style={{
              // Calculate percentage: (elapsed seconds / total seconds) × 100
              width: `${((COUNTDOWN_SECONDS - countdown) / COUNTDOWN_SECONDS) * 100}%`,
            }}
          />
        </div>

        {/* Bottom skip/continue button — only rendered once the canSkip state becomes true */}
        {canSkip && (
          // Wrapping div — centered with fade-in animation when appearing
          <div className="flex justify-center pt-2 animate-fade-in">
            {/* Full-width continue button — prominent cyan CTA with glow shadow and press animation (scale-95) */}
            <button
              onClick={handleSkip}
              className="w-full max-w-md bg-[var(--color-plasma-cyan)] hover:bg-[var(--accent-hover)] text-white font-bold py-4 rounded-2xl shadow-[0_0_30px_rgba(34,211,238,0.3)] transition-all flex items-center justify-center space-x-2 group active:scale-95"
              style={{ color: "#ffffff" }}
            >
              {/* Button label — dynamically changes text based on destination ("report" vs "results") */}
              <span className="text-sm tracking-widest uppercase">
                Continuer vers{" "}
                {destination === "/export" ? "le rapport" : "les résultats"}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Export the InterstitialAdPage component as the default export so it can be used by the router
export default InterstitialAdPage;
