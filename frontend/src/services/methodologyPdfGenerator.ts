// Import the jsPDF type for TypeScript type annotations.
// jsPDF is the library used to programmatically generate PDF documents in the browser.
import type { jsPDF as JsPDFType } from "jspdf";

// ── Design Standards (same as main pdfGenerator) ──
// Primary color used for headings, watermark text, and dark UI elements — a deep slate blue.
const COLOR_PRIMARY = "#0F172A"; // Slate 900
// Accent color used for decorative lines, subtitle accents, and the methodology subtitle — teal.
const COLOR_ACCENT = "#14B8A6"; // Teal 500
// Muted color used for body text and footer text — a medium slate gray for readability.
const COLOR_MUTED = "#64748B"; // Slate 500

/**
 * Generates a PDF documenting the exact calculation methods
 * used by SimulDivorce: Méthode du Tiers Pondéré, Méthode INSEE,
 * Méthode Calcul PC.
 *
 * Returns the PDF as a Blob (for webhook upload or direct download).
 */
// Main exported async function that builds and returns the methodology PDF as a Blob.
// It is async because jsPDF is dynamically imported to enable code-splitting.
export async function generateMethodologyPdf(): Promise<Blob> {
  // Dynamically import jsPDF so the library is only loaded when this function is called (lazy loading).
  const { jsPDF } = await import("jspdf");
  // Create a new PDF document instance configured for A4 portrait with millimeter units.
  const doc: JsPDFType = new jsPDF({
    orientation: "portrait", // Portrait orientation (taller than wide)
    unit: "mm", // All coordinates and sizes are in millimeters
    format: "a4", // Standard A4 paper size (210mm x 297mm)
  });
  // Cache the page width in mm for use in layout calculations (typically 210mm for A4).
  const pageWidth = doc.internal.pageSize.getWidth();
  // Cache the page height in mm for use in layout calculations (typically 297mm for A4).
  const pageHeight = doc.internal.pageSize.getHeight();

  // ── Helpers ──────────────────────────────────────────────
  // Helper function: draws an angled "DOCUMENT INFORMATIF" watermark across the entire page.
  // This visually signals that the document is informational, not legally binding.
  const drawWatermark = () => {
    // Save the current graphics state so we can restore it after applying transparency.
    doc.saveGraphicsState();
    // Set the graphics state to 8% opacity so the watermark is very faint behind content.
    // @ts-expect-error - jsPDF GState for opacity (the GState constructor is not fully typed)
    doc.setGState(new doc.GState({ opacity: 0.08 }));
    // Use bold Helvetica for the watermark text to make it visible even at low opacity.
    doc.setFont("helvetica", "bold");
    // Large font size (28pt) so the watermark is readable across the page.
    doc.setFontSize(28);
    // Use the primary dark color for the watermark text.
    doc.setTextColor(COLOR_PRIMARY);
    // The watermark text indicating this is an informational document (French).
    const text = "DOCUMENT INFORMATIF";
    // Vertical and horizontal spacing (in mm) between repeated watermark instances.
    const spacing = 60;
    // Loop over rows extending beyond the page to ensure full coverage even with rotation.
    for (let row = -pageHeight; row < pageHeight * 2; row += spacing) {
      // Loop over columns with double spacing horizontally since text is wide.
      for (let col = -pageWidth; col < pageWidth * 2; col += spacing * 2) {
        // Draw the watermark text at a 45-degree angle at each grid position.
        doc.text(text, col, row, { angle: 45 });
      }
    }
    // Restore the previous graphics state (removes the low-opacity setting for subsequent draws).
    doc.restoreGraphicsState();
  };

  // Helper function: draws the dark header bar at the top of each page with the app name and subtitle.
  const drawHeader = () => {
    // Set fill color to the dark primary slate for the header background rectangle.
    doc.setFillColor(COLOR_PRIMARY);
    // Draw a filled rectangle spanning the full page width, 22mm tall, at the very top.
    doc.rect(0, 0, pageWidth, 22, "F");
    // Set bold Helvetica font for the application title text.
    doc.setFont("helvetica", "bold");
    // Title font size within the header bar.
    doc.setFontSize(16);
    // White text color for contrast against the dark header background.
    doc.setTextColor(255, 255, 255);
    // Draw the application name "SimulDivorce" at x=20mm, y=14mm inside the header.
    doc.text("SimulDivorce", 20, 14);
    // Smaller font size for the subtitle below the title.
    doc.setFontSize(7);
    // Switch to normal weight for the subtitle.
    doc.setFont("helvetica", "normal");
    // Use the teal accent color for the subtitle text to differentiate it from the title.
    doc.setTextColor(COLOR_ACCENT);
    // Draw the subtitle describing the document purpose: "Calculation Formulas - Methodology" in French.
    doc.text("FORMULES DE CALCUL - METHODOLOGIE", 20, 19);
  };

  // Helper function: draws a numbered section title with a horizontal accent line underneath.
  // Parameters:
  //   num   — the section number (e.g. "1", "2")
  //   title — the section name (will be uppercased)
  //   topY  — the Y position (in mm) where the title should start
  // Returns the new Y position after the title and separator line.
  const drawSectionTitle = (num: string, title: string, topY: number) => {
    // Bold Helvetica for prominent section titles.
    doc.setFont("helvetica", "bold");
    // Section title font size — large enough to stand out from body text.
    doc.setFontSize(13);
    // Use the dark primary color for section titles.
    doc.setTextColor(COLOR_PRIMARY);
    // Draw the section number and uppercased title, e.g. "1. METHODE DU TIERS PONDERE".
    doc.text(`${num}. ${title.toUpperCase()}`, 20, topY);
    // Set the line/stroke color to the teal accent for the underline.
    doc.setDrawColor(COLOR_ACCENT);
    // Thin line width (0.5mm) for the separator.
    doc.setLineWidth(0.5);
    // Draw a horizontal line from left margin (20mm) to right margin, 2mm below the title.
    doc.line(20, topY + 2, pageWidth - 20, topY + 2);
    // Return the Y position advanced past the title + line + some spacing (10mm total).
    return topY + 10;
  };

  // Helper function: draws a bold subtitle (used for sub-sections within a method).
  // Parameters:
  //   title — the subtitle text
  //   topY  — the Y position where the subtitle should appear
  // Returns the new Y position after the subtitle (advanced by 7mm).
  const drawSubTitle = (title: string, topY: number) => {
    // Bold font for subtitles to distinguish them from body text.
    doc.setFont("helvetica", "bold");
    // Slightly smaller than section titles but larger than body text.
    doc.setFontSize(11);
    // Dark primary color for subtitle text.
    doc.setTextColor(COLOR_PRIMARY);
    // Draw the subtitle text at x=25mm (slightly indented from section titles).
    doc.text(title, 25, topY);
    // Return Y advanced by 7mm to leave space after the subtitle.
    return topY + 7;
  };

  // Helper function: draws normal body text, automatically wrapping to fit the page width.
  // Parameters:
  //   txt  — the text content to render
  //   x    — the X position (left margin) where text starts
  //   topY — the Y position where text starts
  //   size — optional font size (default 9pt)
  // Returns the new Y position after all lines of text have been rendered.
  const textNormal = (
    txt: string,
    x: number,
    topY: number,
    size = 9,
  ): number => {
    // Normal weight Helvetica for body text.
    doc.setFont("helvetica", "normal");
    // Set the specified font size (default 9pt for readability).
    doc.setFontSize(size);
    // Muted gray color for body text to create visual hierarchy with titles.
    doc.setTextColor(COLOR_MUTED);
    // Split the text into multiple lines that fit within the available width (page width minus left margin x minus 20mm right margin).
    const lines = doc.splitTextToSize(txt, pageWidth - x - 20);
    // Render the wrapped text lines at the specified position.
    doc.text(lines, x, topY);
    // Return the new Y position: advance by (number of lines) * (approximate line height based on font size).
    // The factor 0.45 converts font size points to approximate mm line spacing.
    return topY + lines.length * (size * 0.45);
  };

  // Helper function: draws a formula in monospace bold font with teal coloring.
  // Used to visually distinguish mathematical formulas from regular explanatory text.
  // Parameters:
  //   txt  — the formula text to render
  //   x    — the X position where the formula starts
  //   topY — the Y position where the formula starts
  // Returns the new Y position after the formula.
  const textFormula = (txt: string, x: number, topY: number): number => {
    // Courier bold gives formulas a distinct monospace look, like code or math notation.
    doc.setFont("courier", "bold");
    // Font size 9pt for formulas, matching body text size.
    doc.setFontSize(9);
    // Teal color (RGB 13, 148, 136) to make formulas visually prominent and distinct from text.
    doc.setTextColor(13, 148, 136); // Teal
    // Split the formula into lines that fit within the available page width.
    const lines = doc.splitTextToSize(txt, pageWidth - x - 20);
    // Render the formula lines.
    doc.text(lines, x, topY);
    // Return Y advanced by (number of lines * 4.5mm) — fixed line height for monospace formulas.
    return topY + lines.length * 4.5;
  };

  // Helper function: adds a new page to the PDF, then draws the watermark and header on it.
  // Returns the starting Y position (30mm) below the header for content to begin.
  const newPage = () => {
    // Add a new blank page to the document.
    doc.addPage();
    // Draw the angled "DOCUMENT INFORMATIF" watermark on the new page.
    drawWatermark();
    // Draw the dark header bar with "SimulDivorce" title on the new page.
    drawHeader();
    // Return Y = 30mm, which is where content should start (below the 22mm header + 8mm gap).
    return 30;
  };

  // Helper function: checks if there is enough vertical space remaining on the current page.
  // If not, it creates a new page and returns the new starting Y position.
  // Parameters:
  //   currentY — the current Y cursor position on the page
  //   needed   — the vertical space (in mm) required for the next block (default 10mm)
  // Returns either the unchanged currentY (if enough space) or the Y from a new page.
  const checkPageBreak = (currentY: number, needed = 10): number => {
    // Check if the current position plus the needed space exceeds the safe area
    // (page height minus 60mm reserved for the disclaimer box and footer at the bottom).
    if (currentY + needed > pageHeight - 60) {
      // Not enough space — start a new page and return its starting Y position.
      return newPage();
    }
    // Enough space — return the current Y unchanged.
    return currentY;
  };

  // ══════════════════════════════════════════════════════════
  // PAGE 1 — INTRODUCTION + MÉTHODE DU TIERS PONDÉRÉ
  // (Weighted Third Method — the first of three calculation approaches)
  // ══════════════════════════════════════════════════════════
  // Draw the watermark on the first page (which was created automatically by jsPDF).
  drawWatermark();
  // Draw the header bar on the first page.
  drawHeader();
  // Initialize the vertical cursor at 30mm (below the header).
  let y = 30;

  // Title — main document heading describing the PDF content
  // Set bold Helvetica for the main document title.
  doc.setFont("helvetica", "bold");
  // Large font size (15pt) for the main title.
  doc.setFontSize(15);
  // Dark primary color for the title.
  doc.setTextColor(COLOR_PRIMARY);
  // Draw the main title: "Calculation Formulas - Compensatory Allowance" (French).
  doc.text("Formules de Calcul - Prestation Compensatoire", 20, y);
  // Advance the cursor below the title by 8mm.
  y += 8;
  // Draw an introductory paragraph explaining that this document details three methods
  // used by SimulDivorce to estimate the compensatory allowance ("prestation compensatoire").
  y = textNormal(
    "Ce document detaille les trois methodes de calcul utilisees par SimulDivorce pour estimer la prestation compensatoire.",
    20,
    y,
  );
  // Add 6mm vertical gap before the first section.
  y += 6;

  // ── MÉTHODE 1 : TIERS PONDÉRÉ (Weighted Third Method) ──
  // This method calculates the compensatory allowance based on the income differential
  // between spouses, weighted by marriage duration and an age coefficient.
  // Draw the section title "1. METHODE DU TIERS PONDERE" with the accent underline.
  y = drawSectionTitle("1", "Methode du Tiers Pondere", y);

  // Explanatory paragraph describing the Weighted Third Method:
  // It uses the net monthly income differential, weighted by marriage duration and age.
  y = textNormal(
    "Cette methode repose sur le differentiel de revenus nets mensuels entre les deux conjoints, pondere par la duree du mariage et un coefficient d'age.",
    25,
    y,
  );
  // Add 4mm vertical spacing before the formula.
  y += 4;

  // Sub-section: "Main Formula" — the core equation for the Weighted Third Method.
  y = drawSubTitle("Formule principale", y);
  // Render the main formula: PC = (AnnualDelta / 3) × (Duration / 2) × AgeCoefficient
  // PC = prestation compensatoire (compensatory allowance).
  y = textFormula("PC = (DeltaAnnuel / 3) x (Duree / 2) x CoeffAge", 30, y);
  // Add 4mm gap before the variables explanation.
  y += 4;

  // Sub-section: "Variables" — explains each variable used in the formula.
  y = drawSubTitle("Variables", y);
  // Explain DeltaAnnuel: the annualized income difference = (payer net income - beneficiary net income) × 12 months.
  y = textNormal(
    "- DeltaAnnuel = (Revenu net payeur - Revenu net beneficiaire) x 12",
    30,
    y,
  );
  // Explain Duree: the marriage duration in years, calculated from dates if provided by the user.
  y = textNormal(
    "- Duree = duree du mariage en annees (calculee a partir des dates si fournies)",
    30,
    y,
  );
  // Explain CoeffAge: an age-based coefficient applied to the beneficiary (creditor spouse).
  y = textNormal(
    "- CoeffAge = coefficient selon l'age du beneficiaire :",
    30,
    y,
  );
  // Age bracket: under 45 years old → coefficient of 1.0 (no age adjustment).
  y = textNormal("    Moins de 45 ans : 1.0", 35, y);
  // Age bracket: 45 to 54 years old → coefficient of 1.2 (20% increase for older beneficiary).
  y = textNormal("    De 45 a 54 ans : 1.2", 35, y);
  // Age bracket: 55+ years old → coefficient of 1.5 (50% increase as re-employment is harder).
  y = textNormal("    55 ans et plus : 1.5", 35, y);
  // Add 3mm spacing before the next sub-section.
  y += 3;

  // Sub-section: "Determining the beneficiary" — explains who is the creditor and debtor.
  y = drawSubTitle("Determination du beneficiaire", y);
  // Explain that the beneficiary (creditor) is the spouse with the lower net monthly income —
  // they receive the compensatory allowance.
  y = textNormal(
    "Le beneficiaire (= creancier) est le conjoint dont le revenu net mensuel est le plus faible. C'est lui qui recoit la prestation compensatoire.",
    30,
    y,
  );
  // Explain that the payer (debtor) is the spouse with the higher income —
  // they pay the compensatory allowance.
  y = textNormal(
    "Le payeur (= debiteur) est le conjoint dont le revenu est le plus eleve. C'est lui qui verse la prestation compensatoire.",
    30,
    y,
  );
  // Add 8mm vertical gap before moving to the next page.
  y += 8;

  // ======================================================
  // PAGE 2 - METHODE 2 : INSEE (French National Statistics Method)
  // This method measures the disparity in standard of living caused by the divorce,
  // using OECD consumption units to compare household living standards.
  // ======================================================
  // Start a new page for Method 2.
  y = newPage();
  // Draw the section title: "2. METHODE INSEE (OECD Consumption Units)".
  y = drawSectionTitle("2", "Methode INSEE (Unites de Consommation OCDE)", y);

  // Introductory paragraph for the INSEE method: it measures the living standard disparity
  // created by the divorce using OECD consumption units (UC = Unité de Consommation).
  y = textNormal(
    "Cette methode mesure la disparite de niveau de vie creee par le divorce, en utilisant les unites de consommation OCDE.",
    25,
    y,
  );
  // Add 4mm gap before the OECD scale details.
  y += 4;

  // Sub-section: "Modified OECD Scale" — the standard equivalence scale for household size.
  y = drawSubTitle("Echelle OCDE modifiee", y);
  // First adult in the household counts as 1 consumption unit.
  y = textNormal("- 1er adulte = 1 UC", 30, y);
  // Second adult (the spouse) adds 0.5 consumption units.
  y = textNormal("- 2e adulte (conjoint) = 0.5 UC", 30, y);
  // Each child under 14 adds 0.3 consumption units (lower needs).
  y = textNormal("- Enfant de moins de 14 ans = 0.3 UC", 30, y);
  // Each child 14 or older adds 0.5 consumption units (higher needs, similar to an adult).
  y = textNormal("- Enfant de 14 ans ou plus = 0.5 UC", 30, y);
  // Add 3mm spacing before Step 1.
  y += 3;

  // Sub-section: "Step 1 - Standard of living before divorce" — calculates the pre-divorce living standard.
  y = drawSubTitle("Etape 1 - Niveau de vie avant divorce", y);
  // Formula: total consumption units before divorce = 1 (first adult) + 0.5 (spouse) + sum of children's units.
  y = textFormula("UC_avant = 1 + 0.5 + somme(UC_enfants)", 30, y);
  // Formula: living standard before divorce = total household income / total consumption units.
  y = textFormula(
    "NivVie_avant = (RevenuCreancier + RevenuDebiteur) / UC_avant",
    30,
    y,
  );
  // Add 3mm spacing before Step 2.
  y += 3;

  // Sub-section: "Step 2 - Standard of living after divorce (beneficiary)" — the beneficiary's post-divorce situation.
  y = drawSubTitle("Etape 2 - Niveau de vie apres divorce (beneficiaire)", y);
  // Classic custody: the beneficiary keeps all children → UC = 1 adult + sum of children's units.
  y = textNormal("- Garde classique : UC_apres = 1 + somme(UC_enfants)", 30, y);
  // Alternating custody: children are shared → UC = 1 adult + half of children's units.
  y = textNormal(
    "- Garde alternee : UC_apres = 1 + 0.5 x somme(UC_enfants)",
    30,
    y,
  );
  // Formula: post-divorce living standard = beneficiary's income alone / post-divorce consumption units.
  y = textFormula("NivVie_apres = RevenuBeneficiaire / UC_apres", 30, y);
  // Add 3mm spacing before Step 3.
  y += 3;

  // Check if there is enough space (40mm) on the current page before rendering Step 3.
  // If not, jump to a new page.
  y = checkPageBreak(y, 40);
  // Sub-section: "Step 3 - Disparity and capitalization" — computes the monthly loss and capitalizes it.
  y = drawSubTitle("Etape 3 - Disparite et capitalisation", y);
  // Formula: monthly loss = the drop in living standard (cannot be negative, hence max(0, ...)).
  y = textFormula(
    "Perte_mensuelle = max(0, NivVie_avant - NivVie_apres)",
    30,
    y,
  );
  // Formula: period in months = min(marriage duration, 8 years) × 12. Capped at 8 years per convention.
  y = textFormula("Periode = min(Duree_mariage, 8) x 12  (en mois)", 30, y);
  // Add 3mm spacing before the result formula.
  y += 3;

  // Sub-section: "Result - Capitalization" — the final INSEE method result.
  y = drawSubTitle("Resultat - Capitalisation", y);
  // Formula: compensatory allowance = monthly loss × period × 0.20 capitalization discount factor.
  // The 0.20 factor converts an ongoing monthly disparity into a lump-sum capital amount.
  y = textFormula("PC = Perte_mensuelle x Periode x 0.20", 30, y);
  // Add 8mm gap before moving to the next page.
  y += 8;

  // ======================================================
  // PAGE 3 - METHODE 3 : CALCUL PC (Axel-Depondt / combined method)
  // This more detailed method uses GROSS incomes, accounts for child contributions,
  // income evolution, non-productive assets, age coefficients, and retirement compensation.
  // ======================================================
  // Start a new page for Method 3.
  y = newPage();
  // Draw the section title: "3. METHODE CALCUL PC".
  y = drawSectionTitle("3", "Methode Calcul PC", y);

  // Introduction explaining that this method uses gross (pre-tax) incomes.
  // It clarifies that the debtor is the higher earner and creditor is the lower earner,
  // and SimulDivorce auto-swaps roles if the user entered them in reverse.
  y = textNormal(
    "Cette methode utilise les revenus BRUTS (avant impots). Le debiteur est celui qui gagne le plus, le creancier celui qui gagne le moins. Si les roles sont inverses dans la saisie, SimulDivorce les intervertit automatiquement.",
    25,
    y,
  );
  // Add 4mm spacing before the debtor income sub-section.
  y += 4;

  // Sub-section: "Debtor's income (who pays)" — details the debtor's net and corrected income.
  y = drawSubTitle("Revenus du debiteur (qui paie)", y);
  // Formula: net income = gross monthly income minus child support contributions.
  y = textFormula(
    "RevenuNet = RevenuBrut_mensuel - ContributionEnfants",
    30,
    y,
  );
  // Explanatory text: if future income changes are anticipated.
  y = textNormal("Si une evolution de revenus est prevue :", 30, y);
  // Formula: future net income = projected future income minus future child contributions.
  y = textFormula("RevenuFuturNet = RevenuFutur - ContributionFuture", 30, y);
  // Formula: weighted average income over 8 years = blend of current and future income,
  // where "anneesAvant" is the number of years before the income change occurs.
  y = textFormula(
    "RevenuMoyen = (anneesAvant x RevenuNet + (8 - anneesAvant) x RevenuFuturNet) / 8",
    30,
    y,
  );
  // If no income evolution is expected, the average income is simply the current net income.
  y = textNormal("Sinon : RevenuMoyen = RevenuNet", 30, y);
  // Add 2mm gap before the asset yield section.
  y += 2;
  // Explanatory text: non-productive assets (e.g., real estate, savings) that generate implied yield.
  y = textNormal("Patrimoine non productif :", 30, y);
  // Formula: monthly yield = (asset value × annual yield percentage) / 12 months.
  // This imputes a theoretical income from non-productive capital.
  y = textFormula("RendementMensuel = (Patrimoine x Rendement%) / 12", 30, y);
  // Formula: corrected income = average income + imputed monthly yield from assets.
  y = textFormula("RevenuCorrige = RevenuMoyen + RendementMensuel", 30, y);
  // Add 4mm spacing before the creditor income section.
  y += 4;

  // Check if there is enough space (40mm) for the creditor income section; if not, go to a new page.
  y = checkPageBreak(y, 40);
  // Sub-section: "Creditor's income (who receives)" — same logic applied to the lower-earning spouse.
  y = drawSubTitle("Revenus du creancier (qui recoit)", y);
  // Explanatory note: same calculation logic as the debtor section above.
  y = textNormal("Meme logique que le debiteur :", 30, y);
  // Creditor's net income formula: gross monthly minus child contributions.
  y = textFormula(
    "RevenuNet = RevenuBrut_mensuel - ContributionEnfants",
    30,
    y,
  );
  // Creditor's weighted average income over 8 years (same blending formula).
  y = textFormula(
    "RevenuMoyen = (anneesAvant x RevenuNet + (8 - anneesAvant) x RevenuFuturNet) / 8",
    30,
    y,
  );
  // Creditor's monthly imputed yield from non-productive assets.
  y = textFormula("RendementMensuel = (Patrimoine x Rendement%) / 12", 30, y);
  // Creditor's corrected income: average income plus imputed asset yield.
  y = textFormula("RevenuCorrige = RevenuMoyen + RendementMensuel", 30, y);
  // Add 4mm spacing.
  y += 4;

  // Check if there is enough space (50mm) for the disparity calculation block.
  y = checkPageBreak(y, 50);
  // Sub-section: "Disparity calculation" — computes the income gap and adjusts it.
  y = drawSubTitle("Calcul de la disparite", y);
  // Formula: raw difference = debtor's corrected income minus creditor's corrected income.
  y = textFormula(
    "Difference = RevenuCorrige_debiteur - RevenuCorrige_creancier",
    30,
    y,
  );
  // Formula: disparity = 60% of the difference (only a fraction is compensated as per legal convention).
  y = textFormula("Disparite = Difference x 0.6", 30, y);
  // Formula: adjusted disparity = disparity multiplied by marital duration in exact years.
  // Longer marriages lead to higher compensatory allowances.
  y = textFormula(
    "DispariteAjustee = Disparite x DureeMariage (en annees exactes)",
    30,
    y,
  );
  // Add 3mm spacing before the age coefficient section.
  y += 3;

  // Sub-section: "Creditor's age coefficient" — adjusts the allowance based on the creditor's age.
  // This reflects diminishing employability or economic recovery prospects with age.
  y = drawSubTitle("Coefficient d'age du creancier", y);
  // Case 1: if the creditor's age is under 62 years.
  y = textNormal("- Si age < 62 ans :", 30, y);
  // Formula: linearly increasing coefficient (older = slightly higher compensation).
  y = textFormula("  CoeffAge = 0.01 x age + 0.82", 30, y);
  // Case 2: if the creditor's age is 62 or older.
  y = textNormal("- Si age >= 62 ans :", 30, y);
  // Formula: linearly decreasing coefficient (very old = slightly lower, reflecting pension eligibility).
  y = textFormula("  CoeffAge = -0.01 x age + 2.06", 30, y);
  // Formula: final disparity = age coefficient applied to the duration-adjusted disparity.
  y = textFormula("DispariteFinale = CoeffAge x DispariteAjustee", 30, y);
  // Add 3mm spacing.
  y += 3;

  // Check if there is enough space (30mm) for the retirement compensation block.
  y = checkPageBreak(y, 30);
  // Sub-section: "Retirement compensation" — compensates for lost pension contributions
  // during years the creditor did not work (e.g., stayed home to raise children).
  y = drawSubTitle("Reparation retraite", y);
  // Formula: retirement repair = pre-retirement income × number of years without pension contributions.
  y = textFormula(
    "Reparation = RevenuPreRetraite x AnneesSansCotisation",
    30,
    y,
  );
  // Add 3mm spacing before the final result.
  y += 3;

  // Sub-section: "Final result" — the total compensatory allowance from Method 3.
  y = drawSubTitle("Resultat final", y);
  // Formula: PC = max(0, final disparity + retirement repair). Cannot be negative.
  y = textFormula("PC = max(0, DispariteFinale + Reparation)", 30, y);
  // Formula: monthly payment over 8 years = total PC / 96 months (8 years × 12 months).
  y = textFormula("Mensuel sur 8 ans = PC / 96", 30, y);
  // Formula: debtor's maximum savings capacity = 30% of monthly income × 96 months.
  // This cap ensures the debtor can realistically afford the payments.
  y = textFormula(
    "Capacite d'epargne max debiteur = 0.30 x 96 x RevenuMoyen_debiteur",
    30,
    y,
  );
  // Add 8mm spacing before the next page.
  y += 8;

  // ======================================================
  // PAGE 4 - MOYENNE FINALE (Final Average)
  // This page explains how the dashboard combines results from all three methods
  // into a single average estimate.
  // ======================================================
  // Start a new page for Section 4.
  y = newPage();
  // Draw the section title: "4. MOYENNE FINALE" (Final Average).
  y = drawSectionTitle("4", "Moyenne Finale", y);
  // Explanatory text: the amount shown on the dashboard is the arithmetic mean
  // of the three selected calculation methods.
  y = textNormal(
    "Le montant affiche dans le tableau de bord est la moyenne arithmetique des trois methodes selectionnees :",
    25,
    y,
  );
  // Add 2mm gap before the average formula.
  y += 2;
  // Formula: Average = (PC from Weighted Third + PC from INSEE + PC from Calcul PC) / 3.
  y = textFormula("Moyenne = (PC_Tiers + PC_INSEE + PC_CalculPC) / 3", 30, y);
  // Clarification: if the user has only selected some methods, the average is computed
  // only over the selected ones (not necessarily dividing by 3).
  y = textNormal(
    "Si l'utilisateur n'a selectionne que certaines methodes, la moyenne ne porte que sur celles-ci.",
    30,
    y,
  );

  // ── GLOBAL: Disclaimer + Footer on ALL pages ──
  // After all content is placed, loop through every page to stamp a disclaimer box and footer.
  // Get the total number of pages generated so far.
  const pageCount = doc.getNumberOfPages();
  // Iterate over each page (jsPDF pages are 1-indexed).
  for (let i = 1; i <= pageCount; i++) {
    // Switch the drawing context to page i so subsequent draw calls affect that page.
    doc.setPage(i);

    // Disclaimer — a red-tinted warning box at the bottom of each page.
    // Calculate the Y position for the disclaimer: 48mm above the bottom of the page.
    const disclaimerY = pageHeight - 48;
    // Set the border/stroke color to a light red (used for the disclaimer box outline).
    doc.setDrawColor(252, 165, 165);
    // Set the fill color to a very light red/pink background for the disclaimer box.
    doc.setFillColor(254, 242, 242);
    // Draw a rounded rectangle for the disclaimer box: 20mm from left, full width minus 40mm margins,
    // 26mm tall, with 2mm corner radius, filled and stroked ("FD").
    doc.roundedRect(20, disclaimerY, pageWidth - 40, 26, 2, 2, "FD");

    // Set bold font for the disclaimer title "AVERTISSEMENT" (Warning).
    doc.setFont("helvetica", "bold");
    // Small font size (7pt) for the disclaimer text.
    doc.setFontSize(7);
    // Dark red text color for the warning title to draw attention.
    doc.setTextColor(185, 28, 28);
    // Draw the disclaimer title text inside the box.
    doc.text("AVERTISSEMENT", 30, disclaimerY + 7);

    // Switch to normal weight for the disclaimer body text.
    doc.setFont("helvetica", "normal");
    // Keep the same small font size (7pt) for the body.
    doc.setFontSize(7);
    // First line of the disclaimer: "This document is purely informational. The formulas are estimates."
    doc.text(
      "Ce document est fourni a titre purement informatif. Les formules presentees sont des estimations.",
      30,
      disclaimerY + 12,
    );
    // Second line of the disclaimer: "Actual amounts may differ significantly depending on circumstances."
    doc.text(
      "Les montants reels peuvent differer significativement selon les situations.",
      30,
      disclaimerY + 17,
    );

    // Footer — a thin line and page number at the very bottom of each page.
    // Calculate the footer Y position: 10mm above the bottom edge.
    const footerY = pageHeight - 10;
    // Set the line color to a light gray for the footer separator line.
    doc.setDrawColor(226, 232, 240);
    // Draw a horizontal separator line 5mm above the footer text.
    doc.line(20, footerY - 5, pageWidth - 20, footerY - 5);
    // Small font size (7pt) for footer text.
    doc.setFontSize(7);
    // Muted gray color for footer text (matches body text styling).
    doc.setTextColor(COLOR_MUTED);
    // Draw the page number on the left side of the footer, e.g. "Page 1 / 4".
    doc.text(`Page ${i} / ${pageCount}`, 20, footerY);
    // Draw the document identifier on the right side of the footer, right-aligned.
    doc.text(`SimulDivorce - Methodologie`, pageWidth - 20, footerY, {
      align: "right",
    });
  }

  // Output the fully constructed PDF document as a Blob object.
  // This Blob can be used for direct download, webhook upload, or further processing.
  return doc.output("blob");
}
