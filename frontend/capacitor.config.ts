// Import the CapacitorConfig type from the Capacitor CLI package — provides type-safe configuration and IDE autocompletion
import type { CapacitorConfig } from "@capacitor/cli";

// Define the Capacitor configuration object with the CapacitorConfig type for full type checking
const config: CapacitorConfig = {
  // Unique application identifier in reverse-domain notation — used by Android (package name) and iOS (bundle ID)
  // This must match the applicationId in android/app/build.gradle and the bundle identifier in Xcode
  appId: "fr.simuldivorce.pro",
  // Human-readable application name displayed on the device home screen, app launcher, and in app store listings
  appName: "SimulDivorcePro",
  // Directory containing the built web assets (HTML, JS, CSS) that Capacitor bundles into the native app
  // This corresponds to Vite's default output directory — must match the "build.outDir" in vite.config.ts
  webDir: "dist",
};

// Export the configuration object as the default export — Capacitor CLI reads this at build/sync time
export default config;
