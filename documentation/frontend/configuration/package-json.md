# 📦 Frontend — Dépendances npm (package.json)

## Description

Le `package.json` liste toutes les dépendances du projet frontend et les scripts npm disponibles.

**Chemin :** `frontend/package.json`

---

## Scripts disponibles

```bash
npm run dev       # Démarre le serveur Vite (hot reload, port 5173)
npm run build     # Compile TypeScript puis build Vite → dist/
npm run lint      # Lance ESLint pour vérifier la qualité du code
npm run preview   # Sert le dossier dist/ en local (port 4173)
```

---

## Dépendances de production

| Package                | Version  | Rôle                                              |
| ---------------------- | -------- | ------------------------------------------------- |
| `react`                | ^19.2.0  | Librairie UI (composants, hooks, Virtual DOM)     |
| `react-dom`            | ^19.2.0  | Rendu React dans le DOM navigateur                |
| `react-router-dom`     | ^7.13.0  | Routage SPA (navigation entre pages)              |
| `@capacitor/core`      | ^8.1.0   | Runtime Capacitor (détection plateforme)          |
| `@capacitor/cli`       | ^8.1.0   | CLI Capacitor (sync, copy, add)                   |
| `@capacitor/android`   | ^8.1.0   | Plateforme Android pour Capacitor                 |
| `@tailwindcss/postcss` | ^4.1.18  | Plugin PostCSS pour Tailwind CSS 4                |
| `docx`                 | ^9.6.0   | Génération de fichiers Word (.docx) côté client   |
| `file-saver`           | ^2.0.5   | Déclencher le téléchargement de fichiers (saveAs) |
| `jspdf`                | ^4.0.0   | Génération de PDF côté client                     |
| `lucide-react`         | ^0.563.0 | Icônes SVG (Scale, Download, ChevronLeft, etc.)   |

---

## Dépendances de développement

| Package                       | Version  | Rôle                                                     |
| ----------------------------- | -------- | -------------------------------------------------------- |
| `vite`                        | ^7.2.4   | Bundler + serveur de développement                       |
| `@vitejs/plugin-react`        | ^5.1.1   | Support React pour Vite (JSX, HMR)                       |
| `typescript`                  | ~5.9.3   | Compilateur TypeScript                                   |
| `tailwindcss`                 | ^4.1.18  | Framework CSS utilitaire                                 |
| `postcss`                     | ^8.5.6   | Processeur CSS (pipeline Tailwind)                       |
| `autoprefixer`                | ^10.4.24 | Ajout automatique de préfixes CSS vendeurs               |
| `eslint`                      | ^9.39.1  | Linter JavaScript/TypeScript                             |
| `eslint-plugin-react-hooks`   | ^7.0.1   | Règles ESLint pour les hooks React                       |
| `eslint-plugin-react-refresh` | ^0.4.24  | Règles ESLint pour React Fast Refresh                    |
| `typescript-eslint`           | ^8.46.4  | Plugin ESLint pour TypeScript                            |
| `globals`                     | ^16.5.0  | Définitions de globales JS (browser, node)               |
| `@types/react`                | ^19.2.5  | Types TypeScript pour React                              |
| `@types/react-dom`            | ^19.2.3  | Types TypeScript pour ReactDOM                           |
| `@types/file-saver`           | ^2.0.7   | Types TypeScript pour file-saver                         |
| `@types/node`                 | ^24.10.1 | Types TypeScript pour Node.js (utilisé par Vite plugins) |

---

## Comment ajouter une dépendance

```bash
# Dépendance de production
npm install ma-librairie

# Dépendance de développement uniquement
npm install --save-dev ma-librairie-dev
```
