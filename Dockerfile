# Base image
FROM node:18-alpine

# Create and set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build the NestJS app
RUN npm run build

# Expose the port your app uses (optional if you're not using HTTP)
EXPOSE 3000

# Command to run the compiled code
CMD ["npm", "run", "start:prod"]
