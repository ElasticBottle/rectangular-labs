import { type Result, safe, safeFetch } from "@rectangular-labs/result";
import type { UserSubject } from "../subject";

interface GithubApiResponse {
  id: number;
  login: string;
  name?: string | null;
  email?: string | null;
  avatar_url?: string;
}

interface GithubEmailResponse {
  email: string;
  primary: boolean;
  verified: boolean;
  visibility: string | null;
}

async function getGithubEmail(
  user: GithubApiResponse,
  accessToken: string,
): Promise<string | null> {
  if (user.email) {
    return user.email;
  }
  const emailsResponseResult = await safeFetch(
    "https://api.github.com/user/emails",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );
  if (!emailsResponseResult.ok) {
    return null;
  }

  const emailsResult = await safe(
    () => emailsResponseResult.value.json() as Promise<GithubEmailResponse[]>,
  );
  if (!emailsResult.ok) {
    return null;
  }
  const primaryEmail = emailsResult.value.find((e) => e.primary && e.verified);
  return primaryEmail?.email ?? null;
}

export async function getGithubUser(
  accessToken: string,
): Promise<Result<UserSubject, Error>> {
  const userResponseResult = await safeFetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!userResponseResult.ok) {
    return userResponseResult;
  }

  const userResponse = userResponseResult.value;

  const userResult = await safe(
    () => userResponse.json() as Promise<GithubApiResponse>,
  );
  if (!userResult.ok) {
    return userResult;
  }
  const user = userResult.value;
  const email = await getGithubEmail(user, accessToken);

  return {
    ok: true,
    value: {
      id: `github_${String(user.id)}`,
      name: user.name || user.login,
      email,
      image: user.avatar_url ?? null,
    },
  };
}
