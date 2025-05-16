# Stage 1: Builder
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install all dependencies (including devDependencies)
COPY package*.json ./
RUN npm install

# Copy the full application code
COPY . .

# Build the Next.js application (standalone output will be created)
RUN npm run build

# Stage 2: Runner - Production Image
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV production

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Copy package files and install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts

# Copy Next.js standalone server and static assets
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./standalone-server
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./standalone-server/.next/static

# Copy Genkit source files
COPY --chown=nextjs:nodejs src/ai ./src/ai
# Optional: Only include if the file exists
# COPY --chown=nextjs:nodejs genkit.config.json ./genkit.config.json
COPY --chown=nextjs:nodejs tsconfig.json ./tsconfig.json

# Use non-root user
USER nextjs

EXPOSE 3000
EXPOSE 3400

# Start the Next.js + Genkit application
CMD ["npm", "run", "start"]
