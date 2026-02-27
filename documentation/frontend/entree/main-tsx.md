# 🚀 Frontend — Point d'entrée (main.tsx)

## Description

`main.tsx` est le **tout premier fichier JavaScript** exécuté par l'application React. Il monte l'application dans le DOM du navigateur.

**Chemin :** `frontend/src/main.tsx`

---

## Ce qu'il fait (3 lignes essentielles)

```tsx
import { BrowserRouter } from "react-router-dom";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
```

### Décomposition :

1. **`createRoot(document.getElementById("root"))`** — Trouve la `<div id="root">` dans `index.html` et crée un root React.

2. **`<StrictMode>`** — Active des vérifications supplémentaires en développement (double-rendu, détection d'effets de bord). Désactivé automatiquement en production.

3. **`<BrowserRouter>`** — Active le routage SPA basé sur l'URL du navigateur. Tous les `<Link>` et `useNavigate()` de l'app fonctionnent grâce à ce wrapper.

4. **`<App />`** — Le composant racine qui contient toutes les routes et la mise en page globale.

---

## Lien avec index.html

Le fichier `index.html` (à la racine de `frontend/`) contient :

```html
<div id="root"></div>
<script type="module" src="/src/main.tsx"></script>
```

C'est le point de connexion entre le HTML statique et l'application React.
