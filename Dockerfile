# Use official Node.js image
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application source
COPY . .

# Build the frontend
RUN npm run build

# Expose port
EXPOSE 5000

# Set environment to production
ENV NODE_ENV=production

# Start the server
CMD ["npm", "run", "server"]
