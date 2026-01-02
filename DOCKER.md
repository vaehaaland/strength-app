# Docker Deployment Guide

## Overview
This application is containerized using Docker and designed to run on Alpine Linux (node:20-alpine).

## Key Configuration

### Prisma + Alpine Linux
The application uses Prisma ORM with SQLite. For Alpine Linux compatibility:
- **Binary Target**: Prisma schema specifies `binaryTargets = ["native", "linux-musl-openssl-3.0.x"]`
- **OpenSSL**: Alpine 3.23 includes OpenSSL 3.x by default (libssl3, libcrypto3)
- No additional packages need to be installed

### Database Configuration
The database path is controlled by the `DATABASE_URL` environment variable:

**Default (Docker)**: `file:/data/db/app.db`
**Development**: `file:./dev.db`

Set via environment variable:
```bash
docker run -e DATABASE_URL="file:/data/db/app.db" strength-app
```

Or use the default which is set in `docker-entrypoint.sh`.

### Volume Mounting
To persist data across container restarts, mount a volume:
```bash
docker run -v /path/on/host:/data strength-app
```

## Building

```bash
docker build -t strength-app .
```

## Running

```bash
# Basic run
docker run -p 3000:3000 strength-app

# With persistent storage
docker run -p 3000:3000 -v $(pwd)/data:/data strength-app

# With custom database URL
docker run -p 3000:3000 -e DATABASE_URL="file:/custom/path/app.db" strength-app
```

## Initialization

The `docker-entrypoint.sh` script automatically:
1. Creates the `/data/db` directory
2. Runs Prisma migrations (`npx prisma migrate deploy`)
3. If database doesn't exist, runs initialization and seeding scripts

## Troubleshooting

### Prisma OpenSSL Errors
If you see errors like:
```
Error loading shared library libssl.so.1.1: No such file or directory
```

This means Prisma is using the wrong binary target. Ensure:
1. `prisma/schema.prisma` includes `binaryTargets = ["native", "linux-musl-openssl-3.0.x"]`
2. Run `npx prisma generate` after changes
3. Rebuild the Docker image

### Missing Files Errors
If you see errors like:
```
Error: Cannot find module '/app/init-db.js'
```

Ensure the Dockerfile copies these files to the runner stage:
```dockerfile
COPY --from=builder /app/init-db.js ./
COPY --from=builder /app/seed-db.js ./
COPY --from=builder /app/lib ./lib
```

### Database Not Persisting
Ensure you're mounting a volume to `/data`:
```bash
docker run -v /path/on/host:/data strength-app
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `file:/data/db/app.db` | Path to SQLite database file |
| `NODE_ENV` | `production` | Node environment (set in Dockerfile) |

## Files Needed at Runtime

The Docker image includes:
- Compiled Next.js application (`.next`)
- Node modules
- Prisma schema and generated client
- Initialization scripts (`init-db.js`, `seed-db.js`)
- Library files (`lib/` directory)
- Static assets (`public/`)

## Production Deployment

For production deployment:
1. Build the image: `docker build -t strength-app:latest .`
2. Tag for your registry: `docker tag strength-app:latest registry.example.com/strength-app:latest`
3. Push to registry: `docker push registry.example.com/strength-app:latest`
4. Deploy with volume mount for data persistence
5. Optionally set custom `DATABASE_URL` via environment variable
