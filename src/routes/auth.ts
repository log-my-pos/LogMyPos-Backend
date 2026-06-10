// ------------------------------------------------------ //
// ------------------------ AUTH ------------------------ //
// ------------------------------------------------------ //

import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { supabase } from "../utils/supabase";

export const authRoutes = new Elysia({ prefix: "/auth" })
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET!,
      exp: "7d",
    }),
  )
  .post("/register", async ({ body, jwt, set }) => {
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
  }, {
    body: t.Object({
        email: t.String({ format: "email" }),
        password: t.String({ minLength: 6 }),
        username: t.String({ minLength: 2, maxLength: 100 }),
    })
  })
  .post("/login", async ({ body, jwt, set}) => {
    const { identifier, password } = body;

    const { data: user, error} = await supabase
      .from("users")
      .select("id, email, hashed_password, role, username")
      .or(`email.eq.${identifier},username.eq.${identifier}`)
      .maybeSingle();

      if (error || !user) {
        set.status = 401;
        return { error: "Invalid credentials" };
      }

      const isPasswordValid = await Bun.password.verify(password, user.hashed_password);

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
        }
      }
  }, {
    body: t.Object({
        identifier: t.String(),
        password: t.String({ minLength: 6 }),
    })
  })