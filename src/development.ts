import { Elysia } from "elysia";
import { authRoutes } from "./routes/auth";
import openapi from "@elysia/openapi";

const app = new Elysia()
  .group("/api", (api) => api.use(authRoutes))

  .use(
    openapi({
      documentation: {
        tags: [{ name: "Auth", description: "Authentication endpoints" }],
      },
    }),
  )

  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);