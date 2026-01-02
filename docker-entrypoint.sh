#!/bin/sh
set -e

# Ensure data directory exists
mkdir -p /data/db

# Set DATABASE_URL for Prisma if not already set
export DATABASE_URL="${DATABASE_URL:-file:/data/db/app.db}"

# Run migrations in prod (if using Prisma migrations)
npx prisma migrate deploy || true

# (Optional) Init/seed only if db is missing - handle carefully
# You can remove this if you want full manual control
if [ ! -f "/data/db/app.db" ]; then
  echo "DB not found, initializing..."
  node init-db.js || true
  node seed-db.js || true
fi

exec npm start
