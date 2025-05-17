# Base image with Node.js 18
FROM node:18-alpine AS base

# Set working directory
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy rest of the app
COPY . .

# Build the Next.js project
RUN npm run build

# Expose the port (matches your `dev` script: -p 9002)
EXPOSE 9002

# Run Next.js server
CMD ["npm", "start"]
