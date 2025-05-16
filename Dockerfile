# Stage 1: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock)
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm install

# Copy the rest of your application code
# This includes src, public, tsconfig.json, next.config.ts, etc.
COPY . .

# Build the Next.js application
# This will also generate the standalone output in .next/standalone
RUN npm run build

# Stage 2: Runner (Production)
FROM node:20-alpine AS runner
WORKDIR /app

# Set NODE_ENV to production
ENV NODE_ENV production

# Copy package.json and package-lock.json again for installing only production dependencies
COPY --from=builder /app/package*.json ./

# Install production dependencies.
# This ensures 'concurrently' and 'genkit-cli' are in /app/node_modules
RUN npm ci --omit=dev

# Create a directory for the standalone server output
RUN mkdir -p /app/standalone-server

# Copy standalone Next.js server build from builder stage to the specific subdirectory
COPY --from=builder /app/.next/standalone ./standalone-server

# Copy static assets from builder stage to the correct location relative to the standalone server
COPY --from=builder /app/.next/static ./standalone-server/.next/static

# Copy public folder from source (if it exists and has assets)
# Ensure 'public' directory exists at the root of your project if you have static assets.
# If you don't have a public folder, you can comment this line out,
# but it's standard for Next.js to serve from a public directory.
# COPY public ./public 
# For now, assuming you might not have one or it caused issues, let's ensure it's not fatal.
# If you add a public folder later, uncomment the line above.

# Copy Genkit source files and other necessary runtime files for Genkit.
# This ensures that 'genkit start' can find the flow files.
COPY src/ai ./src/ai
COPY tsconfig.json ./tsconfig.json
# If Genkit uses other config files at runtime, copy them too, e.g.:
# COPY genkit.config.json ./ # If you have this file

# Expose the port Next.js and Genkit will run on
EXPOSE 3000
EXPOSE 3400

# Start the application using the npm start script
# This script uses concurrently to run both Next.js and Genkit
CMD ["npm", "run", "start"]
