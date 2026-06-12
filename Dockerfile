# 1. Use the official lightweight Bun image
FROM oven/bun:1.2-slim AS base
WORKDIR /app

# 2. Copy dependency files first to maximize Docker caching efficiency
COPY package.json bun.lock* bun.lockb* ./

# 3. Install production and development dependencies 
RUN bun install --frozen-lockfile

# 4. Copy the rest of your application code (including the src folder)
COPY . .

# 5. Expose port 3000 (the port your Elysia app listens on)
EXPOSE 3000

# 6. Set environment to production
ENV NODE_ENV=production

# 7. Run as a non-privileged user (built into the Bun image) for security
USER bun

# 8. Start your Elysia application
CMD ["bun", "run", "src/index.ts"]