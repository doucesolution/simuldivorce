# 🐳 Frontend — Dockerfile

## Description

Le Dockerfile du frontend compile les assets React avec Node.js, puis les sert avec Nginx.

**Chemin :** `frontend/Dockerfile`

---

## Processus de build

```
Étape 1 (Node.js)         Étape 2 (Nginx)
┌──────────────────┐      ┌──────────────────┐
│ npm install      │      │ Copie dist/      │
│ npm run build    │ ───▶ │ Config Nginx     │
│ → dist/          │      │ Sert les assets  │
└──────────────────┘      └──────────────────┘
```

### Multi-stage build :

1. **Build stage** : Installe les dépendances npm et compile l'application React en fichiers statiques (HTML/CSS/JS) dans le dossier `dist/`
2. **Production stage** : Copie les fichiers statiques dans une image Nginx ultra-légère qui les sert via HTTP

### Avantages :

- L'image finale ne contient que Nginx + les fichiers statiques (~20 Mo)
- Pas de Node.js ni de `node_modules` en production
- Nginx est un serveur web très performant pour les fichiers statiques

---

## Docker Compose

Le fichier `docker-compose.yml` à la racine permet de lancer frontend + backend ensemble :

```yaml
services:
  backend:
    build: ./backend
    ports:
      - "8080:8080"

  frontend:
    image: node:18-alpine
    working_dir: /app
    volumes:
      - ./frontend:/app
    ports:
      - "5173:5173"
    command: sh -c "npm install && npm run dev -- --host"
    depends_on:
      - backend
```

**Note :** En développement, on utilise le serveur Vite (`npm run dev`) directement, pas Nginx. Le Dockerfile est utilisé pour le déploiement en production.

---

## Commands

```bash
# Développement local (sans Docker)
cd frontend
npm install
npm run dev

# Avec Docker Compose (depuis la racine)
docker-compose up

# Build de l'image de production
cd frontend
docker build -t simuldivorce-frontend .
```
