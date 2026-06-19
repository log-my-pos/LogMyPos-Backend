// ------------------------------------------------------ //
// ------------------------ USERS ----------------------- //
// ------------------------------------------------------ //

import { bearer } from "@elysia/bearer";
import { jwt } from "@elysiajs/jwt";
import { Elysia, t } from "elysia";
import { supabase } from "../utils/supabase";

export const userRoutes = new Elysia({
  prefix: "/users",
  detail: { tags: ["Users"] },
})
  .use(bearer())
  .use(
    jwt({
      secret: process.env.JWT_SECRET!,
    }),
  )
  .derive(async ({ bearer, jwt }) => {
    if (!bearer) {
      return { user: null };
    }

    const payload = await jwt.verify(bearer);

    if (!payload) {
      return { user: null };
    }

    return {
      user: {
        id: payload.sub as string,
        username: payload.name as string,
        role: payload.scope as string,
      },
    };
  })
  .guard(
    {
      beforeHandle: ({ user, set }) => {
        if (!user) {
          set.status = 401;
          return { error: "Unauthorized: Invalid or missing token" };
        }
      },
    },
    (app) =>
      app
        // -------------------- GET ALL USERS ------------------- //
        .get(
          "/",
          async ({ user, set }) => {
            if (!user) {
              set.status = 401;
              return { error: "Unauthorized: Invalid or missing token" };
            }

            const { data, error } = await supabase
              .from("users")
              .select("id, email, username, role")
              .order("username", { ascending: true });

            if (error) {
              set.status = 500;
              return {
                error: error.message || "Failed to retrieve users",
              };
            }

            return {
              message: "Users retrieved successfully",
              data,
            };
          },
          {
            detail: {
              summary: "Retrieve all users",
              description: "Fetches a list of all registered users. Requires an active authentication token.",
              tags: ["Users"],
              security: [{ bearerAuth: [] }],
              responses: {
                200: { description: "User list successfully retrieved." },
                401: { description: "Authorisation failed due to an invalid or missing bearer token." },
                500: { description: "Database engine query processing fault." },
              },
            },
            response: {
              200: t.Object({
                message: t.String(),
                data: t.Array(
                  t.Object({
                    id: t.String({ format: "uuid" }),
                    email: t.String(),
                    username: t.String(),
                    role: t.String(),
                  })
                ),
              }),
              401: t.Object({ error: t.String() }),
              500: t.Object({ error: t.String() }),
            },
          }
        )
  );