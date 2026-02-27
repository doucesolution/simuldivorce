# 🗺️ Frontend — Routage principal (App.tsx)

## Description

`App.tsx` est le **composant racine** de l'application. Il définit toutes les routes (URLs) et les composants globaux visibles sur chaque page.

**Chemin :** `frontend/src/App.tsx`

---

## Structure

```tsx
<GuidedModeProvider>          ← Contexte du mode guidé
    <ScrollToTop />           ← Scroll en haut à chaque navigation
    <OfflineIndicator />      ← Indicateur hors-ligne
    <VersionChecker />        ← Détection de nouvelle version
    <Suspense fallback={...}> ← Spinner pendant le chargement des pages
        <Routes>
            <Route path="/" ... />
            <Route path="/disclaimer" ... />
            <!-- ... toutes les routes ... -->
        </Routes>
    </Suspense>
    <ThemeToggle />           ← Bouton dark/light mode
    <GuidedModeToggle />      ← Bouton mode guidé
</GuidedModeProvider>
```

---

## Toutes les routes

### Pages informatives

| URL            | Page            | Description                                 |
| -------------- | --------------- | ------------------------------------------- |
| `/`            | LandingPage     | Page d'accueil (chargement eager, pas lazy) |
| `/disclaimer`  | DisclaimerPage  | Avertissement légal avant simulation        |
| `/guide`       | GuidePage       | Guide d'utilisation                         |
| `/methodology` | MethodologyPage | Explication des méthodes de calcul          |
| `/glossary`    | GlossaryPage    | Glossaire des termes juridiques             |
| `/privacy`     | PrivacyPage     | Politique de confidentialité                |
| `/terms`       | TermsPage       | Conditions d'utilisation                    |

### Pages de saisie (formulaire)

| URL                         | Page                        | Description                      |
| --------------------------- | --------------------------- | -------------------------------- |
| `/prestation-compensatoire` | PrestationCompensatoirePage | Paramètres du mariage/famille    |
| `/informations-debiteur`    | DebiteurPage                | Données financières du débiteur  |
| `/informations-creancier`   | CreancierPage               | Données financières du créancier |
| `/recapitulatif`            | RecapitulatifPage           | Résumé avant calcul              |

### Pages de résultat

| URL           | Page               | Description               |
| ------------- | ------------------ | ------------------------- |
| `/dashboard`  | DashboardPage      | Résultats de simulation   |
| `/export`     | ExportPage         | Export PDF / partage      |
| `/transition` | InterstitialAdPage | Page interstitielle (pub) |

### Pages avocat (Pro)

| URL                 | Page               | Description                |
| ------------------- | ------------------ | -------------------------- |
| `/profil-avocat`    | LawyerProfilePage  | Profil professionnel       |
| `/identite-parties` | LawyerIdentityPage | Identités des deux parties |
| `/export-avocat`    | LawyerExportPage   | Export Word professionnel  |

---

## Concepts clés

### Lazy Loading

Toutes les pages sauf `LandingPage` sont chargées **à la demande** :

```tsx
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
```

Cela réduit la taille du bundle initial. Le `<Suspense>` affiche un spinner pendant le chargement.

### CenteredLayout

Wrapper commun qui centre le contenu et ajoute le `<Footer />` :

```tsx
<CenteredLayout>
  <MonPage /> ← Centré à 896px max + Footer en bas
</CenteredLayout>
```

### ScrollToTop

Composant invisible qui scrolle la fenêtre en haut à chaque changement de route (sinon la nouvelle page s'affiche au même scroll que l'ancienne).

---

## Comment ajouter une nouvelle route

1. **Créer la page** dans `frontend/src/pages/MaNouvellePage.tsx`
2. **Importer en lazy** dans `App.tsx` :
   ```tsx
   const MaNouvellePage = lazy(() => import("./pages/MaNouvellePage"));
   ```
3. **Ajouter la route** dans le `<Routes>` :
   ```tsx
   <Route
     path="/ma-nouvelle-page"
     element={
       <CenteredLayout>
         <MaNouvellePage />
       </CenteredLayout>
     }
   />
   ```
4. **Ajouter dans `spaRoutesPlugin()`** de `vite.config.ts` :
   ```typescript
   const routes = [..., "ma-nouvelle-page"];
   ```
