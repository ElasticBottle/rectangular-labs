import { safe } from "@rectangular-labs/result";
import { backend } from "./backend";

export const getSession = async () => {
  const response = await safe(() => backend.api.auth.me.$get());
  if (!response.ok || !response.value.ok) {
    return { user: null };
  }
  const session = await response.value.json();
  return { user: session.userSubject };
};

export const authorizeUrl = backend.api.auth.authorize.$url().href;
