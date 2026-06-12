FROM oven/bun:1.2-slim AS base
WORKDIR /app

COPY package.json bun.lock ./

RUN bun install --frozen-lockfile --production

FROM oven/bun:1.2-slim AS runner
WORKDIR /app

COPY --from=base /app/node_modules ./node_modules

COPY . .

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

USER bun

CMD ["bun", "run", "src/index.ts"]