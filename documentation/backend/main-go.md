# 📦 Backend — main.go (Serveur Go)

## Description

`main.go` est le **fichier unique** du backend SimulDivorce. Il contient tout le serveur API en **610 lignes** de Go. C'est l'un des avantages de Go : un seul fichier suffit pour un backend complet.

**Chemin :** `backend/main.go`

---

## Structure du fichier

```
main.go
├── Imports                          (lignes 1-50)
├── env()                            — Helper pour lire les variables d'environnement
├── Types
│   ├── LegalConfig                  — Constantes légales (SMIC, taux)
│   ├── DeliverRequest               — Payload de /api/deliver
│   └── MethodologyRequest           — Payload de /api/methodology-request
├── Rate Limiter
│   ├── rateLimiter struct           — Structure du limiteur
│   ├── newRateLimiter()             — Constructeur
│   ├── allow()                      — Vérifie si une requête est autorisée
│   └── rateLimitMiddleware()        — Middleware Gin
├── main()                           — Point d'entrée, configuration du serveur
└── Handlers
    ├── getConfig()                  — GET /api/config
    ├── handleDeliver()              — POST /api/deliver
    └── handleMethodologyRequest()   — POST /api/methodology-request
```

---

## Détail de chaque section

### 1. Fonction `env(key, fallback)`

```go
func env(key, fallback string) string {
    if v := os.Getenv(key); v != "" {
        return v
    }
    return fallback
}
```

**Rôle :** Lire une variable d'environnement avec une valeur par défaut. Utilisé partout pour la configuration (port, URLs, origines CORS).

### 2. Types (structs)

#### `LegalConfig`

```go
type LegalConfig struct {
    SMIC        float64 `json:"smic"`
    TaxRateLow  float64 `json:"tax_rate_low"`
    TaxRateHigh float64 `json:"tax_rate_high"`
    LegalPoints string  `json:"legal_points_method"`
}
```

Réponse JSON de `/api/config`. Contient les constantes légales françaises.

#### `DeliverRequest`

```go
type DeliverRequest struct {
    FileBase64 string `json:"fileBase64" binding:"required"`
    Email      string `json:"email"      binding:"required,email"`
}
```

Payload attendu par `/api/deliver`. Le `binding` tag permet à Gin de valider automatiquement.

#### `MethodologyRequest`

```go
type MethodologyRequest struct {
    Email      string   `json:"email"      binding:"required,email"`
    Categories []string `json:"categories" binding:"required,min=1"`
}
```

Payload de `/api/methodology-request`.

### 3. Rate Limiter (limitation de débit)

Un limiteur **sliding window** en mémoire :

- **Principe :** Pour chaque IP, on stocke les horodatages des requêtes récentes
- **Fenêtre :** Les requêtes plus anciennes que `window` (1 minute) sont supprimées
- **Limite :** Si le nombre de requêtes récentes ≥ `limit` (5), la requête est rejetée
- **Thread-safe :** Protégé par un `sync.Mutex` car Gin est concurrent

**⚠️ Limitations :**

- Se réinitialise au redémarrage du serveur
- Ne fonctionne pas en multi-instances (pas de Redis)

### 4. Fonction `main()`

Ordre d'exécution :

1. `godotenv.Load()` — Charge le fichier `.env`
2. `gin.Default()` — Crée le routeur avec logger + recovery
3. Configuration CORS — Autorise les origines du frontend
4. Création des rate limiters — 5 req/min par IP par endpoint
5. Déclaration des routes sous `/api`
6. `r.Run(":8080")` — Démarre le serveur HTTP

### 5. Handler `getConfig()`

**Route :** `GET /api/config`

Retourne les constantes légales en JSON. Pas de rate limiting (endpoint léger et en lecture seule).

**Comment modifier les constantes :**

1. Modifier les valeurs dans `getConfig()`
2. Recompiler : `go build`
3. Redémarrer le serveur

### 6. Handler `handleDeliver()`

**Route :** `POST /api/deliver`

Pipeline en 2 étapes :

1. **Upload vers Google Drive** — POST vers Google Apps Script avec `text/plain`
2. **Notification webhook** — POST vers Make.com avec `application/json`

Gestion d'erreur :

- Si l'upload Drive échoue → HTTP 502
- Si le webhook échoue mais Drive OK → HTTP 200 + warning (succès partiel)
- Si les deux réussissent → HTTP 200 + documentId

### 7. Handler `handleMethodologyRequest()`

**Route :** `POST /api/methodology-request`

Plus simple : forward direct vers le webhook Make.com. Pas de pipeline en 2 étapes.

---

## Comment modifier

### Ajouter un nouveau endpoint

```go
// Dans main(), après la déclaration des routes existantes :
api.GET("/nouveau-endpoint", monHandler)

// Créer le handler :
func monHandler(c *gin.Context) {
    c.JSON(http.StatusOK, gin.H{"message": "Hello"})
}
```

### Modifier les constantes légales

Modifier les valeurs dans `getConfig()` :

```go
config := LegalConfig{
    SMIC:        1500.00,   // ← Nouveau SMIC
    TaxRateLow:  0.11,
    TaxRateHigh: 0.30,
    LegalPoints: "Pilotelle",
}
```

### Modifier le rate limit

```go
// Dans main() :
deliverRL := newRateLimiter(10, time.Minute)  // ← 10 requêtes/minute au lieu de 5
```
