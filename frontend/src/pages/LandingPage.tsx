import React from "react";
import { useNavigate, Link } from "react-router-dom";

import { InfoTooltip } from "../components/InfoTooltip";
import { SEO, faqJsonLd } from "../components/SEO";
import { useState} from "react";

const landingFaq = faqJsonLd([
  {
    question: `Comment fonctionne le simulateur de divorce "SimulDivorce" ?`,
    answer:
      "SimulDivorce vous permet de saisir manuellement vos informations financières (revenus, situation familiale) pour simuler la prestation compensatoire. Les estimations sont réalisés localement sur votre appareil.",
  },
  {
    question: "Le simulateur de divorce est-il gratuit ?",
    answer:
      "Oui, SimulDivorce est 100% gratuit. Le service est financé par la publicité (Google AdSense). Aucun compte n'est requis.",
  },
  {
    question: "Mes données sont-elles en sécurité ?",
    answer:
      "Oui, vos données financières de simulation sont traitées localement sur votre appareil. Des données de navigation sont partagées avec Google (publicité) et votre adresse e-mail peut être transmise si vous demandez l'envoi d'un document.",
  },
  {
    question: "Comment est estimée la prestation compensatoire ?",
    answer:
      "SimulDivorce utilise deux méthodes doctrinales reconnues : la méthode Pilote (différentiel de revenus × durée du mariage × coefficient d'âge) et la méthode INSEE (analyse des unités de consommation). Les résultats sont croisés pour fournir une fourchette indicative.",
  },
  {
    question: "Le résultat remplace-t-il un avocat ?",
    answer:
      "Non. SimulDivorce est un outil de simulation indicatif basé sur des barèmes publics (Ministère de la Justice, Code Civil). Il ne constitue pas un conseil juridique. Consultez un avocat spécialisé pour valider les résultats.",
  },
]);

const faqItems = [
  {
    q: `Comment fonctionne SimulDivorce ?`,
    a: "Vous saisissez vos informations financières et familiales, et le est est réalisé localement sur votre appareil. Aucune donnée n'est transmise à un serveur.",
  },
  {
    q: "Le simulateur est-il gratuit ?",
    a: "Oui, entièrement. SimulDivorce est financé par la publicité (Google AdSense). Aucun compte n'est requis.",
  },
  {
    q: "Mes données sont-elles en sécurité ?",
    a: "Vos données de simulation sont traitées localement sur votre appareil. Des données de navigation sont partagées avec Google pour la publicité.",
  },
  {
    q: "Le résultat remplace-t-il un avocat ?",
    a: "Non. SimulDivorce est un outil indicatif basé sur des barèmes publics. Il ne constitue pas un conseil juridique. Consultez un avocat spécialisé pour valider les résultats.",
  },
];

const FaqAccordion: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
      <div className="space-y-4 text-left">
        {faqItems.map(({ q, a }, i) => (
            <div
                key={q}
                className="border border-[var(--border-color)] rounded-2xl overflow-hidden"
            >
              <button
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-4 text-sm font-semibold text-[var(--text-primary)] text-left bg-transparent"
              >
                {q}
                <span
                    className="text-[var(--accent-primary)] text-lg ml-4 flex-shrink-0 transition-transform duration-200"
                    style={{ transform: openIndex === i ? "rotate(45deg)" : "rotate(0deg)" }}
                >
              +
            </span>
              </button>
              {openIndex === i && (
                  <p className="px-6 pb-4 text-sm text-[var(--text-muted)] leading-relaxed">
                    {a}
                  </p>
              )}
            </div>
        ))}
      </div>
  );
};

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center relative overflow-hidden text-center transition-colors duration-300">
      <SEO
        title="Simulateur Divorce Gratuit — Prestation Compensatoire"
        description="Simulez gratuitement votre prestation compensatoire. Estimations locales et confidentielles. Trois méthodes croisées : Calcul PC, Tiers Pondéré, INSEE."
        path="/"
        jsonLd={landingFaq}
      />
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,_var(--bg-secondary)_0%,_transparent_70%)] opacity-50" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[var(--accent-primary)] rounded-full blur-[150px] opacity-10 animate-pulse-glow" />

      {/* Header */}
      <div className="z-20 flex items-center w-full p-6">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-[var(--accent-primary)] rounded-lg flex items-center justify-center">
            <span className="font-mono font-bold" style={{ color: "#ffffff" }}>
              D
            </span>
          </div>
          <span className="text-[var(--text-primary)] font-bold tracking-wider">
            SimulDivorce
          </span>
        </div>
      </div>

      <div className="z-10 flex flex-col items-center justify-center flex-1 w-full max-w-md p-6 pb-24">
        {/* Zero-G Entry Visualization */}
        <div className="relative flex items-center justify-center h-64 mb-10 preserve-3d">
          {/* Privacy Force Field (The Shield) */}
          <div className="absolute w-44 h-80 rounded-[3rem] border-2 border-[var(--accent-primary)] shadow-[0_0_30px_rgba(20,184,166,0.3)] animate-float" />
          <div className="absolute w-48 h-84 rounded-[3.5rem] border border-[var(--accent-primary)] opacity-30 animate-pulse-glow" />

          {/* The 3D Phone */}
          <div className="w-36 h-72 bg-[var(--bg-secondary)] rounded-[2.5rem] border border-[var(--border-color)] relative shadow-2xl animate-[float_6s_ease-in-out_infinite_1s] overflow-hidden">
            {/* Phone Screen Gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg-tertiary)] to-[var(--bg-primary)] opacity-90" />
            <div className="absolute left-0 right-0 flex justify-center bottom-4">
              <div className="w-12 h-12 rounded-full bg-[var(--accent-primary)] blur-md opacity-20 animate-pulse" />
            </div>
            <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 bg-[var(--accent-primary)] rounded-full shadow-[0_0_10px_var(--accent-primary)] animate-[bounce_2s_infinite]" />
          </div>
        </div>

        {/* Typography Manifesting */}
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[var(--text-primary)] to-[var(--text-muted)] mb-4 tracking-tighter animate-[fadeIn_1s_ease-out_forwards] leading-tight">
          Prévoyez l'avenir, <br /> protégez votre vie privée.
        </h1>
        <div className="flex flex-col items-center mb-10 space-y-2 animate-[fadeIn_1s_ease-out_0.3s_forwards]">
          <p className="text-sm text-[var(--text-muted)] font-light">
            Aucun compte requis.{" "}
            <span className="text-[var(--accent-primary)] font-medium">
              Vos informations restent en sécurité.
            </span>
          </p>
          <InfoTooltip
            content="Nous ne demandons aucun document. Vous insérez seulement les informations nécessaires et les estimations sont faites en local. Dès que vous fermez l'app, tout est effacé."
            label="Comment c'est possible ?"
          />
        </div>

        {/* Kinetic Button */}
        <button
          onClick={() => navigate("/disclaimer")}
          className="relative group w-full bg-[var(--bg-secondary)] hover:bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)] text-[var(--accent-primary)] font-bold py-5 px-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--bg-primary)]/10 to-transparent translate-x-[-100%] group-hover:animate-[warp-speed_0.5s_linear]" />
          <span className="relative flex items-center justify-center space-x-3 text-lg tracking-wider">
            <span>Démarrer ma simulation gratuite</span>
          </span>
          <span className="relative text-[10px] block mt-1 opacity-70"></span>
        </button>

        {/* Mini Disclaimer */}
        <div className="max-w-sm mx-auto mt-4 px-4 py-2.5 rounded-xl border border-amber-500/50 bg-amber-500/15">
          <p className="text-xs font-semibold leading-relaxed text-center text-amber-500">
            ⚠ Outil à caractère informatif uniquement — aucune valeur
            juridique. Ne se substitue pas à l'avis d'un avocat ou d'un notaire.
          </p>
        </div>

        <Link
          to="/guide"
          className="mt-6 text-[var(--accent-primary)] hover:text-[var(--accent-hover)] text-xs uppercase tracking-widest font-bold border-b border-transparent hover:border-[var(--accent-primary)] transition-all pb-0.5"
        >
          Guide de préparation
        </Link>

        <nav className="flex mt-4 space-x-4" aria-label="Liens légaux">
          <Link
            to="/privacy"
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm uppercase tracking-widest transition-colors"
          >
            Confidentialité
          </Link>
          <span className="text-[var(--text-muted)]" aria-hidden="true">
            •
          </span>
          <Link
            to="/terms"
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm uppercase tracking-widest transition-colors"
          >
            CGU
          </Link>
        </nav>

        <nav
          className="flex flex-col items-center mt-4 space-y-2"
          aria-label="Ressources"
        >
          <Link
            to="/methodology"
            className="text-[var(--accent-primary)]/70 hover:text-[var(--accent-primary)] text-sm uppercase tracking-widest transition-colors flex items-center justify-center space-x-1"
          >
            <span className="w-1 h-1 bg-[var(--accent-primary)] rounded-full animate-pulse"></span>
            <span>Sources & Méthodologie</span>
          </Link>
          <Link
            to="/glossary"
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm uppercase tracking-widest transition-colors"
          >
            Lexique
          </Link>
        </nav>
      </div>


      {/* Section Presentation */}
      <section className="hero-image-section relative w-full overflow-hidden" style={{ aspectRatio: '16/9' }}>
        <img
            src="/image-accueil1.jpg"
            alt="Balance de la justice"
            className="absolute inset-0 w-full h-full object-cover"
        />

        <div className="hero-overlay absolute inset-0" />

        <div className="relative z-10 flex flex-col items-center justify-center h-full text-white px-6">
          <h2 className="text-4xl font-bold" style={{ color: '#ffffff' }}>Estimez vos prestations</h2>
          <p className="text-center mt-4" style={{ color: '#ffffff' }}>
            Vous vous apprêtez à divorcer mais vous souhaitez estimer le montant de vos prestations compensatoires ?<br/>
            Vous êtes à la recherche d'un outil de simulation simple et pratique de vos prestations qui se base sur votre situation ?<br/>
            SimulDivorce vous permet d'estimer vos prestations à partir de votre situation à travers une simulation.
          </p>
        </div>
      </section>

      {/* Section Nos Services */}
      <section className="w-full max-w-5xl px-6 py-20">
        <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-12 text-left">Nos services</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Carte 1 */}
          <div className="flex flex-col space-y-4">
            <img src="/justice.jpg" alt="Justice" className="w-full h-64 object-cover rounded-[2rem]" />
            <p className="text-sm text-[var(--text-muted)] leading-relaxed">
              Accédez aux estimations précises des prestations compensatoires basés sur les méthodes doctrinales.
            </p>
          </div>

          {/* Carte 2 */}
          <div className="flex flex-col space-y-4">
            <img src="/journal.jpg" alt="Actualités" className="w-full h-64 object-cover rounded-[2rem]" />
            <p className="text-sm text-[var(--text-muted)] leading-relaxed">
              Restez informé des dernières évolutions législatives et jurisprudentielles.
            </p>
          </div>

          {/* Carte 3 */}
          <div className="flex flex-col space-y-4">
            <img src="/alliances.jpg" alt="Mariage" className="w-full h-64 object-cover rounded-[2rem]" />
            <p className="text-sm text-[var(--text-muted)] leading-relaxed">
              Un outil sécurisé pour simuler votre avenir en toute confidentialité.
            </p>
          </div>
        </div>
      </section>


      {/* ─── Section Comment ça marche ─────────────────────────────── */}
      <section className="w-full max-w-5xl px-6 py-20">
        <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-12 text-center">
          Comment ça marche ?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          {[
            {
              step: "01",
              title: "Renseignez votre situation",
              desc: "Revenus, durée du mariage, situation familiale — aucun document requis, tout est saisi manuellement.",
            },
            {
              step: "02",
              title: "Les estimations s'effectuent en local",
              desc: "Trois méthodes doctrinales sont croisées directement sur votre appareil. Aucune donnée ne quitte votre téléphone.",
            },
            {
              step: "03",
              title: "Obtenez votre fourchette indicative",
              desc: "Un résultat chiffré basé sur les barèmes du Ministère de la Justice et du Code Civil.",
            },
          ].map(({ step, title, desc }) => (
              <div key={step} className="flex flex-col items-center space-y-4">
        <span className="text-5xl font-bold text-[var(--accent-primary)] opacity-30">
          {step}
        </span>
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">{desc}</p>
              </div>
          ))}
        </div>
      </section>

      {/* ─── Section Pourquoi simuler ? ─────────────────────────────── */}
      <section className="w-full max-w-5xl px-6 py-16">
        <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-12 text-center">
          Pourquoi simuler votre prestation compensatoire?
        </h2>

        <div className="flex flex-col md:flex-row gap-10 items-start mb-12">

          {/* Illustration gauche */}
          <div className="flex-shrink-0 w-full md:w-64 flex items-center justify-center">
            <div className="relative w-56 h-56 rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center justify-center shadow-xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-primary)]/10 to-transparent" />
              <span className="text-8xl select-none">⚖️</span>
              <div className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-[var(--accent-primary)]/20 animate-pulse" />
            </div>
          </div>

          {/* Colonne droite : cas d'usage */}
          <div className="flex-1 text-left space-y-4">
            <p className="text-sm text-[var(--text-muted)] leading-relaxed">
              La prestation compensatoire est souvent l'un des sujets les plus anxiogènes d'une procédure de divorce.
              Son montant peut varier du simple au triple selon la méthode retenue, la durée du mariage, les revenus
              de chacun et l'âge des époux. Avant même de rencontrer un avocat, il est utile d'avoir une première
              estimation pour aborder sereinement les discussions.
            </p>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed">
              SimulDivorce a été conçu pour vous donner cette visibilité en quelques minutes, sans créer de compte,
              sans transmettre vos données et sans frais. Voici les situations dans lesquelles notre simulateur
              peut vous être utile :
            </p>
            <ul className="space-y-3 pt-1">
              {[
                "Vous êtes sur le point d'entamer une procédure de divorce et vous souhaitez anticiper le montant que vous pourriez devoir verser — ou recevoir — avant votre premier rendez-vous avec un avocat.",
                "Vous préparez une négociation amiable et voulez arriver avec des chiffres fondés sur des méthodes reconnues par les juridictions françaises.",
                "Vous avez reçu une proposition de votre conjoint et vous voulez vérifier si elle correspond aux fourchettes habituellement retenues par les juges aux affaires familiales.",
                "Vous êtes en cours de procédure et souhaitez comprendre comment les différentes méthodes doctrinales aboutissent à des résultats différents selon votre situation.",
                "Vous envisagez un divorce et voulez mesurer l'impact financier potentiel avant de prendre une décision.",
              ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-[var(--text-muted)] leading-relaxed">
            <span className="mt-1.5 flex-shrink-0 w-4 h-4 rounded-full bg-[var(--accent-primary)]/20 border border-[var(--accent-primary)]/50 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] block" />
            </span>
                    {item}
                  </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bloc texte élargi sous le layout deux colonnes */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-3xl p-8 md:p-10 text-left space-y-5">

          <h3 className="text-xl font-bold text-[var(--text-primary)]">
            Un outil indicatif, pas un substitut à l'avocat
          </h3>
          <p className="text-sm text-[var(--text-muted)] leading-relaxed">
            SimulDivorce croise trois méthodes doctrinales reconnues — la méthode Pilote, la méthode Calcul PC
            et la méthode INSEE — pour vous fournir une fourchette représentative. Ces approches sont utilisées
            par de nombreux barreaux et juridictions en France, mais le juge aux affaires familiales reste
            souverain dans sa décision finale. Le résultat affiché est donc indicatif, et ne constitue en
            aucun cas un avis juridique.
          </p>
          <p className="text-sm text-[var(--text-muted)] leading-relaxed">
            Nous vous encourageons à utiliser SimulDivorce comme point de départ : pour mieux comprendre
            les paramètres qui influencent l'estimation, pour préparer vos questions avant une consultation,
            et pour éviter d'être pris au dépourvu lors des discussions. Plus vous serez informé, plus
            vous pourrez dialoguer efficacement avec votre conseil juridique.
          </p>

          <h3 className="text-xl font-bold text-[var(--text-primary)] pt-2">
            Vos données restent sur votre appareil
          </h3>
          <p className="text-sm text-[var(--text-muted)] leading-relaxed">
            Nous avons fait le choix délibéré de ne stocker aucune information personnelle sur nos serveurs.
            Toutes les données que vous saisissez — revenus, durée du mariage, situation familiale — sont
            traitées localement dans votre navigateur. Dès que vous fermez l'application, tout est effacé.
            Aucun compte n'est requis, aucune adresse e-mail demandée pour accéder à la simulation.
          </p>
          <p className="text-sm text-[var(--text-muted)] leading-relaxed">
            Dans un contexte aussi sensible qu'une procédure de divorce, la confidentialité n'est pas
            une option : c'est une nécessité. C'est pourquoi SimulDivorce est et restera un outil
            d'estimation local, gratuit et respectueux de votre vie privée.
          </p>

          <div className="pt-2 border-t border-[var(--border-color)]">
            <p className="text-xs text-[var(--text-muted)] opacity-60 italic leading-relaxed">
              Les estimations de SimulDivorce sont fondées sur les barèmes publics du Ministère de la Justice,
              les articles 270 à 281 du Code Civil, et les méthodes doctrinales reconnues par les
              juridictions françaises. Elles ne tiennent pas compte de votre situation patrimoniale complète
              ni des spécificités locales de chaque juridiction.
            </p>
          </div>
        </div>
      </section>
      {/* ─── Section Méthodes de calcul ─────────────────────────────── */}
      <section className="w-full max-w-5xl px-6 py-16">
        <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-4 text-center">
          Nos méthodes d'estimations
        </h2>
        <p className="text-sm text-[var(--text-muted)] text-center mb-12 max-w-xl mx-auto">
          SimulDivorce croise trois approches doctrinales reconnues pour vous fournir
          une fourchette la plus représentative possible.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              name: "Méthode Pilote",
              desc: "Basée sur le différentiel de revenus, la durée du mariage et un coefficient lié à l'âge des époux. Utilisée par de nombreux barreaux français.",
            },
            {
              name: "Méthode PC",
              desc: " Projections de revenus bruts sur 8 ans, patrimoine, pondération durée × âge, réparation retraite.",
            },
            {
              name: "Méthode INSEE",
              desc: "Analyse des unités de consommation du foyer selon les données de l'Institut National de la Statistique, permettant d'estimer le niveau de vie de chaque époux.",
            }
          ].map(({ name, desc }) => (
              <div
                  key={name}
                  className="border border-[var(--accent-primary)]/30 bg-[var(--bg-secondary)] rounded-2xl p-6 space-y-2 text-left"
              >
                <h3 className="font-semibold text-[var(--accent-primary)]">{name}</h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">{desc}</p>
              </div>
          ))}
        </div>
      </section>

      {/* ─── Section FAQ ─────────────────────────────────────────────── */}
      <section className="w-full max-w-5xl px-6 py-16">
        <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-12 text-center">
          Questions fréquentes
        </h2>
        <FaqAccordion />
      </section>
      {/* Bottom Leaderboard Ad */}
      <div
        className="w-full bg-[var(--bg-tertiary)]/50 border-t border-[var(--border-color)] flex items-center justify-center z-20"
        style={{
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
          minHeight: "4rem",
        }}
      >
        <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest">
          Google Ads Leaderboard
        </span>
      </div>
    </div>
  );
};




export default LandingPage;
