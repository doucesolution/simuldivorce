# 🔄 Communication Frontend ↔ Backend

## Vue d'ensemble

Le frontend React et le backend Go communiquent via des **requêtes HTTP REST** standard. Le frontend envoie des requêtes JSON au backend, qui les traite et répond en JSON.

```
┌──────────────┐         HTTP/JSON          ┌──────────────┐
│   FRONTEND   │ ◄───────────────────────▶  │   BACKEND    │
│  React + TS  │                            │   Go + Gin   │
│  Port 5173   │                            │   Port 8080  │
└──────────────┘                            └──────────────┘
```

---

## Les 3 endpoints de l'API

### 1. `GET /api/config` — Constantes légales

**But :** Fournir les constantes juridiques françaises (SMIC, taux d'imposition) au frontend. Centraliser ces valeurs dans le backend garantit que tous les utilisateurs utilisent les mêmes chiffres, sans nécessiter un redéploiement du frontend quand la loi change.

**Requête :**
```
GET http://localhost:8080/api/config
```

**Réponse :**
```json
{
  "smic": 1398.69,
  "tax_rate_low": 0.11,
  "tax_rate_high": 0.30,
  "legal_points_method": "Pilotelle"
}
```

**Côté frontend :** Ce endpoint n'est actuellement pas appelé activement — les calculs utilisent directement les valeurs codées dans `legalEngine.ts`. C'est prévu pour une évolution future où le frontend consulterait le backend pour avoir des valeurs à jour.

---

### 2. `POST /api/deliver` — Livraison de documents

**But :** Uploader un document Word généré côté client vers Google Drive, puis envoyer un email à l'utilisateur avec le lien de téléchargement.

**Flux complet :**

```
1. Frontend génère un fichier .docx (librairie 'docx')
2. Frontend convertit le Blob en base64 (blobToBase64)
3. Frontend POST vers /api/deliver avec { fileBase64, email }
4. Backend reçoit et valide la requête
5. Backend POST vers Google Apps Script (Upload Drive)
6. Google Apps Script décode le base64, crée le fichier .docx dans Drive
7. Backend POST vers Make.com webhook avec { email, documentId }
8. Make.com envoie l'email avec le lien de téléchargement
9. Backend renvoie { documentId } au frontend
```

**Requête :**
```json
POST http://localhost:8080/api/deliver
Content-Type: application/json

{
  "fileBase64": "UEsDBBQAAAAIALtH...",  // Fichier .docx encodé en base64
  "email": "utilisateur@example.com"
}
```

**Réponse (succès) :**
```json
{
  "documentId": "18f3a2b4c00-3f1a"
}
```

**Réponse (succès partiel — upload OK mais webhook échoué) :**
```json
{
  "documentId": "18f3a2b4c00-3f1a",
  "warning": "webhook notification failed"
}
```

**Côté frontend :** Appelé par `webhookService.ts` > `deliverDocument()`.

---

### 3. `POST /api/methodology-request` — Demande de méthodologie

**But :** Quand un utilisateur veut recevoir les documents de méthodologie de calcul par email, le frontend envoie sa demande au backend qui la transmet à un webhook Make.com.

**Flux :**
```
1. Utilisateur sélectionne les catégories de méthodologie souhaitées
2. Utilisateur saisit son email
3. Frontend POST vers /api/methodology-request
4. Backend forward vers le webhook Make.com
5. Make.com envoie l'email avec les documents de méthodologie
```

**Requête :**
```json
POST http://localhost:8080/api/methodology-request
Content-Type: application/json

{
  "email": "utilisateur@example.com",
  "categories": ["prestation_compensatoire", "pension_alimentaire"]
}
```

**Réponse :**
```json
{
  "status": "ok"
}
```

**Côté frontend :** Appelé par `MethodologyPage.tsx`.

---

## CORS (Cross-Origin Resource Sharing)

Le frontend (port 5173) et le backend (port 8080) tournent sur des ports différents. Le navigateur bloque par défaut les requêtes cross-origin. Le backend configure CORS pour autoriser les origines connues :

```
Origines autorisées :
- https://simuldivorce.fr        (production)
- https://www.simuldivorce.fr    (production avec www)
- http://localhost:5173           (dev, serveur Vite)
- http://localhost:4173           (preview)
```

Configuration dans `.env` :
```
ALLOWED_ORIGINS=https://simuldivorce.fr,https://www.simuldivorce.fr,http://localhost:5173,http://localhost:4173
```

---

## Rate Limiting

Chaque endpoint POST est protégé par un rate limiter indépendant :

| Endpoint | Limite | Fenêtre |
|----------|--------|---------|
| `/api/deliver` | 5 requêtes | par minute par IP |
| `/api/methodology-request` | 5 requêtes | par minute par IP |
| `/api/config` | Illimité | — |

Le rate limiter est implémenté en mémoire (pas de Redis). Il se réinitialise quand le serveur redémarre.

---

## Variables d'environnement du backend

Fichier `backend/.env` :

```env
# URL du Google Apps Script pour l'upload Drive
DRIVE_UPLOAD_URL=https://script.google.com/macros/s/AKfycbw3ZcfEiSLnU0JjpdG-KcYfPxzklXlgxNVc0oYItTWof2ig5VsBGJI7BnjISXQoZ_I8Bg/exec

# Webhook Make.com pour la livraison de documents
WEBHOOK_URL=https://hook.eu2.make.com/VOTRE_WEBHOOK_ID

# Webhook Make.com pour les demandes de méthodologie
METHODOLOGY_WEBHOOK_URL=https://hook.eu2.make.com/qq7wul9bqju013r26u95iecsfoxy4p7g

# Origines CORS autorisées
ALLOWED_ORIGINS=https://simuldivorce.fr,https://www.simuldivorce.fr,http://localhost:5173,http://localhost:4173

# Port du serveur
PORT=8080
```

**⚠️ Ne jamais committer ce fichier `.env` dans Git !** Il contient des secrets (URLs de webhooks).

---

## Variable d'environnement du frontend

Le frontend utilise une seule variable d'environnement Vite :

```env
# URL de base du backend (dans .env.local ou .env.production)
VITE_API_URL=http://localhost:8080
```

En production, si le frontend et le backend sont derrière le même reverse proxy, `VITE_API_URL` peut être vide (requêtes same-origin).

---

## Schéma de communication complet

```
                    ┌─────────────────┐
                    │   UTILISATEUR   │
                    └────────┬────────┘
                             │ Saisit données + email
                             ▼
                    ┌─────────────────┐
                    │    FRONTEND     │
                    │  (React + TS)   │
                    │                 │
                    │ 1. Calcule PC   │
                    │ 2. Génère .docx │
                    │ 3. Encode base64│
                    └────────┬────────┘
                             │ POST /api/deliver
                             │ { fileBase64, email }
                             ▼
                    ┌─────────────────┐
                    │    BACKEND      │
                    │   (Go + Gin)    │
                    │                 │
                    │ 4. Valide req   │
                    │ 5. Rate limit   │
                    └────┬───────┬────┘
                         │       │
            POST (text/plain)    POST (application/json)
                         │       │
                         ▼       ▼
              ┌───────────┐  ┌──────────┐
              │  Google    │  │ Make.com │
              │  Apps      │  │ Webhook  │
              │  Script    │  │          │
              │            │  │ 8. Email │
              │ 6. Decode  │  │    avec  │
              │ 7. Save    │  │    lien  │
              │    .docx   │  │          │
              │    Drive   │  │          │
              └───────────┘  └──────────┘
```

---

## Google Apps Script — Upload Drive

Le Google Apps Script est déployé séparément (pas dans le backend Go). Il sert d'intermédiaire entre le backend et Google Drive.

**URL du script :**
```
https://script.google.com/macros/s/AKfycbw3ZcfEiSLnU0JjpdG-KcYfPxzklXlgxNVc0oYItTWof2ig5VsBGJI7BnjISXQoZ_I8Bg/exec
```

**ID de déploiement :**
```
AKfycbw3ZcfEiSLnU0JjpdG-KcYfPxzklXlgxNVc0oYItTWof2ig5VsBGJI7BnjISXQoZ_I8Bg
```

**Pourquoi `text/plain` au lieu de `application/json` ?**
Google Apps Script ne gère pas les requêtes CORS preflight (OPTIONS). En envoyant `text/plain`, le navigateur/backend fait une "simple request" qui n'a pas besoin de preflight.

Voir la documentation détaillée : [backend/google-apps-script.md](backend/google-apps-script.md)
