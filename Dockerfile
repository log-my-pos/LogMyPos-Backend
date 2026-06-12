FROM oven/bun:1.2-slim

WORKDIR /app

ENV NODE_ENV=production

COPY . .
RUN bun install --frozen-lockfile --production

EXPOSE 3000

USER bun
CMD ["bun", "run", "src/index.ts"]