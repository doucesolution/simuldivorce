# 🔐 Backend — Variables d'environnement (.env)

## Description

Le fichier `.env` contient les **secrets et la configuration** du backend Go. Il est chargé au démarrage par la librairie `godotenv`.

**Chemin :** `backend/.env`

**⚠️ Ce fichier ne doit JAMAIS être commité dans Git !** Ajoutez-le dans `.gitignore`.

---

## Variables

### `DRIVE_UPLOAD_URL`

**Valeur actuelle :**

```
https://script.google.com/macros/s/AKfycbw3ZcfEiSLnU0JjpdG-KcYfPxzklXlgxNVc0oYItTWof2ig5VsBGJI7BnjISXQoZ_I8Bg/exec
```

**Rôle :** URL du Google Apps Script Web App qui reçoit les fichiers .docx en base64 et les sauvegarde dans Google Drive.

**Utilisé par :** `handleDeliver()` dans `main.go` (étape 1 : upload Drive).

**Comment la modifier :** Si vous redéployez le Google Apps Script, la nouvelle URL sera différente. Copiez-la depuis l'interface de déploiement GAS et collez-la ici.

---

### `WEBHOOK_URL`

**Valeur :** (à remplir avec votre URL Make.com)

**Rôle :** URL du webhook Make.com qui est notifié après l'upload Drive. Le webhook déclenche un scénario d'envoi d'email avec le lien de téléchargement du document.

**Utilisé par :** `handleDeliver()` dans `main.go` (étape 2 : notification webhook).

**Payload envoyé :**

```json
{
  "email": "utilisateur@example.com",
  "documentId": "18f3a2b4c00-3f1a"
}
```

---

### `METHODOLOGY_WEBHOOK_URL`

**Valeur actuelle :**

```
https://hook.eu2.make.com/qq7wul9bqju013r26u95iecsfoxy4p7g
```

**Rôle :** URL du webhook Make.com pour les demandes de méthodologie. Quand un utilisateur demande à recevoir la documentation des méthodes de calcul par email.

**Utilisé par :** `handleMethodologyRequest()` dans `main.go`.

**Payload envoyé :**

```json
{
  "email": "utilisateur@example.com",
  "categories": ["prestation_compensatoire", "pension_alimentaire"]
}
```

---

### `ALLOWED_ORIGINS`

**Valeur actuelle :**

```
https://simuldivorce.fr,https://www.simuldivorce.fr,http://localhost:5173,http://localhost:4173
```

**Rôle :** Liste des origines autorisées pour les requêtes cross-origin (CORS). Séparées par des virgules.

**Utilisé par :** La configuration CORS dans `main()`.

**Quand modifier :** Si vous ajoutez un nouveau domaine frontend ou un nouveau port de développement.

---

### `PORT`

**Valeur actuelle :** `8080`

**Rôle :** Port sur lequel le serveur Go écoute.

**Utilisé par :** `r.Run(":" + port)` dans `main()`.

---

## Template .env

Pour configurer un nouveau serveur, copiez ce template :

```env
# Backend secrets — NEVER commit to git

# Google Apps Script Web App URL for Drive upload
DRIVE_UPLOAD_URL=https://script.google.com/macros/s/AKfycbw3ZcfEiSLnU0JjpdG-KcYfPxzklXlgxNVc0oYItTWof2ig5VsBGJI7BnjISXQoZ_I8Bg/exec

# Make.com webhook URL for lawyer document delivery notification
WEBHOOK_URL=https://hook.eu2.make.com/VOTRE_WEBHOOK_DELIVER_ID

# Make.com webhook URL for methodology email requests
METHODOLOGY_WEBHOOK_URL=https://hook.eu2.make.com/qq7wul9bqju013r26u95iecsfoxy4p7g

# Allowed CORS origins (comma-separated)
ALLOWED_ORIGINS=https://simuldivorce.fr,https://www.simuldivorce.fr,http://localhost:5173,http://localhost:4173

# Server port
PORT=8080
```
