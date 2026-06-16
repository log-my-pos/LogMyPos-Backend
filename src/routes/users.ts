// ------------------------------------------------------ //
// ------------------------ USERS ----------------------- //
// ------------------------------------------------------ //

import { Elysia, t } from "elysia";

export const userRoutes = new Elysia({
  prefix: "/users",
  detail: { tags: ["Users"] },
})