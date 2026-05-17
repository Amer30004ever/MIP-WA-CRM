# Stage 1: Build the NestJS application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install ALL dependencies (including dev dependencies for build)
RUN npm ci --include=dev

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY . .

# Build the NestJS application
RUN npm run build

# Stage 2: Production image
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN apk add --no-cache dumb-init

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Copy built application and dependencies
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma

# Generate Prisma client in production
RUN npx prisma generate

USER nodejs

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/v1/health', (r) => {if (r.statusCode !== 200) throw new Error('Not healthy')})"

ENTRYPOINT ["dumb-init", "--"]

CMD ["node", "dist/main"]