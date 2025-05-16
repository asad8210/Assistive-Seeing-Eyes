# Stage 1: Builder
FROM node:20-slim AS builder
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
# This creates a complete node_modules directory
RUN npm install

# Copy the rest of your application code
COPY . .

# Build the Next.js application
# This will also generate the standalone output in .next/standalone
RUN npm run build

# Stage 2: Runner (Production)
FROM node:20-slim AS runner
WORKDIR /app

# Set NODE_ENV to production
ENV NODE_ENV production

# Copy package files and the full node_modules from the builder stage
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

# Prune development dependencies from the copied node_modules
# This ensures 'concurrently' and 'genkit-cli' (if in dependencies) remain.
RUN npm prune --omit=dev

# Create a directory for the standalone server output
RUN mkdir -p /app/standalone-server

# Copy the Next.js standalone output
COPY --from=builder /app/.next/standalone ./standalone-server

# Copy the Next.js static assets
COPY --from=builder /app/.next/static ./standalone-server/.next/static

# Copy Genkit source files and other necessary runtime files for Genkit.
COPY src/ai ./src/ai
# package.json is already copied.
COPY tsconfig.json ./tsconfig.json
# If Genkit needs genkit.config.json at runtime, uncomment and copy:
# COPY genkit.config.json ./genkit.config.json

# Expose the port Next.js and Genkit will run on
EXPOSE 3000
EXPOSE 3400

# Start the application using the npm start script
# This script will use the /app/node_modules which now contains production dependencies.
CMD ["npm", "run", "start"]
