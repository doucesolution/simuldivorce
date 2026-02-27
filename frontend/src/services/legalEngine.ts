// =====================================================================
// DEFAULT YIELD RATE — Change this single value to update the default
// annual yield rate (%) used across the entire application.
// This rate is applied to non-income-producing property (real estate,
// idle savings) to compute an imputed monthly income.
// =====================================================================
export const DEFAULT_YIELD_RATE = 3; // 3% annual yield rate
export const DEFAULT_YIELD_RATE_STR = String(DEFAULT_YIELD_RATE); // "3" — string version for UI components

// FinancialData holds all input values needed by the three calculation methods.
// Fields are populated by buildFinancialPayload() from divorceFormStore.ts.
export interface FinancialData {
  // Net monthly income of the creditor (the lower-earning spouse who receives PC)
  myIncome: number;
  // Net monthly income of the debtor (the higher-earning spouse who pays PC)
  spouseIncome: number;
  // Duration of the marriage in whole years (used by Tiers Pondéré and INSEE methods)
  marriageDuration: number;
  // Age of the creditor in years (used for age coefficient calculation)
  myAge: number;
  // Age of the debtor in years
  spouseAge: number;
  // Total number of dependent children from the marriage
  childrenCount: number;
  // Age of each child — used by the OECD modified scale to assign consumption units (0.3 or 0.5 UC)
  childrenAges?: number[]; // Âge de chaque enfant (pour calcul UC OCDE)
  // Type of custody: "classic" (sole), "alternating" (shared 50/50), or "reduced"
  custodyType: string;
  // Date the marriage was celebrated (ISO YYYY-MM-DD), for precise duration calculation
  marriageDate?: string;
  // Date of divorce/separation (ISO YYYY-MM-DD), used as end date for duration calc
  divorceDate?: string; // Date de divorce ou de séparation
  // Optional metadata object for auditing (source, timestamp, etc.)
  metadata?: any;

  // ── Detailed PC method fields (Axel-Depondt / Magistrate approach) ──

  // Debtor's current gross monthly income before tax (cells C16/C17 in the reference spreadsheet)
  debtorGrossIncome?: number; // C16/C17 — Revenus actuels avant impôts
  // Whether the debtor's gross income was entered as "monthly" or "annual"
  debtorIncomeMode?: string; // "monthly" | "annual"
  // Monthly child support contribution currently paid by the debtor
  debtorChildContribution?: number;
  // Debtor's expected future gross income (after a known change like retirement or job switch)
  debtorFutureIncome?: number;
  // Debtor's expected future child support contribution
  debtorFutureChildContribution?: number;
  // Date when the debtor's income change is expected to take effect
  debtorChangeDate?: string;
  // Total value of real estate or investments owned by the debtor
  debtorPropertyValue?: number;
  // Annual yield rate (%) of the debtor's property assets
  debtorPropertyYield?: number;
  // Creditor's current gross monthly income before tax (cells C30/C31)
  creditorGrossIncome?: number; // C30/C31 — Revenus actuels avant impôts
  // Whether the creditor's gross income was entered as "monthly" or "annual"
  creditorIncomeMode?: string; // "monthly" | "annual"
  // Monthly child support contribution currently paid by the creditor
  creditorChildContribution?: number;
  // Creditor's expected future gross income
  creditorFutureIncome?: number;
  // Creditor's expected future child support contribution
  creditorFutureChildContribution?: number;
  // Date when the creditor's income change takes effect
  creditorChangeDate?: string;
  // Total value of real estate or investments owned by the creditor
  creditorPropertyValue?: number;
  // Annual yield rate (%) of the creditor's property assets
  creditorPropertyYield?: number;
  // Number of years remaining until the creditor reaches retirement age
  creditorRetirementGapYears?: number;
  // Creditor's expected monthly income just before retirement (pension loss proxy)
  creditorPreRetirementIncome?: number;
}

// SimulationResult groups the outputs of all three calculation methods,
// plus a combined average and the input parameters that were actually used.
export interface SimulationResult {
  // Final compensatory allowance: average of the three method results (rounded to nearest euro)
  compensatoryAllowance: number;
  // The custody type that was used in the calculation (echoed back for display)
  custodyTypeUsed: string;
  // The marriage duration (in years) that was used in the calculation
  marriageDurationUsed: number;
  // Detailed per-method results with min/max ranges
  details: {
    // Method 1: "Tiers Pondéré" (Weighted Third) — temporal approach
    pilote: {
      value: number; // Central estimate
      min: number; // Lower bound (−10%)
      max: number; // Upper bound (+10%)
    };
    // Method 2: "INSEE" — standard-of-living approach using OECD consumption units
    insee: {
      value: number; // Central estimate (20% of disparity)
      min: number; // Conservative bound (15%)
      max: number; // Upper bound (25%)
    };
    // Method 3: "Axel-Depondt" — detailed magistrate/lawyer approach using gross income projections
    axelDepondt: {
      value: number; // Central estimate
      min: number; // Lower bound (−10%)
      max: number; // Upper bound (+10%)
      // Monthly payment if the PC is spread over 8 years (max legal period)
      monthlyOver8Years: number;
      // Maximum capital the debtor can save over 8 years (30% of income × 96 months)
      debtorMaxSavingsCapital: number;
      // Monthly savings capacity of the debtor (debtorMaxSavingsCapital / 96)
      debtorMonthlySavings: number;
    };
    // Display formula description shown in the UI
    formula?: string;
  };
}

/**
 * Calcule la fraction d'année entre deux dates (identique à FRACTION.ANNEE Excel).
 */
// Computes the fractional number of years between two dates, equivalent to
// Excel's YEARFRAC function. Used by the Axel-Depondt method for precise
// marriage duration and income projection period calculations.
// Parameters: d1 and d2 can be Date objects or ISO date strings.
// Returns: absolute difference in years as a decimal (e.g., 5.75 for 5 years 9 months).
function yearFrac(d1: string | Date, d2: string | Date): number {
  // Convert string inputs to Date objects if needed
  const a = d1 instanceof Date ? d1 : new Date(d1);
  const b = d2 instanceof Date ? d2 : new Date(d2);
  // Guard against invalid dates — return 0 if either date can't be parsed
  if (isNaN(a.getTime()) || isNaN(b.getTime())) return 0;
  // Calculate absolute time difference in milliseconds, then convert to years
  // using 365.25 days/year to account for leap years on average
  return Math.abs(b.getTime() - a.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
}

/**
 * Calcule les UC enfants selon l'échelle OCDE modifiée :
 *   - Enfant < 14 ans  → 0.3 UC
 *   - Enfant ≥ 14 ans  → 0.5 UC
 * Si childrenAges n'est pas fourni, tous les enfants sont supposés < 14 ans (0.3 UC).
 */
// Computes the total OECD-modified consumption units for children.
// The OECD modified equivalence scale assigns:
//   - 0.3 UC per child under 14 years old
//   - 0.5 UC per child 14 or older
// These units are used in the INSEE method to normalize household income
// by household size and composition (standard-of-living calculation).
// Parameters:
//   - childrenCount: total number of children
//   - childrenAges: optional array of individual ages
// Returns: total UC value for all children
function computeChildrenUC(
  childrenCount: number,
  childrenAges?: number[],
): number {
  // No children → 0 consumption units
  if (childrenCount <= 0) return 0;
  // If no individual ages are provided, assume all children are under 14 (0.3 UC each)
  if (!childrenAges || childrenAges.length === 0) {
    return 0.3 * childrenCount; // Fallback : tous < 14
  }
  // Iterate over each child, using provided ages where available
  // and defaulting to age 0 (< 14, so 0.3 UC) for any missing entries
  let uc = 0;
  for (let i = 0; i < childrenCount; i++) {
    // Use the provided age if available, otherwise default to 0
    const age = i < childrenAges.length ? childrenAges[i] : 0;
    // Apply the OECD modified scale: 0.5 UC for teens/adults, 0.3 for younger children
    uc += age >= 14 ? 0.5 : 0.3;
  }
  return uc;
}

// The legalEngine object exposes the core `calculate` method that runs
// all three compensatory allowance estimation methods and returns a combined result.
export const legalEngine = {
  // Main calculation function. Takes a FinancialData input and returns a SimulationResult
  // containing estimates from three methods: Tiers Pondéré, INSEE, and Axel-Depondt.
  calculate: (data: FinancialData): SimulationResult => {
    // ---------------------------------------------------------
    // 1. CALCUL PRESTATION COMPENSATOIRE (PC)
    // ---------------------------------------------------------

    // ── Step 1a: Determine who is the beneficiary (creditor) and who is the payer (debtor) ──
    // The beneficiary is the spouse with lower income — they receive the compensatory allowance.
    // Determine Beneficiary (who earns less?)
    const beneficiaryIsMe = data.myIncome < data.spouseIncome;
    // Extract the beneficiary's (lower) income for use in calculations
    const beneficiaryIncome = beneficiaryIsMe
      ? data.myIncome
      : data.spouseIncome;
    // Extract the payer's (higher) income
    const payerIncome = beneficiaryIsMe ? data.spouseIncome : data.myIncome;
    // Get the beneficiary's age (needed for the age coefficient in Tiers Pondéré)
    const beneficiaryAge = beneficiaryIsMe ? data.myAge : data.spouseAge;

    // ═══════════════════════════════════════════════════════════════════
    // METHOD 1: TIERS PONDÉRÉ (Weighted Third — Temporal Approach)
    // ═══════════════════════════════════════════════════════════════════
    // Reference: aidefamille.fr — "Méthode du tiers de la différence pondérée par la durée"
    // Formula: PC = (ΔAnnual / 3) × (Duration / 2) × AgeCoefficient
    // This is a simple, widely-used estimate based on income disparity, marriage length, and age.

    // --- METHODE DU TIERS PONDERE (Approche Temporelle) ---
    // Réf : aidefamille.fr — Méthode du tiers de la différence pondérée par la durée
    // PC = (DeltaAnnuel / 3) * (Duration / 2) * CoeffAge

    // Compute the monthly income difference between payer and beneficiary
    const deltaMonthly = payerIncome - beneficiaryIncome;
    // Annualize the monthly income gap (multiply by 12 months)
    const deltaAnnual = deltaMonthly * 12;

    // Calculate Duration from Dates if available
    // Use actual marriage/divorce dates for precision when provided,
    // otherwise fall back to the pre-computed marriageDuration field.
    let duration = data.marriageDuration;
    if (data.marriageDate) {
      // Parse the marriage start date
      const start = new Date(data.marriageDate);
      // Use divorce date if provided, otherwise use today as the reference
      const end = data.divorceDate ? new Date(data.divorceDate) : new Date();
      // Compute absolute time difference in milliseconds
      const diffTime = Math.abs(end.getTime() - start.getTime());
      // Convert milliseconds to fractional years (365.25 accounts for leap years)
      const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
      // Round to whole years if the result is valid
      if (!isNaN(diffYears)) {
        duration = Math.round(diffYears);
      }
    }

    // Age coefficient: older beneficiaries get a higher PC because they have
    // less time and opportunity to rebuild their financial independence.
    // - Under 45: coefficient = 1.0 (no adjustment)
    // - 45–54: coefficient = 1.2 (moderate increase)
    // - 55+: coefficient = 1.5 (significant increase)
    let ageCoeff = 1.0;
    if (beneficiaryAge >= 45 && beneficiaryAge < 55) ageCoeff = 1.2;
    if (beneficiaryAge >= 55) ageCoeff = 1.5;

    // Calculate the Tiers Pondéré PC estimate:
    // (annual income gap ÷ 3) × (marriage years ÷ 2) × age coefficient
    // Only produces a positive result if there is an income disparity
    let pcPilote = 0;
    if (deltaAnnual > 0) {
      pcPilote = (deltaAnnual / 3) * (duration / 2) * ageCoeff;
    }

    // Standard Deviation (+/- 10%) for Pilote Range
    // Apply a ±10% range around the central estimate to reflect uncertainty
    const piloteMin = pcPilote * 0.9; // Lower bound: 90% of central estimate
    const piloteMax = pcPilote * 1.1; // Upper bound: 110% of central estimate

    // ═══════════════════════════════════════════════════════════════════
    // METHOD 2: INSEE / OECD STANDARD-OF-LIVING APPROACH
    // ═══════════════════════════════════════════════════════════════════
    // Reference: INSEE equivalence scale (insee.fr/fr/metadonnees/definition/c1802)
    // This method computes the loss in standard of living caused by the divorce
    // using OECD-modified consumption units, then capitalizes a percentage of
    // that monthly loss over a capped 8-year period.
    // The PC aims to compensate — not equalize — the disparity.

    // --- APPROCHE NIVEAU DE VIE (Unités de Consommation OCDE/INSEE) ---
    // Ref : Échelle d'équivalence OCDE modifiée (insee.fr/fr/metadonnees/definition/c1802)
    //   - La PC compense la disparité de niveau de vie créée par le divorce
    //   - Versements échelonnés : 8 ans max
    //   - La PC n'a pas pour objet d'égaliser les niveaux de vie

    // Get the custody type, defaulting to "classic" (sole custody) if not specified
    const custody = data.custodyType || "classic";

    // ── Step 2a: Compute consumption units BEFORE divorce (intact household) ──
    // OECD modified scale: 1st adult = 1 UC, 2nd adult = 0.5 UC, plus children UC
    // 1. UC Avant Divorce (Ménage complet — Échelle OCDE modifiée)
    //    1er adulte = 1 UC, 2e adulte = 0.5 UC
    //    Enfant < 14 ans = 0.3 UC, Enfant ≥ 14 ans = 0.5 UC
    const childrenUC = computeChildrenUC(data.childrenCount, data.childrenAges);
    // Total UC for the intact household: 1 (first adult) + 0.5 (second adult) + children
    const ucBefore = 1 + 0.5 + childrenUC;
    // Total household monthly income (both spouses combined)
    const totalIncome = data.myIncome + data.spouseIncome;
    // Standard of living before divorce: total income divided by total consumption units
    const standardLivingBefore = totalIncome / ucBefore;

    // ── Step 2b: Compute consumption units AFTER divorce (beneficiary's household) ──
    // After divorce, the beneficiary lives alone (1 UC) plus their share of children.
    // Under alternating custody, children split time 50/50 so only half their UC count.
    // 2. UC Après Divorce (Bénéficiaire)
    //    Garde alternée → enfants partagés entre les deux foyers (0.5 × UC enfant)
    const childUcShare = custody === "alternating" ? 0.5 : 1; // Alternating: half; classic: full
    // Beneficiary's post-divorce household UC: 1 adult + their share of children UC
    const ucAfter = 1 + childrenUC * childUcShare;
    // Beneficiary's post-divorce standard of living: their income alone ÷ their household UC
    const standardLivingAfter = beneficiaryIncome / ucAfter;

    // ── Step 2c: Compute the standard-of-living gap ──
    // 3. Disparité de niveau de vie
    // Monthly loss = how much the beneficiary's standard of living dropped due to divorce
    // Clamped to 0 (no loss = no PC)
    const lossMonthly = Math.max(0, standardLivingBefore - standardLivingAfter);

    // ── Step 2d: Capitalize the loss over a capped period ──
    // 4. Capitalisation — « Méthode des 20% » (aidefamille.fr)
    //    Réf : pratique courante avocats/magistrats
    //    Période = min(durée du mariage, 8 ans)
    //    La PC ne vise pas l'égalisation totale
    //    Taux : 20% de la disparité (coefficient couramment retenu)
    //      - Min  : 15% (approche conservatrice)
    //      - Moyen: 20% (standard — méthode des 20%)
    //      - Max  : 25% (fortes disparités / longs mariages)

    // Period is capped at 8 years (legal maximum for scheduled payments)
    const periodYears = Math.min(duration, 8);
    // Convert period to months for monthly loss capitalization
    const periodMonths = periodYears * 12;

    // Conservative estimate: 15% of the monthly loss × number of months
    const pcInseeMin = lossMonthly * periodMonths * 0.15;
    // Standard estimate: 20% of the monthly loss × number of months (most commonly used)
    const pcInsee = lossMonthly * periodMonths * 0.2;
    // Upper estimate: 25% of the monthly loss × number of months
    const pcInseeMax = lossMonthly * periodMonths * 0.25;

    // ═══════════════════════════════════════════════════════════════════
    // METHOD 3: PC PILOTE (Detailed Magistrate/Lawyer Approach)
    // ═══════════════════════════════════════════════════════════════════
    // Reference: Calculation grid used by French magistrates and specialized lawyers.
    // Uses GROSS income (before tax), not net income, with detailed projections
    // for future income changes, property yields, and retirement gap.
    //
    // Important: The "debtor" = higher earner (pays the PC), "creditor" = lower earner (receives).
    // If the user entered the incomes reversed, the engine automatically swaps all
    // debtor ↔ creditor fields to ensure correct calculation.

    // --- MÉTHODE CALCUL PC (Approche Détaillée / Magistrat) ---
    // Réf : Grille de calcul utilisée par les magistrats et avocats
    // Utilise des revenus BRUTS (avant impôts), PAS les revenus nets.
    //
    // Le débiteur = celui qui gagne le plus (qui PAIE la PC).
    // Le créancier = celui qui gagne le moins (qui REÇOIT la PC).
    // Si l'utilisateur a saisi les revenus à l'envers, on intervertit
    // automatiquement toutes les données débiteur ↔ créancier.

    // Reference date for time-based calculations: divorce date or today
    const refDateStr =
      data.divorceDate || new Date().toISOString().split("T")[0];
    // Compute exact fractional marriage duration using yearFrac for higher precision
    // than the rounded integer `duration` used by the simpler methods
    const marriageDurExact = data.marriageDate
      ? yearFrac(data.marriageDate, refDateStr)
      : duration;

    // ── Step 3a: Determine if debtor/creditor labels need swapping ──
    // The user may have entered their data with debtor/creditor swapped.
    // We detect this by comparing gross monthly incomes and swap if needed.
    // --- Déterminer le sens : le « débiteur » doit être celui qui gagne le plus ---

    // Read the raw debtor gross income and normalize to monthly
    const rawDGross = data.debtorGrossIncome || 0;
    const rawDMonthly =
      data.debtorIncomeMode === "annual" ? rawDGross / 12 : rawDGross;
    // Read the raw creditor gross income and normalize to monthly
    const rawCGross = data.creditorGrossIncome || 0;
    const rawCMonthly =
      data.creditorIncomeMode === "annual" ? rawCGross / 12 : rawCGross;

    // If the "creditor" actually earns more than the "debtor", we need to swap
    // all debtor ↔ creditor fields so the math is correct (debtor = higher earner)
    const shouldSwap = rawCMonthly > rawDMonthly;

    // ── Step 3b: Read all fields through the swap layer ──
    // Helper variables that read from the correct source depending on shouldSwap.
    // If shouldSwap is true, debtor fields come from creditor inputs and vice versa.

    // Fonctions helper pour lire les bons champs après swap éventuel
    // Debtor gross income (from creditor input if swapped)
    const dGrossIncome = shouldSwap
      ? data.creditorGrossIncome || 0
      : data.debtorGrossIncome || 0;
    // Debtor income mode (monthly/annual)
    const dIncomeMode = shouldSwap
      ? data.creditorIncomeMode || "monthly"
      : data.debtorIncomeMode || "monthly";
    // Debtor child support contribution
    const dChildContribIn = shouldSwap
      ? data.creditorChildContribution || 0
      : data.debtorChildContribution || 0;
    // Debtor future income projection
    const dFutureIncIn = shouldSwap
      ? data.creditorFutureIncome || 0
      : data.debtorFutureIncome || 0;
    // Debtor future child support contribution
    const dFutureChildIn = shouldSwap
      ? data.creditorFutureChildContribution || 0
      : data.debtorFutureChildContribution || 0;
    // Date when debtor's income change takes effect
    const dChangeDateIn = shouldSwap
      ? data.creditorChangeDate || ""
      : data.debtorChangeDate || "";
    // Total value of debtor's property
    const dPropValueIn = shouldSwap
      ? data.creditorPropertyValue || 0
      : data.debtorPropertyValue || 0;
    // Annual yield rate of debtor's property (as percentage)
    const dPropYieldIn = shouldSwap
      ? data.creditorPropertyYield || 0
      : data.debtorPropertyYield || 0;

    // Creditor gross income (from debtor input if swapped)
    const cGrossIncome = shouldSwap
      ? data.debtorGrossIncome || 0
      : data.creditorGrossIncome || 0;
    // Creditor income mode (monthly/annual)
    const cIncomeMode = shouldSwap
      ? data.debtorIncomeMode || "monthly"
      : data.creditorIncomeMode || "monthly";
    // Creditor child support contribution
    const cChildContribIn = shouldSwap
      ? data.debtorChildContribution || 0
      : data.creditorChildContribution || 0;
    // Creditor future income projection
    const cFutureIncIn = shouldSwap
      ? data.debtorFutureIncome || 0
      : data.creditorFutureIncome || 0;
    // Creditor future child support contribution
    const cFutureChildIn = shouldSwap
      ? data.debtorFutureChildContribution || 0
      : data.creditorFutureChildContribution || 0;
    // Date when creditor's income change takes effect
    const cChangeDateIn = shouldSwap
      ? data.debtorChangeDate || ""
      : data.creditorChangeDate || "";
    // Total value of creditor's property
    const cPropValueIn = shouldSwap
      ? data.debtorPropertyValue || 0
      : data.creditorPropertyValue || 0;
    // Annual yield rate of creditor's property (as percentage)
    const cPropYieldIn = shouldSwap
      ? data.debtorPropertyYield || 0
      : data.creditorPropertyYield || 0;

    // ── Step 3c: Compute debtor's average projected monthly income (cells C16–C28) ──
    // --- Revenus Débiteur (C16-C28) ---
    // C17 = Revenus actuels mensuels avant impôts (brut)

    // C17: Convert annual income to monthly if needed
    const dMonthly =
      dIncomeMode === "annual" ? dGrossIncome / 12 : dGrossIncome; // C17
    // C18: Monthly child support contribution paid by the debtor
    const dChildContrib = dChildContribIn; // C18
    // C19: Current disposable income = gross income minus child contribution
    const dC19 = dMonthly - dChildContrib; // C19

    // C20: Debtor's projected future income (after expected change)
    const dFutureIncome = dFutureIncIn; // C20
    // C21: Debtor's projected future child contribution
    const dFutureChildContrib = dFutureChildIn; // C21
    // C22: Future disposable income; if no future income specified, use current (C19)
    const dC22 = dFutureIncome > 0 ? dFutureIncome - dFutureChildContrib : dC19; // C22

    // C24: Weighted average monthly income over the 8-year projection period.
    // If the debtor has a known income change date, compute a weighted average
    // of current income (before change) and future income (after change).
    let dC24 = dC19; // C24 = revenu mensuel moyen prévisible
    if (dFutureIncome > 0 && dChangeDateIn) {
      // Calculate how many years (capped at 8) are at the current income level
      const yBefore = Math.max(
        0,
        Math.min(8, yearFrac(refDateStr, dChangeDateIn)),
      );
      // Weighted average: (years at current rate × current income + remaining years × future income) / 8
      dC24 = (yBefore * dC19 + (8 - yBefore) * dC22) / 8;
    }

    // C25: Total value of débtor's property (real estate, investments)
    const dPropValue = dPropValueIn; // C25
    // C26: Convert annual yield percentage to a decimal (e.g., 3% → 0.03)
    const dPropYield = dPropYieldIn / 100; // C26 = A26/100
    // C27: Monthly income derived from property (annual yield ÷ 12)
    const dC27 = (dPropValue * dPropYield) / 12; // C27
    // C28: Total corrected monthly income = labor income + property income
    const dC28 = dC27 + dC24; // C28 = revenu mensuel moyen prévisible corrigé

    // ── Step 3d: Compute creditor's average projected monthly income (cells C30–C42) ──
    // --- Revenus Créancier (C30-C42) ---
    // C31 = Revenus actuels mensuels avant impôts (brut)

    // C31: Convert annual income to monthly if needed
    const cMonthly =
      cIncomeMode === "annual" ? cGrossIncome / 12 : cGrossIncome; // C31
    // C32: Monthly child support paid by the creditor
    const cChildContrib = cChildContribIn; // C32
    // C33: Current disposable income = gross income minus child contribution
    const cC33 = cMonthly - cChildContrib; // C33

    // C34: Creditor's projected future income (after expected change)
    const cFutureIncome = cFutureIncIn; // C34
    // C35: Creditor's projected future child contribution
    const cFutureChildContrib = cFutureChildIn; // C35
    // C36: Future disposable income; if no future income specified, use current (C33)
    const cC36 = cFutureIncome > 0 ? cFutureIncome - cFutureChildContrib : cC33; // C36

    // C38: Weighted average monthly income over the 8-year projection period
    let cC38 = cC33; // C38 = revenu mensuel moyen prévisible
    if (cFutureIncome > 0 && cChangeDateIn) {
      // Calculate how many years (capped at 8) are at the current income level
      const yBefore = Math.max(
        0,
        Math.min(8, yearFrac(refDateStr, cChangeDateIn)),
      );
      // Weighted average: (years at current × current income + remaining × future income) / 8
      cC38 = (yBefore * cC33 + (8 - yBefore) * cC36) / 8;
    }

    // C39: Total value of creditor's property
    const cPropValue = cPropValueIn; // C39
    // C40: Convert annual yield percentage to decimal
    const cPropYield = cPropYieldIn / 100; // C40 = A40/100
    // C41: Monthly income from creditor's property
    const cC41 = (cPropValue * cPropYield) / 12; // C41
    // C42: Total corrected monthly income = labor income + property income
    const cC42 = cC41 + cC38; // C42 = revenu mensuel moyen prévisible corrigé

    // ── Step 3e: Compute the income disparity and apply duration + age coefficients (cells C44–C50) ──
    // --- Disparité (C44-C50) ---
    // C44: Raw monthly income difference between debtor and creditor
    const adC44 = dC28 - cC42; // C44 = différence mensuelle
    // C46: Apply 60% weighting factor (the PC compensates 60% of the disparity, not 100%)
    const adC46 = adC44 * 0.6; // C46 = pondération × 0.6
    // C47: Multiply weighted monthly disparity by exact marriage duration in years
    const adC47 = adC46 * marriageDurExact; // C47 = disparité × durée mariage

    // Coefficient d'âge (C49) — basé sur l'âge exact du créancier (celui qui reçoit la PC)
    // Si on a inversé les rôles, le « vrai » créancier est le conjoint (spouseAge).
    // C49: Age coefficient based on the creditor's exact age.
    // Uses a piecewise linear function:
    //   - Under 62: coefficient increases with age (older = harder to rebuild financially)
    //   - 62 and above: coefficient decreases (shorter remaining lifetime reduces total PC)
    // If roles were swapped, use spouseAge as the creditor's actual age.
    const creditorAgeExact = shouldSwap ? data.spouseAge || 0 : data.myAge || 0;
    let adC49: number;
    if (creditorAgeExact < 62) {
      // Linear increase: starts at 0.82 (age 0) up to ~1.44 (age 62)
      adC49 = 0.01 * creditorAgeExact + 0.82;
    } else {
      // Linear decrease: starts at ~1.44 (age 62) and decreases for older creditors
      adC49 = -0.01 * creditorAgeExact + 2.06;
    }
    // Round to 2 decimal places for display consistency
    adC49 = Math.round(adC49 * 100) / 100;

    // C50: Final disparity value = married-duration-weighted disparity × age coefficient
    const adC50 = adC49 * adC47; // C50 = disparité corrélée âge + durée

    // ── Step 3f: Retirement gap compensation (cells C51–C53) ──
    // Accounts for additional loss if the creditor has years left before retirement
    // during which they earn less than they would have if still married.
    // --- Retraite (C51-C53) — données du vrai créancier (après swap éventuel) ---
    // C51: Number of years until creditor reaches retirement (always from creditor UI input)
    const retGapYears = data.creditorRetirementGapYears || 0; // C51 (toujours saisi côté créancier UI)
    // C52: Creditor's expected monthly income in the pre-retirement gap period
    const retPreIncome = data.creditorPreRetirementIncome || 0; // C52
    // C53: Total retirement gap compensation = monthly income × number of gap years
    const adC53 = retPreIncome * retGapYears; // C53

    // ── Step 3g: Final Axel-Depondt PC result (cells C56–C59) ──
    // --- Résultat Calcul PC (C56-C59) ---
    // C56: Axel-Depondt PC = retirement gap + disparity (clamped to 0 minimum)
    const pcAxelDepondt = Math.max(0, adC53 + adC50); // C56
    // C57: Maximum capital the debtor can save over 8 years at 30% savings rate
    // (96 months × 30% of average monthly income)
    const adDebtorMaxSavings = 0.3 * 96 * dC24; // C57
    // C58: If PC is paid monthly over 8 years, what is the monthly amount?
    const adMonthly8Y = pcAxelDepondt / (12 * 8); // C58
    // C59: Debtor's monthly savings capacity (max savings ÷ 96 months)
    const adDebtorMonthlySavings = adDebtorMaxSavings / 96; // C59

    // Apply ±10% range around the Axel-Depondt central estimate
    const pcAxelMin = pcAxelDepondt * 0.9; // Lower bound: 90%
    const pcAxelMax = pcAxelDepondt * 1.1; // Upper bound: 110%

    // ═══════════════════════════════════════════════════════════════════
    // FINAL RESULT: Average of the three methods
    // ═══════════════════════════════════════════════════════════════════
    // Combine all three method values into an array
    // Resultat final (Moyenne des trois méthodes)
    const methodValues = [pcPilote, pcInsee, pcAxelDepondt];
    // Compute the arithmetic mean of the three methods and round to nearest euro
    const finalPC = Math.round(
      methodValues.reduce((a, b) => a + b, 0) / methodValues.length,
    );

    // Build and return the complete SimulationResult object
    return {
      // Final combined PC estimate (average of three methods, rounded)
      compensatoryAllowance: Math.round(finalPC),
      // Echo back the custody type used in the calculation
      custodyTypeUsed: custody,
      // Echo back the marriage duration used
      marriageDurationUsed: duration,
      // Detailed per-method results with ranges
      details: {
        // Method 1: Tiers Pondéré results
        pilote: {
          value: Math.round(pcPilote), // Central estimate (rounded)
          min: Math.round(piloteMin), // Lower bound (rounded)
          max: Math.round(piloteMax), // Upper bound (rounded)
        },
        // Method 2: INSEE / OECD results
        insee: {
          value: Math.round(pcInsee), // Central estimate at 20% (rounded)
          min: Math.round(pcInseeMin), // Conservative at 15% (rounded)
          max: Math.round(pcInseeMax), // Upper at 25% (rounded)
        },
        // Method 3: Axel-Depondt detailed results
        axelDepondt: {
          value: Math.round(pcAxelDepondt), // Central estimate (rounded)
          min: Math.round(pcAxelMin), // Lower bound (rounded)
          max: Math.round(pcAxelMax), // Upper bound (rounded)
          monthlyOver8Years: Math.round(adMonthly8Y), // Monthly payment over 8 years
          debtorMaxSavingsCapital: Math.round(adDebtorMaxSavings), // Max debtor savings capital
          debtorMonthlySavings: Math.round(adDebtorMonthlySavings), // Monthly savings capacity
        },
        // Display formula description for the UI tooltip / methodology page
        formula: `Méthode des 20% (UC OCDE/INSEE) — Période max 8 ans`,
      },
    };
  },
};
