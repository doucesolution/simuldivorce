import React, { useEffect, useRef } from "react";

const ADSENSE_CLIENT = "ca-pub-7006921289927676";

// Map ad types to their format and layout for AdSense
const AD_CONFIG = {
  banner: {
    format: "horizontal" as const,
    style: { display: "block", width: "100%", height: "50px" },
  },
  native: {
    format: "fluid" as const,
    layoutKey: "-fb+5w+4e-db+86",
    style: { display: "block" },
  },
  rectangle: {
    format: "auto" as const,
    style: {
      display: "block",
      width: "300px",
      height: "250px",
      margin: "0 auto",
    },
  },
} as const;

// Ensure AdSense script is loaded only once
let adsenseLoaded = false;
function loadAdSenseScript(): void {
  if (adsenseLoaded) return;
  adsenseLoaded = true;
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;
  script.crossOrigin = "anonymous";
  document.head.appendChild(script);
}

interface AdUnitProps {
  type: "banner" | "native" | "rectangle";
  className?: string;
}

export const AdUnit: React.FC<AdUnitProps> = ({ type, className = "" }) => {
  const adRef = useRef<HTMLModElement>(null);
  const pushed = useRef(false);

  useEffect(() => {
    loadAdSenseScript();

    // Push the ad slot after the script has had a chance to load
    const timer = setTimeout(() => {
      if (adRef.current && !pushed.current) {
        pushed.current = true;
        try {
          ((window as any).adsbygoogle =
            (window as any).adsbygoogle || []).push({});
        } catch {
          // AdSense not ready yet or ad blocked
        }
      }
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  const config = AD_CONFIG[type];

  return (
    <div className={className}>
      <ins
        className="adsbygoogle"
        ref={adRef}
        style={config.style}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-format={config.format}
        data-full-width-responsive="true"
        {...(type === "native" && config.format === "fluid"
          ? {
              "data-ad-layout-key": (config as typeof AD_CONFIG.native)
                .layoutKey,
            }
          : {})}
      />
    </div>
  );
};
