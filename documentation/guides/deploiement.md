# 🚀 Guide : Déploiement

## Architecture de déploiement

```
┌──────────────────────┐
│   Docker Compose     │
│                      │
│  ┌────────────────┐  │
│  │ Frontend       │  │
│  │ (Nginx)        │──│──▶ Port 5173
│  │ Build React    │  │
│  └────────────────┘  │
│                      │
│  ┌────────────────┐  │
│  │ Backend        │  │
│  │ (Go/Gin)       │──│──▶ Port 8080
│  │ API Server     │  │
│  └────────────────┘  │
│                      │
└──────────────────────┘
```

---

## 1. Déploiement avec Docker Compose

### Prérequis

- Docker et Docker Compose installés sur le serveur

### Commandes

```bash
# Cloner le project
git clone <repo-url>
cd simuldivorce

# Configurer l'environnement backend
cp backend/.env.example backend/.env
# Éditer backend/.env avec les vraies valeurs

# Construire et lancer
docker compose up -d --build
```

### Vérification

```bash
# Frontend
curl http://localhost:5173

# Backend health
curl http://localhost:8080/api/health

# Backend version
curl http://localhost:8080/api/version
```

---

## 2. Configuration du fichier .env (Backend)

```env
# URL du Google Apps Script pour l'upload Drive
GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/AKfycbw3ZcfEiSLnU0JjpdG-KcYfPxzklXlgxNVc0oYItTWof2ig5VsBGJI7BnjISXQoZ_I8Bg/exec

# URL du webhook Make.com pour l'envoi d'email
MAKE_WEBHOOK_URL=https://hook.eu2.make.com/VOTRE_WEBHOOK_ID

# Origines autorisées CORS (séparées par virgule)
CORS_ORIGINS=https://simuldivorce.fr,http://localhost:5173

# Port du serveur (optionnel, défaut: 8080)
PORT=8080
```

---

## 3. Variables d'environnement Frontend (Build)

Ces variables sont injectées **au moment du build** via Vite :

```env
# Client Google AdSense (publicités)
VITE_ADSENSE_CLIENT=ca-pub-XXXXXXXXXXXXXXXX

# URL de l'API backend (vide = même domaine en production)
VITE_API_URL=

# Slot AdSense (optionnel)
VITE_ADSENSE_SLOT=XXXXXXXXXX
```

Pour le développement local :

```env
VITE_API_URL=http://localhost:8080
```

---

## 4. Build Frontend manuellement (sans Docker)

```bash
cd frontend
npm install
npm run build
# → Les fichiers sont dans frontend/dist/
```

Le dossier `dist/` peut être servi par n'importe quel serveur web (Nginx, Apache, Cloudflare Pages, Vercel...).

---

## 5. Build Backend manuellement (sans Docker)

```bash
cd backend
go build -o server main.go
./server
```

Ou directement :

```bash
cd backend
go run main.go
```

---

## 6. Build Android (APK)

### Prérequis

- Android Studio installé
- JDK 17+
- Android SDK

### Étapes

```bash
cd frontend

# Construire le web
npm run build

# Synchroniser avec Capacitor
npx cap sync android

# Ouvrir dans Android Studio
npx cap open android
```

Dans Android Studio :

1. **Build** → **Generate Signed Bundle/APK**
2. Sélectionner APK
3. Configurer le keystore de signature
4. Build en mode Release

### Build en ligne de commande

```bash
cd frontend/android
./gradlew assembleRelease
# → APK dans app/build/outputs/apk/release/
```

---

## 7. Déploiement sur Google Play Store

1. Construire l'APK signé (voir ci-dessus)
2. Se connecter à [Google Play Console](https://play.google.com/console)
3. Sélectionner l'app `fr.simuldivorce.pro`
4. **Release** → **Production** → Upload APK
5. Remplir les notes de version
6. Soumettre pour review

---

## 8. Checklist avant déploiement production

### Frontend

- [ ] `DEV_LAWYER_MODE = false` dans `platform.ts`
- [ ] Variables d'environnement configurées
- [ ] `npm run build` réussit sans erreur
- [ ] Sitemap à jour
- [ ] `version.json` sera généré automatiquement par le build

### Backend

- [ ] `.env` configuré avec les vraies URLs
- [ ] `CORS_ORIGINS` contient le domaine de production
- [ ] Google Apps Script déployé et URL correcte
- [ ] Webhook Make.com configuré et testé

### Android

- [ ] Version incrémentée dans `build.gradle`
- [ ] APK signé avec le keystore de production
- [ ] Testé sur un appareil physique

---

## 9. Mise à jour de l'application

### Frontend + Backend (Docker)

```bash
git pull
docker compose up -d --build
```

Le `VersionChecker` côté client détectera la nouvelle version via `version.json` et proposera un rechargement aux utilisateurs.

### Android

1. Incrémenter `versionCode` et `versionName` dans `frontend/android/app/build.gradle`
2. Rebuild + upload sur Play Store

---

## 10. Monitoring

### Vérifier que le backend fonctionne

```bash
curl https://votre-domaine.com/api/health
# Réponse attendue : {"status":"ok"}
```

### Vérifier la version

```bash
curl https://votre-domaine.com/api/version
# Réponse attendue : {"version":"1.0.0","buildDate":"2025-02-27T..."}
```

### Logs Docker

```bash
# Tous les logs
docker compose logs -f

# Seulement le backend
docker compose logs -f backend

# Seulement le frontend
docker compose logs -f frontend
```
