import { Hono } from "hono";
import { authClient, verifySafe } from "../../../lib/auth/client";
import { authMiddleware } from "../../../lib/auth/middleware";
import { deleteSession, setSession } from "../../../lib/auth/session";
import { env } from "../../../lib/env";
import type { HonoEnv } from "../../../lib/hono";

export const authRouter = new Hono<HonoEnv>()
  .basePath("/api/auth")
  .get("/me", authMiddleware, (c) => {
    const userSubject = c.get("userSubject");
    console.log("me", { userSubject });

    return c.json({ userSubject });
  })
  .get("/authorize", async (c) => {
    const callbackUrl = `${env().VITE_APP_URL}/api/auth/callback`;
    const { url: redirectUrl } = await authClient().authorize(
      callbackUrl,
      "code",
    );
    return c.redirect(redirectUrl, 302);
  })
  .get("/callback", async (c) => {
    const pathname = new URL(c.req.url).pathname;
    const code = c.req.query("code");
    if (!code) throw new Error("Missing code");
    const exchanged = await authClient().exchange(
      code,
      `${env().VITE_APP_URL}${pathname}`,
    );
    if (exchanged.err)
      return new Response(exchanged.err.toString(), {
        status: 400,
      });
    setSession(exchanged.tokens.access, exchanged.tokens.refresh);

    const verified = await verifySafe({
      access: exchanged.tokens.access,
      refresh: exchanged.tokens.refresh,
    });
    if (!verified.ok) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    return c.redirect(`${env().VITE_APP_URL}`, 302);
  })
  .post("/logout", authMiddleware, (c) => {
    const deleted = deleteSession();
    console.log("deleted", deleted);
    return c.json({ message: deleted ? "OK" : "No Session" }, 200);
  });
