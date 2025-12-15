# Multi-stage build for werewolf-ai-gm

# Stage 1: Build Frontend
FROM node:20-slim AS frontend-builder

WORKDIR /app/frontend

# Copy package files first (for better caching)
COPY frontend/package*.json ./

# Install ALL dependencies (including devDependencies) for build
RUN npm ci

# Verify vite is installed
RUN test -f node_modules/.bin/vite || (echo "ERROR: vite not found!" && exit 1)

# Copy frontend source (node_modules already excluded by .dockerignore)
COPY frontend/ ./

# Build frontend for production
RUN npm run build

# Stage 2: Setup Backend
FROM node:20-slim AS backend-builder

WORKDIR /app/backend

# Copy backend package files
COPY backend/package*.json ./

# Install backend dependencies (production only)
RUN npm ci --only=production

# Stage 3: Production Image
FROM node:20-slim

WORKDIR /app

# Copy backend files
COPY backend/ ./

# Copy backend node_modules from builder
COPY --from=backend-builder /app/backend/node_modules ./node_modules

# Copy frontend build from builder
COPY --from=frontend-builder /app/frontend/dist ./public

# Expose port (Cloud Run will inject PORT env variable)
ENV PORT=8080
EXPOSE 8080

# Start the server
CMD ["node", "server.js"]
