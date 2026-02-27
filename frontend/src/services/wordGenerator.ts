/**
 * Word Document Generator for the Lawyer (Pro) app.
 *
 * Generates a clean, professional .docx with:
 *   - Logo top-left only (no text branding in header)
 *   - Teal accent-banded section headings
 *   - Airy tables with alternating row shading
 *   - Compact layout — minimal white space between blocks
 *   - No footer, no disclaimer
 */

// Import all required building blocks from the "docx" library to construct a Word document programmatically.
// Document: the root container that holds sections, paragraphs, and tables.
// Packer: serialises the Document object into a Blob / Buffer for download.
// Paragraph: a block-level text container (equivalent to a <p> in HTML).
// TextRun: an inline run of styled text within a Paragraph.
// Table, TableRow, TableCell: construct tabular layouts with rows and cells.
// WidthType: enum specifying how widths are measured (percentage, DXA, etc.).
// AlignmentType: paragraph alignment options (LEFT, CENTER, RIGHT, etc.).
// BorderStyle: enum for cell/paragraph border styles (NONE, SINGLE, etc.).
// ImageRun: embeds an image inline within a Paragraph.
// PageBreak: inserts a manual page break in the document flow.
// ShadingType: enum defining cell/paragraph background shading types.
// Footer: defines footer content that repeats on every page.
// PageNumber: special field that renders the current page number.
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  ImageRun,
  PageBreak,
  ShadingType,
  Footer,
  PageNumber,
} from "docx";
// Import the SimulationResult (calculation output) and FinancialData (input finances) types from the legal engine.
import type { SimulationResult, FinancialData } from "./legalEngine";
// Import the default yield rate string — single source of truth
import { DEFAULT_YIELD_RATE_STR } from "./legalEngine";
// Import the LawyerProfile type — holds the lawyer's personal/cabinet info shown in the document header.
import type { LawyerProfile } from "./lawyerProfileStore";
// Import the LawyerCaseData type — holds per-case metadata like evaluation date and yield rate.
import type { LawyerCaseData } from "./lawyerCaseStore";
// Import the DivorceFormData type — holds all form inputs (marriage dates, incomes, children, etc.).
import type { DivorceFormData } from "./divorceFormStore";

// ── Design tokens ────────────────────────────────────────
// These hex colour constants define the visual palette used throughout the
// generated Word document, ensuring a consistent and professional appearance.

// Primary teal accent colour — used for section banners, highlights, and key values.
const TEAL = "0D9488";
// Very light teal — used as background shading for heading bands and highlight boxes.
const TEAL_LIGHT = "CCFBF1"; // very light teal for heading band
// Dark slate colour — used for primary body text and labels throughout the document.
const SLATE = "334155";
// Muted grey — used for secondary/less important text such as contact details and dates.
const MUTED = "64748B";
// White background — used for even-numbered table rows (alternating row shading pattern).
const ROW_EVEN = "FFFFFF";
// Very light grey — used for odd-numbered table rows to create subtle zebra-striping.
const ROW_ODD = "F8FAFC";
// Very light teal-green — used as the background for accent/result rows in tables.
const ACCENT_ROW = "F0FDFA";
// Light grey-blue — used for thin cell borders throughout all tables.
const BORDER_COLOR = "CBD5E1";

// ── Utilities ────────────────────────────────────────────

// Converts a base64-encoded data URL (e.g. from an <input type="file"> or canvas)
// into a raw Uint8Array of bytes, which the docx ImageRun requires for embedding images.
// @param dataUrl — a full data URL string like "data:image/png;base64,iVBOR..."
// @returns Uint8Array of the decoded binary image data
function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  // Extract the base64-encoded payload after the comma separator
  const base64 = dataUrl.split(",")[1];
  // If no base64 portion exists, return an empty byte array (invalid/empty data URL)
  if (!base64) return new Uint8Array(0);
  // Decode the base64 string into a raw binary string using the built-in atob function
  const binary = atob(base64);
  // Allocate a Uint8Array with the same length as the binary string
  const bytes = new Uint8Array(binary.length);
  // Copy each character's char code (0-255) into the byte array
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  // Return the completed byte array ready for embedding in the docx image
  return bytes;
}

// Formats a number as a Euro currency string using French locale conventions.
// Returns "— €" as a placeholder when the value is missing or invalid.
// @param n — the numeric amount (or undefined)
// @returns a formatted string like "12 500 €" or "— €"
function euro(n: number | undefined): string {
  // Guard: return dash placeholder if value is undefined or not a valid number
  if (n === undefined || isNaN(n)) return "— €";
  // Format with French thousands separators (spaces) and append the Euro sign
  return n.toLocaleString("fr-FR") + " €";
}

// Formats an ISO date string (e.g. "2024-03-15") into a long French date
// like "15 mars 2024". Returns "—" if the date is missing or unparseable.
// @param d — an ISO date string or undefined
// @returns a human-readable French date string
function dateFr(d: string | undefined): string {
  // Guard: return dash placeholder if the date string is falsy
  if (!d) return "—";
  try {
    // Use Intl.DateTimeFormat with French locale to produce a long-form date
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric", // Day of the month (e.g. "15")
      month: "long", // Full month name in French (e.g. "mars")
      year: "numeric", // Four-digit year (e.g. "2024")
    }).format(new Date(d)); // Parse the ISO string into a Date object and format it
  } catch {
    // Fallback: if parsing fails, return the raw input string
    return d;
  }
}

// ── Cell / row helpers ───────────────────────────────────
// These helper functions build reusable table fragments (borders, rows, cells)
// that are composed into the final document layout.

// A border definition object that hides the border entirely (invisible).
// Used for layout tables (e.g. the header logo/info table) that should appear borderless.
const NONE_BORDER = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };

// Returns a four-sided border specification where all borders are invisible.
// Applied to table cells that serve as layout containers rather than data cells.
function noBorders() {
  return {
    top: NONE_BORDER,
    bottom: NONE_BORDER,
    left: NONE_BORDER,
    right: NONE_BORDER,
  };
}

// Returns a four-sided thin grey border specification.
// Applied to data table cells for a clean, subtle grid appearance.
function thinBorder() {
  // Define a single thin line using the design-token border colour
  const b = { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR };
  // Apply the same thin border to all four sides of the cell
  return { top: b, bottom: b, left: b, right: b };
}

/** Standard label → value row with optional alternate shading */
// Builds a two-column table row: left cell = descriptive label, right cell = bold value.
// The `odd` flag controls zebra-stripe shading (grey vs white) for visual rhythm.
// @param label — description text shown in the left cell (e.g. "Date du mariage")
// @param value — data text shown in the right cell (e.g. "15 mars 2024")
// @param odd   — when true, applies a light grey background; otherwise white
// @returns a TableRow containing two styled cells
function labelRow(label: string, value: string, odd = false): TableRow {
  // Select background colour based on whether this is an odd or even row
  const bg = odd ? ROW_ODD : ROW_EVEN;
  // Create the table row with two child cells
  return new TableRow({
    children: [
      // LEFT CELL — label column (48% width)
      new TableCell({
        width: { size: 48, type: WidthType.PERCENTAGE }, // Takes 48% of table width
        children: [
          new Paragraph({
            spacing: { before: 50, after: 50 }, // Vertical padding inside the cell
            indent: { left: 120 }, // Small left indent for readability
            children: [
              // Render the label text in regular weight, slate colour, Calibri 11pt
              new TextRun({
                text: label,
                font: "Calibri",
                size: 22,
                color: SLATE,
              }),
            ],
          }),
        ],
        borders: thinBorder(), // Apply subtle grey borders
        shading: { type: ShadingType.CLEAR, fill: bg }, // Apply row shading
      }),
      // RIGHT CELL — value column (52% width)
      new TableCell({
        width: { size: 52, type: WidthType.PERCENTAGE }, // Takes 52% of table width
        children: [
          new Paragraph({
            spacing: { before: 50, after: 50 }, // Same vertical padding for alignment
            indent: { left: 120 }, // Same left indent to match label cell
            children: [
              // Render the value text in bold weight to visually distinguish it from the label
              new TextRun({
                text: value || "", // Fallback to empty string if value is falsy
                font: "Calibri",
                size: 22, // 11pt (docx sizes are in half-points)
                bold: true, // Bold to emphasise the data value
                color: SLATE,
              }),
            ],
          }),
        ],
        borders: thinBorder(), // Apply subtle grey borders
        shading: { type: ShadingType.CLEAR, fill: bg }, // Apply row shading
      }),
    ],
  });
}

/** Accent result row (teal background, bigger font) */
// Builds a prominent two-column row for displaying key calculation results.
// The left cell shows a bold label and the right cell shows the Euro value in teal.
// Uses the ACCENT_ROW (light teal-green) background to make results stand out.
// @param label — descriptive text (e.g. "Prestation Compensatoire")
// @param value — the numeric Euro amount to display
// @returns a styled TableRow highlighting a key financial result
function resultRow(label: string, value: number): TableRow {
  return new TableRow({
    children: [
      // LEFT CELL — result label (58% width, wider to accommodate longer text)
      new TableCell({
        width: { size: 58, type: WidthType.PERCENTAGE }, // 58% of table width for label
        children: [
          new Paragraph({
            spacing: { before: 70, after: 70 }, // More generous vertical padding than data rows
            indent: { left: 120 }, // Left indent for readability
            children: [
              // Bold slate-coloured text for the result description
              new TextRun({
                text: label,
                font: "Calibri",
                size: 22, // 11pt
                bold: true,
                color: SLATE,
              }),
            ],
          }),
        ],
        borders: thinBorder(), // Thin grey borders
        shading: { type: ShadingType.CLEAR, fill: ACCENT_ROW }, // Light teal-green accent background
      }),
      // RIGHT CELL — Euro value (42% width, right-aligned for numeric legibility)
      new TableCell({
        width: { size: 42, type: WidthType.PERCENTAGE }, // 42% width for the amount
        children: [
          new Paragraph({
            alignment: AlignmentType.RIGHT, // Right-align the currency value
            spacing: { before: 70, after: 70 }, // Generous vertical padding
            indent: { right: 120 }, // Right indent to keep value off the cell edge
            children: [
              // Render the formatted Euro amount in bold teal at 12pt — larger than regular text
              // to draw the reader’s eye to the calculated compensatory allowance figure
              new TextRun({
                text: euro(value), // Format the numeric value as "12 500 €"
                font: "Calibri",
                size: 24, // 12pt — slightly larger for emphasis
                bold: true,
                color: TEAL, // Use primary accent colour for financial results
              }),
            ],
          }),
        ],
        borders: thinBorder(), // Thin grey borders
        shading: { type: ShadingType.CLEAR, fill: ACCENT_ROW }, // Light teal-green accent background
      }),
    ],
  });
}

/** Full-width teal band with white text — used as section heading row */
// Creates a paragraph that acts as a coloured section banner spanning the full page width.
// Mimics a table-header feel by applying a solid teal background and white bold text.
// Used to introduce each major section of the document (e.g. "1. MARIAGE ET SITUATION FAMILIALE").
// @param text — the heading text to display (e.g. "1.  MARIAGE ET SITUATION FAMILIALE")
// @returns a Paragraph styled as a teal-background section banner
function sectionBanner(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 240, after: 80 }, // Generous top spacing to separate from previous content; tight below
    shading: { type: ShadingType.CLEAR, fill: TEAL }, // Solid teal background fill
    indent: { left: 100 }, // Small left indent so text doesn’t touch the page edge
    children: [
      // White bold text at 12pt over the teal band for high contrast
      new TextRun({
        text,
        font: "Calibri",
        size: 24, // 12pt
        bold: true,
        color: "FFFFFF", // White text on teal background
      }),
    ],
  });
}

/** Thin horizontal teal line divider */
// Creates a lightweight visual separator between content blocks.
// Renders as a thin bottom border on an otherwise empty paragraph.
// Used between method cards in the results section to provide visual breathing room.
// @returns a Paragraph with only a bottom border (light teal line)
function divider(): Paragraph {
  return new Paragraph({
    spacing: { before: 60, after: 60 }, // Minimal vertical space around the line
    border: {
      // Only a bottom border is set — creates a simple horizontal rule
      bottom: { style: BorderStyle.SINGLE, size: 6, color: TEAL_LIGHT },
    },
  });
}

/** Method card: a self-contained table with coloured header row + data rows */
// Builds a "card" for a specific calculation method (e.g. "A. Méthode du Tiers Pondéré").
// The card is a Table whose first row is a light-teal header with a letter prefix
// and title, followed by one or more data rows passed as the `rows` parameter.
// @param letter — a single letter identifier for the method (e.g. "A", "B", "C")
// @param title  — the descriptive title of the calculation method
// @param rows   — an array of TableRow objects containing the result data
// @returns a Table with a styled header row and the provided data rows
function methodCard(letter: string, title: string, rows: TableRow[]): Table {
  // Build the coloured header row that spans both columns of the card
  const headerRow = new TableRow({
    children: [
      new TableCell({
        columnSpan: 2, // Span across all columns so the header stretches full width
        width: { size: 100, type: WidthType.PERCENTAGE }, // Full width of the table
        children: [
          new Paragraph({
            spacing: { before: 60, after: 60 }, // Compact vertical padding
            indent: { left: 120 }, // Left indent for readability
            children: [
              // The letter prefix in teal bold (e.g. "A.  ")
              new TextRun({
                text: `${letter}.  `,
                font: "Calibri",
                size: 24,
                bold: true,
                color: TEAL,
              }),
              // The method title in slate bold (e.g. "Méthode du Tiers Pondéré")
              new TextRun({
                text: title,
                font: "Calibri",
                size: 24,
                bold: true,
                color: SLATE,
              }),
            ],
          }),
        ],
        // Apply a light teal background to distinguish the header from data rows
        shading: { type: ShadingType.CLEAR, fill: TEAL_LIGHT },
        borders: thinBorder(), // Thin grey borders for consistency
      }),
    ],
  });
  // Return a full-width table composed of the header row followed by the data rows
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...rows], // Header first, then spread the result/data rows
  });
}

// Creates a placeholder/tag paragraph that lawyers can search-and-replace in the final Word document.
// Displays a red bold tag name (e.g. "[COMMENTAIRES_AVOCAT]") followed by an italic muted hint.
// This pattern allows generated documents to contain editable insertion points.
// @param tagName — the tag identifier shown in red brackets (e.g. "COMMENTAIRES_AVOCAT")
// @param hint    — instructional text explaining what the lawyer should type there
// @returns a Paragraph with the tag and hint styled inline
function tagParagraph(tagName: string, hint: string): Paragraph {
  return new Paragraph({
    spacing: { before: 80, after: 80 }, // Moderate vertical spacing
    children: [
      // Red bold tag identifier — easy to spot and search for in the Word editor
      new TextRun({
        text: `[${tagName}] `,
        font: "Calibri",
        size: 22, // 11pt
        bold: true,
        color: "DC2626", // Red colour to make placeholder tags visually obvious
      }),
      // Muted italic hint text explaining what the lawyer should enter
      new TextRun({
        text: hint,
        font: "Calibri",
        size: 22, // 11pt
        italics: true,
        color: MUTED, // Grey colour for de-emphasised instructional text
      }),
    ],
  });
}

/** Tiny spacer — keeps things tight */
// Creates an empty paragraph whose sole purpose is to add vertical whitespace.
// Defaults to 120 half-points (~60pt) of space above; callers can override.
// @param pts — the spacing-before value in half-points (default 120)
// @returns an empty Paragraph acting as a vertical spacer
function gap(pts = 120): Paragraph {
  return new Paragraph({ spacing: { before: pts } });
}

/** Build a table from rows array */
// Convenience wrapper that creates a full-width Table from an array of TableRow objects.
// Simplifies repetitive table creation throughout the generator.
// @param rows — the array of TableRow children
// @returns a full-width Table containing the given rows
function makeTable(rows: TableRow[]): Table {
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows });
}

// ── Main Generator ──────────────────────────────────────

// Public interface defining all the data required to generate the Word document.
// Consumers pass this object to `generateLawyerDocx` with the complete case context.
export interface WordGeneratorInput {
  formData: DivorceFormData; // All divorce form inputs (dates, incomes, children, etc.)
  financialData: FinancialData; // Structured financial data derived from form inputs
  results: SimulationResult; // Calculated simulation results (three methods + average)
  caseData: LawyerCaseData; // Per-case metadata (evaluation date, yield rate, etc.)
  profile: LawyerProfile; // Lawyer’s professional profile (name, cabinet, logo, etc.)
}

// Main entry point: generates a professional Word (.docx) document as a Blob.
// The document contains the lawyer’s header, case parameters, marital/financial data,
// calculation results from three methods, and editable observation sections.
// @param input — a WordGeneratorInput object containing all case and profile data
// @returns a Promise<Blob> that resolves to the binary .docx file content
export async function generateLawyerDocx(
  input: WordGeneratorInput,
): Promise<Blob> {
  // Destructure the input to extract each data category for convenient access
  const { formData, results, caseData, profile } = input;

  // Format the evaluation date for display in the document parameters section
  const dateStr = dateFr(caseData.evaluationDate);
  // Get the marriage duration (years) from calculation results, defaulting to 0
  const marriageDur = results.marriageDurationUsed || 0;
  // Accumulator array for all document body elements (paragraphs, tables, etc.)
  // This will be passed as the `children` of the single document section.
  const children: (Paragraph | Table)[] = [];

  // ── HEADER: Logo left + Cabinet info center ──
  // The document header is built as a borderless three-column layout table:
  //   Left (20%)  = Lawyer’s logo image
  //   Center (60%) = Cabinet name, lawyer name, address, contact, bar number
  //   Right (20%)  = Empty spacer cell for visual balance
  const headerCells: TableCell[] = []; // Accumulator for the three header cells

  // ---- Left cell — logo ----
  // Array to hold the logo paragraph(s); will contain one image or a blank paragraph
  const logoChildren: Paragraph[] = [];
  // Check if the lawyer profile includes a base64-encoded logo image
  if (profile.logoDataUrl) {
    try {
      // Convert the data URL to raw bytes that the docx ImageRun can embed
      const imgData = dataUrlToUint8Array(profile.logoDataUrl);
      // Only embed the image if the byte array is non-empty (valid image data)
      if (imgData.length > 0) {
        // Create a paragraph containing the logo image, left-aligned
        logoChildren.push(
          new Paragraph({
            alignment: AlignmentType.LEFT, // Align logo to the left edge
            spacing: { after: 0 }, // No spacing after the image paragraph
            children: [
              // Embed the logo as a 70×70 pixel PNG image within the paragraph
              new ImageRun({
                data: imgData, // Raw image bytes
                transformation: { width: 70, height: 70 }, // Scale to 70×70px
                type: "png", // Image format hint
              }),
            ],
          }),
        );
      }
    } catch {
      /* skip — silently ignore logo decoding errors so document still generates */
    }
  }
  // Fallback: if no logo was loaded, push an empty paragraph to fill the cell
  if (logoChildren.length === 0) {
    logoChildren.push(new Paragraph({ spacing: { after: 0 } }));
  }

  // Add the left cell (logo) to the header row with 20% width and no visible borders
  headerCells.push(
    new TableCell({
      width: { size: 20, type: WidthType.PERCENTAGE }, // 20% of page width for logo
      verticalAlign: "center" as unknown as undefined, // Vertically centre the logo (type workaround)
      children: logoChildren, // Logo image or empty paragraph
      borders: noBorders(), // No visible borders for layout table
    }),
  );

  // ---- Center cell — cabinet info ----
  // Array to hold the lawyer’s professional information paragraphs
  const infoLines: Paragraph[] = [];
  // Add cabinet (firm) name if provided — largest, bold text
  if (profile.cabinetName) {
    infoLines.push(
      new Paragraph({
        alignment: AlignmentType.CENTER, // Centre-align all info lines
        spacing: { after: 20 }, // Tight spacing between info lines
        children: [
          // Cabinet name in bold 12pt slate colour
          new TextRun({
            text: profile.cabinetName,
            font: "Calibri",
            size: 24,
            bold: true,
            color: SLATE,
          }),
        ],
      }),
    );
  }
  // Add the lawyer’s full name if provided — regular weight, slightly smaller
  if (profile.fullName) {
    infoLines.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 20 },
        children: [
          // Lawyer’s name in regular 10pt slate colour
          new TextRun({
            text: profile.fullName,
            font: "Calibri",
            size: 20,
            color: SLATE,
          }),
        ],
      }),
    );
  }
  // Add address information (street + city) if either is provided
  if (profile.cabinetAddress || profile.cabinetCity) {
    // Join non-empty address parts with a comma separator
    const addr = [profile.cabinetAddress, profile.cabinetCity]
      .filter(Boolean)
      .join(", ");
    infoLines.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 20 },
        children: [
          // Address in muted 9pt text — secondary information
          new TextRun({ text: addr, font: "Calibri", size: 18, color: MUTED }),
        ],
      }),
    );
  }
  // Build contact info line from phone and email, joining with a bullet separator
  const contactParts = [profile.phone, profile.email].filter(Boolean);
  if (contactParts.length) {
    infoLines.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 20 },
        children: [
          // Phone and/or email separated by a bullet ("  •  ") in muted 9pt text
          new TextRun({
            text: contactParts.join("  •  "),
            font: "Calibri",
            size: 18,
            color: MUTED,
          }),
        ],
      }),
    );
  }
  // Add the bar registration number if available — smallest, italic text
  if (profile.barNumber) {
    infoLines.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 0 }, // No extra spacing after the last info line
        children: [
          // Bar number in italic muted 8pt text with "N°" prefix
          new TextRun({
            text: `N° ${profile.barNumber}`,
            font: "Calibri",
            size: 16,
            italics: true,
            color: MUTED,
          }),
        ],
      }),
    );
  }
  // Fallback: if no profile info was available, push an empty paragraph
  if (infoLines.length === 0) {
    infoLines.push(new Paragraph({ spacing: { after: 0 } }));
  }

  // Add the center cell (cabinet info) to the header row with 60% width
  headerCells.push(
    new TableCell({
      width: { size: 60, type: WidthType.PERCENTAGE }, // 60% of page width for cabinet info
      verticalAlign: "center" as unknown as undefined, // Vertically centre the info block
      children: infoLines, // Array of info paragraphs
      borders: noBorders(), // No visible borders
    }),
  );

  // ---- Right cell — empty spacer for balance ----
  // A 20% empty cell on the right to mirror the logo cell and centre the info block
  headerCells.push(
    new TableCell({
      width: { size: 20, type: WidthType.PERCENTAGE }, // 20% spacer
      children: [new Paragraph({ spacing: { after: 0 } })], // Empty paragraph as placeholder
      borders: noBorders(), // No visible borders
    }),
  );

  // Assemble the three header cells into a single-row borderless layout table
  // and push it as the first element in the document body
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE }, // Full page width
      borders: noBorders(), // No table-level borders
      rows: [new TableRow({ children: headerCells })], // Single row containing all three cells
    }),
  );

  // Thin teal separator under header — a horizontal line that visually separates
  // the lawyer’s header block from the document body
  children.push(
    new Paragraph({
      spacing: { before: 60, after: 100 }, // Small gap above, larger gap below
      border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: TEAL } }, // Bold teal bottom border
    }),
  );

  // ── TITLE ──
  // Main document title centred on the page in large bold teal text.
  // "GUIDE PC" refers to "Guide Prestation Compensatoire" (Compensatory Allowance Guide).
  // "RECUEIL DES DONNÉES" means "Data Collection" in French.
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER, // Centre the title on the page
      spacing: { before: 60, after: 180 }, // Tight top, generous bottom for visual weight
      children: [
        new TextRun({
          text: "GUIDE PC — RECUEIL DES DONNÉES", // Document title in French
          font: "Calibri",
          size: 38, // 19pt — the largest text in the document
          bold: true,
          color: TEAL, // Primary accent colour for the title
        }),
      ],
    }),
  );

  // ── PARAMÈTRES (Parameters) ──
  // A summary table at the top of the document showing key evaluation parameters.
  // Includes the evaluation date, yield rate, and placeholder rows for debtor/creditor names.
  children.push(
    makeTable([
      // Row 1: Evaluation date formatted in French long date format
      labelRow("Date de l'évaluation", dateStr, false),
      // Row 2: Annual yield rate used for present-value calculations (default DEFAULT_YIELD_RATE)
      labelRow(
        "Taux de rendement annuel",
        `${caseData.yieldRate || DEFAULT_YIELD_RATE_STR} %`,
        true,
      ),
      // Row 3: Debtor’s name — left blank for the lawyer to fill in manually
      labelRow("Nom et prénom du débiteur", "", false),
      // Row 4: Creditor’s name — left blank for the lawyer to fill in manually
      labelRow("Nom et prénom du créancier", "", true),
    ]),
  );

  // ── 1. MARIAGE ET SITUATION FAMILIALE (Marriage and Family Situation) ──
  // Section 1 presents the core marital data: dates, duration, and children.
  children.push(sectionBanner("1.  MARIAGE ET SITUATION FAMILIALE"));
  children.push(
    makeTable([
      // Marriage date formatted in French long date
      labelRow("Date du mariage", dateFr(formData.marriageDate), false),
      // Separation/divorce date formatted in French long date
      labelRow("Date de la séparation", dateFr(formData.divorceDate), true),
      // Duration of the marriage in years (calculated by the legal engine)
      labelRow("Durée du mariage", `${marriageDur} ans`, false),
      // Number of children from the marriage
      labelRow("Nombre d'enfants", `${formData.childrenCount || 0}`, true),
      // Ages of each child, comma-separated; or dash if no children
      labelRow(
        "Âge des enfants",
        formData.childrenAges && formData.childrenAges.length > 0
          ? formData.childrenAges.map((a: number) => `${a} ans`).join(", ")
          : "—",
        false,
      ),
    ]),
  );

  // ── 2. SITUATION DU DÉBITEUR (Debtor’s Financial Situation) ──
  // Section 2 details the paying spouse’s current and projected financial position.
  children.push(sectionBanner("2.  SITUATION DU DÉBITEUR"));
  // Determine whether the debtor’s income was entered as annual or monthly
  const dMode =
    formData.debtorIncomeMode === "annual" ? "(annuel)" : "(mensuel)";
  children.push(
    makeTable([
      // Current gross income of the debtor, annotated with income mode (annual/monthly)
      labelRow(
        `Revenus actuels ${dMode} avant impôts`,
        euro(parseFloat(formData.debtorGrossIncome) || 0),
        false,
      ),
      // Monthly contribution the debtor pays towards children’s expenses
      labelRow(
        "Contribution mensuelle enfants",
        euro(parseFloat(formData.debtorChildContribution) || 0),
        true,
      ),
      // Projected future monthly income (if circumstances are expected to change)
      labelRow(
        "Revenu mensuel prévisible",
        formData.debtorFutureIncome
          ? euro(parseFloat(formData.debtorFutureIncome))
          : "—",
        false,
      ),
      // Projected future monthly child contribution after the expected change
      labelRow(
        "Contribution prévisible enfants",
        formData.debtorFutureChildContribution
          ? euro(parseFloat(formData.debtorFutureChildContribution))
          : "—",
        true,
      ),
      // Date when the projected financial changes are expected to occur
      labelRow(
        "Date prévisible des modifications",
        formData.debtorChangeDate ? dateFr(formData.debtorChangeDate) : "—",
        false,
      ),
      // Value of the debtor’s non-income-producing assets (e.g. primary residence)
      labelRow(
        "Patrimoine non producteur de revenus",
        euro(parseFloat(formData.debtorPropertyValue) || 0),
        true,
      ),
    ]),
  );

  // ── 3. SITUATION DU CRÉANCIER (Creditor’s Financial Situation) ──
  // Section 3 details the receiving spouse’s current and projected financial position.
  // Includes additional fields for retirement gap years and pre-retirement income.
  children.push(sectionBanner("3.  SITUATION DU CRÉANCIER"));
  // Determine whether the creditor’s income was entered as annual or monthly
  const cMode =
    formData.creditorIncomeMode === "annual" ? "(annuel)" : "(mensuel)";
  children.push(
    makeTable([
      // Current gross income of the creditor, annotated with income mode
      labelRow(
        `Revenus actuels ${cMode} avant impôts`,
        euro(parseFloat(formData.creditorGrossIncome) || 0),
        false,
      ),
      // Monthly contribution the creditor receives/pays towards children’s expenses
      labelRow(
        "Contribution mensuelle enfants",
        euro(parseFloat(formData.creditorChildContribution) || 0),
        true,
      ),
      // Projected future monthly income for the creditor
      labelRow(
        "Revenu mensuel prévisible",
        formData.creditorFutureIncome
          ? euro(parseFloat(formData.creditorFutureIncome))
          : "—",
        false,
      ),
      // Projected future monthly child contribution for the creditor
      labelRow(
        "Contribution prévisible enfants",
        formData.creditorFutureChildContribution
          ? euro(parseFloat(formData.creditorFutureChildContribution))
          : "—",
        true,
      ),
      // Date when the creditor’s projected financial changes are expected
      labelRow(
        "Date prévisible des modifications",
        formData.creditorChangeDate ? dateFr(formData.creditorChangeDate) : "—",
        false,
      ),
      // Value of the creditor’s non-income-producing assets
      labelRow(
        "Patrimoine non producteur de revenus",
        euro(parseFloat(formData.creditorPropertyValue) || 0),
        true,
      ),
      // Number of years the creditor went without pension contributions
      // (e.g. career break to raise children — relevant for compensatory allowance)
      labelRow(
        "Années sans cotisations retraite",
        formData.creditorRetirementGapYears
          ? `${formData.creditorRetirementGapYears} ans`
          : "—",
        false,
      ),
      // Income the creditor earned before stopping work (pre-retirement or career break)
      labelRow(
        "Revenu avant cessation d'activité",
        formData.creditorPreRetirementIncome
          ? euro(parseFloat(formData.creditorPreRetirementIncome))
          : "—",
        true,
      ),
    ]),
  );

  // ── PAGE 2 — RÉSULTATS (Calculation Results) ──
  // Insert a page break so the results always start on a fresh page
  children.push(new Paragraph({ children: [new PageBreak()] }));

  // ── 4. RÉSULTATS DES CALCULS (Calculation Results) ──
  // Section 4 presents the compensatory allowance estimated by three distinct methods,
  // followed by their average. Each method is displayed in a styled "card" table.
  children.push(sectionBanner("4.  RÉSULTATS DES CALCULS"));

  // ---- A — Tiers Pondéré (Weighted Third Method) ----
  // This is a common French legal method that calculates the compensatory allowance
  // based on a weighted third of the income disparity multiplied by marriage duration.
  children.push(gap(160)); // Extra spacing before the first card
  children.push(
    methodCard("A", "Méthode du Tiers Pondéré", [
      // Display the calculated compensatory allowance for the Weighted Third method
      resultRow("Prestation Compensatoire", results.details.pilote.value),
    ]),
  );

  // Visual divider between method cards
  children.push(divider());

  // ---- B — INSEE (Consumption Units Method) ----
  // The INSEE method uses French national statistics consumption unit scales
  // to evaluate the standard-of-living disparity between spouses.
  children.push(
    methodCard("B", "Méthode INSEE (Unités de Consommation)", [
      // Display the calculated compensatory allowance for the INSEE method
      resultRow("Prestation Compensatoire", results.details.insee.value),
    ]),
  );

  // Visual divider between method cards
  children.push(divider());

  // ---- C — Calcul PC (Axel Depondt Method) ----
  // A more detailed method that also computes monthly instalment options
  // and the debtor’s maximum savings capacity for paying the allowance.
  children.push(
    methodCard("C", "Méthode Calcul PC", [
      // Main compensatory allowance figure
      resultRow("Prestation Compensatoire", results.details.axelDepondt.value),
      // Monthly instalment if the allowance is spread over 8 years (96 months)
      labelRow(
        "Mensualité sur 8 ans",
        euro(results.details.axelDepondt.monthlyOver8Years),
        true,
      ),
      // Maximum lump sum the debtor could realistically save/pay
      labelRow(
        "Capacité d'épargne max débiteur",
        euro(results.details.axelDepondt.debtorMaxSavingsCapital),
        false,
      ),
    ]),
  );

  // ---- D — Moyenne (Average of the Three Methods) ----
  // This is the most prominent element in the results section: a highlighted box
  // showing the average compensatory allowance across all three calculation methods.
  // Retrieve the average from the top-level simulation result
  const avg = results.compensatoryAllowance;
  // Extra vertical spacing to set the average box apart from the method cards
  children.push(gap(260));
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE }, // Full-width table
      rows: [
        // Header row with solid teal background and white text
        new TableRow({
          children: [
            new TableCell({
              width: { size: 100, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  spacing: { before: 40, after: 20 },
                  indent: { left: 120 },
                  children: [
                    // "D." prefix in white bold — matching the method card letter pattern
                    new TextRun({
                      text: "D.  ",
                      font: "Calibri",
                      size: 24,
                      bold: true,
                      color: "FFFFFF",
                    }),
                    // "Moyenne des trois méthodes" = "Average of the three methods" in white bold
                    new TextRun({
                      text: "Moyenne des trois méthodes",
                      font: "Calibri",
                      size: 24,
                      bold: true,
                      color: "FFFFFF",
                    }),
                  ],
                }),
              ],
              // Solid teal background for the header cell
              shading: { type: ShadingType.CLEAR, fill: TEAL },
              borders: thinBorder(),
            }),
          ],
        }),
        // Value row with the average amount — large centred text on light teal background
        new TableRow({
          children: [
            new TableCell({
              width: { size: 100, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER, // Centre the amount for maximum visual impact
                  spacing: { before: 120, after: 120 }, // Generous vertical padding for prominence
                  children: [
                    // The average estimated amount displayed in large bold teal text (17pt)
                    // "Montant moyen estimé" = "Estimated average amount" in French
                    new TextRun({
                      text: `Montant moyen estimé : ${euro(avg)}`,
                      font: "Calibri",
                      size: 34, // 17pt — very large for the key takeaway figure
                      bold: true,
                      color: TEAL, // Primary accent colour to draw attention
                    }),
                  ],
                }),
              ],
              // Light teal background for the value row to create a highlighted "box" effect
              shading: { type: ShadingType.CLEAR, fill: TEAL_LIGHT },
              borders: thinBorder(),
            }),
          ],
        }),
      ],
    }),
  );

  // ── 5. OBSERVATIONS (Lawyer’s Notes Section) ──
  // This section provides editable placeholder fields for the lawyer to add
  // personalised commentary and a proposed compensatory allowance amount
  // when they open the generated Word document in their word processor.
  children.push(gap(360)); // Large gap to clearly separate from results
  children.push(sectionBanner("5.  OBSERVATIONS")); // Teal section heading
  children.push(gap(120)); // Small gap after the banner
  // Placeholder tag for the lawyer to add their professional observations
  children.push(
    tagParagraph(
      "COMMENTAIRES_AVOCAT",
      "Ajoutez ici vos observations en éditant ce document Word.",
    ),
  );

  // Subheading prompting the lawyer to enter their proposed compensatory amount
  children.push(
    new Paragraph({
      spacing: { before: 260, after: 100 }, // Space above to separate from comments tag
      children: [
        // Bold label: "Proposition de prestation compensatoire :" = "Proposed compensatory allowance:"
        new TextRun({
          text: "Proposition de prestation compensatoire :",
          font: "Calibri",
          size: 22, // 11pt
          bold: true,
          color: SLATE,
        }),
      ],
    }),
  );
  // Placeholder tag for the lawyer to enter their specific monetary proposal
  children.push(
    tagParagraph(
      "PROPOSITION_MONTANT",
      "Indiquez ici votre proposition monétaire.",
    ),
  );

  // ---- Signature block ----
  // Adds the document creation date and the lawyer’s name (or a placeholder tag)
  // at the bottom of the observations section, serving as a digital signature area.
  children.push(gap(300)); // Large gap before signature for visual separation
  // "Fait le" = "Done on" followed by today’s date in French locale format
  children.push(
    new Paragraph({
      spacing: { after: 40 }, // Small gap between date and name
      children: [
        new TextRun({
          text: `Fait le ${new Date().toLocaleDateString("fr-FR")}`, // Current date in dd/mm/yyyy French format
          font: "Calibri",
          size: 22, // 11pt
          color: MUTED, // Muted grey for the date line
        }),
      ],
    }),
  );
  // Lawyer’s full name in bold, or a red placeholder tag if name is not in profile
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: profile.fullName || "[SIGNATURE_AVOCAT]", // Fallback placeholder tag
          font: "Calibri",
          size: 24, // 12pt
          bold: true,
          color: SLATE, // Dark slate for the signature name
        }),
      ],
    }),
  );

  // ── Build document ──
  // Assemble the final Document object using the docx library.
  // The Document is the root container that holds metadata and one or more sections.
  const doc = new Document({
    creator: "SimulDivorce Pro", // Author metadata embedded in the .docx file
    title: "Guide PC — Recueil des Données", // Document title metadata
    description: "Recueil des données - Prestation Compensatoire", // Document description metadata
    sections: [
      {
        // Page layout properties — defines margins for a compact, professional look
        properties: {
          page: {
            margin: {
              top: 800, // Top margin in twentieths of a point (~1.4 cm)
              bottom: 700, // Bottom margin (~1.2 cm)
              left: 900, // Left margin (~1.6 cm)
              right: 900, // Right margin (~1.6 cm)
            },
          },
        },
        // Footer definition — displays the current page number on every page
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT, // Page number right-aligned
                children: [
                  new TextRun({
                    children: [PageNumber.CURRENT], // Dynamic page number field
                    font: "Calibri",
                    size: 18, // 9pt — small and unobtrusive
                    color: MUTED, // Muted grey for the page number
                  }),
                ],
              }),
            ],
          }),
        },
        // All accumulated document body elements (paragraphs, tables, page breaks)
        children,
      },
    ],
  });

  // Serialise the Document object into a Blob containing valid .docx binary data.
  // The Packer handles ZIP compression and XML generation per the OOXML standard.
  // The returned Blob can be downloaded directly by the browser.
  return Packer.toBlob(doc);
}
