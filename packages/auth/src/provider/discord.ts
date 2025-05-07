import { type Result, safe, safeFetch } from "@rectangular-labs/result";
import type { UserSubject } from "../subject";

interface DiscordApiResponse {
  id: string;
  username: string;
  global_name?: string | null;
  email?: string | null;
  avatar?: string | null;
}

export async function getDiscordUser(
  accessToken: string,
): Promise<Result<UserSubject, Error>> {
  // Use safeFetch for the initial call
  const responseResult = await safeFetch("https://discord.com/api/users/@me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!responseResult.ok) {
    return responseResult;
  }

  const response = responseResult.value;

  const userResult = await safe(
    () => response.json() as Promise<DiscordApiResponse>,
  );

  if (!userResult.ok) {
    return userResult;
  }

  const user = userResult.value;
  return {
    ok: true,
    value: {
      // Prefix the ID with the provider name
      id: `discord_${user.id}`,
      name: user.global_name || user.username,
      email: user.email ?? null,
      image: user.avatar
        ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
        : null,
    },
  };
}
