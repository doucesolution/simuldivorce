# 📚 Documentation SimulDivorce

Bienvenue dans la documentation technique complète du projet **SimulDivorce**.

SimulDivorce est une application web et mobile de simulation de prestation compensatoire dans le cadre d'un divorce en France. Elle utilise trois méthodes de calcul reconnues (Tiers Pondéré, INSEE/OCDE, Axel-Depondt) pour estimer le montant de la prestation compensatoire.

---

## 📁 Structure de la documentation

```
documentation/
├── README.md                          ← Ce fichier (sommaire)
├── 01-architecture-generale.md        ← Vue d'ensemble du projet
├── 02-pourquoi-react-et-go.md         ← Choix technologiques React + Go
├── 03-communication-frontend-backend.md ← Comment React et Go interagissent
├── 04-modifier-taux-interet.md        ← Guide : modifier le taux d'intérêt global
├── 05-application-android.md          ← Fonctionnement de l'app Android (Capacitor)
│
├── backend/
│   ├── main-go.md                     ← Documentation du serveur Go (main.go)
│   ├── dockerfile.md                  ← Documentation du Dockerfile backend
│   ├── env-configuration.md           ← Variables d'environnement (.env)
│   └── google-apps-script.md          ← Script Google Drive (drive-upload.gs.js)
│
├── frontend/
│   ├── configuration/
│   │   ├── vite-config.md             ← Configuration Vite (vite.config.ts)
│   │   ├── capacitor-config.md        ← Configuration Capacitor
│   │   ├── tailwind-postcss.md        ← Tailwind CSS + PostCSS
│   │   ├── eslint-config.md           ← Configuration ESLint
│   │   ├── package-json.md            ← Dépendances npm (package.json)
│   │   └── docker-frontend.md         ← Dockerfile du frontend
│   │
│   ├── entree/
│   │   ├── main-tsx.md                ← Point d'entrée (main.tsx)
│   │   ├── app-tsx.md                 ← Routage principal (App.tsx)
│   │   └── index-css.md              ← Styles globaux (index.css)
│   │
│   ├── services/
│   │   ├── legal-engine.md            ← Moteur de calcul juridique
│   │   ├── divorce-form-store.md      ← Stockage des données du formulaire
│   │   ├── pdf-generator.md           ← Génération de PDF
│   │   ├── word-generator.md          ← Génération de documents Word
│   │   ├── methodology-pdf.md         ← PDF de méthodologie
│   │   ├── webhook-service.md         ← Service de livraison de documents
│   │   ├── subscription-service.md    ← Gestion des abonnements
│   │   ├── platform-detection.md      ← Détection de plateforme (web/natif)
│   │   ├── guided-mode.md            ← Mode guidé (contexte React)
│   │   ├── lawyer-case-store.md       ← Données d'identité avocat
│   │   └── lawyer-profile-store.md    ← Profil avocat
│   │
│   ├── composants/
│   │   ├── composants-overview.md     ← Vue d'ensemble des composants
│   │   └── chaque-composant.md        ← Détail de chaque composant
│   │
│   └── pages/
│       ├── pages-overview.md          ← Vue d'ensemble des pages
│       ├── parcours-utilisateur.md    ← Parcours utilisateur (flux des pages)
│       └── chaque-page.md            ← Détail de chaque page
│
└── guides/
    ├── ajout-nouvelle-page.md         ← Comment ajouter une nouvelle page
    ├── ajout-nouveau-composant.md     ← Comment ajouter un nouveau composant
    ├── modification-calculs.md        ← Comment modifier les méthodes de calcul
    └── deploiement.md                 ← Guide de déploiement
```

---

## 🚀 Par où commencer ?

1. **Nouveau sur le projet ?** → Lisez [01-architecture-generale.md](01-architecture-generale.md)
2. **Comprendre les choix techniques ?** → Lisez [02-pourquoi-react-et-go.md](02-pourquoi-react-et-go.md)
3. **Modifier les calculs ?** → Lisez [frontend/services/legal-engine.md](frontend/services/legal-engine.md)
4. **Modifier le taux d'intérêt ?** → Lisez [04-modifier-taux-interet.md](04-modifier-taux-interet.md)
5. **Comprendre l'app Android ?** → Lisez [05-application-android.md](05-application-android.md)
6. **Déployer le projet ?** → Lisez [guides/deploiement.md](guides/deploiement.md)

---

## 🔗 Liens importants

| Script Google Drive | `https://script.google.com/macros/s/AKfycbw3ZcfEiSLnU0JjpdG-KcYfPxzklXlgxNVc0oYItTWof2ig5VsBGJI7BnjISXQoZ_I8Bg/exec` |
|
