# ⚖️ Moteur de calcul juridique (legalEngine.ts)

## Description

`legalEngine.ts` est le **cœur de l'application**. C'est le fichier le plus important du projet. Il contient les trois méthodes de calcul de la prestation compensatoire utilisées en droit français.

**Chemin :** `frontend/src/services/legalEngine.ts`
**Taille :** ~620 lignes

---

## Vue d'ensemble

```
Données financières (FinancialData)
         │
         ▼
    legalEngine.calculate()
         │
         ├── Méthode 1 : Tiers Pondéré
         ├── Méthode 2 : INSEE / OCDE
         └── Méthode 3 : Axel-Depondt
         │
         ▼
    SimulationResult
    (montants, ranges, moyennes)
```

---

## Les 3 méthodes de calcul

### 1. Méthode du Tiers Pondéré (Approche temporelle)

**Référence :** aidefamille.fr — Méthode du tiers de la différence pondérée par la durée

**Formule :**

```
PC = (ΔRevenu Annuel / 3) × (Durée mariage / 2) × Coefficient d'âge
```

**Étapes :**

1. Calculer le delta mensuel : `payerIncome - beneficiaryIncome`
2. Annualiser : `delta × 12`
3. Appliquer le coefficient d'âge selon l'âge du bénéficiaire :
   - < 45 ans → 1.0
   - 45-54 ans → 1.2
   - ≥ 55 ans → 1.5
4. Résultat = `(delta annuel / 3) × (durée / 2) × coefficient`
5. Range : ±10% autour du résultat central

### 2. Méthode INSEE / OCDE (Niveau de vie)

**Référence :** INSEE — Échelle d'équivalence OCDE modifiée

**Formule :**

```
Perte mensuelle = Niveau de vie AVANT divorce − Niveau de vie APRÈS divorce
PC = Perte mensuelle × Période (max 8 ans × 12 mois) × 20%
```

**Étapes :**

1. Calculer les UC (Unités de Consommation) OCDE avant divorce :
   - 1er adulte = 1 UC
   - 2e adulte = 0.5 UC
   - Enfant < 14 ans = 0.3 UC
   - Enfant ≥ 14 ans = 0.5 UC
2. Niveau de vie avant = `Revenus totaux / UC totales`
3. Calculer les UC après divorce (bénéficiaire seul + sa part d'enfants)
4. Niveau de vie après = `Revenu bénéficiaire / UC après`
5. Perte = `Niveau avant - Niveau après`
6. Capitaliser sur min(durée, 8 ans) × 12 mois
7. Appliquer : 15% (min), 20% (standard), 25% (max)

### 3. Méthode Axel-Depondt (Approche magistrat détaillée)

**Référence :** Grille de calcul utilisée par les magistrats et avocats spécialisés

C'est la méthode la plus complexe. Elle utilise des revenus **bruts** (pas nets) et prend en compte :

**Étapes détaillées :**

1. **Identification débiteur/créancier** — Si les revenus sont inversés, swap automatique
2. **Revenus du débiteur (C16-C28)**
   - Revenu brut mensuel
   - Contribution enfants
   - Revenu futur projeté (si changement prévu)
   - Moyenne pondérée sur 8 ans
   - Revenu immobilier (patrimoine × rendement / 12)
3. **Revenus du créancier (C30-C42)** — Même calcul
4. **Disparité (C44-C50)**
   - Différence mensuelle des revenus corrigés
   - Pondération à 60% (la PC ne compense pas 100%)
   - × durée exacte du mariage (yearFrac)
   - × coefficient d'âge (formule linéaire par morceaux)
5. **Compensation retraite (C51-C53)**
   - Années avant retraite × revenu pré-retraite
6. **Résultat final (C56-C59)**
   - PC = disparité + compensation retraite
   - Mensualité sur 8 ans
   - Capacité d'épargne du débiteur (30% du revenu × 96 mois)

---

## Types TypeScript

### `FinancialData` (entrée)

Tous les champs saisis par l'utilisateur : revenus, durée, âges, enfants, patrimoine, projections futures, etc.

### `SimulationResult` (sortie)

```typescript
{
    compensatoryAllowance: number;    // Moyenne finale (3 méthodes)
    custodyTypeUsed: string;          // Type de garde utilisé
    marriageDurationUsed: number;     // Durée du mariage
    details: {
        pilote: { value, min, max },  // Tiers Pondéré ±10%
        insee: { value, min, max },   // INSEE 15/20/25%
        axelDepondt: {                // Détaillé
            value, min, max,
            monthlyOver8Years,        // Mensualité sur 8 ans
            debtorMaxSavingsCapital,  // Capacité max du débiteur
            debtorMonthlySavings      // Épargne mensuelle
        }
    }
}
```

---

## Fonctions utilitaires

### `yearFrac(d1, d2)`

Calcule la fraction d'année entre deux dates (équivalent de `FRACTION.ANNEE` dans Excel). Utilisée pour la durée exacte du mariage dans la méthode Axel-Depondt.

### `computeChildrenUC(count, ages)`

Calcule les unités de consommation OCDE pour les enfants :

- < 14 ans → 0.3 UC
- ≥ 14 ans → 0.5 UC

---

## Comment modifier les calculs

### Modifier un coefficient

Voir le guide détaillé : [../04-modifier-taux-interet.md](../../04-modifier-taux-interet.md)

### Ajouter une nouvelle méthode de calcul

1. Ajouter les calculs dans `legalEngine.calculate()` :

   ```typescript
   const pcNouvelleMethode = /* ... calcul ... */;
   ```

2. Ajouter dans `SimulationResult.details` :

   ```typescript
   nouvelleMethode: {
       value: Math.round(pcNouvelleMethode),
       min: Math.round(pcNouvelleMethode * 0.9),
       max: Math.round(pcNouvelleMethode * 1.1),
   }
   ```

3. Mettre à jour la moyenne :

   ```typescript
   const methodValues = [pcPilote, pcInsee, pcAxelDepondt, pcNouvelleMethode];
   ```

4. Mettre à jour `DashboardPage.tsx` pour afficher la nouvelle méthode.
