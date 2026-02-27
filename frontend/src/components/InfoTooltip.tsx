// Import React core and hooks: useState for open/close state, useEffect for body scroll lock side effect
import React, { useState, useEffect } from "react";
// Import createPortal to render the modal outside the component tree, directly in document.body
import { createPortal } from "react-dom";
// Import Info (ℹ circle) and X (close) icons from lucide-react for the trigger button and close button
import { Info, X } from "lucide-react";

// TypeScript interface defining the props accepted by InfoTooltip
interface InfoTooltipProps {
  // The text content to display inside the information modal
  content: string;
  // Optional label text shown next to the info icon as a small underlined hint
  label?: string;
}

// InfoTooltip — a modal information tooltip triggered by clicking an info icon button
// It renders a full-screen overlay modal via a React portal to ensure correct stacking
export const InfoTooltip: React.FC<InfoTooltipProps> = ({ content, label }) => {
  // State variable tracking whether the modal is currently visible
  const [isOpen, setIsOpen] = useState(false);

  // Prevent body scroll when modal is open so the user can only scroll modal content
  useEffect(() => {
    if (isOpen) {
      // Disable body scrolling by setting overflow to hidden
      document.body.style.overflow = "hidden";
      // Cleanup function: re-enable body scrolling when modal closes or component unmounts
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isOpen]); // Re-run whenever isOpen changes

  // Build the modal JSX. If isOpen is true, create a portal rendered into document.body;
  // otherwise modal is null and nothing is rendered
  const modal = isOpen
    ? createPortal(
        // Full-screen backdrop overlay: semi-transparent black with blur, centered flex container
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          style={{
            textTransform: "none", // Reset any inherited text-transform so content displays normally
            fontSize: "16px", // Reset font size to standard base size inside the modal
            letterSpacing: "normal", // Reset any inherited letter-spacing
            fontWeight: "normal", // Reset any inherited font-weight so modal text is regular weight
          }}
          onClick={() =>
            setIsOpen(false)
          } /* Clicking the backdrop closes the modal */
        >
          {/* Modal card: themed background, border, rounded corners, constrained width, scrollable content */}
          <div
            className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl shadow-2xl w-full max-w-[calc(100vw-1.5rem)] sm:max-w-lg relative flex flex-col max-h-[80vh] sm:max-h-[85vh] animate-in zoom-in-95 duration-200"
            onClick={(e) =>
              e.stopPropagation()
            } /* Prevent clicks inside the modal from closing it */
          >
            {/* Header section: contains the info icon, title, and close button */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[var(--border-color)]">
              {/* Left side of header: info icon badge and "Information" title */}
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Circular badge with accent-colored info icon */}
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[var(--accent-primary)]/10 flex items-center justify-center shrink-0">
                  {/* Info icon styled with the app's accent color */}
                  <Info className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--accent-primary)]" />
                </div>
                {/* Modal title text */}
                <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
                  Information
                </h3>
              </div>
              {/* Close button in the top-right corner of the header */}
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent the click from propagating to the backdrop
                  setIsOpen(false); // Close the modal
                }}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition p-2 rounded-full hover:bg-[var(--bg-tertiary)] cursor-pointer"
                aria-label="Fermer" /* Accessible label in French: "Close" */
                type="button" /* Explicitly set type to button to prevent form submission */
              >
                {/* X (close) icon */}
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content section: scrollable area displaying the informational text */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-0">
              {/* The information text content, preserving whitespace and allowing word breaks */}
              <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap break-words normal-case">
                {content}
              </p>
            </div>
          </div>
        </div>,
        document.body, // Portal target: render the modal as a direct child of <body>
      )
    : null; // When closed, the modal is not rendered at all

  // Return the trigger button and the conditional modal
  return (
    <>
      {/* Trigger button: small info icon that opens the modal when clicked */}
      <button
        onClick={(e) => {
          e.preventDefault(); // Prevent default browser behavior (e.g., form submission)
          e.stopPropagation(); // Stop the click from bubbling up to parent elements
          setIsOpen(true); // Open the information modal
        }}
        className="inline-flex items-center space-x-1 text-[var(--accent-primary)] hover:opacity-80 transition shrink-0"
        aria-label="Plus d'informations" /* Accessible label in French: "More information" */
        type="button" /* Prevent accidental form submission */
      >
        {/* Small info circle icon as the visual trigger */}
        <Info className="w-4 h-4" />
        {/* If a label prop was provided, display it as a small underlined text next to the icon */}
        {label && (
          <span className="text-xs underline decoration-dotted">{label}</span>
        )}
      </button>

      {/* Render the modal (or null if closed) */}
      {modal}
    </>
  );
};
