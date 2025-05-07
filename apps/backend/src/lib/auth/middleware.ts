import type { UserSubject } from "@rectangular-labs/auth/subject";
import { getCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";
import { verifySafe } from "./client";

export const authMiddleware = createMiddleware<{
  Variables: {
    userSubject: UserSubject;
  };
}>(async (c, next) => {
  const access = getCookie(c, "access_token");
  const refresh = getCookie(c, "refresh_token");
  if (!access || !refresh) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const verified = await verifySafe({ access, refresh });
  if (!verified.ok) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  c.set("userSubject", verified.value);

  return await next();
});
