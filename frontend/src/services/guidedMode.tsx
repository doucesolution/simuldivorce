// Import React core and hooks: createContext for the context API, useContext to consume it,
// useState for local state management, useCallback to memoize the setter function.
import React, { createContext, useContext, useState, useCallback } from "react";

// Defines the two possible simulation modes:
// - "guided": step-by-step wizard that walks the user through each page in order
// - "unguided": free-form mode where the user can navigate pages independently
// - null: no mode selected yet (initial state before localStorage check)
type SimulationMode = "guided" | "unguided" | null;

// Shape of the context value shared across the component tree
interface GuidedModeContextType {
  // The current simulation mode ("guided", "unguided", or null)
  mode: SimulationMode;
  // Convenience boolean — true when mode is "guided", used by components to conditionally render guided UI
  isGuided: boolean;
  // Function to update the mode and persist it to localStorage
  setMode: (mode: SimulationMode) => void;
}

// Create the React context with sensible defaults (null mode, no-op setter).
// These defaults are only used if a component reads the context without a Provider above it.
const GuidedModeContext = createContext<GuidedModeContextType>({
  mode: null, // Default: no mode selected
  isGuided: false, // Default: not in guided mode
  setMode: () => {}, // Default: no-op function (does nothing)
});

// Provider component that wraps the app (or a subtree) to supply guided mode state.
// Accepts children as a prop so it can wrap any React subtree.
export const GuidedModeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Initialize the mode state lazily from localStorage so it persists across page reloads.
  // The initializer function runs only once on first render.
  const [mode, setModeState] = useState<SimulationMode>(() => {
    // Try to read the previously saved simulation mode from localStorage
    const saved = localStorage.getItem("simulationMode");
    // Only accept valid string values to guard against corrupted storage
    if (saved === "guided" || saved === "unguided") return saved;
    // Default to "guided" mode if nothing valid is found in localStorage
    return "guided";
  });

  // Memoized setter that updates both React state and localStorage in sync.
  // useCallback ensures this function reference is stable across re-renders,
  // preventing unnecessary re-renders of child components that depend on it.
  const setMode = useCallback((m: SimulationMode) => {
    // Update the React state to trigger a re-render with the new mode
    setModeState(m);
    // If a valid mode is provided, persist it to localStorage for future sessions
    if (m) {
      localStorage.setItem("simulationMode", m);
    } else {
      // If mode is null (reset), remove the key from localStorage entirely
      localStorage.removeItem("simulationMode");
    }
  }, []); // Empty dependency array: this callback never changes

  // Render the context provider, passing the current mode, the derived isGuided flag,
  // and the setter function as the context value to all descendants.
  return (
    <GuidedModeContext.Provider
      value={{ mode, isGuided: mode === "guided", setMode }}
    >
      {children}
    </GuidedModeContext.Provider>
  );
};

// Custom hook for consuming the guided mode context.
// Components call useGuidedMode() to get { mode, isGuided, setMode }.
export const useGuidedMode = () => useContext(GuidedModeContext);
