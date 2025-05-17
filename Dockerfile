# Use official Node.js 20 image as base
FROM node:20-alpine

# Set working directory inside the container
WORKDIR /app

# Install dependencies only when needed
COPY package.json package-lock.json* ./ 

# Install dependencies
RUN npm install --production

# Copy rest of the app source code
COPY . .

# Build the Next.js app
RUN npm run build

# Expose port the app runs on
EXPOSE 3000

# Start the Next.js server in production mode
CMD ["npm", "start"]
