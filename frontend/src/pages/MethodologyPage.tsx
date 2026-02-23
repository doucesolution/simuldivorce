import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  Home,
  BookOpen,
  Scale,
  ShieldCheck,
  Mail,
  Download,
  X,
  CheckSquare,
  Square,
  Check,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { SEO, breadcrumbJsonLd } from "../components/SEO";
import { AdUnit } from "../components/AdUnit";

const CALCULATION_CATEGORIES = [
  {
    id: "prestation_compensatoire",
    label: "Prestation Compensatoire",
    description:
      "Méthode Calcul PC (projections magistrat), Méthode Pilote (Tiers Pondéré) et Méthode INSEE (Unités de Consommation OCDE). Coefficients d'âge, durée du mariage, capitalisation.",
    icon: Scale,
    color: "text-teal-400",
    bg: "bg-teal-500/10",
  },
];

const MethodologyPage: React.FC = () => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [email, setEmail] = useState("");
  const [submitState, setSubmitState] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [showModal]);

  const allSelected = selected.length === CALCULATION_CATEGORIES.length;

  const toggleCategory = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelected([]);
    } else {
      setSelected(CALCULATION_CATEGORIES.map((c) => c.id));
    }
  };

  const handleOpenModal = () => {
    setShowModal(true);
    setSelected(CALCULATION_CATEGORIES.map((c) => c.id)); // All selected by default
    setEmail("");
    setSubmitState("idle");
  };

  const isValidEmail = (e: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

  const handleSubmit = async () => {
    if (!isValidEmail(email) || selected.length === 0) return;
    setSubmitState("loading");
    try {
      const res = await fetch(
        "https://hook.eu2.make.com/qq7wul9bqju013r26u95iecsfoxy4p7g",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim(),
            categories: selected,
            source: "methodology_page",
            timestamp: new Date().toISOString(),
          }),
        },
      );
      if (!res.ok) throw new Error("Webhook error");
      setSubmitState("success");
    } catch {
      setSubmitState("error");
    }
  };

  const Section = ({
    title,
    icon: Icon,
    children,
  }: {
    title: string;
    icon: any;
    children: React.ReactNode;
  }) => (
    <section className="mb-8 animate-fade-in">
      <div className="flex items-center pb-2 mb-4 space-x-2 border-b border-white/10">
        <Icon className="w-5 h-5 text-[var(--color-plasma-cyan)]" />
        <h2 className="text-sm font-bold tracking-widest text-white uppercase">
          {title}
        </h2>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );

  const Table = ({
    headers,
    rows,
  }: {
    headers: string[];
    rows: string[][];
  }) => (
    <div className="overflow-hidden border rounded-xl border-white/10 glass-panel">
      <table className="w-full text-xs text-left">
        <thead className="tracking-wider text-gray-400 uppercase bg-white/5">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="px-4 py-3">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="text-gray-300 divide-y divide-white/5">
          {rows.map((row, i) => (
            <tr key={i} className="transition hover:bg-white/5">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--color-deep-space)] flex flex-col relative text-white font-sans">
      <SEO
        title="Méthodologie et Sources Juridiques — Code Civil, Barèmes 2026"
        description="Transparence sur les sources juridiques et méthodes de calcul utilisées : méthodes Calcul PC, Tiers Pondéré et INSEE pour la prestation compensatoire."
        path="/methodology"
        type="article"
        jsonLd={breadcrumbJsonLd([
          { name: "Accueil", path: "/" },
          { name: "Méthodologie", path: "/methodology" },
        ])}
      />
      {/* Background */}
      <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_0%_100%,_var(--accent-light)_0%,_transparent_50%)] opacity-30 pointer-events-none" />

      {/* Header */}
      <div className="p-6 pt-8 flex items-center justify-between z-10 sticky top-0 bg-[var(--color-deep-space)]/90 backdrop-blur-xl border-b border-white/5">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center p-2 transition rounded-full bg-white/5 hover:bg-white/10 group"
        >
          <ChevronLeft className="w-5 h-5 text-gray-300 group-hover:text-white" />
        </button>
        <span className="text-xs font-bold tracking-[0.2em] text-white uppercase text-glow">
          Méthodologie
        </span>
        <button
          onClick={() => navigate("/")}
          className="flex items-center justify-center p-2 transition rounded-full bg-white/5 hover:bg-white/10 group"
          title="Accueil"
        >
          <Home className="w-5 h-5 text-gray-300 group-hover:text-white" />
        </button>
      </div>

      <div className="flex-1 px-6 py-8 pb-32 overflow-y-auto">
        {/* Intro */}
        <div className="mb-10 text-center">
          <h1 className="mb-2 text-xl font-bold">
            Sources Juridiques & Algorithmiques
          </h1>
          <p className="max-w-sm mx-auto text-xs text-gray-400">
            Transparence sur les règles de droit et les méthodes de calcul
            utilisées par SimulDivorce (v2026).
          </p>
        </div>

        {/* 1. Cadre Légal */}
        <Section title="1. Cadre Légal : Code Civil" icon={BookOpen}>
          <Table
            headers={["Domaine", "Portée"]}
            rows={[
              [
                "Prestation Compensatoire",
                "Critères de disparité et modalités de versement.",
              ],
              [
                "Preuve des Revenus",
                "Obligation de déclaration sur l'honneur.",
              ],
            ]}
          />
        </Section>

        {/* 2. Référentiels Calcul */}
        <Section title="2. Référentiels de Calcul" icon={Scale}>
          <div className="p-4 border glass-panel rounded-xl border-white/10">
            <h3 className="text-xs font-bold text-[var(--color-plasma-cyan)] mb-2">
              Prestation Compensatoire
            </h3>
            <p className="mb-2 text-xs text-gray-300">
              Méthodes doctrinales croisées :
            </p>
            <ul className="pl-4 space-y-1 text-xs text-gray-400 list-disc">
              <li>
                <strong>Méthode Calcul PC :</strong> Projections de revenus
                bruts sur 8 ans, patrimoine, pondération durée × âge, réparation
                retraite.
              </li>
              <li>
                <strong>Méthode Tiers Pondéré (Pilote) :</strong> Différentiel
                de revenus nets pondéré par la durée du mariage et l'âge du
                bénéficiaire.
              </li>
              <li>
                <strong>Méthode INSEE :</strong> Analyse basée sur les unités de
                consommation OCDE, prenant en compte les enfants et le type de
                garde.
              </li>
            </ul>
          </div>
        </Section>

        {/* 3. Conformité */}
        <Section title="3. Conformité RGPD" icon={ShieldCheck}>
          <p className="mb-4 text-xs text-gray-400">
            L'application respecte le principe de minimisation des données. Les
            calculs de simulation sont réalisés localement dans votre
            navigateur. Seules les données nécessaires à la publicité (Google)
            et à l'envoi de documents par e-mail transitent par des services
            tiers.
          </p>
          <Table
            headers={["Principe", "Mise en œuvre"]}
            rows={[
              [
                "Minimisation (Art. 5.1.c)",
                "Calculs locaux. Seules les données publicitaires (Google) et l'adresse e-mail (envoi de documents) sont transmises.",
              ],
              [
                "Transparence",
                "Sources juridiques et méthodes de calcul documentées sur cette page.",
              ],
            ]}
          />
        </Section>

        {/* CTA — Recevoir les formules de calcul par PDF */}
        <section className="mb-8 animate-fade-in">
          <button
            onClick={handleOpenModal}
            className="w-full group"
            type="button"
          >
            <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--accent-primary)]/40 bg-gradient-to-br from-[var(--accent-primary)]/10 via-transparent to-[var(--color-plasma-cyan)]/10 p-6 sm:p-8 transition-all duration-300 hover:border-[var(--accent-primary)]/70 hover:shadow-[0_0_40px_rgba(13,148,136,0.2)]">
              {/* Glow effect */}
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-[var(--accent-primary)]/10 rounded-full blur-3xl group-hover:bg-[var(--accent-primary)]/20 transition-all duration-500" />

              <div className="relative flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[var(--accent-primary)]/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <Download className="w-7 h-7 sm:w-8 sm:h-8 text-[var(--accent-primary)]" />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] mb-1">
                    Recevoir les formules de calcul par e-mail
                  </h3>
                  <p className="text-xs leading-relaxed text-gray-400 sm:text-sm">
                    Obtenez un PDF détaillant les formules mathématiques et
                    références juridiques utilisées pour chaque calcul.
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-[var(--accent-primary)] shrink-0 group-hover:translate-x-1 transition-transform hidden sm:block" />
              </div>
            </div>
          </button>
        </section>
      </div>

      {/* Modal — Sélection des calculs + email */}
      {showModal &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => submitState !== "loading" && setShowModal(false)}
          >
            <div
              className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl shadow-2xl w-full max-w-[calc(100vw-1.5rem)] sm:max-w-lg relative flex flex-col max-h-[85vh] sm:max-h-[90vh] animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[var(--border-color)] shrink-0">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[var(--accent-primary)]/10 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--accent-primary)]" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
                    Recevoir les calculs
                  </h3>
                </div>
                <button
                  onClick={() =>
                    submitState !== "loading" && setShowModal(false)
                  }
                  className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition p-2 rounded-full hover:bg-[var(--bg-tertiary)] cursor-pointer"
                  aria-label="Fermer"
                  type="button"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 min-h-0 p-4 overflow-y-auto sm:p-6">
                {submitState === "success" ? (
                  /* Success state */
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-green-500/10">
                      <Check className="w-8 h-8 text-green-400" />
                    </div>
                    <h4 className="text-lg font-bold text-[var(--text-primary)] mb-2">
                      PDF envoyé !
                    </h4>
                    <p className="text-sm text-[var(--text-secondary)] mb-6 max-w-xs">
                      Le document contenant les formules sélectionnées a été
                      envoyé à <strong>{email}</strong>.
                    </p>
                    <button
                      onClick={() => setShowModal(false)}
                      className="px-6 py-2.5 rounded-xl bg-[var(--accent-primary)] text-white font-semibold hover:opacity-90 transition"
                      type="button"
                    >
                      Fermer
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Select All / Deselect All */}
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium">
                        Sélectionnez les calculs à inclure :
                      </p>
                      <button
                        onClick={toggleAll}
                        className="text-xs font-medium text-[var(--accent-primary)] hover:underline shrink-0 ml-2"
                        type="button"
                      >
                        {allSelected
                          ? "Tout désélectionner"
                          : "Tout sélectionner"}
                      </button>
                    </div>

                    {/* Calculation checkboxes */}
                    <div className="space-y-2.5 mb-6">
                      {CALCULATION_CATEGORIES.map((cat) => {
                        const isChecked = selected.includes(cat.id);
                        const Icon = cat.icon;
                        return (
                          <button
                            key={cat.id}
                            onClick={() => toggleCategory(cat.id)}
                            className={`w-full text-left flex items-start gap-3 p-3 sm:p-4 rounded-xl border transition-all duration-200 ${
                              isChecked
                                ? "border-[var(--accent-primary)]/50 bg-[var(--accent-primary)]/5"
                                : "border-[var(--border-color)] bg-[var(--bg-tertiary)]/50 hover:border-[var(--text-muted)]/30"
                            }`}
                            type="button"
                          >
                            <div className="pt-0.5 shrink-0">
                              {isChecked ? (
                                <CheckSquare className="w-5 h-5 text-[var(--accent-primary)]" />
                              ) : (
                                <Square className="w-5 h-5 text-[var(--text-muted)]" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <div
                                  className={`w-5 h-5 rounded-md ${cat.bg} flex items-center justify-center shrink-0`}
                                >
                                  <Icon className={`w-3 h-3 ${cat.color}`} />
                                </div>
                                <span className="text-sm font-semibold text-[var(--text-primary)]">
                                  {cat.label}
                                </span>
                              </div>
                              <p className="text-[11px] sm:text-xs text-[var(--text-muted)] leading-relaxed">
                                {cat.description}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Email input */}
                    <div className="mb-5">
                      <label
                        htmlFor="calc-email"
                        className="block text-xs sm:text-sm font-medium text-[var(--text-secondary)] mb-1.5"
                      >
                        Adresse e-mail
                      </label>
                      <input
                        id="calc-email"
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (submitState === "error") setSubmitState("idle");
                        }}
                        placeholder="votre@email.com"
                        className="w-full px-4 py-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-sm placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50 focus:border-[var(--accent-primary)] transition"
                        autoComplete="email"
                      />
                      {submitState === "error" && (
                        <p className="text-xs text-red-400 mt-1.5">
                          Une erreur est survenue. Veuillez réessayer.
                        </p>
                      )}
                    </div>

                    {/* Submit button */}
                    <button
                      onClick={handleSubmit}
                      disabled={
                        !isValidEmail(email) ||
                        selected.length === 0 ||
                        submitState === "loading"
                      }
                      className={`w-full py-3 sm:py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                        !isValidEmail(email) ||
                        selected.length === 0 ||
                        submitState === "loading"
                          ? "bg-[var(--text-muted)]/20 text-[var(--text-muted)] cursor-not-allowed"
                          : "bg-[var(--accent-primary)] text-white hover:opacity-90 active:scale-[0.98]"
                      }`}
                      type="button"
                    >
                      {submitState === "loading" ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Envoi en cours…
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4" />
                          Envoyer le PDF ({selected.length}{" "}
                          {selected.length > 1 ? "calculs" : "calcul"})
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Ad — content-rich page */}
      <div className="flex justify-center px-6 pb-12">
        <AdUnit type="rectangle" />
      </div>
    </div>
  );
};

export default MethodologyPage;
