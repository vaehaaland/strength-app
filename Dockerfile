# ---------- deps ----------
FROM node:20-bullseye-slim AS deps
WORKDIR /app
COPY package*.json ./
# Ensure OpenSSL 1.1 is available for Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
RUN npm ci

# ---------- builder ----------
FROM node:20-bullseye-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Ensure OpenSSL 1.1 is available for Prisma client generation
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Prisma client bør genereres i build stage
RUN npx prisma generate
RUN npm run build

# ---------- runner ----------
FROM node:20-bullseye-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# Ensure OpenSSL 1.1 is available for Prisma client at runtime
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.* ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/init-db.js ./
COPY --from=builder /app/seed-db.js ./

COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 3000
CMD ["./docker-entrypoint.sh"]