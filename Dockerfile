# Stage 1: Build Frontend and Backend
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Build client static files
RUN npm run build
# Compile TypeScript WebSocket server to pure JavaScript
RUN npx tsc server.ts --target es2022 --module Node16 --esModuleInterop true --moduleResolution Node16 --ignoreConfig

# Stage 2: Serve using pure Node.js (highly optimized runtime)
FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

COPY package*.json ./
# Install ONLY production dependencies (like ws) for a tiny footprint
RUN npm ci --only=production

# Copy compiled server and built client files from builder stage
COPY --from=builder /app/server.js ./
COPY --from=builder /app/dist ./dist

# Create the uploads directory for persistent storage
RUN mkdir -p uploads

# Expose port
EXPOSE 8080

# Define volume for image upload persistence
VOLUME ["/app/uploads"]

# Run server using pure Node (no ts-node overhead!)
CMD ["node", "server.js"]
