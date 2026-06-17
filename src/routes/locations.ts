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
      app
        .post(
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
              return {
                error: error.message || "Failed to create location mark",
              };
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
        )

        // -------------------- GET LOCATION -------------------- //
        .get(
          "/:id",
          async ({ params, user, set }) => {
            if (!user) {
              set.status = 401;
              return { error: "Unauthorized: Invalid or missing token" };
            }

            const { data, error } = await supabase
              .from("location_marks")
              .select()
              .eq("id", params.id)
              .single();

            if (error) {
              set.status = 400;
              return {
                error: error.message || "Failed to retrieve location mark",
              };
            }

            if (user.role !== "admin" && data.user_id !== user.id) {
              set.status = 403;
              return {
                error:
                  "Forbidden: You do not have permission to view this location mark",
              };
            }

            return {
              message: "Location mark retrieved successfully",
              data,
            };
          },
          {
            params: t.Object({
              id: t.String({
                format: "uuid",
                description:
                  "The unique UUID of the location mark to retrieve.",
              }),
            }),
            detail: {
              summary: "Retrieve a specific location mark",
              description:
                "Fetches a single location mark. Users can only view their own marks unless they have admin privileges.",
              tags: ["Locations"],
              responses: {
                200: { description: "Location mark successfully retrieved." },
                400: { description: "Failed to retrieve the location mark." },
                401: {
                  description:
                    "Authorisation failed due to an invalid or missing bearer token.",
                },
                403: {
                  description:
                    "Forbidden. You do not have permission to view this resource.",
                },
              },
            },
            response: {
              200: t.Object({
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
              400: t.Object({ error: t.String() }),
              401: t.Object({ error: t.String() }),
              403: t.Object({ error: t.String() }),
            },
          },
        )

        // ------------------ GET ALL LOCATIONS ----------------- //
        .get(
          "/",
          async ({ query, user, set }) => {
            if (!user) {
              set.status = 401;
              return { error: "Unauthorized: Invalid or missing token" };
            }

            let targetUserId = user.id;

            if (query.id) {
              if (user.role === "admin") {
                targetUserId = query.id;
              } else if (query.id !== user.id) {
                set.status = 403;
                return {
                  error:
                    "Forbidden: You do not have permission to view another user's locations",
                };
              }
            }

            const { data, error } = await supabase
              .from("location_marks")
              .select()
              .eq("user_id", targetUserId)
              .order("created_at", { ascending: false });

            if (error) {
              set.status = 400;
              return {
                error: error.message || "Failed to retrieve location marks",
              };
            }

            return {
              message: "Location marks retrieved successfully",
              data,
            };
          },
          {
            query: t.Object({
              id: t.Optional(
                t.String({
                  format: "uuid",
                  description:
                    "The target user ID. Admins can pass an alternate user UUID to view their locations.",
                }),
              ),
            }),
            detail: {
              summary: "Retrieve all location marks for a user",
              description:
                "Fetches an array of all location marks belonging to the authenticated user. Admins can provide a user ID in the query to fetch that specific user's marks.",
              tags: ["Locations"],
              responses: {
                200: { description: "Location marks successfully retrieved." },
                400: { description: "Failed to retrieve the location marks." },
                401: {
                  description:
                    "Authorisation failed due to an invalid or missing bearer token.",
                },
                403: {
                  description:
                    "Forbidden. You do not have permission to view this user's locations.",
                },
              },
            },
            response: {
              200: t.Object({
                message: t.String(),
                data: t.Array(
                  t.Object({
                    id: t.String({ format: "uuid" }),
                    title: t.String(),
                    description: t.Nullable(t.String()),
                    latitude: t.Number(),
                    longitude: t.Number(),
                    user_id: t.String({ format: "uuid" }),
                    created_at: t.Optional(t.String()),
                    updated_at: t.Optional(t.String()),
                  }),
                ),
              }),
              400: t.Object({ error: t.String() }),
              401: t.Object({ error: t.String() }),
              403: t.Object({ error: t.String() }),
            },
          },
        )

        // ------------------- UPDATE LOCATION ------------------ //
        .patch(
          "/:id",
          async ({ params, body, user, set }) => {
            if (!user) {
              set.status = 401;
              return { error: "Unauthorized: Invalid or missing token" };
            }

            const { data: existingRecord, error: fetchError } = await supabase
              .from("location_marks")
              .select("user_id")
              .eq("id", params.id)
              .single();

            if (fetchError) {
              set.status = 400;
              return {
                error:
                  fetchError.message || "Failed to locate record for update",
              };
            }

            if (user.role !== "admin" && existingRecord.user_id !== user.id) {
              set.status = 403;
              return {
                error:
                  "Forbidden: You do not have permission to update this location mark",
              };
            }

            const { error, data } = await supabase
              .from("location_marks")
              .update({
                title: body.title,
                description: body.description,
                latitude: body.latitude,
                longitude: body.longitude,
              })
              .eq("id", params.id)
              .select()
              .single();

            if (error) {
              set.status = 400;
              return {
                error: error.message || "Failed to update location mark",
              };
            }

            return {
              message: "Location mark updated successfully",
              data,
            };
          },
          {
            params: t.Object({
              id: t.String({
                format: "uuid",
                description: "The unique UUID of the location mark to update.",
              }),
            }),
            body: t.Object({
              title: t.Optional(
                t.String({
                  minLength: 1,
                  description:
                    "The updated name or title of the location mark.",
                }),
              ),
              description: t.Optional(
                t.Nullable(
                  t.String({
                    description: "Updated notes or descriptions.",
                  }),
                ),
              ),
              latitude: t.Optional(
                t.Number({
                  description: "The updated latitude coordinate.",
                }),
              ),
              longitude: t.Optional(
                t.Number({
                  description: "The updated longitude coordinate.",
                }),
              ),
            }),
            detail: {
              summary: "Update an existing location mark",
              description:
                "Updates specific fields on an existing location mark. Users can only modify their own marks unless they are an admin.",
              tags: ["Locations"],
              responses: {
                200: { description: "Location mark successfully updated." },
                400: {
                  description:
                    "Update failed due to invalid data or database error.",
                },
                401: { description: "Authorisation failed." },
                403: {
                  description:
                    "Forbidden. You do not have permission to modify this resource.",
                },
              },
            },
            response: {
              200: t.Object({
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
              400: t.Object({ error: t.String() }),
              401: t.Object({ error: t.String() }),
              403: t.Object({ error: t.String() }),
            },
          },
        )

        // ------------------- DELETE LOCATION ------------------ //
        .delete(
          "/:id",
          async ({ params, user, set }) => {
            if (!user) {
              set.status = 401;
              return { error: "Unauthorized: Invalid or missing token" };
            }

            const { data: existingRecord, error: fetchError } = await supabase
              .from("location_marks")
              .select("user_id")
              .eq("id", params.id)
              .single();

            if (fetchError) {
              set.status = 400;
              return {
                error:
                  fetchError.message || "Failed to locate record for deletion",
              };
            }

            if (user.role !== "admin" && existingRecord.user_id !== user.id) {
              set.status = 403;
              return {
                error:
                  "Forbidden: You do not have permission to delete this location mark",
              };
            }

            const { error } = await supabase
              .from("location_marks")
              .delete()
              .eq("id", params.id);

            if (error) {
              set.status = 400;
              return {
                error: error.message || "Failed to delete location mark",
              };
            }

            return {
              message: "Location mark deleted successfully",
            };
          },
          {
            params: t.Object({
              id: t.String({
                format: "uuid",
                description: "The unique UUID of the location mark to delete.",
              }),
            }),
            detail: {
              summary: "Delete a location mark",
              description:
                "Permanently removes a location mark. Users can only delete their own marks unless they hold admin privileges.",
              tags: ["Locations"],
              responses: {
                200: { description: "Location mark successfully deleted." },
                400: { description: "Deletion failed." },
                401: { description: "Authorisation failed." },
                403: {
                  description:
                    "Forbidden. You do not have permission to delete this resource.",
                },
              },
            },
            response: {
              200: t.Object({
                message: t.String(),
              }),
              400: t.Object({ error: t.String() }),
              401: t.Object({ error: t.String() }),
              403: t.Object({ error: t.String() }),
            },
          },
        ),
  );
