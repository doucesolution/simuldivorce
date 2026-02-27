# 📄 Générateur de PDF (pdfGenerator.ts)

## Description

`pdfGenerator.ts` génère le **rapport PDF de simulation** destiné aux utilisateurs web (mode client). C'est un document complet avec les résultats des 3 méthodes de calcul.

**Chemin :** `frontend/src/services/pdfGenerator.ts`
**Taille :** ~965 lignes
**Bibliothèque :** [jsPDF](https://github.com/parallax/jsPDF) (import dynamique)

---

## Caractéristiques du PDF généré

- **Format** : A4 portrait, unités en millimètres
- **Identifiant** : Hash hexadécimal unique par session (ex: `#A3F2B1`)
- **Date** : Date/heure de génération en format français
- **Filigrane** : "DOCUMENT NON OFFICIEL" en diagonal sur chaque page
- **En-tête** : Barre sombre SimulDivorce sur chaque page
- **Pied de page** : "Document généré automatiquement — Non officiel" + numéro de page
- **Design** : Palette slate/teal cohérente

---

## Structure du document généré

1. **Page 1 — En-tête + Synthèse**
   - Barre de marque SimulDivorce
   - Hash de session + date
   - Montant moyen de la prestation compensatoire

2. **Page 1-2 — Résultats détaillés**
   - Méthode du Tiers Pondéré (min / valeur / max)
   - Méthode INSEE (min / valeur / max)
   - Méthode Axel-Depondt (min / valeur / max + mensualités)

3. **Page 2-3 — Données d'entrée récapitulées**
   - Durée du mariage
   - Revenus des deux parties
   - Enfants et type de garde
   - Patrimoine immobilier

4. **Dernière page — Mentions légales**
   - Avertissement juridique
   - Conditions d'utilisation

---

## Constantes de design

```typescript
const COLOR_PRIMARY = "#0F172A"; // Slate 900 — en-têtes, texte principal
const COLOR_ACCENT = "#14B8A6"; // Teal 500 — accents, sous-titres
const COLOR_MUTED = "#64748B"; // Slate 500 — texte secondaire
```

---

## Fonctions internes principales

### `drawWatermark()`

Dessine "DOCUMENT NON OFFICIEL" en diagonal, opacité 12%, sur toute la page.

### `drawHeader()`

Barre sombre en haut de page avec "SimulDivorce" + "SIMULATION DU DIVORCE".

### `drawFooter(pageNum, totalPages)`

Texte d'avertissement + numéro de page en bas.

### `addPage()`

Ajoute une nouvelle page avec filigrane + en-tête + pied de page.

### `drawSectionTitle(num, title, y)`

Titre de section numéroté avec ligne décorative.

### `drawMethodResult(name, detail, description, y)`

Bloc de résultat pour une méthode : valeur centrale + range min-max.

---

## Import dynamique

```typescript
const { jsPDF } = await import("jspdf");
```

jsPDF est importé dynamiquement pour le **code-splitting**. La bibliothèque (~200KB) n'est chargée que quand l'utilisateur clique sur "Exporter PDF".

---

## Comment modifier le PDF

### Changer les couleurs

Modifier les constantes `COLOR_PRIMARY`, `COLOR_ACCENT`, `COLOR_MUTED` en haut du fichier.

### Ajouter une section

1. Vérifier qu'il reste de la place sur la page (sinon `addPage()`)
2. Appeler `drawSectionTitle()` pour le titre
3. Ajouter le contenu avec `doc.text()` ou `doc.rect()`

### Modifier le filigrane

Changer le texte dans `drawWatermark()` et ajuster l'opacité dans `GState({ opacity: 0.12 })`.

### Changer le format de date

Modifier les options `toLocaleString("fr-FR", {...})`.
