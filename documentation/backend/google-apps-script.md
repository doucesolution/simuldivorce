# 📤 Backend — Google Apps Script (drive-upload.gs.js)

## Description

Ce script Google Apps Script est déployé en tant que **Web App** et sert de pont entre le backend Go et Google Drive. Il reçoit un fichier `.docx` encodé en base64, le décode, et le sauvegarde dans un dossier Google Drive spécifique.

**Chemin local :** `backend/google-apps-script/drive-upload.gs.js`
**Déployé sur :** Google Apps Script (séparément du backend Go)

---

## Informations de déploiement

| Propriété               | Valeur                                                                                                               |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **URL du script**       | `https://script.google.com/macros/s/AKfycbw3ZcfEiSLnU0JjpdG-KcYfPxzklXlgxNVc0oYItTWof2ig5VsBGJI7BnjISXQoZ_I8Bg/exec` |
| **ID de déploiement**   | `AKfycbw3ZcfEiSLnU0JjpdG-KcYfPxzklXlgxNVc0oYItTWof2ig5VsBGJI7BnjISXQoZ_I8Bg`                                         |
| **Exécuté en tant que** | Moi (le propriétaire du script Google)                                                                               |
| **Accès**               | Tout le monde (anyone)                                                                                               |

---

## Comment ça marche

### Flux de traitement

```
Backend Go                     Google Apps Script               Google Drive
    │                                │                              │
    │  POST (text/plain)             │                              │
    │  { fileBase64, documentId }    │                              │
    ├───────────────────────────────▶│                              │
    │                                │  1. Parse JSON               │
    │                                │  2. Decode base64            │
    │                                │  3. Créer Blob .docx         │
    │                                │  4. Sauvegarder dans Drive ──┤
    │                                │                              │ fichier.docx
    │  { success, fileId, url }      │                              │
    │◀───────────────────────────────┤                              │
```

### Fonctions du script

#### `doPost(e)` — Point d'entrée

C'est la fonction appelée automatiquement par Google quand une requête POST arrive sur l'URL du Web App.

1. Récupère le dossier Drive cible via `FOLDER_ID`
2. Parse le JSON du body de la requête
3. Extrait `fileBase64` et `documentId`
4. Décode le base64 en bytes
5. Crée un Blob avec le type MIME `.docx`
6. Sauvegarde le fichier dans le dossier Drive
7. Retourne le `fileId`, `fileName` et `url` du fichier créé

#### `doGet(e)` — Test/diagnostic

Retourne un simple message JSON pour vérifier que le script est déployé et accessible :

```json
{ "status": "ok", "message": "SimulDivorce Drive upload endpoint is live." }
```

---

## Configuration (FOLDER_ID)

La variable `FOLDER_ID` doit contenir l'identifiant du dossier Google Drive cible :

```javascript
var FOLDER_ID = "PASTE_YOUR_FOLDER_ID_HERE";
```

**Comment trouver l'ID du dossier :**

1. Ouvrez Google Drive
2. Naviguez vers le dossier souhaité
3. Regardez l'URL : `https://drive.google.com/drive/folders/` **`1a2B3c4D5e6F7g8H9i`**
4. La partie après `/folders/` est l'ID du dossier

---

## Pourquoi `text/plain` au lieu de `application/json` ?

Google Apps Script Web Apps ne gèrent **pas** les requêtes CORS preflight (OPTIONS). En utilisant `Content-Type: text/plain`, la requête est considérée comme une **"simple request"** par le navigateur, ce qui évite l'envoi automatique d'une requête preflight OPTIONS que GAS ne peut pas traiter.

Le script parse manuellement le JSON depuis le body text :

```javascript
var json = JSON.parse(e.postData.contents);
```

---

## Comment déployer / mettre à jour

### Premier déploiement

1. Allez sur https://script.google.com
2. Créez un nouveau projet
3. Collez le contenu de `drive-upload.gs.js` dans `Code.gs`
4. Remplacez `FOLDER_ID` par votre ID de dossier Drive
5. Cliquez sur **Déployer** → **Nouveau déploiement**
6. Type : **Application web**
7. Exécuter en tant que : **Moi**
8. Qui a accès : **Tout le monde**
9. Cliquez **Déployer** et autorisez
10. Copiez l'URL Web App → collez-la dans `backend/.env` comme `DRIVE_UPLOAD_URL`

### Mise à jour

1. Modifiez le code dans l'éditeur Google Apps Script
2. Cliquez sur **Déployer** → **Gérer les déploiements**
3. Cliquez sur l'icône crayon (modifier) du déploiement existant
4. Changez la **Version** en **Nouveau déploiement**
5. Cliquez **Déployer**

**⚠️ Important :** Si vous créez un **nouveau** déploiement (au lieu de mettre à jour l'existant), l'URL changera ! Il faudra alors mettre à jour `DRIVE_UPLOAD_URL` dans le `.env` du backend.

---

## Gestion des erreurs

Le script gère les erreurs avec un try/catch global :

- **Pas de `fileBase64`** → `{ success: false, error: "No fileBase64 in request body" }`
- **Erreur inattendue** → `{ success: false, error: "message d'erreur" }`
- **Succès** → `{ success: true, fileId: "...", fileName: "...", url: "..." }`

---

## Limites

- **Taille maximale** : Google Apps Script limite les payloads à environ **50 Mo** (après décodage base64)
- **Temps d'exécution** : Max 6 minutes par exécution
- **Quotas** : ~20 000 appels/jour avec un compte Google gratuit
- **Stockage** : Dépend de l'espace Drive disponible du compte Google
