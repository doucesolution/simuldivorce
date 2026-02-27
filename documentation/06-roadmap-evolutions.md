# Roadmap & Pistes d'Évolution — SimulDivorce

> **Document vivant** — À mettre à jour au fil de l'avancement du projet.  
> Dernière mise à jour : Février 2026

---

## Table des matières

1. [Hébergement du backend](#1-hébergement-du-backend)
2. [Intégration Stripe (paiement)](#2-intégration-stripe-paiement)
3. [Base de données clients (Notion / AirTable)](#3-base-de-données-clients-notion--airtable)
4. [Système d'abonnement & gestion premium/free](#4-système-dabonnement--gestion-premiumfree)
5. [Génération de documents (Word vs PDF dégradé)](#5-génération-de-documents-word-vs-pdf-dégradé)
6. [Délégation du template Word à Alexandra via Make](#6-délégation-du-template-word-à-alexandra-via-make)
7. [Gestion de la publicité](#7-gestion-de-la-publicité)
8. [Identification client & persistance avocat](#8-identification-client--persistance-avocat)
9. [Période d'essai gratuite (7 jours)](#9-période-dessai-gratuite-7-jours)
10. [Communication & mails de relance](#10-communication--mails-de-relance)
11. [Piste WordPress](#11-piste-wordpress)
12. [Autres pistes identifiées](#12-autres-pistes-identifiées)
13. [Checklist récapitulative](#13-checklist-récapitulative)

---

## 1. Hébergement du backend

### Situation actuelle

Le backend Go/Gin tourne uniquement en local ou via Docker. Le frontend est déployé sur GitHub Pages (statique uniquement). **Sans hébergement du backend, les webhooks et l'upload Drive ne fonctionnent pas en production.**

### Ce qu'il faut faire

| Étape | Action                                   | Détails                                                                                   |
| ----- | ---------------------------------------- | ----------------------------------------------------------------------------------------- |
| 1.1   | Choisir un hébergeur                     | **Railway**, **Render**, **Fly.io**, ou un **VPS** (OVH, Scaleway…)                       |
| 1.2   | Déployer le backend                      | Utiliser le `Dockerfile` existant dans `backend/`                                         |
| 1.3   | Configurer les variables d'environnement | Transférer le contenu de `backend/.env` dans l'interface de l'hébergeur (jamais dans Git) |
| 1.4   | Mettre à jour `VITE_API_URL`             | Dans `frontend/.env`, mettre l'URL du backend déployé (ex: `https://api.simuldivorce.fr`) |
| 1.5   | Reconstruire le frontend                 | `npm run build` avec le nouveau `VITE_API_URL`, puis déployer sur GitHub Pages            |
| 1.6   | Mettre à jour `ALLOWED_ORIGINS`          | Ajouter le domaine de production dans le backend                                          |

### Comment le faire (Railway — exemple)

```bash
# 1. Installer le CLI Railway
npm install -g @railway/cli

# 2. Se connecter
railway login

# 3. Créer le projet depuis le dossier backend
cd backend
railway init

# 4. Déployer
railway up

# 5. Configurer les variables d'environnement dans le dashboard Railway
# → Settings → Variables → Ajouter chaque clé de .env
```

### Alternatives

- **Render** : Free tier disponible, déploiement via GitHub, auto-deploy à chaque push
- **Fly.io** : Bon pour les apps Go, régions européennes disponibles
- **VPS OVH/Scaleway** : Plus de contrôle, mais maintenance manuelle (Docker Compose)

---

## 2. Intégration Stripe (paiement)

### Modèle envisagé

- **Abonnement mensuel** : accès premium continu

### Ce qu'il faut faire

| Étape | Action                         | Détails                                                                                                 |
| ----- | ------------------------------ | ------------------------------------------------------------------------------------------------------- |
| 2.1   | Créer un compte Stripe         | [dashboard.stripe.com](https://dashboard.stripe.com)                                                    |
| 2.2   | Configurer les produits        | Créer un produit "Abonnement SimulDivorce" avec un prix mensuel                                         |
| 2.3   | Configurer les webhooks Stripe | Stripe → webhooks → envoyer les événements vers Make.com                                                |
| 2.4   | Gérer les événements clés      | `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.deleted` |
| 2.5   | Page de paiement               | Utiliser Stripe Checkout (redirection) ou Stripe Elements (intégré)                                     |

### Flux de paiement prévu

```
Utilisateur clique "S'abonner"
        ↓
Redirection vers Stripe Checkout
        ↓
Paiement réussi
        ↓
Stripe envoie webhook → Make.com
        ↓
Make.com met à jour la BDD (Notion/AirTable)
        ↓
Client tagué "premium"
```

### Comment intégrer Stripe Checkout (côté frontend)

```typescript
// Exemple simplifié — à adapter
const handleSubscribe = async () => {
  const response = await fetch(`${API_BASE}/create-checkout-session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      clientId: currentClientId,
      priceId: "price_xxxxx", // ID du prix Stripe
    }),
  });
  const { url } = await response.json();
  window.location.href = url; // Redirection Stripe
};
```

### Côté backend Go (nouvel endpoint à créer)

```go
// POST /create-checkout-session
func createCheckoutSession(c *gin.Context) {
    // 1. Recevoir clientId et priceId
    // 2. Appeler l'API Stripe pour créer une session
    // 3. Retourner l'URL de la session
}
```

---

## 3. Base de données clients (Notion / AirTable)

### Objectif

Stocker tous les clients inscrits avec leur statut d'abonnement. Chaque client a un **identifiant unique**.

### Options

| Solution     | Avantages                                                | Inconvénients                                      |
| ------------ | -------------------------------------------------------- | -------------------------------------------------- |
| **AirTable** | API robuste, vues flexibles, formules, automations       | Limites gratuites (1000 lignes/base)               |
| **Notion**   | Déjà utilisé ?, bases de données natives                 | API moins performante pour les requêtes fréquentes |
| **Supabase** | PostgreSQL gratuit, API REST auto-générée, auth intégrée | Plus technique à mettre en place                   |

### Structure de la table clients

| Champ                    | Type           | Description                                  |
| ------------------------ | -------------- | -------------------------------------------- |
| `clientId`               | Texte (unique) | Identifiant unique du client                 |
| `email`                  | Email          | Adresse email du client                      |
| `nom`                    | Texte          | Nom complet                                  |
| `stripeCustomerId`       | Texte          | ID client côté Stripe                        |
| `statut`                 | Select         | `premium` / `free` / `trial` / `expired`     |
| `dateInscription`        | Date           | Date de première inscription                 |
| `dateDernierPaiement`    | Date           | Date du dernier paiement réussi              |
| `prochainRenouvellement` | Date           | Date du prochain renouvellement automatique  |
| `actif`                  | Checkbox       | Le renouvellement automatique est-il actif ? |

### Flux de mise à jour via Make.com

```
Stripe webhook (invoice.paid)
        ↓
Make.com reçoit l'événement
        ↓
Recherche dans AirTable par stripeCustomerId
        ↓
Met à jour : statut = "premium", dateDernierPaiement = aujourd'hui
        ↓
Si invoice.payment_failed → statut = "expired"
```

---

## 4. Système d'abonnement & gestion premium/free

### Logique métier

```
Client s'identifie sur l'appli
        ↓
L'appli interroge la BDD (via Make ou API directe)
        ↓
Retourne le statut du client (premium / free / trial)
        ↓
L'appli adapte l'expérience en conséquence
```

### Différences premium vs free

| Fonctionnalité                      | Free                                      | Premium          |
| ----------------------------------- | ----------------------------------------- | ---------------- |
| Simulation de base                  | ✅                                        | ✅               |
| Export PDF                          | PDF dégradé (filigrane, sans coordonnées) | ✅ PDF complet   |
| Export Word                         | ❌                                        | ✅ Word éditable |
| Coordonnées dans le document        | ❌                                        | ✅               |
| Publicité                           | ✅ Avec pub                               | ❌ Sans pub      |
| Filigrane "Fait par Douce Solution" | ✅ Toujours                               | ❌ Retiré        |

### Ce qu'il faut faire

| Étape | Action                                                             |
| ----- | ------------------------------------------------------------------ |
| 4.1   | Créer un système d'identification client (ID unique)               |
| 4.2   | Endpoint API pour vérifier le statut d'un client                   |
| 4.3   | Modifier `pdfGenerator.ts` pour supporter le mode dégradé          |
| 4.4   | Modifier `wordGenerator.ts` pour être conditionnel (premium only)  |
| 4.5   | Modifier `ExportPage.tsx` pour adapter les boutons selon le statut |
| 4.6   | Modifier `LawyerExportPage.tsx` de la même manière                 |

---

## 5. Génération de documents (Word vs PDF dégradé)

### PDF dégradé (utilisateurs free)

- **Filigrane** : "Document généré par Douce Solution — simuldivorce.fr" en diagonal
- **Pas de coordonnées** des avocats/parties
- **Non éditable** : le PDF est volontairement non exploitable facilement
- Objectif : inciter à passer premium pour obtenir le Word éditable

### Comment ajouter un filigrane au PDF

Dans `pdfGenerator.ts`, après la génération du contenu :

```typescript
// Ajouter un filigrane si l'utilisateur n'est pas premium
if (!isPremium) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(50);
    doc.setTextColor(200, 200, 200); // Gris clair
    doc.text(
      "Douce Solution — simuldivorce.fr",
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height / 2,
      { align: "center", angle: 45 },
    );
  }
}
```

### Word (utilisateurs premium uniquement)

- Document Word complet, éditable
- Coordonnées incluses
- Pas de filigrane
- Le bouton "Exporter en Word" n'apparaît que pour les abonnés

---

## 6. Délégation du template Word à Alexandra via Make

### Architecture cible

```
Utilisateur clique "Exporter" sur l'appli
        ↓
Webhook envoyé à Make.com avec TOUS les champs du formulaire
        ↓
Make.com interroge la BDD → vérifie si client abonné
        ↓
Si abonné (premium) :
  → Alexandra a un template Word hébergé
  → Make remplit le template avec les données
  → Envoi du Word complet au client par email
        ↓
Si non abonné (free) :
  → Envoi du PDF dégradé uniquement
  → Pas de coordonnées
  → Filigrane
```

### Ce que ça change côté code

| Composant           | Modification                                                                                      |
| ------------------- | ------------------------------------------------------------------------------------------------- |
| `webhookService.ts` | Envoyer TOUS les champs du formulaire dans le webhook (pas seulement le blob)                     |
| `wordGenerator.ts`  | Potentiellement supprimé côté frontend — la génération Word est déléguée à Make/Alexandra         |
| Backend Go          | Le webhook transmet toutes les données nécessaires                                                |
| Make.com            | Nouveau scénario : réception webhook → vérification statut → génération Word ou PDF → envoi email |

### Données à envoyer dans le webhook

```json
{
  "clientId": "xxx",
  "email": "avocat@example.com",
  "formData": {
    "marriageDate": "2010-05-15",
    "divorceDate": "2026-01-10",
    "debtorGrossIncome": 4500,
    "creditorGrossIncome": 2200,
    "...tous les autres champs..."
  },
  "results": {
    "compensatoryAllowance": 35000,
    "monthlyRent": 450,
    "...tous les résultats calculés..."
  }
}
```

---

## 7. Gestion de la publicité

### Stratégie

| Statut client        | Publicité                                      |
| -------------------- | ---------------------------------------------- |
| **Free**             | ✅ Publicité affichée (AdSense)                |
| **Premium / Abonné** | ❌ Aucune publicité                            |
| **Trial (7 jours)**  | ❌ Aucune publicité pendant la période d'essai |

### Comment faire

- Modifier le composant `AdUnit.tsx` pour vérifier le statut du client
- Si `premium` ou `trial` → ne pas rendre le composant pub
- Alternative : rediriger les abonnés vers un **clone sans pub** (sous-domaine `pro.simuldivorce.fr` ?)

### Option clone sans pub

```
simuldivorce.fr        → version gratuite avec pub
pro.simuldivorce.fr    → version premium sans pub
```

- Même code, mais `VITE_ADSENSE_CLIENT` non défini sur la version pro
- Ou bien un simple flag dans le code qui désactive les pubs

### Implémentation côté code

```tsx
// Dans AdUnit.tsx
const AdUnit = ({ isPremium }: { isPremium: boolean }) => {
  if (isPremium) return null; // Pas de pub pour les abonnés
  // ... le reste du composant pub
};
```

---

## 8. Identification client & persistance avocat

### Objectif

- **Enregistrer les informations des avocats en permanence** (pas perdues à la fermeture)
- Chaque avocat a un **identifiant client unique**
- Bouton avec lien direct vers la partie avocat pour les utilisateurs

### Ce qu'il faut faire

| Étape | Action                                                                                    |
| ----- | ----------------------------------------------------------------------------------------- |
| 8.1   | Créer un système d'inscription / connexion (email + mot de passe, ou magic link)          |
| 8.2   | Générer un `clientId` unique à l'inscription                                              |
| 8.3   | Sauvegarder le profil avocat côté serveur (pas seulement localStorage)                    |
| 8.4   | Synchroniser `lawyerProfileStore` et `lawyerCaseStore` avec le backend                    |
| 8.5   | Créer un lien direct `/avocat` ou `/lawyer` pour accéder directement à l'interface avocat |

### URL directe pour les avocats

Ajouter une route dans `App.tsx` :

```tsx
// Lien direct : simuldivorce.fr/avocat
<Route path="/avocat" element={<LawyerIdentityPage />} />
```

Ce lien peut être partagé (email, site, carte de visite) pour que les avocats accèdent directement à leur espace.

### Persistance des données

Actuellement les données avocat sont dans `localStorage`. Pour une vraie persistance :

- Sauvegarder le profil avocat dans la BDD (AirTable/Notion/Supabase)
- Au login → récupérer le profil depuis la BDD
- À chaque modification → synchroniser avec la BDD

---

## 9. Période d'essai gratuite (7 jours)

### Fonctionnement

```
Nouvel avocat s'inscrit
        ↓
7 jours d'essai gratuit (statut = "trial")
        ↓
Pendant l'essai : toutes les fonctionnalités premium
MAIS : reçoit uniquement du PDF dégradé (pas de Word)
        ↓
Au bout de 7 jours :
  → S'abonne → statut = "premium" → Word complet, sans pub
  → Ne s'abonne pas → statut = "free" → PDF dégradé, avec pub
        ↓
Peut se désabonner pendant les 7 jours sans frais
```

### Configuration Stripe

Stripe supporte nativement les périodes d'essai :

```
Produit → Prix → Trial period = 7 days
```

Aucun prélèvement pendant les 7 jours. Si le client annule avant la fin → aucun frais.

---

## 10. Communication & mails de relance

### Dans les mails envoyés aux non-abonnés

Quand un utilisateur free exporte un document, l'email contient :

- Le PDF dégradé (avec filigrane)
- Un **rappel** : "Pour obtenir un document Word complet et éditable, sans filigrane et avec toutes les coordonnées, passez à l'abonnement premium."
- Un **lien direct** vers la page d'abonnement

### Template email via Make.com

```
Objet : Votre simulation de prestation compensatoire — SimulDivorce

Bonjour,

Veuillez trouver ci-joint votre simulation.

⚠️ Ce document est une version simplifiée.
Pour obtenir le document Word complet et éditable :
→ [Passer à l'abonnement premium](https://simuldivorce.fr/abonnement)

Cordialement,
L'équipe Douce Solution
```

---

## 11. Piste WordPress

### Pourquoi WordPress ?

- Ajout facile de champs et de contenus sans toucher au code
- Gestion native des utilisateurs et des paiements (WooCommerce + Stripe)
- Plugins disponibles pour formulaires, BDD, emails
- Alexandra peut gérer le contenu de manière autonome

### Architecture possible

```
WordPress (simuldivorce.fr)
  ├── Page d'accueil / marketing
  ├── Blog / SEO
  ├── Paiement Stripe (WooCommerce)
  ├── Gestion des comptes utilisateurs
  └── iFrame ou lien vers l'app React
        ↓
App React (app.simuldivorce.fr)
  ├── Simulateur de prestation compensatoire
  ├── Interface avocat
  └── Export PDF/Word
```

### Plugins WordPress utiles

| Plugin                        | Usage                                |
| ----------------------------- | ------------------------------------ |
| **WooCommerce**               | Gestion des paiements et abonnements |
| **WooCommerce Subscriptions** | Abonnements récurrents               |
| **Stripe for WooCommerce**    | Intégration Stripe native            |
| **WPForms**                   | Formulaires supplémentaires          |
| **Elementor**                 | Page builder pour le design          |

### Ce qu'il faut décider

- WordPress gère-t-il **tout** (y compris le simulateur) ou juste la partie marketing/paiement ?
- Le simulateur React reste-t-il une app séparée liée à WordPress ?
- Sous-domaine : `app.simuldivorce.fr` (React) vs `simuldivorce.fr` (WordPress) ?

---

## 12. Autres pistes identifiées

### Fonctionnalités supplémentaires à envisager

| Piste                          | Description                                                                  | Priorité        |
| ------------------------------ | ---------------------------------------------------------------------------- | --------------- |
| **Multi-cas pour avocats**     | Gérer plusieurs dossiers simultanément (déjà ébauché dans `lawyerCaseStore`) | 🟡 Moyenne      |
| **Historique des simulations** | Sauvegarder et retrouver les anciennes simulations                           | 🟡 Moyenne      |
| **Mode hors-ligne avancé**     | Permettre l'export même sans connexion (déjà partiellement supporté)         | 🟢 Faible       |
| **Statistiques d'usage**       | Dashboard admin avec nombre de simulations, conversions, etc.                | 🟡 Moyenne      |
| **API publique**               | Permettre à d'autres outils d'utiliser le moteur de calcul                   | 🔴 Haute valeur |
| **Comparaison de simulations** | Comparer plusieurs scénarios côte à côte                                     | 🟡 Moyenne      |
| **Mise à jour du barème**      | Quand les tables de capitalisation changent, mettre à jour `legalEngine.ts`  | 🔴 Important    |
| **Conformité RGPD renforcée**  | Politique de suppression des données, portabilité                            | 🔴 Obligatoire  |
| **App iOS**                    | Capacitor supporte déjà iOS, il suffit de configurer et builder              | 🟡 Moyenne      |
| **Notifications push**         | Rappel de renouvellement, nouvelles fonctionnalités                          | 🟢 Faible       |
| **Signature électronique**     | Intégrer une signature dans les documents exportés                           | 🟢 Faible       |
| **Multilingue**                | Version en anglais / autres langues (marchés belge, suisse, canadien)        | 🟡 Moyenne      |
| **Mode sombre amélioré**       | Déjà présent mais à peaufiner pour les exports PDF                           | 🟢 Faible       |

---

## 13. Checklist récapitulative

### Phase 1 — Infrastructure (pré-requis)

- [ ] Héberger le backend (Railway / Render / VPS)
- [ ] Configurer `VITE_API_URL` avec l'URL du backend
- [ ] Configurer `WEBHOOK_URL` dans le backend
- [ ] Tester les webhooks de bout en bout

### Phase 2 — Paiement & comptes

- [ ] Créer un compte Stripe
- [ ] Configurer les produits et prix (one-shot + abonnement)
- [ ] Créer la base de données clients (AirTable ou Notion)
- [ ] Configurer les webhooks Stripe → Make.com → BDD
- [ ] Créer le système d'identification client (ID unique)
- [ ] Endpoint API pour vérifier le statut d'un client
- [ ] Période d'essai 7 jours (configuration Stripe)

### Phase 3 — Différenciation premium/free

- [ ] PDF dégradé avec filigrane pour les free
- [ ] Masquer les coordonnées dans le PDF free
- [ ] Export Word réservé aux premium
- [ ] Supprimer les pubs pour les premium
- [ ] Mails de relance avec lien abonnement pour les free

### Phase 4 — Délégation Make / Alexandra

- [ ] Webhook avec TOUS les champs du formulaire
- [ ] Alexandra héberge le template Word
- [ ] Make.com interroge la BDD pour vérifier le statut
- [ ] Make.com gère la génération Word vs PDF
- [ ] Make.com gère l'envoi email avec le bon document

### Phase 5 — WordPress (optionnel)

- [ ] Installer WordPress sur le domaine principal
- [ ] Configurer WooCommerce + Stripe
- [ ] Lier l'app React (sous-domaine ou iframe)
- [ ] Migrer la gestion des comptes vers WordPress

### Phase 6 — Améliorations continues

- [ ] Lien direct `/avocat` pour les utilisateurs avocats
- [ ] Persistance des données avocats côté serveur
- [ ] Statistiques d'usage
- [ ] Conformité RGPD renforcée
- [ ] App iOS

---

> **Ce document est un point de départ.** Il sera enrichi au fur et à mesure des décisions prises et des évolutions du projet.
