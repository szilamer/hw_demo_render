# Use an official Node.js runtime as a parent image with specific platform
FROM --platform=linux/amd64 node:18

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (or npm-shrinkwrap.json) to leverage Docker cache
COPY package*.json ./

# Install build dependencies and project dependencies
RUN apt-get update && apt-get install -y python3 make g++ && \
    npm install && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy the rest of the application code to the working directory
# Files listed in .dockerignore will be excluded
COPY . .

# Build the application
RUN npx parcel build src/index.html

# Make port 3001 available to the world outside this container
EXPOSE 3001

# Install a simple HTTP server to serve the built files
RUN npm install -g http-server

# Serve the built files
CMD ["http-server", "dist", "-p", "3001"] 