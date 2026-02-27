# 📄 Vue d'ensemble des pages

## Description

Le dossier `frontend/src/pages/` contient les **17 pages** de l'application. Chaque page est un composant React qui représente un écran complet avec sa propre route.

**Chemin :** `frontend/src/pages/`

---

## Liste des pages

### Pages principales (parcours utilisateur)

| #   | Page          | Fichier                           | Route                       | Rôle                                 |
| --- | ------------- | --------------------------------- | --------------------------- | ------------------------------------ |
| 1   | Landing       | `LandingPage.tsx`                 | `/`                         | Page d'accueil / Hero                |
| 2   | Disclaimer    | `DisclaimerPage.tsx`              | `/disclaimer`               | Avertissements légaux (5 checkboxes) |
| 3   | Prestation    | `PrestationCompensatoirePage.tsx` | `/prestation-compensatoire` | Saisie mariage/famille               |
| 4   | Débiteur      | `DebiteurPage.tsx`                | `/informations-debiteur`    | Données financières débiteur         |
| 5   | Créancier     | `CreancierPage.tsx`               | `/informations-creancier`   | Données financières créancier        |
| 6   | Récapitulatif | `RecapitulatifPage.tsx`           | `/recapitulatif`            | Résumé avant calcul                  |
| 7   | Interstitiel  | `InterstitialAdPage.tsx`          | `/transition`               | Page de transition avec pub          |
| 8   | Dashboard     | `DashboardPage.tsx`               | `/dashboard`                | Résultats des 3 méthodes             |
| 9   | Export        | `ExportPage.tsx`                  | `/export`                   | Export PDF + suppression données     |

### Pages avocat (mode Pro)

| #   | Page             | Fichier                  | Route               | Rôle                      |
| --- | ---------------- | ------------------------ | ------------------- | ------------------------- |
| 10  | Profil avocat    | `LawyerProfilePage.tsx`  | `/profil-avocat`    | Identité du cabinet       |
| 11  | Identité parties | `LawyerIdentityPage.tsx` | `/identite-parties` | Noms/adresses des parties |
| 12  | Export avocat    | `LawyerExportPage.tsx`   | `/export-avocat`    | Export Word + livraison   |

### Pages informatives

| #   | Page            | Fichier               | Route          | Rôle                          |
| --- | --------------- | --------------------- | -------------- | ----------------------------- |
| 13  | Guide           | `GuidePage.tsx`       | `/guide`       | Préparation avant simulation  |
| 14  | Glossaire       | `GlossaryPage.tsx`    | `/glossary`    | Lexique des termes juridiques |
| 15  | Méthodologie    | `MethodologyPage.tsx` | `/methodology` | Sources et formules de calcul |
| 16  | Confidentialité | `PrivacyPage.tsx`     | `/privacy`     | Politique de confidentialité  |
| 17  | CGU             | `TermsPage.tsx`       | `/terms`       | Conditions d'utilisation      |

---

## Taille des pages

| Page                        | Lignes | Complexité |
| --------------------------- | ------ | ---------- |
| MethodologyPage             | 702    | ★★★★★      |
| CreancierPage               | 689    | ★★★★       |
| PrestationCompensatoirePage | 661    | ★★★★       |
| DebiteurPage                | 641    | ★★★★       |
| RecapitulatifPage           | 607    | ★★★★       |
| GuidedHeaderTour            | 467    | ★★★        |
| LawyerExportPage            | 424    | ★★★        |
| LawyerProfilePage           | 386    | ★★★        |
| PrivacyPage                 | 354    | ★★★        |
| DisclaimerPage              | 344    | ★★★        |
| LawyerIdentityPage          | 329    | ★★★        |
| TermsPage                   | 301    | ★★★        |
| GlossaryPage                | 299    | ★★★        |
| DashboardPage               | 293    | ★★★        |
| ExportPage                  | 284    | ★★★        |
| VersionChecker              | 274    | ★★         |
| InterstitialAdPage          | 250    | ★★         |
| LandingPage                 | 250    | ★★         |
| GuidePage                   | 199    | ★★         |

---

## Patterns communs à toutes les pages

### Structure type

```tsx
const MaPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
      <SEO title="..." description="..." path="..." />

      {/* Header sticky avec navigation */}
      <div className="sticky top-0 z-50 ...">
        <button onClick={() => navigate(-1)}>← Retour</button>
        <button onClick={() => navigate("/")}>🏠</button>
      </div>

      {/* Contenu principal */}
      <main className="flex-1 max-w-7xl mx-auto px-4">{/* ... */}</main>

      <Footer />
    </div>
  );
};
```

### Composants utilisés partout

- `<SEO />` — Meta tags + JSON-LD
- `<AdUnit />` — Publicités (pages principales)
- `<InfoTooltip />` — Aide contextuelle (pages de formulaire)
- `<GuidedStep />` — Mode guidé (pages de formulaire)
- `<CurrencyInput />` — Champs monétaires (pages débiteur/créancier)
