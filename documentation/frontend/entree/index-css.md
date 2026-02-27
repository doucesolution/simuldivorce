# 🎨 Frontend — Styles globaux (index.css)

## Description

`index.css` contient les **styles globaux** et le **système de thème** (light/dark mode) de l'application. Il utilise Tailwind CSS 4 via la directive `@import`.

**Chemin :** `frontend/src/index.css`

---

## Structure

```css
@import "tailwindcss"; /* Importe Tailwind CSS 4 */

:root {
  /* Variables du thème clair */
  --color-deep-space: #f0f0f0;
  --accent-primary: #14b8a6;
  /* ... */
}

:root.dark {
  /* Variables du thème sombre */
  --color-deep-space: #0a0e1a;
  --accent-primary: #14b8a6;
  /* ... */
}

/* Styles de base (body, scrollbar, animations) */
/* Animations personnalisées (@keyframes) */
```

---

## Système de thème (dark/light)

Le thème est contrôlé par la classe `dark` sur l'élément `<html>` :

- **Mode clair** : `<html>` sans classe → `:root` s'applique
- **Mode sombre** : `<html class="dark">` → `:root.dark` surcharge les variables

Le composant `ThemeToggle` ajoute/retire la classe `dark` et sauvegarde le choix dans `localStorage`.

### Variables de couleur principales

| Variable             | Usage             | Clair      | Sombre          |
| -------------------- | ----------------- | ---------- | --------------- |
| `--color-deep-space` | Fond de page      | Gris clair | Bleu très foncé |
| `--accent-primary`   | Couleur d'accent  | Teal       | Teal            |
| `--accent-secondary` | Accent secondaire | Sky blue   | Sky blue        |
| `--color-card`       | Fond des cartes   | Blanc      | Bleu foncé      |
| `--color-text`       | Texte principal   | Quasi-noir | Blanc           |

---

## Animations personnalisées

Le fichier définit plusieurs animations `@keyframes` :

| Animation        | Usage                                         |
| ---------------- | --------------------------------------------- |
| `fade-in`        | Apparition en douceur des pages/composants    |
| `fade-in-up`     | Apparition avec remontée (cartes, résultats)  |
| `pulse-soft`     | Pulsation douce (indicateurs)                 |
| `spin`           | Rotation infinie (spinner de chargement)      |
| `gradient-shift` | Dégradé animé (background de la landing page) |

---

## Comment modifier le thème

Pour changer une couleur :

1. Ouvrir `frontend/src/index.css`
2. Modifier la variable dans `:root` (clair) et/ou `:root.dark` (sombre)
3. La couleur sera automatiquement mise à jour partout où elle est référencée

Exemple — changer l'accent principal en violet :

```css
:root {
  --accent-primary: #8b5cf6; /* Violet au lieu de teal */
}
```
