# Multi-stage build for werewolf-ai-gm

# Stage 1: Build Frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./

# Install frontend dependencies
RUN npm ci

# Copy frontend source
COPY frontend/ ./

# Build frontend for production
RUN npm run build

# Stage 2: Setup Backend
FROM node:18-alpine AS backend-builder

WORKDIR /app/backend

# Copy backend package files
COPY backend/package*.json ./

# Install backend dependencies (production only)
RUN npm ci --only=production

# Stage 3: Production Image
FROM node:18-alpine

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
