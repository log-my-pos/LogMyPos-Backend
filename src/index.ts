import { Elysia } from "elysia";
import { authRoutes } from "./routes/auth";

const app = new Elysia()
  .get("/", () => "Server is up and running")

  .group("/api", (api) => api.use(authRoutes));

export default app;
