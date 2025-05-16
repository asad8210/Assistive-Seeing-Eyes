# Stage 1: Builder - Install dependencies and build the application
FROM node:20-slim AS builder
WORKDIR /app

# Install system dependencies required for TensorFlow.js and other packages
RUN apt-get update && \
    apt-get install -y python3 make g++ && \
    rm -rf /var/lib/apt/lists/*

# Copy package files first for better caching
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm install --legacy-peer-deps

# Copy the rest of the application code
COPY . .

# Build the Next.js application
RUN npm run build

# Stage 2: Runner - Production optimized image
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV GENKIT_PORT=3400

# Install system dependencies required for runtime
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    # Required for TensorFlow.js
    libgomp1 \
    # Required for image processing
    libgl1 \
    # Required for health check
    curl && \
    rm -rf /var/lib/apt/lists/*

# Copy production node_modules from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Create directory structure
RUN mkdir -p \
    ./standalone-server/.next/static \
    ./src/ai

# Copy built application files
COPY --from=builder /app/.next/standalone ./standalone-server
COPY --from=builder /app/.next/static ./standalone-server/.next/static

# Copy required files for GenKit
COPY --from=builder /app/src/ai ./src/ai
COPY --from=builder /app/tsconfig.json ./
COPY --from=builder /app/genkit.config.js ./

# Verify critical files exist
RUN ls -la \
    node_modules/genkit-cli/bin/genkit.js \
    standalone-server/server.js \
    src/ai/dev.ts

# Health check (matches Render healthCheckPath)
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Expose ports
EXPOSE 3000 3400

# Run the application
CMD ["npm", "run", "start"]
