# Stage 1: Builder
FROM node:20-slim AS builder
WORKDIR /app

# Install dependencies (including devDependencies for build)
COPY package*.json ./
RUN npm install

# Copy all files except those in .dockerignore
COPY . .

# Build the application
RUN npm run build

# Stage 2: Runner
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV GENKIT_PORT=3400

# Copy production necessary files
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

# Verify genkit-cli exists
RUN ls -la node_modules/genkit-cli/bin

# Create directory structure
RUN mkdir -p ./standalone-server/.next/static

# Copy built application
COPY --from=builder /app/.next/standalone ./standalone-server
COPY --from=builder /app/.next/static ./standalone-server/.next/static
COPY --from=builder /app/public ./standalone-server/public

# Copy Genkit specific files
COPY --from=builder /app/src/ai ./src/ai
COPY --from=builder /app/tsconfig.json ./
COPY --from=builder /app/genkit.config.js ./

EXPOSE 3000
EXPOSE 3400

HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["npm", "run", "start"]
