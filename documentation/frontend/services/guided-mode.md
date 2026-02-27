# 🧭 Mode guidé (guidedMode.tsx)

## Description

`guidedMode.tsx` gère le **mode de simulation guidée** via un Context React. Il permet de basculer entre un parcours accompagné (étape par étape) et un mode libre.

**Chemin :** `frontend/src/services/guidedMode.tsx`
**Taille :** ~70 lignes

---

## Les deux modes

| Mode         | Description              | UX                                                              |
| ------------ | ------------------------ | --------------------------------------------------------------- |
| **guided**   | Parcours étape par étape | L'utilisateur est dirigé page par page avec des tooltips d'aide |
| **unguided** | Navigation libre         | L'utilisateur va où il veut dans l'application                  |

---

## Architecture React Context

```
<GuidedModeProvider>              ← Fournit le contexte
    <App>
        <GuidedModeToggle />      ← Bouton pour changer de mode
        <GuidedHeaderTour />      ← Tour guidé dans le header
        <GuidedTooltip />         ← Tooltips d'aide contextuels
        <Pages ... />             ← Pages qui adaptent leur contenu
    </App>
</GuidedModeProvider>
```

---

## Interface du contexte

```typescript
interface GuidedModeContextType {
  mode: SimulationMode; // "guided" | "unguided" | null
  isGuided: boolean; // true si mode === "guided"
  setMode: (mode) => void; // Change le mode + persiste
}
```

---

## Persistence

Le mode est sauvegardé dans `localStorage.simulationMode` :

- Valeurs possibles : `"guided"`, `"unguided"`
- Par défaut : `"guided"` (nouveau visiteur)
- Persiste entre les sessions

---

## Exports

### `GuidedModeProvider`

Composant Provider qui wrappé autour de l'app dans `App.tsx`.

### `useGuidedMode()`

Hook personnalisé pour consommer le contexte :

```typescript
const { mode, isGuided, setMode } = useGuidedMode();

// Exemple dans un composant
if (isGuided) {
    return <StepByStepUI />;
} else {
    return <FreeFormUI />;
}
```

---

## Comment modifier

### Changer le mode par défaut

Dans le `useState`, modifier la valeur de fallback :

```typescript
return "unguided"; // Au lieu de "guided"
```

### Ajouter un nouveau mode

1. Étendre le type : `type SimulationMode = "guided" | "unguided" | "expert" | null`
2. Ajouter la logique dans le Provider
3. Créer un helper : `isExpert: mode === "expert"`
