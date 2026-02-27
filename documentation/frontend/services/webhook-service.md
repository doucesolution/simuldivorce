# 🌐 Service de livraison (webhookService.ts)

## Description

`webhookService.ts` gère la **livraison des documents Word** générés par l'application avocat. Il convertit le document en base64 et l'envoie au backend Go.

**Chemin :** `frontend/src/services/webhookService.ts`
**Taille :** ~90 lignes

---

## Flux de livraison

```
Document Word (.docx Blob)
        │
        ▼
blobToBase64(blob)  ← Conversion en base64
        │
        ▼
POST /api/deliver   ← Envoi au backend Go
    { fileBase64, email }
        │
        ▼
Backend Go
    ├── Upload Google Drive (Apps Script)
    └── Notification Make.com (webhook)
        │
        ▼
{ documentId }  ← ID de confirmation
```

---

## Configuration

```typescript
const API_BASE = import.meta.env.VITE_API_URL || "";
```

- **Développement** : `VITE_API_URL=http://localhost:8080`
- **Production** : chaîne vide (même domaine via reverse proxy)

---

## Fonctions exportées

### `deliverDocument(blob, email): Promise<string>`

Fonction principale de livraison :

1. Convertit le Blob en base64 via `blobToBase64()`
2. Envoie un `POST` à `/api/deliver` avec :
   ```json
   {
     "fileBase64": "UEsDBBQAAAA...",
     "email": "avocat@example.fr"
   }
   ```
3. Le backend retourne un `documentId`
4. En cas d'erreur HTTP, lance une `Error` descriptive

### `isDeliveryConfigured(): boolean`

Retourne toujours `true` actuellement. Pourrait être étendu pour vérifier la disponibilité du backend.

---

## Utilitaire interne

### `blobToBase64(blob): Promise<string>`

Convertit un Blob binaire en chaîne base64 **sans préfixe data URL** :

- Utilise `FileReader.readAsDataURL()`
- Extrait la partie après la virgule (`data:...;base64,` → supprimé)

---

## Comment modifier

### Ajouter des métadonnées à l'envoi

Modifier le `body` du `fetch` dans `deliverDocument()` :

```typescript
body: JSON.stringify({ fileBase64, email, caseRef: "xxx" });
```

Puis adapter le backend Go pour lire le nouveau champ.

### Ajouter un health check

Modifier `isDeliveryConfigured()` pour appeler `GET /api/health` :

```typescript
export async function isDeliveryConfigured(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/health`);
    return res.ok;
  } catch {
    return false;
  }
}
```
