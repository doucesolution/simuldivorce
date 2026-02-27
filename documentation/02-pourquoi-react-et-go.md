# 🔧 Pourquoi React et Go ? Comment sont-ils utilisés ?

## Pourquoi ces technologies ?

### React (Frontend)

**Pourquoi React plutôt qu'un autre framework ?**

1. **Écosystème mature** — React est le framework le plus utilisé au monde. Il dispose d'une communauté immense, de milliers de librairies compatibles, et d'une documentation exhaustive.

2. **Composants réutilisables** — Chaque élément de l'interface (bouton, formulaire, tooltip) est un composant indépendant qu'on peut réutiliser partout. Par exemple, `InfoTooltip` est utilisé sur toutes les pages de formulaire.

3. **Performance avec le Virtual DOM** — React ne met à jour que les parties du DOM qui ont changé, au lieu de re-rendre toute la page. C'est crucial quand l'utilisateur remplit des formulaires complexes avec beaucoup de champs.

4. **Code-splitting natif** — Avec `React.lazy()` et Vite, chaque page est dans un fichier JS séparé. L'utilisateur ne télécharge que le code dont il a besoin, ce qui réduit le temps de chargement initial.

5. **Compatibilité Capacitor** — React compile en HTML/CSS/JS standard, ce qui est parfaitement compatible avec Capacitor pour créer l'application Android native.

6. **TypeScript** — React s'intègre parfaitement avec TypeScript pour un typage statique qui prévient les bugs à la compilation plutôt qu'à l'exécution.

### Go (Backend)

**Pourquoi Go plutôt que Node.js, Python ou un autre langage ?**

1. **Performance** — Go est un langage compilé, beaucoup plus rapide que Python ou Node.js. Un serveur Go consomme très peu de mémoire et de CPU.

2. **Concurrence native** — Go gère des milliers de requêtes simultanées grâce aux goroutines (threads légers). Gin traite chaque requête HTTP dans sa propre goroutine automatiquement.

3. **Binaire unique** — Le serveur Go se compile en un seul fichier exécutable. Pas besoin de `node_modules` (500+ Mo) ni d'un runtime. Le Docker de production est minuscule (~15 Mo).

4. **Simplicité** — Go a une syntaxe simple et explicite. Pas de magie noire, pas de frameworks lourds. Le fichier `main.go` fait 610 lignes et contient TOUT le backend.

5. **Sécurité** — Go est typé statiquement et compile sans avertissements. Les erreurs sont explicites (pas de `null pointer exceptions` silencieuses).

6. **Idéal pour les API** — Go + Gin est un combo parfait pour une API REST légère qui fait du proxy vers des services externes (Google Drive, Make.com).

---

## Comment React est utilisé dans SimulDivorce

### Structure du code React

```
frontend/src/
├── main.tsx          ← Point d'entrée : monte React dans le DOM
├── App.tsx           ← Routeur principal (toutes les routes)
├── index.css         ← Styles globaux (thème, couleurs CSS variables)
├── components/       ← Composants réutilisables (boutons, tooltips, etc.)
├── pages/            ← Pages complètes (une par route URL)
└── services/         ← Logique métier (calculs, stockage, génération docs)
```

### Concepts React utilisés

#### 1. Hooks (useState, useEffect, useMemo, useCallback)

```tsx
// useState — stocker l'état local d'un composant
const [income, setIncome] = useState(""); // champ de saisie

// useEffect — exécuter du code après le rendu (chargement de données, etc.)
useEffect(() => {
  const saved = loadFormData(); // Charger les données au montage du composant
  setIncome(saved.myIncome);
}, []); // [] = exécuter une seule fois au montage

// useMemo — mémoriser un calcul coûteux pour éviter de le refaire à chaque rendu
const result = useMemo(() => legalEngine.calculate(data), [data]);
```

#### 2. Context API (guidedMode.tsx)

```tsx
// Créer un contexte partagé pour le mode guidé
const GuidedModeContext = createContext<GuidedModeContextType>(defaultValue);

// Envelopper toute l'app dans le Provider (App.tsx)
<GuidedModeProvider>
  <Routes>...</Routes>
</GuidedModeProvider>;

// N'importe quel composant enfant peut lire le contexte
const { isGuided, setMode } = useGuidedMode();
```

#### 3. React Router (navigation)

```tsx
// Définir les routes dans App.tsx
<Routes>
  <Route path="/" element={<LandingPage />} />
  <Route path="/dashboard" element={<DashboardPage />} />
</Routes>;

// Naviguer programmatiquement depuis un composant
const navigate = useNavigate();
navigate("/dashboard"); // Aller à la page des résultats
```

#### 4. Lazy Loading (code-splitting)

```tsx
// Chaque page est chargée à la demande
const DashboardPage = lazy(() => import("./pages/DashboardPage"));

// Suspense affiche un spinner pendant le chargement
<Suspense fallback={<Spinner />}>
  <Routes>...</Routes>
</Suspense>;
```

---

## Comment Go est utilisé dans SimulDivorce

### Structure du code Go

```
backend/
├── main.go                    ← Tout le serveur (610 lignes)
├── go.mod                     ← Dépendances Go
├── Dockerfile                 ← Image Docker de production
├── .env                       ← Variables d'environnement (secrets)
└── google-apps-script/
    └── drive-upload.gs.js     ← Script Google Drive (déployé séparément)
```

### Concepts Go utilisés

#### 1. Gin (serveur HTTP)

```go
// Créer un routeur Gin avec middleware par défaut (logger + recovery)
r := gin.Default()

// Définir les routes
api := r.Group("/api")
api.GET("/config", getConfig)
api.POST("/deliver", rateLimitMiddleware(rl), handleDeliver)

// Démarrer le serveur
r.Run(":8080")
```

#### 2. Middleware (CORS, rate limiting)

```go
// CORS — autoriser le frontend à appeler le backend
r.Use(cors.New(cors.Config{
    AllowOrigins: []string{"https://simuldivorce.fr"},
    AllowMethods: []string{"GET", "POST", "OPTIONS"},
}))

// Rate limiting — limiter à 5 requêtes par minute par IP
rl := newRateLimiter(5, time.Minute)
api.POST("/deliver", rateLimitMiddleware(rl), handleDeliver)
```

#### 3. Handlers (traitement des requêtes)

```go
// Handler simple — retourne du JSON
func getConfig(c *gin.Context) {
    config := LegalConfig{SMIC: 1398.69}
    c.JSON(http.StatusOK, config)
}

// Handler avec validation + appels externes
func handleDeliver(c *gin.Context) {
    var req DeliverRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(400, gin.H{"error": err.Error()})
        return
    }
    // Upload vers Google Drive...
    // Notification webhook...
}
```

#### 4. Variables d'environnement

```go
// Charger le .env au démarrage
_ = godotenv.Load()

// Lire avec fallback
port := env("PORT", "8080")
```

---

## Résumé des responsabilités

| Responsabilité        | React (Frontend)  | Go (Backend)      |
| --------------------- | ----------------- | ----------------- |
| Interface utilisateur | ✅                | ❌                |
| Calculs juridiques    | ✅ (côté client)  | ❌                |
| Stockage des données  | ✅ (localStorage) | ❌                |
| Génération PDF/Word   | ✅ (côté client)  | ❌                |
| Constantes légales    | ❌                | ✅ (/api/config)  |
| Upload Google Drive   | ❌                | ✅ (/api/deliver) |
| Envoi d'emails        | ❌                | ✅ (webhook)      |
| Rate limiting         | ❌                | ✅ (middleware)   |
| CORS                  | ❌                | ✅ (middleware)   |

**Point clé :** Les calculs et la génération de documents se font **entièrement côté client** (dans le navigateur). Le backend ne sert qu'à proxy les appels vers des services externes (Google Drive, Make.com) pour ne pas exposer les secrets (URLs, clés API) dans le code frontend.
