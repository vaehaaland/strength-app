#!/bin/sh
set -e

# Kjør migrations i prod (hvis du bruker Prisma migrations)
npx prisma migrate deploy || true

# (Valgfritt) Init/seed kun dersom db mangler – dette må vi styre litt forsiktig.
# Du kan fjerne dette om du vil ha full kontroll manuelt.
if [ ! -f "/data/dev.db" ]; then
  echo "DB not found, initializing..."
  node init-db.js || true
  node seed-db.js || true
fi

exec npm start
