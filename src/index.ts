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
          description: `
## Welcome to the LogMyPos (LMP) Core Backend Engine

This API handles full telemetry logging, location marking, relational user mapping, and object storage synchronization pipelines for the LMP client application ecosystem.

### Core Architecture Modules

* **Auth**: Secure identity assertion engine using custom JWT bearer token structures integrated with Supabase storage boundaries.
* **Users**: Profiling layers, system authorization scopes, and account control provisions.
* **Locations**: Geolocation marker data tracking, metadata indexing, and attachment management.

### Operational Security Model

All endpoints under the \`/api\` gateway (unless explicitly marked as public) require valid identity authorization headers. 
To communicate with protected routes:
1.  Authenticate using the \`/api/auth/login\` pathway to acquire a token.
2.  Pass the token inside the HTTP header stack as: \`Authorization: Bearer <your_jwt_token>\`.
          `.trim(),
          version: "0.4.8",
          license: {
            name: "MIT",
            url: "https://opensource.org/licenses/MIT",
          },
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
          {
            name: "Auth",
            description:
              "Identity token creation, cryptographic registration, and session control workflows.",
          },
          {
            name: "Users",
            description:
              "Account state query engines, administrative controls, and system permission indexing.",
          },
          {
            name: "Locations",
            description:
              "Geographic coordinate handling, location tracking metrics, and multipart storage file uploads.",
          },
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: "http",
              scheme: "bearer",
              bearerFormat: "JWT",
              description:
                "Enter your unique token structure into the submission vector block to pass authorization challenges on secure routes.",
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
