# 📄 Détail de chaque page

---

## 1. LandingPage — Page d'accueil

**Fichier :** `frontend/src/pages/LandingPage.tsx` (~250 lignes)
**Route :** `/`

### Rôle

Page héro qui présente SimulDivorce et incite l'utilisateur à commencer la simulation.

### Contenu

- Logo et nom de marque
- Titre principal : "Simulateur Divorce Gratuit"
- Description du service
- Bouton "Commencer la simulation" → `/disclaimer`
- FAQ JSON-LD pour les rich results Google (5 questions/réponses)
- Orbe décoratif en arrière-plan (gradient radial + blur)

### Mode avocat

En mode `isLawyerMode()`, affiche des boutons supplémentaires :

- "Profil avocat" → `/profil-avocat`
- "Nouveau dossier" → `/disclaimer`

### SEO

- Title : "Simulateur Divorce Gratuit — Prestation Compensatoire"
- FAQ structured data (JSON-LD)

---

## 2. DisclaimerPage — Avertissements juridiques

**Fichier :** `frontend/src/pages/DisclaimerPage.tsx` (~344 lignes)
**Route :** `/disclaimer`

### Rôle

L'utilisateur doit cocher 5 avertissements légaux avant de pouvoir continuer.

### Les 5 avertissements

1. **Pas de valeur juridique** — L'outil est informatif, pas officiel
2. **Ne remplace pas un avocat** — Conseil juridique professionnel nécessaire
3. **Pas recevable en justice** — Le document n'a aucune valeur légale
4. **Limitations** — Calculs indicatifs basés sur des barèmes publics
5. **Aucune responsabilité** — L'éditeur ne peut être tenu responsible

### Logique

- Chaque bloc = icône + texte + checkbox
- Bouton "Continuer" activé uniquement quand les 5 sont cochés
- Au clic "Continuer" :
  - Stocke `disclaimerAccepted = true` dans localStorage
  - Auto-sélectionne les 3 méthodes de calcul
  - Auto-active le mode guidé
  - Navigue vers `/prestation-compensatoire`

---

## 3. PrestationCompensatoirePage — Données mariage/famille

**Fichier :** `frontend/src/pages/PrestationCompensatoirePage.tsx` (~661 lignes)
**Route :** `/prestation-compensatoire`

### Rôle

Première page de saisie : informations sur le mariage et la famille.

### Champs

- Date de mariage (obligatoire)
- Date du divorce (défaut : aujourd'hui)
- Nombre d'enfants (0-10)
- Âge de chaque enfant (dynamique, sliders)
- Type de garde : Classique / Alternée / Réduite

### Mode guidé

6 étapes guidées avec auto-avance :

1. Date de mariage
2. Date de divorce
3. Nombre d'enfants
4. Âge des enfants (si > 0)
5. Type de garde (si > 0)
6. Validation

### Barre de progression

Points en haut de page indiquant la position dans le wizard.

---

## 4. DebiteurPage — Données financières du débiteur

**Fichier :** `frontend/src/pages/DebiteurPage.tsx` (~641 lignes)
**Route :** `/informations-debiteur`

### Rôle

Collecte les informations financières de l'époux débiteur (celui qui paiera la prestation compensatoire).

### Champs communs (toutes méthodes)

- Date de naissance
- Revenu net mensuel (si méthodes Pilote ou INSEE sélectionnées)

### Champs Axel-Depondt (si sélectionné)

- Revenu brut (mensuel ou annuel)
- Contribution pour les enfants
- Changement de revenus prévu ? (oui/non)
  - Si oui : nouveau revenu, nouvelle contribution, date du changement
- Valeur du patrimoine immobilier
- Taux de rendement annuel (défaut : 3%)

### Composants utilisés

- `CurrencyInput` pour tous les montants
- `InfoTooltip` pour les explications juridiques
- `GuidedStep` pour le mode guidé

---

## 5. CreancierPage — Données financières du créancier

**Fichier :** `frontend/src/pages/CreancierPage.tsx` (~689 lignes)
**Route :** `/informations-creancier`

### Rôle

Identique au DebiteurPage mais pour le créancier (bénéficiaire de la prestation).

### Champs supplémentaires (Axel-Depondt)

- Années avant la retraite
- Revenu pré-retraite estimé

Ces champs alimentent le calcul de "compensation retraite" de la méthode Axel-Depondt.

---

## 6. RecapitulatifPage — Résumé avant calcul

**Fichier :** `frontend/src/pages/RecapitulatifPage.tsx` (~607 lignes)
**Route :** `/recapitulatif`

### Rôle

Affiche un résumé complet de toutes les données saisies pour vérification avant le calcul.

### Sections

1. Mariage (dates, durée calculée)
2. Famille (enfants, garde)
3. Débiteur (revenus, patrimoine)
4. Créancier (revenus, patrimoine)
5. Méthodes sélectionnées

### Actions

- **Modifier** : Boutons pour retourner à chaque page de saisie
- **Calculer** :
  1. Construit le `FinancialData` via `buildFinancialPayload()`
  2. Sauvegarde dans `localStorage.financialData`
  3. Navigue vers `/transition?to=/dashboard` (client) ou `/dashboard` (avocat)

### Formatage

- `formatDate()` — Dates en format français
- `formatCurrency()` — Montants en euros avec séparateurs
- `custodyLabel()` — Type de garde en français

---

## 7. InterstitialAdPage — Page de transition publicitaire

**Fichier :** `frontend/src/pages/InterstitialAdPage.tsx` (~250 lignes)
**Route :** `/transition?to={destination}`

### Rôle

Page intermédiaire avec publicité + contenu éditorial. Affichée avant le dashboard et l'export.

### Fonctionnement

- Lit le paramètre `?to=` pour connaître la destination
- Affiche un contenu éditorial adapté (exigence AdSense)
- Timer de 5 secondes avec compte à rebours visuel
- Bouton "Passer" apparaît après le timer
- Redirection automatique vers la destination

### Conformité AdSense

Google AdSense exige du "contenu éditorial" autour des publicités. Les variantes de contenu (stockées dans `CONTENT_VARIANTS`) fournissent des informations juridiques pertinentes.

---

## 8. DashboardPage — Résultats de simulation

**Fichier :** `frontend/src/pages/DashboardPage.tsx` (~293 lignes)
**Route :** `/dashboard`

### Rôle

**Page centrale** : affiche les résultats des 3 méthodes de calcul de la prestation compensatoire.

### Fonctionnement

1. Charge `financialData` depuis localStorage
2. Exécute `legalEngine.calculate(data)`
3. Affiche :
   - Montant moyen (toutes méthodes confondues)
   - Tiers Pondéré : min / valeur / max
   - INSEE : min / valeur / max
   - Axel-Depondt : min / valeur / max + mensualités sur 8 ans

### Affichage conditionnel

Seules les méthodes sélectionnées par l'utilisateur sont affichées (via `calculationChoices`).

### Navigation

- Bouton "Exporter" → `/transition?to=/export` (client) ou `/export-avocat` (avocat)

---

## 9. ExportPage — Export PDF (client)

**Fichier :** `frontend/src/pages/ExportPage.tsx` (~284 lignes)
**Route :** `/export`

### Rôle

Permet au client web de télécharger un PDF de simulation et d'effacer ses données.

### Actions

- **Télécharger PDF** → `pdfGenerator.generateReport(data, results)`
- **Effacer les données** → Modale de confirmation → `localStorage.clear()`
  - Animation "implosion" (rétrécit l'interface avant de naviguer)

---

## 10. LawyerProfilePage — Profil de l'avocat

**Fichier :** `frontend/src/pages/LawyerProfilePage.tsx` (~386 lignes)
**Route :** `/profil-avocat`

### Rôle

Page de gestion du profil professionnel de l'avocat (mode Pro uniquement).

### Champs

- Nom complet (ex: "Maître Jean Dupont")
- Email professionnel
- Téléphone
- Nom du cabinet
- Adresse du cabinet
- Ville + code postal
- N° SIRET / inscription barreau
- Logo du cabinet (upload image → data URL base64)

### Sauvegarde

Bouton "Enregistrer" → `saveLawyerProfile(profile)` → confirmation visuelle "✓ Enregistré".

---

## 11. LawyerIdentityPage — Identité des parties

**Fichier :** `frontend/src/pages/LawyerIdentityPage.tsx` (~329 lignes)
**Route :** `/identite-parties`

### Rôle

Saisie des informations d'identité des deux parties (débiteur et créancier) pour inclusion dans le document Word.

### Champs par partie

- Date de naissance
- Adresse complète

### Paramètres du dossier

- Date d'évaluation (défaut : aujourd'hui)
- Taux de rendement annuel (défaut : 3%)

### Stockage

Utilise `lawyerCaseStore.ts` (séparé de `divorceFormStore.ts`).

---

## 12. LawyerExportPage — Export avocat

**Fichier :** `frontend/src/pages/LawyerExportPage.tsx` (~424 lignes)
**Route :** `/export-avocat`

### Rôle

Page d'export dédiée aux avocats avec 3 options :

1. **Export Word** (.docx)
   - Génère le document via `wordGenerator`
   - Envoie via `webhookService.deliverDocument(blob, email)`
   - L'avocat reçoit le document sur son email

2. **Export PDF**
   - Même PDF que le mode client via `pdfGenerator`

3. **Fermer le dossier**
   - Modale de confirmation
   - Animation "implosion"
   - Efface toutes les données : `divorceFormData`, `lawyerCaseData`, `financialData`

### Vérification profil

Si le profil avocat est incomplet (`!isProfileComplete()`), un message d'avertissement s'affiche avec un lien vers `/profil-avocat`.

---

## 13. GuidePage — Guide de préparation

**Fichier :** `frontend/src/pages/GuidePage.tsx` (~199 lignes)
**Route :** `/guide`

### Contenu

- Checklist des documents à préparer avant la simulation
- Informations sur la confidentialité des données
- HowTo JSON-LD pour Google rich results

---

## 14. GlossaryPage — Lexique juridique

**Fichier :** `frontend/src/pages/GlossaryPage.tsx` (~299 lignes)
**Route :** `/glossary`

### Contenu

Définitions des termes juridiques organisées par catégorie :

- **Revenus** : salaire net, revenu brut, pension alimentaire...
- **Prestation compensatoire** : PC, capital, rente, réversion...
- **Acteurs** : débiteur, créancier, magistrat, notaire...
- **Méthodes de calcul** : Tiers Pondéré, INSEE, Axel-Depondt...

### SEO

FAQ JSON-LD pour rich results Google.

---

## 15. MethodologyPage — Sources et méthodologie

**Fichier :** `frontend/src/pages/MethodologyPage.tsx` (~702 lignes)
**Route :** `/methodology`

### La plus grosse page de l'application.

### Contenu

- **Cadre légal** : Articles du Code Civil, jurisprudence
- **Référentiels de calcul** : Détail de chaque méthode
- **Conformité RGPD** : Traitement des données
- **Bouton PDF** : Génère et télécharge le PDF méthodologie
- **Modale email** : Sélection de méthodes + envoi par email via webhook

### Fonctionnalité d'emailing

1. L'utilisateur sélectionne les catégories souhaitées
2. Entre son email
3. Le PDF méthodologie est généré côté client
4. Envoyé au backend via `/api/deliver`
5. L'utilisateur reçoit le PDF par email

---

## 16. PrivacyPage — Politique de confidentialité

**Fichier :** `frontend/src/pages/PrivacyPage.tsx` (~354 lignes)
**Route :** `/privacy`

### Contenu

- Préambule sur la protection des données
- Nature des données collectées (locales uniquement)
- Destinataires et transferts (Google AdSense, webhooks)
- Sécurité des données
- Droits de l'utilisateur (RGPD)

---

## 17. TermsPage — Conditions Générales d'Utilisation

**Fichier :** `frontend/src/pages/TermsPage.tsx` (~301 lignes)
**Route :** `/terms`

### Contenu

- Nature du service (outil informatif)
- Avertissement juridique
- Architecture sans serveur
- Responsabilité de l'utilisateur
- Limitation de responsabilité
- Propriété intellectuelle
- Publicité et monétisation
- Protection des données

---

## Comment ajouter une nouvelle page

Voir le guide détaillé : [../../guides/ajout-nouvelle-page.md](../../guides/ajout-nouvelle-page.md)
