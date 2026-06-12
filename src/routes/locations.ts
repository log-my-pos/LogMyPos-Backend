// ------------------------------------------------------ //
// ---------------------- LOCATIONS --------------------- //
// ------------------------------------------------------ //

import { Elysia, t } from "elysia";

export const locationRoutes = new Elysia({
  prefix: "/locations",
  detail: { tags: ["Locations"] },
})