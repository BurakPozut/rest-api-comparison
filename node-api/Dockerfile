# Use the official Node.js 18 Alpine image as the base
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json (if exists)
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy the rest of the application
COPY . .

# Expose port 3000
EXPOSE 3000

# Set the entry point
CMD ["node", "server.js"] 