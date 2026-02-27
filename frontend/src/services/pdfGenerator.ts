// Import the jsPDF type for TypeScript type-checking of the PDF document instance
import type { jsPDF as JsPDFType } from "jspdf";
// Import TypeScript interfaces: SimulationResult holds computed divorce outputs, FinancialData holds user inputs
import type { SimulationResult, FinancialData } from "./legalEngine";
// Import helper to retrieve which calculation methods the user selected in the form
import { getCalculationChoices } from "./divorceFormStore";

// ── Design Standards ─────────────────────────────────────
// Primary dark slate color — used for headings, section titles, main text, and the header bar background
const COLOR_PRIMARY = "#0F172A"; // Slate 900
// Teal accent color — used for highlights, underlines, average values, and the subtitle text
const COLOR_ACCENT = "#14B8A6"; // Teal 500
// Muted gray color — used for secondary/descriptive text, data labels, and bullet-point detail lines
const COLOR_MUTED = "#64748B"; // Slate 500

// Export the pdfGenerator object which contains the main PDF report generation method
export const pdfGenerator = {
  // Main async method that builds and downloads a professional PDF divorce simulation report
  // @param data - FinancialData: all user-entered financial info (incomes, ages, marriage dates, children, etc.)
  // @param results - SimulationResult: all computed values (compensatory allowance by each method, details, etc.)
  // @returns Promise<void> — triggers a browser file download of the generated PDF
  generateReport: async (
    data: FinancialData,
    results: SimulationResult,
  ): Promise<void> => {
    // Dynamically import jsPDF to enable code-splitting — the library is only loaded when generating a PDF
    const { jsPDF } = await import("jspdf");
    // Create a new jsPDF document instance configured for A4 portrait format in millimeters
    const doc: JsPDFType = new jsPDF({
      orientation: "portrait", // Portrait layout (taller than wide) — standard for legal/financial documents
      unit: "mm", // All positions and sizes are specified in millimeters
      format: "a4", // Standard A4 paper size (210mm × 297mm)
    });
    // Store the page width (210mm for A4) for computing right-aligned element positions
    const pageWidth = doc.internal.pageSize.getWidth();
    // Store the page height (297mm for A4) for footer placement and page-break calculations
    const pageHeight = doc.internal.pageSize.getHeight();

    // Generate a unique random hex session hash (e.g., "#A3F2B1") to identify this particular PDF report
    const sessionHash = `#${Math.floor(Math.random() * 16777215)
      .toString(16) // Convert the random integer to a hexadecimal string
      .toUpperCase()}`; // Uppercase for readability in the PDF header
    // Format the current date and time in French locale for display in the PDF header
    const dateStr = new Date().toLocaleString("fr-FR", {
      year: "numeric", // Full year, e.g., "2026"
      month: "long", // Full month name in French, e.g., "février"
      day: "numeric", // Day of the month, e.g., "27"
      hour: "2-digit", // Two-digit hour, e.g., "14"
      minute: "2-digit", // Two-digit minute, e.g., "35"
    });

    // ── Helpers ──────────────────────────────────────────────
    // Draws a repeating diagonal "DOCUMENT NON OFFICIEL" (Unofficial Document) watermark across the page.
    // This is important to clearly indicate the document is NOT an official court ruling or legal decision.
    const drawWatermark = () => {
      // Save the current graphics state so we can safely apply and then revert the opacity change
      doc.saveGraphicsState();
      // Set global opacity to 12% so watermark text is subtle and doesn't obscure the actual content
      // @ts-expect-error - jsPDF GState for opacity (the GState constructor is not fully typed in jsPDF definitions)
      doc.setGState(new doc.GState({ opacity: 0.12 }));
      // Use bold Helvetica for the watermark to be readable even at low opacity
      doc.setFont("helvetica", "bold");
      // Large 28pt font so the watermark is visible diagonally across the page
      doc.setFontSize(28);
      // Use the dark primary color for the watermark text
      doc.setTextColor(COLOR_PRIMARY);
      // The watermark text warns readers this is not an official legal document
      const text = "DOCUMENT NON OFFICIEL";
      // Spacing between each watermark repetition (60mm apart vertically and 120mm horizontally)
      const spacing = 60;
      // Nested loops tile the watermark across the entire page (with overflow to cover edges)
      for (let row = -pageHeight; row < pageHeight * 2; row += spacing) {
        for (let col = -pageWidth; col < pageWidth * 2; col += spacing * 2) {
          // Draw each watermark instance rotated 45 degrees for the classic diagonal pattern
          doc.text(text, col, row, { angle: 45 });
        }
      }
      // Restore the original graphics state, removing the opacity change for subsequent drawing
      doc.restoreGraphicsState();
    };

    // Draws the branded header bar at the top of each page with the app name, session ID, and date
    const drawHeader = () => {
      // Fill a dark slate rectangle spanning the full page width, 22mm tall, as the header background
      doc.setFillColor(COLOR_PRIMARY);
      doc.rect(0, 0, pageWidth, 22, "F"); // "F" = fill mode (no border)
      // Set bold white text for the application brand name
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16); // Large font for the brand name
      doc.setTextColor(255, 255, 255); // White text on dark background
      // Draw "SimulDivorce" brand name on the left side of the header
      doc.text("SimulDivorce", 20, 14);
      // Switch to smaller normal font for the subtitle below the brand name
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      // Use the teal accent color to differentiate the subtitle from the brand name
      doc.setTextColor(COLOR_ACCENT);
      // Draw subtitle "SIMULATION DU DIVORCE" (Divorce Simulation) below the brand
      doc.text("SIMULATION DU DIVORCE", 20, 19);
      // Set small white text for metadata elements on the right side
      doc.setFontSize(7);
      doc.setTextColor(255, 255, 255); // White text for session ID
      // Display the unique session hash ID right-aligned at the top of the header
      doc.text(`ID: ${sessionHash}`, pageWidth - 20, 10, { align: "right" });
      // Display the formatted French date and time right-aligned below the session ID
      doc.text(dateStr, pageWidth - 20, 14, { align: "right" });
      // Switch to light gray for the privacy notice text
      doc.setTextColor(156, 163, 175); // Gray 400 — subtle but readable on dark background
      // Inform the user that all calculations were performed locally (client-side privacy notice)
      doc.text("Calculs réalisés localement", pageWidth - 20, 19, {
        align: "right",
      });
    };

    // Draws a numbered section title (e.g., "1. DONNÉES SAISIES") with a teal underline
    // @param num - The section number as a string (auto-incremented by nextSection())
    // @param title - The section title text (will be uppercased automatically)
    // @param topY - The vertical position in mm from the top of the page
    // @returns The new Y position below the title for subsequent content (topY + 10mm)
    const drawSectionTitle = (num: string, title: string, topY: number) => {
      // Set bold primary-colored font for the main section heading
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13); // Prominent 13pt font for section headings
      doc.setTextColor(COLOR_PRIMARY);
      // Draw the numbered, uppercased title (e.g., "1. DONNÉES SAISIES")
      doc.text(`${num}. ${title.toUpperCase()}`, 20, topY);
      // Draw a teal accent underline below the section title for visual separation
      doc.setDrawColor(COLOR_ACCENT);
      doc.setLineWidth(0.5); // Thin 0.5mm underline
      // Horizontal line from left margin (20mm) to right margin (pageWidth - 20mm)
      doc.line(20, topY + 2, pageWidth - 20, topY + 2);
      // Return the Y position 10mm below the title for content that follows
      return topY + 10;
    };

    // Draws a lettered sub-section title (e.g., "A. Disparité des Revenus") — used inside main sections
    // @param letter - The sub-section letter (e.g., "A", "B") or empty string for unnumbered subtitles
    // @param title - The subtitle text
    // @param topY - The vertical position in mm from the top of the page
    // @returns The new Y position below the subtitle (topY + 7mm)
    const drawSubTitle = (letter: string, title: string, topY: number) => {
      // Set bold primary-colored font, slightly smaller than main section titles
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11); // 11pt for sub-section headings
      doc.setTextColor(COLOR_PRIMARY);
      // Draw the lettered subtitle (e.g., "A. Disparité des Revenus")
      doc.text(`${letter}. ${title}`, 25, topY);
      // Return the Y position 7mm below for content that follows
      return topY + 7;
    };

    // Draws muted (gray) body text — used for data labels, bullet-point details, and descriptions
    // @param txt - The text string to display
    // @param x - Horizontal position in mm from the left edge of the page
    // @param topY - Vertical position in mm from the top of the page
    // @param size - Font size in points (default: 9pt)
    // @returns The new Y position below the text (topY + 4.5mm line spacing)
    const textMuted = (txt: string, x: number, topY: number, size = 9) => {
      // Set normal-weight Helvetica in the muted gray color for secondary information
      doc.setFont("helvetica", "normal");
      doc.setFontSize(size);
      doc.setTextColor(COLOR_MUTED);
      // Draw the muted text at the specified (x, topY) position
      doc.text(txt, x, topY);
      // Return Y + 4.5mm to advance the vertical cursor for the next line
      return topY + 4.5;
    };

    // Draws bold primary-colored text — used for sub-headings within data sections
    // @param txt - The text string to display
    // @param x - Horizontal position in mm
    // @param topY - Vertical position in mm
    // @param size - Font size in points (default: 10pt)
    // @returns The new Y position below the text (topY + 5mm line spacing)
    const textBold = (txt: string, x: number, topY: number, size = 10) => {
      // Set bold Helvetica in the primary dark color for emphasized labels/sub-headings
      doc.setFont("helvetica", "bold");
      doc.setFontSize(size);
      doc.setTextColor(COLOR_PRIMARY);
      // Draw the bold text at the specified (x, topY) position
      doc.text(txt, x, topY);
      // Return Y + 5mm to advance the vertical cursor
      return topY + 5;
    };

    // Creates a new page with watermark and header pre-drawn, ready for content
    // @returns The starting Y position (30mm) below the header for new content
    const newPage = () => {
      // Add a fresh blank page to the PDF document
      doc.addPage();
      // Apply the diagonal "DOCUMENT NON OFFICIEL" watermark to the new page
      drawWatermark();
      // Draw the branded header bar with app name, session ID, and date
      drawHeader();
      // Return 30mm as the content start position (22mm header + 8mm padding)
      return 30;
    };

    // Checks if enough vertical space remains on the current page for upcoming content.
    // If not, creates a new page. This prevents content from overflowing into the footer/disclaimer area.
    // @param currentY - The current vertical cursor position in mm
    // @param needed - Minimum vertical space required in mm (default: 10mm)
    // @returns The Y position to continue drawing (same page or new page start)
    /** Saute de page si y dépasse la marge basse (20mm du bas) */
    const checkPageBreak = (currentY: number, needed = 10): number => {
      // If the current Y plus needed space would exceed the bottom margin (20mm from page bottom)
      if (currentY + needed > pageHeight - 20) {
        // Create a new page and return its starting Y position
        return newPage();
      }
      // Otherwise, continue at the current Y position on the same page
      return currentY;
    };

    // Determine the French display label for the custody arrangement type used in the simulation
    // "classic" → "Classique" (standard), "alternating" → "Alternée" (50-50 shared), otherwise → "Réduite" (reduced)
    const custodyLabel =
      results.custodyTypeUsed === "classic"
        ? "Classique" // Standard custody: children primarily with one parent
        : results.custodyTypeUsed === "alternating"
          ? "Alternée" // Alternating/shared custody: equal time with both parents
          : "Réduite"; // Reduced custody: limited time with one parent

    // Determine if the user ("me"/creditor) is the beneficiary of compensatory allowance
    // The beneficiary is always the spouse with the LOWER income (they receive compensation)
    const beneficiaryIsMe = data.myIncome < data.spouseIncome;

    // ── Calculation Choices ──────────────────────────────────
    // Retrieve the user's selected calculation methods from the form store
    const choices = getCalculationChoices();
    // Check if the user explicitly selected specific calculations (vs. using all defaults)
    const hasChoices = choices.selectedCalcs.length > 0;
    // Determine if compensatory allowance ("prestation compensatoire") should be included in the report
    // It's included by default when no specific choices were made, or if explicitly selected
    const hasPC =
      !hasChoices || choices.selectedCalcs.includes("prestationCompensatoire");

    // Get the specific PC calculation methods the user selected
    // Default to all three methods if none were explicitly chosen
    const pcMethods = choices.selectedMethods.prestationCompensatoire || [
      "axelDepondt", // Axel-Depondt formula — uses gross income and property data
      "pilote", // Weighted Third (Tiers Pondéré) method — uses net income disparity
      "insee", // INSEE consumption units method — uses household composition
    ];
    // Boolean flags controlling which PC methods appear in the report
    const showPilote = hasPC && pcMethods.includes("pilote"); // Show the Weighted Third method
    const showInsee = hasPC && pcMethods.includes("insee"); // Show the INSEE method
    const showAxelDepondt = hasPC && pcMethods.includes("axelDepondt"); // Show the Axel-Depondt method

    // Derived flags that control which input data sections appear in the "Entered Data" page
    // Each calculation method requires different types of input data
    const needsNetIncome = showPilote || showInsee; // Net monthly income is needed by Pilote and INSEE methods
    const needsFamilyData = showInsee; // Children count/ages/custody is only needed by the INSEE method
    const needsGrossIncome = showAxelDepondt; // Gross income and property data is only needed by Axel-Depondt

    // Build an array of active (selected) PC values to compute a dynamic weighted average
    const activePCValues: number[] = [];
    // Push each selected method's computed value into the array
    if (showAxelDepondt) activePCValues.push(results.details.axelDepondt.value);
    if (showPilote) activePCValues.push(results.details.pilote.value);
    if (showInsee) activePCValues.push(results.details.insee.value);
    // Calculate the average of all selected PC methods; fall back to the global pre-computed value if none
    const pcMainValue =
      activePCValues.length > 0
        ? Math.round(
            // Sum all active values and divide by count for the arithmetic mean
            activePCValues.reduce((a, b) => a + b, 0) / activePCValues.length,
          )
        : results.compensatoryAllowance; // Fallback to the pre-computed global compensatory allowance

    // Dynamic section numbering — sections are numbered 1, 2, 3... as they are drawn
    let sectionNum = 0;
    // Helper that auto-increments and returns the next section number as a string
    const nextSection = () => String(++sectionNum);

    // ══════════════════════════════════════════════════════════
    // PAGE 1 — USER-ENTERED DATA (DONNÉES SAISIES PAR L'UTILISATEUR)
    // This page displays all the financial and personal data entered by the user
    // ══════════════════════════════════════════════════════════
    // Draw the diagonal "unofficial document" watermark pattern on the first page
    drawWatermark();
    // Draw the branded header bar (SimulDivorce name, session ID, date) on the first page
    drawHeader();
    // Initialize the vertical cursor at 30mm below the top (just under the 22mm header + padding)
    let y = 30;

    // Draw the first section title: "Données Saisies" (Entered Data) with auto-incremented section number
    y = drawSectionTitle(nextSection(), "Données Saisies", y);

    // Define horizontal positions for the two-column layout on this page
    const leftX = 25; // Left column starts at 25mm from the left page edge
    const rightX = pageWidth / 2 + 10; // Right column starts 10mm past the horizontal center

    // ── Left Column: Personal Situation ──
    // Draw the "Personal Situation" sub-heading in bold on the left column
    y = textBold("Situation Personnelle", leftX, y);
    // Track left column Y position separately so both columns can grow independently
    let col1Y = y;
    // Display the creditor's (user's) age in years
    col1Y = textMuted(`• Âge du créancier : ${data.myAge} ans`, leftX, col1Y);
    // Display the debtor's (spouse's) age in years
    col1Y = textMuted(
      `• Âge du débiteur : ${data.spouseAge} ans`,
      leftX,
      col1Y,
    );
    // Get the marriage duration: prefer the computed value from results, fall back to user input, then 0
    const marriageDur =
      results.marriageDurationUsed || data.marriageDuration || 0;
    // Display the duration of the marriage in years
    col1Y = textMuted(`• Durée du mariage : ${marriageDur} ans`, leftX, col1Y);
    // Conditionally display the marriage date if the user provided it
    if (data.marriageDate) {
      col1Y = textMuted(
        `• Date de mariage : ${data.marriageDate}`,
        leftX,
        col1Y,
      );
    }
    // Conditionally display the divorce or separation date if provided
    if (data.divorceDate) {
      col1Y = textMuted(
        `• Date de divorce / séparation : ${data.divorceDate}`,
        leftX,
        col1Y,
      );
    }
    // Display family data (children count and custody type) only when needed by the INSEE method
    if (needsFamilyData) {
      // Display the number of children
      col1Y = textMuted(
        `• Nombre d'enfants : ${data.childrenCount}`,
        leftX,
        col1Y,
      );
      // Display the custody arrangement type only if there are children
      if (data.childrenCount > 0) {
        col1Y = textMuted(`• Type de garde : ${custodyLabel}`, leftX, col1Y);
      }
    }

    // ── Right Column: Net Income & Monthly Charges ──
    // Track right column Y position independently from the left column
    let col2Y = y;
    // Display net income data only if needed by the selected calculation methods (Pilote or INSEE)
    if (needsNetIncome) {
      // Draw the "Income & Monthly Charges" sub-heading on the right column
      col2Y = textBold("Revenus & Charges Mensuelles", rightX, col2Y);
      // Display the creditor's monthly net income formatted with French locale (thousands separator)
      col2Y = textMuted(
        `• Revenu net (créancier) : ${data.myIncome.toLocaleString()} €`,
        rightX,
        col2Y,
      );
      // Display the debtor's monthly net income formatted with French locale
      col2Y = textMuted(
        `• Revenu net (débiteur) : ${data.spouseIncome.toLocaleString()} €`,
        rightX,
        col2Y,
      );
    }

    // Advance Y to whichever column is taller, plus 8mm spacing, to avoid content overlap
    y = Math.max(col1Y, col2Y) + 8;

    // ── Gross Income Section (for Axel-Depondt / Calcul PC method) ──
    // This section is only shown when the Axel-Depondt method is selected (requires gross income data)
    if (needsGrossIncome) {
      // Check if there's enough space (30mm) remaining on the page; add a new page if needed
      y = checkPageBreak(y, 30);
      // Draw the sub-heading: "Revenus Bruts (Calcul PC)" (Gross Income for PC Calculation)
      y = textBold("Revenus Bruts (Calcul PC)", leftX, y);
      // Determine the period label based on how the debtor entered their income (annually or monthly)
      const dGrossLabel =
        data.debtorIncomeMode === "annual" ? "/ an" : "/ mois";
      // Determine the period label for the creditor's income entry mode
      const cGrossLabel =
        data.creditorIncomeMode === "annual" ? "/ an" : "/ mois";
      // Display the debtor's gross income with the appropriate period label (per year or per month)
      y = textMuted(
        `• Revenu brut débiteur : ${(data.debtorGrossIncome || 0).toLocaleString()} € ${dGrossLabel}`,
        leftX,
        y,
      );
      // Display the creditor's gross income with the appropriate period label
      y = textMuted(
        `• Revenu brut créancier : ${(data.creditorGrossIncome || 0).toLocaleString()} € ${cGrossLabel}`,
        leftX,
        y,
      );
      // Conditionally display the debtor's property value and yield percentage if provided
      if (data.debtorPropertyValue) {
        y = textMuted(
          `• Patrimoine débiteur : ${data.debtorPropertyValue.toLocaleString()} € (rendement ${data.debtorPropertyYield || 0}%)`,
          leftX,
          y,
        );
      }
      // Conditionally display the creditor's property value and yield percentage if provided
      if (data.creditorPropertyValue) {
        y = textMuted(
          `• Patrimoine créancier : ${data.creditorPropertyValue.toLocaleString()} € (rendement ${data.creditorPropertyYield || 0}%)`,
          leftX,
          y,
        );
      }
      // Add 4mm vertical spacing after the gross income section
      y += 4;
    }

    // ══════════════════════════════════════════════════════════
    // COMPENSATORY ALLOWANCE SECTION (Prestation Compensatoire)
    // Displays detailed numerical results for each selected PC calculation method
    // on a dedicated page with a summary box and per-method breakdowns
    // ══════════════════════════════════════════════════════════
    // Determine the payer's monthly income (the spouse with higher income pays the allowance)
    const payerIncome = beneficiaryIsMe ? data.spouseIncome : data.myIncome;
    // Determine the beneficiary's monthly income (the spouse with lower income receives)
    const beneficiaryIncome = beneficiaryIsMe
      ? data.myIncome
      : data.spouseIncome;
    // Get the beneficiary's age for display in the method details
    const beneficiaryAge = beneficiaryIsMe ? data.myAge : data.spouseAge;
    // Get the children's ages array (used by the INSEE method), defaulting to empty array if not provided
    const ages = data.childrenAges || [];

    // Only render the PC section if compensatory allowance calculations were selected
    if (hasPC) {
      // Start a new page dedicated to the compensatory allowance results
      y = newPage();
      // Draw the section title: "Prestation Compensatoire" with auto-numbered section
      y = drawSectionTitle(nextSection(), "Prestation Compensatoire", y);

      // Build an array of method entries to display based on which methods are active
      // Each entry contains a display label and the calculation detail (value, min, max)
      const pcMethodEntries: {
        label: string;
        detail: { value: number; min: number; max: number };
      }[] = [];
      // Add the Pilote (Weighted Third) method entry if selected
      if (showPilote)
        pcMethodEntries.push({
          label: "Méthode du Tiers", // "Weighted Third Method"
          detail: results.details.pilote,
        });
      // Add the INSEE consumption units method entry if selected
      if (showInsee)
        pcMethodEntries.push({
          label: "Méthode INSEE", // "INSEE Method"
          detail: results.details.insee,
        });
      // Add the Axel-Depondt (Calcul PC) method entry if selected
      if (showAxelDepondt)
        pcMethodEntries.push({
          label: "Méthode Calcul PC", // "PC Calculation Method"
          detail: results.details.axelDepondt,
        });

      // Calculate the dynamic height of the summary box: 13mm per method row + 16mm for padding/average
      const boxHeight = pcMethodEntries.length * 13 + 16; // 13 per entry + padding + average line
      // Draw a light blue-gray rounded rectangle as the background for the results summary box
      doc.setFillColor(241, 245, 249); // Slate 100 — very light background
      // Draw the rounded rectangle with 3mm corner radius, centered horizontally with 20mm margins
      doc.roundedRect(20, y, pageWidth - 40, boxHeight, 3, 3, "F");

      // X position inside the box (30mm = 20mm page margin + 10mm box padding)
      const boxX = 30;
      // Y position inside the box (8mm below the box top edge)
      let bY = y + 8;

      // Iterate through each selected PC method and draw its results row inside the summary box
      pcMethodEntries.forEach((entry) => {
        // Draw the method name label in bold on the left side of the box
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(COLOR_PRIMARY);
        doc.text(entry.label, boxX, bY);
        // Draw the computed value right-aligned on the same row (e.g., "45 000 €")
        doc.text(
          `${entry.detail.value.toLocaleString()} €`,
          pageWidth - 30,
          bY,
          { align: "right" },
        );
        // Move down 5mm for the min/max range line
        bY += 5;
        // Draw the min and max range in smaller muted text below the main value
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(COLOR_MUTED);
        // Show the minimum and maximum values separated by an em dash
        doc.text(
          `Min: ${entry.detail.min.toLocaleString()} €   —   Max: ${entry.detail.max.toLocaleString()} €`,
          boxX,
          bY,
        );
        // Move down 8mm to the next method entry row
        bY += 8;
      });

      // Draw the average line only if multiple methods are selected (single method doesn't need averaging)
      if (pcMethodEntries.length > 1) {
        // Use bold teal accent color to make the average stand out from individual methods
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(COLOR_ACCENT);
        // Draw "Moyenne Estimée" (Estimated Average) label on the left
        doc.text("Moyenne Estimée", boxX, bY);
        // Draw the computed average value right-aligned
        doc.text(`${pcMainValue.toLocaleString()} €`, pageWidth - 30, bY, {
          align: "right",
        });
      }

      // Move the Y cursor below the summary box with 8mm spacing
      y += boxHeight + 8;

      // Draw a subtitle for the detailed per-method breakdown section
      // "Details of information related to the calculations"
      y = drawSubTitle("", "Détails des informations relatives aux calculs", y);

      // ── Pilote (Weighted Third) Method — Detailed Breakdown ──
      if (showPilote) {
        // Draw the method name as a bold sub-heading
        y = textBold("Méthode du Tiers Pondéré", 25, y, 9);
        // Display who the beneficiary is (the spouse with the lower income)
        y = textMuted(
          `Bénéficiaire : ${beneficiaryIsMe ? "Créancier" : "Débiteur"} (revenu le plus faible)`,
          30,
          y,
        );
        // Display the payer's monthly income used in the calculation
        y = textMuted(
          `Revenu du payeur : ${payerIncome.toLocaleString()} € / mois`,
          30,
          y,
        );
        // Display the beneficiary's monthly income used in the calculation
        y = textMuted(
          `Revenu du bénéficiaire : ${beneficiaryIncome.toLocaleString()} € / mois`,
          30,
          y,
        );
        // Display the marriage duration factor used in the weighted third formula
        y = textMuted(`Durée du mariage : ${marriageDur} ans`, 30, y);
        // Display the beneficiary's age factor used in the formula
        y = textMuted(`Âge du bénéficiaire : ${beneficiaryAge} ans`, 30, y);
        // Add 5mm vertical spacing after this method's details
        y += 5;
      }

      // ── INSEE (Consumption Units) Method — Detailed Breakdown ──
      if (showInsee) {
        // Check for page break — need at least 30mm for this section's content
        y = checkPageBreak(y, 30);
        // Draw the method name: "Méthode INSEE (Unités de Consommation)" (INSEE Consumption Units Method)
        y = textBold("Méthode INSEE (Unités de Consommation)", 25, y, 9);
        // Display the total household income (sum of both spouses' monthly incomes)
        y = textMuted(
          `Revenus totaux du ménage : ${(data.myIncome + data.spouseIncome).toLocaleString()} € / mois`,
          30,
          y,
        );
        // Display the number of children considered in the consumption unit calculation
        y = textMuted(`Nombre d'enfants : ${data.childrenCount}`, 30, y);
        // If there are children and their ages are available, display each child's age
        if (data.childrenCount > 0 && ages.length > 0) {
          // Format ages as "E1: X ans, E2: Y ans, ..." (sliced to actual child count)
          const agesStr = ages
            .slice(0, data.childrenCount)
            .map((a, i) => `E${i + 1}: ${a} ans`)
            .join(", ");
          // Display the formatted children ages string
          y = textMuted(`Âges des enfants : ${agesStr}`, 30, y);
        }
        // Display the custody type which affects the consumption unit weights
        y = textMuted(`Type de garde : ${custodyLabel}`, 30, y);
        // Display the beneficiary's monthly income for reference
        y = textMuted(
          `Revenu du bénéficiaire : ${beneficiaryIncome.toLocaleString()} € / mois`,
          30,
          y,
        );
        // Add 5mm vertical spacing after this method's details
        y += 5;
      }

      // ── Axel-Depondt (Calcul PC) Method — Detailed Breakdown ──
      if (showAxelDepondt) {
        // Check for page break — need at least 20mm for this section's content
        y = checkPageBreak(y, 20);
        // Draw the method name: "Méthode Calcul PC" (PC Calculation Method)
        y = textBold("Méthode Calcul PC", 25, y, 9);
        // Display the computed lump-sum capital with ±10% margin indication
        y = textMuted(
          `Capital : ${results.details.axelDepondt.value.toLocaleString()} € (±10%)`,
          30,
          y,
        );
        // Display the equivalent monthly payment if spread over 8 years (96 months)
        y = textMuted(
          `Mensuel sur 8 ans : ${results.details.axelDepondt.monthlyOver8Years.toLocaleString()} € / mois`,
          30,
          y,
        );
        // Display the debtor's maximum savings/capital capacity (affordability indicator)
        y = textMuted(
          `Capacité d'épargne max débiteur : ${results.details.axelDepondt.debtorMaxSavingsCapital.toLocaleString()} €`,
          30,
          y,
        );
      }
    } // end hasPC — end of compensatory allowance section

    // ══════════════════════════════════════════════════════════
    // CHARTS SECTION (GRAPHIQUES)
    // Visual analysis page with income disparity bar and PC method comparison chart
    // Only rendered if the selected methods produce data suitable for visualization
    // ══════════════════════════════════════════════════════════
    // Flag: show the revenue disparity chart only when net income data is available
    const showRevenueChart = needsNetIncome;
    // Flag: show the PC comparison bar chart only when PC is selected and has computed values
    const showPCChart = hasPC && activePCValues.length > 0;

    // Only create the charts page if at least one chart should be displayed
    if (showRevenueChart || showPCChart) {
      // Start a new page dedicated to graphical analysis
      y = newPage();
      // Draw the section title: "Analyses Graphiques" (Graphical Analysis)
      y = drawSectionTitle(nextSection(), "Analyses Graphiques", y);
      // Initialize the sub-section letter counter starting at "A"
      let chartLetter = "A";
      // Helper function that returns the current letter and advances to the next (A→B→C...)
      const nextChartLetter = () => {
        const letter = chartLetter;
        // Advance to the next letter by incrementing the character code
        chartLetter = String.fromCharCode(chartLetter.charCodeAt(0) + 1);
        return letter;
      };

      // ── Chart A: Revenue Disparity — Horizontal Stacked Bar ──
      // Shows the income split between creditor and debtor as a proportional bar
      if (showRevenueChart) {
        // Draw the sub-section title for the revenue disparity visualization
        y = drawSubTitle(nextChartLetter(), "Disparité des Revenus", y);

        // Calculate the total combined income and each spouse's proportional share (0 to 1)
        const totalIncome = data.myIncome + data.spouseIncome;
        const myShare = totalIncome > 0 ? data.myIncome / totalIncome : 0; // Creditor's income ratio
        const spouseShare =
          totalIncome > 0 ? data.spouseIncome / totalIncome : 0; // Debtor's income ratio
        // Define the dimensions and position of the horizontal bar chart
        const barWidth = 140; // Total bar width in mm (fits within page margins)
        const barHeight = 14; // Bar height in mm
        const startX = 35; // Left edge of the bar (35mm from page edge)

        // Draw the creditor's portion of the stacked bar in teal color
        doc.setFillColor(20, 184, 166); // Teal 500 — creditor color
        doc.rect(startX, y, barWidth * myShare, barHeight, "F"); // Width proportional to creditor's share
        // Draw the debtor's portion of the stacked bar in gray, starting where creditor's ends
        doc.setFillColor(148, 163, 184); // Slate 400 — debtor color
        doc.rect(
          startX + barWidth * myShare, // Start where the creditor's segment ends
          y,
          barWidth * spouseShare, // Width proportional to debtor's share
          barHeight,
          "F",
        );

        // Draw percentage labels inside each bar segment
        doc.setFontSize(8);
        doc.setTextColor(255, 255, 255); // White text on the colored bar segments
        // Only show the creditor's percentage label if their share is >= 10% (avoids overlapping text)
        if (myShare > 0.1) {
          doc.text(
            `${Math.round(myShare * 100)}%`, // Rounded percentage (e.g., "63%")
            startX + (barWidth * myShare) / 2, // Centered horizontally within the creditor's segment
            y + 9, // Vertically centered within the 14mm bar height
            { align: "center" },
          );
        }
        // Only show the debtor's percentage label if their share is >= 10%
        if (spouseShare > 0.1) {
          doc.text(
            `${Math.round(spouseShare * 100)}%`, // Rounded percentage (e.g., "37%")
            startX + barWidth * myShare + (barWidth * spouseShare) / 2, // Centered within debtor segment
            y + 9, // Vertically centered within the bar
            { align: "center" },
          );
        }

        // ── Bar Chart Legend ──
        // Move below the bar with 6mm spacing for the legend
        y += barHeight + 6;
        doc.setFontSize(8);
        // Creditor legend: teal color indicator square + label with income amount
        doc.setFillColor(20, 184, 166); // Teal square matching the creditor's bar
        doc.rect(startX, y, 4, 4, "F"); // Small 4x4mm color indicator square
        doc.setTextColor(COLOR_MUTED);
        // Label: "Créancier (X €)" showing the creditor's actual income amount
        doc.text(
          `Créancier (${data.myIncome.toLocaleString()} €)`,
          startX + 6, // 6mm to the right of the color square
          y + 3, // Vertically aligned with the center of the square
        );
        // Debtor legend: gray color indicator square + label with income amount
        doc.setFillColor(148, 163, 184); // Slate 400 square matching the debtor's bar
        doc.rect(startX + 80, y, 4, 4, "F"); // Positioned 80mm to the right of the first legend item
        // Label: "Débiteur (X €)" showing the debtor's actual income amount
        doc.text(
          `Débiteur (${data.spouseIncome.toLocaleString()} €)`,
          startX + 86, // 6mm to the right of the debtor's color square
          y + 3, // Vertically aligned
        );

        // Add 18mm vertical spacing after the revenue disparity chart and legend
        y += 18;
      } // end showRevenueChart

      // ── Chart B: Compensatory Allowance Method Comparison — Vertical Bar Chart ──
      // Each selected method contributes 3 bars (min, value, max) with distinct color families
      if (showPCChart) {
        // Check for page break — need at least 80mm for the full bar chart with labels
        y = checkPageBreak(y, 80);
        // Draw the sub-section title: "Comparaison Prestation Compensatoire" (PC Comparison)
        y = drawSubTitle(
          nextChartLetter(),
          "Comparaison Prestation Compensatoire",
          y,
        );

        // Build the array of bar chart items: each method contributes 3 bars (min, value, max)
        // Each item has a display label, numeric value, and RGB color array
        const pcItems: { label: string; value: number; color: number[] }[] = [];
        // Add Pilote (Weighted Third) method bars in a teal color gradient if selected
        if (showPilote) {
          pcItems.push(
            {
              label: "Tiers Min", // "Third Min" — minimum estimate
              value: results.details.pilote.min,
              color: [20, 184, 166], // Teal 500 — lightest teal
            },
            {
              label: "Tiers", // "Third" — main/median estimate
              value: results.details.pilote.value,
              color: [13, 148, 136], // Teal 600 — medium teal
            },
            {
              label: "Tiers Max", // "Third Max" — maximum estimate
              value: results.details.pilote.max,
              color: [15, 118, 110], // Teal 700 — darkest teal
            },
          );
        }
        // Add INSEE method bars in an indigo/blue color gradient if selected
        if (showInsee) {
          pcItems.push(
            {
              label: "INSEE Min", // INSEE minimum estimate
              value: results.details.insee.min,
              color: [99, 102, 241], // Indigo 400 — lightest indigo
            },
            {
              label: "INSEE", // INSEE main/median estimate
              value: results.details.insee.value,
              color: [79, 70, 229], // Indigo 500 — medium indigo
            },
            {
              label: "INSEE Max", // INSEE maximum estimate
              value: results.details.insee.max,
              color: [67, 56, 202], // Indigo 600 — darkest indigo
            },
          );
        }
        // Add Axel-Depondt (Calcul PC) method bars in a purple color gradient if selected
        if (showAxelDepondt) {
          pcItems.push(
            {
              label: "Cal. PC Min", // "PC Calc Min" — minimum estimate
              value: results.details.axelDepondt.min,
              color: [168, 85, 247], // Purple 400 — lightest purple
            },
            {
              label: "Cal. PC", // "PC Calc" — main/median estimate
              value: results.details.axelDepondt.value,
              color: [147, 51, 234], // Purple 500 — medium purple
            },
            {
              label: "Cal. PC Max", // "PC Calc Max" — maximum estimate
              value: results.details.axelDepondt.max,
              color: [126, 34, 206], // Purple 600 — darkest purple
            },
          );
        }

        // Find the maximum value among all bars to normalize bar heights proportionally
        const maxPC = Math.max(...pcItems.map((i) => i.value)) || 1; // Default to 1 to avoid division by zero
        // Maximum bar height in mm (the tallest bar will be exactly this height)
        const pcBarH = 50;
        // Column width adapts based on number of bars: wider for fewer items, narrower for more
        const pcColW = pcItems.length <= 6 ? 22 : 18;
        // Gap between columns adapts similarly
        const pcGap = pcItems.length <= 6 ? 8 : 4;
        // Calculate the total chart width including all columns and gaps
        const pcTotalW = pcItems.length * pcColW + (pcItems.length - 1) * pcGap;
        // Calculate the starting X to center the entire chart horizontally on the page
        let currentX = (pageWidth - pcTotalW) / 2;

        // Draw each vertical bar in the chart
        pcItems.forEach((item) => {
          // Calculate bar height proportional to the maximum value (tallest bar = pcBarH)
          const h = (item.value / maxPC) * pcBarH;
          // Calculate the top Y so all bars are bottom-aligned (baseline at y + pcBarH)
          const topY = y + (pcBarH - h);

          // Draw the filled rectangle bar using the item's specific RGB color
          doc.setFillColor(item.color[0], item.color[1], item.color[2]);
          doc.rect(currentX, topY, pcColW, h, "F");

          // Draw the formatted value label above the bar top
          doc.setFont("helvetica", "bold");
          doc.setFontSize(6); // Small font to fit above narrow bar columns
          doc.setTextColor(COLOR_PRIMARY);
          doc.text(
            `${item.value.toLocaleString()}€`, // Value with euro sign (e.g., "45 000€")
            currentX + pcColW / 2, // Centered horizontally above the bar
            topY - 2, // 2mm above the bar top
            { align: "center" },
          );

          // Draw the category label centered below the bar
          doc.setFont("helvetica", "normal");
          doc.setFontSize(6); // Small font for category labels
          doc.setTextColor(COLOR_MUTED);
          doc.text(item.label, currentX + pcColW / 2, y + pcBarH + 4, {
            align: "center", // Center the label under the bar column
          });

          // Advance the X cursor to the next bar column position
          currentX += pcColW + pcGap;
        });

        // Draw a dashed horizontal average line across the chart if multiple methods are active
        // This visually indicates where the computed average falls relative to individual method bars
        if (activePCValues.length > 1) {
          // Calculate the Y position of the average line proportional to the chart scale
          const avgLineY = y + pcBarH - (pcMainValue / maxPC) * pcBarH;
          // Set red color for the average line to make it visually distinct from the bars
          doc.setDrawColor(239, 68, 68); // Red 500
          doc.setLineWidth(0.4); // Thin 0.4mm line
          // Set a dashed line pattern: 2mm dash followed by 2mm gap
          doc.setLineDashPattern([2, 2], 0);
          // Draw the horizontal dashed line spanning the full chart width with 5mm margins on each side
          doc.line(
            (pageWidth - pcTotalW) / 2 - 5, // 5mm before the first bar
            avgLineY,
            (pageWidth + pcTotalW) / 2 + 5, // 5mm after the last bar
            avgLineY,
          );
          // Reset the dash pattern to solid for subsequent drawing operations
          doc.setLineDashPattern([], 0);
          // Draw the average value label above the dashed line
          doc.setFontSize(8);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(239, 68, 68); // Red 500 — matching the dashed line color
          doc.text(
            `Moyenne: ${pcMainValue.toLocaleString()} €`, // "Average: X €"
            pageWidth / 2, // Centered horizontally on the page
            avgLineY - 3, // 3mm above the dashed line
            { align: "center" },
          );
        }
      } // end showPCChart — end of PC comparison bar chart
    } // end graphs section — end of the charts page

    // ── GLOBAL: Legal Disclaimer + Footer on ALL pages ──
    // After all content pages are created, iterate through every page to stamp the legal disclaimer
    // and page footer. This ensures consistent branding and legal notices across the entire document.
    // Get the total number of pages that were generated in the document
    const pageCount = doc.getNumberOfPages();
    // Loop through each page (1-indexed) to add the disclaimer and footer
    for (let i = 1; i <= pageCount; i++) {
      // Switch the drawing context to page i
      doc.setPage(i);

      // ── Legal Disclaimer Box ──
      // Positioned 55mm from the bottom of the page to leave room for the footer below
      const disclaimerY = pageHeight - 55;
      // Set the border color to light red for the disclaimer box outline
      doc.setDrawColor(252, 165, 165); // Red 300 — soft red border
      // Set the fill color to very light red for the disclaimer box background
      doc.setFillColor(254, 242, 242); // Red 50 — barely-visible red tint
      // Draw a rounded rectangle with both fill and border ("FD"), 32mm tall, with 2mm corner radius
      doc.roundedRect(20, disclaimerY, pageWidth - 40, 32, 2, 2, "FD");

      // Draw the disclaimer title: "AVERTISSEMENT LÉGAL" (LEGAL WARNING) in bold red
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7); // Small font for legal text
      doc.setTextColor(185, 28, 28); // Red 700 — dark red for emphasis
      doc.text("AVERTISSEMENT LÉGAL", 30, disclaimerY + 7);

      // Switch to normal font for the disclaimer body text
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      // Point 1: "This document is a mathematical estimate and does not replace a lawyer."
      doc.text(
        "1. Ce document est une estimation mathématique et ne remplace pas un avocat.",
        30,
        disclaimerY + 13,
      );
      // Point 2: "Only a Family Court Judge can set the definitive amounts."
      doc.text(
        "2. Seul un Juge aux Affaires Familiales peut fixer les montants définitifs.",
        30,
        disclaimerY + 18,
      );
      // Point 3: "The data is self-declared and has not been certified."
      doc.text(
        "3. Les données sont déclaratives et n'ont pas été certifiées.",
        30,
        disclaimerY + 23,
      );

      // ── Page Footer ──
      // Footer is positioned 10mm from the bottom of the page
      const footerY = pageHeight - 10;
      // Draw a thin horizontal separator line 5mm above the footer text
      doc.setDrawColor(226, 232, 240); // Slate 200 — light gray separator line
      doc.line(20, footerY - 5, pageWidth - 20, footerY - 5);
      // Set small muted gray text for footer elements
      doc.setFontSize(7);
      doc.setTextColor(COLOR_MUTED);
      // Draw the page number on the left side (e.g., "Page 1 / 3")
      doc.text(`Page ${i} / ${pageCount}`, 20, footerY);
      // Draw the application attribution right-aligned: "Generated by SimulDivorce — Decision Support Application"
      doc.text(
        "Généré par SimulDivorce — Application d'Aide à la Décision",
        pageWidth - 20,
        footerY,
        { align: "right" },
      );
    }

    // ── Output: Generate the PDF blob and trigger a browser download ──
    // Convert the complete PDF document to a binary Blob object
    const blob = doc.output("blob");
    // Create a temporary Object URL from the blob to use as the download source
    const url = URL.createObjectURL(blob);
    // Create a temporary <a> anchor element to programmatically trigger the download
    const link = document.createElement("a");
    // Set the anchor's href to the blob URL
    link.href = url;
    // Set the download filename with the unique session hash (e.g., "Rapport_Simulation_#A3F2B1.pdf")
    link.download = `Rapport_Simulation_${sessionHash}.pdf`;
    // Append the link to the DOM body (required by some browsers for the click to work)
    document.body.appendChild(link);
    // Programmatically click the link to trigger the browser's file download dialog
    link.click();
    // Clean up: remove the temporary link element from the DOM
    document.body.removeChild(link);
    // Clean up: revoke the object URL after a 100ms delay to free browser memory
    setTimeout(() => URL.revokeObjectURL(url), 100);
  },
};
