# Stage 1: Builder
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the Next.js application
RUN npm run build

# Stage 2: Runner
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV production

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts

# Copy built app from builder stage
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./standalone-server
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./standalone-server/.next/static

# Copy essential runtime files
COPY --chown=nextjs:nodejs src/ai ./src/ai
COPY --chown=nextjs:nodejs genkit.config.json ./genkit.config.json
COPY --chown=nextjs:nodejs tsconfig.json ./tsconfig.json

USER nextjs

EXPOSE 3000
EXPOSE 3400

CMD ["npm", "run", "start"]
