// Import React core and hooks: useState for reactive offline state, useEffect for attaching browser events
import React, { useState, useEffect } from "react";
// Import the WifiOff icon from lucide-react to visually indicate no network connection
import { WifiOff } from "lucide-react";

// OfflineIndicator — a functional component that renders a banner when the user loses network connectivity
const OfflineIndicator: React.FC = () => {
  // Initialize isOffline state from the browser's navigator.onLine property (true if currently offline)
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // useEffect to register and clean up browser online/offline event listeners on mount
  useEffect(() => {
    // Callback that sets offline state to true when the browser fires the "offline" event
    const goOffline = () => setIsOffline(true);
    // Callback that sets offline state to false when the browser fires the "online" event
    const goOnline = () => setIsOffline(false);
    // Attach the "offline" event listener to the window to detect network loss
    window.addEventListener("offline", goOffline);
    // Attach the "online" event listener to the window to detect network restoration
    window.addEventListener("online", goOnline);
    // Cleanup function: remove both event listeners when the component unmounts to prevent memory leaks
    return () => {
      // Remove the "offline" event listener
      window.removeEventListener("offline", goOffline);
      // Remove the "online" event listener
      window.removeEventListener("online", goOnline);
    };
  }, []); // Empty dependency array ensures this effect runs only once on mount

  // If the user is currently online, render nothing — the banner is only shown when offline
  if (!isOffline) return null;

  // Render the offline notification banner fixed to the top of the viewport
  return (
    // Outer container: fixed positioning at the top, full width, very high z-index so it overlays everything
    <div
      className="fixed top-0 left-0 right-0 z-[10000] flex justify-center"
      style={{
        top: "env(safe-area-inset-top, 0px)",
      }} /* Respect iOS safe area inset for notched devices */
    >
      {/* Inner pill-shaped banner: amber background, rounded bottom corners, flex layout for icon + text */}
      <div
        className="bg-amber-600 px-4 py-1.5 rounded-b-xl flex items-center gap-2 shadow-lg text-xs font-medium"
        style={{
          color: "#ffffff",
        }} /* Force white text color regardless of theme */
      >
        {/* WifiOff icon indicating no network connection, sized to match the small text */}
        <WifiOff className="w-3.5 h-3.5" />
        {/* French message telling the user they are offline but local data remains accessible */}
        <span>Hors ligne — les données locales restent accessibles</span>
      </div>
    </div>
  );
};

// Default export so the component can be imported by other modules (e.g., App.tsx)
export default OfflineIndicator;
