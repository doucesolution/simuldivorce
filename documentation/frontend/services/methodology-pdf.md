# 📐 Générateur PDF Méthodologie (methodologyPdfGenerator.ts)

## Description

`methodologyPdfGenerator.ts` génère un **PDF explicatif des formules de calcul** utilisées par SimulDivorce. Ce document décrit les 3 méthodes, leurs formules et leurs sources.

**Chemin :** `frontend/src/services/methodologyPdfGenerator.ts`
**Taille :** ~650 lignes
**Bibliothèque :** jsPDF (import dynamique)

---

## Différences avec le PDF de simulation

| Aspect              | PDF Simulation          | PDF Méthodologie          |
| ------------------- | ----------------------- | ------------------------- |
| Contenu             | Résultats chiffrés      | Formules et explications  |
| Filigrane           | "DOCUMENT NON OFFICIEL" | "DOCUMENT INFORMATIF"     |
| Données utilisateur | Oui (revenus, durées)   | Non (aucune donnée perso) |
| Générique           | Non (spécifique au cas) | Oui (toujours le même)    |

---

## Structure du document

1. **En-tête** — Barre SimulDivorce + "FORMULES DE CALCUL - METHODOLOGIE"
2. **Section 1** — Méthode du Tiers Pondéré
   - Principe
   - Formule détaillée
   - Coefficients d'âge
   - Sources
3. **Section 2** — Méthode INSEE / OCDE
   - Principe des unités de consommation
   - Formule de niveau de vie
   - Taux de capitalisation
   - Sources INSEE
4. **Section 3** — Méthode Axel-Depondt
   - Grille de calcul magistrat
   - Revenus bruts corrigés
   - Pondération 60%
   - Compensation retraite
   - Sources juridiques

---

## Design

Même palette que le PDF principal :

```typescript
const COLOR_PRIMARY = "#0F172A"; // Slate 900
const COLOR_ACCENT = "#14B8A6"; // Teal 500
const COLOR_MUTED = "#64748B"; // Slate 500
```

---

## Export

La fonction retourne un `Blob` (pas un téléchargement direct) pour permettre :

- Le téléchargement direct
- L'envoi via le webhook backend
- L'affichage dans un viewer

```typescript
export async function generateMethodologyPdf(): Promise<Blob>;
```

---

## Comment modifier

### Ajouter une méthode

1. Créer une nouvelle section dans la fonction principale
2. Appeler `drawSectionTitle()` avec le numéro et titre
3. Décrire la formule avec `doc.text()` et `doc.setFont()`
4. Mettre à jour le sommaire si besoin

### Modifier une formule

Trouver la section correspondante et modifier le texte descriptif. Les formules sont écrites en texte libre (pas de LaTeX dans jsPDF).
