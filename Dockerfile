# Stage 1: Builder
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies (including devDependencies)
COPY package*.json ./
RUN npm install

# Copy all source code
COPY . .

# Build the Next.js application
RUN npm run build

# Stage 2: Runner
FROM node:20-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Copy only required files for production
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts

# Copy standalone Next.js server build
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./standalone-server
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./standalone-server/.next/static

# Copy Genkit-specific files
COPY --from=builder --chown=nextjs:nodejs /app/src/ai ./src/ai
COPY --from=builder --chown=nextjs:nodejs /app/tsconfig.json ./tsconfig.json

# Conditionally copy genkit.config.json if it exists
# Docker has no conditional COPY; workaround is to ignore if absent via build args or copying a default file

# Set to non-root user
USER nextjs

# Expose ports
EXPOSE 3000
EXPOSE 3400

# Start script using concurrently (Next.js + Genkit)
CMD ["npm", "run", "start"]
