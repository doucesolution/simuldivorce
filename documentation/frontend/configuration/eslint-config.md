# 🔍 Frontend — Configuration ESLint (eslint.config.js)

## Description

ESLint est le **linter** qui analyse le code TypeScript/React pour détecter les erreurs et les mauvaises pratiques.

**Chemin :** `frontend/eslint.config.js`

---

## Configuration

Le fichier utilise le format "flat config" d'ESLint 9 :

```javascript
export default tseslint.config(
  { ignores: ["dist"] }, // Ignorer le dossier de build
  {
    extends: [
      js.configs.recommended, // Règles JS de base
      ...tseslint.configs.recommended, // Règles TypeScript
    ],
    files: ["**/*.{ts,tsx}"], // Appliquer aux fichiers TS/TSX
    plugins: {
      "react-hooks": reactHooks, // Valider les hooks React
      "react-refresh": reactRefresh, // Valider le HMR React
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
    },
  },
);
```

---

## Commande

```bash
# Lancer le lint sur tout le projet
npm run lint
```

---

## Comment ajouter une règle

Modifier le fichier `eslint.config.js`, section `rules` :

```javascript
rules: {
    "no-console": "warn",              // Avertir sur les console.log
    "@typescript-eslint/no-unused-vars": "error",  // Erreur sur les variables inutilisées
}
```
