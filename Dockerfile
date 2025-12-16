# Multi-stage build for werewolf-ai-gm

# Stage 1: Build Frontend
FROM node:20-slim AS frontend-builder

WORKDIR /app/frontend

# Copy package files first (for better caching)
COPY frontend/package*.json ./

# Debug: Show npm and node versions
RUN node --version && npm --version

# Install dependencies with enhanced error handling
# npm ci is more reliable in CI environments than npm install
RUN set -e && \
    npm ci --legacy-peer-deps && \
    test -d node_modules && \
    test -f node_modules/.bin/vite && \
    echo "✓ Frontend dependencies installed (vite: $(node_modules/.bin/vite --version))"

# Copy frontend source (node_modules already excluded by .dockerignore)
COPY frontend/ ./

# Build frontend for production
RUN npm run build && \
    echo "✓ Frontend build complete"

# Stage 2: Setup Backend
FROM node:20-slim AS backend-builder

WORKDIR /app/backend

# Copy backend package files
COPY backend/package*.json ./

# Debug: Show npm and node versions
RUN node --version && npm --version

# Install production dependencies with enhanced error handling
# npm ci is more reliable in CI environments than npm install
RUN set -e && \
    npm ci --omit=dev --legacy-peer-deps && \
    test -d node_modules && \
    echo "✓ Backend dependencies installed"

# Stage 3: Production Image
FROM node:20-slim

WORKDIR /app

# Copy backend files
COPY backend/ ./

# Copy backend node_modules from builder
COPY --from=backend-builder /app/backend/node_modules ./node_modules

# Copy frontend build from builder
COPY --from=frontend-builder /app/frontend/dist ./public

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

# Start the server
CMD ["node", "server.js"]
