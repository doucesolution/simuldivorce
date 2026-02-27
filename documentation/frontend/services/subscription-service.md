# 💳 Service d'abonnement (subscriptionService.ts)

## Description

`subscriptionService.ts` gère le système d'abonnement **freemium** pour l'application native (Android). Sur le web, l'utilisateur est toujours en mode "free".

**Chemin :** `frontend/src/services/subscriptionService.ts`
**Taille :** ~130 lignes

---

## Modèle freemium

| Tier        | Publicités       | Export Word | Fonctions avocat |
| ----------- | ---------------- | ----------- | ---------------- |
| **free**    | ✅ Oui (AdSense) | ❌ Limité   | ❌ Limité        |
| **premium** | ❌ Non           | ✅ Complet  | ✅ Complet       |

---

## Comportement par plateforme

| Plateforme                | Tier par défaut           | Abonnement possible |
| ------------------------- | ------------------------- | ------------------- |
| **Web** (simuldivorce.fr) | Toujours "free"           | Non                 |
| **Android** (Capacitor)   | "free" → upgrade possible | Oui                 |

---

## Types

### `SubscriptionTier`

```typescript
type SubscriptionTier = "free" | "premium";
```

### `SubscriptionState`

```typescript
interface SubscriptionState {
  tier: SubscriptionTier; // "free" ou "premium"
  expiresAt: string | null; // Date ISO d'expiration (ou null)
  trialUsed: boolean; // Si l'essai gratuit a été utilisé
}
```

---

## Fonctions exportées

### `loadSubscription(): SubscriptionState`

- **Web** : retourne toujours `{ tier: "free" }` sans lire le localStorage
- **Native** : charge depuis localStorage, vérifie l'expiration, rétrograde si expiré

### `saveSubscription(partial): SubscriptionState`

Sauvegarde partielle (merge) dans localStorage.

### `shouldShowAds(): boolean`

- **Web** : toujours `true` (publicités sur le site)
- **Native free** : `true`
- **Native premium** : `false`

### `isPremium(): boolean`

- **Web** : toujours `false`
- **Native** : `true` si tier premium non expiré

### `activatePremium(durationDays = 30): void`

Active le premium pour N jours. Calcule la date d'expiration et marque l'essai comme utilisé.

> **Note :** Actuellement c'est un flag localStorage. En production, cela serait déclenché par le callback Google Play Billing.

### `deactivatePremium(): void`

Rétrograde en free. Conserve le flag `trialUsed`.

---

## Clé localStorage

```
subscriptionState → JSON de SubscriptionState
```

---

## Comment modifier

### Intégrer Google Play Billing

1. Installer un plugin Capacitor pour Google Play Billing
2. Remplacer `activatePremium()` par un callback déclenché après validation du paiement
3. Vérifier le ticket d'achat côté serveur (backend Go)

### Ajouter un tier intermédiaire

1. Étendre `SubscriptionTier` : `"free" | "basic" | "premium"`
2. Mettre à jour `shouldShowAds()` et `isPremium()` pour le nouveau tier
3. Ajouter la logique de prix dans l'UI
