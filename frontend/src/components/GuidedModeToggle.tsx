// Import React and the useState hook for managing local component state (confirm modal visibility)
import React, { useState } from "react";
// Import createPortal to render the toggle button and modal as direct children of document.body,
// bypassing any parent overflow/z-index constraints so the floating UI always stays on top
import { createPortal } from "react-dom";
// Import Lucide icons: BookOpen (guided mode active), X (close button), EyeOff (guided mode disabled)
import { BookOpen, X, EyeOff } from "lucide-react";
// Import useLocation from React Router to read the current URL pathname for conditional rendering
import { useLocation } from "react-router-dom";
// Import the guided mode context hook to read/write the current guided mode state
import { useGuidedMode } from "../services/guidedMode";

/**
 * Floating toggle button that lets the user turn guided mode off (or back on)
 * at any time during the simulation. Includes a confirmation modal when disabling.
 * Only renders if a mode has already been chosen (i.e., not on the initial landing page).
 */
export const GuidedModeToggle: React.FC = () => {
  // Destructure mode (the raw mode string), isGuided (boolean shortcut), and setMode (setter) from context
  const { mode, isGuided, setMode } = useGuidedMode();
  // Local state controlling whether the "confirm disable" modal dialog is visible
  const [showConfirm, setShowConfirm] = useState(false);
  // Extract the current URL pathname to conditionally hide the toggle on certain pages
  const { pathname } = useLocation();

  // Don't render the toggle at all if the user hasn't chosen a mode yet (first visit / landing)
  if (!mode) return null;

  // Define an array of page paths where the toggle should be completely hidden
  const hiddenPages = ["/"];
  // If the current page path is in the hidden list (e.g., landing page), render nothing
  if (hiddenPages.includes(pathname)) return null;

  // Check specifically if we're on the disclaimer page — the toggle is hidden on desktop but shown on mobile
  const isDisclaimerPage = pathname === "/disclaimer";

  // Handler for when the user clicks the floating toggle button
  const handleToggle = () => {
    if (isGuided) {
      // If currently in guided mode, show the confirmation modal before disabling
      setShowConfirm(true);
    } else {
      // If currently in unguided mode, re-enable guided mode immediately without confirmation
      setMode("guided");
      // Clear all session storage keys that track dismissed guided tooltips,
      // so all step-by-step tooltips reappear fresh when guided mode is re-enabled
      Object.keys(sessionStorage).forEach((key) => {
        // Only remove keys that match the "guidedDismissed_" prefix pattern
        if (key.startsWith("guidedDismissed_")) sessionStorage.removeItem(key);
      });
    }
  };

  // Handler for the "Confirm disable" button inside the modal — actually disables guided mode
  const confirmDisable = () => {
    // Switch to "unguided" mode, hiding all step-by-step tooltips and sequential reveals
    setMode("unguided");
    // Close the confirmation modal
    setShowConfirm(false);
  };

  // Use createPortal to render button + modal directly into document.body
  // This ensures they are not affected by any parent component's overflow hidden or z-index stacking
  return createPortal(
    <>
      {/* Floating toggle button — fixed position at bottom-right of the viewport */}
      <button
        // Clicking this button either shows the confirm modal (if guided) or re-enables guided mode
        onClick={handleToggle}
        // Complex class string: fixed positioning, high z-index, responsive sizing,
        // rounded shape, shadow, transition animations, and conditional styles based on guided state
        // On the disclaimer page, hide on sm+ screens (desktop) with "sm:hidden"
        className={`fixed bottom-[9rem] right-3 z-[9997] w-7 h-7 sm:bottom-24 sm:right-4 sm:w-12 sm:h-12 rounded-xl shadow-lg flex items-center justify-center transition-all active:scale-90 btn-compact ${isDisclaimerPage ? "sm:hidden" : ""} ${
          isGuided
            ? "bg-[var(--accent-primary)] text-white shadow-[var(--accent-primary)]/30 border border-white/20" // Accent-colored when guided mode is ON
            : "bg-white/10 backdrop-blur-md text-gray-400 border border-white/20 hover:bg-white/15" // Subtle translucent when guided mode is OFF
        }`}
        // Tooltip title attribute: shows "Disable guide" or "Enable guide" in French on hover
        title={isGuided ? "Désactiver le guide" : "Activer le guide"}
      >
        {/* Conditionally render the appropriate icon based on guided mode state */}
        {isGuided ? (
          // BookOpen icon when guided mode is active — visually indicates guidance is available
          <BookOpen className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
        ) : (
          // EyeOff icon when guided mode is inactive — visually indicates guidance is hidden
          <EyeOff className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
        )}
      </button>

      {/* Confirmation modal — only rendered when showConfirm is true (user wants to disable guided mode) */}
      {showConfirm && (
        // Full-screen backdrop overlay: dark semi-transparent background with blur effect
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          // Clicking the backdrop (outside the modal card) closes the modal
          onClick={() => setShowConfirm(false)}
        >
          {/* Modal card container with themed background, border, rounded corners, and shadow */}
          <div
            className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl shadow-2xl w-full max-w-sm"
            // Stop click propagation so clicking inside the card doesn't trigger the backdrop's onClick
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header: icon badge, title text, and close (X) button */}
            <div className="flex items-center justify-between p-5 border-b border-[var(--border-color)]">
              {/* Left side: amber warning icon and title */}
              <div className="flex items-center gap-3">
                {/* Circular badge with amber background tint containing the EyeOff warning icon */}
                <div className="w-9 h-9 rounded-full bg-amber-500/10 flex items-center justify-center">
                  {/* EyeOff icon in amber color indicating the guide will be turned off */}
                  <EyeOff className="w-4 h-4 text-amber-400" />
                </div>
                {/* Modal title in French: "Disable the guide?" */}
                <h3 className="font-bold text-[var(--text-primary)]">
                  Désactiver le guide ?
                </h3>
              </div>
              {/* Close button (X icon) in the top-right corner of the modal header */}
              <button
                onClick={() => setShowConfirm(false)}
                className="p-1.5 rounded-full hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)]"
              >
                {/* X icon from Lucide for closing the modal */}
                <X className="w-4 h-4" />
              </button>
            </div>
            {/* Modal body: explanatory text and action buttons */}
            <div className="p-5 space-y-4">
              {/* Primary explanation: tells the user that step-by-step explanations will no longer appear */}
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                {/* French text: "Step-by-step explanations will no longer appear. You can still consult info by clicking the ℹ icons next to each field." */}
                Les explications pas-à-pas ne s'afficheront plus. Vous pourrez
                toujours consulter les informations en cliquant sur les icônes{" "}
                {/* Inline info icon in accent color */}
                <span className="inline-flex items-center text-[var(--accent-primary)]">
                  ℹ
                </span>{" "}
                à côté de chaque champ.
              </p>
              {/* Secondary note: reassures the user that they can re-enable the guide anytime */}
              <p className="text-xs text-[var(--text-muted)]">
                {/* French text: "You can reactivate the guide at any time via the floating button." */}
                Vous pourrez réactiver le guide à tout moment via le bouton
                flottant.
              </p>
              {/* Action buttons row: Cancel and Confirm (Disable) */}
              <div className="flex space-x-3">
                {/* Cancel button: closes the modal without changing the mode */}
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-3 rounded-xl border border-[var(--border-color)] text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition"
                >
                  {/* French: "Cancel" */}
                  Annuler
                </button>
                {/* Confirm disable button: actually switches to unguided mode */}
                <button
                  onClick={confirmDisable}
                  className="flex-1 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-sm font-medium text-amber-400 hover:bg-amber-500/20 transition"
                >
                  {/* French: "Disable" — confirms the action */}
                  Désactiver
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>,
    // Portal target: render the floating button and modal directly into document.body
    document.body,
  );
};
