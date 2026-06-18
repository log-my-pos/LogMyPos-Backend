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
      app
        // ------------------- CREATE LOCATION ------------------ //
        .post(
          "/",
          async ({ query, body, user, set }) => {
            if (!user) {
              set.status = 401;
              return { error: "Unauthorized" };
            }

            const { title, description, latitude, longitude, created_at } =
              body;

            const targetUserId =
              user.role === "admin" && query.id ? query.id : user.id;

            const { error, data } = await supabase
              .from("location_marks")
              .insert({
                title,
                description,
                latitude,
                longitude,
                created_at,
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
              created_at: t.Optional(t.Nullable(t.String({}))),
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
        )

        // -------------------- UPLOAD IMAGE -------------------- //
        .post(
          "/image/:id",
          async ({ params, body, user, set }) => {
            if (!user) {
              set.status = 401;
              return {
                success: false,
                message: "Unauthorized: Missing user token",
              };
            }

            const { data: existingRecord, error: fetchError } = await supabase
              .from("location_marks")
              .select("user_id")
              .eq("id", params.id)
              .single();

            if (fetchError) {
              set.status = 400;
              return {
                success: false,
                message:
                  fetchError.message ||
                  "Failed to locate location mark record for image upload",
              };
            }

            if (user.role !== "admin" && existingRecord.user_id !== user.id) {
              set.status = 403;
              return {
                success: false,
                message:
                  "Forbidden: You do not have permission to upload images for this location mark",
              };
            }

            const files = Array.isArray(body.images)
              ? body.images
              : [body.images];
            const uploadResults = [];

            for (const file of files) {
              if (!file.type.startsWith("image/")) {
                set.status = 400;
                return {
                  success: false,
                  message: `File ${file.name} is not a valid image type.`,
                };
              }

              const uniqueFileName = `${crypto.randomUUID()}-${file.name}`;
              const bucketPath = `uploads/${params.id}/${uniqueFileName}`;

              const { data: storageData, error: storageError } =
                await supabase.storage.from("images").upload(bucketPath, file, {
                  contentType: file.type,
                  upsert: false,
                });

              if (storageError) {
                set.status = 500;
                return {
                  success: false,
                  message: `Failed to upload ${file.name} to storage.`,
                  error: storageError.message,
                };
              }

              const {
                data: { publicUrl },
              } = supabase.storage.from("images").getPublicUrl(bucketPath);

              const { error: dbError } = await supabase
                .from("location_images")
                .insert({
                  location_mark_id: params.id,
                  url: publicUrl,
                  path: bucketPath,
                });

              if (dbError) {
                set.status = 500;
                return {
                  success: false,
                  message: `Failed to save ${file.name} to database.`,
                  error: dbError.message,
                };
              }

              uploadResults.push({
                originalName: file.name,
                storagePath: storageData.path,
                publicUrl: publicUrl,
              });
            }

            return {
              success: true,
              message: `${files.length} images successfully uploaded and recorded.`,
              files: uploadResults,
            };
          },
          {
            params: t.Object({
              id: t.String({
                format: "uuid",
                description: "The unique UUID of the target location mark.",
              }),
            }),
            body: t.Object({
              images: t.Files({
                type: "image",
                description: "Image file binary array data to upload.",
              }),
            }),
            detail: {
              summary: "Upload images to a location mark",
              description:
                "Uploads binary assets directly to Supabase storage buckets and appends meta-records to the location image index table. Non-admin profiles must own the targeted location mark.",
              tags: ["Locations"],
              responses: {
                200: {
                  description: "Images successfully processed and mapped.",
                },
                400: {
                  description:
                    "Bad Request. Invalid file formatting, or target record missing.",
                },
                401: {
                  description: "Authorisation missing or completely expired.",
                },
                403: {
                  description:
                    "Forbidden. Insufficient profile clearance to modify target parent mark elements.",
                },
                500: {
                  description:
                    "Internal storage subsystem error or pipeline handling failures.",
                },
              },
            },
            response: {
              200: t.Object({
                success: t.Boolean(),
                message: t.String(),
                files: t.Array(
                  t.Object({
                    originalName: t.String(),
                    storagePath: t.String(),
                    publicUrl: t.String(),
                  }),
                ),
              }),
              400: t.Object({ success: t.Boolean(), message: t.String() }),
              401: t.Object({ error: t.String() }),
              403: t.Object({ success: t.Boolean(), message: t.String() }),
              500: t.Object({
                success: t.Boolean(),
                message: t.String(),
                error: t.Optional(t.String()),
              }),
            },
          },
        )

        // -------------------- GET IMAGES -------------------- //
        .get(
          "/image/:id",
          async ({ params, user, set }) => {
            if (!user) {
              set.status = 401;
              return {
                success: false,
                message: "Unauthorized: Missing user token",
              };
            }

            const { data: existingRecord, error: fetchError } = await supabase
              .from("location_marks")
              .select("user_id")
              .eq("id", params.id)
              .single();

            if (fetchError) {
              set.status = 400;
              return {
                success: false,
                message:
                  fetchError.message ||
                  "Failed to locate parent location mark record for image retrieval",
              };
            }

            if (user.role !== "admin" && existingRecord.user_id !== user.id) {
              set.status = 403;
              return {
                success: false,
                message:
                  "Forbidden: You do not have permission to view images for this location mark",
              };
            }

            const { data: images, error: dbError } = await supabase
              .from("location_images")
              .select("id, url, path, created_at")
              .eq("location_mark_id", params.id);

            if (dbError) {
              set.status = 500;
              return {
                success: false,
                message: `Failed to retrieve images for ID ${params.id}.`,
                error: dbError.message,
              };
            }

            return {
              success: true,
              message: `Successfully retrieved ${images.length} image(s).`,
              images: images,
            };
          },
          {
            params: t.Object({
              id: t.String({
                format: "uuid",
                description: "The unique UUID of the target location mark.",
              }),
            }),
            detail: {
              summary: "Retrieve images for a location mark",
              description:
                "Fetches metadata objects and secure public links of images grouped inside a specified location entry record. Requires explicit resource mapping permissions.",
              tags: ["Locations"],
              responses: {
                200: {
                  description: "Image collection dataset queried successfully.",
                },
                400: {
                  description:
                    "Invalid UUID string construction format or source data error.",
                },
                401: {
                  description: "Authorisation missing or fully rejected.",
                },
                403: {
                  description:
                    "Forbidden. Profiling constraints block access to requested parent target asset indexes.",
                },
                500: { description: "Database engine query processing fault." },
              },
            },
            response: {
              200: t.Object({
                success: t.Boolean(),
                message: t.String(),
                images: t.Array(
                  t.Object({
                    id: t.Any(),
                    url: t.String(),
                    path: t.String({
                      description:
                        "The distinct bucket storage relative file path pathing pointer.",
                    }),
                    created_at: t.Optional(t.Any()),
                  }),
                ),
              }),
              400: t.Object({ success: t.Boolean(), message: t.String() }),
              401: t.Object({ error: t.String() }),
              403: t.Object({ success: t.Boolean(), message: t.String() }),
              500: t.Object({
                success: t.Boolean(),
                message: t.String(),
                error: t.Optional(t.String()),
              }),
            },
          },
        )

        // -------------------- DELETE IMAGE -------------------- //
        .delete(
          "/image/:id",
          async ({ params, user, set }) => {
            if (!user) {
              set.status = 401;
              return {
                success: false,
                message: "Unauthorized: Missing user token",
              };
            }

            const { data: imageRecord, error: imageError } = await supabase
              .from("location_images")
              .select("id, location_mark_id, path")
              .eq("id", params.id)
              .single();

            if (imageError || !imageRecord) {
              set.status = 400;
              return {
                success: false,
                message: imageError?.message || "Failed to locate image record",
              };
            }

            const { data: locationRecord, error: locationError } =
              await supabase
                .from("location_marks")
                .select("user_id")
                .eq("id", imageRecord.location_mark_id)
                .single();

            if (locationError || !locationRecord) {
              set.status = 400;
              return {
                success: false,
                message:
                  locationError?.message ||
                  "Failed to verify parent location ownership for this image",
              };
            }

            if (user.role !== "admin" && locationRecord.user_id !== user.id) {
              set.status = 403;
              return {
                success: false,
                message:
                  "Forbidden: You do not have permission to delete this image",
              };
            }

            if (imageRecord.path) {
              const { error: storageError } = await supabase.storage
                .from("images")
                .remove([imageRecord.path]);

              if (storageError) {
                set.status = 500;
                return {
                  success: false,
                  message: "Failed to remove asset file from storage bucket",
                  error: storageError.message,
                };
              }
            }

            const { error: dbDeleteError } = await supabase
              .from("location_images")
              .delete()
              .eq("id", params.id);

            if (dbDeleteError) {
              set.status = 500;
              return {
                success: false,
                message:
                  "Failed to delete image record entry from database index",
                error: dbDeleteError.message,
              };
            }

            return {
              success: true,
              message: "Image asset and database record successfully deleted",
            };
          },
          {
            params: t.Object({
              id: t.String({
                description:
                  "The unique UUID of the specific database image index row to remove.",
              }),
            }),
            detail: {
              summary: "Delete a specific location image",
              description:
                "Permanently purges a specific image asset from the object storage bucket and its tracking meta-row out of the database index. Standard accounts must own the associated location mark to execute this execution path.",
              tags: ["Locations"],
              responses: {
                200: {
                  description:
                    "Image file and link table index elements successfully cleared.",
                },
                400: {
                  description:
                    "Bad Request. Target file or parent validation components not found.",
                },
                401: {
                  description: "Authorisation missing or fully rejected.",
                },
                403: {
                  description:
                    "Forbidden. Profiling constraints block deletion access on target asset indexes.",
                },
                500: {
                  description:
                    "Storage cluster file unlink error or engine database fault.",
                },
              },
            },
            response: {
              200: t.Object({
                success: t.Boolean(),
                message: t.String(),
              }),
              400: t.Object({ success: t.Boolean(), message: t.String() }),
              401: t.Object({ error: t.String() }),
              403: t.Object({ success: t.Boolean(), message: t.String() }),
              500: t.Object({
                success: t.Boolean(),
                message: t.String(),
                error: t.Optional(t.String()),
              }),
            },
          },
        ),
  );
