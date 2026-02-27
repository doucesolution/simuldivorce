# 🏗️ Architecture Générale de SimulDivorce

## Vue d'ensemble

SimulDivorce est une application **full-stack** composée de trois grandes parties :

```
┌─────────────────────────────────────────────────────────────┐
│                    UTILISATEUR                               │
│                (Navigateur / App Android)                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
        ▼                             ▼
┌───────────────┐           ┌──────────────────┐
│   FRONTEND    │           │     BACKEND      │
│  React + TS   │ ──HTTP──▶ │    Go + Gin      │
│  (Vite build) │           │  (API REST)      │
│  Port 5173    │           │  Port 8080       │
└───────┬───────┘           └──────┬───────────┘
        │                          │
        │                          ├──▶ Google Apps Script
        │                          │    (Upload Drive)
        │                          │
        │                          └──▶ Make.com Webhook
        │                               (Envoi emails)
        │
        ├── localStorage (données formulaire)
        ├── jsPDF (génération PDF côté client)
        └── docx (génération Word côté client)
```

---

## Les 3 grandes parties

### 1. 🖥️ Frontend (React + TypeScript)

**Dossier :** `frontend/`

L'interface utilisateur, construite avec :

- **React 19** — Framework UI avec composants fonctionnels et hooks
- **TypeScript** — Typage statique pour la fiabilité du code
- **Vite 7** — Bundler ultra-rapide avec Hot Module Replacement (HMR)
- **Tailwind CSS 4** — Framework CSS utilitaire
- **React Router 7** — Navigation SPA (Single Page Application)

**Responsabilités :**

- Afficher l'interface utilisateur (formulaires, résultats, graphiques)
- Collecter les données financières des deux époux
- Calculer la prestation compensatoire (3 méthodes) **côté client**
- Générer les PDF et Word **côté client** (pas de serveur nécessaire pour le calcul)
- Stocker les données temporairement dans `localStorage`

### 2. ⚙️ Backend (Go + Gin)

**Dossier :** `backend/`

Le serveur API, construit avec :

- **Go 1.24** — Langage compilé performant et sécurisé
- **Gin** — Framework HTTP léger pour Go

**Responsabilités :**

- Fournir les constantes légales (`/api/config` : SMIC, taux d'imposition)
- Uploader les documents Word vers Google Drive (`/api/deliver`)
- Envoyer les demandes de méthodologie par email (`/api/methodology-request`)
- Appliquer le rate limiting (protection contre les abus)
- Gérer les CORS (sécurité cross-origin)

### 3. 📱 Application Android (Capacitor)

**Dossier :** `frontend/android/`

L'application native Android, construite avec :

- **Capacitor 8** — Bridge web-to-native
- **Gradle** — Build system Android

**Responsabilités :**

- Encapsuler le frontend React dans une WebView Android native
- Permettre la distribution sur le Google Play Store
- Activer le mode "Avocat" (fonctionnalités professionnelles)

---

## Flux de données principal

```
1. SAISIE DES DONNÉES
   Utilisateur → Pages formulaire (Prestation, Débiteur, Créancier)
                  → Stockage dans localStorage (divorceFormStore)

2. CALCUL
   localStorage → legalEngine.calculate()
                   → 3 méthodes de calcul simultanées
                   → SimulationResult (montants, ranges, détails)

3. AFFICHAGE DES RÉSULTATS
   SimulationResult → DashboardPage (tableau de bord)
                      → Graphiques, tableaux comparatifs

4. EXPORT
   SimulationResult → pdfGenerator (PDF gratuit)
                    → wordGenerator (Word, mode avocat)
                    → Backend API → Google Drive + Email
```

---

## Modes de l'application

| Mode                 | Plateforme            | Fonctionnalités                                                                                  |
| -------------------- | --------------------- | ------------------------------------------------------------------------------------------------ |
| **Client (gratuit)** | Web (simuldivorce.fr) | Simulation, export PDF, publicités AdSense                                                       |
| **Avocat (Pro)**     | App Android native    | Simulation, export Word professionnel, profil avocat, identité des parties, pas de pub (premium) |

La détection se fait via `platform.ts` qui utilise Capacitor pour savoir si l'app tourne en natif ou dans un navigateur.

---

## Technologies utilisées

| Technologie  | Version | Rôle                               |
| ------------ | ------- | ---------------------------------- |
| React        | 19.2    | Interface utilisateur              |
| TypeScript   | 5.9     | Typage statique                    |
| Vite         | 7.2     | Bundler / serveur de développement |
| Tailwind CSS | 4.1     | Styles utilitaires                 |
| React Router | 7.13    | Routage SPA                        |
| Go           | 1.24    | Backend API                        |
| Gin          | 1.11    | Framework HTTP Go                  |
| Capacitor    | 8.1     | Bridge web → native Android        |
| jsPDF        | 4.0     | Génération PDF côté client         |
| docx         | 9.6     | Génération Word côté client        |
| lucide-react | 0.563   | Icônes SVG                         |
| Docker       | —       | Conteneurisation                   |

---

## Ports et URLs

| Service            | Port | URL locale              |
| ------------------ | ---- | ----------------------- |
| Frontend (dev)     | 5173 | http://localhost:5173   |
| Frontend (preview) | 4173 | http://localhost:4173   |
| Backend            | 8080 | http://localhost:8080   |
| Production         | 443  | https://simuldivorce.fr |
