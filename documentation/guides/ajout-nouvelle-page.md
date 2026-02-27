# ➕ Guide : Ajouter une nouvelle page

## Prérequis

- Node.js installé
- Le projet frontend fonctionne (`npm run dev`)

---

## Étapes

### 1. Créer le fichier de la page

Créer un nouveau fichier dans `frontend/src/pages/` :

```tsx
// frontend/src/pages/MaNouvellePage.tsx

import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Home } from "lucide-react";
import { SEO, breadcrumbJsonLd } from "../components/SEO";
import { AdUnit } from "../components/AdUnit";
import Footer from "../components/Footer";

const MaNouvellePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col text-[var(--text-primary)] transition-colors duration-300">
      {/* SEO */}
      <SEO
        title="Ma Nouvelle Page"
        description="Description pour les moteurs de recherche (max 155 caractères)"
        path="/ma-nouvelle-page"
        jsonLd={breadcrumbJsonLd([
          { name: "Accueil", path: "/" },
          { name: "Ma Nouvelle Page", path: "/ma-nouvelle-page" },
        ])}
      />

      {/* Header sticky */}
      <div className="sticky top-0 z-50 flex items-center gap-1 p-2 bg-[var(--bg-primary)]/80 backdrop-blur-md border-b border-[var(--border-color)]">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg hover:bg-[var(--bg-secondary)]"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => navigate("/")}
          className="p-2 rounded-lg hover:bg-[var(--bg-secondary)]"
        >
          <Home className="w-5 h-5" />
        </button>
      </div>

      {/* Contenu principal */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Ma Nouvelle Page</h1>
        <p>Contenu ici...</p>
      </main>

      {/* Publicité (optionnel) */}
      <AdUnit type="native" className="my-4" />

      <Footer />
    </div>
  );
};

export default MaNouvellePage;
```

---

### 2. Ajouter la route dans App.tsx

Ouvrir `frontend/src/App.tsx` et ajouter un import lazy + une route :

```tsx
// En haut du fichier, avec les autres imports lazy
const MaNouvellePage = lazy(() => import("./pages/MaNouvellePage"));

// Dans le <Routes>, ajouter :
<Route path="/ma-nouvelle-page" element={<MaNouvellePage />} />;
```

---

### 3. Ajouter dans le sitemap (si indexable)

Si la page doit être référencée par Google, l'ajouter dans `frontend/public/sitemap.xml` :

```xml
<url>
    <loc>https://simuldivorce.fr/ma-nouvelle-page</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
</url>
```

---

### 4. Ajouter dans le plugin SPA routes (pour le pré-rendering)

Si la page doit être gérée par le SPA routing, vérifier `frontend/vite.config.ts` dans le plugin `spaRoutes` :

```typescript
const SPA_ROUTES = [
  "/",
  "/disclaimer",
  // ... autres routes ...
  "/ma-nouvelle-page", // ← Ajouter ici
];
```

---

### 5. Ajouter un lien (optionnel)

Dans le Footer, une barre de navigation, ou une autre page :

```tsx
<Link to="/ma-nouvelle-page">Ma Nouvelle Page</Link>
```

---

### 6. Ajouter dans le parcours wizard (si c'est une étape)

Si la page fait partie du parcours de saisie (wizard) :

1. **`divorceFormStore.ts`** — Ajouter dans la liste des pages du wizard :

   ```typescript
   const WIZARD_PAGES = [
     "/prestation-compensatoire",
     "/informations-debiteur",
     "/informations-creancier",
     "/ma-nouvelle-page", // ← Ajouter ici
     "/recapitulatif",
   ];
   ```

2. Mettre à jour `getNextPage()` et `getPreviousPage()` si nécessaire.

---

## Checklist

- [ ] Fichier créé dans `src/pages/`
- [ ] Route ajoutée dans `App.tsx`
- [ ] `<SEO />` configuré avec title, description, path
- [ ] Sitemap mis à jour (si indexable)
- [ ] Plugin SPA routes mis à jour
- [ ] Lien ajouté quelque part dans l'UI
- [ ] Documentation mise à jour
