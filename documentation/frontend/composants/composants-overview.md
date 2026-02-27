# 🧩 Vue d'ensemble des composants

## Description

Le dossier `frontend/src/components/` contient les **composants réutilisables** de l'application. Ces composants sont utilisés par les pages mais ne sont pas des pages eux-mêmes.

**Chemin :** `frontend/src/components/`

---

## Liste des composants

| Composant            | Fichier                | Rôle                                                  |
| -------------------- | ---------------------- | ----------------------------------------------------- |
| **AdUnit**           | `AdUnit.tsx`           | Affichage des publicités Google AdSense               |
| **CurrencyInput**    | `CurrencyInput.tsx`    | Champ de saisie monétaire formaté                     |
| **Footer**           | `Footer.tsx`           | Pied de page avec liens de navigation                 |
| **GuidedHeaderTour** | `GuidedHeaderTour.tsx` | Tour guidé des boutons du header                      |
| **GuidedModeToggle** | `GuidedModeToggle.tsx` | Bouton flottant pour activer/désactiver le mode guidé |
| **GuidedTooltip**    | `GuidedTooltip.tsx`    | Révélation séquentielle des champs en mode guidé      |
| **InfoTooltip**      | `InfoTooltip.tsx`      | Icône ℹ️ avec modale d'information                    |
| **OfflineIndicator** | `OfflineIndicator.tsx` | Bannière "Hors ligne"                                 |
| **SEO**              | `SEO.tsx`              | Gestion des balises meta, Open Graph, JSON-LD         |
| **ThemeToggle**      | `ThemeToggle.tsx`      | Bouton flottant pour changer le thème clair/sombre    |
| **VersionChecker**   | `VersionChecker.tsx`   | Détection de nouvelles versions et rechargement       |

---

## Architecture des composants

```
App.tsx
  │
  ├── <OfflineIndicator />      ← Bannière fixe en haut
  ├── <VersionChecker />        ← Invisible, logique en background
  ├── <ThemeToggle />           ← Bouton flottant (portal → body)
  ├── <GuidedModeToggle />      ← Bouton flottant (portal → body)
  │
  ├── <Header>                  ← Header sticky avec navigation
  │     └── <GuidedHeaderTour /> ← Tour guidé au 1er lancement
  │
  ├── <Routes>
  │     └── <Page>              ← Chaque page utilise :
  │           ├── <SEO />       ← Balises meta pour la page
  │           ├── <CurrencyInput /> ← Saisie des montants
  │           ├── <InfoTooltip />   ← Aide contextuelle
  │           ├── <GuidedStep />    ← Révélation séquentielle
  │           └── <AdUnit />        ← Publicités
  │
  └── <Footer />                ← Pied de page global
```

---

## Patterns communs

### Portals React

Les composants **ThemeToggle**, **GuidedModeToggle**, et **InfoTooltip** utilisent `createPortal(document.body)` pour s'affranchir des contraintes CSS des parents (`overflow: hidden`, `z-index`).

### Composants contrôlés

**CurrencyInput** est un composant contrôlé : il reçoit `value` et `onValueChange` du parent.

### Side-effects only

**SEO** et **VersionChecker** ne rendent rien visuellement (`return null`) — ils ne font que des side-effects (modification du DOM, fetch).
