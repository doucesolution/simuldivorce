# ── Stage: Build & Run the Go backend server ──────────────────────────────────
# This Dockerfile produces a single lightweight container image that compiles
# the Go backend from source and runs the resulting binary.  Alpine Linux is
# chosen as the base to keep the final image size as small as possible.

# Use the official Go 1.23 image built on Alpine Linux as the base image.
# Alpine is a minimal Linux distribution (~5 MB), which drastically reduces
# the final Docker image size compared to Debian-based Go images.
FROM golang:1.23-alpine

# Set /app as the working directory inside the container.
# All subsequent COPY, RUN, and CMD instructions will execute relative to /app.
WORKDIR /app

# Copy only the Go module definition files (go.mod and go.sum) first.
# This is done BEFORE copying the rest of the source code so that Docker can
# cache the dependency-download layer.  As long as go.mod / go.sum don't
# change, Docker will reuse the cached layer and skip the expensive download.
COPY go.mod go.sum ./

# Download all Go module dependencies declared in go.mod / go.sum.
# Because this layer is cached separately from the source code, rebuilds
# after code-only changes are significantly faster.
RUN go mod download

# Copy the entire backend source tree into the container's /app directory.
# This includes main.go and any other Go source files or assets needed to
# compile the application.
COPY . .

# Compile the Go application.  The -o flag names the output binary "main".
# The "." argument tells the Go toolchain to build the package in the current
# directory (/app).  The resulting binary is statically linked by default on
# Alpine, making it fully self-contained.
RUN go build -o main .

# Declare that the container listens on TCP port 8080 at runtime.
# This is informational metadata for anyone reading the Dockerfile or using
# Docker networking; the application itself binds to this port in main.go.
EXPOSE 8080

# Set the default command that runs when the container starts.
# It simply executes the compiled Go binary located at /app/main.
# Using the exec form (JSON array) ensures the binary runs as PID 1 and
# receives OS signals (e.g. SIGTERM) directly, enabling graceful shutdown.
CMD ["./main"]
