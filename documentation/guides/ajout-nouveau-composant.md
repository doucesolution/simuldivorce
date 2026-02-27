# 🧩 Guide : Ajouter un nouveau composant

## Prérequis

- Node.js installé
- Le projet frontend fonctionne (`npm run dev`)

---

## Étapes

### 1. Créer le fichier du composant

Créer un nouveau fichier dans `frontend/src/components/` :

```tsx
// frontend/src/components/MonComposant.tsx

import React from "react";

// Interface des props
interface MonComposantProps {
  titre: string;
  description?: string;
  children?: React.ReactNode;
}

// Le composant
export const MonComposant: React.FC<MonComposantProps> = ({
  titre,
  description,
  children,
}) => {
  return (
    <div className="p-4 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)]">
      <h3 className="text-lg font-bold text-[var(--text-primary)]">{titre}</h3>
      {description && (
        <p className="text-sm text-[var(--text-muted)] mt-1">{description}</p>
      )}
      {children && <div className="mt-3">{children}</div>}
    </div>
  );
};
```

---

### 2. Conventions de nommage

| Élément         | Convention                    | Exemple                     |
| --------------- | ----------------------------- | --------------------------- |
| Fichier         | PascalCase + `.tsx`           | `MonComposant.tsx`          |
| Composant       | PascalCase                    | `MonComposant`              |
| Props interface | PascalCase + `Props`          | `MonComposantProps`         |
| Export          | Named export (`export const`) | `export const MonComposant` |

> **Exception :** Les composants qui sont des `default export` sont ceux utilisés dans les `lazy()` imports (Footer, ThemeToggle, OfflineIndicator).

---

### 3. Patterns de styling

L'application utilise des **CSS custom properties** pour le theming :

```tsx
// ✅ Correct — utilise les variables CSS (fonctionne en dark/light)
className = "bg-[var(--bg-secondary)] text-[var(--text-primary)]";

// ❌ Incorrect — couleurs fixes (ne s'adapte pas au thème)
className = "bg-white text-black";
```

Variables disponibles (définies dans `index.css`) :

- `--bg-primary`, `--bg-secondary`, `--bg-tertiary`
- `--text-primary`, `--text-secondary`, `--text-muted`
- `--accent-primary`, `--accent-hover`
- `--border-color`

---

### 4. Utiliser le composant

```tsx
import { MonComposant } from "../components/MonComposant";

// Dans le JSX :
<MonComposant titre="Mon titre" description="Une description optionnelle">
  <p>Contenu enfant</p>
</MonComposant>;
```

---

### 5. Composant avec Portal (flottant)

Si le composant doit être positionné en dehors de la hiérarchie DOM (bouton flottant, modale) :

```tsx
import { createPortal } from "react-dom";

export const MonBoutonFlottant: React.FC = () => {
  return createPortal(
    <button className="fixed bottom-4 right-4 z-[9998] ...">Mon bouton</button>,
    document.body,
  );
};
```

---

### 6. Composant avec état localStorage

Si le composant doit persister son état :

```tsx
const [valeur, setValeur] = useState(() => {
  const saved = localStorage.getItem("maClé");
  return saved || "défaut";
});

const updateValeur = (v: string) => {
  setValeur(v);
  localStorage.setItem("maClé", v);
};
```

---

## Checklist

- [ ] Fichier créé dans `src/components/`
- [ ] Interface props TypeScript définie
- [ ] Variables CSS pour le theming (pas de couleurs en dur)
- [ ] Responsive (mobile-first avec breakpoints `sm:`, `md:`, `lg:`)
- [ ] Attributs `aria-label` pour l'accessibilité (si bouton/interactif)
- [ ] Documentation mise à jour
