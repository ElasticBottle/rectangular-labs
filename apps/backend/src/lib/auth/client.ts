import { createClient } from "@rectangular-labs/auth/client";
import { type UserSubject, subjects } from "@rectangular-labs/auth/subject";
import { type Result, safe } from "@rectangular-labs/result";
import { env } from "../env";
import { setSession } from "./session";

export const authClient = () => {
  return createClient({
    clientID: "rectangular-labs-backend",
    issuer: env().VITE_AUTH_URL,
  });
};

export async function verifySafe({
  access,
  refresh,
  autoRefresh = true,
}: {
  access: string;
  refresh: string;
  autoRefresh?: boolean;
}): Promise<Result<UserSubject, Error>> {
  const verifiedResult = await safe(() =>
    authClient().verify(subjects, access, {
      refresh,
    }),
  );
  if (!verifiedResult.ok) {
    console.error("Failed to verify", verifiedResult.error);
    return verifiedResult;
  }
  const verified = verifiedResult.value;
  if (verified.err) {
    return {
      ok: false,
      error: verified.err,
    };
  }
  if (autoRefresh && verified.tokens) {
    setSession(verified.tokens.access, verified.tokens.refresh);
  }
  return { ok: true, value: verified.subject.properties };
}
