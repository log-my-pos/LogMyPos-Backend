import { Elysia } from "elysia";
import openapi from "@elysia/openapi";
import cors from "@elysiajs/cors";
import { authRoutes } from "./routes/auth";
import { locationRoutes } from "./routes/locations";
import { userRoutes } from "./routes/users";

const app = new Elysia()
  .use(cors())

  .group("/api", (api) =>
    api.use(authRoutes).use(userRoutes).use(locationRoutes).use(userRoutes),
  )

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
          version: "0.4.8",
        },
        servers: [
          {
            url: "http://localhost:3000",
            description: "Local Development Server",
          },
          {
            url: "https://logmypos-backend.coolify.pandasystems.dev",
            description: "Production Server",
          },
        ],
        tags: [
          { name: "Auth", description: "Authentication endpoints" },
          { name: "Users", description: "User management endpoints" },
          { name: "Locations", description: "Location management endpoints" },
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: "http",
              scheme: "bearer",
              bearerFormat: "JWT",
              description:
                "Enter your JWT token to access protected endpoints.",
            },
          },
        },
      },
    }),
  );

if (import.meta.main) {
  const port = Number(process.env.PORT) || 3000;

  app.listen({
    port,
    hostname: "0.0.0.0",
  });
  console.log(
    `🦊 Elysia is running locally at http://${app.server?.hostname}:${app.server?.port}`,
  );
}

export default app;
