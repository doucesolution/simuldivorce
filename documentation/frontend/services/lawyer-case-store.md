# 👔 Stockage cas avocat (lawyerCaseStore.ts)

## Description

`lawyerCaseStore.ts` persiste les **données spécifiques à un dossier avocat** : identité des parties (débiteur/créancier), date d'évaluation, et taux de rendement.

**Chemin :** `frontend/src/services/lawyerCaseStore.ts`
**Taille :** ~100 lignes

---

## Séparation des données

```
localStorage
    │
    ├── divorceFormData      ← Données de calcul (tous les modes)
    ├── lawyerCaseData       ← Identité parties + meta (mode avocat uniquement)
    └── lawyerProfile        ← Profil de l'avocat (lawyerProfileStore.ts)
```

Les données du cas avocat sont **séparées** des données de formulaire pour :

- Ne jamais interférer avec le parcours client
- Permettre un reset indépendant
- Évoluer indépendamment

---

## Interfaces

### `PartyIdentity`

```typescript
interface PartyIdentity {
  birthDate: string; // Date de naissance (ISO YYYY-MM-DD)
  fullAddress: string; // Adresse postale complète
}
```

### `LawyerCaseData`

```typescript
interface LawyerCaseData {
  debtor: PartyIdentity; // Identité du débiteur
  creditor: PartyIdentity; // Identité du créancier
  evaluationDate: string; // Date d'évaluation (défaut: aujourd'hui)
  yieldRate: string; // Taux de rendement annuel (défaut: "3")
}
```

---

## Fonctions exportées

### `loadCaseData(): LawyerCaseData`

Charge depuis localStorage avec merge profond (debtor + creditor).

### `saveCaseData(partial): LawyerCaseData`

Sauvegarde partielle avec merge profond :

```typescript
// Seuls les champs fournis sont mis à jour
saveCaseData({ debtor: { birthDate: "1985-03-15" } });
// → Le fullAddress du debtor est préservé
```

### `clearCaseData(): void`

Supprime toutes les données du cas.

---

## Valeurs par défaut

```typescript
const EMPTY_CASE: LawyerCaseData = {
  debtor: { birthDate: "", fullAddress: "" },
  creditor: { birthDate: "", fullAddress: "" },
  evaluationDate: "2025-01-15", // Aujourd'hui au format ISO
  yieldRate: "3", // 3% par défaut
};
```

---

## Utilisé par

- **LawyerIdentityPage.tsx** — Page de saisie des identités
- **wordGenerator.ts** — Inclusion des données dans le document Word
- **RecapitulatifPage.tsx** — Affichage du récapitulatif complet
