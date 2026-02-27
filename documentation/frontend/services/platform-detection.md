# 📱 Détection de plateforme (platform.ts)

## Description

`platform.ts` détermine si l'application tourne sur le **web** ou dans l'**app native Android** (Capacitor). C'est un fichier critique qui conditionne le comportement de toute l'application.

**Chemin :** `frontend/src/services/platform.ts`
**Taille :** ~50 lignes

---

## Modes de l'application

| Mode       | Plateforme          | URL/Contexte    | Fonctionnalités                        |
| ---------- | ------------------- | --------------- | -------------------------------------- |
| **client** | Web (navigateur)    | simuldivorce.fr | Gratuit, publicités, PDF export        |
| **lawyer** | Android (Capacitor) | APK Play Store  | Abonnement, Word export, profil avocat |

---

## Toggle de développement ⚠️

```typescript
const DEV_LAWYER_MODE = true; // ← CHANGER ICI
```

**IMPORTANT :** Ce toggle permet d'activer le mode avocat sur le web pendant le développement.

- `true` → Mode avocat actif sur le web (pour tester les fonctionnalités Pro)
- `false` → Mode client normal sur le web (production)

**Avant de déployer en production web**, vérifier que `DEV_LAWYER_MODE = false` !

---

## Fonctions exportées

### `isNativeApp(): boolean`

Utilise `Capacitor.isNativePlatform()` pour détecter si on est dans un WebView natif.

### `getAppMode(): AppMode`

```typescript
if (isNativeApp() || DEV_LAWYER_MODE) return "lawyer";
return "client";
```

### `isLawyerMode(): boolean`

Raccourci pour `getAppMode() === "lawyer"`. Utilisé dans toute l'UI pour afficher/masquer les fonctionnalités Pro.

### `PLAY_STORE_URL`

Constante avec l'URL du Play Store pour l'app Android :

```
https://play.google.com/store/apps/details?id=fr.simuldivorce.pro
```

---

## Utilisations dans le code

Ce fichier est utilisé dans :

- **App.tsx** : Affichage conditionnel des routes avocat
- **subscriptionService.ts** : Gestion du mode free/premium
- **Tous les composants** : Affichage/masquage des fonctionnalités Pro
- **ExportPage.tsx** : Choix entre PDF (client) et Word (avocat)

---

## Comment modifier

### Activer le mode avocat en dev

```typescript
const DEV_LAWYER_MODE = true;
```

### Désactiver le mode avocat pour la production web

```typescript
const DEV_LAWYER_MODE = false;
```

### Ajouter un nouveau mode (ex: "expert")

1. Étendre le type : `type AppMode = "client" | "lawyer" | "expert";`
2. Ajouter la logique dans `getAppMode()`
3. Créer un helper : `export function isExpertMode(): boolean`
