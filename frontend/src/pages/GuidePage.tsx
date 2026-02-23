import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Shield, Home, CheckCircle2 } from "lucide-react";
import { SEO, howToJsonLd, breadcrumbJsonLd } from "../components/SEO";
import { AdUnit } from "../components/AdUnit";

const GuidePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[var(--color-deep-space)] flex flex-col relative text-white font-sans">
      <SEO
        title="Guide de Préparation — Informations Requises"
        description="Préparez les informations nécessaires pour une simulation de divorce précise : revenus, situation familiale. Guide par méthode de calcul."
        path="/guide"
        jsonLd={[
          breadcrumbJsonLd([
            { name: "Accueil", path: "/" },
            { name: "Guide de préparation", path: "/guide" },
          ]),
          howToJsonLd(
            "Préparer ses informations pour une simulation de divorce",
            "Guide étape par étape pour rassembler les informations nécessaires à une simulation précise de la prestation compensatoire.",
            [
              {
                name: "Rassembler les informations de base",
                text: "Date de mariage, date prévisionnelle de divorce, dates de naissance des deux conjoints.",
              },
              {
                name: "Préparer les données de revenus",
                text: "Revenus nets mensuels (pour les méthodes Tiers Pondéré et INSEE) et/ou revenus bruts (pour la méthode Calcul PC).",
              },
              {
                name: "Situation familiale",
                text: "Nombre d'enfants, âge de chaque enfant et type de garde (classique, alternée ou réduite).",
              },
              {
                name: "Lancer la simulation",
                text: "Saisissez vos informations directement dans le simulateur. Les calculs sont réalisés localement sur votre appareil.",
              },
            ],
          ),
        ]}
      />
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[var(--color-plasma-cyan)]/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <div className="p-6 pt-8 flex items-center justify-between z-10 sticky top-0 bg-[var(--color-deep-space)]/80 backdrop-blur-md border-b border-white/5">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center p-2 transition rounded-full bg-white/5 hover:bg-white/10 group"
        >
          <ChevronLeft className="w-5 h-5 text-gray-300 group-hover:text-white" />
        </button>
        <h1 className="text-sm font-bold tracking-widest text-white uppercase text-glow">
          Guide de Préparation
        </h1>
        <button
          onClick={() => navigate("/")}
          className="flex items-center justify-center p-2 transition rounded-full bg-white/5 hover:bg-white/10 group"
          title="Accueil"
        >
          <Home className="w-5 h-5 text-gray-300 group-hover:text-white" />
        </button>
      </div>

      <div className="flex-1 px-6 py-8 pb-32 space-y-12 overflow-y-auto">
        {/* 1. Introduction */}
        <section className="animate-fade-in">
          <h2 className="text-2xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-[var(--text-primary)] to-[var(--text-muted)]">
            Quelles informations préparer ?
          </h2>
          <div className="p-6 border glass-panel rounded-2xl border-white/10">
            <p className="mb-4 text-sm leading-relaxed text-gray-300">
              Notre simulateur fonctionne par <strong>saisie manuelle</strong>.
              Les informations demandées dépendent des méthodes de calcul que
              vous sélectionnerez. En les rassemblant à l'avance, vous gagnerez
              du temps et obtiendrez des résultats plus fiables.
            </p>
            <div className="flex items-start space-x-3 bg-[var(--color-plasma-cyan)]/10 p-4 rounded-xl border border-[var(--color-plasma-cyan)]/20">
              <Shield className="w-5 h-5 text-[var(--color-plasma-cyan)] shrink-0 mt-0.5" />
              <p className="text-xs text-[var(--color-plasma-cyan)]">
                <span className="block mb-1 font-bold tracking-wider uppercase">
                  Confidentialité
                </span>
                Tous les calculs de simulation sont réalisés localement sur
                votre appareil. Le document récapitulatif est téléchargeable ou
                peut vous être envoyé par courriel (votre adresse e-mail est
                alors transmise à notre service d'envoi). Des données
                strictement nécessaires sont partagées avec Google dans le cadre
                de la publicité.
              </p>
            </div>
          </div>
        </section>

        {/* 2. Checklist simple */}
        <section className="delay-100 animate-fade-in">
          <h3 className="mb-6 text-sm font-bold tracking-widest text-gray-500 uppercase">
            Informations à préparer
          </h3>

          <div className="p-5 border glass-panel rounded-2xl border-white/10 space-y-3">
            {[
              "Date de mariage",
              "Date prévisionnelle du divorce",
              "Date de naissance du créancier",
              "Date de naissance du débiteur",
              "Revenus nets mensuels (créancier & débiteur)",
              "Revenus bruts mensuels ou annuels (créancier & débiteur)",
              "Nombre d'enfants et âge de chacun",
              "Type de garde (classique, alternée ou réduite)",
              "Contributions enfants mensuelles",
              "Patrimoine non productif et rendement estimé (%)",
              "Écart retraite du créancier (années sans cotisation)",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-[var(--color-plasma-cyan)] shrink-0 mt-0.5" />
                <span className="text-sm text-gray-300">{item}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Ad — content-rich page */}
        <div className="flex justify-center my-8">
          <AdUnit type="rectangle" />
        </div>

        {/* 4. Note */}
        <section className="px-4 pb-8 text-center delay-500 animate-fade-in">
          <p className="max-w-xs mx-auto text-xs leading-relaxed text-gray-500">
            Toutes les informations sont saisies manuellement et les calculs
            sont réalisés sur votre appareil. Seules les données nécessaires à
            la publicité (Google) et à l'envoi de documents par e-mail
            transitent par nos services.
          </p>
        </section>
      </div>
    </div>
  );
};

export default GuidePage;
