# 📱 Application Android — Fonctionnement complet

## Vue d'ensemble

L'application Android de SimulDivorce est une **application hybride** construite avec **Capacitor**. Elle encapsule le frontend React (HTML/CSS/JS) dans une WebView Android native.

```
┌─────────────────────────────────────────────┐
│              APP ANDROID                     │
│  ┌────────────────────────────────────────┐  │
│  │          Capacitor (Bridge)            │  │
│  │  ┌──────────────────────────────────┐  │  │
│  │  │       WebView Android            │  │  │
│  │  │  ┌────────────────────────────┐  │  │  │
│  │  │  │   Frontend React (SPA)    │  │  │  │
│  │  │  │   HTML + CSS + JS         │  │  │  │
│  │  │  │   (même code que le web)  │  │  │  │
│  │  │  └────────────────────────────┘  │  │  │
│  │  └──────────────────────────────────┘  │  │
│  └────────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

---

## Comment ça marche ?

### 1. Le concept Capacitor

**Capacitor** est un runtime qui permet d'exécuter une application web (React) dans une **WebView native Android**. C'est comme un navigateur Chrome intégré dans l'application, mais sans barre d'adresse ni boutons de navigation.

**Avantages :**

- Code source unique pour le web ET Android (même React, même TypeScript)
- Accès aux API natives Android via des plugins Capacitor
- Distribution sur le Google Play Store
- Performance proche du natif (même moteur Chrome/V8)

**Différence avec un site web :**

- L'app Android charge les fichiers HTML/CSS/JS **localement** (embarqués dans l'APK)
- Pas besoin d'internet pour les calculs (tout est côté client)
- L'app a un `applicationId` unique : `fr.simuldivorce.pro`

### 2. Le processus de build

```
1. npm run build          → Compile React → dossier dist/ (HTML/CSS/JS)
2. npx cap sync           → Copie dist/ dans android/app/src/main/assets/public/
3. Android Studio build   → Compile l'APK/AAB avec les assets web embarqués
4. Google Play upload     → Publication sur le Play Store
```

### 3. Détection Web vs Natif

**Fichier clé :** `frontend/src/services/platform.ts`

```typescript
import { Capacitor } from "@capacitor/core";

// Vérifie si l'app tourne dans un conteneur natif (Android/iOS)
export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

// Retourne le mode de l'application
export function getAppMode(): AppMode {
  if (isNativeApp() || DEV_LAWYER_MODE) return "lawyer"; // Android → mode avocat
  return "client"; // Web → mode client gratuit
}
```

**Résultat :**

- **Web (simuldivorce.fr)** → `isNativeApp() = false` → Mode "client" (gratuit, avec pubs)
- **App Android** → `isNativeApp() = true` → Mode "avocat" (pro, sans pubs si premium)

---

## Structure des fichiers Android

```
frontend/android/
├── app/
│   ├── build.gradle                    ← Configuration de build de l'application
│   ├── capacitor.build.gradle          ← Configuration Capacitor auto-générée
│   ├── proguard-rules.pro              ← Règles d'obfuscation du code
│   └── src/
│       └── main/
│           ├── AndroidManifest.xml     ← Manifeste Android (permissions, activités)
│           ├── assets/
│           │   ├── capacitor.config.json   ← Config Capacitor compilée
│           │   ├── capacitor.plugins.json  ← Liste des plugins Capacitor
│           │   └── public/                 ← ⭐ Assets web (copie de dist/)
│           ├── java/
│           │   └── fr/simuldivorce/pro/
│           │       └── MainActivity.java   ← Activité principale (pont Capacitor)
│           └── res/
│               ├── drawable/               ← Icônes et images
│               ├── values/                 ← Strings, styles, couleurs
│               └── ...
├── capacitor-cordova-android-plugins/     ← Plugins Cordova/Capacitor
├── gradle/
│   └── wrapper/
│       └── gradle-wrapper.properties       ← Version de Gradle
├── build.gradle                            ← Configuration Gradle racine
├── settings.gradle                         ← Inclusion des modules
└── variables.gradle                        ← Variables partagées (versions SDK)
```

---

## Fichiers importants expliqués

### `AndroidManifest.xml`

C'est le **registre principal** de l'application Android. Il déclare :

```xml
<!-- Package/identifiant de l'app -->
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <application
        android:icon="@mipmap/ic_launcher"      <!-- Icône de l'app -->
        android:label="@string/app_name"         <!-- Nom affiché -->
        android:theme="@style/AppTheme">         <!-- Thème visuel -->

        <!-- Activité principale — le conteneur Capacitor -->
        <activity
            android:name=".MainActivity"
            android:launchMode="singleTask"       <!-- Une seule instance -->
            android:exported="true">              <!-- Lançable depuis le launcher -->

            <!-- Déclaration de l'intent MAIN + LAUNCHER = icône dans le menu -->
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <!-- FileProvider pour partager des fichiers de manière sécurisée -->
        <provider
            android:name="androidx.core.content.FileProvider"
            android:authorities="${applicationId}.fileprovider" />
    </application>
</manifest>
```

### `app/build.gradle`

Configuration de compilation de l'application :

```groovy
android {
    namespace = "fr.simuldivorce.pro"    // Package Java
    compileSdk = rootProject.ext.compileSdkVersion

    defaultConfig {
        applicationId "fr.simuldivorce.pro"  // ID unique sur le Play Store
        minSdkVersion rootProject.ext.minSdkVersion      // Version Android minimale
        targetSdkVersion rootProject.ext.targetSdkVersion // Version Android ciblée
        versionCode 1       // Version interne (incrémenter à chaque publication)
        versionName "1.0"   // Version affichée à l'utilisateur
    }
}
```

### `variables.gradle`

Versions de SDK Android centralisées :

```groovy
ext {
    minSdkVersion = 22         // Android 5.1 minimum
    compileSdkVersion = 34     // Compile avec Android 14 API
    targetSdkVersion = 34      // Cible Android 14
    // ...versions des librairies...
}
```

### `capacitor.config.ts`

Configuration Capacitor (côté frontend) :

```typescript
const config: CapacitorConfig = {
  appId: "fr.simuldivorce.pro", // Doit correspondre à applicationId
  appName: "SimulDivorcePro", // Nom de l'app
  webDir: "dist", // Dossier des assets web compilés
};
```

---

## Mode Avocat (fonctionnalités exclusives Android)

Quand l'app détecte qu'elle tourne en natif (`isNativeApp() = true`), elle active le **mode avocat** qui inclut :

### Pages exclusives :

- `/profil-avocat` — Configuration du profil professionnel de l'avocat
- `/identite-parties` — Saisie des identités complètes des deux parties
- `/export-avocat` — Export professionnel avec document Word

### Fonctionnalités exclusives :

- **Export Word (.docx)** — Document professionnel avec logo, en-tête cabinet
- **Profil avocat** — Nom, barreau, adresse, téléphone, logo
- **Identité des parties** — Noms complets, dates de naissance, adresses
- **Mode premium** — Suppression des publicités (abonnement)

### Stockage de données avocat :

- `lawyerProfileStore.ts` — Profil de l'avocat (localStorage)
- `lawyerCaseStore.ts` — Identités des parties (localStorage)

---

## Communication App Android ↔ Serveur

L'app Android communique avec le backend Go de la **même manière** que le site web :

```
App Android (WebView)
    │
    │ Requêtes HTTP identiques
    │ (fetch / XMLHttpRequest)
    │
    ▼
Backend Go (Port 8080)
    │
    ├──▶ Google Drive
    └──▶ Make.com
```

La seule différence est que les CORS doivent autoriser l'origine de la WebView Capacitor. En pratique, Capacitor injecte les requêtes de manière à ce que les CORS ne posent pas de problème (`ionic://localhost` ou `capacitor://localhost`).

---

## Comment mettre à jour l'application Android

### 1. Mettre à jour le code React

```bash
cd frontend
# Modifier le code React...
npm run build              # Recompiler les assets
npx cap sync               # Copier dans android/
```

### 2. Incrémenter la version

**Fichier :** `frontend/android/app/build.gradle`

```groovy
versionCode 2          // Incrémenter de 1 (ancien: 1)
versionName "1.1"      // Nouvelle version affichée
```

### 3. Compiler l'APK/AAB

```bash
cd frontend/android
./gradlew assembleRelease      # Compile un APK
# ou
./gradlew bundleRelease        # Compile un AAB (pour le Play Store)
```

### 4. Publier sur le Google Play Store

1. Aller sur [Google Play Console](https://play.google.com/console)
2. Sélectionner l'application `fr.simuldivorce.pro`
3. Créer une nouvelle release
4. Uploader le fichier `.aab`
5. Remplir les notes de version
6. Soumettre pour review

---

## Toggle développeur : tester le mode avocat sur le web

Pour tester les fonctionnalités avocat sans compiler l'APK Android :

**Fichier :** `frontend/src/services/platform.ts`

```typescript
// Mettre à true pour simuler le mode avocat sur le web
const DEV_LAWYER_MODE = true; // ← true = mode avocat sur le web
//    false = mode client normal
```

**⚠️ Toujours remettre à `false` avant de déployer en production web !**

---

## Système d'abonnement (Premium)

**Fichier :** `frontend/src/services/subscriptionService.ts`

L'app Android a un système free/premium :

| Tier        | Publicités    | Export Word | Profil avocat |
| ----------- | ------------- | ----------- | ------------- |
| **Free**    | Oui (AdSense) | Limité      | Oui           |
| **Premium** | Non           | Complet     | Oui           |

Actuellement, le système utilise un simple flag `localStorage`. En production, il devrait être connecté à **Google Play Billing** via un plugin Capacitor pour gérer les achats in-app.

```typescript
// Activer le premium (simulé pour l'instant)
activatePremium(30); // 30 jours de premium

// Vérifier si on doit montrer les pubs
shouldShowAds(); // false si premium, true si free
```
