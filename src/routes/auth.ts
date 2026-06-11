// ------------------------------------------------------ //
// ------------------------ AUTH ------------------------ //
// ------------------------------------------------------ //

import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { supabase } from "../utils/supabase";

export const authRoutes = new Elysia({
  prefix: "/auth",
  detail: { tags: ["Auth"] },
})
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET!,
      exp: "7d",
    }),
  )

  // ---------------------- REGISTER ---------------------- //
  .post(
    "/register",
    async ({ body, jwt, set }) => {
      const { email, password, username } = body as {
        email: string;
        password: string;
        username: string;
      };

      const hashedPassword = await Bun.password.hash(password);

      const { data, error } = await supabase
        .from("users")
        .insert({
          email,
          username,
          role: "user",
          hashed_password: hashedPassword,
        })
        .select("id, email, username, role")
        .single();

      if (error || !data) {
        set.status = 400;
        return { error: "Registration failed" };
      }

      const token = await jwt.sign({
        id: data.id,
        username: data.username,
        email: data.email,
        role: data.role,
      });

      set.status = 201;
      return { message: "Registration successful", token, user: data };
    },
    {
      body: t.Object({
        email: t.String({
          format: "email",
          description: "A unique, valid email address.",
          default: "user@example.com",
        }),
        password: t.String({
          minLength: 6,
          description:
            "The account password. Must be at least 6 characters long.",
          default: "supersecret123",
        }),
        username: t.String({
          minLength: 2,
          maxLength: 100,
          description: "A unique display name.",
          default: "johndoe",
        }),
      }),

      detail: {
        summary: "Register a new user",
        description:
          "Creates a new user profile in the database with a hashed password, assigns the default `user` role, and generates an initial 7-day JWT authentication token.",
        tags: ["Auth"],
        responses: {
          201: {
            description:
              "User account successfully created. Returns the new user object and a JWT token.",
          },
          400: {
            description:
              "Registration failed due to invalid input data or conflicting unique fields (e.g., email/username already taken).",
          },
        },
      },

      response: {
        201: t.Object({
          message: t.String(),
          token: t.String(),
          user: t.Object({
            id: t.String({ format: "uuid" }),
            email: t.String(),
            username: t.String(),
            role: t.String(),
          }),
        }),
        400: t.Object({
          error: t.String(),
        }),
      },
    },
  )

  // ------------------------ LOGIN ----------------------- //
  .post(
    "/login",
    async ({ body, jwt, set }) => {
      const { identifier, password } = body;

      const { data: user, error } = await supabase
        .from("users")
        .select("id, email, hashed_password, role, username")
        .or(`email.eq.${identifier},username.eq.${identifier}`)
        .maybeSingle();

      if (error || !user) {
        set.status = 401;
        return { error: "Invalid credentials" };
      }

      const isPasswordValid = await Bun.password.verify(
        password,
        user.hashed_password,
      );

      if (!isPasswordValid) {
        set.status = 401;
        return { error: "Invalid credentials" };
      }

      const token = await jwt.sign({
        id: user.id,
        email: user.email,
        role: user.role,
      });

      return {
        message: "Login successful",
        token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
        },
      };
    },
    {
      body: t.Object({
        identifier: t.String({
          description:
            "Accepts either the user's unique username or registered email address.",
          default: "johndoe",
        }),
        password: t.String({
          minLength: 6,
          description: "The user's account password.",
          default: "supersecret123",
        }),
      }),

      detail: {
        summary: "Authenticate user",
        description:
          "Allows a user to log in using either their **email** or **username**. Returns a 7-day JWT token upon success.",
        tags: ["Auth"],
        responses: {
          200: {
            description:
              "Login successful. Returns a JWT token and the user's profile information.",
          },
          401: {
            description:
              "Authentication failed due to incorrect identifier or password.",
          },
        },
      },

      response: {
        200: t.Object({
          message: t.String(),
          token: t.String(),
          user: t.Object({
            id: t.String({ format: "uuid" }),
            email: t.String(),
            username: t.String(),
            role: t.String(),
          }),
        }),
        401: t.Object({
          error: t.String(),
        }),
      },
    },
  );
