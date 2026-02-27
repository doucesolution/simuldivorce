// Import the useEffect hook from React — used to run side effects (DOM manipulation) after rendering
import { useEffect } from "react";

// Constant: the site name appended to every page title (e.g., "Guide | SimulDivorce")
const SITE_NAME = "SimulDivorce";
// Constant: the production site URL used for canonical URLs and Open Graph meta tags
const SITE_URL = "https://simuldivorce.fr";
// Constant: the default meta description used when no page-specific description is provided
// Describes the tool's purpose: free divorce compensation simulation with 3 calculation methods
const DEFAULT_DESCRIPTION =
  "Simulez gratuitement votre prestation compensatoire. Calculs locaux et confidentiels. Trois méthodes croisées : Calcul PC, Tiers Pondéré, INSEE.";
// Constant: the default Open Graph/Twitter Card image URL (512px SVG icon)
const DEFAULT_IMAGE = `${SITE_URL}/icon-512.svg`;
// Constant: the locale string for Open Graph tags, set to French (France)
const LOCALE = "fr_FR";

// TypeScript interface defining the props accepted by the SEO component
export interface SEOProps {
  /** Page title — will be appended with " | SimulDivorce" to form the full document title */
  title: string;
  /** Meta description (max ~155 chars recommended for search result snippets) */
  description?: string;
  /** Canonical path, e.g. "/guide" — appended to SITE_URL for the canonical URL */
  path?: string;
  /** og:type — defaults to "website"; use "article" for content pages */
  type?: "website" | "article";
  /** Prevent indexing (e.g. for dashboard, export pages that shouldn't appear in search results) */
  noindex?: boolean;
  /** JSON-LD structured data object(s) to inject into a <script type="application/ld+json"> tag */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

/**
 * Helper function to set or create a <meta> tag in the document <head>.
 * If a meta tag with the given attribute and key already exists, updates its content.
 * Otherwise, creates a new meta tag and appends it to <head>.
 * @param attr - The attribute type to match on: "name" (for standard meta) or "property" (for Open Graph)
 * @param key - The attribute value to match, e.g. "description" or "og:title"
 * @param content - The content value to set on the meta tag
 */
function setMeta(attr: "name" | "property", key: string, content: string) {
  // Try to find an existing meta tag with the matching attribute and key
  let el = document.querySelector(
    `meta[${attr}="${key}"]`,
  ) as HTMLMetaElement | null;
  // If no matching meta tag exists, create a new one and append it to <head>
  if (!el) {
    // Create a new <meta> element
    el = document.createElement("meta");
    // Set the identifying attribute (e.g., name="description" or property="og:title")
    el.setAttribute(attr, key);
    // Append the new meta element to the document's <head> section
    document.head.appendChild(el);
  }
  // Set or update the content attribute with the provided value
  el.setAttribute("content", content);
}

/**
 * Helper function to set or create a <link> tag in the document <head>.
 * Currently only handles the "canonical" link rel — ensures only one canonical link exists.
 * @param rel - The link relation type, e.g. "canonical"
 * @param href - The URL to set as the link's href value
 */
function setLink(rel: string, href: string) {
  // Try to find an existing link tag with the matching rel attribute
  let el = document.querySelector(
    `link[rel="${rel}"]`,
  ) as HTMLLinkElement | null;
  // Special handling for canonical links — there should only ever be one
  if (rel === "canonical") {
    // Only one canonical link is allowed per page
    if (!el) {
      // Create a new <link> element if none exists
      el = document.createElement("link");
      // Set the rel attribute to "canonical"
      el.setAttribute("rel", rel);
      // Append the new link element to the document's <head> section
      document.head.appendChild(el);
    }
    // Set or update the href attribute to the provided canonical URL
    el.setAttribute("href", href);
  }
}

// Constant: the DOM id assigned to the JSON-LD <script> tag, used to find and update/remove it
const JSON_LD_ID = "seo-jsonld";

/**
 * Lightweight SEO component — dynamically sets document title, meta description,
 * robots directives, Open Graph tags, Twitter Card tags, canonical URL, and JSON-LD
 * structured data in the document <head>. Works with React 19 and has no external
 * dependencies. Renders nothing (returns null) as it only performs side effects.
 */
export function SEO({
  title, // The page-specific title string
  description = DEFAULT_DESCRIPTION, // Meta description, defaults to the site-wide default
  path = "/", // URL path for canonical and OG URLs, defaults to root
  type = "website", // OG type, defaults to "website"
  noindex = false, // Whether to add noindex/nofollow robots directive, defaults to false
  jsonLd, // Optional JSON-LD structured data to inject
}: SEOProps) {
  // useEffect runs after the component mounts and whenever the dependency values change
  useEffect(() => {
    // Construct the full page title by appending the site name (e.g., "Guide | SimulDivorce")
    const fullTitle = `${title} | ${SITE_NAME}`;
    // Construct the full canonical URL by prepending the site base URL to the path
    const canonicalUrl = `${SITE_URL}${path}`;

    // Set the browser tab/window title to the full title string
    document.title = fullTitle;

    // Set the meta description tag — used by search engines for the page snippet
    setMeta("name", "description", description);
    // Set the robots meta tag — either block indexing or allow it with generous snippet settings
    setMeta(
      "name",
      "robots",
      noindex
        ? "noindex, nofollow" // Block search engine indexing and link following
        : "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1", // Allow indexing with maximum snippet lengths
    );

    // Set the canonical URL link tag — tells search engines the preferred URL for this page
    setLink("canonical", canonicalUrl);

    // === Open Graph meta tags (used by Facebook, LinkedIn, and other social platforms) ===
    // Set the Open Graph title to the full title string
    setMeta("property", "og:title", fullTitle);
    // Set the Open Graph description to the page description
    setMeta("property", "og:description", description);
    // Set the Open Graph URL to the canonical URL
    setMeta("property", "og:url", canonicalUrl);
    // Set the Open Graph content type (website or article)
    setMeta("property", "og:type", type);
    // Set the Open Graph image to the default site icon
    setMeta("property", "og:image", DEFAULT_IMAGE);
    // Set the Open Graph image width (512px to match the SVG icon dimensions)
    setMeta("property", "og:image:width", "512");
    // Set the Open Graph image height (512px square)
    setMeta("property", "og:image:height", "512");
    // Set the Open Graph image alt text for accessibility
    setMeta(
      "property",
      "og:image:alt",
      `${SITE_NAME} — Simulateur de divorce en ligne`,
    );
    // Set the Open Graph site name
    setMeta("property", "og:site_name", SITE_NAME);
    // Set the Open Graph locale to French (France)
    setMeta("property", "og:locale", LOCALE);

    // === Twitter Card meta tags (used by Twitter/X for rich link previews) ===
    // Use "summary" card type (small image + title + description)
    setMeta("name", "twitter:card", "summary");
    // Set the Twitter Card title
    setMeta("name", "twitter:title", fullTitle);
    // Set the Twitter Card description
    setMeta("name", "twitter:description", description);
    // Set the Twitter Card image
    setMeta("name", "twitter:image", DEFAULT_IMAGE);

    // === JSON-LD Structured Data (used by Google and other search engines for rich results) ===
    // Try to find an existing JSON-LD script tag by its ID
    let scriptEl = document.getElementById(
      JSON_LD_ID,
    ) as HTMLScriptElement | null;
    // If jsonLd data was provided, inject or update the script tag
    if (jsonLd) {
      // Create the script element if it doesn't exist yet
      if (!scriptEl) {
        // Create a new <script> element for structured data
        scriptEl = document.createElement("script");
        // Set the ID so we can find and update/remove it later
        scriptEl.id = JSON_LD_ID;
        // Set the MIME type to application/ld+json as required by JSON-LD spec
        scriptEl.type = "application/ld+json";
        // Append the script to the document <head>
        document.head.appendChild(scriptEl);
      }
      // Normalize jsonLd to always be an array for consistent processing
      const payload = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
      // Serialize to JSON — if there's only one schema object, output it directly (not wrapped in an array)
      scriptEl.textContent = JSON.stringify(
        payload.length === 1 ? payload[0] : payload,
      );
    } else if (scriptEl) {
      // If no jsonLd data provided but a script tag exists from a previous render, remove it
      scriptEl.remove();
    }

    // Cleanup function: runs when the component unmounts or before the effect re-runs
    return () => {
      // Remove the JSON-LD script tag on unmount to prevent stale structured data
      const el = document.getElementById(JSON_LD_ID);
      if (el) el.remove();
    };
  }, [title, description, path, type, noindex, jsonLd]); // Re-run whenever any of these SEO props change

  // This component is purely side-effect-based — it renders nothing to the DOM
  return null;
}

// ==========================================
//  PRE-BUILT JSON-LD SCHEMA HELPER FUNCTIONS
// ==========================================

/**
 * Generates a BreadcrumbList JSON-LD structured data object.
 * Used by search engines to display breadcrumb navigation in search results.
 * @param items - Array of breadcrumb items, each with a name and path
 * @returns A JSON-LD object conforming to the Schema.org BreadcrumbList type
 */
export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    // JSON-LD context: always points to the Schema.org vocabulary
    "@context": "https://schema.org",
    // Schema type: BreadcrumbList for navigation breadcrumbs
    "@type": "BreadcrumbList",
    // Map each breadcrumb item to a ListItem with its position, name, and full URL
    itemListElement: items.map((item, index) => ({
      // Each element is a ListItem type in the Schema.org vocabulary
      "@type": "ListItem",
      // 1-based position in the breadcrumb trail
      position: index + 1,
      // Display name for this breadcrumb
      name: item.name,
      // Full URL for this breadcrumb, constructed from the site base URL + path
      item: `${SITE_URL}${item.path}`,
    })),
  };
}

/**
 * Generates a FAQPage JSON-LD structured data object.
 * Used by search engines to display FAQ rich snippets in search results.
 * @param questions - Array of question/answer pairs
 * @returns A JSON-LD object conforming to the Schema.org FAQPage type
 */
export function faqJsonLd(questions: { question: string; answer: string }[]) {
  return {
    // JSON-LD context: Schema.org vocabulary
    "@context": "https://schema.org",
    // Schema type: FAQPage for frequently asked questions
    "@type": "FAQPage",
    // Map each Q&A pair to the Schema.org Question/Answer structure
    mainEntity: questions.map((q) => ({
      // Each entity is a Question type
      "@type": "Question",
      // The question text
      name: q.question,
      // The accepted answer, wrapped in an Answer type object
      acceptedAnswer: {
        // Answer type in Schema.org
        "@type": "Answer",
        // The answer text content
        text: q.answer,
      },
    })),
  };
}

/**
 * Generates a HowTo JSON-LD structured data object.
 * Used by search engines to display step-by-step instructions in search results.
 * @param name - The title of the how-to guide
 * @param description - A brief description of what the guide covers
 * @param steps - Array of step objects, each with a name and descriptive text
 * @returns A JSON-LD object conforming to the Schema.org HowTo type
 */
export function howToJsonLd(
  name: string,
  description: string,
  steps: { name: string; text: string }[],
) {
  return {
    // JSON-LD context: Schema.org vocabulary
    "@context": "https://schema.org",
    // Schema type: HowTo for step-by-step instructional content
    "@type": "HowTo",
    // The title of the how-to guide
    name,
    // A brief description of the guide
    description,
    // Map each step to a HowToStep with its position, name, and text
    step: steps.map((s, i) => ({
      // Each step is a HowToStep type in the Schema.org vocabulary
      "@type": "HowToStep",
      // 1-based position in the step sequence
      position: i + 1,
      // Short name/title for this step
      name: s.name,
      // Detailed text description of what to do in this step
      text: s.text,
    })),
  };
}
