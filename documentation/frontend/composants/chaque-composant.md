# 🧩 Détail de chaque composant

## 1. AdUnit — Publicités Google AdSense

**Fichier :** `frontend/src/components/AdUnit.tsx` (~135 lignes)

### Fonctionnement

- Charge dynamiquement le script AdSense (une seule fois, globalement)
- Attend 300ms après le chargement pour pousser l'ad slot
- S'affiche uniquement si `shouldShowAds()` retourne `true` (utilisateurs free)
- Les utilisateurs premium sur l'app native ne voient pas de publicités

### Props

```typescript
interface AdUnitProps {
  type: "banner" | "native" | "rectangle";
  className?: string;
}
```

### Types de publicité

| Type        | Format            | Taille      | Usage                   |
| ----------- | ----------------- | ----------- | ----------------------- |
| `banner`    | Horizontal        | 100% × 50px | Haut/bas de page        |
| `native`    | Fluid (adaptatif) | Auto        | Dans le contenu         |
| `rectangle` | Auto              | 300×250px   | Sidebar, entre sections |

### Configuration

Le client AdSense est lu depuis `import.meta.env.VITE_ADSENSE_CLIENT`.

---

## 2. CurrencyInput — Champ monétaire formaté

**Fichier :** `frontend/src/components/CurrencyInput.tsx` (~65 lignes)

### Fonctionnement

- Affiche le nombre avec séparateurs de milliers : `100000` → `100 000`
- Utilise des espaces insécables (`\u00A0`) pour éviter les retours à la ligne
- Accepte uniquement les chiffres et un point décimal
- Le clavier mobile affiche `inputMode="decimal"`

### Props

```typescript
interface CurrencyInputProps {
  value: string; // Valeur brute (ex: "100000")
  onValueChange: (raw: string) => void; // Callback avec valeur nettoyée
  // + tous les attributs HTML standard d'un <input>
}
```

### Utilitaires internes

- `formatWithSpaces(raw)` — Ajoute les espaces de milliers pour l'affichage
- `stripSpaces(formatted)` — Supprime les espaces et remplace `,` par `.` pour la valeur brute

---

## 3. Footer — Pied de page

**Fichier :** `frontend/src/components/Footer.tsx` (~100 lignes)

### Contenu

- Nom de marque "SimulDivorce"
- Copyright dynamique (année courante)
- Tagline : "Simulateur de divorce gratuit — prestation compensatoire"
- Liens de navigation : Guide, Confidentialité, CGU, Sources & Méthodologie, Lexique
- Mention EU AI Act

### SEO

Utilise les attributs Schema.org `itemScope` et `itemType="WPFooter"`.

---

## 4. GuidedHeaderTour — Tour guidé du header

**Fichier :** `frontend/src/components/GuidedHeaderTour.tsx` (~467 lignes)

### Fonctionnement

Ce composant affiche un **tour guidé interactif** la première fois que l'utilisateur active le mode guidé. Il met en surbrillance les boutons du header un par un.

### Les 5 étapes

1. **Retour** — Bouton de retour dans le header sticky
2. **Accueil** — Bouton d'accueil
3. **Guide** — Toggle du mode guidé
4. **Thème** — Toggle clair/sombre
5. **Valider** — Bouton de validation

### Mécanisme

- Mesure les `boundingClientRect` des éléments ciblés
- Dessine un overlay SVG avec un "trou" découpé autour de l'élément actif
- Affiche un tooltip explicatif
- Animation pulse/ring sur l'élément ciblé
- S'affiche une seule fois par session (`sessionStorage.guidedHeaderTourShown`)

---

## 5. GuidedModeToggle — Bouton flottant mode guidé

**Fichier :** `frontend/src/components/GuidedModeToggle.tsx` (~175 lignes)

### Fonctionnement

- Bouton flottant en bas à droite (via `createPortal`)
- Icône `BookOpen` quand guidé, `EyeOff` quand libre
- **Activer** → immédiat + reset des tooltips dismissés (sessionStorage)
- **Désactiver** → modale de confirmation avant de basculer

### Pages masquées

Le toggle est masqué sur la page d'accueil (`/`) et partiellement sur `/disclaimer` (masqué desktop, visible mobile).

---

## 6. GuidedStep (GuidedTooltip) — Révélation séquentielle

**Fichier :** `frontend/src/components/GuidedTooltip.tsx` (~219 lignes)

### Fonctionnement

En mode guidé, les champs de formulaire sont révélés un par un :

- **Étape active** : visible, interactive, avec tooltip explicatif
- **Étapes futures** : floues (`blur`) et non-interactives
- **Étapes passées** : normales

### Auto-avance

Quand `isComplete` passe de `false` à `true` (l'utilisateur a rempli le champ), le composant avance automatiquement après 600ms.

### Props

```typescript
interface GuidedStepProps {
  step: number; // Index de cette étape (0-based)
  currentStep: number; // Étape active courante
  totalSteps: number; // Total d'étapes sur cette page
  onAdvance: () => void; // Callback pour avancer
  content: string; // Texte explicatif du tooltip
  stepLabel?: string; // Label court (ex: "Date de mariage")
  isComplete?: boolean; // Le champ est-il rempli ?
  children: ReactNode; // Les éléments de formulaire wrappés
}
```

---

## 7. InfoTooltip — Aide contextuelle modale

**Fichier :** `frontend/src/components/InfoTooltip.tsx` (~200 lignes)

### Fonctionnement

- Icône ℹ️ cliquable (optionnellement avec un label texte)
- Au clic → modale plein écran via `createPortal`
- Backdrop sombre avec blur, contenu scrollable
- Fermeture par clic sur le backdrop ou bouton ✕
- Verrouille le scroll du body quand ouvert

### Props

```typescript
interface InfoTooltipProps {
  content: string; // Texte d'information à afficher
  label?: string; // Texte optionnel à côté de l'icône
}
```

---

## 8. OfflineIndicator — Bannière hors-ligne

**Fichier :** `frontend/src/components/OfflineIndicator.tsx` (~55 lignes)

### Fonctionnement

- Écoute les événements `window.online` / `window.offline`
- Affiche une bannière ambre fixe en haut quand hors-ligne
- Message : "Hors ligne — les données locales restent accessibles"
- Icône `WifiOff` de Lucide
- Respecte le `safe-area-inset-top` pour les iPhone à encoche

---

## 9. SEO — Gestion du référencement

**Fichier :** `frontend/src/components/SEO.tsx` (~298 lignes)

### Fonctionnement

Composant invisible qui gère dynamiquement dans le `<head>` :

- **Title** : `{titre page} | SimulDivorce`
- **Meta description** : description unique par page
- **Canonical URL** : `https://simuldivorce.fr{path}`
- **Open Graph** : og:title, og:description, og:image, og:url, og:type
- **Twitter Card** : summary_large_image
- **Robots** : index/noindex selon la page
- **JSON-LD** : données structurées Schema.org

### Props

```typescript
interface SEOProps {
  title: string; // Titre de la page
  description?: string; // Meta description
  path?: string; // Chemin canonical (ex: "/guide")
  type?: "website" | "article";
  noindex?: boolean; // Bloquer l'indexation
  jsonLd?: Record<string, unknown>; // Données structurées
}
```

### Constantes

- `SITE_NAME = "SimulDivorce"`
- `SITE_URL = "https://simuldivorce.fr"`
- `LOCALE = "fr_FR"`

---

## 10. ThemeToggle — Bouton clair/sombre

**Fichier :** `frontend/src/components/ThemeToggle.tsx` (~95 lignes)

### Fonctionnement

- Détecte le préférence OS via `prefers-color-scheme: dark`
- Bascule les classes `dark` / `light` sur `<html>`
- Met à jour la balise `<meta name="theme-color">` pour Chrome
- Écoute les changements de préférence système en temps réel
- Rendu via `createPortal(document.body)`

### Icônes

- Mode sombre → ☀️ Sun (pour passer en clair)
- Mode clair → 🌙 Moon (pour passer en sombre)

---

## 11. VersionChecker — Détection de mise à jour

**Fichier :** `frontend/src/components/VersionChecker.tsx` (~274 lignes)

### Fonctionnement

Composant invisible qui détecte les nouvelles versions déployées :

1. **Au chargement** : Fetch `/version.json` avec cache-busting agressif
2. **Première visite** : Stocke le hash dans `localStorage.appBuildHash`
3. **Version périmée au chargement** : Navigue vers une URL cache-bustée (`?_v=timestamp`)
4. **Nouvelle version en session** : Affiche une bannière non-intrusive
5. **Vérification régulière** : Toutes les 5 minutes + quand l'onglet reprend le focus

### Stratégie anti-boucle

Utilise `sessionStorage.appVersionReloading` pour éviter les boucles infinies de rechargement si le CDN sert encore l'ancienne version.

### Bannière

Si un rechargement automatique n'est pas possible, une bannière s'affiche :

> "Nouvelle version disponible" avec un bouton "Mettre à jour"

---

## Comment ajouter un nouveau composant

Voir le guide détaillé : [../../guides/ajout-nouveau-composant.md](../../guides/ajout-nouveau-composant.md)
