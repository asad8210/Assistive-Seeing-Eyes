# Stage 1: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock)
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the Next.js application
RUN npm run build

# Stage 2: Runner
FROM node:20-alpine
WORKDIR /app

# Set NODE_ENV to production
ENV NODE_ENV production

# Install production dependencies
COPY --from=builder /app/package*.json ./
RUN npm install --omit=dev \
    && npm install -g serve concurrently tsx # Ensure tsx is globally available or adjust genkit command

# Copy built Next.js app from builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules 

# Copy the rest of the application source (needed for Genkit server-side code)
# We copy .env here, ensure it's configured for production or use Render's env vars
COPY . .

# Expose ports (Next.js default and Genkit default)
EXPOSE 3000
EXPOSE 3400

# Start the Next.js app and Genkit server
CMD ["npm", "run", "start"]
