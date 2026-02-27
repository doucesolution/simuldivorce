# 📱 Frontend — Configuration Capacitor (capacitor.config.ts)

## Description

Capacitor est le bridge qui transforme l'application web React en application Android native. Ce fichier de configuration est lu par la CLI Capacitor lors du `npx cap sync`.

**Chemin :** `frontend/capacitor.config.ts`

---

## Configuration

```typescript
const config: CapacitorConfig = {
  appId: "fr.simuldivorce.pro", // Identifiant unique de l'app
  appName: "SimulDivorcePro", // Nom affiché
  webDir: "dist", // Dossier des assets web compilés
};
```

### `appId` — Identifiant de l'application

- Format : notation de domaine inversée (`fr.simuldivorce.pro`)
- **Doit correspondre** à `applicationId` dans `android/app/build.gradle`
- Utilisé par le Google Play Store pour identifier l'application
- **Ne jamais changer** après publication (sinon c'est une nouvelle app)

### `appName` — Nom de l'application

- Affiché dans le launcher Android, les paramètres système, etc.
- Peut être modifié sans casser l'application

### `webDir` — Répertoire des assets web

- Pointe vers `dist/` (sortie de `npm run build`)
- Lors de `npx cap sync`, le contenu de ce dossier est copié dans `android/app/src/main/assets/public/`

---

## Commandes Capacitor utiles

```bash
# Synchroniser les assets web + plugins avec le projet Android
npx cap sync

# Ouvrir le projet dans Android Studio
npx cap open android

# Copier uniquement les assets web (sans mettre à jour les plugins)
npx cap copy

# Ajouter la plateforme Android (premier setup uniquement)
npx cap add android
```
