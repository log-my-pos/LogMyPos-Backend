import { Elysia } from "elysia";
import { authRoutes } from "./routes/auth";
import openapi from "@elysia/openapi";
import cors from "@elysiajs/cors";

const app = new Elysia()
  .use(cors())

  .group("/api", (api) => api.use(authRoutes))

  .use(
    openapi({
      scalar: {
        theme: "laserwave",
        layout: "modern",
        slug: "lmp-backend-api",
        showDeveloperTools: "never",
      },
      documentation: {
        info: {
          title: "LMP Backend API",
          description: "API documentation for the LMP Backend",
          version: "0.1.4",
        },
        servers: [
          {
            url: "http://localhost:3000",
            description: "Local Development Server",
          },
          {
            url: "https://log-my-pos-backend.vercel.app",
            description: "Production Server",
          },
        ],
        tags: [{ name: "Auth", description: "Authentication endpoints" }],
      },
    }),
  );

export default app;
