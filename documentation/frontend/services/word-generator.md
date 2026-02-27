# 📝 Générateur Word (wordGenerator.ts)

## Description

`wordGenerator.ts` génère le **document Word professionnel** destiné aux avocats (mode Pro/Lawyer). C'est un fichier `.docx` complet avec l'identité de l'avocat, les données des parties, et les résultats de calcul.

**Chemin :** `frontend/src/services/wordGenerator.ts`
**Taille :** ~965 lignes
**Bibliothèque :** [docx](https://github.com/dolanmiri/docx) (import statique)

---

## Différences avec le PDF client

| Aspect          | PDF (Client)            | Word (Avocat)                      |
| --------------- | ----------------------- | ---------------------------------- |
| Format          | PDF jsPDF               | .docx via docx lib                 |
| En-tête         | SimulDivorce branding   | Logo cabinet + identité avocat     |
| Filigrane       | "DOCUMENT NON OFFICIEL" | Aucun                              |
| Destinataire    | Particulier             | Avocat professionnel               |
| Données parties | Anonymes                | Noms, adresses, dates de naissance |
| Export          | Téléchargement direct   | Upload Google Drive + email        |

---

## Structure du document Word généré

1. **En-tête**
   - Logo du cabinet (si uploadé) en haut à gauche
   - Nom de l'avocat, cabinet, adresse, contact
   - Date d'évaluation

2. **Identité des parties**
   - Tableau : Débiteur vs Créancier
   - Dates de naissance, adresses complètes

3. **Données financières**
   - Tableaux détaillés avec revenus, patrimoine
   - Lignes alternées (zebra striping)

4. **Résultats par méthode**
   - Tiers Pondéré : valeur + range
   - INSEE : valeur + range
   - Axel-Depondt : valeur + range + mensualités

5. **Synthèse**
   - Moyenne des 3 méthodes
   - Capacité d'épargne du débiteur

6. **Pied de page**
   - Numéro de page

---

## Constantes de design

```typescript
const TEAL = "0D9488"; // Accent principal — bandeaux de sections
const TEAL_LIGHT = "CCFBF1"; // Fond clair des en-têtes
const SLATE = "334155"; // Texte principal
const MUTED = "64748B"; // Texte secondaire
const ROW_EVEN = "FFFFFF"; // Lignes paires (blanc)
const ROW_ODD = "F8FAFC"; // Lignes impaires (gris très clair)
const ACCENT_ROW = "F0FDFA"; // Lignes résultat
const BORDER_COLOR = "CBD5E1"; // Bordures de cellules
```

---

## Utilitaires internes

### `dataUrlToUint8Array(dataUrl)`

Convertit une data URL base64 (logo cabinet) en `Uint8Array` pour l'embedding dans le document Word.

### `euro(n)`

Formate un nombre en euros avec locale française : `12500` → `"12 500 €"`.

---

## Flux de livraison

```
wordGenerator.generateDocument()
        │
        ▼
    Blob .docx
        │
        ▼
webhookService.deliverDocument(blob, email)
        │
        ▼
Backend Go /api/deliver
        │
        ├── Upload Google Drive
        └── Notification webhook (Make.com)
```

---

## Comment modifier le document Word

### Changer les couleurs

Modifier les constantes en haut du fichier (`TEAL`, `SLATE`, etc.).

### Ajouter une section

Créer un nouveau bloc `Paragraph` + `Table` dans la fonction `generateDocument()` et l'insérer dans le tableau `children` du `Document`.

### Modifier les marges

Changer la propriété `page.margin` dans le constructeur `Document` :

```typescript
new Document({
    sections: [{
        properties: {
            page: {
                margin: { top: 720, right: 720, bottom: 720, left: 720 }
            }
        },
        children: [...]
    }]
})
```

(Les marges sont en twips : 720 twips = 0.5 inch)

### Ajouter un champ dans les tableaux

Ajouter un `TableRow` avec des `TableCell` contenant des `Paragraph` et `TextRun`.
