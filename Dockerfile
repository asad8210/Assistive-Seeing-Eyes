# Stage 1: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm install

# Copy the rest of your application code
COPY . .

# Build the Next.js application
# This will also generate the standalone output in .next/standalone
RUN npm run build

# Stage 2: Runner (Production)
FROM node:20-alpine AS runner
WORKDIR /app

# Set NODE_ENV to production
ENV NODE_ENV production

# Copy only required files for production
COPY package*.json ./

# Install production dependencies.
# Using 'npm install' here as it's more resilient to package-lock.json mismatches than 'npm ci'.
# This ensures 'concurrently' and 'genkit-cli' are in /app/node_modules
RUN npm install --omit=dev

# Create a directory for the standalone server output
RUN mkdir -p /app/standalone-server

# Copy Next.js standalone server build from builder stage
COPY --from=builder /app/.next/standalone ./standalone-server

# Copy Next.js static assets from builder stage
COPY --from=builder /app/.next/static ./standalone-server/.next/static

# Copy Genkit source files and other necessary runtime files for Genkit.
COPY src/ai ./src/ai
COPY tsconfig.json ./tsconfig.json
# COPY genkit.config.json ./genkit.config.json # Uncomment if you have this

# Expose the port Next.js and Genkit will run on
EXPOSE 3000
EXPOSE 3400

# Start the application using the npm start script
# This will use the /app/package.json and /app/node_modules
CMD ["npm", "run", "start"]
