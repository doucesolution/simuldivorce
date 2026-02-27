// Import React core library and hooks: useEffect for side effects, useRef for mutable refs, useCallback for memoised functions
import React, { useEffect, useRef, useCallback } from "react";
// Import Lucide icons: Info (ℹ circle icon for tooltip header), ChevronRight (> arrow for the "Next" button)
import { Info, ChevronRight } from "lucide-react";
// Import the guided mode context hook to check if the user is in guided mode
import { useGuidedMode } from "../services/guidedMode";

// TypeScript interface defining the props accepted by the GuidedStep component
interface GuidedStepProps {
  /** Step index (0-based) — identifies this step's position in the sequence */
  step: number;
  /** Current active step index from page state — which step the user is currently on */
  currentStep: number;
  /** Total number of steps on this page — used for progress display and bounds checking */
  totalSteps: number;
  /** Callback to advance to the next step — called on auto-advance or manual "Next" click */
  onAdvance: () => void;
  /** Tooltip explanation text — the instructional content shown below the active step */
  content: string;
  /** Step label, e.g. "Date de Mariage" — shown as a small uppercase header in the tooltip */
  stepLabel?: string;
  /** Whether the user has filled in data for this step — triggers auto-advance when transitioning to true */
  isComplete?: boolean;
  /** The wrapped form field(s) or content that this step controls visibility for */
  children: React.ReactNode;
}

/**
 * Sequential reveal wrapper for guided mode.
 *
 * - In guided mode: only the active step is fully visible; future steps are
 *   blurred and non-interactive. A tooltip appears below the active step.
 *   When `isComplete` transitions from false to true, auto-advances after 600ms.
 *   A "Suivant" (Next) button is always available for manual advance.
 *
 * - In unguided mode (or after all steps done): renders children normally
 *   without any tooltip, blur, or sequential reveal behavior.
 */
export const GuidedStep: React.FC<GuidedStepProps> = ({
  step, // This step's index in the sequence (0-based)
  currentStep, // The currently active step index from parent page state
  totalSteps, // Total number of guided steps on this page
  onAdvance, // Callback function to move to the next step
  content, // Tooltip text content explaining what this step is about
  stepLabel, // Optional label for the step (displayed in tooltip header)
  isComplete = false, // Whether this step's form field has been filled in; defaults to false
  children, // The child elements (form fields, etc.) wrapped by this guided step
}) => {
  // Read guided mode state from context to decide whether to show sequential reveal behavior
  const { isGuided } = useGuidedMode();
  // Ref to the wrapper div, used for scrolling the active step into view
  const stepRef = useRef<HTMLDivElement>(null);
  // Ref that tracks the previous value of isComplete, used to detect false→true transitions
  const wasCompleteRef = useRef(isComplete);

  // Determine if all steps have been completed (currentStep has passed the last step index)
  const allDone = currentStep >= totalSteps;
  // This step is "active" if guided mode is on, not all done, and this is the current step
  const isActive = isGuided && !allDone && currentStep === step;
  // This step is "past" (already completed) if we're in unguided mode, all done, or current step is beyond this one
  const isPast = !isGuided || allDone || currentStep > step;

  // Effect: auto-advance to the next step when isComplete transitions from false to true while this step is active
  useEffect(() => {
    // If this step is not the active step, just sync the ref and return
    if (!isActive) {
      // Keep the ref in sync even when not active, so that when this step becomes active again
      // we have an accurate "previous" value to compare against
      wasCompleteRef.current = isComplete;
      return; // No auto-advance logic needed for inactive steps
    }

    // If isComplete is now true AND it was previously false, the user just filled in this field
    if (isComplete && !wasCompleteRef.current) {
      // Auto-advance after a 600ms delay — gives visual feedback before moving to the next step
      const timer = setTimeout(onAdvance, 600);
      // Update the ref to reflect the new completion state
      wasCompleteRef.current = isComplete;
      // Cleanup: clear the timeout if the component unmounts or dependencies change before it fires
      return () => clearTimeout(timer);
    }
    // Sync the ref for all other cases (e.g., isComplete was already true, or is still false)
    wasCompleteRef.current = isComplete;
  }, [isComplete, isActive, onAdvance]); // Re-run when completion status, active state, or advance function changes

  // Effect: smoothly scroll the active step into the center of the viewport
  useEffect(() => {
    // Only scroll if this step is currently the active step and the ref is attached to a DOM node
    if (isActive && stepRef.current) {
      // Small 150ms delay to let any CSS transitions settle before scrolling
      const timer = setTimeout(() => {
        // Use the browser's smooth scrolling API to center this step in the viewport
        stepRef.current?.scrollIntoView({
          behavior: "smooth", // Animate the scroll rather than jumping
          block: "center", // Vertically center the element in the viewport
        });
      }, 150);
      // Cleanup: cancel the scroll timer if dependencies change or component unmounts
      return () => clearTimeout(timer);
    }
  }, [isActive]); // Re-run when the active state changes

  // Short-circuit: in unguided mode or when all steps are done, render children without any wrapper
  if (!isGuided || allDone) {
    // Simply return the children as-is with no guided step decorations
    return <>{children}</>;
  }

  // Guided mode rendering: wrap children in a div with conditional CSS classes for reveal effects
  return (
    <div
      // Attach the ref for scroll-into-view functionality
      ref={stepRef}
      // Apply different visual states via CSS classes based on step status:
      // - Active step: elevated z-index so it appears above blurred siblings
      // - Past step: normal rendering (no blur or opacity changes)
      // - Future step: heavily blurred, faded, slightly scaled down, and non-interactive
      className={`transition-all duration-500 ease-out ${
        isActive
          ? "relative z-10" // Active: bring to front with relative positioning and z-index 10
          : isPast
            ? "" // Past completed steps: render normally with no special styling
            : "opacity-15 blur-[4px] pointer-events-none select-none scale-[0.97]" // Future: blurred, faded, non-clickable, unselectable, slightly shrunk
      }`}
    >
      {/* Render the actual form field(s) or content wrapped by this step */}
      {children}

      {/* Tooltip card: only shown when this step is the currently active one */}
      {isActive && (
        // Wrapper div with top margin and fade-in animation
        <div className="mt-3 animate-fade-in">
          {/* Tooltip card: accent-colored background, white text, rounded, with a colored shadow */}
          <div className="bg-[var(--accent-primary)] text-white rounded-xl shadow-lg shadow-[var(--accent-primary)]/20 p-3 sm:p-4 relative">
            {/* Small arrow triangle pointing up toward the form field above */}
            <div className="absolute -top-1.5 left-6 w-3 h-3 bg-[var(--accent-primary)] rotate-45" />

            {/* Tooltip content area: z-10 ensures text renders above the arrow element */}
            <div className="relative z-10">
              {/* Row containing the info icon and the text content */}
              <div className="flex items-start space-x-2 sm:space-x-3">
                {/* Info icon (ℹ) — visual indicator that this is an informational tooltip */}
                <Info className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 mt-0.5 opacity-90" />
                {/* Text content column: step label + description */}
                <div className="flex-1 min-w-0">
                  {/* Step label header: shows the field name and progress (e.g., "Date — 1/5") */}
                  {stepLabel && (
                    <span className="text-[9px] sm:text-[10px] uppercase tracking-widest font-bold opacity-70 block mb-1">
                      {/* Display the step label followed by the step number out of total steps */}
                      {stepLabel} — {step + 1}/{totalSteps}
                    </span>
                  )}
                  {/* Main tooltip text: the instructional content explaining what to do at this step */}
                  <p className="text-xs sm:text-sm leading-relaxed">
                    {content}
                  </p>
                </div>
              </div>

              {/* Action buttons row at the bottom of the tooltip, separated by a border */}
              <div className="flex items-center justify-end space-x-2 mt-2 sm:mt-3 pt-2 border-t border-white/20">
                {/* "Suivant" (Next) button: allows the user to manually advance to the next step */}
                <button
                  // Call the onAdvance callback to move to the next guided step
                  onClick={onAdvance}
                  // Styled as a small semi-transparent button with hover effect and press animation
                  className="flex items-center space-x-1.5 text-[11px] sm:text-xs font-medium bg-white/20 hover:bg-white/30 px-2.5 py-0.5 sm:px-3 sm:py-1.5 rounded-lg transition active:scale-95"
                >
                  {/* Button text: "Suivant" = French for "Next" */}
                  <span>Suivant</span>
                  {/* ChevronRight icon (>) indicating forward progression */}
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Custom hook for managing guided step state in a page.
 * Returns the current step index, an advance function, total steps, completion status,
 * and the guided mode flag. Used by page components to coordinate GuidedStep components.
 */
export const useGuidedSteps = (totalSteps: number) => {
  // Read guided mode state from context to determine initial step and react to mode changes
  const { isGuided } = useGuidedMode();
  // Initialize currentStep: in guided mode start at step 0; in unguided mode start at totalSteps (all visible)
  const [currentStep, setCurrentStep] = React.useState(() =>
    isGuided ? 0 : totalSteps,
  );

  // Memoised callback to advance the step counter by 1, capped at totalSteps
  const advanceStep = useCallback(() => {
    // Increment step by 1 but never exceed totalSteps (which means "all done")
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
  }, [totalSteps]); // Re-create if totalSteps changes

  // Effect: when guided mode is toggled, reset the step counter accordingly
  useEffect(() => {
    if (!isGuided) {
      // Guided mode turned off: set to totalSteps so all steps are visible immediately
      setCurrentStep(totalSteps); // all visible
    } else {
      // Guided mode turned on: restart from step 0 for sequential reveal
      setCurrentStep(0);
    }
  }, [isGuided, totalSteps]); // Re-run when guided mode state or total steps change

  // Derived flag: true when all steps have been completed (currentStep reached or passed totalSteps)
  const allDone = currentStep >= totalSteps;

  // Return the state and functions needed by page components to coordinate guided steps
  return { currentStep, totalSteps, advanceStep, allDone, isGuided };
};
