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

ENV NODE_ENV production

# Copy only production necessary files
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

# Explicitly verify genkit-cli exists
RUN ls -la node_modules/genkit-cli && \
    ls -la node_modules/genkit-cli/bin

# Copy built application
RUN mkdir -p ./standalone-server
COPY --from=builder /app/.next/standalone ./standalone-server
COPY --from=builder /app/.next/static ./standalone-server/.next/static
COPY --from=builder /app/public ./standalone-server/public

# Copy Genkit specific files
COPY --from=builder /app/src/ai ./src/ai
COPY --from=builder /app/tsconfig.json ./

EXPOSE 3000
EXPOSE 3400

CMD ["npm", "run", "start"]
