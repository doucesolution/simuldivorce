# 🗺️ Parcours utilisateur

## Description

Ce document décrit le **flux de navigation** de l'utilisateur à travers l'application, pour les deux modes (client web et avocat).

---

## Parcours Client (Web)

```
┌─────────────────┐
│  LandingPage    │  /
│  Page d'accueil │
└────────┬────────┘
         │ Clic "Commencer"
         ▼
┌─────────────────┐
│ DisclaimerPage  │  /disclaimer
│ 5 avertissements│
│ à cocher        │
└────────┬────────┘
         │ Tout accepté → "Continuer"
         │ (Auto-sélectionne les 3 méthodes)
         │ (Auto-active le mode guidé)
         ▼
┌─────────────────┐
│ Prestation      │  /prestation-compensatoire
│ Compensatoire   │
│ • Date mariage  │
│ • Date divorce  │
│ • Enfants       │
│ • Type garde    │
└────────┬────────┘
         │ "Suivant"
         ▼
┌─────────────────┐
│ DebiteurPage    │  /informations-debiteur
│ • Date naissance│
│ • Revenu net    │
│ • Revenu brut * │
│ • Patrimoine *  │
│ • Projections * │
└────────┬────────┘
         │ "Suivant"  (* = méthode Axel-Depondt uniquement)
         ▼
┌─────────────────┐
│ CreancierPage   │  /informations-creancier
│ (Même structure │
│  que Débiteur)  │
└────────┬────────┘
         │ "Suivant"
         ▼
┌─────────────────┐
│ Récapitulatif   │  /recapitulatif
│ Vérification des│
│ données saisies │
└────────┬────────┘
         │ "Calculer"
         │ → Sauvegarde financialData dans localStorage
         ▼
┌─────────────────┐
│ InterstitialAd  │  /transition?to=/dashboard
│ Pub + contenu   │
│ éditorial       │
│ (5 sec timer)   │
└────────┬────────┘
         │ Timer expiré ou "Passer"
         ▼
┌─────────────────┐
│ DashboardPage   │  /dashboard
│ RÉSULTATS :     │
│ • Tiers Pondéré │
│ • INSEE         │
│ • Axel-Depondt  │
│ • Moyenne       │
└────────┬────────┘
         │ "Exporter"
         ▼
┌─────────────────┐
│ InterstitialAd  │  /transition?to=/export
│ (2e interstitiel)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ ExportPage      │  /export
│ • Télécharger   │
│   PDF           │
│ • Effacer les   │
│   données       │
└─────────────────┘
```

---

## Parcours Avocat (App Native / Mode Dev)

```
┌─────────────────┐
│  LandingPage    │  /
│  + Boutons Pro  │
│  • Profil avocat│
│  • Nouveau cas  │
└────────┬────────┘
         │
    ┌────┴────────────────┐
    │                     │
    ▼                     ▼
┌──────────────┐   ┌──────────────┐
│ LawyerProfile│   │ Disclaimer   │
│ Page         │   │ Page         │
│ /profil-avocat│  │ (même qu'en  │
│ • Nom, email │   │  mode client)│
│ • Cabinet    │   └──────┬───────┘
│ • Logo       │          │
└──────────────┘          ▼
                   ┌──────────────┐
                   │ Prestation   │
                   │ Compensatoire│
                   └──────┬───────┘
                          │
                          ▼
                   ┌──────────────┐
                   │ DebiteurPage │
                   └──────┬───────┘
                          │
                          ▼
                   ┌──────────────┐
                   │ CreancierPage│
                   └──────┬───────┘
                          │
                          ▼
                   ┌──────────────┐
                   │ Lawyer       │
                   │ IdentityPage │
                   │ /identite-   │
                   │ parties      │
                   │ • Noms       │
                   │ • Adresses   │
                   │ • Taux rend. │
                   └──────┬───────┘
                          │
                          ▼
                   ┌──────────────┐
                   │ Récapitulatif│
                   └──────┬───────┘
                          │
                          ▼
                   ┌──────────────┐
                   │ DashboardPage│
                   │ (sans transition│
                   │  interstitielle)│
                   └──────┬───────┘
                          │
                          ▼
                   ┌──────────────┐
                   │ LawyerExport │
                   │ Page         │
                   │ /export-avocat│
                   │ • PDF        │
                   │ • Word + envoi│
                   │ • Fermer cas │
                   └──────────────┘
```

---

## Différences clés entre les parcours

| Aspect                    | Client Web                  | Avocat Pro             |
| ------------------------- | --------------------------- | ---------------------- |
| Page profil               | ❌ Non                      | ✅ /profil-avocat      |
| Page identité parties     | ❌ Non                      | ✅ /identite-parties   |
| Interstitiel publicitaire | ✅ Avant dashboard + export | ❌ Aucun (premium)     |
| Export PDF                | ✅ Oui                      | ✅ Oui                 |
| Export Word               | ❌ Non                      | ✅ Oui + envoi email   |
| Effacement données        | ✅ Option sur export        | ✅ "Fermer le dossier" |

---

## Navigation conditionnelle

La navigation est gérée par `divorceFormStore.ts` :

- `getNextPage(currentPath)` — Détermine la page suivante selon le mode
- `getPreviousPage(currentPath)` — Page précédente
- `getPageIndex(currentPath)` — Index pour la barre de progression
- `getTotalPages()` — Total pour la barre de progression

En mode avocat, `LawyerIdentityPage` s'insère entre `CreancierPage` et `RecapitulatifPage`.
