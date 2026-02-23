import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  LogOut,
  Scale,
  FileWarning,
  Ban,
} from "lucide-react";
import { SEO, breadcrumbJsonLd } from "../components/SEO";

const DisclaimerPage: React.FC = () => {
  const navigate = useNavigate();
  const [checks, setChecks] = useState([false, false, false, false, false]);
  const allAccepted = checks.every(Boolean);

  const toggle = (i: number) =>
    setChecks((prev) => prev.map((v, idx) => (idx === i ? !v : v)));

  const handleContinue = () => {
    if (!allAccepted) return;
    localStorage.setItem("disclaimerAccepted", "true");

    // Auto-select all PC methods (skip CalculationChoicePage)
    const autoChoices = {
      selectedCalcs: ["prestationCompensatoire"],
      selectedMethods: {
        prestationCompensatoire: ["axelDepondt", "pilote", "insee"],
      },
    };
    localStorage.setItem("calculationChoices", JSON.stringify(autoChoices));

    // Auto-set guided mode (skip SimulationModePage)
    localStorage.setItem("simulationMode", "guided");

    navigate("/prestation-compensatoire");
  };

  const handleQuit = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-[var(--color-deep-space)] flex flex-col relative text-white">
      <SEO
        title="Avertissement Juridique — SimulDivorce"
        description="Avertissement : cet outil ne constitue pas un conseil juridique. Prenez connaissance des limitations avant de commencer la simulation."
        path="/disclaimer"
        jsonLd={breadcrumbJsonLd([
          { name: "Accueil", path: "/" },
          { name: "Avertissement", path: "/disclaimer" },
        ])}
      />

      {/* Background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[120px]" />

      {/* Header */}
      <div className="p-6 pt-10 z-10 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 mb-4">
          <ShieldAlert className="w-8 h-8 text-amber-400" />
        </div>
        <h1 className="text-2xl font-bold text-white text-glow mb-2">
          Avertissement Important
        </h1>
        <p className="text-sm text-gray-400 max-w-md mx-auto">
          Veuillez lire attentivement les informations ci-dessous avant de
          continuer.
        </p>
      </div>

      {/* Disclaimer Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-10 z-10 scrollbar-hide">
        <div className="max-w-lg mx-auto space-y-4">
          {/* Block 1 — Pas de valeur juridique */}
          <div className="glass-panel p-5 rounded-2xl border border-amber-500/20">
            <div className="flex items-start space-x-3">
              <div className="shrink-0 mt-0.5">
                <Scale className="w-5 h-5 text-amber-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-white mb-1">
                  Aucune valeur juridique
                </h3>
                <p className="text-xs text-gray-300 leading-relaxed">
                  Les résultats fournis par SimulDivorce sont de simples{" "}
                  <strong className="text-white">
                    estimations indicatives
                  </strong>{" "}
                  à caractère purement informatif. Ils ne constituent en aucun
                  cas un acte juridique, un conseil juridique, ni un avis
                  d'avocat ou de notaire.
                </p>
                <label className="flex items-center space-x-3 mt-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={checks[0]}
                    onChange={() => toggle(0)}
                    className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 accent-[var(--color-plasma-cyan)] cursor-pointer rounded"
                  />
                  <span className="text-xs sm:text-sm text-gray-400">
                    J'ai compris que les résultats n'ont aucune valeur juridique
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Block 2 — Non recevable */}
          <div className="glass-panel p-5 rounded-2xl border border-amber-500/20">
            <div className="flex items-start space-x-3">
              <div className="shrink-0 mt-0.5">
                <Ban className="w-5 h-5 text-amber-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-white mb-1">
                  Non recevable devant un juge
                </h3>
                <p className="text-xs text-gray-300 leading-relaxed">
                  Les estimations produites par cet outil{" "}
                  <strong className="text-white">ne sont pas recevables</strong>{" "}
                  devant un juge aux affaires familiales (JAF), un tribunal
                  judiciaire, ou toute autre juridiction. Elles ne peuvent en
                  aucun cas se substituer à une décision de justice.
                </p>
                <label className="flex items-center space-x-3 mt-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={checks[1]}
                    onChange={() => toggle(1)}
                    className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 accent-[var(--color-plasma-cyan)] cursor-pointer rounded"
                  />
                  <span className="text-xs sm:text-sm text-gray-400">
                    J'ai compris que les résultats ne sont pas recevables en
                    justice
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Block 3 — Pas de substitution */}
          <div className="glass-panel p-5 rounded-2xl border border-amber-500/20">
            <div className="flex items-start space-x-3">
              <div className="shrink-0 mt-0.5">
                <FileWarning className="w-5 h-5 text-amber-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-white mb-1">
                  Ne remplace pas un professionnel du droit
                </h3>
                <p className="text-xs text-gray-300 leading-relaxed">
                  Cet outil ne remplace pas la consultation d'un{" "}
                  <strong className="text-white">avocat</strong>, d'un{" "}
                  <strong className="text-white">notaire</strong>, ou de tout
                  autre professionnel du droit compétent. Pour toute situation
                  réelle de divorce, il est impératif de faire appel à un
                  conseil juridique qualifié.
                </p>
                <label className="flex items-center space-x-3 mt-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={checks[2]}
                    onChange={() => toggle(2)}
                    className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 accent-[var(--color-plasma-cyan)] cursor-pointer rounded"
                  />
                  <span className="text-xs sm:text-sm text-gray-400">
                    J'ai compris que cet outil ne remplace pas un avocat
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Block 4 — Limites */}
          <div className="glass-panel p-5 rounded-2xl border border-amber-500/20">
            <div className="flex items-start space-x-3">
              <div className="shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-white mb-1">
                  Limites de la simulation
                </h3>
                <p className="text-xs text-gray-300 leading-relaxed">
                  Les calculs reposent sur des formules doctrinales simplifiées
                  et des barèmes publics (Ministère de la Justice, INSEE). Ils
                  ne tiennent pas compte de l'ensemble des critères que le juge
                  peut retenir : sacrifices de carrière, patrimoine futur, état
                  de santé, etc. Les montants réels peuvent différer
                  significativement.
                </p>
                <label className="flex items-center space-x-3 mt-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={checks[3]}
                    onChange={() => toggle(3)}
                    className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 accent-[var(--color-plasma-cyan)] cursor-pointer rounded"
                  />
                  <span className="text-xs sm:text-sm text-gray-400">
                    J'ai compris les limites de cette simulation
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Block 5 — Responsabilité */}
          <div className="glass-panel p-5 rounded-2xl border border-amber-500/20">
            <div className="flex items-start space-x-3">
              <div className="shrink-0 mt-0.5">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-white mb-1">
                  Absence de responsabilité
                </h3>
                <p className="text-xs text-gray-300 leading-relaxed">
                  L'éditeur de SimulDivorce décline toute responsabilité quant à
                  l'utilisation qui pourrait être faite des résultats de cette
                  simulation. En poursuivant, vous reconnaissez avoir pris
                  connaissance de ces limitations et les accepter pleinement.
                </p>
                <label className="flex items-center space-x-3 mt-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={checks[4]}
                    onChange={() => toggle(4)}
                    className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 accent-[var(--color-plasma-cyan)] cursor-pointer rounded"
                  />
                  <span className="text-xs sm:text-sm text-gray-400">
                    J'accepte l'absence de responsabilité de l'éditeur
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="space-y-3 mt-2">
            <button
              onClick={handleContinue}
              disabled={!allAccepted}
              className={`w-full font-bold py-4 rounded-2xl transition-all flex items-center justify-center space-x-2 sm:space-x-3 group active:scale-95 ${
                allAccepted
                  ? "bg-[var(--color-plasma-cyan)] hover:bg-[var(--accent-hover)] text-white shadow-[0_0_30px_rgba(34,211,238,0.3)]"
                  : "bg-gray-700/50 text-gray-500 cursor-not-allowed"
              }`}
              style={{ color: allAccepted ? "#ffffff" : undefined }}
            >
              <span className="text-xs sm:text-sm tracking-wider sm:tracking-widest uppercase">
                <span className="sm:hidden">J'accepte et continue</span>
                <span className="hidden sm:inline">
                  J'accepte et je continue
                </span>
              </span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={handleQuit}
              className="w-full py-3 rounded-2xl border border-white/10 text-gray-400 hover:text-white hover:border-white/30 transition-all flex items-center justify-center space-x-2 active:scale-95"
            >
              <LogOut className="w-4 h-4" />
              <span className="tracking-widest text-xs uppercase">
                Abandonner et quitter
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DisclaimerPage;
