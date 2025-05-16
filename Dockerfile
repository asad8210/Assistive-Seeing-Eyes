# Stage 1: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock)
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

# Install production dependencies only
# concurrently and tsx are needed for the start script
COPY --from=builder /app/package*.json ./
RUN npm install --omit=dev

# Copy the Next.js standalone output
COPY --from=builder /app/.next/standalone ./

# Copy the Next.js static assets
COPY --from=builder /app/.next/static ./.next/static

# Copy public folder from source
# Ensure 'public' directory exists at the root of your project, even if empty (e.g., with a .gitkeep file)

# Copy Genkit source files and other necessary runtime files for Genkit.
# This ensures that 'genkit start' can find the flow files.
COPY src/ai ./src/ai
# package.json is already copied for npm install
# If Genkit uses other config files at runtime, copy them too. e.g.,
# COPY genkit.config.json ./genkit.config.json # If you have this
COPY tsconfig.json ./tsconfig.json

# Expose the port Next.js and Genkit will run on
EXPOSE 3000
EXPOSE 3400

# Start the application using the npm start script
CMD ["npm", "run", "start"]
