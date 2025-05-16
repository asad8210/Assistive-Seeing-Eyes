# Stage 1: Builder
FROM node:20-slim AS builder
WORKDIR /app

# Install pnpm for improved dependency management if desired, or stick to npm
# RUN npm install -g pnpm

# Copy package.json and package-lock.json (or pnpm-lock.yaml)
COPY package*.json ./
# If using pnpm: COPY pnpm-lock.yaml ./

# Install all dependencies (including devDependencies for build)
RUN npm install
# If using pnpm: RUN pnpm install --frozen-lockfile

# Copy the rest of your application code
# Ensure .dockerignore is properly configured to exclude node_modules, .next, etc. from this copy
COPY . .

# Build the Next.js application
# This will also generate the standalone output in .next/standalone
RUN npm run build

# Stage 2: Runner (Production)
FROM node:20-slim AS runner
WORKDIR /app

# Set NODE_ENV to production
ENV NODE_ENV production

# Copy package.json and package-lock.json from builder to ensure consistency
COPY --from=builder /app/package*.json ./
# If using pnpm: COPY --from=builder /app/pnpm-lock.yaml ./

# Copy the entire node_modules from the builder stage
# This ensures all production dependencies, including CLIs like genkit-cli and concurrently, are present.
COPY --from=builder /app/node_modules ./node_modules

# Remove development dependencies from the copied node_modules
# This step is crucial to keep the image size down while ensuring all prod deps are there.
RUN npm prune --omit=dev
# If using pnpm: RUN pnpm prune --prod

# Create a directory for the standalone server output
RUN mkdir -p ./standalone-server

# Copy the Next.js standalone output (server code and minimal node_modules for Next itself)
COPY --from=builder /app/.next/standalone ./standalone-server

# Copy the Next.js static assets (JS, CSS, images processed by Next.js)
COPY --from=builder /app/.next/static ./standalone-server/.next/static

# Copy Genkit source files and other necessary runtime files for Genkit.
# This ensures that 'genkit start' can find the flow files.
COPY src/ai ./src/ai
# package.json is already copied
COPY tsconfig.json ./tsconfig.json
# If Genkit uses other config files at runtime, copy them too. e.g.,
# COPY genkit.config.json ./genkit.config.json # If you have this

# Expose the port Next.js and Genkit will run on
EXPOSE 3000
EXPOSE 3400

# Start the application using the npm start script
# This script should use concurrently to run both the Next.js standalone server and Genkit
CMD ["npm", "run", "start"]
