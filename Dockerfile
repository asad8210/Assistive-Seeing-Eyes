# Stage 1: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Install all dependencies for building
COPY package*.json ./
RUN npm ci

# Copy all source code (this will include the 'public' folder if it exists at the root)
COPY . .

# Build Next.js app (this will use output: 'standalone' from next.config.ts)
RUN npm run build # This creates .next/standalone and .next/static

# Stage 2: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

# Copy package.json and package-lock.json to install production dependencies
# These dependencies (like concurrently, tsx, genkit, etc.) are needed to run the start command.
COPY package*.json ./
RUN npm ci --omit=dev

# Copy the standalone Next.js server output from the builder stage.
# This copies the contents of /app/.next/standalone from builder to /app in runner.
# So, server.js will be at /app/server.js.
COPY --from=builder /app/.next/standalone ./

# Copy the static assets (including those processed from the public folder by the build)
# from the builder stage to the location the standalone server expects.
COPY --from=builder /app/.next/static ./.next/static

# Copy the original 'public' folder from the build context (your project's source).
# The standalone Next.js server (invoked by server.js) will serve files from this ./public directory.
# Ensure your project HAS a 'public' folder at its root if you rely on files here (e.g., favicon.ico, robots.txt).
# If your 'public' folder is missing or empty, this line might cause issues if Docker strictness is high,
# but usually, it's fine if the source folder is empty/missing.
COPY public ./public

# Copy Genkit source files and other necessary runtime files for Genkit.
# These are copied relative to the WORKDIR /app.
COPY src/ai ./src/ai
COPY tsconfig.json ./tsconfig.json
# If Genkit relies on .env for GOOGLE_API_KEY and you are not solely using Render's env vars:

EXPOSE 3000
EXPOSE 3400

# Start Next.js standalone server (runs from /app/server.js)
# and Genkit server (runs from /app, needs src/ai and tsconfig.json for paths).
# `concurrently` needs to be in production dependencies.
CMD ["concurrently", "node ./server.js", "genkit start --port 3400 --tsx src/ai/dev.ts"]
