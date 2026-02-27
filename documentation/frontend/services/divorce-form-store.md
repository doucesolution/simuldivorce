# 💾 Stockage des données du formulaire (divorceFormStore.ts)

## Description

`divorceFormStore.ts` est le **magasin de données centralisé** pour toutes les pages de saisie du formulaire de divorce. Toutes les pages lisent et écrivent dans le même espace `localStorage`.

**Chemin :** `frontend/src/services/divorceFormStore.ts`
**Taille :** ~404 lignes

---

## Principe

```
Page Prestation ──┐
Page Débiteur  ───┼──▶ localStorage["divorceFormData"] ──▶ legalEngine.calculate()
Page Créancier ───┘
```

Toutes les pages partagent les mêmes données via `localStorage`. Quand l'utilisateur saisit un champ sur une page, il est disponible sur toutes les autres.

---

## Interface `DivorceFormData`

C'est la structure qui contient **tous** les champs du formulaire :

```typescript
export interface DivorceFormData {
  // Informations mariage
  marriageDate: string; // Date du mariage (ISO)
  divorceDate: string; // Date du divorce (ISO)

  // Identité / Âges
  myBirthDate: string; // Date de naissance créancier
  spouseBirthDate: string; // Date de naissance débiteur

  // Revenus nets
  myIncome: string; // Revenu net mensuel créancier
  spouseIncome: string; // Revenu net mensuel débiteur

  // Famille
  childrenCount: number; // Nombre d'enfants
  childrenAges: number[]; // Âge de chaque enfant
  custodyType: string; // Type de garde

  // Projections débiteur (méthode Axel-Depondt)
  debtorGrossIncome: string; // Revenu brut
  debtorIncomeMode: string; // "monthly" | "annual"
  debtorChildContribution: string;
  debtorFutureIncome: string;
  debtorFutureChildContribution: string;
  debtorChangeDate: string;
  debtorPropertyValue: string;
  debtorPropertyYield: string;

  // Projections créancier
  creditorGrossIncome: string;
  creditorIncomeMode: string;
  creditorChildContribution: string;
  creditorFutureIncome: string;
  creditorFutureChildContribution: string;
  creditorChangeDate: string;
  creditorPropertyValue: string;
  creditorPropertyYield: string;
  creditorRetirementGapYears: string;
  creditorPreRetirementIncome: string;

  // Flags
  debtorExpectsRevenueChange: string; // "yes" | "no"
  creditorExpectsRevenueChange: string; // "yes" | "no"
}
```

---

## Fonctions principales

### `loadFormData(): DivorceFormData`

Charge les données depuis `localStorage`. Fusionne avec les valeurs par défaut pour gérer les champs manquants (évolution du schéma).

### `saveFormData(partial: Partial<DivorceFormData>)`

Sauvegarde un sous-ensemble de champs. Fusionne avec l'état existant :

```typescript
// Seuls les champs fournis sont mis à jour
saveFormData({ myIncome: "3000", spouseIncome: "5000" });
```

### `clearFormData()`

Supprime toutes les données du formulaire (remet à zéro).

### `buildFinancialPayload(): FinancialData`

Convertit les données du formulaire (strings) en données numériques pour le moteur de calcul :

```typescript
// DivorceFormData (strings)      →  FinancialData (numbers)
// myIncome: "3000"               →  myIncome: 3000
// marriageDate: "2015-06-15"     →  marriageDuration: 11
```

C'est cette fonction qui fait le pont entre le stockage et le calcul.

### `getCalculationChoices()`

Retourne les choix de méthode de calcul stockés séparément.

### `getNextPage(currentPath): string`

Retourne l'URL de la prochaine page dans le parcours de saisie.

### `computeAge(birthDate): number`

Calcule l'âge à partir d'une date de naissance.

---

## Clé localStorage

```
divorceFormData    → JSON de DivorceFormData
```

Les données persistent entre les sessions (refresh, fermeture/réouverture du navigateur) mais sont supprimées si l'utilisateur vide son localStorage.

---

## Comment ajouter un nouveau champ

1. **Ajouter le champ** dans l'interface `DivorceFormData` :

   ```typescript
   monNouveauChamp: string;
   ```

2. **Ajouter la valeur par défaut** dans `INITIAL_FORM_DATA` :

   ```typescript
   monNouveauChamp: "",
   ```

3. **Sauvegarder depuis la page concernée** :

   ```typescript
   saveFormData({ monNouveauChamp: valeur });
   ```

4. **Si c'est utilisé dans le calcul**, l'ajouter dans `buildFinancialPayload()` et dans `FinancialData` de `legalEngine.ts`.
