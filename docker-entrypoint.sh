#!/bin/sh
set -e

# Ensure data directory exists
mkdir -p /data/db
mkdir -p /data/db/backups

# Set DATABASE_URL for Prisma if not already set
export DATABASE_URL="${DATABASE_URL:-file:/data/db/app.db}"

# If database exists, use safe migration (with backup)
# If database doesn't exist, use regular migration
if [ -f "/data/db/app.db" ]; then
  echo "Database exists, running safe migration with backup..."
  node scripts/safe-migrate.js deploy || {
    echo "Migration failed! Database backup should be available in /data/db/backups"
    exit 1
  }
else
  echo "DB not found, initializing with migrations..."
  npx prisma migrate deploy || true
  node init-db.js || true
  node seed-db.js || true
fi

exec npm start
