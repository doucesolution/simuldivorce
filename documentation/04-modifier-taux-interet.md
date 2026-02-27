# 💰 Comment modifier le taux d'intérêt global

## Contexte

SimulDivorce utilise plusieurs coefficients et taux dans ses calculs de prestation compensatoire. Ce guide explique **exactement où et comment** modifier chaque taux.

---

## 1. Taux d'imposition (Tax Rates)

# 💰 Modifier le taux d'intérêt global (rendement immobilier)

Pour changer le taux d'intérêt global utilisé dans tous les calculs (rendement immobilier par défaut), il suffit de modifier **une seule variable** :

**Fichier :** `frontend/src/services/legalEngine.ts`

```typescript
// En haut du fichier :
export const DEFAULT_YIELD_RATE = 3; // ← Rendement par défaut 3 %
export const DEFAULT_YIELD_RATE_STR = String(DEFAULT_YIELD_RATE); // "3" (pour les champs texte)
```

**Exemple :**

```typescript
// Pour passer à 4 % par défaut partout :
export const DEFAULT_YIELD_RATE = 4;
```

Ce taux sera automatiquement utilisé :

- dans tous les formulaires (pré-rempli)
- dans tous les calculs (si l'utilisateur ne saisit rien)
- dans les exports Word/PDF
- dans le mode avocat

> ⚠️ Ne modifiez plus d'autres fichiers pour changer ce taux : tout est centralisé via `DEFAULT_YIELD_RATE`.
