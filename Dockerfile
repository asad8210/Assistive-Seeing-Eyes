# Stage 1: Builder
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Runner
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY package*.json ./
RUN npm ci --omit=dev || npm install --omit=dev

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./standalone-server
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./standalone-server/.next/static

# Copy Genkit and other runtime files
COPY --from=builder --chown=nextjs:nodejs /app/src/ai ./src/ai
COPY --from=builder --chown=nextjs:nodejs /app/genkit.config.json ./genkit.config.json
COPY --from=builder --chown=nextjs:nodejs /app/tsconfig.json ./tsconfig.json

USER nextjs

EXPOSE 3000
EXPOSE 3400

CMD ["npm", "run", "start"]
