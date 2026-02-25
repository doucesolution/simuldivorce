import type { jsPDF as JsPDFType } from "jspdf";

// ── Design Standards (same as main pdfGenerator) ──
const COLOR_PRIMARY = "#0F172A"; // Slate 900
const COLOR_ACCENT = "#14B8A6"; // Teal 500
const COLOR_MUTED = "#64748B"; // Slate 500

/**
 * Generates a PDF documenting the exact calculation methods
 * used by SimulDivorce: Méthode du Tiers Pondéré, Méthode INSEE,
 * Méthode Calcul PC.
 *
 * Returns the PDF as a Blob (for webhook upload or direct download).
 */
export async function generateMethodologyPdf(): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const doc: JsPDFType = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const dateStr = new Date().toLocaleString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // ── Helpers ──────────────────────────────────────────────
  const drawWatermark = () => {
    doc.saveGraphicsState();
    // @ts-expect-error - jsPDF GState for opacity
    doc.setGState(new doc.GState({ opacity: 0.08 }));
    doc.setFont("helvetica", "bold");
    doc.setFontSize(28);
    doc.setTextColor(COLOR_PRIMARY);
    const text = "DOCUMENT INFORMATIF";
    const spacing = 60;
    for (let row = -pageHeight; row < pageHeight * 2; row += spacing) {
      for (let col = -pageWidth; col < pageWidth * 2; col += spacing * 2) {
        doc.text(text, col, row, { angle: 45 });
      }
    }
    doc.restoreGraphicsState();
  };

  const drawHeader = () => {
    doc.setFillColor(COLOR_PRIMARY);
    doc.rect(0, 0, pageWidth, 22, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text("SimulDivorce", 20, 14);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(COLOR_ACCENT);
    doc.text("FORMULES DE CALCUL - METHODOLOGIE", 20, 19);
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text(dateStr, pageWidth - 20, 14, { align: "right" });
    doc.setTextColor(156, 163, 175);
    doc.text("v2026", pageWidth - 20, 19, { align: "right" });
  };

  const drawSectionTitle = (num: string, title: string, topY: number) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(COLOR_PRIMARY);
    doc.text(`${num}. ${title.toUpperCase()}`, 20, topY);
    doc.setDrawColor(COLOR_ACCENT);
    doc.setLineWidth(0.5);
    doc.line(20, topY + 2, pageWidth - 20, topY + 2);
    return topY + 10;
  };

  const drawSubTitle = (title: string, topY: number) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(COLOR_PRIMARY);
    doc.text(title, 25, topY);
    return topY + 7;
  };

  const textNormal = (
    txt: string,
    x: number,
    topY: number,
    size = 9,
  ): number => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(size);
    doc.setTextColor(COLOR_MUTED);
    const lines = doc.splitTextToSize(txt, pageWidth - x - 20);
    doc.text(lines, x, topY);
    return topY + lines.length * (size * 0.45);
  };

  const textFormula = (txt: string, x: number, topY: number): number => {
    doc.setFont("courier", "bold");
    doc.setFontSize(9);
    doc.setTextColor(13, 148, 136); // Teal
    const lines = doc.splitTextToSize(txt, pageWidth - x - 20);
    doc.text(lines, x, topY);
    return topY + lines.length * 4.5;
  };

  const newPage = () => {
    doc.addPage();
    drawWatermark();
    drawHeader();
    return 30;
  };

  const checkPageBreak = (currentY: number, needed = 10): number => {
    if (currentY + needed > pageHeight - 60) {
      return newPage();
    }
    return currentY;
  };

  // ══════════════════════════════════════════════════════════
  // PAGE 1 — INTRODUCTION + MÉTHODE DU TIERS PONDÉRÉ
  // ══════════════════════════════════════════════════════════
  drawWatermark();
  drawHeader();
  let y = 30;

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(COLOR_PRIMARY);
  doc.text("Formules de Calcul - Prestation Compensatoire", 20, y);
  y += 8;
  y = textNormal(
    "Ce document detaille les trois methodes de calcul utilisees par SimulDivorce pour estimer la prestation compensatoire.",
    20,
    y,
  );
  y += 6;

  // ── MÉTHODE 1 : TIERS PONDÉRÉ ──
  y = drawSectionTitle("1", "Methode du Tiers Pondere", y);

  y = textNormal(
    "Cette methode repose sur le differentiel de revenus nets mensuels entre les deux conjoints, pondere par la duree du mariage et un coefficient d'age.",
    25,
    y,
  );
  y += 4;

  y = drawSubTitle("Formule principale", y);
  y = textFormula("PC = (DeltaAnnuel / 3) x (Duree / 2) x CoeffAge", 30, y);
  y += 4;

  y = drawSubTitle("Variables", y);
  y = textNormal(
    "- DeltaAnnuel = (Revenu net payeur - Revenu net beneficiaire) x 12",
    30,
    y,
  );
  y = textNormal(
    "- Duree = duree du mariage en annees (calculee a partir des dates si fournies)",
    30,
    y,
  );
  y = textNormal(
    "- CoeffAge = coefficient selon l'age du beneficiaire :",
    30,
    y,
  );
  y = textNormal("    Moins de 45 ans : 1.0", 35, y);
  y = textNormal("    De 45 a 54 ans : 1.2", 35, y);
  y = textNormal("    55 ans et plus : 1.5", 35, y);
  y += 3;

  y = drawSubTitle("Determination du beneficiaire", y);
  y = textNormal(
    "Le beneficiaire (= creancier) est le conjoint dont le revenu net mensuel est le plus faible. C'est lui qui recoit la prestation compensatoire.",
    30,
    y,
  );
  y = textNormal(
    "Le payeur (= debiteur) est le conjoint dont le revenu est le plus eleve. C'est lui qui verse la prestation compensatoire.",
    30,
    y,
  );
  y += 8;

  // ======================================================
  // PAGE 2 - METHODE 2 : INSEE
  // ======================================================
  y = newPage();
  y = drawSectionTitle("2", "Methode INSEE (Unites de Consommation OCDE)", y);

  y = textNormal(
    "Cette methode mesure la disparite de niveau de vie creee par le divorce, en utilisant les unites de consommation OCDE.",
    25,
    y,
  );
  y += 4;

  y = drawSubTitle("Echelle OCDE modifiee", y);
  y = textNormal("- 1er adulte = 1 UC", 30, y);
  y = textNormal("- 2e adulte (conjoint) = 0.5 UC", 30, y);
  y = textNormal("- Enfant de moins de 14 ans = 0.3 UC", 30, y);
  y = textNormal("- Enfant de 14 ans ou plus = 0.5 UC", 30, y);
  y += 3;

  y = drawSubTitle("Etape 1 - Niveau de vie avant divorce", y);
  y = textFormula("UC_avant = 1 + 0.5 + somme(UC_enfants)", 30, y);
  y = textFormula(
    "NivVie_avant = (RevenuCreancier + RevenuDebiteur) / UC_avant",
    30,
    y,
  );
  y += 3;

  y = drawSubTitle("Etape 2 - Niveau de vie apres divorce (beneficiaire)", y);
  y = textNormal("- Garde classique : UC_apres = 1 + somme(UC_enfants)", 30, y);
  y = textNormal(
    "- Garde alternee : UC_apres = 1 + 0.5 x somme(UC_enfants)",
    30,
    y,
  );
  y = textFormula("NivVie_apres = RevenuBeneficiaire / UC_apres", 30, y);
  y += 3;

  y = checkPageBreak(y, 40);
  y = drawSubTitle("Etape 3 - Disparite et capitalisation", y);
  y = textFormula(
    "Perte_mensuelle = max(0, NivVie_avant - NivVie_apres)",
    30,
    y,
  );
  y = textFormula("Periode = min(Duree_mariage, 8) x 12  (en mois)", 30, y);
  y += 3;

  y = drawSubTitle("Resultat - Capitalisation", y);
  y = textFormula("PC = Perte_mensuelle x Periode x 0.20", 30, y);
  y += 8;

  // ======================================================
  // PAGE 3 - METHODE 3 : CALCUL PC
  // ======================================================
  y = newPage();
  y = drawSectionTitle("3", "Methode Calcul PC", y);

  y = textNormal(
    "Cette methode utilise les revenus BRUTS (avant impots). Le debiteur est celui qui gagne le plus, le creancier celui qui gagne le moins. Si les roles sont inverses dans la saisie, SimulDivorce les intervertit automatiquement.",
    25,
    y,
  );
  y += 4;

  y = drawSubTitle("Revenus du debiteur (qui paie)", y);
  y = textFormula(
    "RevenuNet = RevenuBrut_mensuel - ContributionEnfants",
    30,
    y,
  );
  y = textNormal("Si une evolution de revenus est prevue :", 30, y);
  y = textFormula("RevenuFuturNet = RevenuFutur - ContributionFuture", 30, y);
  y = textFormula(
    "RevenuMoyen = (anneesAvant x RevenuNet + (8 - anneesAvant) x RevenuFuturNet) / 8",
    30,
    y,
  );
  y = textNormal("Sinon : RevenuMoyen = RevenuNet", 30, y);
  y += 2;
  y = textNormal("Patrimoine non productif :", 30, y);
  y = textFormula("RendementMensuel = (Patrimoine x Rendement%) / 12", 30, y);
  y = textFormula("RevenuCorrige = RevenuMoyen + RendementMensuel", 30, y);
  y += 4;

  y = checkPageBreak(y, 40);
  y = drawSubTitle("Revenus du creancier (qui recoit)", y);
  y = textNormal("Meme logique que le debiteur :", 30, y);
  y = textFormula(
    "RevenuNet = RevenuBrut_mensuel - ContributionEnfants",
    30,
    y,
  );
  y = textFormula(
    "RevenuMoyen = (anneesAvant x RevenuNet + (8 - anneesAvant) x RevenuFuturNet) / 8",
    30,
    y,
  );
  y = textFormula("RendementMensuel = (Patrimoine x Rendement%) / 12", 30, y);
  y = textFormula("RevenuCorrige = RevenuMoyen + RendementMensuel", 30, y);
  y += 4;

  y = checkPageBreak(y, 50);
  y = drawSubTitle("Calcul de la disparite", y);
  y = textFormula(
    "Difference = RevenuCorrige_debiteur - RevenuCorrige_creancier",
    30,
    y,
  );
  y = textFormula("Disparite = Difference x 0.6", 30, y);
  y = textFormula(
    "DispariteAjustee = Disparite x DureeMariage (en annees exactes)",
    30,
    y,
  );
  y += 3;

  y = drawSubTitle("Coefficient d'age du creancier", y);
  y = textNormal("- Si age < 62 ans :", 30, y);
  y = textFormula("  CoeffAge = 0.01 x age + 0.82", 30, y);
  y = textNormal("- Si age >= 62 ans :", 30, y);
  y = textFormula("  CoeffAge = -0.01 x age + 2.06", 30, y);
  y = textFormula("DispariteFinale = CoeffAge x DispariteAjustee", 30, y);
  y += 3;

  y = checkPageBreak(y, 30);
  y = drawSubTitle("Reparation retraite", y);
  y = textFormula(
    "Reparation = RevenuPreRetraite x AnneesSansCotisation",
    30,
    y,
  );
  y += 3;

  y = drawSubTitle("Resultat final", y);
  y = textFormula("PC = max(0, DispariteFinale + Reparation)", 30, y);
  y = textFormula("Mensuel sur 8 ans = PC / 96", 30, y);
  y = textFormula(
    "Capacite d'epargne max debiteur = 0.30 x 96 x RevenuMoyen_debiteur",
    30,
    y,
  );
  y += 8;

  // ======================================================
  // PAGE 4 - MOYENNE FINALE
  // ======================================================
  y = newPage();
  y = drawSectionTitle("4", "Moyenne Finale", y);
  y = textNormal(
    "Le montant affiche dans le tableau de bord est la moyenne arithmetique des trois methodes selectionnees :",
    25,
    y,
  );
  y += 2;
  y = textFormula("Moyenne = (PC_Tiers + PC_INSEE + PC_CalculPC) / 3", 30, y);
  y = textNormal(
    "Si l'utilisateur n'a selectionne que certaines methodes, la moyenne ne porte que sur celles-ci.",
    30,
    y,
  );

  // ── GLOBAL: Disclaimer + Footer on ALL pages ──
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    // Disclaimer
    const disclaimerY = pageHeight - 48;
    doc.setDrawColor(252, 165, 165);
    doc.setFillColor(254, 242, 242);
    doc.roundedRect(20, disclaimerY, pageWidth - 40, 26, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(185, 28, 28);
    doc.text("AVERTISSEMENT", 30, disclaimerY + 7);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(
      "Ce document est fourni a titre purement informatif. Les formules presentees sont des estimations.",
      30,
      disclaimerY + 12,
    );
    doc.text(
      "Les montants reels peuvent differer significativement selon les situations.",
      30,
      disclaimerY + 17,
    );

    // Footer
    const footerY = pageHeight - 10;
    doc.setDrawColor(226, 232, 240);
    doc.line(20, footerY - 5, pageWidth - 20, footerY - 5);
    doc.setFontSize(7);
    doc.setTextColor(COLOR_MUTED);
    doc.text(`Page ${i} / ${pageCount}`, 20, footerY);
    doc.text(
      `SimulDivorce - Methodologie v2026 - ${dateStr}`,
      pageWidth - 20,
      footerY,
      { align: "right" },
    );
  }

  return doc.output("blob");
}
