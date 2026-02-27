# 🔢 Guide : Modifier les calculs

## Les 3 endroits où les calculs sont définis

| Lieu                 | Fichier                                            | Usage                        |
| -------------------- | -------------------------------------------------- | ---------------------------- |
| **Moteur principal** | `frontend/src/services/legalEngine.ts`             | Calculs en temps réel        |
| **PDF Méthodologie** | `frontend/src/services/methodologyPdfGenerator.ts` | Documentation des formules   |
| **Taux par défaut**  | `frontend/src/services/lawyerCaseStore.ts`         | Taux de rendement par défaut |

---

## Modifier le taux d'intérêt / rendement global

Voir le guide dédié : [../04-modifier-taux-interet.md](../04-modifier-taux-interet.md)

---

## Modifier un coefficient de la méthode Tiers Pondéré

### Coefficients d'âge

Dans `legalEngine.ts`, chercher la section du calcul Tiers Pondéré :

```typescript
// Coefficients d'âge du bénéficiaire
if (beneficiaryAge < 45) {
  ageCoefficient = 1.0; // ← Modifier ici
} else if (beneficiaryAge < 55) {
  ageCoefficient = 1.2; // ← Modifier ici
} else {
  ageCoefficient = 1.5; // ← Modifier ici
}
```

### Diviseur (1/3)

```typescript
const pcPilote = (deltaAnnuel / 3) × (duree / 2) × ageCoefficient;
//                              ↑ Le "3" est le diviseur standard
```

### Range min/max (±10%)

```typescript
min: Math.round(pcPilote * 0.9),   // -10%
max: Math.round(pcPilote * 1.1),   // +10%
```

---

## Modifier les coefficients de la méthode INSEE

### Unités de Consommation OCDE

Dans `legalEngine.ts`, fonction `computeChildrenUC()` :

```typescript
// Enfant < 14 ans → 0.3 UC
// Enfant ≥ 14 ans → 0.5 UC
const uc = age < 14 ? 0.3 : 0.5;
```

Pour modifier les seuils OCDE standards :

```typescript
// 1er adulte = 1 UC (toujours fixe)
// 2e adulte = 0.5 UC
// Enfant < 14 = 0.3 UC
// Enfant ≥ 14 = 0.5 UC
```

### Taux de capitalisation

```typescript
min: Math.round(perteMensuelle * mois * 0.15),   // 15%
value: Math.round(perteMensuelle * mois * 0.20),  // 20% standard
max: Math.round(perteMensuelle * mois * 0.25),    // 25%
```

### Durée maximale de capitalisation

```typescript
const dureeCapitalisation = Math.min(dureeMariage, 8); // Max 8 ans
```

---

## Modifier les coefficients de la méthode Axel-Depondt

### Pondération de la disparité

```typescript
const ponderation = 0.6; // 60% — la PC ne compense pas 100% de la disparité
```

### Coefficient d'âge (formule linéaire)

La méthode Axel-Depondt utilise une formule linéaire par morceaux pour l'âge, pas des paliers fixes.

### Capacité d'épargne du débiteur

```typescript
const capaciteEpargne = revenuDebiteur * 0.3 * 96; // 30% du revenu × 96 mois (8 ans)
```

---

## Ajouter une nouvelle méthode de calcul

### 1. Dans `legalEngine.ts`

```typescript
// Ajouter après les 3 méthodes existantes
const pcNouvelleMethode = /* ... votre formule ... */;
```

### 2. Mettre à jour `SimulationResult`

```typescript
interface SimulationResult {
    details: {
        pilote: { value, min, max },
        insee: { value, min, max },
        axelDepondt: { value, min, max, ... },
        nouvelleMethode: { value, min, max },  // ← Ajouter
    }
}
```

### 3. Mettre à jour la moyenne

```typescript
const values = [pcPilote, pcInsee, pcAxelDepondt, pcNouvelleMethode];
const average = values.reduce((a, b) => a + b, 0) / values.length;
```

### 4. Afficher dans le Dashboard

Dans `DashboardPage.tsx`, ajouter un bloc d'affichage :

```tsx
{
  calculations.details.nouvelleMethode && (
    <div className="...">
      <h3>Nouvelle Méthode</h3>
      <p>{calculations.details.nouvelleMethode.value.toLocaleString()} €</p>
    </div>
  );
}
```

### 5. Mettre à jour le PDF et le Word

- `pdfGenerator.ts` — Ajouter une section pour la nouvelle méthode
- `wordGenerator.ts` — Ajouter une ligne dans le tableau des résultats
- `methodologyPdfGenerator.ts` — Documenter la formule

---

## Mettre à jour le PDF méthodologie

Le PDF méthodologie (`methodologyPdfGenerator.ts`) décrit les formules en texte.
Si vous modifiez un coefficient, **mettez aussi à jour** la description textuelle dans ce fichier.

---

## Tests rapides

Après modification d'un calcul :

1. Lancer l'app : `npm run dev`
2. Saisir des données test connues
3. Vérifier que les résultats correspondent à vos attentes
4. Vérifier le PDF exporté
5. Vérifier le document Word (mode avocat)
