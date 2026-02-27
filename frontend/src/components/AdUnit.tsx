// Import React core library, useEffect hook for side effects, and useRef hook for mutable refs
import React, { useEffect, useRef } from "react";
// Import utility function that checks whether ads should be displayed (premium/native users are ad-free)
import { shouldShowAds } from "../services/subscriptionService";

// Read the Google AdSense client ID from environment variables (set at build time via Vite)
const ADSENSE_CLIENT = import.meta.env.VITE_ADSENSE_CLIENT || "";

// Configuration map defining AdSense format, layout, and inline styles for each ad type variant
const AD_CONFIG = {
  // Banner ad: horizontal format typically used at the top or bottom of pages
  banner: {
    format: "horizontal" as const, // AdSense format string for horizontal banner ads
    style: { display: "block", width: "100%", height: "50px" }, // Full-width banner, fixed 50px height
  },
  // Native ad: fluid format that blends into surrounding content layout
  native: {
    format: "fluid" as const, // AdSense "fluid" format adapts its size to the container automatically
    layoutKey: "-fb+5w+4e-db+86", // AdSense layout key controlling the fluid ad's aspect ratio and shape
    style: { display: "block" }, // Simple block display; dimensions are controlled dynamically by AdSense
  },
  // Rectangle ad: standard IAB 300×250 medium rectangle with auto-format for responsive behavior
  rectangle: {
    format: "auto" as const, // "auto" lets AdSense pick the best format for the available space
    style: {
      display: "block", // Block-level element so it takes its own line
      width: "300px", // Standard IAB medium rectangle width
      height: "250px", // Standard IAB medium rectangle height
      margin: "0 auto", // Center the rectangle horizontally within its parent container
    },
  },
} as const; // "as const" makes the entire object deeply readonly for strict TypeScript type safety

// Module-level flag to ensure the AdSense <script> tag is only injected into the DOM once across all instances
let adsenseLoaded = false;
// Function to dynamically load the Google AdSense JavaScript library into the page <head>
function loadAdSenseScript(): void {
  // If the script has already been loaded, exit early to avoid duplicate <script> tags
  if (adsenseLoaded) return;
  // Mark as loaded immediately to prevent concurrent calls from adding duplicate scripts
  adsenseLoaded = true;
  // Create a new <script> DOM element to load the AdSense library
  const script = document.createElement("script");
  // Set async=true so the script loads without blocking page rendering
  script.async = true;
  // Set the script source to the AdSense JS URL, including the client ID as a query parameter
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;
  // Set crossOrigin to "anonymous" for proper CORS handling of the external third-party script
  script.crossOrigin = "anonymous";
  // Append the script element to the document <head>, triggering the browser to download and execute it
  document.head.appendChild(script);
}

// TypeScript interface defining the props accepted by the AdUnit component
interface AdUnitProps {
  // The type of ad to render: "banner" (horizontal), "native" (fluid), or "rectangle" (300×250)
  type: "banner" | "native" | "rectangle";
  // Optional CSS class name(s) to apply to the outer ad container div for layout/spacing purposes
  className?: string;
}

// AdUnit — a React component that renders a Google AdSense ad slot of the specified type
export const AdUnit: React.FC<AdUnitProps> = ({ type, className = "" }) => {
  // Ref to the <ins> AdSense element, used to verify it's mounted in the DOM before pushing the ad
  const adRef = useRef<HTMLModElement>(null);
  // Ref tracking whether we've already pushed an ad request for this particular instance (prevents double-push)
  const pushed = useRef(false);

  // Check if ads should be displayed — returns false for premium subscribers on the native mobile app
  const showAds = shouldShowAds();

  // Effect hook: load the AdSense script and push the ad slot when the component mounts
  useEffect(() => {
    // If ads are suppressed for this user (e.g., premium subscriber), skip all ad loading logic
    if (!showAds) return;
    // Ensure the AdSense external script is loaded into the page (idempotent — only loads once globally)
    loadAdSenseScript();

    // Delay the ad push by 300ms to give the AdSense script time to initialize after loading
    const timer = setTimeout(() => {
      // Only push if the <ins> element is mounted in the DOM and we haven't already pushed for this instance
      if (adRef.current && !pushed.current) {
        // Mark as pushed immediately to prevent duplicate ad requests on subsequent re-renders
        pushed.current = true;
        try {
          // Push an empty object onto the global adsbygoogle array, telling AdSense to fill this ad slot
          ((window as any).adsbygoogle =
            (window as any).adsbygoogle || []).push({});
        } catch {
          // Silently catch errors — AdSense script may not be ready yet, or an ad blocker may be active
        }
      }
    }, 300); // 300ms delay provides enough time for the AdSense script to finish initializing

    // Cleanup function: clear the pending timeout if the component unmounts before the timer fires
    return () => clearTimeout(timer);
  }, [showAds]); // Re-run this effect only if the showAds value changes (e.g., subscription status update)

  // If ads should not be shown (premium user on native app), render nothing at all
  if (!showAds) return null;

  // Look up the configuration object (format, style, layoutKey) for the requested ad type
  const config = AD_CONFIG[type];

  // Render the ad container and the AdSense <ins> element inside it
  return (
    // Outer wrapper div that accepts optional className for external positioning and layout control
    <div className={className}>
      {/* AdSense <ins> element — the actual ad creative will be rendered inside this element by the AdSense library */}
      <ins
        className="adsbygoogle" /* Required class name that the AdSense library uses to identify ad slots */
        ref={
          adRef
        } /* Attach the ref so we can verify the element is mounted before pushing the ad request */
        style={
          config.style
        } /* Apply the ad-type-specific inline styles (dimensions, display mode) */
        data-ad-client={
          ADSENSE_CLIENT
        } /* AdSense publisher client ID read from environment variables */
        data-ad-format={
          config.format
        } /* Ad format: "horizontal", "fluid", or "auto" depending on type */
        data-full-width-responsive="true" /* Enable responsive full-width behavior on mobile viewports */
        {...(type === "native" && config.format === "fluid"
          ? {
              "data-ad-layout-key": (config as typeof AD_CONFIG.native)
                .layoutKey /* Only set the layout key for native fluid ads (controls aspect ratio) */,
            }
          : {})} /* For non-native ad types, spread an empty object (no additional props needed) */
      />
    </div>
  );
};
