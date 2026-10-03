# =========================
# BUILD STAGE
# =========================

FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npx prisma generate

# =========================
# RUNTIME STAGE
# =========================

FROM node:22-alpine

WORKDIR /app

COPY --from=builder /app .

EXPOSE 8080

CMD ["node", "server.js"]