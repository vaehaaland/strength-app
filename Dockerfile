# ---------- deps ----------
FROM node:20-alpine AS deps
WORKDIR /app

# Install OpenSSL 3.x for Prisma
RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm ci

# ---------- builder ----------
FROM node:20-alpine AS builder
WORKDIR /app

# Install OpenSSL 3.x for Prisma
RUN apk add --no-cache openssl

COPY --from=deps /app/node_modules ./node_modules
COPY . . 

# Generate Prisma client before build with correct platform
RUN npx prisma generate
RUN npm run build

# ---------- runner ----------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Install OpenSSL 3.x for Prisma runtime
RUN apk add --no-cache openssl

# Runtime files
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.* ./

# Copy prisma schema for migrations at runtime
COPY --from=builder /app/prisma ./prisma

# Copy initialization scripts
COPY --from=builder /app/init-db.js ./
COPY --from=builder /app/seed-db.js ./
COPY --from=builder /app/lib ./lib

# Entrypoint
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 3000
CMD ["./docker-entrypoint.sh"]
