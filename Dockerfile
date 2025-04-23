# Stage 1: Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies (using ci for cleaner install)
# Make sure npm ci can run, might need python/make/g++ for some native modules
# If ci fails, fallback to install
RUN npm ci || npm install

# Copy the rest of the application code
COPY . .

# Run the build script (builds frontend and server)
RUN npm run build

# Stage 2: Production Stage
FROM node:20-alpine

WORKDIR /app

# Copy only necessary package files
COPY package.json package-lock.json* ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy built artifacts from the builder stage
# This includes the built frontend (dist/) and built server (dist/server/)
COPY --from=builder /app/dist ./dist

# Expose the port the app runs on
# Default is 3001 from src/server/index.ts, but can be overridden by PORT env var
EXPOSE 3001

# Set the command to start the server
# Uses the start script defined in package.json
CMD ["npm", "start"] 