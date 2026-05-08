# syntax=docker/dockerfile:1.7

# ---------------------------------------------------------------------------
# Stage 1: Builder — install production dependencies with full Node image
# ---------------------------------------------------------------------------
FROM node:20-slim AS builder

WORKDIR /app

COPY package.json ./

RUN npm install --omit=dev --no-audit --no-fund

# ---------------------------------------------------------------------------
# Stage 2: Runtime — distroless Node.js (no shell, no package manager)
# Image size ~180MB vs node:20 (~1.1GB)
# ---------------------------------------------------------------------------
FROM gcr.io/distroless/nodejs20-debian12:nonroot

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY package.json server.js ./
COPY public ./public

EXPOSE 3000

CMD ["server.js"]
