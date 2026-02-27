# 🐳 Backend — Dockerfile

## Description

Le Dockerfile du backend compile le code Go en un binaire statique et le lance dans une image Alpine Linux minimale.

**Chemin :** `backend/Dockerfile`

---

## Contenu et explication

```dockerfile
# Étape 1 : Compilation du code Go
FROM golang:1.24-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o server .

# Étape 2 : Image de production minimale
FROM alpine:latest
WORKDIR /root/
COPY --from=builder /app/server .
COPY .env .env
EXPOSE 8080
CMD ["./server"]
```

### Explication étape par étape :

1. **`FROM golang:1.24-alpine AS builder`** — Image de base pour la compilation. Alpine est une distribution Linux ultra-légère (~5 Mo).

2. **`COPY go.mod go.sum`** + **`RUN go mod download`** — Copie les fichiers de dépendances et les télécharge. Fait séparément pour profiter du cache Docker (si les deps ne changent pas, cette étape est en cache).

3. **`COPY . .`** + **`RUN go build -o server .`** — Copie le code source et compile le binaire Go appelé `server`.

4. **`FROM alpine:latest`** — Commence une nouvelle image fraîche (multi-stage build). L'image finale ne contient PAS le compilateur Go ni les sources.

5. **`COPY --from=builder /app/server .`** — Copie uniquement le binaire compilé depuis l'étape de build.

6. **`COPY .env .env`** — Copie les variables d'environnement.

7. **`EXPOSE 8080`** — Documente que le serveur écoute sur le port 8080.

8. **`CMD ["./server"]`** — Lance le binaire au démarrage du conteneur.

---

## Commandes utiles

```bash
# Construire l'image Docker
cd backend
docker build -t simuldivorce-backend .

# Lancer le conteneur
docker run -p 8080:8080 simuldivorce-backend

# Avec docker-compose (depuis la racine du projet)
docker-compose up backend
```

---

## Taille de l'image

| Étape                           | Taille approximative |
| ------------------------------- | -------------------- |
| Image de build (golang:alpine)  | ~300 Mo              |
| Image finale (alpine + binaire) | ~15 Mo               |

L'avantage du multi-stage build : l'image de production est ultra-légère car elle ne contient que le binaire Go et Alpine Linux. Pas de compilateur, pas de sources, pas de `node_modules`.
