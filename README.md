# Settle Me - Poker Settlement App

A poker game settlement tracker with buy-ins, cashouts, leaderboard, and Splitwise-style settlement suggestions.

## Prerequisites

- Node.js 20+
- npm

## Local Setup

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install

# Create data directory
mkdir -p server/data

# Start backend (from server folder)
node index.js

# Start frontend (from project root, in a new terminal)
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001
- Admin login: `admin` / `admin123`

## Export as Source Archive

```bash
cd /path/to/parent/folder
tar -czf settle-me.tar.gz --exclude='**/node_modules' --exclude='server/data/*.db*' settle-me
```

## Docker Setup

```bash
docker build -t settle-me:latest .
docker run -d --name settle-me-app -p 80:80 -v settle-me-data:/app/server/data --restart unless-stopped settle-me:latest
```

Access at http://localhost

## Export Docker Image

```bash
docker save settle-me:latest | gzip > settle-me-docker.tar.gz
```

## Deploy from Docker Image

```bash
docker load < settle-me-docker.tar.gz
docker run -d --name settle-me-app -p 80:80 -v settle-me-data:/app/server/data --restart unless-stopped settle-me:latest
```
