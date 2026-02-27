# ==========================================================================================
# Multi-stage Docker build for the SimulDivorce frontend application
# Stage 1 (builder): Install Node.js dependencies and build the production Vite bundle
# Stage 2 (runtime): Serve the static files with a lightweight Nginx container
# ==========================================================================================

# Stage 1: Build stage — use Node.js 18 on Alpine Linux (small ~50MB base image) as the build environment
# The "as builder" alias lets us reference this stage's filesystem in later stages with --from=builder
FROM node:18-alpine as builder

# Set /app as the working directory inside the container — all subsequent commands run relative to this path
WORKDIR /app

# Copy only package.json and package-lock.json first (before the full source code)
# This leverages Docker's layer caching: if dependencies haven't changed, npm install is skipped on rebuilds
COPY package.json package-lock.json ./

# Install all Node.js dependencies (including devDependencies needed for the build: Vite, TypeScript, etc.)
# This layer is cached and only re-runs when package.json or package-lock.json change
RUN npm install

# Copy the entire frontend source code into the container's /app directory
# This includes src/, public/, index.html, vite.config.ts, tailwind.config.js, and all other project files
COPY . .

# Run the Vite production build — outputs optimized, minified HTML/JS/CSS into the dist/ directory
# This also triggers the custom versionJsonPlugin and spaRoutesPlugin defined in vite.config.ts
RUN npm run build

# Stage 2: Runtime stage — use the official Nginx Alpine image (ultra-lightweight ~7MB) to serve static files
# This stage does NOT include Node.js, npm, or source code — only the built assets, keeping the image minimal
FROM nginx:alpine

# Copy the built static files from the builder stage's /app/dist into Nginx's default document root
# --from=builder references Stage 1 — only the dist/ output is transferred, not node_modules or source code
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80 — the default HTTP port that Nginx listens on inside the container
# This is a documentation hint for docker-compose / orchestrators; actual port mapping is done at runtime
EXPOSE 80

# Start Nginx in the foreground ("daemon off;") so Docker can track the process and keep the container alive
# Without "daemon off;", Nginx would fork to the background and the container would immediately exit
CMD ["nginx", "-g", "daemon off;"]
