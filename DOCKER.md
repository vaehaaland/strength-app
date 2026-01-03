# Docker Deployment Guide

## Overview
This application is containerized using Docker and designed to run on Debian Bullseye (node:20-bullseye-slim).

## Key Configuration

### Prisma + Debian Bullseye
The application uses Prisma ORM with SQLite. For Debian compatibility:
- **Binary Target**: Prisma schema specifies `binaryTargets = ["native", "debian-openssl-1.1.x"]`
- **OpenSSL**: The Dockerfile installs `openssl` to provide the required 1.1.x libraries

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
1. Creates the `/data/db` directory and `/data/db/backups`
2. If database exists: Runs safe migration with automatic backup
3. If database doesn't exist: Runs Prisma migrations and initialization scripts

**Safe Migration Process:**
- Creates timestamped backup before migration
- Verifies database integrity before and after
- Provides rollback instructions if migration fails
- Keeps 10 most recent backups automatically

See [Database Migration & Backup Guide](docs/DATABASE_MIGRATION.md) for complete details.

## Troubleshooting

### Prisma OpenSSL Errors
If you see errors like:
```
Error loading shared library libssl.so.1.1: No such file or directory
```

This means Prisma is using the wrong binary target. Ensure:
1. `prisma/schema.prisma` includes `binaryTargets = ["native", "debian-openssl-1.1.x"]`
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

### Accessing Database Backups

List available backups:
```bash
docker exec <container-name> ls -lh /data/db/backups/
```

Copy backup to host:
```bash
docker cp <container-name>:/data/db/backups/backup-pre-migration-2026-01-03T12-30-45-123Z.db ./
```

Restore a backup:
```bash
docker exec <container-name> node scripts/restore-backup.js /data/db/backups/backup-pre-migration-2026-01-03T12-30-45-123Z.db
docker restart <container-name>
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
