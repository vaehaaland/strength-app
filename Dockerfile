# ---------- deps ----------
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
# Alpine 3.23 (node:20-alpine) includes OpenSSL 3.x by default (libssl3, libcrypto3)
# No need to install additional packages - Prisma will use these with the correct binaryTarget
RUN npm ci

# ---------- builder ----------
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . . 

# Generate Prisma client with linux-musl-openssl-3.0.x binary target (configured in schema.prisma)
RUN npx prisma generate
RUN npm run build

# ---------- runner ----------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Runtime files
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.* ./

# Copy prisma schema for migrations at runtime
COPY --from=builder /app/prisma ./prisma

# Copy initialization scripts needed by docker-entrypoint.sh
COPY --from=builder /app/init-db.js ./
COPY --from=builder /app/seed-db.js ./
COPY --from=builder /app/lib ./lib

# Entrypoint
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 3000
CMD ["./docker-entrypoint.sh"]