// ------------------------------------------------------ //
// ---------------------- LOCATIONS --------------------- //
// ------------------------------------------------------ //

import { bearer } from "@elysia/bearer";
import { jwt } from "@elysiajs/jwt";
import { Elysia, t } from "elysia";
import { supabase } from "../utils/supabase";

export const locationRoutes = new Elysia({
  prefix: "/locations",
  detail: { tags: ["Locations"] },
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
      // ------------------- CREATE LOCATION ------------------ //
      app.post(
        "/",
        async ({ query, body, user, set }) => {
          if (!user) {
            set.status = 401;
            return { error: "Unauthorized" };
          }

          const { title, description, latitude, longitude } = body;

          const targetUserId =
            user.role === "admin" && query.id ? query.id : user.id;

          const { error, data } = await supabase
            .from("location_marks")
            .insert({
              title,
              description,
              latitude,
              longitude,
              user_id: targetUserId,
            })
            .select()
            .single();

          if (error) {
            set.status = error.code === "42501" ? 403 : 400;
            return { error: error.message || "Failed to create location mark" };
          }
          set.status = 201;
          return {
            message: "Location mark created successfully",
            data,
          };
        },
        {
          body: t.Object({
            title: t.String({
              minLength: 1,
              description: "The name or title of the location mark.",
              default: "Cosy Coffee Shop",
            }),
            description: t.Optional(
              t.Nullable(
                t.String({
                  description:
                    "Detailed notes or descriptions about the location.",
                  default: "Great espresso and quiet workspace.",
                }),
              ),
            ),
            latitude: t.Number({
              description: "The geographical latitude coordinate.",
              default: 51.5074,
            }),
            longitude: t.Number({
              description: "The geographical longitude coordinate.",
              default: -0.1278,
            }),
          }),
          query: t.Object({
            id: t.Optional(
              t.String({
                description:
                  "The target user ID query parameter. Admins can pass an alternate user UUID; standard users will default to their own ID.",
                format: "uuid",
              }),
            ),
          }),

          detail: {
            summary: "Create a new location mark",
            description:
              "Creates a new location mark entry in the database. If the authenticated user has an `admin` role, they can override the target assignment using the query parameters. Standard accounts will always default to their own record ID.",
            tags: ["Locations"],
            responses: {
              201: {
                description:
                  "Location mark successfully created and stored in the database.",
              },
              400: {
                description:
                  "Creation failed due to invalid coordinates or missing required properties.",
              },
              401: {
                description:
                  "Authorisation failed due to an invalid or missing bearer token.",
              },
              403: {
                description:
                  "Forbidden. Database row-level security policy violation or insufficient privileges.",
              },
            },
          },

          response: {
            201: t.Object({
              message: t.String(),
              data: t.Object({
                id: t.String({ format: "uuid" }),
                title: t.String(),
                description: t.Nullable(t.String()),
                latitude: t.Number(),
                longitude: t.Number(),
                user_id: t.String({ format: "uuid" }),
                created_at: t.Optional(t.String()),
                updated_at: t.Optional(t.String()),
              }),
            }),
            400: t.Object({
              error: t.String(),
            }),
            401: t.Object({
              error: t.String(),
            }),
            403: t.Object({
              error: t.String(),
            }),
          },
        },
      ),
  );
