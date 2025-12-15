# Multi-stage build for werewolf-ai-gm

# Stage 1: Build Frontend
FROM node:20-slim AS frontend-builder

WORKDIR /app/frontend

# Copy package files first (for better caching)
COPY frontend/package*.json ./

# Use npm install directly (more stable in CI than npm ci)
RUN npm install --legacy-peer-deps && \
    echo "✓ Frontend dependencies installed"

# Verify vite is installed
RUN test -f node_modules/.bin/vite || (echo "ERROR: vite not found!" && ls -la node_modules/.bin/ && exit 1)

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

# Install production dependencies only using npm install
# More stable than npm ci in Cloud Build environments
RUN npm install --omit=dev --legacy-peer-deps && \
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
