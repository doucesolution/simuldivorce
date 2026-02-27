# 🏛️ Profil avocat (lawyerProfileStore.ts)

## Description

`lawyerProfileStore.ts` persiste le **profil professionnel de l'avocat** : nom, cabinet, contact, numéro de barreau, et logo du cabinet.

**Chemin :** `frontend/src/services/lawyerProfileStore.ts`
**Taille :** ~95 lignes

---

## Interface `LawyerProfile`

```typescript
interface LawyerProfile {
  fullName: string; // "Maître Jean Dupont"
  email: string; // "jean.dupont@cabinet.fr"
  phone: string; // "01 23 45 67 89"
  cabinetName: string; // "Cabinet Dupont & Associés"
  cabinetAddress: string; // "12 Rue de la Paix"
  cabinetCity: string; // "75008 Paris"
  barNumber: string; // N° SIRET ou inscription au barreau
  logoDataUrl: string; // "data:image/png;base64,..." (logo uploadé)
}
```

---

## Clé localStorage

```
lawyerProfile → JSON de LawyerProfile
```

---

## Fonctions exportées

### `loadLawyerProfile(): LawyerProfile`

Charge le profil depuis localStorage avec merge (champs manquants → chaîne vide).

### `saveLawyerProfile(partial): LawyerProfile`

Sauvegarde partielle :

```typescript
saveLawyerProfile({ fullName: "Maître Dupont" });
// → Tous les autres champs sont préservés
```

### `isProfileComplete(profile): boolean`

Vérifie que les 3 champs obligatoires sont remplis :

- `fullName` ≠ ""
- `email` ≠ ""
- `cabinetName` ≠ ""

Utilisé pour conditionner l'accès à l'export Word (le profil doit être complet).

---

## Stockage du logo

Le logo est stocké comme une **data URL base64** dans le champ `logoDataUrl` :

```
"data:image/png;base64,iVBORw0KGgoAAAANSUhEUg..."
```

- L'upload se fait via un `<input type="file">` dans `LawyerProfilePage.tsx`
- Le fichier est lu avec `FileReader.readAsDataURL()`
- Le résultat est sauvegardé dans le profil
- Il est ensuite converti en `Uint8Array` par `wordGenerator.ts` pour l'inclusion dans le .docx

---

## Utilisé par

- **LawyerProfilePage.tsx** — Page de gestion du profil
- **wordGenerator.ts** — En-tête du document Word (nom, logo, cabinet)
- **ExportPage.tsx** — Vérification `isProfileComplete()` avant export

---

## Comment modifier

### Ajouter un champ au profil

1. Ajouter dans l'interface `LawyerProfile`
2. Ajouter une valeur vide dans `EMPTY_PROFILE`
3. Ajouter le champ dans `LawyerProfilePage.tsx`
4. Si nécessaire, l'inclure dans le document Word (`wordGenerator.ts`)

### Rendre un champ obligatoire

Ajouter la vérification dans `isProfileComplete()` :

```typescript
export function isProfileComplete(profile: LawyerProfile): boolean {
  return !!(
    profile.fullName &&
    profile.email &&
    profile.cabinetName &&
    profile.phone
  );
}
```
