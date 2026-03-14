# Build frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package.json ./
RUN npm config set registry https://registry.npmjs.org && npm install --legacy-peer-deps
COPY . .
RUN npm run build

# Production
FROM node:20-alpine
WORKDIR /app

# Install build tools for better-sqlite3 native compilation
RUN apk add --no-cache python3 make g++ nginx

# Install backend dependencies (compiles for current platform)
COPY server/package.json ./server/
RUN cd server && npm config set registry https://registry.npmjs.org && npm install --build-from-source

# Copy backend code (exclude node_modules)
COPY server/index.js ./server/

# Copy frontend build
COPY --from=frontend-builder /app/dist ./public

# Create data directory
RUN mkdir -p /app/server/data

# Nginx config
RUN echo 'server { \
    listen 80; \
    location / { \
        root /app/public; \
        try_files $uri $uri/ /index.html; \
    } \
    location /api { \
        proxy_pass http://127.0.0.1:3001; \
    } \
}' > /etc/nginx/http.d/default.conf

# Start script
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'cd /app/server && node index.js &' >> /app/start.sh && \
    echo 'nginx -g "daemon off;"' >> /app/start.sh && \
    chmod +x /app/start.sh

EXPOSE 80
CMD ["/app/start.sh"]
