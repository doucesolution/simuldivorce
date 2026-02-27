# ⚡ Frontend — Configuration Vite (vite.config.ts)

## Description

Vite est le **bundler et serveur de développement** du frontend. Ce fichier configure Vite avec deux plugins personnalisés et le plugin React officiel.

**Chemin :** `frontend/vite.config.ts`

---

## Plugins configurés

### 1. `react()` — Plugin React officiel

Active le support JSX/TSX, le Fast Refresh (HMR en développement), et l'intégration Babel/SWC.

### 2. `versionJsonPlugin()` — Plugin personnalisé

Génère un fichier `dist/version.json` à chaque build contenant un hash unique (UUID v4) et un horodatage.

```json
{
  "buildHash": "a1b2c3d4-e5f6-...",
  "builtAt": "2026-02-27T14:30:00.000Z"
}
```

**Utilisé par :** Le composant `VersionChecker` qui compare le hash local avec celui du serveur pour détecter les nouveaux déploiements et inviter l'utilisateur à rafraîchir.

### 3. `spaRoutesPlugin()` — Plugin personnalisé

Copie `index.html` dans un sous-dossier pour chaque route SPA :

```
dist/
├── index.html              ← Page principale
├── 404.html                ← Fallback GitHub Pages
├── disclaimer/index.html   ← Copie de index.html
├── dashboard/index.html    ← Copie de index.html
├── export/index.html       ← Copie de index.html
└── ...
```

**Pourquoi ?** GitHub Pages (hébergement statique) retourne une erreur 404 pour les URLs comme `/dashboard`. En créant un `index.html` dans chaque sous-dossier, GitHub Pages retourne un 200, et React Router prend le relais côté client.

---

## Routes pré-rendues

```typescript
const routes = [
  "disclaimer",
  "guide",
  "methodology",
  "glossary",
  "privacy",
  "terms",
  "prestation-compensatoire",
  "informations-debiteur",
  "informations-creancier",
  "recapitulatif",
  "dashboard",
  "export",
  "transition",
];
```

### Comment ajouter une nouvelle route :

1. Ajouter la route dans `App.tsx` (`<Route path="/ma-route" .../>`)
2. Ajouter `"ma-route"` dans le tableau `routes` de `spaRoutesPlugin()` dans `vite.config.ts`
3. Rebuild : `npm run build`

---

## Configuration du serveur de développement

```typescript
export default defineConfig({
  plugins: [react(), versionJsonPlugin(), spaRoutesPlugin()],
  server: {
    port: 5173, // Port par défaut
    host: true, // Accessible sur le réseau local
  },
});
```
