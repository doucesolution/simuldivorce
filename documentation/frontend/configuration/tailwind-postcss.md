# 🎨 Frontend — Tailwind CSS + PostCSS

## Description

**Tailwind CSS 4** est le framework CSS utilitaire utilisé pour le style de toute l'application. **PostCSS** est le processeur CSS qui intègre Tailwind dans la pipeline de build Vite.

---

## Fichiers de configuration

### `postcss.config.js`

```javascript
export default {
  plugins: {
    "@tailwindcss/postcss": {}, // Plugin PostCSS de Tailwind v4
  },
};
```

Ce fichier dit à PostCSS d'utiliser le plugin Tailwind CSS. En Tailwind v4, il n'y a plus besoin d'`autoprefixer` séparé — il est intégré.

### `tailwind.config.js`

```javascript
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: { extend: {} },
  plugins: [],
};
```

- **`content`** : Tailwind analyse ces fichiers pour trouver les classes utilisées et ne garder que celles-ci dans le CSS final (tree-shaking).
- **`theme.extend`** : Pour ajouter des couleurs, tailles, etc. personnalisées.

---

## Thème et couleurs personnalisées

Les couleurs personnalisées sont définies comme **CSS custom properties** dans `frontend/src/index.css` :

```css
:root {
  --color-deep-space: #0a0e1a; /* Fond très sombre */
  --color-stellar-blue: #1e3a5f; /* Bleu profond */
  --accent-primary: #14b8a6; /* Teal (accent principal) */
  --accent-secondary: #38bdf8; /* Sky blue (accent secondaire) */
  /* ... etc. */
}
```

Ces variables sont utilisées dans les classes Tailwind via `bg-[var(--color-deep-space)]` ou `text-[var(--accent-primary)]`.

---

## Comment ajouter une couleur personnalisée

1. **Ajouter la variable CSS** dans `frontend/src/index.css` :

   ```css
   :root {
     --ma-nouvelle-couleur: #ff6b35;
   }
   ```

2. **Utiliser dans les composants** :
   ```tsx
   <div className="bg-[var(--ma-nouvelle-couleur)]">Texte coloré</div>
   ```

Ou via `tailwind.config.js` (extension du thème) :

```javascript
theme: {
    extend: {
        colors: {
            'custom-orange': '#ff6b35',
        },
    },
},
```

Puis utiliser : `bg-custom-orange`.
