# Stage 1: Build Stage
FROM node:20-alpine AS builder

# Define build-time argument for the webhook URL
ARG N8N_WEBHOOK_URL_ARG

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies (using ci for cleaner install)
# Make sure npm ci can run, might need python/make/g++ for some native modules
# If ci fails, fallback to install
RUN npm ci || npm install

# Copy the rest of the application code
COPY . .

# Set the environment variable for the build process
ENV REACT_APP_N8N_WEBHOOK_URL=$N8N_WEBHOOK_URL_ARG

# Run the build script (builds frontend and server)
# This will now embed the REACT_APP_N8N_WEBHOOK_URL into the frontend code
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

# Copy the actual documents from the builder stage to the location expected by the server
COPY --from=builder /app/src/documents ./src/documents

# Expose the port the app runs on
# Default is 3001 from src/server/index.ts, but can be overridden by PORT env var
EXPOSE 3001

# Set the command to start the server
# Uses the start script defined in package.json
CMD ["npm", "start"] 