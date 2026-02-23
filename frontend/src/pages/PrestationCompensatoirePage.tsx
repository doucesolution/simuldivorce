import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Users,
  ArrowRight,
  AlertTriangle,
  X,
  ChevronLeft,
  Home,
  Scale,
} from "lucide-react";
import { InfoTooltip } from "../components/InfoTooltip";
import { GuidedStep, useGuidedSteps } from "../components/GuidedTooltip";
import { GuidedHeaderTour } from "../components/GuidedHeaderTour";
import { SEO, breadcrumbJsonLd } from "../components/SEO";
import { AdUnit } from "../components/AdUnit";
import {
  loadFormData,
  saveFormData,
  getNextPage,
  getPreviousPage,
  getPageIndex,
  getTotalPages,
  getCalculationChoices,
} from "../services/divorceFormStore";

const PrestationCompensatoirePage: React.FC = () => {
  const navigate = useNavigate();
  const currentPath = "/prestation-compensatoire";
  const pageIdx = getPageIndex(currentPath);
  const totalPages = getTotalPages();

  // Load stored data
  const stored = loadFormData();

  // Local state — only marriage + family fields
  const [marriageDate, setMarriageDate] = useState(stored.marriageDate);
  const [divorceDate, setDivorceDate] = useState(stored.divorceDate);
  const [childrenCount, setChildrenCount] = useState(stored.childrenCount);
  const [childrenAges, setChildrenAges] = useState<number[]>(
    stored.childrenAges,
  );
  const [custodyType, setCustodyType] = useState(stored.custodyType);

  const [showDateModal, setShowDateModal] = useState(false);
  const [dateModalError, setDateModalError] = useState("");

  // ── Method flags ──
  const { selectedMethods } = getCalculationChoices();
  const pcMethods = selectedMethods.prestationCompensatoire || [];
  const needsFamilyData = pcMethods.includes("insee");

  const guidedSections = useMemo(() => {
    const s: string[] = ["mariage"];
    if (needsFamilyData) {
      s.push("famille");
    }
    return s;
  }, [needsFamilyData]);

  const { currentStep, advanceStep, allDone, isGuided } = useGuidedSteps(
    guidedSections.length,
  );

  const stepIdx = (name: string) => guidedSections.indexOf(name);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const save = () => {
    saveFormData({
      marriageDate,
      divorceDate,
      childrenCount,
      childrenAges,
      custodyType,
    });
  };

  const handleNext = () => {
    if (!marriageDate) {
      setDateModalError("Veuillez entrer une date de mariage pour continuer.");
      setShowDateModal(true);
      return;
    }
    if (new Date(marriageDate) > new Date()) {
      setDateModalError("La date de mariage ne peut pas être dans le futur.");
      setShowDateModal(true);
      return;
    }
    save();
    navigate(getNextPage(currentPath));
  };

  const handleModalConfirm = () => {
    if (!marriageDate) {
      setDateModalError("Veuillez entrer une date de mariage.");
      return;
    }
    if (new Date(marriageDate) > new Date()) {
      setDateModalError("La date de mariage ne peut pas être dans le futur.");
      return;
    }
    setShowDateModal(false);
    setDateModalError("");
    save();
    navigate(getNextPage(currentPath));
  };

  return (
    <div className="h-[100dvh] bg-[var(--color-deep-space)] flex flex-col relative text-white overflow-hidden">
      <SEO
        title="Prestation Compensatoire — Simulation Divorce"
        description="Renseignez les informations nécessaires au calcul de la prestation compensatoire : mariage, identité, revenus, famille."
        path="/prestation-compensatoire"
        jsonLd={breadcrumbJsonLd([
          { name: "Accueil", path: "/" },
          {
            name: "Prestation Compensatoire",
            path: "/prestation-compensatoire",
          },
        ])}
      />

      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--color-plasma-cyan)]/10 rounded-full blur-[100px]" />

      {/* Header */}
      <div
        className="bg-black/20 backdrop-blur-md border-b border-white/5 p-4 flex justify-between items-center sticky top-0 z-50"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1rem)" }}
      >
        <button
          onClick={() => navigate(getPreviousPage(currentPath))}
          className="p-2 rounded-full hover:bg-white/10 group flex items-center justify-center"
        >
          <ChevronLeft className="w-5 h-5 text-gray-400 group-hover:text-white" />
        </button>
        <h1 className="text-sm font-bold tracking-widest uppercase text-glow">
          Prestation Compensatoire
        </h1>
        <button
          onClick={() => navigate("/")}
          className="p-2 rounded-full hover:bg-white/10 group flex items-center justify-center"
          title="Accueil"
        >
          <Home className="w-5 h-5 text-gray-400 group-hover:text-white" />
        </button>
      </div>

      {/* Progress + Subtitle */}
      <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2 z-10">
        <div className="flex justify-end mb-6">
          <div className="flex space-x-1">
            {Array.from({ length: totalPages }).map((_, i) => (
              <div
                key={i}
                className={`w-8 h-1 rounded-full ${i === pageIdx ? "bg-[var(--color-plasma-cyan)]" : "bg-[var(--border-color)]"}`}
              />
            ))}
          </div>
        </div>
        <h1 className="text-2xl font-bold text-white text-glow mb-2">
          Prestation Compensatoire
        </h1>
        <p className="text-sm text-gray-400">
          Renseignez les informations nécessaires au calcul de la prestation
          compensatoire.
        </p>
        <p className="mt-2 text-xs leading-relaxed text-gray-500">
          La durée du mariage et la situation familiale sont des critères clés
          du calcul (art. 271 du Code Civil). Les unités de consommation OCDE
          utilisées par la méthode INSEE attribuent 0,3 UC par enfant de moins
          de 14 ans et 0,5 UC au-delà.
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-28 sm:pb-32 animate-fade-in relative z-10 scrollbar-hide space-y-8">
        {/* ── Section 1: Mariage ── */}
        <GuidedStep
          step={stepIdx("mariage")}
          currentStep={currentStep}
          totalSteps={guidedSections.length}
          onAdvance={advanceStep}
          content="Entrez la date de votre mariage et, si connue, la date de divorce ou séparation. La durée du mariage est un critère clé de la prestation compensatoire."
          stepLabel="Mariage"
          isComplete={!!marriageDate}
        >
          <div className="space-y-6">
            {/* Category label */}
            <div className="flex items-center space-x-2">
              <Scale className="w-4 h-4 text-teal-400" />
              <span className="text-xs uppercase tracking-widest text-teal-400 font-bold">
                Prestation Compensatoire — Mariage
              </span>
            </div>

            {/* Marriage Date */}
            <div className="glass-panel p-6 rounded-2xl border border-white/10">
              <label className="flex items-center space-x-2 text-[10px] uppercase tracking-widest text-gray-400 mb-4">
                <Calendar className="w-3 h-3" /> <span>Date de Mariage</span>
              </label>
              <input
                type="date"
                value={marriageDate}
                max={new Date().toISOString().split("T")[0]}
                onChange={(e) => setMarriageDate(e.target.value)}
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl p-4 text-[var(--text-primary)] focus:border-[var(--color-plasma-cyan)] outline-none"
              />
            </div>

            {/* Divorce Date */}
            <div className="glass-panel p-6 rounded-2xl border border-white/10">
              <label className="flex items-center space-x-2 text-[10px] uppercase tracking-widest text-gray-400 mb-4">
                <Calendar className="w-3 h-3" />{" "}
                <span>Date de Divorce / Séparation</span>
                <InfoTooltip content="Indiquez la date du prononcé du divorce, ou à défaut la date de séparation effective. Cette date sert à calculer la durée du mariage." />
              </label>
              <input
                type="date"
                value={divorceDate}
                min={marriageDate || undefined}
                max={new Date().toISOString().split("T")[0]}
                onChange={(e) => setDivorceDate(e.target.value)}
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl p-4 text-[var(--text-primary)] focus:border-[var(--color-plasma-cyan)] outline-none"
              />
              {marriageDate && divorceDate && (
                <p className="text-xs text-[var(--text-muted)] mt-2">
                  Durée du mariage :{" "}
                  {Math.max(
                    0,
                    Math.round(
                      (new Date(divorceDate).getTime() -
                        new Date(marriageDate).getTime()) /
                        (1000 * 60 * 60 * 24 * 365.25),
                    ),
                  )}{" "}
                  ans
                </p>
              )}
            </div>
          </div>
        </GuidedStep>

        {/* ── Section 2: Famille (for INSEE / PA-based) ── */}
        {needsFamilyData && (
          <GuidedStep
            step={stepIdx("famille")}
            currentStep={currentStep}
            totalSteps={guidedSections.length}
            onAdvance={advanceStep}
            content="Les informations familiales (enfants, garde) influencent le calcul de la prestation compensatoire via les unités de consommation (UC OCDE) et déterminent également le montant de la pension alimentaire."
            stepLabel="Famille"
            isComplete={true}
          >
            <div className="space-y-6">
              <div className="flex items-center space-x-2">
                <Scale className="w-4 h-4 text-teal-400" />
                <span className="text-xs uppercase tracking-widest text-teal-400 font-bold">
                  Prestation Compensatoire — Famille
                </span>
              </div>

              {/* Children Count */}
              <div className="glass-panel p-6 rounded-2xl border border-white/10">
                <label className="flex items-center space-x-2 text-[10px] uppercase tracking-widest text-gray-400 mb-4">
                  <Users className="w-3 h-3" /> <span>Enfants</span>
                </label>
                <div className="flex items-center justify-between bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl p-2">
                  <button
                    onClick={() => {
                      const n = Math.max(0, childrenCount - 1);
                      setChildrenCount(n);
                      setChildrenAges((prev) => prev.slice(0, n));
                    }}
                    className="w-10 h-10 rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--border-color)] flex items-center justify-center text-xl font-bold transition"
                  >
                    -
                  </button>
                  <span className="text-2xl font-mono text-[var(--color-plasma-cyan)]">
                    {childrenCount}
                  </span>
                  <button
                    onClick={() => {
                      setChildrenCount(childrenCount + 1);
                      setChildrenAges((prev) => [...prev, 0]);
                    }}
                    className="w-10 h-10 rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--border-color)] flex items-center justify-center text-xl font-bold transition"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Children Ages */}
              {childrenCount > 0 && (
                <div className="glass-panel p-6 rounded-2xl border border-white/10">
                  <label className="flex items-center space-x-2 text-[10px] uppercase tracking-widest text-gray-400 mb-4">
                    <Users className="w-3 h-3" /> <span>Âge des Enfants</span>
                    <InfoTooltip content="L'âge de chaque enfant détermine les unités de consommation OCDE (< 14 ans = 0.3 UC, ≥ 14 ans = 0.5 UC) et influence le calcul de la prestation compensatoire." />
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Array.from({ length: childrenCount }).map((_, i) => (
                      <div key={i} className="flex items-center space-x-3">
                        <span className="text-sm text-gray-400 shrink-0">
                          Enfant {i + 1}
                        </span>
                        <input
                          type="number"
                          min="0"
                          max="30"
                          value={childrenAges[i] ?? 0}
                          onChange={(e) => {
                            const newAges = [...childrenAges];
                            newAges[i] = parseInt(e.target.value) || 0;
                            setChildrenAges(newAges);
                          }}
                          className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl p-3 text-[var(--text-primary)] focus:border-[var(--color-plasma-cyan)] outline-none text-center w-20 min-w-[5rem]"
                        />
                        <span className="text-sm text-gray-500 shrink-0">
                          ans
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Custody Type */}
              {childrenCount > 0 && (
                <div className="glass-panel p-6 rounded-2xl border border-white/10">
                  <label className="flex items-center space-x-2 text-[10px] uppercase tracking-widest text-gray-400 mb-4">
                    <Users className="w-3 h-3" /> <span>Type de Garde</span>
                  </label>
                  <div className="space-y-3">
                    {[
                      { key: "classic", label: "Classique (Droit de visite)" },
                      { key: "alternating", label: "Alternée (50/50)" },
                      { key: "reduced", label: "Réduite (Élargi)" },
                    ].map((g) => (
                      <button
                        key={g.key}
                        onClick={() => setCustodyType(g.key)}
                        className={`w-full p-4 rounded-xl border text-sm font-medium transition-all duration-300 ${
                          custodyType === g.key
                            ? "border-[var(--color-plasma-cyan)] bg-[var(--color-plasma-cyan)]/10 text-white shadow-[0_0_15px_rgba(34,211,238,0.2)]"
                            : "border-white/5 bg-white/5 text-gray-400 hover:bg-white/10"
                        }`}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </GuidedStep>
        )}
      </div>

      {/* Date Modal */}
      {showDateModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => {
            setShowDateModal(false);
            setDateModalError("");
          }}
        >
          <div
            className="bg-[var(--color-deep-space)] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                </div>
                <h3 className="text-lg font-bold text-white">
                  Date de mariage requise
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowDateModal(false);
                  setDateModalError("");
                }}
                className="text-gray-400 hover:text-white transition p-2 rounded-full hover:bg-white/10 cursor-pointer"
                type="button"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-300 leading-relaxed">
                {dateModalError ||
                  "Veuillez entrer votre date de mariage pour continuer la simulation."}
              </p>
              <div>
                <label className="text-xs text-gray-400 mb-2 block">
                  Date de mariage
                </label>
                <input
                  type="date"
                  value={marriageDate}
                  max={new Date().toISOString().split("T")[0]}
                  onChange={(e) => {
                    setMarriageDate(e.target.value);
                    setDateModalError("");
                  }}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl p-4 text-[var(--text-primary)] focus:border-[var(--color-plasma-cyan)] outline-none"
                />
              </div>
              <button
                onClick={handleModalConfirm}
                className="w-full bg-[var(--color-plasma-cyan)] hover:bg-[var(--accent-hover)] text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center space-x-2 active:scale-95"
                style={{ color: "#ffffff" }}
              >
                <span className="tracking-widest text-sm uppercase">
                  Continuer
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bloc éditorial — contenu d'éditeur pour conformité AdSense */}
      <div className="px-6 pb-6 space-y-4">
        <div className="flex justify-center">
          <AdUnit type="native" className="w-full max-w-md" />
        </div>
      </div>

      {/* Footer */}
      <div
        className={`fixed bottom-0 left-0 w-full p-3 sm:p-6 bg-gradient-to-t from-[var(--color-deep-space)] to-transparent z-20 ${isGuided && !allDone ? "pointer-events-none" : ""}`}
        style={{
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.75rem)",
        }}
      >
        <button
          onClick={handleNext}
          className={`w-full max-w-md mx-auto bg-[var(--color-plasma-cyan)] hover:bg-[var(--accent-hover)] text-white font-bold py-3 sm:py-5 rounded-2xl shadow-[0_0_30px_rgba(34,211,238,0.3)] transition-all flex items-center justify-center space-x-2 sm:space-x-3 group active:scale-95 ${isGuided && !allDone ? "opacity-20 blur-[3px]" : ""}`}
          style={{ color: "#ffffff" }}
        >
          <span className="text-xs sm:text-sm tracking-wider sm:tracking-widest uppercase">
            <span className="sm:hidden">Valider</span>
            <span className="hidden sm:inline">Valider et poursuivre</span>
          </span>
          <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
      <GuidedHeaderTour />
    </div>
  );
};

export default PrestationCompensatoirePage;
