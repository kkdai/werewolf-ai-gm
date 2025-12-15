# Multi-stage build for werewolf-ai-gm

# Stage 1: Build Frontend
FROM node:20-slim AS frontend-builder

WORKDIR /app/frontend

# Copy package files first (for better caching)
COPY frontend/package*.json ./

# Upgrade npm first and clean cache to avoid npm ci issues
RUN npm install -g npm@latest && \
    npm cache clean --force

# Install ALL dependencies (including devDependencies) for build
# Use --legacy-peer-deps and --no-audit for more stability in CI
RUN npm ci --legacy-peer-deps --no-audit || \
    (echo "First npm ci attempt failed, cleaning and retrying..." && \
     rm -rf node_modules package-lock.json && \
     npm install --legacy-peer-deps) && \
    echo "Dependencies installed successfully"

# Verify vite is installed
RUN test -f node_modules/.bin/vite || (echo "ERROR: vite not found!" && ls -la node_modules/.bin/ && exit 1)

# Copy frontend source (node_modules already excluded by .dockerignore)
COPY frontend/ ./

# Build frontend for production
RUN npm run build

# Stage 2: Setup Backend
FROM node:20-slim AS backend-builder

WORKDIR /app/backend

# Copy backend package files
COPY backend/package*.json ./

# Upgrade npm and clean cache
RUN npm install -g npm@latest && \
    npm cache clean --force

# Install backend dependencies (production only)
RUN npm ci --only=production --legacy-peer-deps --no-audit || \
    (echo "Backend npm ci failed, retrying with npm install..." && \
     npm install --only=production --legacy-peer-deps) && \
    echo "Backend dependencies installed successfully"

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
