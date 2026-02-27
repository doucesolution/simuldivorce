// Import React core hooks: useState for local state, useEffect for side effects, useCallback for memoised callbacks
import React, { useState, useEffect, useCallback } from "react";
// Import the guided-mode context hook to check whether the user has enabled guided mode
import { useGuidedMode } from "../services/guidedMode";

// TypeScript interface describing a single stop in the header tour
interface TourStop {
  /** CSS selector or fixed position target — identifies which UI element to highlight */
  target: "back" | "home" | "guide-toggle" | "theme-toggle" | "validate-btn";
  /** Label text shown in the tooltip header, e.g. "Retour" */
  label: string;
  /** Tooltip description — explains what the highlighted button does */
  description: string;
}

// Static array of all tour stops in display order; each object maps to a specific header/UI element
const TOUR_STOPS: TourStop[] = [
  {
    // First stop: the "Back" navigation button in the sticky header
    target: "back",
    // French label "Retour" meaning "Back"
    label: "Retour",
    // Description telling the user they can go back at any time
    description: "Retournez à l'étape précédente à tout moment.",
  },
  {
    // Second stop: the "Home" navigation button in the sticky header
    target: "home",
    // French label "Accueil" meaning "Home"
    label: "Accueil",
    // Description telling the user this returns to the simulator homepage
    description: "Revenez à la page d'accueil du simulateur.",
  },
  {
    // Third stop: the floating guided mode toggle button
    target: "guide-toggle",
    // French label "Guide" for the guided mode toggle
    label: "Guide",
    // Explains that this button enables/disables guided mode and step-by-step explanations
    description:
      "Activez ou désactivez le mode guidé. Les explications pas-à-pas s'afficheront ou se masqueront.",
  },
  {
    // Fourth stop: the theme (dark/light mode) toggle button
    target: "theme-toggle",
    // French label "Thème" meaning "Theme"
    label: "Thème",
    // Explains the user can switch between light and dark themes
    description:
      "Basculez entre le mode clair et le mode sombre selon votre préférence.",
  },
  {
    // Fifth and final stop: the main validation/submit button at the bottom
    target: "validate-btn",
    // French label "Valider" meaning "Validate"
    label: "Valider",
    // Tells the user to press this button once all fields are filled to advance
    description:
      "Une fois tous les champs remplis, appuyez ici pour valider et passer à l'étape suivante.",
  },
];

/** Session storage key used to persist whether the tour has already been shown this session */
const TOUR_SHOWN_KEY = "guidedHeaderTourShown";

/**
 * A one-time guided tour overlay component that highlights
 * the header buttons (back, home), guide toggle, theme toggle, and validate button
 * with tooltip annotations, SVG backdrop cutout, and pulse/ring animations.
 * This tour is only shown once per session when the user first enters guided mode.
 */
export const GuidedHeaderTour: React.FC = () => {
  // Destructure the isGuided boolean from the guided mode context to know if guided mode is active
  const { isGuided } = useGuidedMode();
  // currentStop tracks which tour stop is active; -1 means the tour is not running
  const [currentStop, setCurrentStop] = useState(-1);
  // positions stores the measured bounding rectangles of all target elements keyed by target name
  const [positions, setPositions] = useState<
    Record<string, { top: number; left: number; width: number; height: number }>
  >({});

  // Effect: on guided mode activation, check if this tour has already been shown in this session
  useEffect(() => {
    // If guided mode is off, do nothing — tour only runs in guided mode
    if (!isGuided) return;
    // Retrieve the session storage flag indicating if the tour was already displayed
    const shown = sessionStorage.getItem(TOUR_SHOWN_KEY);
    // If the tour has not been shown yet, start it after an 800ms delay to let the page fully mount
    if (!shown) {
      // Small delay so DOM elements are rendered and measurable before starting the tour
      const timer = setTimeout(() => setCurrentStop(0), 800);
      // Cleanup: clear the timer if the component unmounts or isGuided changes before it fires
      return () => clearTimeout(timer);
    }
  }, [isGuided]); // Re-run when guided mode state changes

  // Effect: measure the bounding rectangles of all tour target elements whenever the current stop changes
  useEffect(() => {
    // If the tour is not active (currentStop < 0), skip measurement entirely
    if (currentStop < 0) return;

    // Inner function that queries the DOM and measures positions of each tour target element
    const measure = () => {
      // Create a fresh positions object to hold the measured rectangles
      const newPositions: typeof positions = {};

      // Back button & Home button: find the sticky header element by its class names
      const header = document.querySelector(
        "[class*='sticky'][class*='top-0']",
      );
      // If the sticky header exists, measure the first two buttons inside it
      if (header) {
        // Get all buttons within the header container
        const buttons = header.querySelectorAll("button");
        // First button is the "Back" navigation button
        if (buttons[0]) {
          // getBoundingClientRect returns the element's size and position relative to the viewport
          const rect = buttons[0].getBoundingClientRect();
          // Store the back button's position and dimensions
          newPositions.back = {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          };
        }
        // Second button is the "Home" navigation button
        if (buttons[1]) {
          // Measure the home button's bounding rectangle
          const rect = buttons[1].getBoundingClientRect();
          // Store the home button's position and dimensions
          newPositions.home = {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          };
        }
      }

      // Guide toggle: find the floating button by its title attribute containing "guide" or "Guide"
      const guideBtn = document.querySelector(
        "button[title*='guide'], button[title*='Guide']",
      );
      // If the guide toggle button exists in the DOM, measure it
      if (guideBtn) {
        // Measure position and size of the guide toggle button
        const rect = guideBtn.getBoundingClientRect();
        // Store under the "guide-toggle" key matching the tour stop target name
        newPositions["guide-toggle"] = {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        };
      }

      // Theme toggle: find the fixed button with an aria-label containing "mode" (dark/light mode)
      const themeBtn = document.querySelector('button[aria-label*="mode"]');
      // If the theme toggle button exists in the DOM, measure it
      if (themeBtn) {
        // Measure position and size of the theme toggle button
        const rect = themeBtn.getBoundingClientRect();
        // Store under the "theme-toggle" key matching the tour stop target name
        newPositions["theme-toggle"] = {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        };
      }

      // Validate button: find the main action button inside the fixed footer at the bottom
      const footerDiv = document.querySelector(".fixed.bottom-0 button");
      // If the validate button exists in the DOM, measure it
      if (footerDiv) {
        // Measure position and size of the validate button
        const rect = footerDiv.getBoundingClientRect();
        // Store under the "validate-btn" key matching the tour stop target name
        newPositions["validate-btn"] = {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        };
      }

      // Update React state with all measured positions, triggering a re-render with fresh coordinates
      setPositions(newPositions);
    };

    // Perform an initial measurement immediately
    measure();
    // Re-measure whenever the user scrolls (using capture phase for nested scroll containers)
    window.addEventListener("scroll", measure, true);
    // Re-measure whenever the browser window is resized
    window.addEventListener("resize", measure);
    // Cleanup: remove the scroll and resize listeners when the effect re-runs or component unmounts
    return () => {
      window.removeEventListener("scroll", measure, true);
      window.removeEventListener("resize", measure);
    };
  }, [currentStop]); // Re-run measurements whenever the active tour stop changes

  // Effect: temporarily override the validate button's styles so it is visible during the tour
  // Normally this button may be blurred/disabled, but we want it clearly visible when highlighted
  useEffect(() => {
    // Query the validate button in the fixed footer
    const btn = document.querySelector(
      ".fixed.bottom-0 button",
    ) as HTMLElement | null;
    // If the button doesn't exist in the DOM, exit early
    if (!btn) return;

    // When the tour is active (currentStop >= 0), force the button to be fully visible
    if (currentStop >= 0) {
      // Tour is active: make the button fully opaque so it's clearly visible through the overlay
      btn.style.opacity = "1";
      // Remove any blur filters that might be applied by guided mode's sequential reveal
      btn.style.filter = "none";
      // Disable pointer events so the user can't accidentally click the button during the tour
      btn.style.pointerEvents = "none"; // still non-clickable during tour
    }

    // Cleanup function: restore the button's original styles when the tour ends or effect re-runs
    return () => {
      // Reset opacity to empty string so React/CSS classes regain control
      btn.style.opacity = "";
      // Reset filter to empty string so React/CSS classes regain control
      btn.style.filter = "";
      // Reset pointer events to empty string so React/CSS classes regain control
      btn.style.pointerEvents = "";
    };
  }, [currentStop]); // Re-run whenever the current tour stop changes

  // Memoised callback to advance to the next tour stop, or finish the tour if at the last stop
  const advance = useCallback(() => {
    // If we're at the last stop, mark the tour as complete
    if (currentStop >= TOUR_STOPS.length - 1) {
      // Done — hide the tour overlay by setting currentStop back to -1
      setCurrentStop(-1);
      // Persist that the tour has been shown so it won't appear again this session
      sessionStorage.setItem(TOUR_SHOWN_KEY, "true");
    } else {
      // Otherwise, move to the next tour stop by incrementing the index
      setCurrentStop((s) => s + 1);
    }
  }, [currentStop]); // Re-create callback when currentStop changes (to check if at last stop)

  // Memoised callback to dismiss/skip the entire tour immediately
  const dismiss = useCallback(() => {
    // Hide the tour overlay by resetting currentStop to -1
    setCurrentStop(-1);
    // Mark as shown so the tour won't reappear during this session
    sessionStorage.setItem(TOUR_SHOWN_KEY, "true");
  }, []); // No dependencies — dismiss always does the same thing

  // Guard clause: if guided mode is off, or tour is not active, or stop index is out of bounds, render nothing
  if (!isGuided || currentStop < 0 || currentStop >= TOUR_STOPS.length) {
    return null; // Don't render any overlay or tooltip
  }

  // Get the current tour stop configuration (target, label, description)
  const stop = TOUR_STOPS[currentStop];
  // Look up the measured position for the current stop's target element
  const pos = positions[stop.target];

  // Compute the CSS position styles for the tooltip relative to the highlighted target element
  const getTooltipStyle = (): React.CSSProperties => {
    // If no position data is available yet (element not measured), center the tooltip on screen as fallback
    if (!pos)
      return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };

    // Calculate the horizontal center of the target element
    const centerX = pos.left + pos.width / 2;
    // Calculate the vertical center of the target element
    const centerY = pos.top + pos.height / 2;
    // Get the full viewport width for clamping the tooltip within the visible area
    const viewportW = window.innerWidth;
    // Get the full viewport height to decide whether tooltip goes above or below
    const viewportH = window.innerHeight;

    // Decision: if the target is in the top half of the screen, show tooltip BELOW it
    if (centerY < viewportH / 2) {
      // Position tooltip 12px below the bottom edge of the target
      return {
        top: pos.top + pos.height + 12,
        // Clamp the left position so the 280px-wide tooltip stays within 16px margins
        left: Math.max(16, Math.min(centerX - 140, viewportW - 296)),
        maxWidth: 280, // Constrain tooltip width to 280px
      };
    } else {
      // Target is in the bottom half: show tooltip ABOVE it, using CSS 'bottom' positioning
      return {
        // Position tooltip 12px above the top edge of the target, calculated from viewport bottom
        bottom: viewportH - pos.top + 12,
        // Same horizontal clamping logic as above
        left: Math.max(16, Math.min(centerX - 140, viewportW - 296)),
        maxWidth: 280, // Constrain tooltip width to 280px
      };
    }
  };

  // Compute the position and direction of the tooltip's arrow (small triangle pointing to the target)
  const getArrowStyle = (): {
    style: React.CSSProperties; // CSS positioning for the arrow element
    direction: "up" | "down"; // Whether the arrow points up (tooltip below) or down (tooltip above)
  } => {
    // If no position data, return defaults
    if (!pos) return { style: {}, direction: "down" };

    // Horizontal center of the target for aligning the arrow
    const centerX = pos.left + pos.width / 2;
    // Vertical center to decide arrow direction
    const centerY = pos.top + pos.height / 2;
    // Viewport height for top/bottom half comparison
    const viewportH = window.innerHeight;
    // Get the tooltip's left position to calculate the arrow's relative offset within the tooltip
    const tooltipLeft = getTooltipStyle().left as number;

    // If target is in the top half, arrow points UP (tooltip is below the target)
    if (centerY < viewportH / 2) {
      // Arrow points up — placed above the tooltip card, aligned with the target center
      return {
        // Calculate the arrow's left offset relative to the tooltip's left edge
        style: { left: Math.max(16, centerX - (tooltipLeft || 0) - 6) },
        direction: "up", // Arrow triangle points upward toward the target
      };
    } else {
      // Arrow points down — placed below the tooltip card, aligned with the target center
      return {
        // Same horizontal calculation for the arrow offset
        style: { left: Math.max(16, centerX - (tooltipLeft || 0) - 6) },
        direction: "down", // Arrow triangle points downward toward the target
      };
    }
  };

  // Pre-compute the tooltip and arrow styles to use in the JSX below
  const tooltipStyle = getTooltipStyle();
  // Destructure to get both the arrow's CSS styles and its direction string
  const { style: arrowStyle, direction: arrowDirection } = getArrowStyle();

  // Render the tour overlay: an SVG backdrop with cutout, a highlight ring, and a floating tooltip
  return (
    <>
      {/* SVG Backdrop: full-screen semi-transparent overlay with a transparent hole around the active target */}
      <svg
        // Fixed positioning covers the entire viewport; z-index 9990 places it above page content
        className="fixed inset-0 z-[9990] guided-tour-backdrop"
        // Force the SVG to span the full viewport width and height
        style={{ width: "100vw", height: "100vh" }}
        // Clicking anywhere on the dark overlay dismisses/skips the entire tour
        onClick={dismiss}
      >
        {/* SVG <defs> section: define reusable mask and filter elements */}
        <defs>
          {/* SVG mask used to create the transparent cutout hole around the target element */}
          <mask id="tour-mask">
            {/* White rectangle = the entire overlay area that will be visible (dark overlay) */}
            <rect width="100%" height="100%" fill="white" />
            {/* Black rectangle = transparent "hole" that reveals the target element beneath the overlay */}
            {pos && (
              <rect
                // Position the cutout 8px outside the target on each side for visual padding
                x={pos.left - 8}
                y={pos.top - 8}
                // Size the cutout 16px larger than the target (8px padding on each side)
                width={pos.width + 16}
                height={pos.height + 16}
                // Use a pill shape for wide elements (>100px) or circle for small ones
                rx={pos.width > 100 ? 16 : (pos.width + 16) / 2}
                // Black in the mask = fully transparent area (the cutout hole)
                fill="black"
              />
            )}
          </mask>
          {/* Gaussian blur filter applied to the overlay edges for a soft, polished look */}
          <filter id="tour-blur">
            {/* Standard deviation of 2 gives a subtle blur to soften the overlay edges */}
            <feGaussianBlur stdDeviation="2" />
          </filter>
        </defs>
        {/* Main overlay rectangle: semi-transparent black with the mask cutout applied */}
        <rect
          width="100%"
          height="100%"
          // 55% opacity black fill creates the dimming effect over the page
          fill="rgba(0,0,0,0.55)"
          // Apply the mask so the target area is see-through
          mask="url(#tour-mask)"
          // Apply the blur filter for softer edges around the cutout
          filter="url(#tour-blur)"
        />
      </svg>

      {/* Highlight ring: a pulsing circular/rounded ring drawn around the active target element */}
      {pos && (
        <div
          // Fixed positioning with very high z-index; pointer-events-none so clicks pass through
          // The "guided-tour-ring" class applies the pulse animation defined in CSS
          className="fixed z-[9999] rounded-full pointer-events-none guided-tour-ring"
          style={{
            // Position the ring 6px outside the target on each side
            top: pos.top - 6,
            left: pos.left - 6,
            // Size the ring 12px larger than the target (6px padding each side)
            width: pos.width + 12,
            height: pos.height + 12,
          }}
        />
      )}

      {/* Tooltip: floating card with the tour stop's label, description, and navigation buttons */}
      <div className="fixed z-[10000] guided-tour-tooltip" style={tooltipStyle}>
        {/* Tooltip card with accent background color, white text, rounded corners, and a shadow */}
        <div className="bg-[var(--accent-primary)] text-white rounded-xl shadow-2xl shadow-[var(--accent-primary)]/30 p-4 relative">
          {/* Arrow triangle: a small rotated square that creates the triangular pointer toward the target */}
          <div
            // Rotate a small div 45° to make a diamond shape; clip to look like a triangle
            // Position it at the top edge (pointing up) or bottom edge (pointing down) based on direction
            className={`absolute w-3 h-3 bg-[var(--accent-primary)] rotate-45 ${
              arrowDirection === "up" ? "-top-1.5" : "-bottom-1.5"
            }`}
            // Apply the calculated horizontal position to align the arrow with the target center
            style={arrowStyle}
          />

          {/* Tooltip content area, z-10 so text renders above the arrow element */}
          <div className="relative z-10">
            {/* Step label showing the stop name and progress indicator (e.g., "Retour — 1/5") */}
            <span className="text-[10px] uppercase tracking-widest font-bold opacity-70 block mb-1">
              {stop.label} — {currentStop + 1}/{TOUR_STOPS.length}
            </span>
            {/* Description text explaining what this UI element does */}
            <p className="text-sm leading-relaxed">{stop.description}</p>

            {/* Action buttons row: dismiss (skip all) on the left, advance (next/done) on the right */}
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/20">
              {/* Dismiss button: skips the remaining tour stops and marks tour as shown */}
              <button
                onClick={dismiss}
                className="text-xs opacity-70 hover:opacity-100 transition px-3 py-1.5 rounded-lg hover:bg-white/10"
              >
                {/* French: "Ignore the explanations" — allows skipping the rest of the tour */}
                Ignorer les explications
              </button>
              {/* Advance button: moves to the next stop, or finishes the tour if on the last stop */}
              <button
                onClick={advance}
                className="flex items-center space-x-1.5 text-xs font-medium bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition active:scale-95"
              >
                {/* Show "Compris !" (Got it!) on the last stop, or "Suivant" (Next) otherwise */}
                <span>
                  {currentStop >= TOUR_STOPS.length - 1
                    ? "Compris !"
                    : "Suivant"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
